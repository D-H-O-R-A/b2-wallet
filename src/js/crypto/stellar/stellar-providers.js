/**
 * B2 Wallet — Stellar Decoupled Network Providers
 *
 * Implementa provedores de rede (Horizon, Soroban/RPC), failover resiliente,
 * TOML parser e AssetMetadataProvider com cache persistente.
 */

;(function(global) {
  'use strict';

  const StellarSdk = global.StellarSdk || 
                     (global.window && global.window.StellarSdk) || 
                     (typeof window !== 'undefined' && window.StellarSdk);

  const B2StorageProvider = global.B2StorageProvider || (global.window && global.window.B2StorageProvider) || {
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
    }
  };

  // TOML Simple Parser
  function parseToml(tomlText) {
    const result = {};
    let currentSection = null;
    let currentArraySection = null;
    const lines = tomlText.split(/\r?\n/);
    
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      
      // Check for section
      if (line.startsWith('[[') && line.endsWith(']]')) {
        const secName = line.slice(2, -2).trim();
        currentSection = null;
        currentArraySection = secName;
        if (!result[secName]) result[secName] = [];
        result[secName].push({});
        continue;
      }
      if (line.startsWith('[') && line.endsWith(']')) {
        const secName = line.slice(1, -1).trim();
        currentArraySection = null;
        currentSection = secName;
        if (!result[secName]) result[secName] = {};
        continue;
      }
      
      // Key-value parsing
      const eqIdx = line.indexOf('=');
      if (eqIdx !== -1) {
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        
        // Strip quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        
        const target = currentArraySection 
          ? result[currentArraySection][result[currentArraySection].length - 1]
          : (currentSection ? result[currentSection] : result);
          
        if (target) {
          target[key] = val;
        }
      }
    }
    return result;
  }

  const RpcProvider = {
    async fetchWithFailover(endpoints, path, options = {}) {
      const list = Array.isArray(endpoints) ? endpoints : [endpoints];
      let lastError = null;

      for (const endpoint of list) {
        try {
          const url = endpoint.endsWith('/') ? endpoint.slice(0, -1) + path : endpoint + path;
          const res = await fetch(url, options);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return await res.json();
        } catch (e) {
          lastError = e;
          console.warn(`[Stellar Failover] Attempt failed on ${endpoint}:`, e.message);
        }
      }
      throw new Error(`All Stellar providers failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
    }
  };

  const HorizonProvider = {
    async getBalances(address, nodeUrl, fallbacks = []) {
      const endpoints = [nodeUrl, ...fallbacks];
      try {
        const data = await RpcProvider.fetchWithFailover(endpoints, `/accounts/${address}`);
        return data.balances.map(b => ({
          asset_type: b.asset_type,
          asset_code: b.asset_type === 'native' ? 'XLM' : b.asset_code,
          asset_issuer: b.asset_issuer || null,
          balance: b.balance,
          limit: b.limit || null,
          buying_liabilities: b.buying_liabilities || '0',
          selling_liabilities: b.selling_liabilities || '0',
          is_activated: true,
          sponsor: b.sponsor || null
        }));
      } catch (e) {
        if (e.message.includes('404')) {
          // Account is unactivated on-chain
          return [{
            asset_type: 'native',
            asset_code: 'XLM',
            balance: '0.0000000',
            is_activated: false
          }];
        }
        throw e;
      }
    },

    async getAssets(address, nodeUrl, fallbacks = []) {
      const balances = await this.getBalances(address, nodeUrl, fallbacks);
      return balances.filter(b => b.asset_type !== 'native');
    },

    async getClaimableBalances(address, nodeUrl, fallbacks = []) {
      const endpoints = [nodeUrl, ...fallbacks];
      try {
        const data = await RpcProvider.fetchWithFailover(endpoints, `/claimable_balances?claimant=${address}`);
        const records = (data._embedded && data._embedded.records) || [];
        return records.map(r => ({
          id: r.id,
          asset: r.asset,
          amount: r.amount,
          sponsor: r.sponsor || null,
          last_modified_ledger: r.last_modified_ledger,
          claimants: r.claimants || []
        }));
      } catch (e) {
        console.warn('[HorizonProvider] Failed to fetch claimable balances:', e.message);
        return [];
      }
    },

    async getLiquidityPools(address, nodeUrl, fallbacks = []) {
      const endpoints = [nodeUrl, ...fallbacks];
      try {
        const data = await RpcProvider.fetchWithFailover(endpoints, `/liquidity_pools?account=${address}`);
        const records = (data._embedded && data._embedded.records) || [];
        return records.map(r => ({
          id: r.id,
          fee_bp: r.fee_bp,
          type: r.type,
          total_shares: r.total_shares,
          total_trustlines: r.total_trustlines,
          reserves: r.reserves || []
        }));
      } catch (e) {
        console.warn('[HorizonProvider] Failed to fetch liquidity pools:', e.message);
        return [];
      }
    },

    async getTransactionHistory(address, nodeUrl, fallbacks = []) {
      const endpoints = [nodeUrl, ...fallbacks];
      try {
        const data = await RpcProvider.fetchWithFailover(endpoints, `/accounts/${address}/operations?order=desc&limit=50&join=transactions`);
        const records = (data._embedded && data._embedded.records) || [];
        
        return records.map(op => {
          const tx = op.transaction || {};
          let type = 'unknown';
          let amount = '0';
          let asset = 'XLM';
          let from = op.source_account || op.funder || '';
          let to = op.to || op.into || op.account || '';

          if (op.type === 'create_account') {
            type = op.account === address ? 'receive' : 'send';
            amount = op.starting_balance;
            asset = 'XLM';
          } else if (op.type === 'payment') {
            type = op.to === address ? 'receive' : 'send';
            amount = op.amount;
            asset = op.asset_type === 'native' ? 'XLM' : op.asset_code;
            from = op.from;
            to = op.to;
          } else if (op.type === 'change_trust') {
            type = 'trustline_change';
            asset = op.asset_code || '';
            amount = op.limit || '0';
          } else if (op.type === 'claim_claimable_balance') {
            type = 'claim_claimable_balance';
            amount = op.amount || '0';
          }

          return {
            txid: op.transaction_hash,
            hash: op.transaction_hash,
            type,
            timestamp: new Date(op.created_at).getTime(),
            amount,
            asset,
            from,
            to,
            memo: tx.memo || null,
            memo_type: tx.memo_type || null,
            fee: tx.fee_charged || '0',
            successful: tx.successful !== false
          };
        });
      } catch (e) {
        console.warn('[HorizonProvider] Failed to fetch transaction history:', e.message);
        return [];
      }
    },

    async getFeeStats(nodeUrl, fallbacks = []) {
      const endpoints = [nodeUrl, ...fallbacks];
      try {
        const data = await RpcProvider.fetchWithFailover(endpoints, `/fee_stats`);
        return {
          base_fee: (StellarSdk && StellarSdk.BASE_FEE) || 100,
          mode_accepted_fee: parseInt(data.fee_charged.mode, 10) || ((StellarSdk && StellarSdk.BASE_FEE) || 100),
          min_accepted_fee: parseInt(data.fee_charged.min, 10) || ((StellarSdk && StellarSdk.BASE_FEE) || 100),
          max_accepted_fee: parseInt(data.fee_charged.max, 10) || ((StellarSdk && StellarSdk.BASE_FEE) || 100)
        };
      } catch (e) {
        const fallbackFee = (StellarSdk && StellarSdk.BASE_FEE) || 100;
        return {
          base_fee: fallbackFee,
          mode_accepted_fee: fallbackFee,
          min_accepted_fee: fallbackFee,
          max_accepted_fee: fallbackFee
        };
      }
    }
  };

  const SorobanProvider = {
    async simulateTransaction(txEnvelopeXdr, rpcUrl) {
      try {
        const payload = {
          jsonrpc: '2.0',
          id: 1,
          method: 'simulateTransaction',
          params: { transaction: txEnvelopeXdr }
        };
        const res = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.result;
      } catch (e) {
        throw new Error('Soroban simulation failed: ' + e.message);
      }
    },

    async getTransactionStatus(txHash, rpcUrl) {
      try {
        const payload = {
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: { hash: txHash }
        };
        const res = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.result;
      } catch (e) {
        throw new Error('Soroban getTransaction failed: ' + e.message);
      }
    },

    async getContractWasm(contractId, rpcUrl) {
      try {
        const payload = {
          jsonrpc: '2.0',
          id: 1,
          method: 'getLedgerEntries',
          params: {
            keys: [
              StellarSdk.xdr.LedgerKey.contractCode(
                new StellarSdk.xdr.LedgerKeyContractCode({
                  hash: Buffer.from(contractId, 'hex')
                })
              ).toXDR('base64')
            ]
          }
        };
        const res = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.result;
      } catch (e) {
        throw new Error('Soroban getLedgerEntries failed: ' + e.message);
      }
    }
  };

  const AssetMetadataProvider = {
    async getMetadata(assetCode, assetIssuer, nodeUrl) {
      return this.getAssetMetadata(assetCode, assetIssuer, nodeUrl || 'https://horizon.stellar.org');
    },
    async getAssetMetadata(assetCode, assetIssuer, nodeUrl) {
      const cacheKey = `stellar_asset_meta_${assetCode}_${assetIssuer}`;
      try {
        const cached = B2StorageProvider.getItem(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {}

      try {
        const res = await fetch(`${nodeUrl}/accounts/${assetIssuer}`);
        if (!res.ok) return null;
        const accData = await res.json();
        const homeDomain = accData.home_domain;
        if (!homeDomain) return null;

        const tomlUrl = `https://${homeDomain}/.well-known/stellar.toml`;
        const tomlRes = await fetch(tomlUrl);
        if (!tomlRes.ok) return null;
        const tomlText = await tomlRes.text();

        const parsed = parseToml(tomlText);
        const currencies = parsed.CURRENCIES || [];
        const meta = currencies.find(c => c.code === assetCode) || {};

        const result = {
          code: assetCode,
          issuer: assetIssuer,
          homeDomain,
          name: meta.name || assetCode,
          desc: meta.desc || '',
          image: meta.image || '',
          conditions: meta.conditions || '',
          decimals: meta.decimals ? parseInt(meta.decimals, 10) : 7
        };

        try {
          B2StorageProvider.setItem(cacheKey, JSON.stringify(result));
        } catch (e) {}

        return result;
      } catch (e) {
        console.warn('[B2StellarEngine] Asset TOML metadata discovery failed:', e.message);
        return null;
      }
    }
  };

  const B2StellarProviders = {
    RpcProvider,
    HorizonProvider,
    SorobanProvider,
    AssetMetadataProvider,
    parseToml
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2StellarProviders;
  }
  if (global.window) {
    global.window.B2StellarProviders = B2StellarProviders;
  } else {
    global.B2StellarProviders = B2StellarProviders;
  }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
