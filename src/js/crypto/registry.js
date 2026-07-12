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

// Agrega os sub-registros carregados sequencialmente
const B2BlockchainRegistry = [];

const loadSubRegistries = () => {
  const utxo = (typeof window !== "undefined" && window.B2UtxoBlockchainRegistry) ||
               (typeof globalThis !== "undefined" && globalThis.B2UtxoBlockchainRegistry) ||
               (typeof require !== "undefined" ? require('./registry/utxo-registry').B2UtxoBlockchainRegistry : []);

  const evm = (typeof window !== "undefined" && window.B2EvmBlockchainRegistry) ||
              (typeof globalThis !== "undefined" && globalThis.B2EvmBlockchainRegistry) ||
              (typeof require !== "undefined" ? require('./registry/evm-registry').B2EvmBlockchainRegistry : []);

  const other = (typeof window !== "undefined" && window.B2OtherBlockchainRegistry) ||
                (typeof globalThis !== "undefined" && globalThis.B2OtherBlockchainRegistry) ||
                (typeof require !== "undefined" ? require('./registry/other-registry').B2OtherBlockchainRegistry : []);

  B2BlockchainRegistry.push(...utxo, ...evm, ...other);
};

loadSubRegistries();

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
