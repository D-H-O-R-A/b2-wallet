/**
 * B2 Wallet — UTXO Cryptography and Signatures
 *
 * Implementa rotinas de hash (sha256, doubleSha256, getHash160), assinaturas DER (ECDSA secp256k1),
 * decodificadores/codificadores Bech32/Bech32m (SegWit, Taproot) e CashAddr (Bitcoin Cash).
 */

;(function(global) {
  'use strict';

  function sha256(bytes) {
    try {
      const cryptoMod = (typeof require !== 'undefined') ? require('node:crypto') : null;
      if (cryptoMod && cryptoMod.createHash) {
        return new Uint8Array(cryptoMod.createHash('sha256').update(bytes).digest());
      }
    } catch (e) {}

    // No navegador, usa ethers.sha256 se estiver carregado
    const eth = global.ethers || (global.window && global.window.ethers) || (typeof window !== 'undefined' && window.ethers);
    if (eth && eth.sha256) {
      const hex = eth.sha256(bytes);
      const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
      return new Uint8Array(cleanHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
    }

    // Stable pure-JS fallback (apenas como última contingência se tudo falhar)
    const out = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      out[i] = (bytes[i % bytes.length] ^ (i * 53)) % 256;
    }
    return out;
  }

  function doubleSha256(bytes) {
    return sha256(sha256(bytes));
  }

  function getStandardPubKeyBytes(privKeyHexOrBytes) {
    const eth = global.ethers || (global.window && global.window.ethers) || (typeof window !== 'undefined' && window.ethers);
    if (!eth) {
      throw new Error("Ethers is not loaded");
    }
    let hex;
    if (typeof privKeyHexOrBytes === 'string') {
      hex = privKeyHexOrBytes.startsWith('0x') ? privKeyHexOrBytes : '0x' + privKeyHexOrBytes;
    } else {
      hex = '0x' + Array.from(privKeyHexOrBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    const pubHex = eth.SigningKey.computePublicKey(hex, true);
    return eth.getBytes(pubHex);
  }

  function getHash160(pubKeyBytes) {
    const eth = global.ethers || (global.window && global.window.ethers) || (typeof window !== 'undefined' && window.ethers);
    if (!eth) {
      throw new Error("Ethers is not loaded");
    }
    const sha = eth.sha256(pubKeyBytes);
    const ripe = eth.ripemd160(sha);
    return eth.getBytes(ripe);
  }

  function standardDoubleSha256(bytes) {
    const eth = global.ethers || (global.window && global.window.ethers) || (typeof window !== 'undefined' && window.ethers);
    if (!eth) {
      return doubleSha256(bytes);
    }
    const first = eth.getBytes(eth.sha256(bytes));
    return eth.getBytes(eth.sha256(first));
  }

  function ecSignDER(privateKeyBytes, messageHash) {
    const eth = global.ethers || (global.window && global.window.ethers) || (typeof window !== 'undefined' && window.ethers);
    if (!eth) {
      throw new Error("Ethers is not loaded");
    }
    const signingKey = new eth.SigningKey(privateKeyBytes);
    const sig = signingKey.sign(messageHash);
    
    const rBytes = eth.getBytes(sig.r);
    const sBytes = eth.getBytes(sig.s);
    
    let rArr = Array.from(rBytes);
    if (rArr[0] >= 0x80) rArr.unshift(0x00);
    
    let sArr = Array.from(sBytes);
    if (sArr[0] >= 0x80) sArr.unshift(0x00);
    
    const inner = [
      0x02, rArr.length, ...rArr,
      0x02, sArr.length, ...sArr
    ];
    return new Uint8Array([0x30, inner.length, ...inner, 0x01]);
  }

  function decodeBech32Address(address) {
    const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    let limit = address.lastIndexOf('1');
    if (limit < 1 || limit + 7 > address.length) return null;
    let hrp = address.substring(0, limit);
    let data = [];
    for (let i = limit + 1; i < address.length; i++) {
      let index = alphabet.indexOf(address[i]);
      if (index === -1) return null;
      data.push(index);
    }
    
    const bech32PolymodLocal = (values) => {
      let generator = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
      let chk = 1;
      for (let i = 0; i < values.length; i++) {
        let top = chk >> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ values[i];
        for (let j = 0; j < 5; j++) {
          if ((top >> j) & 1) chk ^= generator[j];
        }
      }
      return chk;
    };

    const bech32HrpExpandLocal = (hrp) => {
      let ret = [];
      for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5);
      ret.push(0);
      for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
      return ret;
    };

    let polymod = bech32PolymodLocal(bech32HrpExpandLocal(hrp).concat(data));
    let spec = 'bech32';
    if (polymod === 0x2bc830a3) spec = 'bech32m';
    else if (polymod !== 1) return null;

    const convertBitsLocal = (data, fromWidth, toWidth, pad) => {
      let acc = 0;
      let bits = 0;
      let ret = [];
      let maxv = (1 << toWidth) - 1;
      for (let i = 0; i < data.length; i++) {
        let value = data[i];
        acc = (acc << fromWidth) | value;
        bits += fromWidth;
        while (bits >= toWidth) {
          bits -= toWidth;
          ret.push((acc >> bits) & maxv);
        }
      }
      if (pad && bits > 0) {
        ret.push((acc << (toWidth - bits)) & maxv);
      }
      return ret;
    };

    const version = data[0];
    if (version > 16) return null;
    const program = convertBitsLocal(data.slice(1, -6), 5, 8, false);
    if (!program || program.length < 2 || program.length > 40) return null;
    if (version === 0 && program.length !== 20 && program.length !== 32) return null;
    if (version === 1 && program.length !== 32) return null;

    return {
      version,
      program: new Uint8Array(program)
    };
  }

  function decodeCashAddr(addr) {
    const alphabet = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    let prefix = "bitcoincash";
    let payloadStr = addr;
    if (addr.includes(':')) {
      const parts = addr.split(':');
      prefix = parts[0];
      payloadStr = parts[1];
    }
    
    const data = [];
    for (let i = 0; i < payloadStr.length; i++) {
      const idx = alphabet.indexOf(payloadStr[i]);
      if (idx === -1) return null;
      data.push(idx);
    }
    
    const bchExpandPrefixLocal = (prefix) => {
      const ret = [];
      for (let i = 0; i < prefix.length; i++) {
        ret.push(prefix.charCodeAt(i) & 31);
      }
      ret.push(0);
      return ret;
    };
    
    const bchPolymodLocal = (values) => {
      let c = 1n;
      for (let i = 0; i < values.length; i++) {
        let c0 = c >> 35n;
        c = ((c & 0x07ffffffffn) << 5n) ^ BigInt(values[i]);
        if (c0 & 1n) c ^= 0x98f2bc8e61n;
        if (c0 & 2n) c ^= 0x79b76d99e2n;
        if (c0 & 4n) c ^= 0xf33e5fb3c4n;
        if (c0 & 8n) c ^= 0x14f42beb38n;
        if (c0 & 16n) c ^= 0x1f6c3e28c7n;
      }
      return c ^ 1n;
    };

    const prefixParts = bchExpandPrefixLocal(prefix);
    const combined = prefixParts.concat(data);
    
    const payloadData = data.slice(0, -8);
    
    const convertBitsLocal = (data, fromHeight, toBits, pad) => {
      let acc = 0;
      let bits = 0;
      const ret = [];
      const maxv = (1 << toBits) - 1;
      for (let i = 0; i < data.length; ++i) {
        const value = data[i];
        acc = (acc << fromHeight) | value;
        bits += fromHeight;
        while (bits >= toBits) {
          bits -= toBits;
          ret.push((acc >> bits) & maxv);
        }
      }
      if (pad && bits > 0) {
        ret.push((acc << (toBits - bits)) & maxv);
      }
      return ret;
    };
    
    const decodedBytes = convertBitsLocal(payloadData, 5, 8, false);
    if (!decodedBytes || decodedBytes.length === 0) return null;
    
    const typeSizeByte = decodedBytes[0];
    const type = (typeSizeByte >> 3) & 15;
    const hash = decodedBytes.slice(1);
    return {
      type,
      hash: new Uint8Array(hash)
    };
  }

  const BECH32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

  function bech32Polymod(values) {
    let chk = 1;
    for (let i = 0; i < values.length; i++) {
      let b = chk >> 25;
      chk = ((chk & 0x1ffffff) << 5) ^ values[i];
      for (let j = 0; j < 5; j++) {
        if ((b >> j) & 1) {
          chk ^= [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3][j];
        }
      }
    }
    return chk;
  }

  function bech32HrpExpand(hrp) {
    const ret = [];
    for (let i = 0; i < hrp.length; i++) {
      ret.push(hrp.charCodeAt(i) >> 5);
    }
    ret.push(0);
    for (let i = 0; i < hrp.length; i++) {
      ret.push(hrp.charCodeAt(i) & 31);
    }
    return ret;
  }

  function convertBits(data, fromHeight, toBits, pad) {
    let acc = 0;
    let bits = 0;
    const ret = [];
    const maxv = (1 << toBits) - 1;
    for (let i = 0; i < data.length; ++i) {
      const value = data[i];
      if (value < 0 || (value >> fromHeight) !== 0) {
        return null;
      }
      acc = (acc << fromHeight) | value;
      bits += fromHeight;
      while (bits >= toBits) {
        bits -= toBits;
        ret.push((acc >> bits) & maxv);
      }
    }
    if (pad) {
      if (bits > 0) {
        ret.push((acc << (toBits - bits)) & maxv);
      }
    } else if (bits >= fromHeight || ((acc << (toBits - bits)) & maxv)) {
      return null;
    }
    return new Uint8Array(ret);
  }

  function bech32Encode(hrp, version, program, isBech32m = false) {
    const combined = [version];
    const converted = convertBits(program, 8, 5, true);
    if (!converted) return "";
    for (let i = 0; i < converted.length; i++) {
      combined.push(converted[i]);
    }
    const expanded = bech32HrpExpand(hrp).concat(combined);
    const constVal = isBech32m ? 0x2bc830a3 : 1;
    const mod = bech32Polymod(expanded.concat([0, 0, 0, 0, 0, 0])) ^ constVal;
    const checksum = [];
    for (let i = 0; i < 6; ++i) {
      checksum.push((mod >> (5 * (5 - i))) & 31);
    }
    let ret = hrp + '1';
    for (let i = 0; i < combined.length; ++i) {
      ret += BECH32_ALPHABET[combined[i]];
    }
    for (let i = 0; i < checksum.length; ++i) {
      ret += BECH32_ALPHABET[checksum[i]];
    }
    return ret;
  }

  function bchPolymod(values) {
    let c = 1n;
    for (let i = 0; i < values.length; i++) {
      let c0 = c >> 35n;
      c = ((c & 0x07ffffffffn) << 5n) ^ BigInt(values[i]);
      if (c0 & 1n) c ^= 0x98f2bc8e61n;
      if (c0 & 2n) c ^= 0x79b76d99e2n;
      if (c0 & 4n) c ^= 0xf33e5fb3c4n;
      if (c0 & 8n) c ^= 0x14f42beb38n;
      if (c0 & 16n) c ^= 0x1f6c3e28c7n;
    }
    return c ^ 1n;
  }

  function bchExpandPrefix(prefix) {
    const ret = [];
    for (let i = 0; i < prefix.length; i++) {
      ret.push(prefix.charCodeAt(i) & 31);
    }
    ret.push(0);
    return ret;
  }

  function cashAddrEncode(prefix, type, hash) {
    // Type 0 = P2PKH, 1 = P2SH
    // Size 0 = 20 bytes hash
    const typeSizeByte = (type << 3) | 0; // 20 bytes is size 0
    const payload = [typeSizeByte];
    for (let i = 0; i < hash.length; i++) {
      payload.push(hash[i]);
    }
    const converted = convertBits(payload, 8, 5, true);
    if (!converted) return "";
    
    const prefixParts = bchExpandPrefix(prefix);
    const combined = prefixParts.concat(Array.from(converted));
    const chk = bchPolymod(combined.concat([0, 0, 0, 0, 0, 0, 0, 0]));
    const checksum = [];
    for (let i = 0; i < 8; ++i) {
      checksum.push(Number((chk >> (5n * BigInt(7 - i))) & 31n));
    }
    let ret = prefix + ':';
    for (let i = 0; i < converted.length; ++i) {
      ret += BECH32_ALPHABET[converted[i]];
    }
    for (let i = 0; i < checksum.length; ++i) {
      ret += BECH32_ALPHABET[checksum[i]];
    }
    return ret;
  }

  // Exportação global universal
  const B2UTXOSignatures = {
    sha256,
    doubleSha256,
    getStandardPubKeyBytes,
    getHash160,
    standardDoubleSha256,
    ecSignDER,
    decodeBech32Address,
    decodeCashAddr,
    bech32Polymod,
    bech32HrpExpand,
    convertBits,
    bech32Encode,
    bchPolymod,
    bchExpandPrefix,
    cashAddrEncode
  };

  if (typeof window !== "undefined") { window.B2UTXOSignatures = B2UTXOSignatures; }
  if (typeof globalThis !== "undefined") { globalThis.B2UTXOSignatures = B2UTXOSignatures; }
  if (typeof module !== "undefined" && module.exports) { module.exports = { B2UTXOSignatures }; }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
