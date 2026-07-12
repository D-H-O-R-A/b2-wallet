/**
 * B2 Wallet - Registro de Blockchains da Família Utxo
 */

const B2UtxoBlockchainRegistry = [
  {
    "key": "BTC",
    "name": "Bitcoin",
    "symbol": "BTC",
    "coinType": 0,
    "decimals": 8,
    "engine": "Bitcoin",
    "chainId": null,
    "nodeUrl": "https://mempool.space/api",
    "feeApiUrl": "https://mempool.space/api/v1/fees/recommended",
    "explorer": "https://mempool.space",
    "priceCoinGeckoId": "bitcoin",
    "priceYahooSymbol": "BTC-USD",
    "logoUrl": "src/img/btc.png",
    "color": "#f59e0b",
    "supportsTokens": false,
    "supportsNFTs": false,
    "supportsStaking": false,
    "autoDiscoverTokens": false,
    "supportsSmartContracts": false
  },
  {
    "key": "LTC",
    "name": "Litecoin",
    "symbol": "LTC",
    "coinType": 2,
    "decimals": 8,
    "engine": "Bitcoin",
    "chainId": null,
    "nodeUrl": "https://litecoinspace.org/api",
    "feeApiUrl": "https://litecoinspace.org/api/v1/fees/recommended",
    "explorer": "https://litecoinspace.org",
    "priceCoinGeckoId": "litecoin",
    "priceYahooSymbol": "LTC-USD",
    "logoUrl": "src/img/ltc.png",
    "color": "#34d399",
    "supportsTokens": false,
    "supportsNFTs": false,
    "supportsStaking": false,
    "autoDiscoverTokens": false,
    "supportsSmartContracts": false
  },
  {
    "key": "DOGE",
    "name": "Dogecoin",
    "symbol": "DOGE",
    "coinType": 3,
    "decimals": 8,
    "engine": "Bitcoin",
    "chainId": null,
    "nodeUrl": "https://dogechain.info/api/v1",
    "feeApiUrl": null,
    "explorer": "https://dogechain.info",
    "priceCoinGeckoId": "dogecoin",
    "priceYahooSymbol": "DOGE-USD",
    "logoUrl": "src/img/doge.png",
    "color": "#eab308",
    "supportsTokens": false,
    "supportsNFTs": false,
    "supportsStaking": false,
    "autoDiscoverTokens": false,
    "supportsSmartContracts": false
  },
  {
    "key": "BCH",
    "name": "Bitcoin Cash",
    "symbol": "BCH",
    "coinType": 145,
    "decimals": 8,
    "engine": "Bitcoin",
    "chainId": null,
    "nodeUrl": "https://bch-chain.api.btc.com/v3",
    "feeApiUrl": null,
    "explorer": "https://explorer.bitcoin.com/bch",
    "priceCoinGeckoId": "bitcoin-cash",
    "priceYahooSymbol": "BCH-USD",
    "logoUrl": "src/img/bch.png",
    "color": "#22c55e",
    "supportsTokens": false,
    "supportsNFTs": false,
    "supportsStaking": false,
    "autoDiscoverTokens": false,
    "supportsSmartContracts": false
  },
  {
    "key": "DASH",
    "name": "Dash",
    "symbol": "DASH",
    "coinType": 5,
    "decimals": 8,
    "engine": "Dash",
    "chainId": null,
    "nodeUrl": "https://blockbook.dash.zelcore.io",
    "feeApiUrl": null,
    "explorer": "https://blockbook.dash.zelcore.io",
    "priceCoinGeckoId": "dash",
    "priceYahooSymbol": "DASH-USD",
    "logoUrl": "src/img/dash.png",
    "color": "#0284c7",
    "supportsTokens": false,
    "supportsNFTs": false,
    "supportsStaking": false,
    "autoDiscoverTokens": false,
    "supportsSmartContracts": false
  },
  {
    "key": "ZEC",
    "name": "ZCash",
    "symbol": "ZEC",
    "coinType": 133,
    "decimals": 8,
    "engine": "Bitcoin",
    "chainId": null,
    "nodeUrl": "https://blockbook.zec.zelcore.io",
    "feeApiUrl": null,
    "explorer": "https://blockbook.zec.zelcore.io",
    "priceCoinGeckoId": "zcash",
    "priceYahooSymbol": "ZEC-USD",
    "logoUrl": "src/img/zec.png",
    "color": "#a1a1aa",
    "supportsTokens": false,
    "supportsNFTs": false,
    "supportsStaking": false,
    "autoDiscoverTokens": false,
    "supportsSmartContracts": false
  }
];

if (typeof window !== "undefined") {
  window.B2UtxoBlockchainRegistry = B2UtxoBlockchainRegistry;
}
if (typeof globalThis !== "undefined") {
  globalThis.B2UtxoBlockchainRegistry = B2UtxoBlockchainRegistry;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { B2UtxoBlockchainRegistry };
}
