/**
 * B2 Wallet - EvmNetworks
 */

const B2EvmNetworks = {
  "ETH": {
    "chainId": 1,
    "name": "Ethereum",
    "symbol": "ETH",
    "decimals": 18,
    "rpcUrls": [
      "https://cloudflare-eth.com",
      "https://eth.publicnode.com",
      "https://rpc.ankr.com/eth"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/eth",
      "https://ethereum.publicnode.com"
    ],
    "explorer": "https://etherscan.io",
    "supportsEIP1559": true,
    "supportsENS": true,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#6366f1",
    "logoUrl": "src/img/eth.png"
  },
  "BSC": {
    "chainId": 56,
    "name": "BNB Smart Chain",
    "symbol": "BNB",
    "decimals": 18,
    "rpcUrls": [
      "https://bsc-dataseed.binance.org",
      "https://binance.publicnode.com",
      "https://rpc.ankr.com/bsc"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/bsc",
      "https://bsc.publicnode.com"
    ],
    "explorer": "https://bscscan.com",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#fbbf24",
    "logoUrl": "src/img/bnb.png"
  },
  "POLYGON": {
    "chainId": 137,
    "name": "Polygon (POL)",
    "symbol": "POL",
    "decimals": 18,
    "rpcUrls": [
      "https://polygon-rpc.com",
      "https://polygon.publicnode.com",
      "https://rpc.ankr.com/polygon"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/polygon",
      "https://polygon.publicnode.com"
    ],
    "explorer": "https://polygonscan.com",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#8b5cf6",
    "logoUrl": "src/img/polygon.png"
  },
  "AVAX": {
    "chainId": 43114,
    "name": "Avalanche C-Chain",
    "symbol": "AVAX",
    "decimals": 18,
    "rpcUrls": [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avalanche.publicnode.com",
      "https://rpc.ankr.com/avalanche"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/avalanche",
      "https://avalanche.publicnode.com"
    ],
    "explorer": "https://snowtrace.io",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#f87171",
    "logoUrl": "src/img/avax.png"
  },
  "ARBITRUM": {
    "chainId": 42161,
    "name": "Arbitrum One",
    "symbol": "ETH",
    "decimals": 18,
    "rpcUrls": [
      "https://arb1.arbitrum.io/rpc",
      "https://arbitrum.publicnode.com",
      "https://rpc.ankr.com/arbitrum"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/arbitrum",
      "https://arbitrum.publicnode.com"
    ],
    "explorer": "https://arbiscan.io",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#38bdf8",
    "logoUrl": "src/img/arbitrum.png"
  },
  "OPTIMISM": {
    "chainId": 10,
    "name": "Optimism",
    "symbol": "ETH",
    "decimals": 18,
    "rpcUrls": [
      "https://mainnet.optimism.io",
      "https://optimism.publicnode.com",
      "https://rpc.ankr.com/optimism"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/optimism",
      "https://optimism.publicnode.com"
    ],
    "explorer": "https://optimistic.etherscan.io",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#ef4444",
    "logoUrl": "src/img/optimism.png"
  },
  "BASE": {
    "chainId": 8453,
    "name": "Base",
    "symbol": "ETH",
    "decimals": 18,
    "rpcUrls": [
      "https://mainnet.base.org",
      "https://base.publicnode.com",
      "https://rpc.ankr.com/base"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/base",
      "https://base.publicnode.com"
    ],
    "explorer": "https://basescan.org",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#0055ff",
    "logoUrl": "src/img/base.png"
  },
  "SONIC": {
    "chainId": 146,
    "name": "Sonic",
    "symbol": "S",
    "decimals": 18,
    "rpcUrls": [
      "https://rpc.soniclabs.com",
      "https://sonic.publicnode.com",
      "https://rpc.ankr.com/sonic"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/sonic",
      "https://sonic.publicnode.com"
    ],
    "explorer": "https://sonicscan.org",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#ff3e6c",
    "logoUrl": "src/img/sonic.svg"
  },
  "CRONOS": {
    "chainId": 25,
    "name": "Cronos",
    "symbol": "CRO",
    "decimals": 18,
    "rpcUrls": [
      "https://evm.cronos.org",
      "https://cronos.publicnode.com",
      "https://rpc.ankr.com/cronos"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/cronos",
      "https://cronos.publicnode.com"
    ],
    "explorer": "https://cronoscan.com",
    "supportsEIP1559": false,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#002d72",
    "logoUrl": "src/img/cronos.png"
  },
  "MANTLE": {
    "chainId": 5000,
    "name": "Mantle",
    "symbol": "MNT",
    "decimals": 18,
    "rpcUrls": [
      "https://rpc.mantle.xyz",
      "https://mantle.publicnode.com",
      "https://rpc.ankr.com/mantle"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/mantle",
      "https://mantle.publicnode.com"
    ],
    "explorer": "https://mantlescan.info",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#5e5ce6",
    "logoUrl": "src/img/mantle.png"
  },
  "CELO": {
    "chainId": 42220,
    "name": "Celo",
    "symbol": "CELO",
    "decimals": 18,
    "rpcUrls": [
      "https://forno.celo.org",
      "https://celo.publicnode.com",
      "https://rpc.ankr.com/celo"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/celo",
      "https://celo.publicnode.com"
    ],
    "explorer": "https://celoscan.io",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#35d07f",
    "logoUrl": "src/img/celo.png"
  },
  "KAVA": {
    "chainId": 2222,
    "name": "Kava",
    "symbol": "KAVA",
    "decimals": 18,
    "rpcUrls": [
      "https://evm.kava.io",
      "https://kava.publicnode.com",
      "https://rpc.ankr.com/kava"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/kava",
      "https://kava.publicnode.com"
    ],
    "explorer": "https://kavascan.com",
    "supportsEIP1559": false,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#ff4d4f",
    "logoUrl": "src/img/kava.png"
  },
  "MOONBEAM": {
    "chainId": 1284,
    "name": "Moonbeam",
    "symbol": "GLMR",
    "decimals": 18,
    "rpcUrls": [
      "https://rpc.api.moonbeam.network",
      "https://moonbeam.publicnode.com",
      "https://rpc.ankr.com/moonbeam"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/moonbeam",
      "https://moonbeam.publicnode.com"
    ],
    "explorer": "https://moonscan.io",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#53cbc9",
    "logoUrl": "src/img/moonbeam.png"
  },
  "MOONRIVER": {
    "chainId": 1285,
    "name": "Moonriver",
    "symbol": "MOVR",
    "decimals": 18,
    "rpcUrls": [
      "https://rpc.api.moonriver.moonbeam.network",
      "https://moonriver.publicnode.com",
      "https://rpc.ankr.com/moonriver"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/moonriver",
      "https://moonriver.publicnode.com"
    ],
    "explorer": "https://moonriver.moonscan.io",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#e86e10",
    "logoUrl": "src/img/moonriver.png"
  },
  "ROOTSTOCK": {
    "chainId": 30,
    "name": "Rootstock",
    "symbol": "RBTC",
    "decimals": 18,
    "rpcUrls": [
      "https://public-node.rsk.co",
      "https://rootstock.publicnode.com",
      "https://mynode.torusnode.com/rsk"
    ],
    "fallbackRpcUrls": [
      "https://rootstock.publicnode.com"
    ],
    "explorer": "https://explorer.rsk.co",
    "supportsEIP1559": false,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": false,
    "supportsERC1155": false,
    "supportsAccountAbstraction": false,
    "color": "#00e676",
    "logoUrl": "src/img/rootstock.png"
  },
  "COREDAO": {
    "chainId": 1116,
    "name": "Core DAO",
    "symbol": "CORE",
    "decimals": 18,
    "rpcUrls": [
      "https://rpc.coredao.org",
      "https://core.publicnode.com",
      "https://rpc.ankr.com/core"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/core",
      "https://core.publicnode.com"
    ],
    "explorer": "https://scan.coredao.org",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#e28a2a",
    "logoUrl": "src/img/coredao.png"
  },
  "LINEA": {
    "chainId": 59144,
    "name": "Linea",
    "symbol": "ETH",
    "decimals": 18,
    "rpcUrls": [
      "https://rpc.linea.build",
      "https://linea.publicnode.com",
      "https://rpc.ankr.com/linea"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/linea",
      "https://linea.publicnode.com"
    ],
    "explorer": "https://lineascan.build",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#a7f3d0",
    "logoUrl": "src/img/linea.png"
  },
  "SCROLL": {
    "chainId": 534352,
    "name": "Scroll",
    "symbol": "ETH",
    "decimals": 18,
    "rpcUrls": [
      "https://rpc.scroll.io",
      "https://scroll.publicnode.com",
      "https://rpc.ankr.com/scroll"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/scroll",
      "https://scroll.publicnode.com"
    ],
    "explorer": "https://scrollscan.com",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#fde68a",
    "logoUrl": "src/img/scroll.png"
  },
  "BLAST": {
    "chainId": 81457,
    "name": "Blast",
    "symbol": "ETH",
    "decimals": 18,
    "rpcUrls": [
      "https://rpc.blast.io",
      "https://blast.publicnode.com",
      "https://rpc.ankr.com/blast"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/blast",
      "https://blast.publicnode.com"
    ],
    "explorer": "https://blastscan.io",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#fcfc03",
    "logoUrl": "src/img/blast.png"
  },
  "MODE": {
    "chainId": 34443,
    "name": "Mode",
    "symbol": "ETH",
    "decimals": 18,
    "rpcUrls": [
      "https://mainnet.mode.network",
      "https://mode.publicnode.com",
      "https://rpc.ankr.com/mode"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/mode",
      "https://mode.publicnode.com"
    ],
    "explorer": "https://modescan.io",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#affc1a",
    "logoUrl": "src/img/mode.png"
  },
  "POLYGON_ZKEVM": {
    "chainId": 1101,
    "name": "Polygon zkEVM",
    "symbol": "ETH",
    "decimals": 18,
    "rpcUrls": [
      "https://zkevm-rpc.polygon.technology",
      "https://polygon-zkevm.publicnode.com",
      "https://rpc.ankr.com/polygon-zkevm"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/polygon-zkevm",
      "https://polygon-zkevm.publicnode.com"
    ],
    "explorer": "https://zkevm.polygonscan.com",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#a966ff",
    "logoUrl": "src/img/polygon-zkevm.png"
  },
  "TAIKO": {
    "chainId": 167000,
    "name": "Taiko",
    "symbol": "ETH",
    "decimals": 18,
    "rpcUrls": [
      "https://rpc.mainnet.taiko.xyz",
      "https://taiko.publicnode.com",
      "https://rpc.ankr.com/taiko"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/taiko",
      "https://taiko.publicnode.com"
    ],
    "explorer": "https://taikoscan.io",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#fc0fc0",
    "logoUrl": "src/img/taiko.png"
  },
  "ZKSYNC_ERA": {
    "chainId": 324,
    "name": "zkSync Era",
    "symbol": "ETH",
    "decimals": 18,
    "rpcUrls": [
      "https://mainnet.era.zksync.io",
      "https://zksync.publicnode.com",
      "https://rpc.ankr.com/zksync-era"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/zksync-era",
      "https://zksync.publicnode.com"
    ],
    "explorer": "https://explorer.zksync.io",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#e0e7ff",
    "logoUrl": "src/img/zksync.png"
  },
  "BERACHAIN": {
    "chainId": 80094,
    "name": "Berachain",
    "symbol": "BERA",
    "decimals": 18,
    "rpcUrls": [
      "https://rpc.berachain.com",
      "https://berachain.publicnode.com",
      "https://rpc.ankr.com/berachain"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/berachain",
      "https://berachain.publicnode.com"
    ],
    "explorer": "https://berascan.com",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#ecaa4f",
    "logoUrl": "src/img/berachain.png"
  },
  "METIS": {
    "chainId": 1088,
    "name": "Metis Andromeda",
    "symbol": "METIS",
    "decimals": 18,
    "rpcUrls": [
      "https://andromeda.metis.io/?owner=1088",
      "https://metis.publicnode.com",
      "https://rpc.ankr.com/metis"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/metis",
      "https://metis.publicnode.com"
    ],
    "explorer": "https://andromeda-explorer.metis.io",
    "supportsEIP1559": false,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#00d2ff",
    "logoUrl": "src/img/metis.png"
  },
  "BOBA": {
    "chainId": 288,
    "name": "Boba Network",
    "symbol": "ETH",
    "decimals": 18,
    "rpcUrls": [
      "https://mainnet.boba.network",
      "https://boba.publicnode.com",
      "https://rpc.ankr.com/boba"
    ],
    "fallbackRpcUrls": [
      "https://rpc.ankr.com/boba",
      "https://boba.publicnode.com"
    ],
    "explorer": "https://bobascan.com",
    "supportsEIP1559": true,
    "supportsENS": false,
    "supportsMulticall": true,
    "supportsNFTs": true,
    "supportsERC1155": true,
    "supportsAccountAbstraction": true,
    "color": "#ccff00",
    "logoUrl": "src/img/boba.png"
  }
};

if (typeof window !== "undefined") {
  window.B2EvmNetworks = B2EvmNetworks;
}
if (typeof globalThis !== "undefined") {
  globalThis.B2EvmNetworks = B2EvmNetworks;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { B2EvmNetworks };
}
