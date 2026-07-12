/**
 * B2 Wallet - Mecanismo de Derivação de Chaves Multichain (Key Derivation Engine)
 * 
 * Tech Lead: Diego Oris (Better2Better)
 * 
 * Este arquivo atua como fachada para os utilitários de BIP39, Formatadores e
 * Validadores de endereços criptográficos.
 */

class KeyDerivationEngine {
  constructor() {
    const utils = (typeof window !== 'undefined' && window.B2Bip39Utils) || 
                  (typeof globalThis !== 'undefined' && globalThis.B2Bip39Utils) || 
                  (typeof require !== 'undefined' ? require('./derivation/bip39-utils').B2Bip39Utils : null);
    this.bip39Wordlist = utils ? utils.bip39Wordlist : [];
  }

  generateMnemonic() {
    const utils = (typeof window !== 'undefined' && window.B2Bip39Utils) || 
                  (typeof globalThis !== 'undefined' && globalThis.B2Bip39Utils) || 
                  (typeof require !== 'undefined' ? require('./derivation/bip39-utils').B2Bip39Utils : null);
    return utils.generateMnemonic();
  }

  validateMnemonic(mnemonic) {
    const utils = (typeof window !== 'undefined' && window.B2Bip39Utils) || 
                  (typeof globalThis !== 'undefined' && globalThis.B2Bip39Utils) || 
                  (typeof require !== 'undefined' ? require('./derivation/bip39-utils').B2Bip39Utils : null);
    return utils.validateMnemonic(mnemonic);
  }

  deriveMasterSeed(mnemonic) {
    const utils = (typeof window !== 'undefined' && window.B2Bip39Utils) || 
                  (typeof globalThis !== 'undefined' && globalThis.B2Bip39Utils) || 
                  (typeof require !== 'undefined' ? require('./derivation/bip39-utils').B2Bip39Utils : null);
    return utils.deriveMasterSeed(mnemonic);
  }

  derivePrivateKey(masterSeed, coinType, index = 0) {
    const utils = (typeof window !== 'undefined' && window.B2Bip39Utils) || 
                  (typeof globalThis !== 'undefined' && globalThis.B2Bip39Utils) || 
                  (typeof require !== 'undefined' ? require('./derivation/bip39-utils').B2Bip39Utils : null);
    return utils.derivePrivateKey(masterSeed, coinType, index);
  }

  keccak_f(state) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.keccak_f(state);
  }

  keccak256(message) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.keccak256(message);
  }

  keccak256Bytes(message) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.keccak256Bytes(message);
  }

  blake2b256(message) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.blake2b256(message);
  }

  toChecksumAddress(address) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.toChecksumAddress(address);
  }

  encodeBase58(buffer) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.encodeBase58(buffer);
  }

  decodeBase58(string) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.decodeBase58(string);
  }

  encodeBase32(buffer) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.encodeBase32(buffer);
  }

  decodeBase32(string) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.decodeBase32(string);
  }

  encodeBech32(buffer) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.encodeBech32(buffer);
  }

  decodeBech32(str) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.decodeBech32(str);
  }

  calculateStellarCRC16(buffer) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.calculateStellarCRC16(buffer);
  }

  calculateWavesChecksum(buffer) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.calculateWavesChecksum(buffer);
  }

  doubleSha256(bytes) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.doubleSha256(bytes);
  }

  deriveZcashSaplingAddressFromPrivateKey(privBytes, index = 0) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.deriveZcashSaplingAddressFromPrivateKey(privBytes, index);
  }

  deriveZcashOrchardAddressFromPrivateKey(privBytes, index = 0) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.deriveZcashOrchardAddressFromPrivateKey(privBytes, index);
  }

  deriveZcashUnifiedAddressFromPrivateKey(privBytes, index = 0) {
    const formatter = (typeof window !== 'undefined' && window.B2AddressFormatter) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressFormatter) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-formatter').B2AddressFormatter : null);
    return formatter.deriveZcashUnifiedAddressFromPrivateKey(privBytes, index);
  }

  validateAddress(address, networkKey, engineName = null) {
    const validator = (typeof window !== 'undefined' && window.B2AddressValidator) || 
                      (typeof globalThis !== 'undefined' && globalThis.B2AddressValidator) || 
                      (typeof require !== 'undefined' ? require('./derivation/address-validator').B2AddressValidator : null);
    return validator.validateAddress(address, networkKey, engineName);
  }

  deriveAddress(privateKeyHex, networkKey, engineName = null, addressType = null) {
    const privBytes = new Uint8Array(privateKeyHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
    const pubKeyBytes = this.blake2b256(privBytes); // 32 bytes

    let key = networkKey.toUpperCase();
    if (engineName) {
      const eng = engineName.toUpperCase();
      if (eng === 'EVM') key = 'EVM';
      else if (eng === 'BITCOIN') key = 'BTC';
      else if (eng === 'WAVES') key = 'WAVES';
      else if (eng === 'SOLANA') key = 'SOLANA';
      else if (eng === 'TRON') key = 'TRON';
    }

    const getEngine = (name) => {
      return (typeof window !== 'undefined' && window[name]) || 
             (typeof global !== 'undefined' && global[name]) || 
             (globalThis && globalThis[name]);
    };

    if (key === 'BTC' || key === 'BITCOIN') {
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      const engine = getEngine('B2BitcoinEngine');
      if (engine && typeof engine.deriveAddress === 'function') {
        try {
          return engine.deriveAddress(privBytes, addressType || 'bech32');
        } catch (e) {}
      }
      const hash160 = this.keccak256Bytes(pubKeyBytes).subarray(0, 20);
      const prefix = isTestnet ? 'tb1q' : 'bc1q';
      return prefix + this.encodeBech32(hash160);
    }

    if (key === 'LTC' || key === 'LITECOIN') {
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      const engine = getEngine('B2LitecoinEngine');
      if (engine && typeof engine.deriveAddress === 'function') {
        try {
          return engine.deriveAddress(privBytes, addressType || 'legacy');
        } catch (e) {}
      }
      const hash160 = this.keccak256Bytes(pubKeyBytes).subarray(0, 20);
      const payload = new Uint8Array(21);
      payload[0] = isTestnet ? 0x6F : 0x30;
      payload.set(hash160, 1);
      const cs = this.keccak256Bytes(this.keccak256Bytes(payload)).subarray(0, 4);
      const full = new Uint8Array(25);
      full.set(payload); full.set(cs, 21);
      return this.encodeBase58(full);
    }

    if (key === 'DOGE') {
      const engine = getEngine('B2DogecoinEngine');
      if (engine && typeof engine.deriveAddress === 'function') {
        return engine.deriveAddress(privBytes, addressType || 'legacy');
      }
      const hash160 = this.keccak256Bytes(pubKeyBytes).subarray(0, 20);
      const payload = new Uint8Array(21);
      payload[0] = 0x1E;
      payload.set(hash160, 1);
      const cs = this.keccak256Bytes(this.keccak256Bytes(payload)).subarray(0, 4);
      const full = new Uint8Array(25);
      full.set(payload); full.set(cs, 21);
      return this.encodeBase58(full);
    }

    if (key === 'BCH') {
      const engine = getEngine('B2BitcoinCashEngine');
      if (engine && typeof engine.deriveAddress === 'function') {
        return engine.deriveAddress(privBytes, addressType || 'cashaddr');
      }
      const hash160 = this.keccak256Bytes(pubKeyBytes).subarray(0, 20);
      return 'bitcoincash:q' + Array.from(hash160).map(b => b.toString(16).padStart(2,'0')).join('').substring(0,40);
    }

    if (key === 'DASH' || key === 'DASH_P2SH') {
      const broadcaster = getEngine('B2DashBroadcaster');
      if (key === 'DASH_P2SH') {
        if (broadcaster && broadcaster.deriveDashP2SHAddress) {
          return broadcaster.deriveDashP2SHAddress(pubKeyBytes);
        }
        const hash160 = this.keccak256Bytes(pubKeyBytes).subarray(0, 20);
        const payload = new Uint8Array(21);
        payload[0] = 0x10;
        payload.set(hash160, 1);
        const cs = this.keccak256Bytes(this.keccak256Bytes(payload)).subarray(0, 4);
        const full = new Uint8Array(25);
        full.set(payload); full.set(cs, 21);
        return this.encodeBase58(full);
      } else {
        if (broadcaster && broadcaster.deriveDashP2PKHAddress) {
          return broadcaster.deriveDashP2PKHAddress(pubKeyBytes);
        }
        const hash160 = this.keccak256Bytes(pubKeyBytes).subarray(0, 20);
        const payload = new Uint8Array(21);
        payload[0] = 0x4C;
        payload.set(hash160, 1);
        const cs = this.keccak256Bytes(this.keccak256Bytes(payload)).subarray(0, 4);
        const full = new Uint8Array(25);
        full.set(payload); full.set(cs, 21);
        return this.encodeBase58(full);
      }
    }

    if (key === 'ZEC' || key === 'ZCASH' || key === 'ZEC_TRANSPARENT' || key === 'ZCASH_TRANSPARENT') {
      const broadcaster = getEngine('B2ZcashBroadcaster');
      if (broadcaster && broadcaster.deriveZcashTAddress) {
        return broadcaster.deriveZcashTAddress(pubKeyBytes);
      }
      const hash160 = this.keccak256Bytes(pubKeyBytes).subarray(0, 20);
      const payload = new Uint8Array(22);
      payload[0] = 0x1C; payload[1] = 0xB8;
      payload.set(hash160, 2);
      const cs = this.keccak256Bytes(this.keccak256Bytes(payload)).subarray(0, 4);
      const full = new Uint8Array(26);
      full.set(payload); full.set(cs, 22);
      return this.encodeBase58(full);
    }

    if (key === 'ZEC_SAPLING' || key === 'ZEC_SHIELDED' || key === 'ZCASH_SHIELDED') {
      return this.deriveZcashSaplingAddressFromPrivateKey(privBytes, 0);
    }

    if (key === 'ZEC_UNIFIED' || key === 'ZCASH_UNIFIED') {
      return this.deriveZcashUnifiedAddressFromPrivateKey(privBytes, 0);
    }

    if (key === 'WAVES' || key === 'AMZX' || key === 'PLO' || key === 'TURTLE') {
      const origNetKey = networkKey.toUpperCase();
      const chainId = origNetKey === 'WAVES' ? 87 : origNetKey === 'AMZX' ? 65 : origNetKey === 'PLO' ? 80 : 76;

      const blakePub  = this.blake2b256(pubKeyBytes);
      const keccakPub = this.keccak256Bytes(blakePub);
      const accountHash = keccakPub.subarray(0, 20);

      const body = new Uint8Array(22);
      body[0] = 0x01;
      body[1] = chainId;
      body.set(accountHash, 2);

      const checksum = this.calculateWavesChecksum(body);

      const wavesAddr = new Uint8Array(26);
      wavesAddr.set(body);
      wavesAddr.set(checksum, 22);
      return this.encodeBase58(wavesAddr);
    }

    if (key === 'SOLANA' || key === 'SOL') {
      const solGlobal = getEngine('solanaWeb3');
      if (solGlobal) {
        try {
          const privKeyBytes = new Uint8Array(privateKeyHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
          const keypair = solGlobal.Keypair.fromSeed(privKeyBytes);
          return keypair.publicKey.toBase58();
        } catch (e) {}
      }
      return this.encodeBase58(pubKeyBytes);
    }

    if (key === 'NEO') {
      const neonGlobal = getEngine('Neon');
      if (neonGlobal) {
        try {
          const account = new neonGlobal.wallet.Account(privateKeyHex);
          return account.address;
        } catch (e) {}
      }
      const hash160 = this.keccak256Bytes(pubKeyBytes).subarray(0, 20);
      const payload = new Uint8Array(21);
      payload[0] = 0x35;
      payload.set(hash160, 1);
      const cs = this.keccak256Bytes(this.keccak256Bytes(payload)).subarray(0, 4);
      const full = new Uint8Array(25);
      full.set(payload); full.set(cs, 21);
      return this.encodeBase58(full);
    }

    if (key === 'CARDANO' || key === 'ADA') {
      const engine = getEngine('B2CardanoEngine');
      if (engine && typeof engine.deriveAddress === 'function') {
        return engine.deriveAddress(privateKeyHex, addressType);
      }
      const hash = this.keccak256Bytes(pubKeyBytes).subarray(0, 28);
      return 'addr1' + this.encodeBech32(hash);
    }

    if (key === 'TRON' || key === 'TRX') {
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      const keccakHash = this.keccak256Bytes(pubKeyBytes);
      const tronHash   = keccakHash.subarray(12, 32);
      const payload    = new Uint8Array(21);
      payload[0] = isTestnet ? 0xa0 : 0x41;
      payload.set(tronHash, 1);
      const cs = this.keccak256Bytes(this.keccak256Bytes(payload)).subarray(0, 4);
      const full = new Uint8Array(25);
      full.set(payload); full.set(cs, 21);
      return this.encodeBase58(full);
    }

    if (key === 'STELLAR' || key === 'XLM') {
      const engine = getEngine('B2StellarEngine');
      if (engine && typeof engine.deriveAddress === 'function') {
        return engine.deriveAddress(privateKeyHex);
      }
      const payload = new Uint8Array(35);
      payload[0] = 0x30;
      payload.set(pubKeyBytes, 1);
      const crc = this.calculateStellarCRC16(payload.subarray(0, 33));
      payload[33] = crc & 0xFF;
      payload[34] = (crc >>> 8) & 0xFF;
      return this.encodeBase32(payload);
    }

    if (key === 'MONERO' || key === 'XMR') {
      const moneroEngine = getEngine('B2MoneroEngine');
      if (moneroEngine && typeof moneroEngine.deriveKeysFromPrivateKey === 'function') {
        return moneroEngine.deriveKeysFromPrivateKey(privateKeyHex).address;
      }
      const viewKey = this.blake2b256(privBytes);
      const payload = new Uint8Array(69);
      payload[0] = 0x12;
      payload.set(pubKeyBytes, 1);
      payload.set(viewKey, 33);
      const cs = this.keccak256Bytes(payload.subarray(0, 65)).subarray(0, 4);
      payload.set(cs, 65);
      return this.encodeBase58(payload);
    }

    if (key === 'POLKADOT' || key === 'DOT') {
      const polkadotCrypto = getEngine('PolkadotCrypto');
      if (polkadotCrypto && typeof polkadotCrypto.encodeAddress === 'function') {
        try {
          return polkadotCrypto.encodeAddress(pubKeyBytes, 0);
        } catch (e) {}
      }
      const ss58 = new Uint8Array(35);
      ss58[0] = 0x00;
      ss58.set(pubKeyBytes, 1);
      const encoder = new TextEncoder();
      const prefix  = encoder.encode('SS58PRE');
      const toHash  = new Uint8Array(prefix.length + 33);
      toHash.set(prefix); toHash.set(ss58.subarray(0, 33), prefix.length);
      const cs = this.blake2b256(toHash).subarray(0, 2);
      ss58[33] = cs[0]; ss58[34] = cs[1];
      return this.encodeBase58(ss58);
    }

    if (key === 'FILECOIN' || key === 'FIL') {
      const filEngine = getEngine('B2FilecoinEngine');
      if (filEngine && typeof filEngine.deriveAddressFromPublicKey === 'function') {
        try {
          const pubKey = filEngine.getPublicKeyFromPrivateKey(privateKeyHex);
          return filEngine.deriveAddressFromPublicKey(pubKey);
        } catch (e) {}
      }
      const hash = this.keccak256Bytes(pubKeyBytes).subarray(0, 20);
      return 'f1' + Array.from(hash).map(b => b.toString(16).padStart(2,'0')).join('');
    }

    if (key === 'ICP') {
      const icpEngine = getEngine('B2IcpEngine');
      const solGlobal = getEngine('solanaWeb3');
      if (icpEngine && solGlobal) {
        try {
          const privKeyBytes = new Uint8Array(privateKeyHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
          const keypair = solGlobal.Keypair.fromSeed(privKeyBytes);
          const publicKey = keypair.publicKey.toBytes();
          return icpEngine.deriveAccountIdentifierFromPublicKey(publicKey);
        } catch (e) {}
      }
      const hash = this.keccak256Bytes(pubKeyBytes);
      return Array.from(hash).map(b => b.toString(16).padStart(2,'0')).join('');
    }

    const ethGlobal = getEngine('ethers');
    if (ethGlobal) {
      try {
        const wallet = new ethGlobal.Wallet("0x" + privateKeyHex);
        return wallet.address;
      } catch (e) {}
    }
    const keccakHash = this.keccak256Bytes(pubKeyBytes);
    const addrBytes  = keccakHash.subarray(12, 32);
    const rawAddr    = '0x' + Array.from(addrBytes).map(b => b.toString(16).padStart(2,'0')).join('');
    return this.toChecksumAddress(rawAddr);
  }
}

// Exportação global universal
if (typeof window !== "undefined") {
  window.B2KeyDerivationEngine = new KeyDerivationEngine();
}
if (typeof globalThis !== "undefined") {
  globalThis.B2KeyDerivationEngine = new KeyDerivationEngine();
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { B2KeyDerivationEngine: new KeyDerivationEngine() };
}
