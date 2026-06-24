/**
 * B2 Wallet - Registro Modular de Blockchains v2.0
 *
 * Tech Lead: Diego Oris (Better2Better)
 * Cada entrada possui flags que controlam funcionalidades da UI:
 *   supportsTokens      — exibe aba/botão de tokens ERC-20/SPL/etc
 *   supportsNFTs        — exibe aba NFTs
 *   supportsStaking     — exibe botão de staking/leasing
 *   autoDiscoverTokens  — tokens são buscados via API (Waves, etc.)
 *   supportsSmartContracts — rede tem contratos inteligentes nativos
 */

const B2BlockchainRegistry = [

  // ================================================================
  // FAMÍLIA BITCOIN (UTXO) — sem smart contracts, sem tokens on-chain
  // ================================================================
  {
    key: "BTC",
    name: "Bitcoin",
    symbol: "BTC",
    coinType: 0,
    decimals: 8,
    engine: "Bitcoin",
    chainId: null,
    nodeUrl: "https://mempool.space/api",
    feeApiUrl: "https://mempool.space/api/v1/fees/recommended",
    explorer: "https://mempool.space",
    priceCoinGeckoId: "bitcoin",
    priceYahooSymbol: "BTC-USD",
    logoUrl: "src/img/btc.png",
    color: "#f59e0b",
    supportsTokens: false,
    supportsNFTs: false,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: false
  },
  {
    key: "LTC",
    name: "Litecoin",
    symbol: "LTC",
    coinType: 2,
    decimals: 8,
    engine: "Bitcoin",
    chainId: null,
    nodeUrl: "https://litecoinspace.org/api",
    feeApiUrl: "https://litecoinspace.org/api/v1/fees/recommended",
    explorer: "https://litecoinspace.org",
    priceCoinGeckoId: "litecoin",
    priceYahooSymbol: "LTC-USD",
    logoUrl: "src/img/ltc.png",
    color: "#34d399",
    supportsTokens: false,
    supportsNFTs: false,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: false
  },
  {
    key: "DOGE",
    name: "Dogecoin",
    symbol: "DOGE",
    coinType: 3,
    decimals: 8,
    engine: "Bitcoin",
    chainId: null,
    nodeUrl: "https://dogechain.info/api/v1",
    feeApiUrl: null,
    explorer: "https://dogechain.info",
    priceCoinGeckoId: "dogecoin",
    priceYahooSymbol: "DOGE-USD",
    logoUrl: "src/img/doge.png",
    color: "#eab308",
    supportsTokens: false,
    supportsNFTs: false,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: false
  },
  {
    key: "BCH",
    name: "Bitcoin Cash",
    symbol: "BCH",
    coinType: 145,
    decimals: 8,
    engine: "Bitcoin",
    chainId: null,
    nodeUrl: "https://bch-chain.api.btc.com/v3",
    feeApiUrl: null,
    explorer: "https://explorer.bitcoin.com/bch",
    priceCoinGeckoId: "bitcoin-cash",
    priceYahooSymbol: "BCH-USD",
    logoUrl: "src/img/bch.png",
    color: "#22c55e",
    supportsTokens: false,
    supportsNFTs: false,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: false
  },
  {
    key: "DASH",
    name: "Dash",
    symbol: "DASH",
    coinType: 5,
    decimals: 8,
    engine: "Dash",
    chainId: null,
    nodeUrl: "https://blockbook.dash.zelcore.io",
    feeApiUrl: null,
    explorer: "https://blockbook.dash.zelcore.io",
    priceCoinGeckoId: "dash",
    priceYahooSymbol: "DASH-USD",
    logoUrl: "src/img/dash.png",
    color: "#0284c7",
    supportsTokens: false,
    supportsNFTs: false,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: false
  },
  {
    key: "ZEC",
    name: "ZCash",
    symbol: "ZEC",
    coinType: 133,
    decimals: 8,
    engine: "Bitcoin",
    chainId: null,
    nodeUrl: "https://blockbook.zec.zelcore.io",
    feeApiUrl: null,
    explorer: "https://blockbook.zec.zelcore.io",
    priceCoinGeckoId: "zcash",
    priceYahooSymbol: "ZEC-USD",
    logoUrl: "src/img/zec.png",
    color: "#a1a1aa",
    supportsTokens: false,
    supportsNFTs: false,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: false
  },

  // ================================================================
  // FAMÍLIA EVM — smart contracts, tokens ERC-20, NFTs ERC-721
  // ================================================================
  {
    key: "ETH",
    name: "Ethereum",
    symbol: "ETH",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 1,
    nodeUrl: "https://cloudflare-eth.com",
    feeApiUrl: null, // calculada via eth_gasPrice
    explorer: "https://etherscan.io",
    priceCoinGeckoId: "ethereum",
    priceYahooSymbol: "ETH-USD",
    logoUrl: "src/img/eth.png",
    color: "#6366f1",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "POLYGON",
    name: "Polygon (POL)",
    symbol: "POL",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 137,
    nodeUrl: "https://polygon-rpc.com",
    feeApiUrl: null,
    explorer: "https://polygonscan.com",
    priceCoinGeckoId: "matic-network",
    priceYahooSymbol: "POL-USD",
    logoUrl: "src/img/polygon.png",
    color: "#8b5cf6",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "ARBITRUM",
    name: "Arbitrum One",
    symbol: "ETH",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 42161,
    nodeUrl: "https://arb1.arbitrum.io/rpc",
    feeApiUrl: null,
    explorer: "https://arbiscan.io",
    priceCoinGeckoId: "arbitrum",
    priceYahooSymbol: "ARB-USD",
    logoUrl: "src/img/arbitrum.png",
    color: "#38bdf8",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "OPTIMISM",
    name: "Optimism",
    symbol: "ETH",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 10,
    nodeUrl: "https://mainnet.optimism.io",
    feeApiUrl: null,
    explorer: "https://optimistic.etherscan.io",
    priceCoinGeckoId: "optimism",
    priceYahooSymbol: "OP-USD",
    logoUrl: "src/img/optimism.png",
    color: "#ef4444",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "AVAX",
    name: "Avalanche C-Chain",
    symbol: "AVAX",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 43114,
    nodeUrl: "https://api.avax.network/ext/bc/C/rpc",
    feeApiUrl: null,
    explorer: "https://snowtrace.io",
    priceCoinGeckoId: "avalanche-2",
    priceYahooSymbol: "AVAX-USD",
    logoUrl: "src/img/avax.png",
    color: "#f87171",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "BSC",
    name: "BNB Smart Chain",
    symbol: "BNB",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 56,
    nodeUrl: "https://bsc-dataseed.binance.org",
    feeApiUrl: null,
    explorer: "https://bscscan.com",
    priceCoinGeckoId: "binancecoin",
    priceYahooSymbol: "BNB-USD",
    logoUrl: "src/img/bnb.png",
    color: "#fbbf24",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "ZKSYNC",
    name: "zkSync Era",
    symbol: "ETH",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 324,
    nodeUrl: "https://mainnet.era.zksync.io",
    feeApiUrl: null,
    explorer: "https://explorer.zksync.io",
    priceCoinGeckoId: "zksync",
    priceYahooSymbol: "ZK-USD",
    logoUrl: "src/img/zksync.png",
    color: "#e0e7ff",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "SCROLL",
    name: "Scroll",
    symbol: "ETH",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 534352,
    nodeUrl: "https://rpc.scroll.io",
    feeApiUrl: null,
    explorer: "https://scrollscan.com",
    priceCoinGeckoId: "scroll",
    priceYahooSymbol: "SCR1-USD",
    logoUrl: "src/img/scroll.png",
    color: "#fde68a",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "LINEA",
    name: "Linea",
    symbol: "ETH",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 59144,
    nodeUrl: "https://rpc.linea.build",
    feeApiUrl: null,
    explorer: "https://lineascan.build",
    priceCoinGeckoId: "ethereum",
    priceYahooSymbol: "ETH-USD",
    logoUrl: "src/img/linea.png",
    color: "#a7f3d0",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "BASE",
    name: "Base",
    symbol: "ETH",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 8453,
    nodeUrl: "https://mainnet.base.org",
    feeApiUrl: null,
    explorer: "https://basescan.org",
    priceCoinGeckoId: "ethereum",
    priceYahooSymbol: "ETH-USD",
    logoUrl: "src/img/base.png",
    color: "#0055ff",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "SONIC",
    name: "Sonic",
    symbol: "S",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 146,
    nodeUrl: "https://rpc.soniclabs.com",
    feeApiUrl: null,
    explorer: "https://sonicscan.org",
    priceCoinGeckoId: "fantom",
    priceYahooSymbol: "FTM-USD",
    logoUrl: "src/img/sonic.svg",
    color: "#ff3e6c",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "CRONOS",
    name: "Cronos",
    symbol: "CRO",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 25,
    nodeUrl: "https://evm.cronos.org",
    feeApiUrl: null,
    explorer: "https://cronoscan.com",
    priceCoinGeckoId: "crypto-com-chain",
    priceYahooSymbol: "CRO-USD",
    logoUrl: "src/img/cronos.png",
    color: "#002d72",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "MANTLE",
    name: "Mantle",
    symbol: "MNT",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 5000,
    nodeUrl: "https://rpc.mantle.xyz",
    feeApiUrl: null,
    explorer: "https://mantlescan.info",
    priceCoinGeckoId: "mantle",
    priceYahooSymbol: "MNT-USD",
    logoUrl: "src/img/mantle.png",
    color: "#5e5ce6",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "CELO",
    name: "Celo",
    symbol: "CELO",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 42220,
    nodeUrl: "https://forno.celo.org",
    feeApiUrl: null,
    explorer: "https://celoscan.io",
    priceCoinGeckoId: "celo",
    priceYahooSymbol: "CELO-USD",
    logoUrl: "src/img/celo.png",
    color: "#35d07f",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "KAVA",
    name: "Kava",
    symbol: "KAVA",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 2222,
    nodeUrl: "https://evm.kava.io",
    feeApiUrl: null,
    explorer: "https://kavascan.com",
    priceCoinGeckoId: "kava",
    priceYahooSymbol: "KAVA-USD",
    logoUrl: "src/img/kava.png",
    color: "#ff4d4f",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "MOONBEAM",
    name: "Moonbeam",
    symbol: "GLMR",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 1284,
    nodeUrl: "https://rpc.api.moonbeam.network",
    feeApiUrl: null,
    explorer: "https://moonscan.io",
    priceCoinGeckoId: "moonbeam",
    priceYahooSymbol: "GLMR-USD",
    logoUrl: "src/img/moonbeam.png",
    color: "#53cbc9",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "MOONRIVER",
    name: "Moonriver",
    symbol: "MOVR",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 1285,
    nodeUrl: "https://rpc.api.moonriver.moonbeam.network",
    feeApiUrl: null,
    explorer: "https://moonriver.moonscan.io",
    priceCoinGeckoId: "moonriver",
    priceYahooSymbol: "MOVR-USD",
    logoUrl: "src/img/moonriver.png",
    color: "#e86e10",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "ROOTSTOCK",
    name: "Rootstock",
    symbol: "RBTC",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 30,
    nodeUrl: "https://public-node.rsk.co",
    feeApiUrl: null,
    explorer: "https://explorer.rsk.co",
    priceCoinGeckoId: "rootstock",
    priceYahooSymbol: "RBTC-USD",
    logoUrl: "src/img/rootstock.png",
    color: "#00e676",
    supportsTokens: true,
    supportsNFTs: false,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "COREDAO",
    name: "Core DAO",
    symbol: "CORE",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 1116,
    nodeUrl: "https://rpc.coredao.org",
    feeApiUrl: null,
    explorer: "https://scan.coredao.org",
    priceCoinGeckoId: "coredaoorg",
    priceYahooSymbol: "CORE-USD",
    logoUrl: "src/img/coredao.png",
    color: "#e28a2a",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "BLAST",
    name: "Blast",
    symbol: "ETH",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 81457,
    nodeUrl: "https://rpc.blast.io",
    feeApiUrl: null,
    explorer: "https://blastscan.io",
    priceCoinGeckoId: "blast",
    priceYahooSymbol: "ETH-USD",
    logoUrl: "src/img/blast.png",
    color: "#fcfc03",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "MODE",
    name: "Mode",
    symbol: "ETH",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 34443,
    nodeUrl: "https://mainnet.mode.network",
    feeApiUrl: null,
    explorer: "https://modescan.io",
    priceCoinGeckoId: "ethereum",
    priceYahooSymbol: "ETH-USD",
    logoUrl: "src/img/mode.png",
    color: "#affc1a",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "POLYGON_ZKEVM",
    name: "Polygon zkEVM",
    symbol: "ETH",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 1101,
    nodeUrl: "https://zkevm-rpc.polygon.technology",
    feeApiUrl: null,
    explorer: "https://zkevm.polygonscan.com",
    priceCoinGeckoId: "ethereum",
    priceYahooSymbol: "ETH-USD",
    logoUrl: "src/img/polygon-zkevm.png",
    color: "#a966ff",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "TAIKO",
    name: "Taiko",
    symbol: "ETH",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 167000,
    nodeUrl: "https://rpc.mainnet.taiko.xyz",
    feeApiUrl: null,
    explorer: "https://taikoscan.io",
    priceCoinGeckoId: "ethereum",
    priceYahooSymbol: "ETH-USD",
    logoUrl: "src/img/taiko.png",
    color: "#fc0fc0",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "BERACHAIN",
    name: "Berachain",
    symbol: "BERA",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 80094,
    nodeUrl: "https://rpc.berachain.com",
    feeApiUrl: null,
    explorer: "https://berascan.com",
    priceCoinGeckoId: "berachain",
    priceYahooSymbol: "BERA-USD",
    logoUrl: "src/img/berachain.png",
    color: "#ecaa4f",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "METIS",
    name: "Metis Andromeda",
    symbol: "METIS",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 1088,
    nodeUrl: "https://andromeda.metis.io/?owner=1088",
    feeApiUrl: null,
    explorer: "https://andromeda-explorer.metis.io",
    priceCoinGeckoId: "metis-token",
    priceYahooSymbol: "METIS-USD",
    logoUrl: "src/img/metis.png",
    color: "#00d2ff",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "BOBA",
    name: "Boba Network",
    symbol: "ETH",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 288,
    nodeUrl: "https://mainnet.boba.network",
    feeApiUrl: null,
    explorer: "https://bobascan.com",
    priceCoinGeckoId: "ethereum",
    priceYahooSymbol: "ETH-USD",
    logoUrl: "src/img/boba.png",
    color: "#ccff00",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },

  // ================================================================
  // FAMÍLIA WAVES — tokens nativos com descoberta automática, LPoS
  // ================================================================
  {
    key: "WAVES",
    name: "Waves",
    symbol: "WAVES",
    coinType: 3600,
    decimals: 8,
    engine: "Waves",
    chainId: 87, // 'W'
    nodeUrl: "https://nodes.wavesnodes.com",
    rpcEthUrl: "https://nodes.wavesnodes.com/eth",
    explorer: "https://wavesexplorer.com",
    matcher: "https://matcher.waves.exchange",
    priceCoinGeckoId: "waves",
    priceYahooSymbol: "WAVES-USD",
    logoUrl: "src/img/waves.png",
    color: "#0055ff",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: true,  // LPoS Leasing — API pública disponível
    autoDiscoverTokens: true,
    supportsSmartContracts: true
  },
  {
    key: "AMZX",
    name: "AMZX Network",
    symbol: "AMZX",
    coinType: 3600,
    decimals: 8,
    engine: "Waves",
    chainId: 65, // 'A'
    nodeUrl: "https://nodes.amz1.com.br/",
    rpcEthUrl: "https://nodes.amz1.com.br/eth",
    explorer: "https://amzxplorer.com",
    matcher: "https://matcher.waves.exchange",
    priceCoinGeckoId: "amzx",
    priceYahooSymbol: "AMZX-USD",
    logoUrl: "src/img/amzx.webp",
    color: "#f59e0b",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: true,  // LPoS Leasing — TODO: aguardando nó estável
    autoDiscoverTokens: true,
    supportsSmartContracts: true,
    leasingStatus: "pending" // indica que o leasing ainda está em configuração
  },
  {
    key: "CELERONX",
    name: "PlanetOne",
    symbol: "PLO",
    coinType: 3600,
    decimals: 8,
    engine: "Waves",
    chainId: 67, // 'C'
    nodeUrl: "https://nodes.celeronx.com/",
    rpcEthUrl: "https://nodes.celeronx.com/rpc",
    explorer: "https://explorer.celeronx.com",
    matcher: "https://nodes.celeronx.com/matcher",
    priceCoinGeckoId: "celeronx",
    priceYahooSymbol: "PLO-USD",
    logoUrl: "src/img/planetone.png",
    color: "#06b6d4",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: true,  // LPoS Leasing — TODO: aguardando nó estável
    autoDiscoverTokens: true,
    supportsSmartContracts: true,
    leasingStatus: "pending"
  },

  // ================================================================
  // OUTRAS BLOCKCHAINS COM ECOSSISTEMAS DE TOKENS
  // ================================================================
  {
    key: "SOLANA",
    name: "Solana",
    symbol: "SOL",
    coinType: 501,
    decimals: 9,
    engine: "Solana",
    chainId: null,
    nodeUrl: "https://api.mainnet-beta.solana.com",
    feeApiUrl: null, // taxa fixa de ~5000 lamports
    explorer: "https://solscan.io",
    priceCoinGeckoId: "solana",
    priceYahooSymbol: "SOL-USD",
    logoUrl: "src/img/solana.png",
    color: "#14f195",
    supportsTokens: true,    // SPL Tokens
    supportsNFTs: true,      // Metaplex NFTs
    supportsStaking: true,   // Delegated Staking
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "CARDANO",
    name: "Cardano",
    symbol: "ADA",
    coinType: 1815,
    decimals: 6,
    engine: "Cardano",
    chainId: null,
    nodeUrl: "https://cardano-mainnet.blockfrost.io/api/v0",
    feeApiUrl: null,
    explorer: "https://cardanoscan.io",
    priceCoinGeckoId: "cardano",
    priceYahooSymbol: "ADA-USD",
    logoUrl: "src/img/cardano.png",
    color: "#0033ad",
    supportsTokens: true,    // Native Assets (Mary fork)
    supportsNFTs: true,
    supportsStaking: true,   // Delegação a stake pools
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "TRON",
    name: "Tron",
    symbol: "TRX",
    coinType: 195,
    decimals: 6,
    engine: "Tron",
    chainId: null,
    nodeUrl: "https://api.trongrid.io",
    feeApiUrl: null,
    explorer: "https://tronscan.org",
    priceCoinGeckoId: "tron",
    priceYahooSymbol: "TRX-USD",
    logoUrl: "src/img/tron.png",
    color: "#ec092c",
    supportsTokens: true,    // TRC-20
    supportsNFTs: true,      // TRC-721
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "STELLAR",
    name: "Stellar",
    symbol: "XLM",
    coinType: 148,
    decimals: 7,
    engine: "Stellar",
    chainId: null,
    nodeUrl: "https://horizon.stellar.org",
    feeApiUrl: null, // base_fee via Horizon
    explorer: "https://stellar.expert",
    priceCoinGeckoId: "stellar",
    priceYahooSymbol: "XLM-USD",
    logoUrl: "src/img/stellar.png",
    color: "#64748b",
    supportsTokens: true,    // Stellar Assets (trustlines)
    supportsNFTs: false,     // sem NFTs padronizados
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: false
  },
  {
    key: "MONERO",
    name: "Monero",
    symbol: "XMR",
    coinType: 128,
    decimals: 12,
    engine: "Monero",
    chainId: null,
    nodeUrl: "https://node.community.monero.info:18081",
    feeApiUrl: null,
    explorer: "https://xmrchain.net",
    priceCoinGeckoId: "monero",
    priceYahooSymbol: "XMR-USD",
    logoUrl: "src/img/monero.png",
    color: "#ff6600",
    supportsTokens: false,   // Privacy coin — sem tokens on-chain
    supportsNFTs: false,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: false
  },
  {
    key: "ELECTRONEUM",
    name: "Electroneum",
    symbol: "ETN",
    coinType: 60,
    decimals: 18,
    engine: "EVM",
    chainId: 52014,
    nodeUrl: "https://rpc.electroneum.com",
    feeApiUrl: null,
    explorer: "https://blockexplorer.electroneum.com",
    priceCoinGeckoId: "electroneum",
    priceYahooSymbol: "ETN-USD",
    logoUrl: "src/img/electroneum.png",
    color: "#232937",
    supportsTokens: true,
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "POLKADOT",
    name: "Polkadot",
    symbol: "DOT",
    coinType: 354,
    decimals: 10,
    engine: "Polkadot",
    chainId: null,
    nodeUrl: "https://rpc.polkadot.io",
    feeApiUrl: null,
    explorer: "https://polkadot.subscan.io",
    priceCoinGeckoId: "polkadot",
    priceYahooSymbol: "DOT-USD",
    logoUrl: "src/img/polkadot.png",
    color: "#e6007a",
    supportsTokens: true,    // Parachain assets
    supportsNFTs: true,
    supportsStaking: true,   // Nominação de validadores
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "ICP",
    name: "Internet Computer",
    symbol: "ICP",
    coinType: 223,
    decimals: 8,
    engine: "ICP",
    chainId: null,
    nodeUrl: "https://ic0.app",
    feeApiUrl: null,
    explorer: "https://dashboard.internetcomputer.org",
    priceCoinGeckoId: "internet-computer",
    priceYahooSymbol: "ICP-USD",
    logoUrl: "src/img/icp.png",
    color: "#29abe2",
    supportsTokens: true,    // ICRC-1 tokens
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "FILECOIN",
    name: "Filecoin",
    symbol: "FIL",
    coinType: 461,
    decimals: 18,
    engine: "Filecoin",
    chainId: null,
    nodeUrl: "https://api.node.glif.io",
    feeApiUrl: null,
    explorer: "https://filfox.info",
    priceCoinGeckoId: "filecoin",
    priceYahooSymbol: "FIL-USD",
    logoUrl: "src/img/filecoin.png",
    color: "#00c3ff",
    supportsTokens: true,    // FEVM tokens
    supportsNFTs: true,
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  },
  {
    key: "NEO",
    name: "NEO",
    symbol: "NEO",
    coinType: 888,
    decimals: 0,
    engine: "NEO",
    chainId: null,
    nodeUrl: "https://mainnet1.neo.coz.io:443",
    feeApiUrl: null,
    explorer: "https://neotube.io",
    priceCoinGeckoId: "neo",
    priceYahooSymbol: "NEO-USD",
    logoUrl: "src/img/neo.png",
    color: "#00e599",
    supportsTokens: true,    // NEP-17 tokens
    supportsNFTs: true,      // NEP-11
    supportsStaking: false,
    autoDiscoverTokens: false,
    supportsSmartContracts: true
  }
];

const B2TokenRegistry = [
  // ================================================================
  // TOKENS ETHEREUM (ETH)
  // ================================================================
  {
    id: "usdt-ethereum",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    blockchain: "ETH",
    contract: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    description: "Tether (USDT) is a stablecoin pegged to the US Dollar, issued by Tether on Ethereum and various other blockchains.",
    imageURL: "src/img/tokens/usdt.png",
    website: "https://tether.to",
    socialmedias: ["https://x.com/tether_to", "https://t.me/TetherSingle"],
    totalSupply: 112000000000
  },
  {
    id: "usdc-ethereum",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    blockchain: "ETH",
    contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    description: "USD Coin (USDC) is a fully collateralized, US Dollar-backed stablecoin developed by Circle and Coinbase.",
    imageURL: "src/img/tokens/usdc.png",
    website: "https://circle.com",
    socialmedias: ["https://x.com/circle", "https://t.me/circle"],
    totalSupply: 34000000000
  },
  {
    id: "link-ethereum",
    name: "Chainlink",
    symbol: "LINK",
    decimals: 18,
    blockchain: "ETH",
    contract: "0x514910771af9ca656af840dff83e8264ecf986ca",
    description: "Chainlink (LINK) is a decentralized oracle network that provides real-world data to smart contracts on the blockchain.",
    imageURL: "src/img/tokens/link.png",
    website: "https://chain.link",
    socialmedias: ["https://x.com/chainlink", "https://t.me/chainlinkofficial"],
    totalSupply: 1000000000
  },
  {
    id: "uni-ethereum",
    name: "Uniswap",
    symbol: "UNI",
    decimals: 18,
    blockchain: "ETH",
    contract: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    description: "Uniswap is a fully decentralized, automated liquidity protocol on Ethereum that enables seamless swapping of ERC-20 tokens.",
    imageURL: "src/img/tokens/uni.png",
    website: "https://uniswap.org",
    socialmedias: ["https://x.com/uniswap", "https://discord.gg/uniswap"],
    totalSupply: 1000000000
  },
  {
    id: "wbtc-ethereum",
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8,
    blockchain: "ETH",
    contract: "0x2260fac5e5542a77aa44fbcfedf7c193bc2c599",
    description: "Wrapped Bitcoin (WBTC) is an ERC-20 token backed 1:1 with Bitcoin, bringing the liquidity of Bitcoin to the Ethereum DeFi ecosystem.",
    imageURL: "src/img/tokens/wbtc.png",
    website: "https://wbtc.network",
    socialmedias: ["https://x.com/WrappedBTC"],
    totalSupply: 153200
  },
  {
    id: "shib-ethereum",
    name: "Shiba Inu",
    symbol: "SHIB",
    decimals: 18,
    blockchain: "ETH",
    contract: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
    description: "Shiba Inu (SHIB) is a decentralized, community-led currency held by millions of users across the globe on Ethereum.",
    imageURL: "src/img/tokens/shib.png",
    website: "https://shibatoken.com",
    socialmedias: ["https://x.com/Shibtoken", "https://t.me/ShibaInu_Official"],
    totalSupply: 589270000000000
  },
  {
    id: "dai-ethereum",
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
    blockchain: "ETH",
    contract: "0x6b175474e89094c44da98b954eedeac495271d0f",
    description: "Dai is a decentralized, collateral-backed stablecoin whose value is pegged 1:1 to the US Dollar, managed by MakerDAO.",
    imageURL: "src/img/tokens/dai.png",
    website: "https://makerdao.com",
    socialmedias: ["https://x.com/MakerDAO"],
    totalSupply: 5350000000
  },

  // ================================================================
  // TOKENS BNB SMART CHAIN (BSC)
  // ================================================================
  {
    id: "usdt-bsc",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 18,
    blockchain: "BSC",
    contract: "0x55d398326f99059ff775485246999027b3197955",
    description: "Tether USD bridged to BNB Smart Chain.",
    imageURL: "src/img/tokens/usdt.png",
    website: "https://tether.to",
    socialmedias: ["https://x.com/tether_to"],
    totalSupply: 5100000000
  },
  {
    id: "usdc-bsc",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
    blockchain: "BSC",
    contract: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    description: "USD Coin bridged to BNB Smart Chain.",
    imageURL: "src/img/tokens/usdc.png",
    website: "https://circle.com",
    socialmedias: ["https://x.com/circle"],
    totalSupply: 1200000000
  },
  {
    id: "cake-bsc",
    name: "PancakeSwap Token",
    symbol: "CAKE",
    decimals: 18,
    blockchain: "BSC",
    contract: "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
    description: "CAKE is the native utility and governance token of PancakeSwap, the leading decentralized exchange on BNB Smart Chain.",
    imageURL: "src/img/tokens/cake.png",
    website: "https://pancakeswap.finance",
    socialmedias: ["https://x.com/pancakeswap", "https://t.me/pancakeswap"],
    totalSupply: 388000000
  },
  {
    id: "wbnb-bsc",
    name: "Wrapped BNB",
    symbol: "WBNB",
    decimals: 18,
    blockchain: "BSC",
    contract: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
    description: "Wrapped BNB (WBNB) allows BNB to be used in standardized smart contracts as a BEP-20 token on the BNB Smart Chain.",
    imageURL: "src/img/tokens/wbnb.png",
    website: "https://www.bnbchain.org",
    socialmedias: ["https://x.com/BNBCHAIN"],
    totalSupply: 2500000
  },
  {
    id: "busd-bsc",
    name: "Binance USD",
    symbol: "BUSD",
    decimals: 18,
    blockchain: "BSC",
    contract: "0xe9e7cea3ded01f57cd351657e5b11179492d2112",
    description: "Binance USD (BUSD) is a 1:1 USD-backed stablecoin approved by the NYDFS and issued in partnership with Paxos.",
    imageURL: "src/img/tokens/busd.png",
    website: "https://paxos.com/busd",
    socialmedias: ["https://x.com/PaxosGlobal"],
    totalSupply: 70000000
  },

  // ================================================================
  // TOKENS POLYGON
  // ================================================================
  {
    id: "usdt-polygon",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    blockchain: "POLYGON",
    contract: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    description: "Tether USD on Polygon POS.",
    imageURL: "src/img/tokens/usdt.png",
    website: "https://tether.to",
    socialmedias: ["https://x.com/tether_to"],
    totalSupply: 1200000000
  },
  {
    id: "usdc-polygon",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    blockchain: "POLYGON",
    contract: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    description: "USD Coin on Polygon POS.",
    imageURL: "src/img/tokens/usdc.png",
    website: "https://circle.com",
    socialmedias: ["https://x.com/circle"],
    totalSupply: 1100000000
  },
  {
    id: "weth-polygon",
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    blockchain: "POLYGON",
    contract: "0x7ceb23fd6bc0add1267f12284738a415344a485e4",
    description: "Wrapped Ether (WETH) allows users to make pre-authorized bids that can be fulfilled automatically at a later date on Polygon.",
    imageURL: "src/img/tokens/weth.png",
    website: "https://weth.io",
    socialmedias: ["https://x.com/polygon"],
    totalSupply: 3000000
  },
  {
    id: "wbtc-polygon",
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8,
    blockchain: "POLYGON",
    contract: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    description: "Wrapped Bitcoin bridged to Polygon POS network.",
    imageURL: "src/img/tokens/wbtc-poly.png",
    website: "https://wbtc.network",
    socialmedias: ["https://x.com/WrappedBTC"],
    totalSupply: 50000
  },

  // ================================================================
  // TOKENS TRON (TRON)
  // ================================================================
  {
    id: "usdt-tron",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    blockchain: "TRON",
    contract: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    description: "Tether USD issued on the Tron Network as a TRC-20 token.",
    imageURL: "src/img/tokens/usdt.png",
    website: "https://tether.to",
    socialmedias: ["https://x.com/tether_to"],
    totalSupply: 59000000000
  },
  {
    id: "usdc-tron",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    blockchain: "TRON",
    contract: "TE2RzoSV3wS99d63KBO1gY65SaUJF7GZrH",
    description: "USD Coin issued on the Tron Network as a TRC-20 token.",
    imageURL: "src/img/tokens/usdc.png",
    website: "https://circle.com",
    socialmedias: ["https://x.com/circle"],
    totalSupply: 1200000000
  },

  // ================================================================
  // TOKENS SOLANA (SOLANA)
  // ================================================================
  {
    id: "usdt-solana",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    blockchain: "SOLANA",
    contract: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    description: "Tether USD issued on Solana as an SPL token.",
    imageURL: "src/img/tokens/usdt.png",
    website: "https://tether.to",
    socialmedias: ["https://x.com/tether_to"],
    totalSupply: 1800000000
  },
  {
    id: "usdc-solana",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    blockchain: "SOLANA",
    contract: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    description: "USD Coin issued on Solana as an SPL token.",
    imageURL: "src/img/tokens/usdc.png",
    website: "https://circle.com",
    socialmedias: ["https://x.com/circle"],
    totalSupply: 5800000000
  },
  {
    id: "bonk-solana",
    name: "Bonk",
    symbol: "BONK",
    decimals: 5,
    blockchain: "SOLANA",
    contract: "DezXAZ8z7PnrnRJjz3wX4mP4fR1gMEWhbVLstgA9v977",
    description: "Bonk is the first Solana dog coin for the people, by the people with 50% of the total supply airdropped to the Solana community.",
    imageURL: "src/img/tokens/bonk.png",
    website: "https://bonkcoin.com",
    socialmedias: ["https://x.com/bonk_coin"],
    totalSupply: 92600000000000
  },
  {
    id: "msol-solana",
    name: "Marinade Staked SOL",
    symbol: "mSOL",
    decimals: 9,
    blockchain: "SOLANA",
    contract: "mSoLzY7beSGP65fUtbTXHQCTMsU69j9SoLXrS3FS6xe",
    description: "mSOL is a liquid staking token received when you stake SOL on Marinade, representing your staked SOL and its accumulated rewards.",
    imageURL: "src/img/tokens/msol.png",
    website: "https://marinade.finance",
    socialmedias: ["https://x.com/MarinadeFinance"],
    totalSupply: 6023000
  },
  {
    id: "wif-solana",
    name: "dogwifhat",
    symbol: "WIF",
    decimals: 6,
    blockchain: "SOLANA",
    contract: "EKpQGSJtjMFqKZ9KQGWjaCwY7Syv969SyKSYfnSmU794",
    description: "dogwifhat (WIF) is a leading community meme coin on Solana featuring a cute dog wearing a knit hat.",
    imageURL: "src/img/tokens/wif.png",
    website: "https://dogwifcoin.org",
    socialmedias: ["https://x.com/dogwifcoin"],
    totalSupply: 998906000
  },

  // ================================================================
  // TOKENS ARBITRUM (ARB)
  // ================================================================
  {
    id: "arb-arbitrum",
    name: "Arbitrum",
    symbol: "ARB",
    decimals: 18,
    blockchain: "ARBITRUM",
    contract: "0x912ce59144191c1204e64559fe8253a0e49e6548",
    description: "ARB is the governance token for Arbitrum, a leading Ethereum Layer 2 optimistic rollup protocol designed for scaling.",
    imageURL: "src/img/tokens/arb.png",
    website: "https://arbitrum.foundation",
    socialmedias: ["https://x.com/arbitrum"],
    totalSupply: 10000000000
  },
  {
    id: "usdc-arbitrum",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    blockchain: "ARBITRUM",
    contract: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    description: "Native USD Coin on the Arbitrum Layer 2 network.",
    imageURL: "src/img/tokens/usdc.png",
    website: "https://circle.com",
    socialmedias: ["https://x.com/circle"],
    totalSupply: 2500000000
  },
  {
    id: "usdt-arbitrum",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    blockchain: "ARBITRUM",
    contract: "0xfd086bc7cd5c1b875c88404a2d489f243d9ac231",
    description: "Tether USD on the Arbitrum Layer 2 network.",
    imageURL: "src/img/tokens/usdt.png",
    website: "https://tether.to",
    socialmedias: ["https://x.com/tether_to"],
    totalSupply: 3200000000
  },

  // ================================================================
  // TOKENS OPTIMISM (OP)
  // ================================================================
  {
    id: "op-optimism",
    name: "Optimism",
    symbol: "OP",
    decimals: 18,
    blockchain: "OPTIMISM",
    contract: "0x4200000000000000000000000000000000000042",
    description: "OP is the native governance and utility token of the Optimism Collective Layer 2 scaling protocol.",
    imageURL: "src/img/tokens/op.png",
    website: "https://optimism.io",
    socialmedias: ["https://x.com/Optimism"],
    totalSupply: 4294967296
  },
  {
    id: "usdc-optimism",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    blockchain: "OPTIMISM",
    contract: "0x0b2c639c533813f4aa9d7837ca6262943497d626",
    description: "Native USD Coin on the Optimism Layer 2 network.",
    imageURL: "src/img/tokens/usdc.png",
    website: "https://circle.com",
    socialmedias: ["https://x.com/circle"],
    totalSupply: 1100000000
  },
  {
    id: "usdt-optimism",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    blockchain: "OPTIMISM",
    contract: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
    description: "Tether USD on the Optimism Layer 2 network.",
    imageURL: "src/img/tokens/usdt.png",
    website: "https://tether.to",
    socialmedias: ["https://x.com/tether_to"],
    totalSupply: 1100000000
  },

  // ================================================================
  // TOKENS BASE (BASE)
  // ================================================================
  {
    id: "usdc-base",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    blockchain: "BASE",
    contract: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    description: "Native USD Coin on Base Layer 2 network, launched by Coinbase.",
    imageURL: "src/img/tokens/usdc.png",
    website: "https://circle.com",
    socialmedias: ["https://x.com/circle", "https://x.com/base"],
    totalSupply: 4500000000
  },
  {
    id: "aero-base",
    name: "Aerodrome Finance",
    symbol: "AERO",
    decimals: 18,
    blockchain: "BASE",
    contract: "0x940181a94a35a4569e4529a3cdfb74e38fd98631",
    description: "Aerodrome Finance is a next-generation AMM designed to serve as Base's central liquidity hub, combining a powerful liquidity incentive engine.",
    imageURL: "src/img/tokens/aero.png",
    website: "https://aerodrome.finance",
    socialmedias: ["https://x.com/AerodromeFi"],
    totalSupply: 812000000
  },

  // ================================================================
  // TOKENS AVALANCHE (AVAX)
  // ================================================================
  {
    id: "usdc-avax",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    blockchain: "AVAX",
    contract: "0xb97ef1bd182289eb1122515df965d7e77b24e751",
    description: "Native USD Coin on Avalanche C-Chain.",
    imageURL: "src/img/tokens/usdc.png",
    website: "https://circle.com",
    socialmedias: ["https://x.com/circle"],
    totalSupply: 1100000000
  },
  {
    id: "usdt-avax",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    blockchain: "AVAX",
    contract: "0x97022300b1a1766057c35e16dfbc1f6d9000a6c2",
    description: "Tether USD (USDt) issued natively on Avalanche C-Chain.",
    imageURL: "src/img/tokens/usdt.png",
    website: "https://tether.to",
    socialmedias: ["https://x.com/tether_to"],
    totalSupply: 1200000000
  },

  // ================================================================
  // TOKENS WAVES (WAVES)
  // ================================================================
  {
    id: "wx-waves",
    name: "Waves Exchange Token",
    symbol: "WX",
    decimals: 8,
    blockchain: "WAVES",
    contract: "Atqv5ZE2UQXzUTGDRvYgY4yfbeY6A3gH9bX8YfGno7hX",
    description: "WX is the utility token of the Waves.Exchange decentralized trading protocol, used for governance, staking and trading fee discounts.",
    imageURL: "src/img/tokens/waves.png",
    website: "https://waves.exchange",
    socialmedias: ["https://x.com/WavesExchange"],
    totalSupply: 1000000000
  }
];

// Helper lookup e enriquecimento
B2TokenRegistry.getMetadata = function (blockchainKey, contractOrAssetId) {
  if (!contractOrAssetId) return null;
  const addressToMatch = contractOrAssetId.toLowerCase().trim();
  const chainToMatch = blockchainKey.toUpperCase().trim();

  return B2TokenRegistry.find(entry => {
    return entry.blockchain.toUpperCase().trim() === chainToMatch &&
      entry.contract.toLowerCase().trim() === addressToMatch;
  });
};

B2TokenRegistry.enrichToken = function (blockchainKey, token) {
  if (!token) return token;
  const contractOrAssetId = token.contractAddress || token.assetId || token.id;
  if (!contractOrAssetId) return token;

  const metadata = B2TokenRegistry.getMetadata(blockchainKey, contractOrAssetId);
  if (metadata) {
    token.id = metadata.id || token.id;
    token.description = metadata.description || token.description;
    token.imageURL = metadata.imageURL || token.imageURL;
    token.website = metadata.website || token.website;
    token.socialmedias = metadata.socialmedias || token.socialmedias;
    if (metadata.name && (!token.name || token.name === "Custom Token" || token.name === "Unknown TRC20" || token.name === "Token Customizado")) {
      token.name = metadata.name;
    }
    if (metadata.symbol && (!token.symbol || token.symbol === "TKN" || token.symbol === "TRC20")) {
      token.symbol = metadata.symbol;
    }
    if (metadata.decimals !== undefined && !token.decimals) {
      token.decimals = metadata.decimals;
    }
  }
  return token;
};

B2TokenRegistry.enrichChainTokens = function (chain) {
  if (chain && chain.discoveredTokens && Array.isArray(chain.discoveredTokens)) {
    chain.discoveredTokens.forEach(tok => {
      B2TokenRegistry.enrichToken(chain.key, tok);
    });
  }
};

// Exportação global universal
if (typeof window !== "undefined") {
  window.B2BlockchainRegistry = B2BlockchainRegistry;
  window.B2TokenRegistry = B2TokenRegistry;
}
if (typeof globalThis !== "undefined") {
  globalThis.B2BlockchainRegistry = B2BlockchainRegistry;
  globalThis.B2TokenRegistry = B2TokenRegistry;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { B2BlockchainRegistry, B2TokenRegistry };
}
