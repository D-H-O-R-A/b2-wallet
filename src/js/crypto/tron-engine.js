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
      const contracts = global.B2TronContracts || (global.window && global.window.B2TronContracts) || {};
      const wellKnownTRC20 = contracts.wellKnownTRC20 || [];

      for (const token of wellKnownTRC20) {
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

  // Mix in submodules for transaction construction and metadata
  const contracts = global.B2TronContracts || (global.window && global.window.B2TronContracts) || {};
  const transactions = global.B2TronTransactions || (global.window && global.window.B2TronTransactions) || {};

  // Attach configuration & contracts helper
  B2TronEngine.wellKnownTRC20 = contracts.wellKnownTRC20;
  B2TronEngine.decodeABIString = contracts.decodeABIString;
  B2TronEngine.B2TronTokenMetadataProvider = contracts.B2TronTokenMetadataProvider;
  B2TronEngine.B2StorageProvider = global.B2StorageProvider || (global.window && global.window.B2StorageProvider) || contracts.B2StorageProvider;

  // Mixin transactions and Stake 2.0 capabilities
  Object.assign(B2TronEngine, transactions);

  // Global exports
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2TronEngine;
  }
  if (global.window) {
    global.window.B2TronEngine = B2TronEngine;
  } else {
    global.B2TronEngine = B2TronEngine;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
