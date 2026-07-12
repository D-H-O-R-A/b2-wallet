/**
 * B2 Wallet — Registro de Redes EVM v2.0 (Modular)
 *
 * Centraliza e unifica as configurações de produção das 26 redes EVM
 * suportadas pela B2 Wallet.
 */

; (function (global) {
  'use strict';

  const networks = (typeof window !== "undefined" && window.B2EvmNetworks) ||
                   (typeof globalThis !== "undefined" && globalThis.B2EvmNetworks) ||
                   (typeof require !== "undefined" ? require('./registry/evm-networks').B2EvmNetworks : {});

  const testnetOverrides = (typeof window !== "undefined" && window.B2EvmTestnets) ||
                           (typeof globalThis !== "undefined" && globalThis.B2EvmTestnets) ||
                           (typeof require !== "undefined" ? require('./registry/evm-testnets').B2EvmTestnets : {});

  const B2EvmNetworkRegistry = {
    networks,
    testnetOverrides,

    getNetworkByChainId(chainId) {
      const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
      if (isTestnet) {
        for (const key in this.testnetOverrides) {
          if (this.testnetOverrides[key].chainId === chainId) {
            const net = this.networks[key];
            return { key, ...net, ...this.testnetOverrides[key], fallbackRpcUrls: this.testnetOverrides[key].rpcUrls };
          }
        }
      }
      for (const key in this.networks) {
        if (this.networks[key].chainId === chainId) {
          return { key, ...this.networks[key] };
        }
      }
      return null;
    },

    getNetworkByKey(key) {
      const net = this.networks[key.toUpperCase()];
      if (net) {
        let result = { key: key.toUpperCase(), ...net };
        const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
        if (isTestnet) {
          const override = this.testnetOverrides[key.toUpperCase()];
          if (override) {
            result = { ...result, ...override, fallbackRpcUrls: override.rpcUrls };
          }
        }
        return result;
      }
      return null;
    }
  };

  // Exportação global universal
  if (typeof window !== "undefined") {
    window.B2EvmNetworkRegistry = B2EvmNetworkRegistry;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.B2EvmNetworkRegistry = B2EvmNetworkRegistry;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { B2EvmNetworkRegistry };
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
