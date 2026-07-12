/**
 * B2 Wallet — Monero Block-Based Base58 Cryptographic Submodule
 *
 * Implements the custom block-based Base58 encoding and decoding scheme 
 * specific to Monero (XMR) addresses.
 *
 * Developed by Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const ENCODED_BLOCK_SIZES = [0, 2, 3, 5, 6, 7, 9, 10, 11];
  const DECODED_BLOCK_SIZES = {
    2: 1, 3: 2, 5: 3, 6: 4, 7: 5, 9: 6, 10: 7, 11: 8
  };

  // Helper conversions
  function bytesToBigIntLE(bytes) {
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result += BigInt(bytes[i]) << (8n * BigInt(i));
    }
    return result;
  }

  function bigIntToBytesLE(num, length = 32) {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Number((num >> (8n * BigInt(i))) & 0xFFn);
    }
    return bytes;
  }

  function hexToBytes(hex) {
    if (!hex) return new Uint8Array(0);
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    return new Uint8Array(clean.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function encodeBlock(bytes, size) {
    let num = 0n;
    for (let i = 0; i < size; i++) {
      num = (num << 8n) + BigInt(bytes[i]);
    }
    let encodedSize = ENCODED_BLOCK_SIZES[size];
    let result = "";
    for (let i = 0; i < encodedSize; i++) {
      const rem = num % 58n;
      result = ALPHABET[Number(rem)] + result;
      num = num / 58n;
    }
    return result;
  }

  function decodeBlock(str) {
    const size = DECODED_BLOCK_SIZES[str.length];
    if (size === undefined) {
      throw new Error("Invalid character block length: " + str.length);
    }
    let num = 0n;
    for (let i = 0; i < str.length; i++) {
      const charIndex = ALPHABET.indexOf(str[i]);
      if (charIndex === -1) {
        throw new Error("Invalid Base58 character: " + str[i]);
      }
      num = num * 58n + BigInt(charIndex);
    }
    const bytes = new Uint8Array(size);
    for (let i = size - 1; i >= 0; i--) {
      bytes[i] = Number(num & 0xFFn);
      num = num >> 8n;
    }
    return bytes;
  }

  const B2MoneroBase58 = {
    encodeBase58(bytes) {
      let result = "";
      const fullBlocks = Math.floor(bytes.length / 8);
      for (let i = 0; i < fullBlocks; i++) {
        const block = bytes.subarray(i * 8, i * 8 + 8);
        result += encodeBlock(block, 8);
      }
      const remainder = bytes.length % 8;
      if (remainder > 0) {
        const block = bytes.subarray(fullBlocks * 8);
        result += encodeBlock(block, remainder);
      }
      return result;
    },

    decodeBase58(str) {
      let bytes = [];
      const fullBlocks = Math.floor(str.length / 11);
      for (let i = 0; i < fullBlocks; i++) {
        const blockStr = str.substring(i * 11, i * 11 + 11);
        const blockBytes = decodeBlock(blockStr);
        bytes.push(...blockBytes);
      }
      const remainder = str.length % 11;
      if (remainder > 0) {
        const blockStr = str.substring(fullBlocks * 11);
        const blockBytes = decodeBlock(blockStr);
        bytes.push(...blockBytes);
      }
      return new Uint8Array(bytes);
    },

    bytesToBigIntLE,
    bigIntToBytesLE,
    hexToBytes,
    bytesToHex
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2MoneroBase58;
  }
  if (global.window) {
    global.window.B2MoneroBase58 = B2MoneroBase58;
  } else {
    global.B2MoneroBase58 = B2MoneroBase58;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
