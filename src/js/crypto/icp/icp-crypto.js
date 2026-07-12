/**
 * B2 Wallet — Internet Computer (ICP) Cryptographic Submodule
 *
 * Implements low-level cryptography and formats required for DFINITY protocol:
 * - Pure-JS SHA-224 hash function.
 * - Optimized IEEE CRC-32 checksum with pre-computed table lookup.
 * - standard lowercase DFINITY Base32 codec.
 * - Array buffer conversion utilities (hexToBytes, bytesToHex, concatBytes).
 *
 * Developed by Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  /**
   * Pure JS SHA-224 implementation.
   * Matches official test vectors exactly.
   */
  function sha224(data) {
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
    const K = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];

    // SHA-224 initial constants
    let H = [
      0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
      0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4
    ];

    const bitLen = bytes.length * 8;
    const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);

    view.setUint32(padded.length - 4, bitLen >>> 0);
    view.setUint32(padded.length - 8, (bitLen / 0x100000000) >>> 0);

    const rotr32 = (x, n) => ((x >>> n) | (x << (32 - n))) >>> 0;

    for (let off = 0; off < padded.length; off += 64) {
      const W = new Uint32Array(64);
      for (let i = 0; i < 16; i++) W[i] = view.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr32(W[i-15], 7) ^ rotr32(W[i-15], 18) ^ (W[i-15] >>> 3);
        const s1 = rotr32(W[i-2], 17) ^ rotr32(W[i-2], 19) ^ (W[i-2] >>> 10);
        W[i] = (W[i-16] + s0 + W[i-7] + s1) >>> 0;
      }

      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1  = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
        const ch  = ((e & f) ^ (~e & g)) >>> 0;
        const T1  = (h + S1 + ch + K[i] + W[i]) >>> 0;
        const S0  = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
        const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        const T2  = (S0 + maj) >>> 0;
        h = g; g = f; f = e;
        e = (d + T1) >>> 0;
        d = c; c = b; b = a;
        a = (T1 + T2) >>> 0;
      }

      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }

    const out = new Uint8Array(28);
    const outView = new DataView(out.buffer);
    for (let i = 0; i < 7; i++) outView.setUint32(i * 4, H[i]);
    return out;
  }

  // Pre-calculated CRC-32 table for faster computation
  const crcTable = (function() {
    let c;
    const table = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      table[n] = c;
    }
    return table;
  })();

  /**
   * Pure JS IEEE CRC-32 checksum.
   */
  function crc32(bytes) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

  /**
   * Base32 encoding with no padding (standard lowercase DFINITY Base32).
   */
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
        output += ALPHABET[index];
      }
    }
    if (bits > 0) {
      const index = (value << (5 - bits)) & 31;
      output += ALPHABET[index];
    }
    return output;
  }

  /**
   * Base32 decoding with no padding.
   */
  function decodeBase32(str) {
    let bits = 0;
    let value = 0;
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const idx = ALPHABET.indexOf(char);
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

  // Helper to convert hex to Uint8Array
  function hexToBytes(hex) {
    const cleanHex = hex.startsWith('0x') ? hex.substring(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  // Helper to convert bytes to hex
  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Helper to concat arrays
  function concatBytes(arrays) {
    let totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    let result = new Uint8Array(totalLength);
    let offset = 0;
    for (let arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  const B2IcpCrypto = {
    sha224,
    crc32,
    encodeBase32,
    decodeBase32,
    hexToBytes,
    bytesToHex,
    concatBytes
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2IcpCrypto;
  }
  if (global.window) {
    global.window.B2IcpCrypto = B2IcpCrypto;
  } else {
    global.B2IcpCrypto = B2IcpCrypto;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
