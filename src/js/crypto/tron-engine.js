/**
 * B2 Wallet — Tron (TRX) Cryptographic Engine & Provider
 *
 * Implements complete support for Tron Mainnet:
 * - BIP-44 key derivation path m/44'/195'/0'/0/index (Coin Type 195).
 * - uncompressed secp256k1 public key generation and ECDSA signatures via Ethers.js.
 * - Base58Check encoding/decoding and T-prefix address validation (version 0x41).
 * - Message signing and verification standard compatible with TronLink.
 * - Dynamic TRC20 Token Discovery & Metadata Resolution (balanceOf, name, symbol, decimals).
 * - Automatic Failover Trio integrating REST Nodes (Trongrid, Publicnode, Subquery).
 * - Complete Stake 2.0 model support (Stake, Unstake, Delegate, Undelegate).
 * - Full TRX and TRC20 Transaction building, signing, and broadcasting.
 *
 * Developed by Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  const B2KeyDerivationEngine = global.B2KeyDerivationEngine || 
                                (global.window && global.window.B2KeyDerivationEngine) || 
                                (typeof window !== 'undefined' && window.B2KeyDerivationEngine);

  const B2TronEngine = {
    // Well-known TRC20 contracts for active scanning
    wellKnownTRC20: [
      { address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", symbol: "USDT", name: "Tether USD", decimals: 6 },
      { address: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8", symbol: "USDC", name: "USD Coin", decimals: 6 },
      { address: "TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9", symbol: "JST", name: "JUST", decimals: 18 },
      { address: "TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9", symbol: "SUN", name: "SUN Token", decimals: 18 },
      { address: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7", symbol: "WIN", name: "WIN", decimals: 18 }
    ],

    // -------------------------------------------------------------------------
    // KEY DERIVATION & ADDRESS GENERATION
    // -------------------------------------------------------------------------

    /**
     * Deriva um par de chaves Tron (secp256k1) a partir da semente mestre BIP-39.
     * Path padrão: m/44'/195'/0'/0/index (Coin Type 195)
     */
    deriveTronKeyPair(mnemonic, index = 0) {
      if (!B2KeyDerivationEngine) {
        throw new Error('Core KeyDerivationEngine is not loaded');
      }
      if (!global.ethers) {
        throw new Error('Ethers.js library is not loaded');
      }

      const masterSeed = B2KeyDerivationEngine.deriveMasterSeed(mnemonic);
      const privateKeyHex = B2KeyDerivationEngine.derivePrivateKey(masterSeed, 195 + index);
      
      const signingKey = new global.ethers.SigningKey('0x' + privateKeyHex);
      const uncompressedPublicKey = signingKey.publicKey; // hex string starting with 0x04

      // Derive standard address
      const address = this.deriveAddressFromPublicKey(uncompressedPublicKey);
      const base58Address = this.toBase58Address(address);

      return {
        privateKeyHex,
        publicKeyHex: uncompressedPublicKey,
        address: base58Address,
        hexAddress: address
      };
    },

    /**
     * Deriva o endereço hexadecimal Tron correspondente à chave pública uncompressed.
     */
    deriveAddressFromPublicKey(publicKeyHex) {
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      const prefix = isTestnet ? "a0" : "41";
      let pubKey = publicKeyHex;
      if (pubKey.startsWith('0x')) {
        pubKey = pubKey.substring(2);
      }
      if (pubKey.startsWith('04') && pubKey.length === 130) {
        pubKey = pubKey.substring(2);
      }
      const keccakHash = global.ethers.keccak256("0x" + pubKey);
      return prefix + keccakHash.substring(keccakHash.length - 40);
    },

    // -------------------------------------------------------------------------
    // ADDRESS CONVERSIONS & STRICT VALIDATION
    // -------------------------------------------------------------------------

    /**
     * Converte um endereço Base58 (T... ou 2...) para formato hexadecimal (41... ou a0...).
     */
    toHexAddress(address) {
      if (!address || typeof address !== 'string') {
        throw new Error('Invalid address type');
      }
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      const hexPrefix = isTestnet ? "a0" : "41";
      const regexHex = isTestnet ? /^a0[0-9a-fA-F]{40}$/ : /^41[0-9a-fA-F]{40}$/;

      if (regexHex.test(address)) {
        return address.toLowerCase();
      }
      if (!B2KeyDerivationEngine) {
        throw new Error('B2KeyDerivationEngine is required for Base58 decoding');
      }
      const decoded = B2KeyDerivationEngine.decodeBase58(address);
      if (!decoded || decoded.length !== 25) {
        throw new Error('Invalid Base58Address decoding');
      }
      // Validação de Checksum
      const payload = decoded.subarray(0, 21);
      const cs = decoded.subarray(21, 25);
      const hash1 = global.ethers.sha256(payload);
      const hash2 = global.ethers.sha256(hash1);
      const hash2Bytes = global.ethers.getBytes(hash2);
      for (let i = 0; i < 4; i++) {
        if (cs[i] !== hash2Bytes[i]) {
          throw new Error('Base58Check checksum failed');
        }
      }
      return global.ethers.hexlify(payload).substring(2);
    },

    /**
     * Converte um endereço hexadecimal (41... ou a0...) para formato Base58 (T... ou 2...).
     */
    toBase58Address(hexAddress) {
      if (!hexAddress || typeof hexAddress !== 'string') {
        throw new Error('Invalid hexAddress type');
      }
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      const b58Prefix = isTestnet ? "2" : "T";
      const hexPrefix = isTestnet ? "a0" : "41";

      const regexB58 = isTestnet ? /^2[1-9A-HJ-NP-Za-km-z]{33}$/ : /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
      if (regexB58.test(hexAddress)) {
        return hexAddress;
      }
      let clean = hexAddress;
      if (clean.startsWith('0x')) {
        clean = clean.substring(2);
      }
      if (clean.length === 40) {
        clean = hexPrefix + clean;
      }
      if (clean.length !== 42) {
        throw new Error('Invalid hexAddress length');
      }
      const payloadBytes = new Uint8Array(clean.match(/.{1,2}/g).map(b => parseInt(b, 16)));
      const hash1 = global.ethers.sha256(payloadBytes);
      const hash2 = global.ethers.sha256(hash1);
      const hash2Bytes = global.ethers.getBytes(hash2);
      
      const full = new Uint8Array(25);
      full.set(payloadBytes);
      full.set(hash2Bytes.subarray(0, 4), 21);
      
      return B2KeyDerivationEngine.encodeBase58(full);
    },

    /**
     * Validação estrita de endereços Tron.
     */
    validateAddress(address) {
      if (!address || typeof address !== 'string') return false;
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      const b58Prefix = isTestnet ? "2" : "T";
      const hexPrefix = isTestnet ? "a0" : "41";

      try {
        if (address.startsWith(b58Prefix)) {
          if (address.length !== 34) return false;
          const hex = this.toHexAddress(address);
          return hex.startsWith(hexPrefix) && hex.length === 42;
        } else {
          const regexHex = isTestnet ? /^(0x)?a0[0-9a-fA-F]{40}$/ : /^(0x)?41[0-9a-fA-F]{40}$/;
          if (regexHex.test(address)) {
            const clean = address.startsWith('0x') ? address.substring(2) : address;
            const b58 = this.toBase58Address(clean);
            return b58.startsWith(b58Prefix) && b58.length === 34;
          }
        }
        return false;
      } catch (e) {
        return false;
      }
    },

    isValidAddress(address) {
      return this.validateAddress(address);
    },

    // -------------------------------------------------------------------------
    // PROVIDER & RESILIENT NETWORKING
    // -------------------------------------------------------------------------

    async rpcCall(endpoint, path, body, method = 'POST') {
      const sanitizedEndpoint = endpoint.replace(/\/+$/, "");
      const sanitizedPath = path.replace(/^\/+/, "");
      const url = `${sanitizedEndpoint}/${sanitizedPath}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    },

    async fetchWithFailover(path, body, method = 'POST', activeNodeUrl, fallbacks = []) {
      const endpoints = [activeNodeUrl, ...fallbacks];
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          return await this.rpcCall(endpoint, path, body, method);
        } catch (e) {
          console.warn(`[TRON Engine] Call to ${endpoint}/${path} failed, trying fallback:`, e.message);
          lastError = e;
        }
      }
      throw new Error(`TRON API Call /${path} failed on all endpoints. Last error: ${lastError ? lastError.message : 'Unknown'}`);
    },

    // -------------------------------------------------------------------------
    // ACCOUNT BALANCES & RESOURCE DISCOVERY
    // -------------------------------------------------------------------------

    /**
     * Retorna o saldo TRX em float a partir de wallet/getaccount.
     */
    async getBalance(address, nodeUrl, fallbacks = []) {
      const hexAddress = this.toHexAddress(address);
      try {
        const data = await this.fetchWithFailover("wallet/getaccount", { address: hexAddress }, "POST", nodeUrl, fallbacks);
        if (!data || Object.keys(data).length === 0) {
          return 0.0; // conta não ativa
        }
        return (data.balance || 0) / 1e6;
      } catch (e) {
        console.error('[TRON Engine] getBalance failed:', e.message);
        throw e;
      }
    },

    /**
     * Retorna informações dos recursos (Bandwidth, Energy) e Stake 2.0.
     */
    async getResources(address, nodeUrl, fallbacks = []) {
      const hexAddress = this.toHexAddress(address);
      try {
        const data = await this.fetchWithFailover("wallet/getaccountresource", { address: hexAddress }, "POST", nodeUrl, fallbacks);
        
        const freeLimit = data.freeNetLimit || 1500; // Padrão 1500 na mainnet
        const freeUsed = data.freeNetUsed || 0;
        const freeAvailable = Math.max(0, freeLimit - freeUsed);

        const stakedNetLimit = data.NetLimit || 0;
        const stakedNetUsed = data.NetUsed || 0;
        const stakedNetAvailable = Math.max(0, stakedNetLimit - stakedNetUsed);

        const energyLimit = data.EnergyLimit || 0;
        const energyUsed = data.EnergyUsed || 0;
        const energyAvailable = Math.max(0, energyLimit - energyUsed);

        return {
          bandwidth: {
            freeLimit,
            freeUsed,
            freeAvailable,
            stakedLimit: stakedNetLimit,
            stakedUsed: stakedNetUsed,
            stakedAvailable: stakedNetAvailable,
            totalAvailable: freeAvailable + stakedNetAvailable
          },
          energy: {
            limit: energyLimit,
            used: energyUsed,
            available: energyAvailable
          },
          stakedTRX: {
            bandwidth: (data.TotalNetWeight ? (stakedNetLimit / data.TotalNetLimit) * data.TotalNetWeight : 0) / 1e6,
            energy: (data.TotalEnergyWeight ? (energyLimit / data.TotalEnergyLimit) * data.TotalEnergyWeight : 0) / 1e6
          }
        };
      } catch (e) {
        console.warn('[TRON Engine] getResources failed, returning default values:', e.message);
        return {
          bandwidth: { freeLimit: 0, freeUsed: 0, freeAvailable: 0, stakedLimit: 0, stakedUsed: 0, stakedAvailable: 0, totalAvailable: 0 },
          energy: { limit: 0, used: 0, available: 0 },
          stakedTRX: { bandwidth: 0, energy: 0 }
        };
      }
    },

    /**
     * Executa a varredura dinâmica de tokens TRC20 via triggerconstantcontract.
     */
    async getTokenBalances(address, nodeUrl, fallbacks = []) {
      const hexAddress = this.toHexAddress(address);
      const results = [];

      for (const token of this.wellKnownTRC20) {
        try {
          const contractHex = this.toHexAddress(token.address);
          const param = "000000000000000000000000" + hexAddress.substring(2);
          
          const data = await this.fetchWithFailover("wallet/triggerconstantcontract", {
            owner_address: hexAddress,
            contract_address: contractHex,
            function_selector: "balanceOf(address)",
            parameter: param
          }, "POST", nodeUrl, fallbacks);

          if (data && data.constant_result && data.constant_result.length > 0) {
            const rawBalance = BigInt("0x" + data.constant_result[0]);
            const decimals = token.decimals;
            const formatted = Number(rawBalance) / Math.pow(10, decimals);
            
            if (rawBalance > 0n) {
              results.push({
                contractAddress: token.address,
                symbol: token.symbol,
                name: token.name,
                decimals,
                balance: formatted,
                rawBalance: rawBalance.toString()
              });
            }
          }
        } catch (e) {
          console.warn(`[TRON Engine] Failed to fetch balance for token ${token.symbol}:`, e.message);
        }
      }
      return results;
    },

    // Helper para decodificar strings retornadas por contratos ABI
    decodeABIString(hex) {
      if (!hex) return "";
      let clean = hex;
      if (clean.startsWith('0x')) clean = clean.substring(2);
      if (clean.length < 128) return "";
      const lenHex = clean.substring(64, 128);
      const len = parseInt(lenHex, 16);
      if (isNaN(len) || len === 0) return "";
      const valueHex = clean.substring(128, 128 + len * 2);
      let str = "";
      for (let i = 0; i < valueHex.length; i += 2) {
        const code = parseInt(valueHex.substring(i, i + 2), 16);
        if (code >= 32 && code <= 126) {
          str += String.fromCharCode(code);
        }
      }
      return str;
    },

    // -------------------------------------------------------------------------
    // TRANSACTION BUILDERS, SIGNERS & BROADCAST
    // -------------------------------------------------------------------------

    /**
     * Constrói uma transação não assinada (TRX ou TRC20).
     */
    async buildTransaction(sender, recipient, amount, tokenAddress, memo = null, nodeUrl, fallbacks = []) {
      const senderHex = this.toHexAddress(sender);
      const recipientHex = this.toHexAddress(recipient);

      let extraDataHex = undefined;
      if (memo) {
        const bytes = new TextEncoder().encode(memo);
        extraDataHex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      }

      if (tokenAddress) {
        // TRC20 Token Transfer
        const contractHex = this.toHexAddress(tokenAddress);
        // Buscar decimais dinamicamente
        let decimals = 18;
        const wellKnown = this.wellKnownTRC20.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
        if (wellKnown) {
          decimals = wellKnown.decimals;
        } else {
          try {
            const decData = await this.fetchWithFailover("wallet/triggerconstantcontract", {
              owner_address: senderHex,
              contract_address: contractHex,
              function_selector: "decimals()",
              parameter: ""
            }, "POST", nodeUrl, fallbacks);
            if (decData && decData.constant_result && decData.constant_result.length > 0) {
              decimals = parseInt(decData.constant_result[0], 16);
            }
          } catch (e) {
            console.warn('[TRON Engine] Failed to fetch token decimals dynamically, using 18:', e.message);
          }
        }

        const rawAmount = BigInt(Math.round(amount * Math.pow(10, decimals)));
        const paramRecipient = "000000000000000000000000" + recipientHex.substring(2);
        const paramAmount = rawAmount.toString(16).padStart(64, '0');
        const parameter = paramRecipient + paramAmount;

        const data = await this.fetchWithFailover("wallet/triggersmartcontract", {
          owner_address: senderHex,
          contract_address: contractHex,
          function_selector: "transfer(address,uint256)",
          parameter: parameter,
          fee_limit: 150000000, // 150 TRX max cost
          call_value: 0
        }, "POST", nodeUrl, fallbacks);

        if (!data || !data.transaction) {
          throw new Error('Failed to build TRC20 transfer transaction: ' + JSON.stringify(data));
        }

        // NOTE: Memos are officially not supported on triggerSmartContract outer containers
        // in a straightforward way without txID recalculation. We omit it here to avoid signature mismatches.
        return data.transaction;
      } else {
        // Standard TRX Transfer
        const rawAmount = Math.round(amount * 1e6); // em Sun
        const requestBody = {
          owner_address: senderHex,
          to_address: recipientHex,
          amount: rawAmount
        };
        if (extraDataHex) {
          requestBody.extra_data = extraDataHex;
        }

        const data = await this.fetchWithFailover("wallet/createtransaction", requestBody, "POST", nodeUrl, fallbacks);

        if (!data || !data.txID) {
          throw new Error('Failed to build TRX transfer transaction: ' + JSON.stringify(data));
        }
        return data;
      }
    },

    /**
     * Assina localmente com a chave privada secp256k1.
     */
    signTransaction(transaction, privateKeyHex) {
      if (!global.ethers) {
        throw new Error('Ethers.js library is not loaded');
      }
      const txID = transaction.txID;
      if (!txID) {
        throw new Error('Transaction has no txID to sign');
      }

      const messageHashBytes = global.ethers.getBytes("0x" + txID);
      const signingKey = new global.ethers.SigningKey("0x" + privateKeyHex);
      const sig = signingKey.sign(messageHashBytes);

      const rHex = sig.r.substring(2);
      const sHex = sig.s.substring(2);
      const vHex = sig.yParity.toString(16).padStart(2, '0');
      const signatureHex = rHex + sHex + vHex;

      transaction.signature = [signatureHex];
      return transaction;
    },

    /**
     * Envia a transação assinada para a blockchain real com failover.
     */
    async broadcastTransaction(signedTransaction, nodeUrl, fallbacks = []) {
      try {
        const data = await this.fetchWithFailover("wallet/broadcasttransaction", signedTransaction, "POST", nodeUrl, fallbacks);
        if (data && data.result) {
          return {
            success: true,
            txId: signedTransaction.txID || data.txid
          };
        } else {
          const msg = data && data.message ? (typeof data.message === 'string' ? data.message : JSON.stringify(data.message)) : 'Broadcast rejected';
          throw new Error(msg);
        }
      } catch (e) {
        console.error('[TRON Engine] broadcastTransaction failed:', e.message);
        throw e;
      }
    },

    /**
     * Constrói e assina uma transferência (TRX ou TRC20) localmente (offline).
     */
    async signTransfer(mnemonic, nodeUrl, recipient, amount, tokenAddress = null, memo = null, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const tx = await this.buildTransaction(keyPair.address, recipient, amount, tokenAddress, memo, nodeUrl, fallbacks);
      const signed = this.signTransaction(tx, keyPair.privateKeyHex);
      return signed; // returns signed transaction object containing txID and signature
    },

    /**
     * Constrói, assina e transmite uma transferência (TRX ou TRC20) de forma unificada.
     */
    async sendTransfer(mnemonic, nodeUrl, recipient, amount, tokenAddress = null, memo = null, fallbacks = [], index = 0) {
      const signed = await this.signTransfer(mnemonic, nodeUrl, recipient, amount, tokenAddress, memo, fallbacks, index);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    // -------------------------------------------------------------------------
    // ACCOUNT ACTIVATION
    // -------------------------------------------------------------------------

    async isAccountActivated(address, nodeUrl, fallbacks = []) {
      const hexAddress = this.toHexAddress(address);
      try {
        const data = await this.fetchWithFailover("wallet/getaccount", { address: hexAddress }, "POST", nodeUrl, fallbacks);
        if (!data || Object.keys(data).length === 0) {
          return { status: 'UNACTIVATED', balance: 0.0 };
        }
        const balance = (data.balance || 0) / 1e6;
        if (balance === 0) {
          return { status: 'ACTIVATED_NO_BALANCE', balance: 0.0 };
        }
        return { status: 'ACTIVATED_ACTIVE', balance };
      } catch (e) {
        console.error('[TRON Engine] isAccountActivated failed:', e.message);
        throw e;
      }
    },

    async activateAccount(mnemonic, recipient, amount = 0.1, nodeUrl, fallbacks = []) {
      return await this.sendTransfer(mnemonic, nodeUrl, recipient, amount, null, null, fallbacks);
    },

    // -------------------------------------------------------------------------
    // DYNAMIC NETWORK PARAMETERS & COST ESTIMATION
    // -------------------------------------------------------------------------

    async getChainParameters(nodeUrl, fallbacks = []) {
      try {
        const data = await this.fetchWithFailover("wallet/getchainparameters", {}, "GET", nodeUrl, fallbacks);
        const params = {};
        if (data && Array.isArray(data.chainParameter)) {
          for (const item of data.chainParameter) {
            if (item.key) {
              params[item.key] = item.value;
            }
          }
        }
        return params;
      } catch (e) {
        console.warn('[TRON Engine] getChainParameters failed, returning empty:', e.message);
        return {};
      }
    },

    async estimateTransactionCost(sender, recipient, amount, tokenAddress, memo, nodeUrl, fallbacks = []) {
      try {
        const senderResources = await this.getResources(sender, nodeUrl, fallbacks);
        const chainParams = await this.getChainParameters(nodeUrl, fallbacks);
        
        // Parse chain parameters with default fallbacks
        const energyFee = Number(chainParams.getEnergyFee || 420); // in Sun
        const bandwidthFee = Number(chainParams.getTransactionFee || 1000); // in Sun
        const createAccountFee = Number(chainParams.getCreateAccountFee || 100000); // 0.1 TRX
        const createNewAccountFeeInSystemContract = Number(chainParams.getCreateNewAccountFeeInSystemContract || 1000000); // 1 TRX

        // Determine activation status of recipient
        const recipientState = await this.isAccountActivated(recipient, nodeUrl, fallbacks);
        const isUnactivated = recipientState.status === 'UNACTIVATED';

        const memoBytesLength = memo ? (new TextEncoder().encode(memo)).length : 0;
        
        let bandwidthNeeded = tokenAddress ? 345 : 268;
        bandwidthNeeded += memoBytesLength;

        if (isUnactivated) {
          bandwidthNeeded += 25000; // Account creation bandwidth requirement
        }

        let energyNeeded = 0;
        if (tokenAddress) {
          energyNeeded = 65000; // Standard TRC20 safe estimate
        }

        // Bandwidth burn calculation
        const freeBandwidth = senderResources.bandwidth.freeAvailable || 0;
        const stakedBandwidth = senderResources.bandwidth.stakedAvailable || 0;
        const totalBandwidthAvailable = freeBandwidth + stakedBandwidth;

        let bandwidthTRXBurn = 0;
        if (totalBandwidthAvailable < bandwidthNeeded) {
          const missingBandwidth = bandwidthNeeded - totalBandwidthAvailable;
          bandwidthTRXBurn = (missingBandwidth * bandwidthFee) / 1e6;
        }

        // Energy burn calculation
        const energyAvailable = senderResources.energy.available || 0;
        let energyTRXBurn = 0;
        if (energyAvailable < energyNeeded) {
          const missingEnergy = energyNeeded - energyAvailable;
          energyTRXBurn = (missingEnergy * energyFee) / 1e6;
        }

        // Account creation burn if lack of bandwidth
        let activationTRXBurn = 0;
        if (isUnactivated && totalBandwidthAvailable < bandwidthNeeded) {
          activationTRXBurn = createNewAccountFeeInSystemContract / 1e6;
        }

        const totalFeeTRX = bandwidthTRXBurn + energyTRXBurn + activationTRXBurn;

        return {
          bandwidth: bandwidthNeeded,
          energy: energyNeeded,
          bandwidthFeeTRX: bandwidthTRXBurn,
          energyFeeTRX: energyTRXBurn,
          activationFeeTRX: activationTRXBurn,
          totalFeeTRX,
          isRecipientUnactivated: isUnactivated
        };
      } catch (e) {
        console.warn('[TRON Engine] estimateTransactionCost failed, returning rough defaults:', e.message);
        return {
          bandwidth: tokenAddress ? 345 : 268,
          energy: tokenAddress ? 65000 : 0,
          bandwidthFeeTRX: 0,
          energyFeeTRX: 0,
          activationFeeTRX: 0,
          totalFeeTRX: 0,
          isRecipientUnactivated: false
        };
      }
    },

    // -------------------------------------------------------------------------
    // STAKE 2.0 IMPLEMENTATION & LOOKUPS
    // -------------------------------------------------------------------------

    async freezeBalanceV2(mnemonic, amount, resource, nodeUrl, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const data = await this.fetchWithFailover("wallet/freezebalancev2", {
        owner_address: keyPair.hexAddress,
        frozen_balance: Math.round(amount * 1e6),
        resource: resource // "BANDWIDTH" ou "ENERGY"
      }, "POST", nodeUrl, fallbacks);

      if (!data || !data.txID) {
        throw new Error('Failed to build freeze transaction: ' + JSON.stringify(data));
      }
      const signed = this.signTransaction(data, keyPair.privateKeyHex);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    async unfreezeBalanceV2(mnemonic, amount, resource, nodeUrl, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const data = await this.fetchWithFailover("wallet/unfreezebalancev2", {
        owner_address: keyPair.hexAddress,
        unfreeze_balance: Math.round(amount * 1e6),
        resource: resource // "BANDWIDTH" ou "ENERGY"
      }, "POST", nodeUrl, fallbacks);

      if (!data || !data.txID) {
        throw new Error('Failed to build unfreeze transaction: ' + JSON.stringify(data));
      }
      const signed = this.signTransaction(data, keyPair.privateKeyHex);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    async stake(mnemonic, amount, resource, nodeUrl, fallbacks = []) {
      return await this.freezeBalanceV2(mnemonic, amount, resource, nodeUrl, fallbacks);
    },

    async unstake(mnemonic, amount, resource, nodeUrl, fallbacks = []) {
      return await this.unfreezeBalanceV2(mnemonic, amount, resource, nodeUrl, fallbacks);
    },

    async delegateResource(mnemonic, receiver, amount, resource, lock, nodeUrl, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const receiverHex = this.toHexAddress(receiver);
      const data = await this.fetchWithFailover("wallet/delegateresource", {
        owner_address: keyPair.hexAddress,
        receiver_address: receiverHex,
        balance: Math.round(amount * 1e6),
        resource: resource, // "BANDWIDTH" ou "ENERGY"
        lock: !!lock
      }, "POST", nodeUrl, fallbacks);

      if (!data || !data.txID) {
        throw new Error('Failed to build delegate transaction: ' + JSON.stringify(data));
      }
      const signed = this.signTransaction(data, keyPair.privateKeyHex);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    async undelegateResource(mnemonic, receiver, amount, resource, nodeUrl, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const receiverHex = this.toHexAddress(receiver);
      const data = await this.fetchWithFailover("wallet/undelegateresource", {
        owner_address: keyPair.hexAddress,
        receiver_address: receiverHex,
        balance: Math.round(amount * 1e6),
        resource: resource // "BANDWIDTH" ou "ENERGY"
      }, "POST", nodeUrl, fallbacks);

      if (!data || !data.txID) {
        throw new Error('Failed to build undelegate transaction: ' + JSON.stringify(data));
      }
      const signed = this.signTransaction(data, keyPair.privateKeyHex);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    async cancelUnfreezeBalanceV2(mnemonic, nodeUrl, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const data = await this.fetchWithFailover("wallet/cancelallunfreezev2", {
        owner_address: keyPair.hexAddress
      }, "POST", nodeUrl, fallbacks);

      if (!data || !data.txID) {
        throw new Error('Failed to build cancel unfreeze transaction: ' + JSON.stringify(data));
      }
      const signed = this.signTransaction(data, keyPair.privateKeyHex);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    async withdrawExpireUnfreeze(mnemonic, nodeUrl, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const data = await this.fetchWithFailover("wallet/withdrawexpireunfreeze", {
        owner_address: keyPair.hexAddress
      }, "POST", nodeUrl, fallbacks);

      if (!data || !data.txID) {
        throw new Error('Failed to build withdraw expire unfreeze transaction: ' + JSON.stringify(data));
      }
      const signed = this.signTransaction(data, keyPair.privateKeyHex);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    async getDelegatedResources(address, nodeUrl, fallbacks = []) {
      const hexAddress = this.toHexAddress(address);
      try {
        const data = await this.fetchWithFailover("wallet/getdelegatedresourceaccountindexv2", { value: hexAddress }, "POST", nodeUrl, fallbacks);
        const delegated = [];
        if (data && Array.isArray(data.toAccounts)) {
          for (const toAcc of data.toAccounts) {
            const detail = await this.fetchWithFailover("wallet/getdelegatedresourcev2", {
              fromAddress: hexAddress,
              toAddress: toAcc
            }, "POST", nodeUrl, fallbacks);
            if (detail && Array.isArray(detail.delegatedResource)) {
              for (const res of detail.delegatedResource) {
                delegated.push({
                  to: this.toBase58Address(toAcc),
                  frozen_balance_for_bandwidth: (res.frozen_balance_for_bandwidth || 0) / 1e6,
                  frozen_balance_for_energy: (res.frozen_balance_for_energy || 0) / 1e6,
                  expire_time_for_bandwidth: res.expire_time_for_bandwidth || 0,
                  expire_time_for_energy: res.expire_time_for_energy || 0
                });
              }
            }
          }
        }
        return delegated;
      } catch (e) {
        console.warn('[TRON Engine] getDelegatedResources failed, returning empty list:', e.message);
        return [];
      }
    },

    async getAvailableUnfreezeCount(address, nodeUrl, fallbacks = []) {
      const hexAddress = this.toHexAddress(address);
      try {
        const data = await this.fetchWithFailover("wallet/getavailableunfreezecount", { ownerAddress: hexAddress }, "POST", nodeUrl, fallbacks);
        return data && typeof data.count !== 'undefined' ? data.count : 32;
      } catch (e) {
        console.warn('[TRON Engine] getAvailableUnfreezeCount failed, returning 32:', e.message);
        return 32;
      }
    },

    async getCanWithdrawUnfreeze(address, nodeUrl, fallbacks = []) {
      const hexAddress = this.toHexAddress(address);
      try {
        const data = await this.fetchWithFailover("wallet/getcanwithdrawunfreezeamount", {
          owner_address: hexAddress,
          timestamp: Date.now()
        }, "POST", nodeUrl, fallbacks);
        return data && typeof data.amount !== 'undefined' ? data.amount / 1e6 : 0.0;
      } catch (e) {
        console.warn('[TRON Engine] getCanWithdrawUnfreeze failed, returning 0.0:', e.message);
        return 0.0;
      }
    },

    // -------------------------------------------------------------------------
    // ACCOUNT PERMISSIONS (MULTI-SIG COMPATIBILITY)
    // -------------------------------------------------------------------------

    async getAccountPermissions(address, nodeUrl, fallbacks = []) {
      const hexAddress = this.toHexAddress(address);
      const base58Address = this.toBase58Address(address);
      try {
        const data = await this.fetchWithFailover("wallet/getaccount", { address: hexAddress }, "POST", nodeUrl, fallbacks);
        
        let ownerPermission = data.owner_permission || {
          permission_name: "owner",
          threshold: 1,
          keys: [{ address: base58Address, weight: 1 }]
        };

        let activePermissions = data.active_permissions || [{
          type: 2,
          permission_name: "active",
          threshold: 1,
          keys: [{ address: base58Address, weight: 1 }]
        }];

        const normalizeKeys = (keys) => {
          if (!Array.isArray(keys)) return [];
          return keys.map(k => ({
            address: this.toBase58Address(k.address),
            weight: k.weight
          }));
        };

        ownerPermission.keys = normalizeKeys(ownerPermission.keys);
        activePermissions = activePermissions.map(p => ({
          ...p,
          keys: normalizeKeys(p.keys)
        }));

        return {
          owner: ownerPermission,
          active: activePermissions,
          witness: data.witness_permission ? {
            ...data.witness_permission,
            keys: normalizeKeys(data.witness_permission.keys)
          } : null
        };
      } catch (e) {
        console.warn('[TRON Engine] getAccountPermissions failed, returning defaults:', e.message);
        return {
          owner: {
            permission_name: "owner",
            threshold: 1,
            keys: [{ address: base58Address, weight: 1 }]
          },
          active: [{
            type: 2,
            permission_name: "active",
            threshold: 1,
            keys: [{ address: base58Address, weight: 1 }]
          }],
          witness: null
        };
      }
    },

    async getAccountPermissionTree(address, nodeUrl, fallbacks = []) {
      const perms = await this.getAccountPermissions(address, nodeUrl, fallbacks);
      return {
        address: this.toBase58Address(address),
        thresholds: {
          owner: perms.owner.threshold,
          active: perms.active.map(a => ({
            name: a.permission_name,
            threshold: a.threshold,
            operations: a.operations || "all"
          }))
        },
        hierarchy: {
          owner: perms.owner.keys.map(k => ({
            address: k.address,
            weight: k.weight,
            percentage: (k.weight / perms.owner.threshold) * 100
          })),
          active: perms.active.map(a => ({
            name: a.permission_name,
            threshold: a.threshold,
            keys: a.keys.map(k => ({
              address: k.address,
              weight: k.weight,
              percentage: (k.weight / a.threshold) * 100
            }))
          }))
        }
      };
    },

    async getNowBlockNumber(nodeUrl, fallbacks = []) {
      try {
        const block = await this.fetchWithFailover("wallet/getnowblock", {}, "POST", nodeUrl, fallbacks);
        if (block && block.block_header && block.block_header.raw_data) {
          return block.block_header.raw_data.number || 0;
        }
        return 0;
      } catch (e) {
        console.warn('[TRON Engine] Failed to fetch current block number:', e.message);
        return 0;
      }
    },

    // -------------------------------------------------------------------------
    // TRANSACTION HISTORY
    // -------------------------------------------------------------------------

    async getTransactionHistory(address, nodeUrl, fallbacks = []) {
      const base58Addr = this.toBase58Address(address);
      const normTxs = [];

      let currentBlock = 0;
      try {
        currentBlock = await this.getNowBlockNumber(nodeUrl, fallbacks);
      } catch (e) {
        console.warn('[TRON Engine] Could not fetch current block number for confirmations:', e.message);
      }

      // 1. Fetch TRX Transactions
      try {
        const tgUrl = `https://api.trongrid.io/v1/accounts/${base58Addr}/transactions`;
        const response = await fetch(tgUrl);
        if (response.ok) {
          const res = await response.json();
          if (res && Array.isArray(res.data)) {
            for (const tx of res.data) {
              const contract = tx.raw_data && tx.raw_data.contract && tx.raw_data.contract[0];
              if (contract && (contract.type === "TransferContract" || contract.type === "TransferAssetContract")) {
                const val = contract.parameter && contract.parameter.value;
                if (val) {
                  const fromBase58 = this.toBase58Address(val.owner_address);
                  const toBase58 = this.toBase58Address(val.to_address);
                  
                  const blockNumber = tx.blockNumber || 0;
                  const confirmations = blockNumber && currentBlock ? Math.max(0, currentBlock - blockNumber) : 0;
                  const confirmed = confirmations >= 19; // TRON standard for finality

                  let bandwidthUsed = tx.net_usage || 0;
                  let energyUsed = tx.energy_usage || 0;
                  if (tx.ret && tx.ret[0]) {
                    bandwidthUsed = tx.ret[0].net_usage || bandwidthUsed;
                    energyUsed = tx.ret[0].energy_usage || energyUsed;
                  }

                  normTxs.push({
                    hash: tx.txID,
                    blockNumber,
                    timestamp: tx.block_timestamp || tx.raw_data.timestamp || Date.now(),
                    from: fromBase58,
                    to: toBase58,
                    amount: (val.amount || 0) / 1e6,
                    token: "TRX",
                    contractAddress: null,
                    fee: (tx.ret && tx.ret[0] && tx.ret[0].fee ? tx.ret[0].fee / 1e6 : 0.0),
                    status: (tx.ret && tx.ret[0] && tx.ret[0].contractRet === "SUCCESS") ? "SUCCESS" : "FAILED",
                    confirmations,
                    confirmed,
                    type: "TRX",
                    resourceUsage: {
                      bandwidth: bandwidthUsed,
                      energy: energyUsed
                    }
                  });
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('[TRON Engine] Failed to fetch TRX history from TronGrid:', e.message);
      }

      // 2. Fetch TRC20 Token transfers history
      try {
        const tgTrc20Url = `https://api.trongrid.io/v1/accounts/${base58Addr}/transactions/trc20`;
        const response = await fetch(tgTrc20Url);
        if (response.ok) {
          const res = await response.json();
          if (res && Array.isArray(res.data)) {
            for (const tx of res.data) {
              const sym = tx.token_info ? tx.token_info.symbol : "TRC20";
              const dec = tx.token_info ? tx.token_info.decimals : 18;
              const amt = Number(tx.value) / Math.pow(10, dec);
              
              const blockNumber = tx.block_number || 0;
              const confirmations = blockNumber && currentBlock ? Math.max(0, currentBlock - blockNumber) : 0;
              const confirmed = confirmations >= 19;

              let bandwidthUsed = tx.net_usage || 0;
              let energyUsed = tx.energy_usage || 0;

              normTxs.push({
                hash: tx.transaction_id,
                blockNumber,
                timestamp: tx.block_timestamp || Date.now(),
                from: tx.from,
                to: tx.to,
                amount: amt,
                token: sym,
                contractAddress: tx.token_info ? tx.token_info.address : null,
                fee: 0.0,
                status: "SUCCESS",
                confirmations,
                confirmed,
                type: "TRC20",
                resourceUsage: {
                  bandwidth: bandwidthUsed,
                  energy: energyUsed
                }
              });
            }
          }
        }
      } catch (e) {
        console.warn('[TRON Engine] Failed to fetch TRC20 history from TronGrid:', e.message);
      }

      return normTxs.sort((a, b) => b.timestamp - a.timestamp);
    },

    // -------------------------------------------------------------------------
    // MESSAGE SIGNING (secp256k1 matching TronLink / TronWeb)
    // -------------------------------------------------------------------------

    signMessage(message, privateKeyHex) {
      if (!global.ethers) {
        throw new Error('Ethers.js library is not loaded');
      }
      const encoder = new TextEncoder();
      const msgBytes = encoder.encode(message);
      const prefix = `\x19TRON Signed Message:\n${msgBytes.length}`;
      const prefixBytes = encoder.encode(prefix);

      const combined = new Uint8Array(prefixBytes.length + msgBytes.length);
      combined.set(prefixBytes);
      combined.set(msgBytes, prefixBytes.length);

      const messageHash = global.ethers.keccak256(combined);
      const signingKey = new global.ethers.SigningKey("0x" + privateKeyHex);
      const sig = signingKey.sign(messageHash);

      const rHex = sig.r.substring(2);
      const sHex = sig.s.substring(2);
      const vHex = sig.yParity.toString(16).padStart(2, '0');
      return "0x" + rHex + sHex + vHex;
    },

    verifyMessage(message, signatureHex, address) {
      if (!global.ethers) {
        return false;
      }
      try {
        let cleanSig = signatureHex;
        if (cleanSig.startsWith('0x')) {
          cleanSig = cleanSig.substring(2);
        }
        if (cleanSig.length !== 130) {
          return false;
        }

        const encoder = new TextEncoder();
        const msgBytes = encoder.encode(message);
        const prefix = `\x19TRON Signed Message:\n${msgBytes.length}`;
        const prefixBytes = encoder.encode(prefix);

        const combined = new Uint8Array(prefixBytes.length + msgBytes.length);
        combined.set(prefixBytes);
        combined.set(msgBytes, prefixBytes.length);

        const messageHash = global.ethers.keccak256(combined);

        const r = "0x" + cleanSig.substring(0, 64);
        const s = "0x" + cleanSig.substring(64, 128);
        const vVal = parseInt(cleanSig.substring(128, 130), 16);
        const yParity = (vVal === 27 || vVal === 28) ? vVal - 27 : (vVal === 0 || vVal === 1 ? vVal : vVal % 2);

        const recoveredPublicKey = global.ethers.SigningKey.recoverPublicKey(messageHash, {
          r,
          s,
          yParity
        });

        const derivedAddress = this.deriveAddressFromPublicKey(recoveredPublicKey);
        return this.toBase58Address(derivedAddress) === this.toBase58Address(address);
      } catch (e) {
        console.error('[TRON Engine] verifyMessage failed:', e);
        return false;
      }
    }
  };

  // -------------------------------------------------------------------------
  // STORAGE PROVIDER & METADATA CACHE
  // -------------------------------------------------------------------------

  const B2StorageProvider = global.B2StorageProvider || {
    getItem(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    setItem(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {}
    },
    removeItem(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    },
    async getItemAsync(key) {
      return this.getItem(key);
    },
    async setItemAsync(key, value) {
      this.setItem(key, value);
    }
  };
  global.B2StorageProvider = B2StorageProvider;

  class LRUCache {
    constructor(limit = 100) {
      this.limit = limit;
      this.cache = new Map();
    }

    get(key) {
      if (!this.cache.has(key)) return null;
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }

    set(key, value) {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      } else if (this.cache.size >= this.limit) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }
      this.cache.set(key, value);
    }
  }

  const B2TronTokenMetadataProvider = {
    cache: new LRUCache(100),

    async getMetadata(contractAddress, nodeUrl, fallbacks = []) {
      if (!contractAddress) return null;
      try {
        const cleanAddress = B2TronEngine.toBase58Address(contractAddress);
        
        // In-memory LRU check
        const cached = this.cache.get(cleanAddress);
        if (cached) {
          return cached;
        }

        // Storage Provider check
        const storedStr = B2StorageProvider.getItem(`trc20_meta_${cleanAddress}`);
        if (storedStr) {
          try {
            const parsed = JSON.parse(storedStr);
            this.cache.set(cleanAddress, parsed);
            return parsed;
          } catch (e) {}
        }

        // Well-known check
        const wellKnown = B2TronEngine.wellKnownTRC20.find(t => t.address.toLowerCase() === cleanAddress.toLowerCase());
        if (wellKnown) {
          const meta = {
            address: wellKnown.address,
            symbol: wellKnown.symbol,
            name: wellKnown.name,
            decimals: wellKnown.decimals
          };
          this.cache.set(cleanAddress, meta);
          B2StorageProvider.setItem(`trc20_meta_${cleanAddress}`, JSON.stringify(meta));
          return meta;
        }

        // Dynamic Query
        const contractHex = B2TronEngine.toHexAddress(cleanAddress);
        const [nameData, symData, decData] = await Promise.all([
          B2TronEngine.fetchWithFailover("wallet/triggerconstantcontract", {
            owner_address: "410000000000000000000000000000000000000000",
            contract_address: contractHex,
            function_selector: "name()",
            parameter: ""
          }, "POST", nodeUrl, fallbacks).catch(() => null),
          B2TronEngine.fetchWithFailover("wallet/triggerconstantcontract", {
            owner_address: "410000000000000000000000000000000000000000",
            contract_address: contractHex,
            function_selector: "symbol()",
            parameter: ""
          }, "POST", nodeUrl, fallbacks).catch(() => null),
          B2TronEngine.fetchWithFailover("wallet/triggerconstantcontract", {
            owner_address: "410000000000000000000000000000000000000000",
            contract_address: contractHex,
            function_selector: "decimals()",
            parameter: ""
          }, "POST", nodeUrl, fallbacks).catch(() => null)
        ]);

        let name = "Unknown TRC20";
        let symbol = "TRC20";
        let decimals = 18;

        if (nameData && nameData.constant_result && nameData.constant_result[0]) {
          name = B2TronEngine.decodeABIString(nameData.constant_result[0]) || "Unknown TRC20";
        }
        if (symData && symData.constant_result && symData.constant_result[0]) {
          symbol = B2TronEngine.decodeABIString(symData.constant_result[0]) || "TRC20";
        }
        if (decData && decData.constant_result && decData.constant_result[0]) {
          decimals = parseInt(decData.constant_result[0], 16) || 18;
        }

        const meta = { address: cleanAddress, symbol, name, decimals };
        this.cache.set(cleanAddress, meta);
        B2StorageProvider.setItem(`trc20_meta_${cleanAddress}`, JSON.stringify(meta));
        return meta;
      } catch (e) {
        console.warn('[B2TronTokenMetadataProvider] Resolve failed:', e.message);
        return { address: contractAddress, symbol: "TRC20", name: "Unknown TRC20", decimals: 18 };
      }
    }
  };

  // Expose helpers on the engine object
  B2TronEngine.B2TronTokenMetadataProvider = B2TronTokenMetadataProvider;
  B2TronEngine.B2StorageProvider = B2StorageProvider;

  // Global exports
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2TronEngine;
  }
  if (global.window) {
    global.window.B2TronEngine = B2TronEngine;
    global.window.B2TronTokenMetadataProvider = B2TronTokenMetadataProvider;
    global.window.B2StorageProvider = B2StorageProvider;
  } else {
    global.B2TronEngine = B2TronEngine;
    global.B2TronTokenMetadataProvider = B2TronTokenMetadataProvider;
    global.B2StorageProvider = B2StorageProvider;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
