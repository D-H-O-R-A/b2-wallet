/**
 * B2 Wallet - Public Address Validator
 * 
 * Valida se um endereço público é sintaticamente válido de acordo com as regras
 * e especificações oficiais de cada blockchain e família de redes.
 */

const B2AddressValidator = {
  validateAddress(address, networkKey, engineName = null) {
    if (!address || typeof address !== 'string') return false;

    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./address-formatter').B2AddressFormatter : null);

    const getEngine = (name) => {
      if (typeof window !== 'undefined' && window[name]) return window[name];
      if (typeof globalThis !== 'undefined' && globalThis[name]) return globalThis[name];
      if (typeof global !== 'undefined' && global[name]) return global[name];
      return null;
    };

    let key = networkKey.toUpperCase();
    if (key === 'PLO' || key === 'CLX') key = 'PLO';
    if (key === 'TN') key = 'TURTLE';
    if (engineName) {
      const eng = engineName.toUpperCase();
      if (eng === 'EVM') key = 'EVM';
      else if (eng === 'BITCOIN') key = 'BTC';
      else if (eng === 'WAVES') key = 'WAVES';
      else if (eng === 'SOLANA') key = 'SOLANA';
      else if (eng === 'TRON') key = 'TRON';
    }

    const isBase58 = (str) => /^[1-9A-HJ-NP-Za-km-z]+$/.test(str);
    const isBase32 = (str) => /^[A-Z2-7]+$/.test(str);
    const isHex = (str) => /^[a-fA-F0-9]+$/.test(str);

    switch (key) {
      case 'BITCOIN':
      case 'BTC': {
        const engine = getEngine('B2BitcoinEngine');
        if (engine && typeof engine.validateAddress === 'function') {
          return engine.validateAddress(address);
        }
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

      case 'LITECOIN':
      case 'LTC': {
        const engine = getEngine('B2LitecoinEngine');
        if (engine && typeof engine.validateAddress === 'function') {
          return engine.validateAddress(address);
        }
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

      case 'DOGE': {
        const engine = getEngine('B2DogecoinEngine');
        if (engine && typeof engine.validateAddress === 'function') {
          return engine.validateAddress(address);
        }
        return /^D[1-9A-HJ-NP-Za-km-z]{33,34}$/.test(address);
      }

      case 'BCH': {
        const engine = getEngine('B2BitcoinCashEngine');
        if (engine && typeof engine.validateAddress === 'function') {
          return engine.validateAddress(address);
        }
        const cleanBch = address.startsWith('bitcoincash:') ? address.substring(12) : address;
        if (/^[qp][a-z0-9]{41}$/.test(cleanBch)) return true;
        return /^[1][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
      }

      case 'DASH_P2SH':
      case 'DASH':
        try {
          if (!isBase58(address) || address.length < 33 || address.length > 35) return false;
          const decoded = formatter.decodeBase58(address);
          if (decoded.length !== 25) return false;
          if (decoded[0] !== 0x4C && decoded[0] !== 0x10) return false;
          const payload = decoded.subarray(0, 21);
          const checksum = decoded.subarray(21, 25);
          
          const computedCsKeccak = formatter.keccak256Bytes(formatter.keccak256Bytes(payload)).subarray(0, 4);
          const computedCsSha = formatter.doubleSha256(payload).subarray(0, 4);
          
          const matchKeccak = checksum[0] === computedCsKeccak[0] &&
                              checksum[1] === computedCsKeccak[1] &&
                              checksum[2] === computedCsKeccak[2] &&
                              checksum[3] === computedCsKeccak[3];
                              
          const matchSha = checksum[0] === computedCsSha[0] &&
                           checksum[1] === computedCsSha[1] &&
                           checksum[2] === computedCsSha[2] &&
                           checksum[3] === computedCsSha[3];
                           
          return matchKeccak || matchSha;
        } catch (e) {
          return false;
        }

      case 'ZEC':
      case 'ZCASH':
      case 'ZEC_TRANSPARENT':
      case 'ZCASH_TRANSPARENT':
      case 'ZEC_SAPLING':
      case 'ZEC_SHIELDED':
      case 'ZCASH_SHIELDED':
      case 'ZEC_UNIFIED':
      case 'ZCASH_UNIFIED':
        if (address.startsWith('t1') || address.startsWith('t3')) {
          if (address.length !== 35) return false;
          try {
            if (!isBase58(address)) return false;
            const decoded = formatter.decodeBase58(address);
            if (decoded.length !== 26) return false;
            if (decoded[0] !== 0x1C || (decoded[1] !== 0xB8 && decoded[1] !== 0xBD)) return false;
            const payload = decoded.subarray(0, 22);
            const checksum = decoded.subarray(22, 26);
            const computedCs = formatter.doubleSha256(payload).subarray(0, 4);
            return checksum[0] === computedCs[0] &&
                   checksum[1] === computedCs[1] &&
                   checksum[2] === computedCs[2] &&
                   checksum[3] === computedCs[3];
          } catch (e) {
            return false;
          }
        }
        if (address.startsWith('zs1')) {
          const decoded = formatter.decodeBech32(address);
          if (!decoded || decoded.hrp !== 'zs' || decoded.spec !== 'bech32') return false;
          return decoded.data && decoded.data.length === 43;
        }
        if (address.startsWith('u1')) {
          const decoded = formatter.decodeBech32(address);
          if (!decoded || decoded.hrp !== 'u1' || decoded.spec !== 'bech32m') return false;
          const bytes = decoded.data;
          if (!bytes || bytes.length === 0) return false;
          let offset = 0;
          let hasReceiver = false;
          while (offset < bytes.length) {
            if (offset + 2 > bytes.length) return false;
            let type = bytes[offset++];
            let len = bytes[offset++];
            if (offset + len > bytes.length) return false;
            if (type === 0x00 && len === 43) hasReceiver = true;
            else if (type === 0x01 && len === 43) hasReceiver = true;
            else if (type === 0x02 && len === 20) hasReceiver = true;
            offset += len;
          }
          return hasReceiver && offset === bytes.length;
        }
        return false;

      case 'WAVES':
      case 'AMZX':
      case 'TURTLE':
      case 'PLO': {
        const origNetKey = networkKey ? networkKey.toUpperCase() : '';
        let expectedChainId = 87; // default to WAVES
        if (origNetKey === 'WAVES' || origNetKey === 'WAVE' || origNetKey === '87') {
          expectedChainId = 87;
        } else if (origNetKey === 'AMZX' || origNetKey === '65') {
          expectedChainId = 65;
        } else if (origNetKey === 'TURTLE' || origNetKey === 'TN' || origNetKey === '76') {
          expectedChainId = 76;
        } else if (origNetKey === 'PLO' || origNetKey === 'PLX' || origNetKey === '80' || origNetKey === '67') {
          expectedChainId = (origNetKey === '67') ? 67 : 80;
        } else {
          try {
            if (isBase58(address) && address.length === 35) {
              const decoded = formatter.decodeBase58(address);
              if (decoded.length === 26 && decoded[0] === 0x01) {
                const embedded = decoded[1];
                if (embedded === 87 || embedded === 65 || embedded === 80 || embedded === 76 || embedded === 67) {
                  expectedChainId = embedded;
                }
              }
            }
          } catch (e) {}
        }
        try {
          if (!isBase58(address) || address.length !== 35) return false;
          const decoded = formatter.decodeBase58(address);
          if (decoded.length !== 26) return false;
          if (decoded[0] !== 0x01) return false;
          if (decoded[1] !== expectedChainId) return false;
          const rechecksum = formatter.calculateWavesChecksum(decoded.subarray(0, 22));
          return decoded[22] === rechecksum[0] &&
                 decoded[23] === rechecksum[1] &&
                 decoded[24] === rechecksum[2] &&
                 decoded[25] === rechecksum[3];
        } catch (e) {
          return false;
        }
      }

      case 'SOLANA':
      case 'SOL':
        return isBase58(address) && address.length >= 32 && address.length <= 44;

      case 'CARDANO':
      case 'ADA': {
        const engine = getEngine('B2CardanoEngine');
        if (engine && typeof engine.validateAddress === 'function') {
          return engine.validateAddress(address);
        }
        if (address.startsWith('addr1')) {
          return /^addr1[02-9ac-hj-np-z_]{53,103}$/.test(address);
        }
        return (address.startsWith('Ae2') || address.startsWith('DdzFF')) && isBase58(address);
      }

      case 'TRON':
      case 'TRX': {
        const engine = (typeof window !== 'undefined' && window.B2TronEngine) || 
                       (typeof global !== 'undefined' && global.B2TronEngine) || 
                       (globalThis && globalThis.B2TronEngine);
        if (engine && typeof engine.validateAddress === 'function') {
          return engine.validateAddress(address);
        }
        const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
        const pattern = isTestnet ? /^2[1-9A-HJ-NP-Za-km-z]{33}$/ : /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
        return pattern.test(address);
      }

      case 'STELLAR':
      case 'XLM':
        try {
          if (address.length !== 56 || !address.startsWith("G")) return false;
          const decoded = formatter.decodeBase32(address);
          if (decoded.length !== 35) return false;
          const versionAndPayload = decoded.subarray(0, 33);
          const checksumBytes = decoded.subarray(33, 35);
          const computedCrc = formatter.calculateStellarCRC16(versionAndPayload);
          const expectedCrc = checksumBytes[0] | (checksumBytes[1] << 8);
          return computedCrc === expectedCrc;
        } catch (e) {
          return false;
        }

      case 'MONERO':
      case 'XMR': {
        const moneroEngine = (typeof window !== 'undefined' && window.B2MoneroEngine) || 
                             (typeof global !== 'undefined' && global.B2MoneroEngine) || 
                             (globalThis && globalThis.B2MoneroEngine);
        if (moneroEngine && typeof moneroEngine.validateAddress === 'function') {
          return moneroEngine.validateAddress(address);
        }
        return /^4[1-9A-HJ-NP-Za-km-z]{94}$/.test(address);
      }

      case 'ICP': {
        const icpEngine = (typeof window !== 'undefined' && window.B2IcpEngine) || 
                          (typeof global !== 'undefined' && global.B2IcpEngine) || 
                          (globalThis && globalThis.B2IcpEngine);
        if (icpEngine && typeof icpEngine.validateAddress === 'function') {
          return icpEngine.validateAddress(address);
        }
        if (address.endsWith('-g')) {
          return isHex(address.substring(0, 40)) && address.length === 42;
        }
        return /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/.test(address);
      }

      case 'POLKADOT':
      case 'DOT': {
        const polkadotCrypto = globalThis.PolkadotCrypto || window.PolkadotCrypto;
        if (polkadotCrypto && typeof polkadotCrypto.decodeAddress === 'function' && typeof polkadotCrypto.encodeAddress === 'function') {
          try {
            const decoded = polkadotCrypto.decodeAddress(address);
            if (decoded.length !== 32) return false;
            const reencoded = polkadotCrypto.encodeAddress(decoded, 0);
            return reencoded === address;
          } catch (e) {
            return false;
          }
        }
        return /^1[1-9A-HJ-NP-Za-km-z]{46,47}$/.test(address);
      }

      case 'FILECOIN':
      case 'FIL': {
        const filEngine = (typeof window !== 'undefined' && window.B2FilecoinEngine) || 
                          (typeof global !== 'undefined' && global.B2FilecoinEngine) || 
                          (globalThis && globalThis.B2FilecoinEngine);
        if (filEngine && typeof filEngine.validateAddress === 'function') {
          return filEngine.validateAddress(address);
        }
        return /^f[0-4][a-z0-9]{37,39}$/.test(address.toLowerCase());
      }

      case 'NEO': {
        const neoEngine = (typeof window !== 'undefined' && window.B2NeoEngine) || 
                          (typeof global !== 'undefined' && global.B2NeoEngine) || 
                          (globalThis && globalThis.B2NeoEngine);
        if (neoEngine && typeof neoEngine.validateAddress === 'function') {
          return neoEngine.validateAddress(address);
        }
        return /^N[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
      }

      case 'EVM':
      case 'POLYGON':
      case 'AVAX':
      case 'ARBITRUM':
      case 'BSC':
      case 'OPTIMISM':
      default:
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
        const rawHex = address.substring(2);
        if (rawHex === rawHex.toLowerCase() || rawHex === rawHex.toUpperCase()) {
          return true;
        }
        return address === formatter.toChecksumAddress(address);
    }
  }
};

// Exportação global universal
if (typeof window !== "undefined") {
  window.B2AddressValidator = B2AddressValidator;
}
if (typeof globalThis !== "undefined") {
  globalThis.B2AddressValidator = B2AddressValidator;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { B2AddressValidator };
}
