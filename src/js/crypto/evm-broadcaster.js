/**
 * B2 Wallet — EVM Blockchain Transaction Broadcaster & Address Derivation
 *
 * Lida com a derivação de chaves secp256k1 e assinatura/broadcast de transações
 * reais nas redes da família EVM (Ethereum, Polygon, AVAX, BSC, Arbitrum, Optimism, etc)
 * utilizando a biblioteca Ethers.js carregada no navegador.
 *
 * Desenvolvido por Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  const B2EVMBroadcaster = {
    /**
     * Deriva o endereço público mixed-case checksum EIP-55 a partir de uma chave privada hex.
     *
     * @param {string} privateKeyHex - Chave privada de 32 bytes em formato hex.
     * @returns {string} - Endereço público EVM correspondente.
     */
    deriveEVMAddress(privateKeyHex) {
      if (!global.ethers) {
        throw new Error('Ethers.js library is not loaded');
      }
      const cleanPrivKey = privateKeyHex.startsWith('0x') ? privateKeyHex : '0x' + privateKeyHex;
      const wallet = new global.ethers.Wallet(cleanPrivKey);
      return wallet.address;
    },

    /**
     * Assina e transmite uma transação de transferência (nativa ou token ERC-20) na blockchain EVM.
     *
     * @param {string} mnemonic - Frase mnemônica BIP-39 da carteira.
     * @param {string} nodeUrl - URL RPC do nó da blockchain ativa.
     * @param {number} chainId - ID numérico da chain.
     * @param {string} toAddress - Endereço do destinatário.
     * @param {number|string} amount - Quantidade de moedas/tokens a serem transferidos.
     * @param {string} [tokenAddress] - Endereço do contrato do token ERC-20 (nulo para transferência nativa).
     * @returns {Promise<object>} - Retorna a resposta da transação enviada (contendo hash).
     */
    async signEVMTransfer(mnemonicOrPrivateKey, nodeUrl, chainId, toAddress, amount, tokenAddress = null) {
      if (!global.ethers) {
        throw new Error('Ethers.js library is not loaded');
      }

      // 1. Inicializa o provedor e deriva a chave
      const provider = new global.ethers.JsonRpcProvider(nodeUrl);
      let wallet;

      const input = (mnemonicOrPrivateKey || '').trim();
      const isPrivateKey = input.startsWith('0x') || input.length === 64 || input.length === 66;

      if (isPrivateKey) {
        const cleanPrivKey = input.startsWith('0x') ? input : '0x' + input;
        wallet = new global.ethers.Wallet(cleanPrivKey, provider);
      } else {
        try {
          const root = global.ethers.HDNodeWallet.fromPhrase(input, "", "m");
          wallet = root.derivePath("m/44'/60'/0'/0/0").connect(provider);
        } catch (e) {
          console.warn('[EVM Broadcaster] Falha ao derivar via fromPhrase do Ethers.js, aplicando fallback do B2KeyDerivationEngine:', e);
          const b2Engine = (typeof window !== 'undefined' && window.B2KeyDerivationEngine) || 
                           (typeof global !== 'undefined' && global.B2KeyDerivationEngine) || 
                           (typeof globalThis !== 'undefined' && globalThis.B2KeyDerivationEngine);
          if (b2Engine) {
            const masterSeed = b2Engine.deriveMasterSeed(input);
            const privateKeyHex = b2Engine.derivePrivateKey(masterSeed, 60); // CoinType 60 para EVM
            const cleanPrivKey = privateKeyHex.startsWith('0x') ? privateKeyHex : '0x' + privateKeyHex;
            wallet = new global.ethers.Wallet(cleanPrivKey, provider);
          } else {
            throw e; // Sem fallback disponível
          }
        }
      }

      let txRequest;

      // 2. Constrói o corpo da transação (Nativa vs Token)
      if (tokenAddress) {
        // Obter decimais do token do contrato (caso disponível)
        let decimals = 18;
        try {
          const contract = new global.ethers.Contract(tokenAddress, [
            "function decimals() view returns (uint8)"
          ], provider);
          decimals = await contract.decimals();
        } catch (e) {
          console.warn('[EVM Broadcaster] Não foi possível consultar os decimais do token via RPC, assumindo 18:', e);
        }

        const parsedAmount = global.ethers.parseUnits(amount.toString(), decimals);
        const erc20Interface = new global.ethers.Interface([
          "function transfer(address to, uint256 value) returns (bool)"
        ]);
        const data = erc20Interface.encodeFunctionData("transfer", [toAddress, parsedAmount]);

        txRequest = {
          to: tokenAddress,
          value: 0n,
          data: data
        };
      } else {
        txRequest = {
          to: toAddress,
          value: global.ethers.parseEther(amount.toString())
        };
      }

      // 3. Preenche Nonce, ChainId e estimativas de Gas/Taxa
      const senderAddress = wallet.address;
      txRequest.nonce = await provider.getTransactionCount(senderAddress, "pending");
      
      let finalChainId = chainId;
      try {
        const network = await provider.getNetwork();
        finalChainId = Number(network.chainId);
      } catch (e) {
        console.warn('[EVM Broadcaster] Não foi possível obter o chainId do provedor, usando o valor de fallback:', e);
      }
      txRequest.chainId = finalChainId;

      // Estima limite de Gas
      try {
        txRequest.gasLimit = await provider.estimateGas({
          from: senderAddress,
          to: txRequest.to,
          value: txRequest.value,
          data: txRequest.data
        });
      } catch (e) {
        console.warn('[EVM Broadcaster] Falha ao estimar Gas, usando fallback:', e);
        txRequest.gasLimit = tokenAddress ? 100000n : 21000n;
      }

      // Verifica suporte a EIP-1559 vs Legacy Gas Price
      try {
        const feeData = await provider.getFeeData();
        if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
          txRequest.maxFeePerGas = feeData.maxFeePerGas;
          txRequest.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
          txRequest.type = 2; // EIP-1559
        } else {
          txRequest.gasPrice = feeData.gasPrice || global.ethers.parseUnits("30", "gwei");
        }
      } catch (e) {
        console.warn('[EVM Broadcaster] Erro ao obter dados de taxa do nó RPC, usando fallback de Gas Price:', e);
        txRequest.gasPrice = global.ethers.parseUnits("30", "gwei");
      }

      // 4. Assina localmente
      console.log('[EVM Broadcaster] Assinando TX offline com parâmetros:', txRequest);
      const signedTxHex = await wallet.signTransaction(txRequest);
      const txHash = global.ethers.keccak256(signedTxHex);

      return {
        signedTxHex,
        txHash,
        txRequest
      };
    },

    /**
     * Transmite uma transação assinada hex para a blockchain EVM via RPC.
     */
    async broadcastEVMTransaction(nodeUrl, signedTxHex) {
      if (!global.ethers) {
        throw new Error('Ethers.js library is not loaded');
      }
      const provider = new global.ethers.JsonRpcProvider(nodeUrl);
      console.log('[EVM Broadcaster] Transmitindo TX assinada para o nó RPC');
      const txResponse = await provider.broadcastTransaction(signedTxHex);
      console.log('[EVM Broadcaster] Resposta do broadcast:', txResponse);
      return txResponse;
    },

    /**
     * Ponto de entrada legado para manter retrocompatibilidade.
     */
    async sendEVMTransfer(mnemonicOrPrivateKey, nodeUrl, chainId, toAddress, amount, tokenAddress = null) {
      const signedData = await this.signEVMTransfer(mnemonicOrPrivateKey, nodeUrl, chainId, toAddress, amount, tokenAddress);
      return await this.broadcastEVMTransaction(nodeUrl, signedData.signedTxHex);
    }
  };

  // Exportação no escopo global (browser/node)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2EVMBroadcaster;
  }
  if (global.window) {
    global.window.B2EVMBroadcaster = B2EVMBroadcaster;
  } else {
    global.B2EVMBroadcaster = B2EVMBroadcaster;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
