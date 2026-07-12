/**
 * B2 Wallet — Tron TRC20 & Smart Contracts Metadata Resolver
 *
 * Implementa cache LRU persistente no LocalStorage, contratos TRC20 bem-conhecidos
 * e resolução de metadados dinâmicos de tokens TRC20.
 */

;(function(global) {
  'use strict';

  // Well-known TRC20 contracts for active scanning
  const wellKnownTRC20 = [
    { address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", symbol: "USDT", name: "Tether USD", decimals: 6 },
    { address: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8", symbol: "USDC", name: "USD Coin", decimals: 6 },
    { address: "TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9", symbol: "JST", name: "JUST", decimals: 18 },
    { address: "TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9", symbol: "SUN", name: "SUN Token", decimals: 18 },
    { address: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7", symbol: "WIN", name: "WIN", decimals: 18 }
  ];

  class LRUCache {
    constructor(limit = 100) {
      this.limit = limit;
      this.cache = new Map();
    }

    get(key) {
      if (!this.cache.has(key)) return null;
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }

    set(key, value) {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      } else if (this.cache.size >= this.limit) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }
      this.cache.set(key, value);
    }
  }

  // Helper para decodificar strings retornadas por contratos ABI
  function decodeABIString(hex) {
    if (!hex) return "";
    let clean = hex;
    if (clean.startsWith('0x')) clean = clean.substring(2);
    if (clean.length < 128) return "";
    const lenHex = clean.substring(64, 128);
    const len = parseInt(lenHex, 16);
    if (isNaN(len) || len === 0) return "";
    const valueHex = clean.substring(128, 128 + len * 2);
    let str = "";
    for (let i = 0; i < valueHex.length; i += 2) {
      const code = parseInt(valueHex.substring(i, i + 2), 16);
      if (code >= 32 && code <= 126) {
        str += String.fromCharCode(code);
      }
    }
    return str;
  }

  const B2StorageProvider = global.B2StorageProvider || (global.window && global.window.B2StorageProvider) || {
    getItem(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    setItem(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {}
    },
    removeItem(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    },
    async getItemAsync(key) {
      return this.getItem(key);
    },
    async setItemAsync(key, value) {
      this.setItem(key, value);
    }
  };

  // Ensure it's assigned to global environments
  global.B2StorageProvider = B2StorageProvider;
  if (global.window) {
    global.window.B2StorageProvider = B2StorageProvider;
  }

  const B2TronTokenMetadataProvider = {
    cache: new LRUCache(100),

    async getMetadata(contractAddress, nodeUrl, fallbacks = []) {
      if (!contractAddress) return null;
      
      const engine = global.B2TronEngine || (global.window && global.window.B2TronEngine);
      if (!engine) {
        throw new Error("B2TronEngine is not loaded");
      }

      try {
        const cleanAddress = engine.toBase58Address(contractAddress);
        
        // In-memory LRU check
        const cached = this.cache.get(cleanAddress);
        if (cached) {
          return cached;
        }

        // Storage Provider check
        const storedStr = B2StorageProvider.getItem(`trc20_meta_${cleanAddress}`);
        if (storedStr) {
          try {
            const parsed = JSON.parse(storedStr);
            this.cache.set(cleanAddress, parsed);
            return parsed;
          } catch (e) {}
        }

        // Well-known check
        const wellKnown = wellKnownTRC20.find(t => t.address.toLowerCase() === cleanAddress.toLowerCase());
        if (wellKnown) {
          const meta = {
            address: wellKnown.address,
            symbol: wellKnown.symbol,
            name: wellKnown.name,
            decimals: wellKnown.decimals
          };
          this.cache.set(cleanAddress, meta);
          B2StorageProvider.setItem(`trc20_meta_${cleanAddress}`, JSON.stringify(meta));
          return meta;
        }

        // Dynamic Query
        const contractHex = engine.toHexAddress(cleanAddress);
        const [nameData, symData, decData] = await Promise.all([
          engine.fetchWithFailover("wallet/triggerconstantcontract", {
            owner_address: "410000000000000000000000000000000000000000",
            contract_address: contractHex,
            function_selector: "name()",
            parameter: ""
          }, "POST", nodeUrl, fallbacks).catch(() => null),
          engine.fetchWithFailover("wallet/triggerconstantcontract", {
            owner_address: "410000000000000000000000000000000000000000",
            contract_address: contractHex,
            function_selector: "symbol()",
            parameter: ""
          }, "POST", nodeUrl, fallbacks).catch(() => null),
          engine.fetchWithFailover("wallet/triggerconstantcontract", {
            owner_address: "410000000000000000000000000000000000000000",
            contract_address: contractHex,
            function_selector: "decimals()",
            parameter: ""
          }, "POST", nodeUrl, fallbacks).catch(() => null)
        ]);

        let name = "Unknown TRC20";
        let symbol = "TRC20";
        let decimals = 18;

        if (nameData && nameData.constant_result && nameData.constant_result[0]) {
          name = decodeABIString(nameData.constant_result[0]) || "Unknown TRC20";
        }
        if (symData && symData.constant_result && symData.constant_result[0]) {
          symbol = decodeABIString(symData.constant_result[0]) || "TRC20";
        }
        if (decData && decData.constant_result && decData.constant_result[0]) {
          decimals = parseInt(decData.constant_result[0], 16) || 18;
        }

        const meta = { address: cleanAddress, symbol, name, decimals };
        this.cache.set(cleanAddress, meta);
        B2StorageProvider.setItem(`trc20_meta_${cleanAddress}`, JSON.stringify(meta));
        return meta;
      } catch (e) {
        console.warn('[B2TronTokenMetadataProvider] Resolve failed:', e.message);
        return { address: contractAddress, symbol: "TRC20", name: "Unknown TRC20", decimals: 18 };
      }
    }
  };

  const B2TronContracts = {
    wellKnownTRC20,
    LRUCache,
    decodeABIString,
    B2TronTokenMetadataProvider
  };

  if (typeof window !== "undefined") {
    window.B2TronContracts = B2TronContracts;
    window.B2TronTokenMetadataProvider = B2TronTokenMetadataProvider;
    window.B2StorageProvider = B2StorageProvider;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.B2TronContracts = B2TronContracts;
    globalThis.B2TronTokenMetadataProvider = B2TronTokenMetadataProvider;
    globalThis.B2StorageProvider = B2StorageProvider;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { B2TronContracts, B2TronTokenMetadataProvider, B2StorageProvider };
  }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
