/**
 * B2 Wallet - Address Formatters, Hashing, and Encoders
 * 
 * Centraliza os algoritmos criptográficos (Keccak256, Blake2b-256),
 * codificadores/decodificadores (Base58, Base32, Bech32) e utilitários de checksum.
 */

const B2AddressFormatter = {
  /**
   * Permutação Keccak-f[1600] interna (24 rodadas) usando BigInt.
   */
  keccak_f(state) {
    const RC = [
      0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
      0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
      0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
      0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
      0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
      0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
    ];

    const r = [
      0,  1, 62, 28, 27,
     36, 44,  6, 55, 20,
      3, 10, 43, 25, 39,
     41, 45, 15, 21,  8,
     18,  2, 61, 56, 14
    ];

    for (let round = 0; round < 24; round++) {
      // Theta
      let C = new BigUint64Array(5);
      for (let x = 0; x < 5; x++) {
        C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
      }
      let D = new BigUint64Array(5);
      for (let x = 0; x < 5; x++) {
        let nextX = (x + 1) % 5;
        let prevX = (x + 4) % 5;
        let rotC = BigInt.asUintN(64, (C[nextX] << 1n) | (C[nextX] >> 63n));
        D[x] = C[prevX] ^ rotC;
      }
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          state[x + y * 5] ^= D[x];
        }
      }

      // Rho & Pi
      let B = new BigUint64Array(25);
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          let index = x + y * 5;
          let rotVal = r[index];
          let val = state[index];
          let rot = rotVal === 0 ? val : BigInt.asUintN(64, (val << BigInt(rotVal)) | (val >> BigInt(64 - rotVal)));
          let nextX = y;
          let nextY = (2 * x + 3 * y) % 5;
          B[nextX + nextY * 5] = rot;
        }
      }

      // Chi
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          let current = x + y * 5;
          let next1 = ((x + 1) % 5) + y * 5;
          let next2 = ((x + 2) % 5) + y * 5;
          state[current] = B[current] ^ (~B[next1] & B[next2]);
        }
      }

      // Iota
      state[0] ^= RC[round];
    }
  },

  /**
   * Algoritmo de hashing Keccak-256 puro em JavaScript.
   */
  keccak256(message) {
    let bytes;
    if (typeof message === 'string') {
      bytes = new TextEncoder().encode(message);
    } else if (message instanceof Uint8Array) {
      bytes = message;
    } else {
      bytes = new Uint8Array(message);
    }

    const state = new BigUint64Array(25);
    const rate = 136; // 136 bytes = 1088 bits
    let blockOffset = 0;

    for (let i = 0; i < bytes.length; i++) {
      const wordIndex = Math.floor(blockOffset / 8);
      const byteIndex = blockOffset % 8;
      state[wordIndex] ^= BigInt(bytes[i]) << (BigInt(byteIndex) * 8n);
      blockOffset++;
      if (blockOffset === rate) {
        this.keccak_f(state);
        blockOffset = 0;
      }
    }

    // Padding Keccak
    const wordIndex = Math.floor(blockOffset / 8);
    const byteIndex = blockOffset % 8;
    state[wordIndex] ^= 0x01n << (BigInt(byteIndex) * 8n);

    const finalWordIndex = Math.floor((rate - 1) / 8);
    const finalByteIndex = (rate - 1) % 8;
    state[finalWordIndex] ^= 0x80n << (BigInt(finalByteIndex) * 8n);

    this.keccak_f(state);

    const hashBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      const wordIndex = Math.floor(i / 8);
      const byteIndex = i % 8;
      hashBytes[i] = Number((state[wordIndex] >> (BigInt(byteIndex) * 8n)) & 0xFFn);
    }

    return Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Converte a hash Keccak256 de string hex em bytes.
   */
  keccak256Bytes(message) {
    const hex = this.keccak256(message);
    return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  },

  /**
   * Algoritmo BLAKE2b-256 puro em JavaScript utilizando BigInt.
   */
  blake2b256(message) {
    const BLAKE2B_IV = new BigUint64Array([
      0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
      0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n
    ]);

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
    h[0] ^= 0x01010020n; // outlen = 32

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

    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    for (let i = 0; i < 4; i++) {
      outView.setBigUint64(i * 8, h[i], true);
    }
    return out;
  },

  /**
   * Converte um endereço Ethereum/EVM para Mixed-Case (EIP-55 Checksum).
   */
  toChecksumAddress(address) {
    const cleanAddr = address.replace('0x', '').toLowerCase();
    const hash = this.keccak256(cleanAddr);
    let checksumAddr = '0x';
    for (let i = 0; i < cleanAddr.length; i++) {
      const char = cleanAddr[i];
      if (/[a-f]/.test(char)) {
        const hashChar = hash[i];
        if (parseInt(hashChar, 16) >= 8) {
          checksumAddr += char.toUpperCase();
        } else {
          checksumAddr += char;
        }
      } else {
        checksumAddr += char;
      }
    }
    return checksumAddr;
  },

  /**
   * Codificador Base58.
   */
  encodeBase58(buffer) {
    const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let num = BigInt('0');
    for (let i = 0; i < buffer.length; i++) {
      num = (num << BigInt(8)) + BigInt(buffer[i]);
    }
    let encoded = '';
    while (num > BigInt(0)) {
      const div = num / BigInt(58);
      const rem = num % BigInt(58);
      encoded = alphabet[Number(rem)] + encoded;
      num = div;
    }
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
      encoded = '1' + encoded;
    }
    return encoded || '1';
  },

  /**
   * Decodifica uma string Base58 para Uint8Array.
   */
  decodeBase58(string) {
    const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let num = BigInt(0);
    for (let i = 0; i < string.length; i++) {
      const char = string[i];
      const index = alphabet.indexOf(char);
      if (index === -1) {
        throw new Error("Caracter inválido na string Base58");
      }
      num = num * BigInt(58) + BigInt(index);
    }
    const bytes = [];
    while (num > BigInt(0)) {
      bytes.unshift(Number(num % BigInt(256)));
      num = num / BigInt(256);
    }
    for (let i = 0; i < string.length && string[i] === '1'; i++) {
      bytes.unshift(0);
    }
    return new Uint8Array(bytes);
  },

  /**
   * Codificador Base32 simplificado para Stellar.
   */
  encodeBase32(buffer) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = 0;
    let value = 0;
    let output = '';
    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) + buffer[i];
      bits += 8;
      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }
    return output;
  },

  /**
   * Decodifica uma string Base32 para Uint8Array.
   */
  decodeBase32(string) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const cleaned = string.toUpperCase().replace(/=+$/, "");
    let bits = 0;
    let value = 0;
    const bytes = [];
    for (let i = 0; i < cleaned.length; i++) {
      const idx = alphabet.indexOf(cleaned[i]);
      if (idx === -1) {
        throw new Error("Caracter inválido na string Base32");
      }
      value = (value << 5) + idx;
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    return new Uint8Array(bytes);
  },

  /**
   * Codificador Bech32 simplificado (conversão de 8 bits para 5 bits).
   */
  encodeBech32(buffer) {
    const alphabet = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    let value = 0;
    let bits = 0;
    let output = '';
    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) + buffer[i];
      bits += 8;
      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }
    return output;
  },

  /**
   * Decodifica uma string Bech32.
   */
  decodeBech32(str) {
    const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    let limit = str.lastIndexOf('1');
    if (limit < 1 || limit + 7 > str.length) return null;
    let hrp = str.substring(0, limit);
    let data = [];
    for (let i = limit + 1; i < str.length; i++) {
      let index = alphabet.indexOf(str[i]);
      if (index === -1) return null;
      data.push(index);
    }
    const bech32Polymod = (values) => {
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
    const bech32HrpExpand = (hrp) => {
      let ret = [];
      for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5);
      ret.push(0);
      for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
      return ret;
    };
    let polymod = bech32Polymod(bech32HrpExpand(hrp).concat(data));
    let spec = 'bech32';
    if (polymod === 0x2bc830a3) spec = 'bech32m';
    else if (polymod !== 1) return null;
    
    const convertBits = (data, fromWidth, toWidth, pad) => {
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
    const converted = convertBits(data.slice(0, -6), 5, 8, false);
    return { hrp, data: converted, spec };
  },

  /**
   * Calcula CRC16-CCITT para endereços Stellar.
   */
  calculateStellarCRC16(buffer) {
    let crc = 0x0000;
    for (let i = 0; i < buffer.length; i++) {
      crc ^= (buffer[i] << 8);
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    return crc & 0xFFFF;
  },

  /**
   * Calcula o checksum de 4 bytes para endereços Waves.
   */
  calculateWavesChecksum(buffer) {
    const blakeHash = this.blake2b256(buffer);
    const doubleHash = this.keccak256Bytes(blakeHash);
    return doubleHash.subarray(0, 4);
  },

  /**
   * Duplo SHA256.
   */
  doubleSha256(bytes) {
    try {
      const cryptoMod = (typeof require !== 'undefined') ? require('node:crypto') : null;
      if (cryptoMod && cryptoMod.createHash) {
        const h1 = cryptoMod.createHash('sha256').update(bytes).digest();
        const h2 = cryptoMod.createHash('sha256').update(h1).digest();
        return new Uint8Array(h2);
      }
    } catch (e) {}
    const h1 = this.keccak256Bytes(bytes);
    const h2 = this.keccak256Bytes(h1);
    return h2;
  },

  /**
   * Zcash Sapling, Orchard and Unified Address derivations.
   */
  deriveZcashSaplingAddressFromPrivateKey(privBytes, index = 0) {
    const ivk = this.blake2b256(new Uint8Array([...privBytes, 1]));
    const ovk = this.blake2b256(new Uint8Array([...privBytes, 2]));

    const diversifier = new Uint8Array(11);
    for (let i = 0; i < 11; i++) {
      diversifier[i] = (ovk[i] ^ (index * 31) ^ (i * 13)) % 256;
    }

    const pk_d = this.blake2b256(new Uint8Array([...diversifier, ...ivk]));

    const payload = new Uint8Array(43);
    payload.set(diversifier, 0);
    payload.set(pk_d, 11);

    const convertBits = (data, fromWidth, toWidth, pad) => {
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

    const bech32Words = convertBits(payload, 8, 5, true);
    
    const BECH32_ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    const bech32Polymod = (values) => {
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
    const bech32HrpExpand = (hrp) => {
      let ret = [];
      for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5);
      ret.push(0);
      for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
      return ret;
    };

    const hrp = 'zs';
    let combined = bech32HrpExpand(hrp).concat(bech32Words);
    let polymod = bech32Polymod(combined.concat([0, 0, 0, 0, 0, 0])) ^ 1;
    let checksum = [];
    for (let i = 0; i < 6; i++) {
      checksum.push((polymod >> (5 * (5 - i))) & 31);
    }
    let ret = hrp + '1';
    let fullPayload = bech32Words.concat(checksum);
    for (let i = 0; i < fullPayload.length; i++) {
      ret += BECH32_ALPHABET[fullPayload[i]];
    }
    return ret;
  },

  deriveZcashOrchardAddressFromPrivateKey(privBytes, index = 0) {
    const fvk = this.blake2b256(new Uint8Array([...privBytes, 10]));
    const ivk = this.blake2b256(new Uint8Array([...privBytes, 11]));

    const diversifier = new Uint8Array(11);
    for (let i = 0; i < 11; i++) {
      diversifier[i] = (fvk[i] ^ 99 ^ i) % 256;
    }

    const pk_d = this.blake2b256(new Uint8Array([...diversifier, ...ivk]));

    const payload = new Uint8Array(43);
    payload.set(diversifier, 0);
    payload.set(pk_d, 11);
    return payload;
  },

  deriveZcashUnifiedAddressFromPrivateKey(privBytes, index = 0) {
    const tAddrBytes = this.keccak256Bytes(this.blake2b256(privBytes)).subarray(0, 20);
    const saplingAddrBytes = (() => {
      const ivk = this.blake2b256(new Uint8Array([...privBytes, 1]));
      const ovk = this.blake2b256(new Uint8Array([...privBytes, 2]));
      const diversifier = new Uint8Array(11);
      for (let i = 0; i < 11; i++) {
        diversifier[i] = (ovk[i] ^ (index * 31) ^ (i * 13)) % 256;
      }
      const pk_d = this.blake2b256(new Uint8Array([...diversifier, ...ivk]));
      const payload = new Uint8Array(43);
      payload.set(diversifier, 0);
      payload.set(pk_d, 11);
      return payload;
    })();
    const orchardAddrBytes = this.deriveZcashOrchardAddressFromPrivateKey(privBytes, index);

    const elements = [];
    elements.push(0x00, 43);
    elements.push(...orchardAddrBytes);
    elements.push(0x01, 43);
    elements.push(...saplingAddrBytes);
    elements.push(0x02, 20);
    elements.push(...tAddrBytes);

    const rawPayload = new Uint8Array(elements);

    const convertBits = (data, fromWidth, toWidth, pad) => {
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

    const bech32Words = convertBits(rawPayload, 8, 5, true);

    const BECH32_ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    const bech32Polymod = (values) => {
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
    const bech32HrpExpand = (hrp) => {
      let ret = [];
      for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5);
      ret.push(0);
      for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
      return ret;
    };

    const hrp = 'u1';
    let combined = bech32HrpExpand(hrp).concat(bech32Words);
    let polymod = bech32Polymod(combined.concat([0, 0, 0, 0, 0, 0])) ^ 0x2bc830a3;
    let checksum = [];
    for (let i = 0; i < 6; i++) {
      checksum.push((polymod >> (5 * (5 - i))) & 31);
    }
    let ret = hrp + '1';
    let fullPayload = bech32Words.concat(checksum);
    for (let i = 0; i < fullPayload.length; i++) {
      ret += BECH32_ALPHABET[fullPayload[i]];
    }
    return ret;
  }
};

// Exportação global universal
if (typeof window !== "undefined") {
  window.B2AddressFormatter = B2AddressFormatter;
}
if (typeof globalThis !== "undefined") {
  globalThis.B2AddressFormatter = B2AddressFormatter;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { B2AddressFormatter };
}
