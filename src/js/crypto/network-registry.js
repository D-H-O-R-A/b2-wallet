/**
 * B2 Wallet — Registro de Redes EVM v1.0
 *
 * Centraliza e unifica as configurações de produção das 26 redes EVM
 * suportadas pela B2 Wallet (7 existentes + 19 novas).
 *
 * Desenvolvido por Diego Oris / Better2Better — B2 Wallet v2.
 */

; (function (global) {
  'use strict';

  const B2EvmNetworkRegistry = {
    networks: {
      "ETH": {
        chainId: 1,
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        rpcUrls: [
          "https://cloudflare-eth.com",
          "https://eth.publicnode.com",
          "https://rpc.ankr.com/eth"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/eth",
          "https://ethereum.publicnode.com"
        ],
        explorer: "https://etherscan.io",
        supportsEIP1559: true,
        supportsENS: true,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#6366f1",
        logoUrl: "src/img/eth.png"
      },
      "BSC": {
        chainId: 56,
        name: "BNB Smart Chain",
        symbol: "BNB",
        decimals: 18,
        rpcUrls: [
          "https://bsc-dataseed.binance.org",
          "https://binance.publicnode.com",
          "https://rpc.ankr.com/bsc"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/bsc",
          "https://bsc.publicnode.com"
        ],
        explorer: "https://bscscan.com",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#fbbf24",
        logoUrl: "src/img/bnb.png"
      },
      "POLYGON": {
        chainId: 137,
        name: "Polygon (POL)",
        symbol: "POL",
        decimals: 18,
        rpcUrls: [
          "https://polygon-rpc.com",
          "https://polygon.publicnode.com",
          "https://rpc.ankr.com/polygon"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/polygon",
          "https://polygon.publicnode.com"
        ],
        explorer: "https://polygonscan.com",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#8b5cf6",
        logoUrl: "src/img/polygon.png"
      },
      "AVAX": {
        chainId: 43114,
        name: "Avalanche C-Chain",
        symbol: "AVAX",
        decimals: 18,
        rpcUrls: [
          "https://api.avax.network/ext/bc/C/rpc",
          "https://avalanche.publicnode.com",
          "https://rpc.ankr.com/avalanche"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/avalanche",
          "https://avalanche.publicnode.com"
        ],
        explorer: "https://snowtrace.io",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#f87171",
        logoUrl: "src/img/avax.png"
      },
      "ARBITRUM": {
        chainId: 42161,
        name: "Arbitrum One",
        symbol: "ETH",
        decimals: 18,
        rpcUrls: [
          "https://arb1.arbitrum.io/rpc",
          "https://arbitrum.publicnode.com",
          "https://rpc.ankr.com/arbitrum"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/arbitrum",
          "https://arbitrum.publicnode.com"
        ],
        explorer: "https://arbiscan.io",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#38bdf8",
        logoUrl: "src/img/arbitrum.png"
      },
      "OPTIMISM": {
        chainId: 10,
        name: "Optimism",
        symbol: "ETH",
        decimals: 18,
        rpcUrls: [
          "https://mainnet.optimism.io",
          "https://optimism.publicnode.com",
          "https://rpc.ankr.com/optimism"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/optimism",
          "https://optimism.publicnode.com"
        ],
        explorer: "https://optimistic.etherscan.io",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#ef4444",
        logoUrl: "src/img/optimism.png"
      },
      "BASE": {
        chainId: 8453,
        name: "Base",
        symbol: "ETH",
        decimals: 18,
        rpcUrls: [
          "https://mainnet.base.org",
          "https://base.publicnode.com",
          "https://rpc.ankr.com/base"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/base",
          "https://base.publicnode.com"
        ],
        explorer: "https://basescan.org",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#0055ff",
        logoUrl: "src/img/base.png"
      },
      "SONIC": {
        chainId: 146,
        name: "Sonic",
        symbol: "S",
        decimals: 18,
        rpcUrls: [
          "https://rpc.soniclabs.com",
          "https://sonic.publicnode.com",
          "https://rpc.ankr.com/sonic"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/sonic",
          "https://sonic.publicnode.com"
        ],
        explorer: "https://sonicscan.org",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#ff3e6c",
        logoUrl: "src/img/sonic.svg"
      },
      "CRONOS": {
        chainId: 25,
        name: "Cronos",
        symbol: "CRO",
        decimals: 18,
        rpcUrls: [
          "https://evm.cronos.org",
          "https://cronos.publicnode.com",
          "https://rpc.ankr.com/cronos"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/cronos",
          "https://cronos.publicnode.com"
        ],
        explorer: "https://cronoscan.com",
        supportsEIP1559: false,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#002d72",
        logoUrl: "src/img/cronos.png"
      },
      "MANTLE": {
        chainId: 5000,
        name: "Mantle",
        symbol: "MNT",
        decimals: 18,
        rpcUrls: [
          "https://rpc.mantle.xyz",
          "https://mantle.publicnode.com",
          "https://rpc.ankr.com/mantle"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/mantle",
          "https://mantle.publicnode.com"
        ],
        explorer: "https://mantlescan.info",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#5e5ce6",
        logoUrl: "src/img/mantle.png"
      },
      "CELO": {
        chainId: 42220,
        name: "Celo",
        symbol: "CELO",
        decimals: 18,
        rpcUrls: [
          "https://forno.celo.org",
          "https://celo.publicnode.com",
          "https://rpc.ankr.com/celo"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/celo",
          "https://celo.publicnode.com"
        ],
        explorer: "https://celoscan.io",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#35d07f",
        logoUrl: "src/img/celo.png"
      },
      "KAVA": {
        chainId: 2222,
        name: "Kava",
        symbol: "KAVA",
        decimals: 18,
        rpcUrls: [
          "https://evm.kava.io",
          "https://kava.publicnode.com",
          "https://rpc.ankr.com/kava"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/kava",
          "https://kava.publicnode.com"
        ],
        explorer: "https://kavascan.com",
        supportsEIP1559: false,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#ff4d4f",
        logoUrl: "src/img/kava.png"
      },
      "MOONBEAM": {
        chainId: 1284,
        name: "Moonbeam",
        symbol: "GLMR",
        decimals: 18,
        rpcUrls: [
          "https://rpc.api.moonbeam.network",
          "https://moonbeam.publicnode.com",
          "https://rpc.ankr.com/moonbeam"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/moonbeam",
          "https://moonbeam.publicnode.com"
        ],
        explorer: "https://moonscan.io",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#53cbc9",
        logoUrl: "src/img/moonbeam.png"
      },
      "MOONRIVER": {
        chainId: 1285,
        name: "Moonriver",
        symbol: "MOVR",
        decimals: 18,
        rpcUrls: [
          "https://rpc.api.moonriver.moonbeam.network",
          "https://moonriver.publicnode.com",
          "https://rpc.ankr.com/moonriver"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/moonriver",
          "https://moonriver.publicnode.com"
        ],
        explorer: "https://moonriver.moonscan.io",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#e86e10",
        logoUrl: "src/img/moonriver.png"
      },
      "ROOTSTOCK": {
        chainId: 30,
        name: "Rootstock",
        symbol: "RBTC",
        decimals: 18,
        rpcUrls: [
          "https://public-node.rsk.co",
          "https://rootstock.publicnode.com",
          "https://mynode.torusnode.com/rsk"
        ],
        fallbackRpcUrls: [
          "https://rootstock.publicnode.com"
        ],
        explorer: "https://explorer.rsk.co",
        supportsEIP1559: false,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: false,
        supportsERC1155: false,
        supportsAccountAbstraction: false,
        color: "#00e676",
        logoUrl: "src/img/rootstock.png"
      },
      "COREDAO": {
        chainId: 1116,
        name: "Core DAO",
        symbol: "CORE",
        decimals: 18,
        rpcUrls: [
          "https://rpc.coredao.org",
          "https://core.publicnode.com",
          "https://rpc.ankr.com/core"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/core",
          "https://core.publicnode.com"
        ],
        explorer: "https://scan.coredao.org",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#e28a2a",
        logoUrl: "src/img/coredao.png"
      },
      "LINEA": {
        chainId: 59144,
        name: "Linea",
        symbol: "ETH",
        decimals: 18,
        rpcUrls: [
          "https://rpc.linea.build",
          "https://linea.publicnode.com",
          "https://rpc.ankr.com/linea"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/linea",
          "https://linea.publicnode.com"
        ],
        explorer: "https://lineascan.build",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#a7f3d0",
        logoUrl: "src/img/linea.png"
      },
      "SCROLL": {
        chainId: 534352,
        name: "Scroll",
        symbol: "ETH",
        decimals: 18,
        rpcUrls: [
          "https://rpc.scroll.io",
          "https://scroll.publicnode.com",
          "https://rpc.ankr.com/scroll"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/scroll",
          "https://scroll.publicnode.com"
        ],
        explorer: "https://scrollscan.com",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#fde68a",
        logoUrl: "src/img/scroll.png"
      },
      "BLAST": {
        chainId: 81457,
        name: "Blast",
        symbol: "ETH",
        decimals: 18,
        rpcUrls: [
          "https://rpc.blast.io",
          "https://blast.publicnode.com",
          "https://rpc.ankr.com/blast"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/blast",
          "https://blast.publicnode.com"
        ],
        explorer: "https://blastscan.io",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#fcfc03",
        logoUrl: "src/img/blast.png"
      },
      "MODE": {
        chainId: 34443,
        name: "Mode",
        symbol: "ETH",
        decimals: 18,
        rpcUrls: [
          "https://mainnet.mode.network",
          "https://mode.publicnode.com",
          "https://rpc.ankr.com/mode"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/mode",
          "https://mode.publicnode.com"
        ],
        explorer: "https://modescan.io",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#affc1a",
        logoUrl: "src/img/mode.png"
      },
      "POLYGON_ZKEVM": {
        chainId: 1101,
        name: "Polygon zkEVM",
        symbol: "ETH",
        decimals: 18,
        rpcUrls: [
          "https://zkevm-rpc.polygon.technology",
          "https://polygon-zkevm.publicnode.com",
          "https://rpc.ankr.com/polygon-zkevm"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/polygon-zkevm",
          "https://polygon-zkevm.publicnode.com"
        ],
        explorer: "https://zkevm.polygonscan.com",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#a966ff",
        logoUrl: "src/img/polygon-zkevm.png"
      },
      "TAIKO": {
        chainId: 167000,
        name: "Taiko",
        symbol: "ETH",
        decimals: 18,
        rpcUrls: [
          "https://rpc.mainnet.taiko.xyz",
          "https://taiko.publicnode.com",
          "https://rpc.ankr.com/taiko"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/taiko",
          "https://taiko.publicnode.com"
        ],
        explorer: "https://taikoscan.io",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#fc0fc0",
        logoUrl: "src/img/taiko.png"
      },
      "ZKSYNC_ERA": {
        chainId: 324,
        name: "zkSync Era",
        symbol: "ETH",
        decimals: 18,
        rpcUrls: [
          "https://mainnet.era.zksync.io",
          "https://zksync.publicnode.com",
          "https://rpc.ankr.com/zksync-era"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/zksync-era",
          "https://zksync.publicnode.com"
        ],
        explorer: "https://explorer.zksync.io",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#e0e7ff",
        logoUrl: "src/img/zksync.png"
      },
      "BERACHAIN": {
        chainId: 80094,
        name: "Berachain",
        symbol: "BERA",
        decimals: 18,
        rpcUrls: [
          "https://rpc.berachain.com",
          "https://berachain.publicnode.com",
          "https://rpc.ankr.com/berachain"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/berachain",
          "https://berachain.publicnode.com"
        ],
        explorer: "https://berascan.com",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#ecaa4f",
        logoUrl: "src/img/berachain.png"
      },
      "METIS": {
        chainId: 1088,
        name: "Metis Andromeda",
        symbol: "METIS",
        decimals: 18,
        rpcUrls: [
          "https://andromeda.metis.io/?owner=1088",
          "https://metis.publicnode.com",
          "https://rpc.ankr.com/metis"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/metis",
          "https://metis.publicnode.com"
        ],
        explorer: "https://andromeda-explorer.metis.io",
        supportsEIP1559: false,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#00d2ff",
        logoUrl: "src/img/metis.png"
      },
      "BOBA": {
        chainId: 288,
        name: "Boba Network",
        symbol: "ETH",
        decimals: 18,
        rpcUrls: [
          "https://mainnet.boba.network",
          "https://boba.publicnode.com",
          "https://rpc.ankr.com/boba"
        ],
        fallbackRpcUrls: [
          "https://rpc.ankr.com/boba",
          "https://boba.publicnode.com"
        ],
        explorer: "https://bobascan.com",
        supportsEIP1559: true,
        supportsENS: false,
        supportsMulticall: true,
        supportsNFTs: true,
        supportsERC1155: true,
        supportsAccountAbstraction: true,
        color: "#ccff00",
        logoUrl: "src/img/boba.png"
      }
    },

    testnetOverrides: {
      "ETH": {
        chainId: 11155111,
        rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
        explorer: "https://sepolia.etherscan.io",
        faucet: "https://sepoliafaucet.com/"
      },
      "POLYGON": {
        chainId: 80002,
        rpcUrls: ["https://rpc-amoy.polygon.technology"],
        explorer: "https://amoy.polygonscan.com",
        faucet: "https://faucet.polygon.technology/"
      },
      "ARBITRUM": {
        chainId: 421614,
        rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
        explorer: "https://sepolia.arbiscan.io",
        faucet: "https://faucet.quicknode.com/arbitrum/sepolia"
      },
      "OPTIMISM": {
        chainId: 11155420,
        rpcUrls: ["https://sepolia.optimism.io"],
        explorer: "https://sepolia-optimism.etherscan.io",
        faucet: "https://faucet.quicknode.com/optimism/sepolia"
      },
      "AVAX": {
        chainId: 43113,
        rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
        explorer: "https://testnet.snowtrace.io",
        faucet: "https://faucet.avax.network/"
      },
      "BSC": {
        chainId: 97,
        rpcUrls: ["https://bsc-testnet.publicnode.com"],
        explorer: "https://testnet.bscscan.com",
        faucet: "https://testnet.binance.org/faucet-smart"
      },
      "ZKSYNC": {
        chainId: 300,
        rpcUrls: ["https://sepolia.era.zksync.dev"],
        explorer: "https://sepolia.explorer.zksync.io",
        faucet: "https://faucet.quicknode.com/zksync/sepolia"
      },
      "SCROLL": {
        chainId: 534351,
        rpcUrls: ["https://sepolia-rpc.scroll.io"],
        explorer: "https://sepolia.scrollscan.com",
        faucet: "https://faucet.quicknode.com/scroll/sepolia"
      },
      "LINEA": {
        chainId: 59141,
        rpcUrls: ["https://rpc.sepolia.linea.build"],
        explorer: "https://sepolia.lineascan.build",
        faucet: "https://faucet.quicknode.com/linea/sepolia"
      },
      "BASE": {
        chainId: 84532,
        rpcUrls: ["https://sepolia.base.org"],
        explorer: "https://sepolia.basescan.org",
        faucet: "https://faucet.quicknode.com/base/sepolia"
      },
      "SONIC": {
        chainId: 14601,
        rpcUrls: ["https://rpc.testnet.soniclabs.com"],
        explorer: "https://testnet.sonicscan.org",
        faucet: "https://faucet.soniclabs.com/"
      },
      "CRONOS": {
        chainId: 338,
        rpcUrls: ["https://evm-t3.cronos.org"],
        explorer: "https://cronos.org/explorer/testnet3",
        faucet: "https://cronos.org/faucet"
      },
      "MANTLE": {
        chainId: 5003,
        rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
        explorer: "https://explorer.sepolia.mantle.xyz",
        faucet: "https://faucet.quicknode.com/mantle/sepolia"
      },
      "CELO": {
        chainId: 44787,
        rpcUrls: ["https://alfajores-forno.celo-testnet.org"],
        explorer: "https://alfajores.celoscan.io",
        faucet: "https://faucet.celo.org/"
      },
      "KAVA": {
        chainId: 2221,
        rpcUrls: ["https://evm.testnet.kava.io"],
        explorer: "https://testnet.kavascan.com",
        faucet: "https://faucet.kava.io/"
      },
      "MOONBEAM": {
        chainId: 1287,
        rpcUrls: ["https://rpc.api.moonbase.moonbeam.network"],
        explorer: "https://moonbase.moonscan.io",
        faucet: "https://faucet.moonbeam.network/"
      },
      "ROOTSTOCK": {
        chainId: 31,
        rpcUrls: ["https://public-node.testnet.rsk.co"],
        explorer: "https://explorer.testnet.rsk.co",
        faucet: "https://faucet.rootstock.co/"
      },
      "COREDAO": {
        chainId: 1115,
        rpcUrls: ["https://rpc.test.btcs.network"],
        explorer: "https://scan.test.btcs.network",
        faucet: "https://scan.test.btcs.network/faucet"
      },
      "BLAST": {
        chainId: 168587773,
        rpcUrls: ["https://sepolia.blast.io"],
        explorer: "https://sepolia.blastscan.io",
        faucet: "https://faucet.quicknode.com/blast/sepolia"
      },
      "MODE": {
        chainId: 919,
        rpcUrls: ["https://sepolia.mode.network"],
        explorer: "https://sepolia.modescan.io",
        faucet: "https://faucet.quicknode.com/mode/sepolia"
      },
      "POLYGON_ZKEVM": {
        chainId: 2442,
        rpcUrls: ["https://rpc.cardona.zkevm-rpc.com"],
        explorer: "https://cardona-zkevm.polygonscan.com",
        faucet: "https://faucet.polygon.technology/"
      },
      "TAIKO": {
        chainId: 167009,
        rpcUrls: ["https://rpc.hekla.taiko.xyz"],
        explorer: "https://hekla.taikoscan.io",
        faucet: "https://faucet.hekla.taiko.xyz/"
      },
      "BERACHAIN": {
        chainId: 80084,
        rpcUrls: ["https://bartio.rpc.berachain.com"],
        explorer: "https://bartio.berascan.com",
        faucet: "https://bartio.faucet.berachain.com/"
      },
      "METIS": {
        chainId: 59901,
        rpcUrls: ["https://sepolia.metisdevops.link"],
        explorer: "https://sepolia.explorer.metis.io",
        faucet: "https://faucet.metisdevops.link/"
      },
      "BOBA": {
        chainId: 28882,
        rpcUrls: ["https://sepolia.boba.network"],
        explorer: "https://testnet.bobascan.com",
        faucet: "https://faucet.boba.network/"
      },
      "ELECTRONEUM": {
        chainId: 52013,
        rpcUrls: ["https://rpc.testnet.electroneum.com"],
        explorer: "https://blockexplorer.testnet.electroneum.com",
        faucet: "https://faucet.electroneum.com/"
      }
    },

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
