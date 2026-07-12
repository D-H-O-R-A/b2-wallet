/**
 * B2 Wallet — Filecoin DAG-CBOR Serializer & Blake2b Hashing
 *
 * Implements low-level binary tools for Filecoin:
 * - Blake2b hashing with variable output length (Blake2b-256, Blake2b-160).
 * - Filecoin Base32 encoding and decoding.
 * - DAG-CBOR serialization for Filecoin Message structure.
 *
 * Developed by Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  // Blake2b IV
  const BLAKE2B_IV = new BigUint64Array([
    0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
    0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n
  ]);

  // Blake2b Sigma table
  const BLAKE2B_SIGMA = new Uint8Array([
    0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
    14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3,
    11,8,12,0,5,2,15,13,10,14,3,6,7,1,9,4,
    7,9,3,1,13,12,11,14,2,6,5,10,4,0,15,8,
    9,0,5,7,2,4,10,15,14,1,11,12,6,8,3,13,
    2,12,6,10,0,11,8,3,4,13,7,5,15,14,1,9,
    12,5,1,15,14,13,4,10,0,7,6,3,9,2,8,11,
    13,11,7,14,12,1,3,9,5,0,15,4,8,6,2,10,
    6,15,14,9,11,3,0,8,12,2,13,7,1,4,10,5,
    10,2,8,4,7,6,1,5,15,11,9,14,3,12,13,0,
    0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
    14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3
  ]);

  // Filecoin Base32 Alphabet
  const FIL_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

  function blake2bGeneric(message, outlen) {
    let bytes;
    if (typeof message === 'string') {
      bytes = new TextEncoder().encode(message);
    } else if (message instanceof Uint8Array) {
      bytes = message;
    } else {
      bytes = new Uint8Array(message);
    }

    const h = new BigUint64Array(8);
    for (let i = 0; i < 8; i++) {
      h[i] = BLAKE2B_IV[i];
    }
    h[0] ^= 0x01010000n ^ BigInt(outlen);

    const block = new Uint8Array(128);
    let blockLen = 0;
    let t = 0n;

    const compress = (last) => {
      t += BigInt(blockLen);
      const v = new BigUint64Array(16);
      for (let i = 0; i < 8; i++) v[i] = h[i];
      for (let i = 0; i < 8; i++) v[i + 8] = BLAKE2B_IV[i];
      v[12] ^= t;
      if (last) v[14] ^= 0xffffffffffffffffn;

      const m = new BigUint64Array(16);
      const view = new DataView(block.buffer, block.byteOffset, block.byteLength);
      for (let i = 0; i < 16; i++) {
        m[i] = view.getBigUint64(i * 8, true);
      }

      const G = (a, b, c, d, x, y) => {
        v[a] = BigInt.asUintN(64, v[a] + v[b] + x);
        let r1 = v[d] ^ v[a];
        v[d] = BigInt.asUintN(64, (r1 >> 32n) | (r1 << 32n));
        v[c] = BigInt.asUintN(64, v[c] + v[d]);
        let r2 = v[b] ^ v[c];
        v[b] = BigInt.asUintN(64, (r2 >> 24n) | (r2 << 40n));
        v[a] = BigInt.asUintN(64, v[a] + v[b] + y);
        let r3 = v[d] ^ v[a];
        v[d] = BigInt.asUintN(64, (r3 >> 16n) | (r3 << 48n));
        v[c] = BigInt.asUintN(64, v[c] + v[d]);
        let r4 = v[b] ^ v[c];
        v[b] = BigInt.asUintN(64, (r4 >> 63n) | (r4 << 1n));
      };

      for (let round = 0; round < 12; round++) {
        const s = BLAKE2B_SIGMA.subarray(round * 16, round * 16 + 16);
        G(0, 4, 8, 12, m[s[0]], m[s[1]]);
        G(1, 5, 9, 13, m[s[2]], m[s[3]]);
        G(2, 6, 10, 14, m[s[4]], m[s[5]]);
        G(3, 7, 11, 15, m[s[6]], m[s[7]]);
        G(0, 5, 10, 15, m[s[8]], m[s[9]]);
        G(1, 6, 11, 12, m[s[10]], m[s[11]]);
        G(2, 7, 8, 13, m[s[12]], m[s[13]]);
        G(3, 4, 9, 14, m[s[14]], m[s[15]]);
      }

      for (let i = 0; i < 8; i++) {
        h[i] ^= v[i] ^ v[i + 8];
      }
    };

    let offset = 0;
    while (offset < bytes.length) {
      if (blockLen === 128) {
        compress(false);
        blockLen = 0;
      }
      block[blockLen++] = bytes[offset++];
    }
    compress(true);

    const out = new Uint8Array(outlen);
    const outView = new DataView(out.buffer);
    const fullWords = Math.floor(outlen / 8);
    for (let i = 0; i < fullWords; i++) {
      outView.setBigUint64(i * 8, h[i], true);
    }
    const remBytes = outlen % 8;
    if (remBytes > 0) {
      const word = h[fullWords];
      const byteOffset = fullWords * 8;
      for (let i = 0; i < remBytes; i++) {
        out[byteOffset + i] = Number((word >> BigInt(i * 8)) & 0xffn);
      }
    }
    return out;
  }

  function encodeBase32(bytes) {
    let bits = 0;
    let value = 0;
    let output = "";
    for (let i = 0; i < bytes.length; i++) {
      value = (value << 8) | bytes[i];
      bits += 8;
      while (bits >= 5) {
        bits -= 5;
        const index = (value >>> bits) & 31;
        output += FIL_ALPHABET[index];
      }
    }
    if (bits > 0) {
      const index = (value << (5 - bits)) & 31;
      output += FIL_ALPHABET[index];
    }
    return output;
  }

  function decodeBase32(str) {
    let bits = 0;
    let value = 0;
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const idx = FIL_ALPHABET.indexOf(char);
      if (idx === -1) throw new Error('Invalid Base32 character: ' + char);
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        bits -= 8;
        bytes.push((value >>> bits) & 0xff);
      }
    }
    return new Uint8Array(bytes);
  }

  function encodeCBORInteger(val) {
    const n = BigInt(val);
    if (n < 0n) {
      const m = -n - 1n;
      if (m < 24n) {
        return new Uint8Array([Number(0x20n + m)]);
      } else if (m < 256n) {
        return new Uint8Array([0x38, Number(m)]);
      } else if (m < 65536n) {
        return new Uint8Array([0x39, Number((m >> 8n) & 0xffn), Number(m & 0xffn)]);
      } else if (m < 4294967296n) {
        return new Uint8Array([
          0x3a,
          Number((m >> 24n) & 0xffn),
          Number((m >> 16n) & 0xffn),
          Number((m >> 8n) & 0xffn),
          Number(m & 0xffn)
        ]);
      } else {
        const bytes = new Uint8Array(9);
        bytes[0] = 0x3b;
        for (let i = 0; i < 8; i++) {
          bytes[1 + i] = Number((m >> BigInt((7 - i) * 8)) & 0xffn);
        }
        return bytes;
      }
    } else {
      if (n < 24n) {
        return new Uint8Array([Number(n)]);
      } else if (n < 256n) {
        return new Uint8Array([0x18, Number(n)]);
      } else if (n < 65536n) {
        return new Uint8Array([0x19, Number((n >> 8n) & 0xffn), Number(n & 0xffn)]);
      } else if (n < 4294967296n) {
        return new Uint8Array([
          0x1a,
          Number((n >> 24n) & 0xffn),
          Number((n >> 16n) & 0xffn),
          Number((n >> 8n) & 0xffn),
          Number(n & 0xffn)
        ]);
      } else {
        const bytes = new Uint8Array(9);
        bytes[0] = 0x1b;
        for (let i = 0; i < 8; i++) {
          bytes[1 + i] = Number((n >> BigInt((7 - i) * 8)) & 0xffn);
        }
        return bytes;
      }
    }
  }

  function encodeCBORBytes(bytes) {
    const L = bytes.length;
    let header;
    if (L < 24) {
      header = new Uint8Array([0x40 + L]);
    } else if (L < 256) {
      header = new Uint8Array([0x58, L]);
    } else if (L < 65536) {
      header = new Uint8Array([0x59, (L >> 8) & 0xff, L & 0xff]);
    } else {
      header = new Uint8Array([
        0x5a,
        (L >> 24) & 0xff,
        (L >> 16) & 0xff,
        (L >> 8) & 0xff,
        L & 0xff
      ]);
    }
    const result = new Uint8Array(header.length + L);
    result.set(header);
    result.set(bytes, header.length);
    return result;
  }

  function encodeCBORBigInt(val) {
    const n = BigInt(val);
    if (n === 0n) {
      return new Uint8Array([0x40]); // major type 2, length 0
    }
    let hex = n.toString(16);
    if (hex.length % 2 !== 0) hex = '0' + hex;
    const len = hex.length / 2;
    const absBytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      absBytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    // Prepend 0x00 to indicate positive sign
    const fullBytes = new Uint8Array(len + 1);
    fullBytes[0] = 0x00;
    fullBytes.set(absBytes, 1);
    
    return encodeCBORBytes(fullBytes);
  }

  function serializeFilecoinMessage(msg, decodeAddressFn) {
    const versionBytes = encodeCBORInteger(msg.Version);
    const toBytes = encodeCBORBytes(decodeAddressFn(msg.To));
    const fromBytes = encodeCBORBytes(decodeAddressFn(msg.From));
    const nonceBytes = encodeCBORInteger(msg.Nonce);
    const valueBytes = encodeCBORBigInt(msg.Value);
    const gasLimitBytes = encodeCBORInteger(msg.GasLimit);
    const gasFeeCapBytes = encodeCBORBigInt(msg.GasFeeCap);
    const gasPremiumBytes = encodeCBORBigInt(msg.GasPremium);
    const methodBytes = encodeCBORInteger(msg.Method);
    const paramsBytes = encodeCBORBytes(new Uint8Array(0)); // empty bytes

    const totalLength = versionBytes.length + toBytes.length + fromBytes.length + nonceBytes.length +
                        valueBytes.length + gasLimitBytes.length + gasFeeCapBytes.length +
                        gasPremiumBytes.length + methodBytes.length + paramsBytes.length;

    const result = new Uint8Array(1 + totalLength);
    result[0] = 0x8a; // major type 4 (array), length 10
    let offset = 1;
    result.set(versionBytes, offset); offset += versionBytes.length;
    result.set(toBytes, offset); offset += toBytes.length;
    result.set(fromBytes, offset); offset += fromBytes.length;
    result.set(nonceBytes, offset); offset += nonceBytes.length;
    result.set(valueBytes, offset); offset += valueBytes.length;
    result.set(gasLimitBytes, offset); offset += gasLimitBytes.length;
    result.set(gasFeeCapBytes, offset); offset += gasFeeCapBytes.length;
    result.set(gasPremiumBytes, offset); offset += gasPremiumBytes.length;
    result.set(methodBytes, offset); offset += methodBytes.length;
    result.set(paramsBytes, offset); offset += paramsBytes.length;

    return result;
  }

  const B2FilecoinCbor = {
    blake2bGeneric,
    blake2b256(msg) { return blake2bGeneric(msg, 32); },
    blake2b160(msg) { return blake2bGeneric(msg, 20); },
    encodeBase32,
    decodeBase32,
    encodeCBORInteger,
    encodeCBORBytes,
    encodeCBORBigInt,
    serializeFilecoinMessage
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2FilecoinCbor;
  }
  if (global.window) {
    global.window.B2FilecoinCbor = B2FilecoinCbor;
  } else {
    global.B2FilecoinCbor = B2FilecoinCbor;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
