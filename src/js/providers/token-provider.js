/**
 * B2 Wallet — Provedor de Tokens EVM (B2TokenProvider)
 *
 * Gerencia a consulta de saldos nativos, escaneamento de tokens ERC-20 populares,
 * e a autodescoberta de contratos ERC-20 customizados importados manualmente.
 *
 * Desenvolvido por Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  // Interface ERC-20 padrão utilizando Ethers.js
  let erc20Interface = null;
  function getERC20Interface() {
    if (!erc20Interface) {
      const ethers = global.B2EthereumEngine.getEthers();
      erc20Interface = new ethers.Interface([
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function balanceOf(address owner) view returns (uint256)"
      ]);
    }
    return erc20Interface;
  }

  // Lista de tokens populares/conhecidos de cada rede para escaneamento (Mainnet)
  const KNOWN_TOKENS = {
    "ETH": [
      { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", decimals: 6, name: "Tether USD" },
      { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6, name: "USD Coin" },
      { address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", symbol: "LINK", decimals: 18, name: "Chainlink" }
    ],
    "BSC": [
      { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", decimals: 18, name: "BSC-USD" },
      { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32CD580d", symbol: "USDC", decimals: 18, name: "USD Coin" }
    ],
    "POLYGON": [
      { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", decimals: 6, name: "(PoS) Tether USD" },
      { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", symbol: "USDC", decimals: 6, name: "USD Coin" }
    ],
    "CELO": [
      { address: "0x765DE816845861e75A25fCA122bb6898B8B1282a", symbol: "cUSD", decimals: 18, name: "Celo Dollar" },
      { address: "0xD8763C94FC53a039811C08247ca1813D11070857", symbol: "cEUR", decimals: 18, name: "Celo Euro" },
      { address: "0xe8537a6d803a504b413e0c1275030531f2280d9b", symbol: "cREAL", decimals: 18, name: "Celo Real" }
    ]
  };

  const B2TokenProvider = {
    /**
     * Consulta o saldo nativo de um endereço em uma rede EVM.
     *
     * @param {string} address - Endereço público EVM.
     * @param {string} networkKey - Chave da rede (ex: 'ETH', 'SONIC').
     * @returns {Promise<string>} - Retorna saldo nativo formatado como string decimal.
     */
    async getNativeBalance(address, networkKey) {
      const balanceHex = await global.B2RpcProvider.fetchRpcWithFailover(networkKey, "eth_getBalance", [address, "latest"]);
      const ethers = global.B2EthereumEngine.getEthers();
      
      const registry = global.B2EvmNetworkRegistry;
      const netConfig = registry.getNetworkByKey(networkKey) || { decimals: 18 };
      
      const balanceBigInt = BigInt(balanceHex);
      return ethers.formatUnits(balanceBigInt, netConfig.decimals || 18);
    },

    /**
     * Consulta o saldo de um token ERC-20 específico para um endereço.
     *
     * @param {string} address - Endereço da carteira.
     * @param {string} tokenAddress - Contrato do token.
     * @param {string} networkKey - Chave da rede.
     * @returns {Promise<bigint>} - Saldo bruto em BigInt.
     */
    async getRawTokenBalance(address, tokenAddress, networkKey) {
      const ethers = global.B2EthereumEngine.getEthers();
      const intr = getERC20Interface();
      const data = intr.encodeFunctionData("balanceOf", [address]);

      const responseHex = await global.B2RpcProvider.fetchRpcWithFailover(networkKey, "eth_call", [
        { to: tokenAddress, data: data },
        "latest"
      ]);

      if (!responseHex || responseHex === "0x") return 0n;
      const result = intr.decodeFunctionResult("balanceOf", responseHex);
      return result[0];
    },

    /**
     * Busca os saldos de múltiplos tokens em lote (paralelo rápido).
     */
    async getTokenBalances(address, networkKey, tokenList = []) {
      const ethers = global.B2EthereumEngine.getEthers();
      const listToQuery = tokenList.length > 0 ? tokenList : (KNOWN_TOKENS[networkKey.toUpperCase()] || []);
      
      const promises = listToQuery.map(async (token) => {
        try {
          const rawBal = await this.getRawTokenBalance(address, token.address, networkKey);
          const formatted = ethers.formatUnits(rawBal, token.decimals);
          return {
            ...token,
            balance: formatted,
            rawBalance: rawBal.toString()
          };
        } catch (e) {
          return {
            ...token,
            balance: "0.0",
            rawBalance: "0"
          };
        }
      });

      return await Promise.all(promises);
    },

    /**
     * Escaneia os saldos de todos os tokens conhecidos daquela rede.
     */
    async scanTokenBalances(address, networkKey) {
      const tokens = KNOWN_TOKENS[networkKey.toUpperCase()] || [];
      return await this.getTokenBalances(address, networkKey, tokens);
    },

    /**
     * Detecta e importa de forma autônoma e segura um contrato de token ERC-20 customizado.
     *
     * @param {string} address - Endereço público do usuário.
     * @param {string} contractAddress - Endereço do contrato ERC-20 a ser inspecionado.
     * @param {string} networkKey - Rede ativa.
     * @returns {Promise<object>} - Dados estruturados do token com saldo atualizado.
     */
    async detectCustomTokens(address, contractAddress, networkKey) {
      const ethers = global.B2EthereumEngine.getEthers();
      const intr = getERC20Interface();

      // Métodos de leitura de metadados
      const nameData = intr.encodeFunctionData("name");
      const symbolData = intr.encodeFunctionData("symbol");
      const decimalsData = intr.encodeFunctionData("decimals");
      const balanceData = intr.encodeFunctionData("balanceOf", [address]);

      // Executa chamadas em paralelo
      const [nameHex, symbolHex, decimalsHex, balanceHex] = await Promise.all([
        global.B2RpcProvider.fetchRpcWithFailover(networkKey, "eth_call", [{ to: contractAddress, data: nameData }, "latest"]).catch(() => "0x"),
        global.B2RpcProvider.fetchRpcWithFailover(networkKey, "eth_call", [{ to: contractAddress, data: symbolData }, "latest"]).catch(() => "0x"),
        global.B2RpcProvider.fetchRpcWithFailover(networkKey, "eth_call", [{ to: contractAddress, data: decimalsData }, "latest"]).catch(() => "0x00"),
        global.B2RpcProvider.fetchRpcWithFailover(networkKey, "eth_call", [{ to: contractAddress, data: balanceData }, "latest"]).catch(() => "0x00")
      ]);

      let name = "Custom Token";
      let symbol = "TOKEN";
      let decimals = 18;
      let rawBalance = 0n;

      try {
        if (nameHex !== "0x") name = intr.decodeFunctionResult("name", nameHex)[0];
      } catch(e) {}
      try {
        if (symbolHex !== "0x") symbol = intr.decodeFunctionResult("symbol", symbolHex)[0];
      } catch(e) {}
      try {
        if (decimalsHex !== "0x00") decimals = Number(intr.decodeFunctionResult("decimals", decimalsHex)[0]);
      } catch(e) {}
      try {
        if (balanceHex !== "0x00") rawBalance = intr.decodeFunctionResult("balanceOf", balanceHex)[0];
      } catch(e) {}

      const formattedBalance = ethers.formatUnits(rawBalance, decimals);

      return {
        address: contractAddress,
        symbol: symbol,
        name: name,
        decimals: decimals,
        balance: formattedBalance,
        rawBalance: rawBalance.toString()
      };
    }
  };

  // Exportação no escopo global
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2TokenProvider;
  }
  if (global.window) {
    global.window.B2TokenProvider = B2TokenProvider;
  } else {
    global.B2TokenProvider = B2TokenProvider;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
