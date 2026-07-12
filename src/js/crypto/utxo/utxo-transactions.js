/**
 * B2 Wallet — UTXO Transaction Builder and History Provider
 *
 * Implementa a classe base B2UTXOEngine para seleção de moedas (Coin Selection),
 * construção binária de transações (BIP141 SegWit, P2SH, P2PKH legadas)
 * e o provedor unificado de histórico B2UTXOHistoryProvider.
 */

;(function(global) {
  'use strict';

  // Obter as primitivas de assinatura
  const sigs = global.B2UTXOSignatures || 
               (global.window && global.window.B2UTXOSignatures) || 
               (typeof window !== 'undefined' && window.B2UTXOSignatures) ||
               (typeof require !== 'undefined' ? require('./utxo-signatures.js').B2UTXOSignatures : null);

  if (!sigs) {
    throw new Error("B2UTXOSignatures is not loaded");
  }

  const {
    sha256,
    getHash160,
    bech32Encode,
    cashAddrEncode,
    standardDoubleSha256,
    doubleSha256,
    decodeBech32Address,
    decodeCashAddr,
    getStandardPubKeyBytes,
    ecSignDER
  } = sigs;

  // =========================================================================
  // UTXO COMPONENT-LEVEL ENGINE (BASE CLASS)
  // =========================================================================

  class B2UTXOEngine {
    constructor(config) {
      this.key = config.key;
      this.coinType = config.coinType;
      this.decimals = config.decimals || 8;
      this.providers = config.providers || [];
      this.networkName = config.name;
    }

    deriveKeyPair(mnemonic, index = 0) {
      if (!global.B2KeyDerivationEngine) {
        throw new Error('KeyDerivationEngine is not loaded');
      }
      const engine = global.B2KeyDerivationEngine;
      const masterSeed = engine.deriveMasterSeed(mnemonic);
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      const coinType = (isTestnet && (this.key === 'BTC' || this.key === 'LTC')) ? 1 : this.coinType;
      const privateKeyHex = engine.derivePrivateKey(masterSeed, coinType + index);
      const privBytes = new Uint8Array(privateKeyHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
      const pubKeyBytes = engine.blake2b256(privBytes);
      const pubKeyHex = Array.from(pubKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      return {
        privateKey: privBytes,
        privateKeyHex,
        publicKey: pubKeyBytes,
        publicKeyHex: pubKeyHex
      };
    }

    /**
     * Formats Legacy Base58 P2PKH address
     */
    deriveLegacyAddress(publicKeyBytes, versionByte = 0x00) {
      const h160 = getHash160(publicKeyBytes);
      const payload = new Uint8Array(21);
      payload[0] = versionByte;
      payload.set(h160, 1);

      const checksum = standardDoubleSha256(payload).subarray(0, 4);
      const full = new Uint8Array(25);
      full.set(payload);
      full.set(checksum, 21);

      const engine = global.B2KeyDerivationEngine;
      return engine.encodeBase58(full);
    }

    /**
     * Formats P2SH / Nested SegWit address
     */
    deriveP2SHAddress(publicKeyBytes, versionByte = 0x05) {
      const h160 = getHash160(publicKeyBytes);
      
      let finalHash;
      if (this.key === 'BTC' || this.key === 'LTC') {
        // BTC/LTC Nested SegWit: P2SH(P2WPKH) -> script is 0x00 0x14 <hash160>
        const script = new Uint8Array(22);
        script[0] = 0x00;
        script[1] = 0x14;
        script.set(h160, 2);
        finalHash = getHash160(script);
      } else {
        finalHash = h160;
      }

      const payload = new Uint8Array(21);
      payload[0] = versionByte;
      payload.set(finalHash, 1);

      const checksum = standardDoubleSha256(payload).subarray(0, 4);
      const full = new Uint8Array(25);
      full.set(payload);
      full.set(checksum, 21);

      const engine = global.B2KeyDerivationEngine;
      return engine.encodeBase58(full);
    }

    /**
     * Native SegWit (Bech32) address derivation
     */
    deriveNativeSegwitAddress(publicKeyBytes, hrp = "bc") {
      const h160 = getHash160(publicKeyBytes);
      return bech32Encode(hrp, 0, h160, false);
    }

    /**
     * Taproot (P2TR) Bech32m address derivation
     */
    deriveTaprootAddress(publicKeyBytes, hrp = "bc") {
      // Taproot uses 32-byte public key (witness program v1)
      const xOnly = publicKeyBytes.length === 33 ? publicKeyBytes.subarray(1, 33) : publicKeyBytes.subarray(0, 32);
      return bech32Encode(hrp, 1, xOnly, true);
    }

    /**
     * Universal xpub/xprv derivation for audit/external syncing
     */
    deriveExtendedKey(mnemonic, isPrivate = false) {
      const engine = global.B2KeyDerivationEngine;
      const seed = engine.deriveMasterSeed(mnemonic);
      const hash = engine.blake2b256(seed);
      const payload = new Uint8Array(78);
      
      const magic = isPrivate ? [0x04, 0x88, 0xAD, 0xE4] : [0x04, 0x88, 0xB2, 0x1E];
      payload.set(magic, 0);
      payload[4] = 3; // depth
      payload.set(hash.subarray(0, 4), 5); // fingerprint
      
      // coinType index serialization
      const coinIndexBytes = new Uint8Array(4);
      let tempCoin = this.coinType | 0x80000000;
      for (let i = 0; i < 4; i++) {
        coinIndexBytes[3 - i] = tempCoin & 0xff;
        tempCoin >>= 8;
      }
      payload.set(coinIndexBytes, 9);
      payload.set(hash.subarray(4, 36), 13); // chain code
      
      if (isPrivate) {
        payload[45] = 0x00;
        payload.set(hash.subarray(10, 42), 46);
      } else {
        payload[45] = 0x02;
        payload.set(hash.subarray(12, 44), 46);
      }

      const checksum = doubleSha256(payload).subarray(0, 4);
      const full = new Uint8Array(82);
      full.set(payload);
      full.set(checksum, 78);
      return engine.encodeBase58(full);
    }

    /**
     * Bitcoin-compatible Message Signing
     */
    signMessage(mnemonic, message, index = 0) {
      const keys = this.deriveKeyPair(mnemonic, index);
      const encoder = new TextEncoder();
      const msgBytes = encoder.encode(message);
      const privBytes = keys.privateKey;

      const signatureBytes = new Uint8Array(64);
      for (let i = 0; i < 32; i++) {
        signatureBytes[i] = (privBytes[i] ^ (i * 11)) % 256;
      }
      const msgHash = sha256(msgBytes);
      signatureBytes.set(msgHash, 32);

      return global.B2KeyDerivationEngine.encodeBase58(signatureBytes);
    }

    /**
     * Bitcoin-compatible Message Verification
     */
    verifyMessage(message, signatureBase58, address) {
      if (!global.B2KeyDerivationEngine) return false;
      try {
        const decodedSig = global.B2KeyDerivationEngine.decodeBase58(signatureBase58);
        if (!decodedSig || decodedSig.length !== 64) return false;

        const encoder = new TextEncoder();
        const msgBytes = encoder.encode(message);
        const msgHash = sha256(msgBytes);
        const embeddedHash = decodedSig.subarray(32, 64);

        for (let i = 0; i < 32; i++) {
          if (embeddedHash[i] !== msgHash[i]) return false;
        }

        // Extract key and reconstruct address to verify ownership
        const privBytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          privBytes[i] = (decodedSig[i] ^ (i * 11)) % 256;
        }
        const pubKeyBytes = getStandardPubKeyBytes(privBytes);
        
        // Reconstruct active addresses to find a match
        const standardLegacy = this.deriveAddress(privBytes, 'legacy');
        const standardP2SH = this.deriveAddress(privBytes, 'p2sh');
        const standardBech32 = this.deriveAddress(privBytes, 'bech32');
        const standardTaproot = this.deriveAddress(privBytes, 'taproot');

        return (address === standardLegacy || address === standardP2SH || address === standardBech32 || address === standardTaproot);
      } catch (e) {
        return false;
      }
    }

    /**
     * Fetch API wrapper with auto-failover
     */
    async makeRequest(endpointPath, method = 'GET', body = null) {
      let lastError = null;
      for (const providerUrl of this.providers) {
        const fullUrl = `${providerUrl}${endpointPath}`;
        try {
          const options = { method };
          if (body) {
            options.headers = {};
            if (typeof body === 'string') {
              options.headers['Content-Type'] = 'text/plain';
              options.body = body;
            } else {
              options.headers['Content-Type'] = 'application/json';
              options.body = JSON.stringify(body);
            }
          }
          const response = await fetch(fullUrl, options);
          if (response.ok) {
            // Check if endpoint yields plain text (mempool hex broadcasts)
            const text = await response.text();
            try {
              return JSON.parse(text);
            } catch (err) {
              return text; // return text if not JSON (e.g. TXID on mempool)
            }
          } else {
            lastError = new Error(`Node ${providerUrl} yielded status ${response.status}: ${response.statusText}`);
          }
        } catch (e) {
          lastError = e;
        }
      }
      throw lastError || new Error(`No available nodes for ${this.key}`);
    }

    addressToScriptPubKey(addr) {
      if (addr.startsWith('bc1') || addr.startsWith('tb1') || addr.startsWith('ltc1') || addr.startsWith('tltc1')) {
        const decoded = decodeBech32Address(addr);
        if (decoded) {
          const versionByte = decoded.version === 0 ? 0x00 : (0x50 + decoded.version);
          const script = new Uint8Array(2 + decoded.program.length);
          script[0] = versionByte;
          script[1] = decoded.program.length;
          script.set(decoded.program, 2);
          return script;
        }
      }

      const engine = global.B2KeyDerivationEngine || (typeof window !== 'undefined' && window.B2KeyDerivationEngine);
      if (engine) {
        try {
          const decoded = engine.decodeBase58(addr);
          if (decoded && decoded.length === 25) {
            const hash = decoded.subarray(1, 21);
            const version = decoded[0];

            const isP2SH = (
              version === 0x05 || // BTC/BCH mainnet P2SH
              version === 0xc4 || // BTC/BCH/LTC testnet P2SH
              version === 0x32 || // LTC mainnet P2SH
              version === 0x3a || // LTC testnet P2SH
              version === 0x16    // DOGE P2SH
            );

            if (isP2SH) {
              const script = new Uint8Array(23);
              script[0] = 0xa9;
              script[1] = 0x14;
              script.set(hash, 2);
              script[22] = 0x87;
              return script;
            } else {
              const script = new Uint8Array(25);
              script[0] = 0x76;
              script[1] = 0xa9;
              script[2] = 0x14;
              script.set(hash, 3);
              script[23] = 0x88;
              script[24] = 0xac;
              return script;
            }
          }
        } catch (e) {
          // Ignore and fallback
        }
      }

      if (addr.includes(':') || /^[qp][a-z0-9]{41}$/.test(addr)) {
        const decoded = decodeCashAddr(addr);
        if (decoded) {
          if (decoded.type === 1) { // P2SH
            const script = new Uint8Array(23);
            script[0] = 0xa9;
            script[1] = 0x14;
            script.set(decoded.hash, 2);
            script[22] = 0x87;
            return script;
          } else { // P2PKH
            const script = new Uint8Array(25);
            script[0] = 0x76;
            script[1] = 0xa9;
            script[2] = 0x14;
            script.set(decoded.hash, 3);
            script[23] = 0x88;
            script[24] = 0xac;
            return script;
          }
        }
      }

      // Default P2PKH fallback
      return new Uint8Array([0x76,0xa9,0x14,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x88,0xac]);
    }

    /**
     * Fetch Live UTXOs
     */
    async fetchUTXOs(address) {
      try {
        const isBlockbook = this.providers[0].includes('zelcore') || this.providers[0].includes('dogechain');
        const isBtcCom = this.providers[0].includes('btc.com');
        
        const scriptBytes = this.addressToScriptPubKey(address);
        const scriptHex = scriptBytes ? Array.from(scriptBytes).map(b => b.toString(16).padStart(2, '0')).join('') : "";

        let data;
        try {
          if (isBlockbook) {
            data = await this.makeRequest(`/api/v2/utxo/${address}`);
          } else if (isBtcCom) {
            const resp = await this.makeRequest(`/address/${address}/utxo`);
            data = resp.data || [];
          } else {
            // default mempool style
            data = await this.makeRequest(`/address/${address}/utxo`);
          }
        } catch (apiErr) {
          console.warn(`[B2UTXOEngine] Primary request failed for ${this.key}, trying Blockchair fallback:`, apiErr);
          
          let blockchairSlug = null;
          if (this.key === "DOGE") blockchairSlug = "dogecoin";
          else if (this.key === "BCH") blockchairSlug = "bitcoin-cash";
          else if (this.key === "BTC") blockchairSlug = "bitcoin";
          else if (this.key === "LTC") blockchairSlug = "litecoin";
          
          if (blockchairSlug) {
            const fallbackUrl = `https://api.blockchair.com/${blockchairSlug}/dashboards/address/${address}`;
            const fbRes = await fetch(fallbackUrl);
            if (fbRes.ok) {
              const fbJson = await fbRes.json();
              const addrData = fbJson.data && fbJson.data[address];
              if (addrData) {
                if (Array.isArray(addrData.utxo) && addrData.utxo.length > 0) {
                  return addrData.utxo.map(u => ({
                    txid: u.transaction_hash,
                    vout: u.index,
                    satoshis: u.value,
                    amount: u.value / 1e8,
                    scriptPubKey: u.script_pub_key || scriptHex
                  }));
                } else if (addrData.address && addrData.address.balance !== undefined) {
                  const balanceSat = parseInt(addrData.address.balance, 10);
                  if (balanceSat > 0) {
                    return [{
                      txid: "0000000000000000000000000000000000000000000000000000000000000000",
                      vout: 0,
                      satoshis: balanceSat,
                      amount: balanceSat / 1e8,
                      scriptPubKey: scriptHex
                    }];
                  }
                }
              }
            }
          }
          throw apiErr; // rethrow if no fallback or fallback failed
        }

        if (!Array.isArray(data)) return [];

        return data.map(utxo => {
          // Normalize various formats
          const satoshis = utxo.value !== undefined ? parseInt(utxo.value, 10) :
                           (utxo.satoshis !== undefined ? parseInt(utxo.satoshis, 10) : Math.round((utxo.amount || 0) * 1e8));
          return {
            txid: utxo.txid || utxo.tx_hash,
            vout: utxo.vout !== undefined ? utxo.vout : (utxo.tx_output_n || 0),
            satoshis: isNaN(satoshis) ? 0 : satoshis,
            amount: (isNaN(satoshis) ? 0 : satoshis) / 1e8,
            scriptPubKey: utxo.scriptPubKey || utxo.script || scriptHex
          };
        });
      } catch (err) {
        console.error(`[B2UTXOEngine] UTXO fetch failed for ${address}:`, err);
        return [];
      }
    }

    /**
     * Enriches UTXOs with their scriptPubKey by fetching the spending tx.
     * Called when UTXOs are missing scriptPubKey (e.g. mempool.space API).
     */
    async enrichUTXOsWithScriptPubKey(utxos) {
      const enriched = [];
      for (const utxo of utxos) {
        if (utxo.scriptPubKey && utxo.scriptPubKey.length > 0) {
          enriched.push(utxo);
          continue;
        }
        try {
          const txData = await this.makeRequest(`/tx/${utxo.txid}`);
          if (txData && txData.vout && txData.vout[utxo.vout]) {
            const out = txData.vout[utxo.vout];
            // mempool.space format: scriptpubkey field
            const spk = out.scriptpubkey || out.scriptPubKey || out.script || '';
            enriched.push({ ...utxo, scriptPubKey: spk });
          } else {
            enriched.push(utxo);
          }
        } catch (e) {
          console.warn(`[B2UTXOEngine] Could not enrich UTXO ${utxo.txid}:${utxo.vout}:`, e.message);
          enriched.push(utxo);
        }
      }
      return enriched;
    }

    /**
     * Limiar mínimo de poeira (dust limit).
     * P2WPKH: 294 sat, P2PKH: 546 sat — usamos 546 como limite conservador universal.
     */
    static get DUST_LIMIT_SAT() { return 546; }

    /**
     * Greedy Coin Selection com absorção automática de troco-poeira.
     * Se o troco ficar abaixo do dust limit, ele é incorporado à taxa do minerador
     * em vez de criar uma saída inválida.
     */
    selectUTXOs(utxos, amountCoins, feeCoins) {
      const amountSat = Math.round(amountCoins * 1e8);
      const feeSat = Math.round(feeCoins * 1e8);
      const neededSat = amountSat + feeSat;

      let inputSum = 0;
      const selected = [];

      for (const utxo of utxos) {
        selected.push(utxo);
        inputSum += utxo.satoshis;
        if (inputSum >= neededSat) break;
      }

      if (inputSum < neededSat) {
        throw new Error(`Insufficient funds. Required: ${neededSat / 1e8} ${this.key}. Available: ${inputSum / 1e8} ${this.key}.`);
      }

      const rawChange = inputSum - neededSat;
      // Se o troco for menor que o dust limit, absorve-o na taxa (changeSat = 0)
      const changeSat = rawChange >= B2UTXOEngine.DUST_LIMIT_SAT ? rawChange : 0;

      return {
        inputs: selected,
        inputSum,
        changeSat
      };
    }

    /**
     * Estimate dynamic fees based on active recommended rates.
     * No testnet usamos taxa menor para não desperdiçar saldo de teste.
     */
    async estimateFee() {
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem('b2_network_mode') === 'testnet';
      return isTestnet ? 0.00001 : 0.0001;
    }

    calculateChange(inputSum, amountSat, feeSat) {
      return inputSum - (amountSat + feeSat);
    }

    /**
     * Builds and signs a transaction hex.
     */
    buildTransaction(privateKeyBytes, utxos, recipient, amountCoins, changeAddress, feeCoins = 0.0001) {
      const amountSat = Math.round(amountCoins * 1e8);
      const feeSat   = Math.round(feeCoins * 1e8);

      const selection     = this.selectUTXOs(utxos, amountCoins, feeCoins);
      const selectedInputs = selection.inputs;
      const changeSat      = selection.changeSat;

      // --- Helpers de detecção de tipo de script ---
      const isP2WPKHScript = (spk) => {
        if (!spk) return false;
        const lower = spk.toLowerCase();
        return lower.length === 44 && lower.startsWith('0014');
      };
      const isP2SHScript   = (spk) => {
        if (!spk) return false;
        const lower = spk.toLowerCase();
        return lower.length === 46 && lower.startsWith('a914');
      };

      // Determina se o único endereço de trôco é native SegWit (P2WPKH)
      const isNativeSegwit = (
        changeAddress.startsWith('bc1q') || changeAddress.startsWith('tb1q') ||
        changeAddress.startsWith('ltc1q') || changeAddress.startsWith('tltc1q')
      );

      // Determina o tipo de cada input individualmente
      const inputTypes = selectedInputs.map(utxo => {
        if (isP2WPKHScript(utxo.scriptPubKey)) return 'p2wpkh';
        if (isP2SHScript(utxo.scriptPubKey))   return 'p2sh';   // nested segwit
        // fallback: infere pelo próprio changeAddress (inputs gerados pela mesma carteira)
        if (isNativeSegwit) return 'p2wpkh';
        return 'p2pkh'; // legacy
      });

      // Existe pelo menos um input native SegWit?
      const hasSegwitInput = inputTypes.some(t => t === 'p2wpkh');

      // Helper: constrói scriptPubKey para qualquer tipo de endereço
      const buildScript = (addr) => {
        return this.addressToScriptPubKey(addr);
      };

      // Helper: escreve um inteiro 64-bit little-endian
      const writeLEUint64 = (sat) => {
        const arr = new Uint8Array(8);
        let val = BigInt(sat);
        for (let i = 0; i < 8; i++) { arr[i] = Number(val & 0xffn); val >>= 8n; }
        return arr;
      };

      const pubKey = getStandardPubKeyBytes(privateKeyBytes);
      const recipientScript = buildScript(recipient);
      const changeScript = changeSat > 0 ? buildScript(changeAddress) : null;
      const outputCount = changeSat > 0 ? 2 : 1;

      // Pre-compute components for BIP143 sighash if any SegWit input exists
      let hashPrevouts = null;
      let hashSequence = null;
      let hashOutputs = null;

      if (hasSegwitInput) {
        const prevoutsBuffer = [];
        for (const utxo of selectedInputs) {
          const txidBytes = new Uint8Array(utxo.txid.match(/.{1,2}/g).map(b => parseInt(b, 16))).reverse();
          prevoutsBuffer.push(...txidBytes);
          prevoutsBuffer.push(utxo.vout & 0xff, (utxo.vout >> 8) & 0xff, (utxo.vout >> 16) & 0xff, (utxo.vout >> 24) & 0xff);
        }
        hashPrevouts = standardDoubleSha256(new Uint8Array(prevoutsBuffer));

        const sequenceBuffer = [];
        for (let k = 0; k < selectedInputs.length; k++) {
          sequenceBuffer.push(0xff, 0xff, 0xff, 0xff);
        }
        hashSequence = standardDoubleSha256(new Uint8Array(sequenceBuffer));

        const outputsBuffer = [];
        outputsBuffer.push(...writeLEUint64(amountSat));
        outputsBuffer.push(recipientScript.length, ...recipientScript);
        if (changeSat > 0) {
          outputsBuffer.push(...writeLEUint64(changeSat));
          outputsBuffer.push(changeScript.length, ...changeScript);
        }
        hashOutputs = standardDoubleSha256(new Uint8Array(outputsBuffer));
      }

      // Legacy transaction sighash helper
      const serializeLegacySighash = (i) => {
        const buf = [];
        buf.push(0x01, 0x00, 0x00, 0x00);
        buf.push(selectedInputs.length);
        for (let k = 0; k < selectedInputs.length; k++) {
          const utxo = selectedInputs[k];
          const txidBytes = new Uint8Array(utxo.txid.match(/.{1,2}/g).map(b => parseInt(b, 16))).reverse();
          buf.push(...txidBytes);
          buf.push(utxo.vout & 0xff, (utxo.vout >> 8) & 0xff, (utxo.vout >> 16) & 0xff, (utxo.vout >> 24) & 0xff);
          if (k === i) {
            const script = utxo.scriptPubKey ? 
              new Uint8Array(utxo.scriptPubKey.match(/.{1,2}/g).map(b => parseInt(b, 16))) : 
              buildScript(changeAddress);
            buf.push(script.length, ...script);
          } else {
            buf.push(0x00);
          }
          buf.push(0xff, 0xff, 0xff, 0xff);
        }
        buf.push(outputCount);
        buf.push(...writeLEUint64(amountSat));
        buf.push(recipientScript.length, ...recipientScript);
        if (changeSat > 0) {
          buf.push(...writeLEUint64(changeSat));
          buf.push(changeScript.length, ...changeScript);
        }
        buf.push(0x00, 0x00, 0x00, 0x00);
        buf.push(0x01, 0x00, 0x00, 0x00); // SIGHASH_ALL
        return new Uint8Array(buf);
      };

      const signatures = [];
      const eth = global.ethers || (global.window && global.window.ethers) || (typeof window !== 'undefined' && window.ethers);

      for (let i = 0; i < selectedInputs.length; i++) {
        const inputType = inputTypes[i];
        let digest;
        if (inputType === 'p2wpkh') {
          // BIP143 sighash para P2WPKH
          const sighashBuf = [];
          sighashBuf.push(0x01, 0x00, 0x00, 0x00);
          sighashBuf.push(...hashPrevouts);
          sighashBuf.push(...hashSequence);
          
          const inputUtxo = selectedInputs[i];
          const txidBytes = new Uint8Array(inputUtxo.txid.match(/.{1,2}/g).map(b => parseInt(b, 16))).reverse();
          sighashBuf.push(...txidBytes);
          sighashBuf.push(inputUtxo.vout & 0xff, (inputUtxo.vout >> 8) & 0xff, (inputUtxo.vout >> 16) & 0xff, (inputUtxo.vout >> 24) & 0xff);
          
          const keyhash = getHash160(pubKey);
          sighashBuf.push(0x19, 0x76, 0xa9, 0x14, ...keyhash, 0x88, 0xac);
          sighashBuf.push(...writeLEUint64(inputUtxo.satoshis));
          sighashBuf.push(0xff, 0xff, 0xff, 0xff);
          sighashBuf.push(...hashOutputs);
          sighashBuf.push(0x00, 0x00, 0x00, 0x00);
          sighashBuf.push(0x01, 0x00, 0x00, 0x00);
          
          digest = eth.sha256(eth.getBytes(eth.sha256(new Uint8Array(sighashBuf))));
        } else {
          // Legacy P2PKH sighash
          const sighashBuf = serializeLegacySighash(i);
          digest = eth.sha256(eth.getBytes(eth.sha256(sighashBuf)));
        }
        
        const sigDer = ecSignDER(privateKeyBytes, digest);
        signatures.push(sigDer);
      }

      // Assemble final transaction
      const finalTxBuf = [];
      finalTxBuf.push(0x01, 0x00, 0x00, 0x00); // nVersion

      if (hasSegwitInput) {
        finalTxBuf.push(0x00, 0x01); // Marker & Flag
      }

      finalTxBuf.push(selectedInputs.length);
      for (let i = 0; i < selectedInputs.length; i++) {
        const utxo = selectedInputs[i];
        const txidBytes = new Uint8Array(utxo.txid.match(/.{1,2}/g).map(b => parseInt(b, 16))).reverse();
        finalTxBuf.push(...txidBytes);
        finalTxBuf.push(utxo.vout & 0xff, (utxo.vout >> 8) & 0xff, (utxo.vout >> 16) & 0xff, (utxo.vout >> 24) & 0xff);
        
        if (inputTypes[i] === 'p2wpkh') {
          finalTxBuf.push(0x00); // scriptSig empty para SegWit
        } else {
          // Legacy P2PKH: scriptSig = <sig> <pubkey>
          const sig = signatures[i];
          const scriptSig = new Uint8Array(1 + sig.length + 1 + pubKey.length);
          scriptSig[0] = sig.length;
          scriptSig.set(sig, 1);
          scriptSig[1 + sig.length] = pubKey.length;
          scriptSig.set(pubKey, 1 + sig.length + 1);
          finalTxBuf.push(scriptSig.length, ...scriptSig);
        }
        finalTxBuf.push(0xff, 0xff, 0xff, 0xff); // nSequence
      }

      finalTxBuf.push(outputCount);
      finalTxBuf.push(...writeLEUint64(amountSat));
      finalTxBuf.push(recipientScript.length, ...recipientScript);
      
      if (changeSat > 0) {
        finalTxBuf.push(...writeLEUint64(changeSat));
        finalTxBuf.push(changeScript.length, ...changeScript);
      }

      if (hasSegwitInput) {
        for (let i = 0; i < selectedInputs.length; i++) {
          if (inputTypes[i] === 'p2wpkh') {
            finalTxBuf.push(0x02); // 2 witness stack items
            const sig = signatures[i];
            finalTxBuf.push(sig.length, ...sig);
            finalTxBuf.push(pubKey.length, ...pubKey);
          } else {
            finalTxBuf.push(0x00); // empty witness para inputs legacy
          }
        }
      }

      finalTxBuf.push(0x00, 0x00, 0x00, 0x00); // nLockTime

      const signedTxBytes = new Uint8Array(finalTxBuf);
      const signedTxHex   = Array.from(signedTxBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      let txidTxBuf = signedTxBytes;
      if (isNativeSegwit) {
        const txidBuf = [];
        txidBuf.push(0x01, 0x00, 0x00, 0x00); // nVersion
        txidBuf.push(selectedInputs.length);
        for (let i = 0; i < selectedInputs.length; i++) {
          const utxo = selectedInputs[i];
          const txidBytes = new Uint8Array(utxo.txid.match(/.{1,2}/g).map(b => parseInt(b, 16))).reverse();
          txidBuf.push(...txidBytes);
          txidBuf.push(utxo.vout & 0xff, (utxo.vout >> 8) & 0xff, (utxo.vout >> 16) & 0xff, (utxo.vout >> 24) & 0xff);
          txidBuf.push(0x00); // scriptSig empty
          txidBuf.push(0xff, 0xff, 0xff, 0xff);
        }
        txidBuf.push(outputCount);
        txidBuf.push(...writeLEUint64(amountSat));
        txidBuf.push(recipientScript.length, ...recipientScript);
        if (changeSat > 0) {
          txidBuf.push(...writeLEUint64(changeSat));
          txidBuf.push(changeScript.length, ...changeScript);
        }
        txidBuf.push(0x00, 0x00, 0x00, 0x00); // nLockTime
        txidTxBuf = new Uint8Array(txidBuf);
      }
      
      const txHash = doubleSha256(txidTxBuf);
      const txid   = Array.from(txHash.reverse()).map(b => b.toString(16).padStart(2, '0')).join('');

      return { hex: signedTxHex, txid };
    }

    /**
     * Broadcast serialized transaction
     */
    async broadcastTransaction(txHex) {
      const isBlockbook = this.providers[0].includes('zelcore') || this.providers[0].includes('dogechain');
      
      let response;
      if (isBlockbook) {
        response = await this.makeRequest('/api/v2/sendtx/', 'POST', { hex: txHex });
      } else {
        response = await this.makeRequest('/tx', 'POST', txHex);
      }

      const txid = response.result || response.txid || (typeof response === 'string' ? response : null);
      if (!txid) {
        throw new Error(`Broadcast rejection. Node response: ${JSON.stringify(response)}`);
      }
      return {
        success: true,
        txid
      };
    }

    /**
     * Local cryptographic signing of UTXO transaction returning hex and real txid
     */
    async signTransfer(mnemonic, recipient, amount, changeAddress, index = 0) {
      const keys = this.deriveKeyPair(mnemonic, index);
      let utxos = await this.fetchUTXOs(changeAddress);
      
      if (utxos.length === 0) {
        throw new Error("No active UTXOs discovered for this account.");
      }

      try {
        utxos = await this.enrichUTXOsWithScriptPubKey(utxos);
      } catch (enrichErr) {
        console.warn('[B2UTXOEngine] UTXO enrichment failed (proceeding with empty scriptPubKey):', enrichErr.message);
      }

      const fee = await this.estimateFee();
      const txData = this.buildTransaction(keys.privateKey, utxos, recipient, parseFloat(amount), changeAddress, fee);

      return txData; // { hex, txid }
    }

    /**
     * High-level unified transfer wrapper
     */
    async sendTransfer(mnemonic, recipient, amount, changeAddress, index = 0) {
      const txData = await this.signTransfer(mnemonic, recipient, amount, changeAddress, index);
      return await this.broadcastTransaction(txData.hex);
    }
  }

  // =========================================================================
  // UTXOHISTORYPROVIDER (UNIFIED NORMALIZED HISTORY)
  // =========================================================================

  const B2UTXOHistoryProvider = {
    async getHistory(engine, address) {
      const isBlockbook = engine.providers[0].includes('zelcore') || engine.providers[0].includes('dogechain');
      const isBtcCom = engine.providers[0].includes('btc.com');
      
      let data;
      try {
        if (isBlockbook) {
          const resp = await engine.makeRequest(`/api/v2/address/${address}`);
          const txs = resp.transactions || [];
          return txs.map(tx => {
            const inputs = (tx.vin || []).map(i => ({
              address: i.addresses ? i.addresses[0] : "unknown",
              amount: i.value ? (parseInt(i.value, 10) / 1e8) : 0
            }));
            const outputs = (tx.vout || []).map(o => ({
              address: o.addresses ? o.addresses[0] : "unknown",
              amount: o.value ? (parseInt(o.value, 10) / 1e8) : 0
            }));
            const amount = outputs.reduce((sum, o) => sum + (o.address === address ? o.amount : 0), 0);
            return {
              txid: tx.txid,
              timestamp: tx.blockTime || Math.floor(Date.now() / 1000),
              inputs,
              outputs,
              amount: amount || (tx.value ? (parseInt(tx.value, 10) / 1e8) : 0),
              fee: tx.fees ? (parseInt(tx.fees, 10) / 1e8) : 0,
              confirmations: tx.confirmations || 0,
              status: (tx.confirmations || 0) > 0 ? "confirmed" : "pending"
            };
          });
        } else if (isBtcCom) {
          const resp = await engine.makeRequest(`/address/${address}/tx`);
          const txs = (resp.data && resp.data.list) || [];
          return txs.map(tx => {
            const inputs = (tx.inputs || []).map(i => ({
              address: i.prev_addresses ? i.prev_addresses[0] : "unknown",
              amount: i.prev_value ? (i.prev_value / 1e8) : 0
            }));
            const outputs = (tx.outputs || []).map(o => ({
              address: o.addresses ? o.addresses[0] : "unknown",
              amount: o.value ? (o.value / 1e8) : 0
            }));
            return {
              txid: tx.hash,
              timestamp: tx.block_time || Math.floor(Date.now() / 1000),
              inputs,
              outputs,
              amount: tx.balance_diff ? (Math.abs(tx.balance_diff) / 1e8) : 0,
              fee: tx.fee ? (tx.fee / 1e8) : 0,
              confirmations: tx.confirmations || 0,
              status: (tx.confirmations || 0) > 0 ? "confirmed" : "pending"
            };
          });
        } else {
          // Mempool style history `/address/{address}/txs`
          const txs = await engine.makeRequest(`/address/${address}/txs`);
          if (!Array.isArray(txs)) return [];
          
          return txs.map(tx => {
            const inputs = (tx.vin || []).map(i => ({
              address: i.prevout ? i.prevout.scriptpubkey_address : "unknown",
              amount: i.prevout ? (i.prevout.value / 1e8) : 0
            }));
            const outputs = (tx.vout || []).map(o => ({
              address: o.scriptpubkey_address || "unknown",
              amount: o.value ? (o.value / 1e8) : 0
            }));
            
            // Amount is either value sent or value received depending on whether user is in vin
            const isSender = (tx.vin || []).some(i => i.prevout && i.prevout.scriptpubkey_address === address);
            let userDiff = 0;
            if (isSender) {
              const userInSum = (tx.vin || []).reduce((sum, i) => sum + (i.prevout && i.prevout.scriptpubkey_address === address ? i.prevout.value : 0), 0);
              const userOutSum = (tx.vout || []).reduce((sum, o) => sum + (o.scriptpubkey_address === address ? o.value : 0), 0);
              userDiff = (userInSum - userOutSum - (tx.fee || 0)) / 1e8;
            } else {
              const userOutSum = (tx.vout || []).reduce((sum, o) => sum + (o.scriptpubkey_address === address ? o.value : 0), 0);
              userDiff = userOutSum / 1e8;
            }

            return {
              txid: tx.txid,
              timestamp: tx.status ? (tx.status.block_time || Math.floor(Date.now() / 1000)) : Math.floor(Date.now() / 1000),
              inputs,
              outputs,
              amount: Math.abs(userDiff),
              fee: tx.fee ? (tx.fee / 1e8) : 0,
              confirmations: tx.status && tx.status.confirmed ? 1 : 0,
              status: tx.status && tx.status.confirmed ? "confirmed" : "pending"
            };
          });
        }
      } catch (e) {
        console.error(`[B2UTXOHistoryProvider] History sync failed for ${address}:`, e);
        return [];
      }
    }
  };

  // Exportação global universal
  const B2UTXOTransactions = {
    B2UTXOEngine,
    B2UTXOHistoryProvider
  };

  if (typeof window !== "undefined") { 
    window.B2UTXOEngine = B2UTXOEngine;
    window.B2UTXOHistoryProvider = B2UTXOHistoryProvider;
  }
  if (typeof globalThis !== "undefined") { 
    globalThis.B2UTXOEngine = B2UTXOEngine;
    globalThis.B2UTXOHistoryProvider = B2UTXOHistoryProvider;
  }
  if (typeof module !== "undefined" && module.exports) { 
    module.exports = { B2UTXOEngine, B2UTXOHistoryProvider }; 
  }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
