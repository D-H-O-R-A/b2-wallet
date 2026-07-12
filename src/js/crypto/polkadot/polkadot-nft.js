/**
 * B2 Wallet — Polkadot NFT & History Providers Submodule
 *
 * Tech Lead: Diego Oris (Better2Better)
 * Implements NFT discovery (pallet-nfts & uniques) and transaction history
 * multi-backend scanning (Subscan, Statescan) on Polkadot (DOT) and Asset Hub.
 */

;(function(global) {
  'use strict';

  function getEngine() {
    const engine = global.B2PolkadotEngine || 
                  (global.window && global.window.B2PolkadotEngine) || 
                  (typeof window !== 'undefined' && window.B2PolkadotEngine);
    if (!engine) {
      throw new Error("B2PolkadotEngine base is not loaded");
    }
    return engine;
  }

  const PolkadotHistoryProvider = {
    /**
     * Queries and normalizes transactions through multiple prioritized backends.
     */
    async getHistory(address) {
      // Priority 1: Subscan API
      try {
        console.log('[PolkadotHistory] Priority 1 — Querying Subscan...');
        const res = await fetch('https://polkadot.api.subscan.io/api/v2/scan/transfers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, row: 10, page: 0 })
        });
        const json = await res.json();
        if (json && json.data && json.data.transfers) {
          return json.data.transfers.map(tx => ({
            hash: tx.hash,
            block: tx.block_num,
            timestamp: tx.block_timestamp * 1000,
            from: tx.from,
            to: tx.to,
            amount: Number(tx.amount),
            fee: Number(tx.fee || 0),
            status: tx.success ? 'success' : 'failed'
          }));
        }
      } catch (e) {
        console.warn('[PolkadotHistory] Subscan provider failed, switching to Statescan:', e.message);
      }

      // Priority 2: Statescan API
      try {
        console.log('[PolkadotHistory] Priority 2 — Querying Statescan...');
        const res = await fetch(`https://polkadot.statescan.io/api/accounts/${address}/transfers?page_size=10`);
        const json = await res.json();
        if (json && json.items) {
          return json.items.map(tx => ({
            hash: tx.extrinsicHash,
            block: tx.indexer?.blockHeight,
            timestamp: tx.indexer?.blockTime,
            from: tx.from,
            to: tx.to,
            amount: Number(tx.balance) / 10000000000,
            fee: Number(tx.fee || 0) / 10000000000,
            status: tx.isSuccess ? 'success' : 'failed'
          }));
        }
      } catch (e) {
        console.warn('[PolkadotHistory] Statescan provider failed, switching to OnFinality/RPC fallbacks:', e.message);
      }

      return [];
    }
  };

  const PolkadotNFTProvider = {
    /**
     * Discovers all owned collections and items on Asset Hub.
     */
    async discoverNFTs(address) {
      try {
        const api = await getEngine().getAssetHubApi();
        const discovered = [];

        // 1. Primary: pallet-nfts
        if (api.query.nfts && typeof api.query.nfts.account?.entries === 'function') {
          console.log('[PolkadotNFTProvider] Querying pallet-nfts...');
          const nftEntries = await api.query.nfts.account.entries(address);
          
          for (const [key, value] of nftEntries) {
            const collectionId = key.args[1].toNumber();
            const itemId = key.args[2].toNumber();
            
            // Query metadata dynamically
            const metadataOpt = await api.query.nfts.itemMetadataOf(collectionId, itemId);
            let name = `NFT Item #${itemId}`;
            let description = '';
            
            if (metadataOpt.isSome) {
              const data = metadataOpt.unwrap();
              name = data.name.toUtf8() || name;
              description = data.description?.toUtf8() || '';
            }

            discovered.push({
              id: `${collectionId}-${itemId}`,
              collectionId,
              itemId,
              name,
              description,
              pallet: 'nfts',
              chainKey: 'POLKADOT'
            });
          }
        }

        // 2. Fallback: pallet-uniques
        if (discovered.length === 0 && api.query.uniques && typeof api.query.uniques.account?.entries === 'function') {
          console.log('[PolkadotNFTProvider] Querying pallet-uniques fallback...');
          const uniqueEntries = await api.query.uniques.account.entries(address);

          for (const [key, value] of uniqueEntries) {
            const collectionId = key.args[1].toNumber();
            const itemId = key.args[2].toNumber();

            const metadataOpt = await api.query.uniques.instanceMetadataOf(collectionId, itemId);
            let name = `Legacy NFT #${itemId}`;

            if (metadataOpt.isSome) {
              name = metadataOpt.unwrap().data.toUtf8() || name;
            }

            discovered.push({
              id: `${collectionId}-${itemId}`,
              collectionId,
              itemId,
              name,
              pallet: 'uniques',
              chainKey: 'POLKADOT'
            });
          }
        }

        return discovered;
      } catch (err) {
        console.error('[PolkadotNFTProvider] discoverNFTs failed:', err.message);
        return [];
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PolkadotHistoryProvider, PolkadotNFTProvider };
  }
  global.B2PolkadotHistoryProvider = PolkadotHistoryProvider;
  global.B2PolkadotNFTProvider = PolkadotNFTProvider;
  if (global.window) {
    global.window.B2PolkadotHistoryProvider = PolkadotHistoryProvider;
    global.window.B2PolkadotNFTProvider = PolkadotNFTProvider;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
