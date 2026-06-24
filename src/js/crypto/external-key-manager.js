/**
 * B2 Wallet — External Key Manager
 *
 * Gerencia o ciclo de vida seguro de chaves privadas importadas de carteiras externas
 * (carteiras padrão EVM, Solana, etc.).
 *
 * Fluxo de segurança:
 *  1. Usuário cola a private key no modal de importação.
 *  2. Antes de salvar, a chave é criptografada com AES-256-GCM usando o PIN/senha do usuário.
 *  3. O ciphertext é salvo em localStorage — NUNCA a chave em plain text.
 *  4. Na sessão ativa, a chave descriptografada fica apenas em memória (sessionStorage).
 *  5. Quando o usuário troca de conta ou recarrega, a chave é descriptografada novamente com o PIN.
 *
 * Developed by Diego Oris / Better2Better — B2 Wallet v2.
 */
; (function (global) {
  'use strict';

  const STORAGE_PREFIX = 'b2_ext_key_';

  const B2ExternalKeyManager = {

    /**
     * Criptografa e persiste a chave privada de uma conta externa.
     * @param {number} accountIndex - Índice da conta na lista de contas.
     * @param {string} privateKeyRaw - Chave privada em plain text (hex 0x..., WIF, ou seed).
     * @param {string} password - Senha/PIN do usuário atual.
     * @returns {Promise<object>} - Payload criptografado salvo.
     */
    async encryptAndStore(accountIndex, privateKeyRaw, password) {
      if (!window.B2PlatformSecurity) throw new Error('B2PlatformSecurity não carregado');
      const encrypted = await window.B2PlatformSecurity.encryptData(privateKeyRaw.trim(), password);
      const storageKey = `${STORAGE_PREFIX}${accountIndex}`;
      localStorage.setItem(storageKey, JSON.stringify(encrypted));
      return encrypted;
    },

    /**
     * Descriptografa a chave privada de uma conta externa em memória (nunca persiste plain text).
     * @param {number} accountIndex - Índice da conta.
     * @param {string} password - Senha/PIN do usuário.
     * @returns {Promise<string>} - Chave privada em plain text.
     */
    async decryptKey(accountIndex, password) {
      if (!window.B2PlatformSecurity) throw new Error('B2PlatformSecurity não carregado');
      const storageKey = `${STORAGE_PREFIX}${accountIndex}`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) throw new Error(`Nenhuma chave externa armazenada para a conta ${accountIndex}`);
      const payload = JSON.parse(raw);
      return await window.B2PlatformSecurity.decryptData(payload, password);
    },

    /**
     * Remove a chave criptografada do localStorage ao remover uma conta.
     * @param {number} accountIndex
     */
    removeKey(accountIndex) {
      localStorage.removeItem(`${STORAGE_PREFIX}${accountIndex}`);
    },

    /**
     * Verifica se uma conta tem uma chave externa armazenada.
     * @param {number} accountIndex
     * @returns {boolean}
     */
    hasKey(accountIndex) {
      return !!localStorage.getItem(`${STORAGE_PREFIX}${accountIndex}`);
    },

    /**
     * Deriva o endereço EVM a partir de uma chave privada hex ou seed EVM (padrão BIP-44).
     * @param {string} privateKeyOrSeed - Chave privada 0x... ou seed phrase.
     * @param {string} sourceChain - 'EVM'|'Solana'|'Bitcoin'|'Waves'|'Tron'|'Other'
     * @returns {string|null} - Endereço derivado ou null se não suportado.
     */
    deriveAddressFromKey(privateKeyOrSeed, sourceChain = 'EVM') {
      const input = (privateKeyOrSeed || '').trim();

      if (sourceChain === 'EVM' || sourceChain === 'Other') {
        const ethLib = global.ethers || (global.window && global.window.ethers);
        if (!ethLib) return null;

        try {
          // Tenta como private key hex direto (0x... ou 64 hex chars)
          const isPrivKey = /^(0x)?[a-fA-F0-9]{64}$/.test(input);
          if (isPrivKey) {
            const cleanKey = input.startsWith('0x') ? input : '0x' + input;
            const wallet = new ethLib.Wallet(cleanKey);
            return wallet.address; // EIP-55 checksum address — mesmo de carteiras padrão
          }

          // Tenta como seed BIP-39 → BIP-44 path m/44'/60'/0'/0/0 (padrão da rede)
          const wordCount = input.split(/\s+/).filter(Boolean).length;
          if (wordCount === 12 || wordCount === 24) {
            const root = ethLib.HDNodeWallet.fromPhrase(input, '', 'm');
            const node = root.derivePath("m/44'/60'/0'/0/0");
            return node.address;
          }
        } catch (e) {
          console.error('[ExternalKeyManager] Erro ao derivar endereço EVM:', e);
        }
        return null;
      }

      if (sourceChain === 'Tron') {
        // Tron usa secp256k1 igual ao EVM, mas com prefixo 0x41 no endereço
        // B2TronEngine já faz a derivação correta
        const tronEngine = global.B2TronEngine || (global.window && global.window.B2TronEngine);
        if (tronEngine && tronEngine.deriveTronKeyPair) {
          try {
            const kp = tronEngine.deriveTronKeyPair(input, 0);
            return kp ? kp.address : null;
          } catch (_) { return null; }
        }
        return null;
      }

      if (sourceChain === 'Solana') {
        const solBroadcaster = global.B2SolanaBroadcaster || (global.window && global.window.B2SolanaBroadcaster);
        if (solBroadcaster && solBroadcaster.deriveSolanaKeyPair) {
          try {
            const kp = solBroadcaster.deriveSolanaKeyPair(input);
            return kp ? kp.address : null;
          } catch (_) { return null; }
        }
        return null;
      }

      if (sourceChain === 'Waves') {
        const wavesBroadcaster = global.B2WavesBroadcaster || (global.window && global.window.B2WavesBroadcaster);
        if (wavesBroadcaster && wavesBroadcaster.deriveWavesKeyPair) {
          try {
            const { publicKey } = wavesBroadcaster.deriveWavesKeyPair(input, 0);
            return wavesBroadcaster.deriveWavesAddress(publicKey, 87); // 87 = mainnet
          } catch (_) { return null; }
        }
        return null;
      }

      if (sourceChain === 'Bitcoin') {
        const btcEngine = global.B2BitcoinEngine || (global.window && global.window.B2BitcoinEngine);
        if (btcEngine) {
          try {
            // Private key WIF ou seed → pega endereço nativo SegWit
            const masterSeed = global.B2KeyDerivationEngine
              ? global.B2KeyDerivationEngine.deriveMasterSeed(input)
              : null;
            if (masterSeed) {
              const privKey = global.B2KeyDerivationEngine.derivePrivateKey(masterSeed, 0);
              return btcEngine.deriveAddress(privKey, 'native');
            }
          } catch (_) { return null; }
        }
        return null;
      }

      return null;
    },

    /**
     * Retorna a private key RAW (hex sem 0x) para uso no send flow dado uma chave decriptografada.
     * Normaliza formatos: seed BIP-39 → deriva private key EVM; hex direto → limpa prefixo.
     * @param {string} decryptedKey - Chave decriptografada (pode ser seed ou privkey hex)
     * @param {string} sourceChain
     * @returns {string} - Private key hex limpa (sem 0x) para uso no broadcaster.
     */
    normalizePrivateKeyHex(decryptedKey, sourceChain = 'EVM') {
      const input = (decryptedKey || '').trim();
      const ethLib = global.ethers || (global.window && global.window.ethers);

      if (sourceChain === 'EVM' || sourceChain === 'Other') {
        // É uma private key hex direta
        const isPrivKey = /^(0x)?[a-fA-F0-9]{64}$/.test(input);
        if (isPrivKey) return input.replace(/^0x/i, '');

        // É uma seed BIP-39 → deriva private key via BIP-44 m/44'/60'/0'/0/0
        if (ethLib) {
          try {
            const root = ethLib.HDNodeWallet.fromPhrase(input, '', 'm');
            const node = root.derivePath("m/44'/60'/0'/0/0");
            return node.privateKey.replace(/^0x/i, '');
          } catch (_) { }
        }
      }

      // Para outras chains: retorna a chave como está (o broadcaster respectivo sabe lidar)
      return input;
    }
  };

  // Export global
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2ExternalKeyManager;
  }
  if (global.window) {
    global.window.B2ExternalKeyManager = B2ExternalKeyManager;
  } else {
    global.B2ExternalKeyManager = B2ExternalKeyManager;
  }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);