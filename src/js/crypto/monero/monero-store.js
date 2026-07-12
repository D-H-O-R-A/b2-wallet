/**
 * B2 Wallet — Monero Encrypted Data Stores Submodule
 *
 * Implements AES-GCM local storage encryption, decryption and stores
 * for caching balance and transaction history in the Monero (XMR) module.
 *
 * Developed by Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  function getBase58Submodule() {
    const b58 = global.B2MoneroBase58 || 
                (global.window && global.window.B2MoneroBase58) || 
                (typeof window !== 'undefined' && window.B2MoneroBase58);
    if (!b58) {
      throw new Error("B2MoneroBase58 submodule is not loaded");
    }
    return b58;
  }

  // Local helpers derived from base58 submodule
  function hexToBytes(hex) { return getBase58Submodule().hexToBytes(hex); }
  function bytesToHex(bytes) { return getBase58Submodule().bytesToHex(bytes); }

  async function deriveStoreKey(privateViewKeyHex) {
    const viewKeyBytes = hexToBytes(privateViewKeyHex);
    const crypto = global.window && global.window.crypto || global.crypto || globalThis.crypto;
    return await crypto.subtle.importKey(
      "raw",
      viewKeyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptData(dataText, privateViewKeyHex) {
    const key = await deriveStoreKey(privateViewKeyHex);
    const crypto = global.window && global.window.crypto || global.crypto || globalThis.crypto;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(dataText);
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoded
    );
    
    const ivHex = bytesToHex(iv);
    const cipherHex = bytesToHex(new Uint8Array(ciphertext));
    return ivHex + ":" + cipherHex;
  }

  async function decryptData(encryptedHex, privateViewKeyHex) {
    if (!encryptedHex) return null;
    const parts = encryptedHex.split(":");
    if (parts.length !== 2) return null;
    const iv = hexToBytes(parts[0]);
    const ciphertext = hexToBytes(parts[1]);
    
    const key = await deriveStoreKey(privateViewKeyHex);
    try {
      const crypto = global.window && global.window.crypto || global.crypto || globalThis.crypto;
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
      );
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error("Failed to decrypt Monero store:", e);
      return null;
    }
  }

  const MoneroCacheStore = {
    async save(address, privateViewKeyHex, data) {
      try {
        const key = `xmr_cache_${address}`;
        const encrypted = await encryptData(JSON.stringify(data), privateViewKeyHex);
        localStorage.setItem(key, encrypted);
      } catch (e) {
        console.error("Failed to save Monero cache:", e);
      }
    },
    async load(address, privateViewKeyHex) {
      try {
        const key = `xmr_cache_${address}`;
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        const decrypted = await decryptData(encrypted, privateViewKeyHex);
        return decrypted ? JSON.parse(decrypted) : null;
      } catch (e) {
        console.error("Failed to load Monero cache:", e);
        return null;
      }
    }
  };

  const MoneroHistoryStore = {
    async save(address, privateViewKeyHex, txs) {
      try {
        const key = `xmr_history_${address}`;
        const encrypted = await encryptData(JSON.stringify(txs), privateViewKeyHex);
        localStorage.setItem(key, encrypted);
      } catch (e) {
        console.error("Failed to save Monero history:", e);
      }
    },
    async load(address, privateViewKeyHex) {
      try {
        const key = `xmr_history_${address}`;
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        const decrypted = await decryptData(encrypted, privateViewKeyHex);
        return decrypted ? JSON.parse(decrypted) : null;
      } catch (e) {
        console.error("Failed to load Monero history:", e);
        return null;
      }
    }
  };

  const B2MoneroStore = {
    deriveStoreKey,
    encryptData,
    decryptData,
    MoneroCacheStore,
    MoneroHistoryStore
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2MoneroStore;
  }
  if (global.window) {
    global.window.B2MoneroStore = B2MoneroStore;
  } else {
    global.B2MoneroStore = B2MoneroStore;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
