/**
 * B2 Wallet — Solana Transaction Broadcaster & Key Derivation
 *
 * Lida com a derivação de chaves ed25519 e assinatura/broadcast de transações
 * reais nas redes Solana (nativa e tokens SPL) utilizando a biblioteca Solana Web3.js.
 *
 * Desenvolvido por Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  const B2SolanaBroadcaster = {
    /**
     * Deriva a chave pública (endereço) Solana base58 e a chave secreta a partir do mnemônico.
     *
     * @param {string} mnemonic - Frase mnemônica BIP-39.
     * @returns {object} - Contém o endereço (publicKey base58), a chave pública e a secretKey (Uint8Array).
     */
    deriveSolanaKeyPair(mnemonic, index = 0) {
      if (!global.SolanaDerive || !global.solanaWeb3) {
        throw new Error('Solana integration libraries are not loaded');
      }
      const seed = global.SolanaDerive.mnemonicToSeedSync(mnemonic);
      const seedHex = Array.from(seed).map(b => b.toString(16).padStart(2, '0')).join('');
      const derived = global.SolanaDerive.derivePath(`m/44'/501'/${index}'/0'`, seedHex);
      const keypair = global.solanaWeb3.Keypair.fromSeed(derived.key);
      return {
        address: keypair.publicKey.toBase58(),
        publicKey: keypair.publicKey,
        secretKey: keypair.secretKey
      };
    },

    /**
     * Assina e transmite uma transação de transferência na blockchain Solana (nativa ou token SPL).
     *
     * @param {string} mnemonic - Frase mnemônica BIP-39 da carteira.
     * @param {string} nodeUrl - URL RPC do nó da Solana.
     * @param {string} toAddressStr - Endereço do destinatário em formato base58.
     * @param {number|string} amount - Quantidade de SOL ou de tokens SPL a enviar.
     * @param {string} [tokenMintAddressStr] - Endereço do contrato do token (SPL) (nulo para SOL nativo).
     * @returns {Promise<string>} - Retorna o hash/assinatura da transação transmitida com sucesso.
     */
    async sendSolanaTransfer(mnemonic, nodeUrl, toAddressStr, amount, tokenMintAddressStr = null, index = 0) {
      if (!global.solanaWeb3) {
        throw new Error('Solana Web3 library is not loaded');
      }

      const connection = new global.solanaWeb3.Connection(nodeUrl, 'confirmed');
      const keypairData = this.deriveSolanaKeyPair(mnemonic, index);
      const senderKeypair = global.solanaWeb3.Keypair.fromSecretKey(keypairData.secretKey);
      
      const fromPubkey = senderKeypair.publicKey;
      const toPubkey = new global.solanaWeb3.PublicKey(toAddressStr);

      const transaction = new global.solanaWeb3.Transaction();

      if (tokenMintAddressStr) {
        // --- Transferência de Token SPL ---
        const mintPubkey = new global.solanaWeb3.PublicKey(tokenMintAddressStr);

        // Constantes do protocolo Solana
        const TOKEN_PROGRAM_ID = new global.solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        const ASSOCIATED_TOKEN_PROGRAM_ID = new global.solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

        // Helper para derivar endereço da conta token associada (ATA)
        const getATA = (owner) => {
          return global.solanaWeb3.PublicKey.findProgramAddressSync(
            [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
            ASSOCIATED_TOKEN_PROGRAM_ID
          )[0];
        };

        const sourceATA = getATA(fromPubkey);
        const destinationATA = getATA(toPubkey);

        // Verifica se a ATA de destino já existe. Se não existir, adiciona a instrução para criá-la
        const destAccountInfo = await connection.getAccountInfo(destinationATA);
        if (!destAccountInfo) {
          console.log('[Solana Broadcaster] Conta associada de destino não existe. Criando ATA:', destinationATA.toBase58());
          transaction.add(
            new global.solanaWeb3.TransactionInstruction({
              keys: [
                { pubkey: fromPubkey, isSigner: true, isWritable: true }, // payer
                { pubkey: destinationATA, isSigner: false, isWritable: true }, // associatedAddress
                { pubkey: toPubkey, isSigner: false, isWritable: false }, // walletAddress
                { pubkey: mintPubkey, isSigner: false, isWritable: false }, // tokenMint
                { pubkey: global.solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false }, // systemProgram
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // tokenProgram
              ],
              programId: ASSOCIATED_TOKEN_PROGRAM_ID,
              data: new Uint8Array([0]) // Instruction index 0 for Create
            })
          );
        }

        // Determina decimais do token SPL (padrão 9)
        let decimals = 9;
        try {
          const tokenMintInfo = await connection.getParsedAccountInfo(mintPubkey);
          if (tokenMintInfo && tokenMintInfo.value && tokenMintInfo.value.data) {
            decimals = tokenMintInfo.value.data.parsed.info.decimals || 9;
          }
        } catch (e) {
          console.warn('[Solana Broadcaster] Erro ao consultar decimais do token mint via RPC, assumindo 9:', e);
        }

        // Calcula quantidade com decimais
        const rawAmount = BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals)));

        // Helper para serializar u64 em little-endian
        const encodeU64 = (val) => {
          const buf = new Uint8Array(8);
          const big = BigInt(val);
          for (let i = 0; i < 8; i++) {
            buf[i] = Number((big >> BigInt(i * 8)) & 0xffn);
          }
          return buf;
        };

        const instructionData = new Uint8Array(9);
        instructionData[0] = 3; // Instruction index 3 for Transfer
        instructionData.set(encodeU64(rawAmount), 1);

        transaction.add(
          new global.solanaWeb3.TransactionInstruction({
            keys: [
              { pubkey: sourceATA, isSigner: false, isWritable: true },
              { pubkey: destinationATA, isSigner: false, isWritable: true },
              { pubkey: fromPubkey, isSigner: true, isWritable: false }
            ],
            programId: TOKEN_PROGRAM_ID,
            data: instructionData
          })
        );
      } else {
        // --- Transferência de SOL Nativo ---
        const lamports = Math.round(parseFloat(amount) * 1e9);
        transaction.add(
          global.solanaWeb3.SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports
          })
        );
      }

      // Obtém o blockhash mais recente para assinar a transação
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      // Assina a transação
      transaction.sign(senderKeypair);

      const rawTx = transaction.serialize();
      const signatureUint8Array = transaction.signatures[0].signature;
      const b2Engine = global.B2KeyDerivationEngine || (global.window && global.window.B2KeyDerivationEngine);
      const txSignature = b2Engine ? b2Engine.encodeBase58(signatureUint8Array) : 'temp_' + Date.now();

      return {
        rawTx,
        txSignature,
        transaction
      };
    },

    /**
     * Transmite uma transação do Solana assinada (raw bytes) via JSON-RPC.
     */
    async broadcastSolanaTransaction(nodeUrl, rawTx) {
      if (!global.solanaWeb3) {
        throw new Error('Solana Web3 library is not loaded');
      }
      const connection = new global.solanaWeb3.Connection(nodeUrl, 'confirmed');
      console.log('[Solana Broadcaster] Transmitindo TX assinada para o nó RPC');
      const txSignature = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      console.log('[Solana Broadcaster] Transação enviada com sucesso. Assinatura:', txSignature);
      return txSignature;
    },

    /**
     * Ponto de entrada legado para manter retrocompatibilidade.
     */
    async sendSolanaTransfer(mnemonic, nodeUrl, toAddressStr, amount, tokenMintAddressStr = null, index = 0) {
      const signedData = await this.signSolanaTransfer(mnemonic, nodeUrl, toAddressStr, amount, tokenMintAddressStr, index);
      return await this.broadcastSolanaTransaction(nodeUrl, signedData.rawTx);
    }
  };

  // Exportação no escopo global (browser/node)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2SolanaBroadcaster;
  }
  if (global.window) {
    global.window.B2SolanaBroadcaster = B2SolanaBroadcaster;
  } else {
    global.B2SolanaBroadcaster = B2SolanaBroadcaster;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
