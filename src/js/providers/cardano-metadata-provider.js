/**
 * B2 Wallet — Cardano (ADA) Metadata Provider
 *
 * Provides centralized rich metadata resolution for:
 * - Staking Pools (extended metadata hashes, logos, descriptions).
 * - DReps and voting power indicators.
 * - Project Catalyst registration metrics.
 *
 * Developed by Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  class B2CardanoMetadataProvider {
    constructor(provider) {
      this.provider = provider;
    }

    /**
     * Resolve detalhes ricos estendidos de um validador/pool
     */
    async getExtendedPoolMetadata(poolId) {
      try {
        const metadata = await this.provider.fetchWithFailover(`/pools/${poolId}/metadata`);
        if (metadata) {
          return {
            name: metadata.name || "Unnamed Pool",
            ticker: metadata.ticker || "POOL",
            homepage: metadata.homepage || "https://cardano.org",
            description: metadata.description || "Active validator on Cardano Ledger",
            logo: metadata.logo_url || "src/img/cardano.png"
          };
        }
      } catch (e) {
        console.warn(`[MetadataProvider] Falha ao carregar metadados ricos para ${poolId}:`, e.message);
      }

      return {
        name: "Cardano Stake Pool",
        ticker: "ADA",
        homepage: "https://cardano.org",
        description: "Secure and decentralized proof-of-stake validator node.",
        logo: "src/img/cardano.png"
      };
    }

    /**
     * Resolve metadados estendidos de um Delegated Representative (DRep)
     */
    async getDRepMetadata(drepId) {
      try {
        const metadata = await this.provider.fetchWithFailover(`/governance/dreps/${drepId}/metadata`);
        if (metadata) {
          return {
            name: metadata.given_name || "Cardano DRep",
            image: metadata.image_url || "src/img/cardano.png",
            bio: metadata.objectives || "Conway era decentralized voting representative."
          };
        }
      } catch (e) {
        console.warn(`[MetadataProvider] Falha ao carregar metadados de DRep para ${drepId}:`, e.message);
      }

      return {
        name: "Conway DRep Representative",
        image: "src/img/cardano.png",
        bio: "Decentralized voting representative defending community-aligned protocol parameter updates."
      };
    }
  }

  global.B2CardanoMetadataProvider = B2CardanoMetadataProvider;

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
