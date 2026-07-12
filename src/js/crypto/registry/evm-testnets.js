/**
 * B2 Wallet - EvmTestnets
 */

const B2EvmTestnets = {
  "ETH": {
    "chainId": 11155111,
    "rpcUrls": [
      "https://ethereum-sepolia-rpc.publicnode.com"
    ],
    "explorer": "https://sepolia.etherscan.io",
    "faucet": "https://sepoliafaucet.com/"
  },
  "POLYGON": {
    "chainId": 80002,
    "rpcUrls": [
      "https://rpc-amoy.polygon.technology"
    ],
    "explorer": "https://amoy.polygonscan.com",
    "faucet": "https://faucet.polygon.technology/"
  },
  "ARBITRUM": {
    "chainId": 421614,
    "rpcUrls": [
      "https://sepolia-rollup.arbitrum.io/rpc"
    ],
    "explorer": "https://sepolia.arbiscan.io",
    "faucet": "https://faucet.quicknode.com/arbitrum/sepolia"
  },
  "OPTIMISM": {
    "chainId": 11155420,
    "rpcUrls": [
      "https://sepolia.optimism.io"
    ],
    "explorer": "https://sepolia-optimism.etherscan.io",
    "faucet": "https://faucet.quicknode.com/optimism/sepolia"
  },
  "AVAX": {
    "chainId": 43113,
    "rpcUrls": [
      "https://api.avax-test.network/ext/bc/C/rpc"
    ],
    "explorer": "https://testnet.snowtrace.io",
    "faucet": "https://faucet.avax.network/"
  },
  "BSC": {
    "chainId": 97,
    "rpcUrls": [
      "https://bsc-testnet.publicnode.com"
    ],
    "explorer": "https://testnet.bscscan.com",
    "faucet": "https://testnet.binance.org/faucet-smart"
  },
  "ZKSYNC": {
    "chainId": 300,
    "rpcUrls": [
      "https://sepolia.era.zksync.dev"
    ],
    "explorer": "https://sepolia.explorer.zksync.io",
    "faucet": "https://faucet.quicknode.com/zksync/sepolia"
  },
  "SCROLL": {
    "chainId": 534351,
    "rpcUrls": [
      "https://sepolia-rpc.scroll.io"
    ],
    "explorer": "https://sepolia.scrollscan.com",
    "faucet": "https://faucet.quicknode.com/scroll/sepolia"
  },
  "LINEA": {
    "chainId": 59141,
    "rpcUrls": [
      "https://rpc.sepolia.linea.build"
    ],
    "explorer": "https://sepolia.lineascan.build",
    "faucet": "https://faucet.quicknode.com/linea/sepolia"
  },
  "BASE": {
    "chainId": 84532,
    "rpcUrls": [
      "https://sepolia.base.org"
    ],
    "explorer": "https://sepolia.basescan.org",
    "faucet": "https://faucet.quicknode.com/base/sepolia"
  },
  "SONIC": {
    "chainId": 14601,
    "rpcUrls": [
      "https://rpc.testnet.soniclabs.com"
    ],
    "explorer": "https://testnet.sonicscan.org",
    "faucet": "https://faucet.soniclabs.com/"
  },
  "CRONOS": {
    "chainId": 338,
    "rpcUrls": [
      "https://evm-t3.cronos.org"
    ],
    "explorer": "https://cronos.org/explorer/testnet3",
    "faucet": "https://cronos.org/faucet"
  },
  "MANTLE": {
    "chainId": 5003,
    "rpcUrls": [
      "https://rpc.sepolia.mantle.xyz"
    ],
    "explorer": "https://explorer.sepolia.mantle.xyz",
    "faucet": "https://faucet.quicknode.com/mantle/sepolia"
  },
  "CELO": {
    "chainId": 44787,
    "rpcUrls": [
      "https://alfajores-forno.celo-testnet.org"
    ],
    "explorer": "https://alfajores.celoscan.io",
    "faucet": "https://faucet.celo.org/"
  },
  "KAVA": {
    "chainId": 2221,
    "rpcUrls": [
      "https://evm.testnet.kava.io"
    ],
    "explorer": "https://testnet.kavascan.com",
    "faucet": "https://faucet.kava.io/"
  },
  "MOONBEAM": {
    "chainId": 1287,
    "rpcUrls": [
      "https://rpc.api.moonbase.moonbeam.network"
    ],
    "explorer": "https://moonbase.moonscan.io",
    "faucet": "https://faucet.moonbeam.network/"
  },
  "ROOTSTOCK": {
    "chainId": 31,
    "rpcUrls": [
      "https://public-node.testnet.rsk.co"
    ],
    "explorer": "https://explorer.testnet.rsk.co",
    "faucet": "https://faucet.rootstock.co/"
  },
  "COREDAO": {
    "chainId": 1115,
    "rpcUrls": [
      "https://rpc.test.btcs.network"
    ],
    "explorer": "https://scan.test.btcs.network",
    "faucet": "https://scan.test.btcs.network/faucet"
  },
  "BLAST": {
    "chainId": 168587773,
    "rpcUrls": [
      "https://sepolia.blast.io"
    ],
    "explorer": "https://sepolia.blastscan.io",
    "faucet": "https://faucet.quicknode.com/blast/sepolia"
  },
  "MODE": {
    "chainId": 919,
    "rpcUrls": [
      "https://sepolia.mode.network"
    ],
    "explorer": "https://sepolia.modescan.io",
    "faucet": "https://faucet.quicknode.com/mode/sepolia"
  },
  "POLYGON_ZKEVM": {
    "chainId": 2442,
    "rpcUrls": [
      "https://rpc.cardona.zkevm-rpc.com"
    ],
    "explorer": "https://cardona-zkevm.polygonscan.com",
    "faucet": "https://faucet.polygon.technology/"
  },
  "TAIKO": {
    "chainId": 167009,
    "rpcUrls": [
      "https://rpc.hekla.taiko.xyz"
    ],
    "explorer": "https://hekla.taikoscan.io",
    "faucet": "https://faucet.hekla.taiko.xyz/"
  },
  "BERACHAIN": {
    "chainId": 80084,
    "rpcUrls": [
      "https://bartio.rpc.berachain.com"
    ],
    "explorer": "https://bartio.berascan.com",
    "faucet": "https://bartio.faucet.berachain.com/"
  },
  "METIS": {
    "chainId": 59901,
    "rpcUrls": [
      "https://sepolia.metisdevops.link"
    ],
    "explorer": "https://sepolia.explorer.metis.io",
    "faucet": "https://faucet.metisdevops.link/"
  },
  "BOBA": {
    "chainId": 28882,
    "rpcUrls": [
      "https://sepolia.boba.network"
    ],
    "explorer": "https://testnet.bobascan.com",
    "faucet": "https://faucet.boba.network/"
  },
  "ELECTRONEUM": {
    "chainId": 52013,
    "rpcUrls": [
      "https://rpc.testnet.electroneum.com"
    ],
    "explorer": "https://blockexplorer.testnet.electroneum.com",
    "faucet": "https://faucet.electroneum.com/"
  }
};

if (typeof window !== "undefined") {
  window.B2EvmTestnets = B2EvmTestnets;
}
if (typeof globalThis !== "undefined") {
  globalThis.B2EvmTestnets = B2EvmTestnets;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { B2EvmTestnets };
}
