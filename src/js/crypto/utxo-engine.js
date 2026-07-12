/**
 * B2 Wallet — UTXO Shared Engine & Specific Blockchain Integrations (BTC, LTC, DOGE, BCH)
 *
 * Implements concrete production-grade engines for Bitcoin, Litecoin, Dogecoin, and Bitcoin Cash,
 * subclassing the base B2UTXOEngine.
 * Zero mocks/fake data. Integrates live Mainnet API providers with automatic failovers.
 *
 * Developed by Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  const dependencyEngine = global.B2KeyDerivationEngine || 
                           (global.window && global.window.B2KeyDerivationEngine) || 
                           (typeof window !== 'undefined' && window.B2KeyDerivationEngine);
  if (dependencyEngine && !global.B2KeyDerivationEngine) {
    global.B2KeyDerivationEngine = dependencyEngine;
  }

  // Obter as assinaturas/helpers
  const sigs = global.B2UTXOSignatures || 
               (global.window && global.window.B2UTXOSignatures) || 
               (typeof window !== 'undefined' && window.B2UTXOSignatures);

  if (!sigs) {
    throw new Error("B2UTXOSignatures is not loaded");
  }

  const { getStandardPubKeyBytes, getHash160, cashAddrEncode } = sigs;

  // Obter o motor base
  const B2UTXOEngine = global.B2UTXOEngine || 
                       (global.window && global.window.B2UTXOEngine) || 
                       (typeof window !== 'undefined' && window.B2UTXOEngine);

  if (!B2UTXOEngine) {
    throw new Error("B2UTXOEngine base class is not loaded");
  }

  const B2UTXOHistoryProvider = global.B2UTXOHistoryProvider || 
                               (global.window && global.window.B2UTXOHistoryProvider) || 
                               (typeof window !== 'undefined' && window.B2UTXOHistoryProvider);

  // =========================================================================
  // INDIVIDUAL BLOCKCHAIN SPECULATIVE ENGINES
  // =========================================================================

  // --- BITCOIN ENGINE ---
  class B2BitcoinEngine extends B2UTXOEngine {
    constructor() {
      super({
        key: "BTC",
        name: "Bitcoin",
        coinType: 0,
        decimals: 8,
        providers: [
          "https://mempool.space/api"
        ]
      });
    }

    /**
     * Retorna os providers corretos de acordo com a rede ativa (mainnet ou testnet4)
     */
    getProviders() {
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      if (isTestnet) {
        return ["https://mempool.space/testnet4/api"];
      }
      return ["https://mempool.space/api"];
    }

    /**
     * Override makeRequest para usar providers dinâmicos por rede
     */
    async makeRequest(endpointPath, method = 'GET', body = null) {
      const activeProviders = this.getProviders();
      let lastError = null;
      for (const providerUrl of activeProviders) {
        const fullUrl = `${providerUrl}${endpointPath}`;
        try {
          const options = { method };
          if (body) {
            options.headers = {};
            if (typeof body === 'string') {
              options.headers['Content-Type'] = 'text/plain';
              options.body = body;
            } else {
              options.headers['Content-Type'] = 'application/json';
              options.body = JSON.stringify(body);
            }
          }
          const response = await fetch(fullUrl, options);
          if (response.ok) {
            const text = await response.text();
            try {
              return JSON.parse(text);
            } catch (err) {
              return text;
            }
          } else {
            lastError = new Error(`Node ${providerUrl} yielded status ${response.status}: ${response.statusText}`);
          }
        } catch (e) {
          lastError = e;
        }
      }
      throw lastError || new Error(`No available nodes for BTC`);
    }

    deriveAddress(privateKeyHexOrBytes, type = 'bech32') {
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      const privBytes = typeof privateKeyHexOrBytes === 'string' ? 
                        new Uint8Array(privateKeyHexOrBytes.match(/.{1,2}/g).map(b => parseInt(b, 16))) : 
                        privateKeyHexOrBytes;
      const pubBytes = getStandardPubKeyBytes(privBytes);
      
      switch (type) {
        case 'legacy':
          return this.deriveLegacyAddress(pubBytes, isTestnet ? 0x6F : 0x00); // m/n on testnet, 1 on mainnet
        case 'p2sh':
        case 'nested':
          return this.deriveP2SHAddress(pubBytes, isTestnet ? 0xC4 : 0x05); // 2 on testnet, 3 on mainnet
        case 'bech32':
        case 'native':
          return this.deriveNativeSegwitAddress(pubBytes, isTestnet ? "tb" : "bc"); // tb1q... on testnet, bc1q... on mainnet
        case 'taproot':
          return this.deriveTaprootAddress(pubBytes, isTestnet ? "tb" : "bc"); // tb1p... on testnet, bc1p... on mainnet
        default:
          return this.deriveNativeSegwitAddress(pubBytes, isTestnet ? "tb" : "bc");
      }
    }

    validateAddress(address) {
      if (!address || typeof address !== 'string') return false;
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      if (isTestnet) {
        if (address.startsWith('tb1')) {
          return /^tb1[qp][02-9ac-hj-np-z_]{32,58}$/.test(address);
        }
        return /^[mn2][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
      } else {
        if (address.startsWith('bc1')) {
          return /^bc1[qp][02-9ac-hj-np-z_]{32,58}$/.test(address);
        }
        return /^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
      }
    }
  }

  // --- LITECOIN ENGINE ---
  class B2LitecoinEngine extends B2UTXOEngine {
    constructor() {
      super({
        key: "LTC",
        name: "Litecoin",
        coinType: 2,
        decimals: 8,
        providers: [
          "https://litecoinspace.org/api",
          "https://blockbook.litecoin.zelcore.io"
        ]
      });
    }

    deriveAddress(privateKeyHexOrBytes, type = 'bech32') {
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      const privBytes = typeof privateKeyHexOrBytes === 'string' ? 
                        new Uint8Array(privateKeyHexOrBytes.match(/.{1,2}/g).map(b => parseInt(b, 16))) : 
                        privateKeyHexOrBytes;
      const pubBytes = getStandardPubKeyBytes(privBytes);
      
      switch (type) {
        case 'legacy':
          return this.deriveLegacyAddress(pubBytes, isTestnet ? 0x6F : 0x30); // m/n on testnet, L on mainnet
        case 'p2sh':
        case 'nested':
          return this.deriveP2SHAddress(pubBytes, isTestnet ? 0x3A : 0x32); // Q on testnet, M on mainnet. Note: Litecoin uses standard P2SH format
        case 'bech32':
        case 'native':
          return this.deriveNativeSegwitAddress(pubBytes, isTestnet ? "tltc" : "ltc"); // tltc1q... on testnet, ltc1q... on mainnet
        default:
          return this.deriveNativeSegwitAddress(pubBytes, isTestnet ? "tltc" : "ltc");
      }
    }

    validateAddress(address) {
      if (!address || typeof address !== 'string') return false;
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      if (isTestnet) {
        if (address.startsWith('tltc1')) {
          return /^tltc1[qp][02-9ac-hj-np-z_]{32,58}$/.test(address);
        }
        return /^[mnQ][1-9A-HJ-NP-Za-km-z]{26,43}$/.test(address);
      } else {
        if (address.startsWith('ltc1')) {
          return /^ltc1[qp][02-9ac-hj-np-z_]{32,58}$/.test(address);
        }
        return /^[LM3][1-9A-HJ-NP-Za-km-z]{26,43}$/.test(address);
      }
    }
  }

  // --- DOGECOIN ENGINE ---
  class B2DogecoinEngine extends B2UTXOEngine {
    constructor() {
      super({
        key: "DOGE",
        name: "Dogecoin",
        coinType: 3,
        decimals: 8,
        providers: [
          "https://blockbook.dogecoin.zelcore.io",
          "https://dogechain.info/api/v1"
        ]
      });
    }

    deriveAddress(privateKeyHexOrBytes, type = 'legacy') {
      const privBytes = typeof privateKeyHexOrBytes === 'string' ? 
                        new Uint8Array(privateKeyHexOrBytes.match(/.{1,2}/g).map(b => parseInt(b, 16))) : 
                        privateKeyHexOrBytes;
      const pubBytes = getStandardPubKeyBytes(privBytes);
      
      switch (type) {
        case 'p2sh':
        case 'nested':
          return this.deriveP2SHAddress(pubBytes, 0x16); // A...
        case 'legacy':
        default:
          return this.deriveLegacyAddress(pubBytes, 0x1E); // D...
      }
    }

    validateAddress(address) {
      if (!address || typeof address !== 'string') return false;
      return /^[DA][1-9A-HJ-NP-Za-km-z]{33,34}$/.test(address);
    }
  }

  // --- BITCOIN CASH ENGINE ---
  class B2BitcoinCashEngine extends B2UTXOEngine {
    constructor() {
      super({
        key: "BCH",
        name: "Bitcoin Cash",
        coinType: 145,
        decimals: 8,
        providers: [
          "https://blockbook.bitcoin-cash.zelcore.io",
          "https://bch-chain.api.btc.com/v3"
        ]
      });
    }

    deriveAddress(privateKeyHexOrBytes, type = 'cashaddr') {
      const privBytes = typeof privateKeyHexOrBytes === 'string' ? 
                        new Uint8Array(privateKeyHexOrBytes.match(/.{1,2}/g).map(b => parseInt(b, 16))) : 
                        privateKeyHexOrBytes;
      const pubBytes = getStandardPubKeyBytes(privBytes);
      const h160 = getHash160(pubBytes);

      switch (type) {
        case 'legacy':
          return this.deriveLegacyAddress(pubBytes, 0x00); // 1...
        case 'cashaddr':
        default:
          return cashAddrEncode("bitcoincash", 0, h160); // bitcoincash:q...
      }
    }

    validateAddress(address) {
      if (!address || typeof address !== 'string') return false;
      const cleanBch = address.startsWith('bitcoincash:') ? address.substring(12) : address;
      if (/^[qp][a-z0-9]{41}$/.test(cleanBch)) return true;
      return /^[1][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address); // legacy support
    }
  }

  // =========================================================================
  // GLOBAL EXPORTS
  // =========================================================================

  const exportsObj = {
    B2UTXOEngine,
    B2UTXOHistoryProvider,
    B2BitcoinEngine: new B2BitcoinEngine(),
    B2LitecoinEngine: new B2LitecoinEngine(),
    B2DogecoinEngine: new B2DogecoinEngine(),
    B2BitcoinCashEngine: new B2BitcoinCashEngine()
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  
  if (global.window) {
    Object.assign(global.window, exportsObj);
  } else {
    Object.assign(global, exportsObj);
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
