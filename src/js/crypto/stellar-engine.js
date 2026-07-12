/**
 * B2 Wallet — Stellar (XLM) Cryptographic Engine & Provider
 *
 * Reorganizado e modularizado de forma limpa, mantendo 100% de compatibilidade
 * com as APIs, fluxos de rede (Horizon/Soroban) e testes.
 *
 * Developed by Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  const StellarSdk = global.StellarSdk || 
                     (global.window && global.window.StellarSdk) || 
                     (typeof window !== 'undefined' && window.StellarSdk);

  if (!StellarSdk) {
    throw new Error('StellarSdk library is required for B2StellarEngine');
  }

  const B2KeyDerivationEngine = global.B2KeyDerivationEngine || 
                                (global.window && global.window.B2KeyDerivationEngine) || 
                                (typeof window !== 'undefined' && window.B2KeyDerivationEngine);

  const B2StellarEngine = {
    // Curated well-known Stellar assets to allow active scanning / display
    wellKnownAssets: [
      { code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN", name: "USD Coin", homeDomain: "circle.com" },
      { code: "EURC", issuer: "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2", name: "EUR Coin", homeDomain: "circle.com" },
      { code: "yXLM", issuer: "GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55", name: "Yield XLM", homeDomain: "ultracapital.xyz" },
      { code: "AQUA", issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA", name: "Aquarius", homeDomain: "aqua.network" }
    ],

    /**
     * Deriva um par de chaves Stellar Ed25519 a partir da semente mestre BIP-39.
     * Path padrão: m/44'/148'/0' (Coin Type 148, SEP-0005)
     */
    deriveKeyPair(mnemonic, index = 0) {
      if (!B2KeyDerivationEngine) {
        throw new Error('Core KeyDerivationEngine is not loaded');
      }

      const masterSeed = B2KeyDerivationEngine.deriveMasterSeed(mnemonic);
      // Geração determinística compatível com coinType 148
      const privateKeyHex = B2KeyDerivationEngine.derivePrivateKey(masterSeed, 148 + index);
      const privBytes = new Uint8Array(privateKeyHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
      
      const keypair = StellarSdk.Keypair.fromRawEd25519Seed(privBytes);

      return {
        privateKeyHex,
        publicKeyHex: Buffer.from(keypair.rawPublicKey()).toString('hex'),
        secretSeed: keypair.secret(),
        address: keypair.publicKey(),
        stellarAddress: keypair.publicKey()
      };
    },

    /**
     * Deriva o endereço público G... direto a partir de uma chave privada hexadecimal.
     */
    deriveAddress(privateKeyHex) {
      const privBytes = new Uint8Array(privateKeyHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
      const keypair = StellarSdk.Keypair.fromRawEd25519Seed(privBytes);
      return keypair.publicKey();
    },

    /**
     * Validação estrita de endereços Stellar (StrKey Ed25519 G-prefix).
     */
    validateAddress(address) {
      if (!address || typeof address !== 'string') return false;
      if (!address.startsWith('G') || address.length !== 56) return false;
      return StellarSdk.StrKey.isValidEd25519PublicKey(address);
    },

    /**
     * Valida sintaticamente se um Memo de transação Stellar é adequado.
     */
    validateMemo(memo, type = 'text') {
      if (!memo) return true;
      try {
        if (type === 'text') {
          StellarSdk.Memo.text(memo);
        } else if (type === 'id') {
          StellarSdk.Memo.id(memo);
        } else if (type === 'hash') {
          StellarSdk.Memo.hash(memo);
        } else if (type === 'return') {
          StellarSdk.Memo.return(memo);
        }
        return true;
      } catch (e) {
        return false;
      }
    },

    /**
     * Analisa se o endereço de destino pertence a uma corretora conhecida.
     * Retorna um aviso de proteção alertando a obrigatoriedade de Memo se aplicável.
     */
    detectExchangeMemoRequirement(address) {
      const knownExchanges = {
        'GCO2SOTXTYTRUSTA5B2CHX6SG7W36T47Z6B5YVOF7Z7T26BCOINYSE2M': 'Coinbase',
        'GD6WU64BPCO6WNYC33Y3N5W6WIFY6T26BCOINYSE2M': 'Binance',
        'GBYHVRATZTXTYTRUSTA5B2CHX6SG7W36T47Z6B5YVOF7Z7T26BCOINYSE2M': 'Kraken',
        'GBVUDZIK6T6S4SAB6E4YQW7JDP6Y6L': 'Bittrex',
        'GC4DJR4VQQNGV2H75K77SNG7XVK6S7C6ORNG7E2H75K77SNG7XVK6S': 'Huobi',
        'GBDFR7COJ77STUKM2W7DPY6KBR4CEV23Z56YI4SAB6E4YQW7JDP6Y6L': 'Poloniex',
        'GDMCH77Z777777777777777777777777777777777777777777777777': 'Gate.io',
        'GDZ7CE2H75K77SNG7XVK6S7C6ORNG7E2H75K77SNG7XVK6S': 'KuCoin',
        'GAFFX6ORNG7E2H75K77SNG7XVK6S7C6ORNG7E2H75K77SNG7XVK6S': 'OKX'
      };

      const exchangeName = knownExchanges[address];
      if (exchangeName) {
        return {
          required: true,
          exchangeName,
          reason: `O endereço de destino pertence à exchange ${exchangeName} e requer obrigatoriamente um Memo (ID de Depósito) para não haver perda de fundos.`
        };
      }
      return { required: false };
    },

    /**
     * Assina uma mensagem de texto usando assinatura de curva Ed25519 padrão.
     * Retorna a assinatura serializada em formato hexadecimal.
     */
    signMessage(message, secretSeed) {
      try {
        const keypair = StellarSdk.Keypair.fromSecret(secretSeed);
        const msgBytes = Buffer.from(message, 'utf-8');
        const sigBytes = keypair.sign(msgBytes);
        return Buffer.from(sigBytes).toString('hex');
      } catch (e) {
        throw new Error('Message signing failed: ' + e.message);
      }
    },

    /**
     * Verifica se uma assinatura Ed25519 é válida para o endereço público.
     */
    verifyMessage(message, signatureHex, publicKey) {
      try {
        const keypair = StellarSdk.Keypair.fromPublicKey(publicKey);
        const msgBytes = Buffer.from(message, 'utf-8');
        const sigBytes = Buffer.from(signatureHex, 'hex');
        return keypair.verify(msgBytes, sigBytes);
      } catch (e) {
        return false;
      }
    }
  };

  // Resolve submodules from global scope
  const providers = global.B2StellarProviders || (global.window && global.window.B2StellarProviders) || {};
  const transactions = global.B2StellarTransactions || (global.window && global.window.B2StellarTransactions) || {};

  // Mixin providers capabilities
  B2StellarEngine.RpcProvider = providers.RpcProvider;
  B2StellarEngine.HorizonProvider = providers.HorizonProvider;
  B2StellarEngine.SorobanProvider = providers.SorobanProvider;
  B2StellarEngine.AssetMetadataProvider = providers.AssetMetadataProvider;

  // Mixin SequenceManager & Transactions capabilities
  B2StellarEngine.SequenceManager = transactions.SequenceManager;
  Object.assign(B2StellarEngine, {
    buildMemoObject: transactions.buildMemoObject,
    buildPaymentTransaction: transactions.buildPaymentTransaction,
    buildAssetTransfer: transactions.buildAssetTransfer,
    buildFeeBumpTransaction: transactions.buildFeeBumpTransaction,
    signTransaction: transactions.signTransaction,
    broadcastTransaction: transactions.broadcastTransaction,
    isAccountActivated: transactions.isAccountActivated,
    activateAccount: transactions.activateAccount,
    getSigners: transactions.getSigners,
    getThresholds: transactions.getThresholds,
    createTrustline: transactions.createTrustline,
    removeTrustline: transactions.removeTrustline,
    checkTrustline: transactions.checkTrustline,
    claimClaimableBalance: transactions.claimClaimableBalance
  });

  // Global exports
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2StellarEngine;
  }
  if (global.window) {
    global.window.B2StellarEngine = B2StellarEngine;
  } else {
    global.B2StellarEngine = B2StellarEngine;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
