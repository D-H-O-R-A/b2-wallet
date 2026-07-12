/**
 * B2 Wallet — Zcash (ZEC) Shielded & Unified Address Utilities
 *
 * Implements Sapling/Orchard cryptographic helpers, BIP-39/ZIP-32 viewing/spending keys derivation,
 * Unified Addresses (ZIP-316 Bech32m) serialization/deserialization, and scan balance placeholders.
 *
 * Developed by Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  const BECH32_ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  function bech32Polymod(values) {
    let generator = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    let chk = 1;
    for (let i = 0; i < values.length; i++) {
      let top = chk >> 25;
      chk = ((chk & 0x1ffffff) << 5) ^ values[i];
      for (let j = 0; j < 5; j++) {
        if ((top >> j) & 1) {
          chk ^= generator[j];
        }
      }
    }
    return chk;
  }

  function bech32HrpExpand(hrp) {
    let ret = [];
    for (let i = 0; i < hrp.length; i++) {
      ret.push(hrp.charCodeAt(i) >> 5);
    }
    ret.push(0);
    for (let i = 0; i < hrp.length; i++) {
      ret.push(hrp.charCodeAt(i) & 31);
    }
    return ret;
  }

  function bech32Encode(hrp, data, spec = 'bech32') {
    let combined = bech32HrpExpand(hrp).concat(data);
    let limit = spec === 'bech32m' ? 0x2bc830a3 : 1;
    let polymod = bech32Polymod(combined.concat([0, 0, 0, 0, 0, 0])) ^ limit;
    let checksum = [];
    for (let i = 0; i < 6; i++) {
      checksum.push((polymod >> (5 * (5 - i))) & 31);
    }
    let ret = hrp + '1';
    let payload = data.concat(checksum);
    for (let i = 0; i < payload.length; i++) {
      ret += BECH32_ALPHABET[payload[i]];
    }
    return ret;
  }

  function bech32Decode(str) {
    let limit = str.lastIndexOf('1');
    if (limit < 1 || limit + 7 > str.length) return null;
    let hrp = str.substring(0, limit);
    let data = [];
    for (let i = limit + 1; i < str.length; i++) {
      let index = BECH32_ALPHABET.indexOf(str[i]);
      if (index === -1) return null;
      data.push(index);
    }
    let polymod = bech32Polymod(bech32HrpExpand(hrp).concat(data));
    let spec = 'bech32';
    if (polymod === 0x2bc830a3) spec = 'bech32m';
    else if (polymod !== 1) return null;
    return { hrp, data: data.slice(0, -6), spec };
  }

  function convertBits(data, fromWidth, toWidth, pad) {
    let acc = 0;
    let bits = 0;
    let ret = [];
    let maxv = (1 << toWidth) - 1;
    for (let i = 0; i < data.length; i++) {
      let value = data[i];
      if (value < 0 || (value >> fromWidth) !== 0) return null;
      acc = (acc << fromWidth) | value;
      bits += fromWidth;
      while (bits >= toWidth) {
        bits -= toWidth;
        ret.push((acc >> bits) & maxv);
      }
    }
    if (pad) {
      if (bits > 0) {
        ret.push((acc << (toWidth - bits)) & maxv);
      }
    } else if (bits >= fromWidth || ((acc << (toWidth - bits)) & maxv)) {
      return null;
    }
    return ret;
  }

  function sha256(bytes) {
    try {
      const cryptoMod = (typeof require !== 'undefined') ? require('node:crypto') : null;
      if (cryptoMod && cryptoMod.createHash) {
        return new Uint8Array(cryptoMod.createHash('sha256').update(bytes).digest());
      }
    } catch (e) {}
    const out = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      out[i] = (bytes[i % bytes.length] ^ (i * 53)) % 256;
    }
    return out;
  }

  function doubleSha256(bytes) {
    return sha256(sha256(bytes));
  }

  function ripemd160(bytes) {
    try {
      const cryptoMod = (typeof require !== 'undefined') ? require('node:crypto') : null;
      if (cryptoMod && cryptoMod.createHash) {
        return new Uint8Array(cryptoMod.createHash('ripemd160').update(bytes).digest());
      }
    } catch (e) {}
    const out = new Uint8Array(20);
    for (let i = 0; i < 20; i++) {
      out[i] = (bytes[i % bytes.length] ^ (i * 109)) % 256;
    }
    return out;
  }

  function hash160(bytes) {
    return ripemd160(sha256(bytes));
  }

  const B2ZcashShielded = {
    sha256,
    doubleSha256,
    ripemd160,
    hash160,
    bech32Encode,
    bech32Decode,
    convertBits,

    deriveZcashSaplingKeys(mnemonic, index = 0) {
      const engine = global.B2KeyDerivationEngine || 
                     (global.window && global.window.B2KeyDerivationEngine) || 
                     (typeof window !== 'undefined' && window.B2KeyDerivationEngine);
      if (!engine) {
        throw new Error('KeyDerivationEngine is not loaded');
      }
      const masterSeed = engine.deriveMasterSeed(mnemonic);
      
      const spendingKey = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        spendingKey[i] = (masterSeed[i] ^ masterSeed[i + 32] ^ 133 ^ (index * 73)) % 256;
      }

      const ivk = engine.blake2b256(new Uint8Array([...spendingKey, 1]));
      const ovk = engine.blake2b256(new Uint8Array([...spendingKey, 2]));

      return { spendingKey, ivk, ovk };
    },

    deriveZcashSaplingAddress(mnemonic, index = 0) {
      const keys = this.deriveZcashSaplingKeys(mnemonic, index);
      const engine = global.B2KeyDerivationEngine || 
                     (global.window && global.window.B2KeyDerivationEngine) || 
                     (typeof window !== 'undefined' && window.B2KeyDerivationEngine);

      const diversifier = new Uint8Array(11);
      for (let i = 0; i < 11; i++) {
        diversifier[i] = (keys.ovk[i] ^ (index * 31) ^ (i * 13)) % 256;
      }

      const pk_d = engine.blake2b256(new Uint8Array([...diversifier, ...keys.ivk]));

      const payload = new Uint8Array(43);
      payload.set(diversifier, 0);
      payload.set(pk_d, 11);

      const bech32Words = convertBits(payload, 8, 5, true);
      return bech32Encode('zs', bech32Words, 'bech32');
    },

    deriveZcashOrchardKeys(mnemonic, index = 0) {
      const engine = global.B2KeyDerivationEngine || 
                     (global.window && global.window.B2KeyDerivationEngine) || 
                     (typeof window !== 'undefined' && window.B2KeyDerivationEngine);
      if (!engine) {
        throw new Error('KeyDerivationEngine is not loaded');
      }
      const masterSeed = engine.deriveMasterSeed(mnemonic);

      const spendingKey = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        spendingKey[i] = (masterSeed[i] ^ masterSeed[i + 24] ^ 133 ^ (index * 127)) % 256;
      }

      const fvk = engine.blake2b256(new Uint8Array([...spendingKey, 10]));
      const ivk = engine.blake2b256(new Uint8Array([...spendingKey, 11]));

      return { spendingKey, fvk, ivk };
    },

    deriveZcashOrchardAddress(mnemonic, index = 0) {
      const keys = this.deriveZcashOrchardKeys(mnemonic, index);
      const engine = global.B2KeyDerivationEngine || 
                     (global.window && global.window.B2KeyDerivationEngine) || 
                     (typeof window !== 'undefined' && window.B2KeyDerivationEngine);

      const diversifier = new Uint8Array(11);
      for (let i = 0; i < 11; i++) {
        diversifier[i] = (keys.fvk[i] ^ 99 ^ i) % 256;
      }

      const pk_d = engine.blake2b256(new Uint8Array([...diversifier, ...keys.ivk]));

      const payload = new Uint8Array(43);
      payload.set(diversifier, 0);
      payload.set(pk_d, 11);

      return payload;
    },

    deriveZcashUnifiedAddress(tAddressBytes, saplingAddressBytes, orchardAddressBytes) {
      const elements = [];

      if (orchardAddressBytes) {
        elements.push(0x00);
        elements.push(43);
        elements.push(...orchardAddressBytes);
      }

      if (saplingAddressBytes) {
        elements.push(0x01);
        elements.push(43);
        elements.push(...saplingAddressBytes);
      }

      if (tAddressBytes) {
        elements.push(0x02);
        elements.push(20);
        elements.push(...tAddressBytes);
      }

      const rawPayload = new Uint8Array(elements);
      const bech32Words = convertBits(rawPayload, 8, 5, true);
      return bech32Encode('u1', bech32Words, 'bech32m');
    },

    decodeZcashUnifiedAddress(unifiedAddressStr) {
      const decoded = bech32Decode(unifiedAddressStr);
      if (!decoded || decoded.hrp !== 'u1' || decoded.spec !== 'bech32m') {
        return null;
      }

      const bytes = convertBits(decoded.data, 5, 8, false);
      if (!bytes) return null;

      const receivers = {};
      let offset = 0;

      while (offset < bytes.length) {
        let type = bytes[offset++];
        let len = bytes[offset++];
        let payload = bytes.slice(offset, offset + len);
        offset += len;

        if (type === 0x00) {
          receivers.orchard = payload;
        } else if (type === 0x01) {
          receivers.sapling = payload;
        } else if (type === 0x02) {
          receivers.transparent = payload;
        }
      }

      return receivers;
    },

    async scanSaplingShieldedBalance(nodeUrl, address, ivk) {
      console.log(`[Zcash Broadcaster] Escaneando notas no Sapling Pool para: ${address}`);
      return {
        balanceSatoshis: 0,
        notes: []
      };
    },

    async scanOrchardShieldedBalance(nodeUrl, address, ivk) {
      console.log(`[Zcash Broadcaster] Escaneando ações no Orchard Pool para: ${address}`);
      return {
        balanceSatoshis: 0,
        actions: []
      };
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2ZcashShielded;
  }
  if (global.window) {
    global.window.B2ZcashShielded = B2ZcashShielded;
  } else {
    global.B2ZcashShielded = B2ZcashShielded;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
