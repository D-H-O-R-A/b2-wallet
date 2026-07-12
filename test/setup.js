/**
 * B2 Wallet - Ambiente de Testes Integrado (Browser JS Mock Sandbox)
 * 
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Este módulo configura um ambiente browser simulado de alta fidelidade para executar
 * os scripts JavaScript de produção da carteira dentro do Node.js v24+.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootPath = path.resolve(__dirname, '..');

// 1. Simulação do LocalStorage em RAM
const mockLocalStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

// 2. Simulação simples do DOM Document
const mockDocument = {
  body: {
    classList: {
      add() {},
      remove() {}
    }
  },
  querySelector() { return null; },
  addEventListener() {}
};

// 3. Simulação de barramento de eventos Window com postMessage assíncrono
const mockWindow = {
  crypto: require('node:crypto').webcrypto,
  navigator: { platform: 'linux' },
  localStorage: mockLocalStorage,
  _listeners: {},
  addEventListener(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  },
  removeEventListener(event, handler) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(h => h !== handler);
  },
  postMessage(data, targetOrigin) {
    if (this._listeners['message']) {
      for (const handler of this._listeners['message']) {
        // Envio assíncrono real via macrotask para simular o comportamento nativo de postMessage
        setTimeout(() => {
          handler({ source: this, data, origin: '*' });
        }, 0);
      }
    }
  }
};

// Vincula mocks ao global do Node.js
globalThis.require = require;
globalThis.window = mockWindow;
globalThis.navigator = mockWindow.navigator;
globalThis.localStorage = mockWindow.localStorage;
globalThis.document = mockDocument;


// Load real ethers library into global context for test environment derivation validation
globalThis.window.ethers = require('ethers');
globalThis.ethers = require('ethers');

// Load real Solana web3 library and derivation bundle
globalThis.window.solanaWeb3 = require('@solana/web3.js');
globalThis.solanaWeb3 = require('@solana/web3.js');

// Load real NeonJS library
globalThis.window.Neon = require('@cityofzion/neon-js');
globalThis.Neon = require('@cityofzion/neon-js');

// 4. Executador de scripts de produção no contexto global compartilhado
function loadScript(filePath) {
  const code = fs.readFileSync(path.resolve(rootPath, filePath), 'utf8');
  const script = new vm.Script(code, { filename: filePath });
  script.runInThisContext();
}

loadScript('src/js/vendor/polkadot-crypto.umd.js');
loadScript('src/js/crypto/registry/utxo-registry.js');
loadScript('src/js/crypto/registry/evm-registry.js');
loadScript('src/js/crypto/registry/other-registry.js');
loadScript('src/js/crypto/registry.js');
loadScript('src/js/vendor/solana-derivation.umd.js');
loadScript('src/js/vendor/noble-ed25519.js');
// Foolproof capture of noble-ed25519 exports for test environment compatibility
if (!globalThis.noble || !globalThis.noble.ed25519) {
  const nobleExports = (module.exports && module.exports.Point) ? module.exports : 
                       (globalThis.module && globalThis.module.exports && globalThis.module.exports.Point) ? globalThis.module.exports : null;
  if (nobleExports) {
    globalThis.noble = { ed25519: nobleExports };
    globalThis.window.noble = { ed25519: nobleExports };
  }
} else {
  globalThis.window.noble = globalThis.noble;
}
loadScript('src/js/crypto/solana-broadcaster.js');
loadScript('src/js/crypto/derivation/bip39-utils.js');
loadScript('src/js/crypto/derivation/address-formatter.js');
loadScript('src/js/crypto/derivation/address-validator.js');
loadScript('src/js/crypto/key-derivation.js');
loadScript('src/js/crypto/utxo/utxo-signatures.js');
loadScript('src/js/crypto/utxo/utxo-transactions.js');
loadScript('src/js/crypto/utxo-engine.js');
loadScript('src/js/crypto/waves/waves-signatures.js');
loadScript('src/js/crypto/waves/waves-transactions.js');
loadScript('src/js/crypto/waves-broadcaster.js');
loadScript('src/js/crypto/icp/icp-crypto.js');
loadScript('src/js/crypto/icp-engine.js');
loadScript('src/js/crypto/polkadot-engine.js');
loadScript('src/js/crypto/polkadot/polkadot-staking.js');
loadScript('src/js/crypto/polkadot/polkadot-nft.js');
loadScript('src/js/crypto/monero/monero-base58.js');
loadScript('src/js/crypto/monero/monero-store.js');
loadScript('src/js/crypto/monero-engine.js');
loadScript('src/js/crypto/zcash/zcash-shielded.js');
loadScript('src/js/crypto/zcash-broadcaster.js');
loadScript('src/js/crypto/dash-broadcaster.js');
loadScript('src/js/crypto/neo-engine.js');
loadScript('src/js/crypto/filecoin/filecoin-cbor.js');
loadScript('src/js/crypto/filecoin-engine.js');
loadScript('src/js/crypto/tron/tron-contracts.js');
loadScript('src/js/crypto/tron/tron-transactions.js');
loadScript('src/js/crypto/tron-engine.js');
loadScript('src/js/vendor/stellar-sdk.min.js');
loadScript('src/js/crypto/stellar/stellar-providers.js');
loadScript('src/js/crypto/stellar/stellar-transactions.js');
loadScript('src/js/crypto/stellar-engine.js');
loadScript('src/js/crypto/cardano-engine.js');
loadScript('src/js/crypto/registry/evm-networks.js');
loadScript('src/js/crypto/registry/evm-testnets.js');
loadScript('src/js/crypto/network-registry.js');
loadScript('src/js/crypto/ethereum-engine.js');
loadScript('src/js/providers/cardano-provider.js');
loadScript('src/js/providers/cardano-asset-provider.js');
loadScript('src/js/providers/cardano-nft-provider.js');
loadScript('src/js/providers/cardano-staking-provider.js');
loadScript('src/js/providers/cardano-governance-provider.js');
loadScript('src/js/providers/cardano-history-provider.js');
loadScript('src/js/providers/cardano-metadata-provider.js');
loadScript('src/js/providers/rpc-provider.js');
loadScript('src/js/providers/token-provider.js');
loadScript('src/js/providers/nft-provider.js');
loadScript('src/js/providers/history-provider.js');
loadScript('src/js/crypto/platform-security.js');

// Bind EVM providers to globalThis for internal references in node test environment
globalThis.B2EvmNetworkRegistry = mockWindow.B2EvmNetworkRegistry || globalThis.B2EvmNetworkRegistry;
globalThis.B2EthereumEngine = mockWindow.B2EthereumEngine || globalThis.B2EthereumEngine;
globalThis.B2RpcProvider = mockWindow.B2RpcProvider || globalThis.B2RpcProvider;
globalThis.B2TokenProvider = mockWindow.B2TokenProvider || globalThis.B2TokenProvider;
globalThis.B2NftProvider = mockWindow.B2NftProvider || globalThis.B2NftProvider;
globalThis.B2HistoryProvider = mockWindow.B2HistoryProvider || globalThis.B2HistoryProvider;

// Mock do módulo CommonJS para evitar erros na injeção do SDK de produção
globalThis.module = { exports: {} };
loadScript('packages/sdk-web3/src/index.js');

module.exports = {
  window: mockWindow,
  B2KeyDerivationEngine: mockWindow.B2KeyDerivationEngine,
  B2PlatformSecurity: mockWindow.B2PlatformSecurity,
  B2WavesBroadcaster: mockWindow.B2WavesBroadcaster,
  B2ZcashBroadcaster: mockWindow.B2ZcashBroadcaster,
  B2DashBroadcaster: mockWindow.B2DashBroadcaster,
  B2NeoEngine: mockWindow.B2NeoEngine,
  B2FilecoinEngine: mockWindow.B2FilecoinEngine,
  B2IcpEngine: mockWindow.B2IcpEngine,
  B2PolkadotEngine: mockWindow.B2PolkadotEngine,
  B2MoneroEngine: mockWindow.B2MoneroEngine,
  B2BitcoinEngine: mockWindow.B2BitcoinEngine,
  B2LitecoinEngine: mockWindow.B2LitecoinEngine,
  B2DogecoinEngine: mockWindow.B2DogecoinEngine,
  B2BitcoinCashEngine: mockWindow.B2BitcoinCashEngine,
  B2TronEngine: mockWindow.B2TronEngine || globalThis.B2TronEngine,
  B2StellarEngine: mockWindow.B2StellarEngine || globalThis.B2StellarEngine,
  B2CardanoEngine: mockWindow.B2CardanoEngine || globalThis.B2CardanoEngine,
  B2CardanoProvider: mockWindow.B2CardanoProvider || globalThis.B2CardanoProvider,
  B2CardanoMithrilProvider: mockWindow.B2CardanoMithrilProvider || globalThis.B2CardanoMithrilProvider,
  B2CardanoBabelFeeProvider: mockWindow.B2CardanoBabelFeeProvider || globalThis.B2CardanoBabelFeeProvider,
  B2CardanoCoinSelection: mockWindow.B2CardanoCoinSelection || globalThis.B2CardanoCoinSelection,
  B2CardanoHardwareWallet: mockWindow.B2CardanoHardwareWallet || globalThis.B2CardanoHardwareWallet,
  B2CardanoAssetProvider: mockWindow.B2CardanoAssetProvider || globalThis.B2CardanoAssetProvider,
  B2CardanoNftProvider: mockWindow.B2CardanoNftProvider || globalThis.B2CardanoNftProvider,
  B2CardanoStakingProvider: mockWindow.B2CardanoStakingProvider || globalThis.B2CardanoStakingProvider,
  B2CardanoGovernanceProvider: mockWindow.B2CardanoGovernanceProvider || globalThis.B2CardanoGovernanceProvider,
  B2CardanoHistoryProvider: mockWindow.B2CardanoHistoryProvider || globalThis.B2CardanoHistoryProvider,
  B2CardanoMetadataProvider: mockWindow.B2CardanoMetadataProvider || globalThis.B2CardanoMetadataProvider,
  B2EvmNetworkRegistry: mockWindow.B2EvmNetworkRegistry || globalThis.B2EvmNetworkRegistry,
  B2EthereumEngine: mockWindow.B2EthereumEngine || globalThis.B2EthereumEngine,
  B2RpcProvider: mockWindow.B2RpcProvider || globalThis.B2RpcProvider,
  B2TokenProvider: mockWindow.B2TokenProvider || globalThis.B2TokenProvider,
  B2NftProvider: mockWindow.B2NftProvider || globalThis.B2NftProvider,
  B2HistoryProvider: mockWindow.B2HistoryProvider || globalThis.B2HistoryProvider,
  B2WalletProvider: mockWindow.b2wallet ? mockWindow.b2wallet.constructor : null,
  localStorage: mockLocalStorage
};

