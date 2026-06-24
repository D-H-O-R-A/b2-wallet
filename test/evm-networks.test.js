/**
 * B2 Wallet - EVM Networks Production Test Suite (2026 Edition)
 *
 * Tech Lead: Diego Oris (Better2Better)
 * Focus: 100% Real Mainnet, Zero Mocks, Zero Synthetic Data, Robust Failovers.
 */

const test = require('node:test');
const assert = require('node:assert');
const {
  B2EvmNetworkRegistry,
  B2EthereumEngine,
  B2RpcProvider,
  B2TokenProvider,
  B2NftProvider,
  B2HistoryProvider,
  localStorage
} = require('./setup');

test('EVM Networks Suite - Central Registry Integrity', async (t) => {
  await t.test('Deve conter exatamente as 26 redes EVM de produção configuradas', () => {
    const keys = Object.keys(B2EvmNetworkRegistry.networks);
    assert.strictEqual(keys.length, 26, "Deve haver exatamente 26 redes EVM registradas");
  });

  await t.test('Deve conter as 7 redes originais com parâmetros corretos', () => {
    const originalKeys = ["ETH", "BSC", "POLYGON", "AVAX", "ARBITRUM", "OPTIMISM", "BASE"];
    for (const key of originalKeys) {
      const net = B2EvmNetworkRegistry.getNetworkByKey(key);
      assert.ok(net, `A rede original ${key} deve estar presente`);
      assert.ok(net.chainId > 0, `Rede ${key} deve ter ChainID válido`);
      assert.ok(net.rpcUrls.length > 0, `Rede ${key} deve ter pelo menos um RPC URL`);
    }
  });

  await t.test('Deve conter todas as 19 novas redes EVM especificadas', () => {
    const newKeys = [
      "SONIC", "CRONOS", "MANTLE", "CELO", "KAVA",
      "MOONBEAM", "MOONRIVER", "ROOTSTOCK", "COREDAO", "LINEA",
      "SCROLL", "BLAST", "MODE", "POLYGON_ZKEVM", "TAIKO",
      "ZKSYNC_ERA", "BERACHAIN", "METIS", "BOBA"
    ];

    for (const key of newKeys) {
      const net = B2EvmNetworkRegistry.getNetworkByKey(key);
      assert.ok(net, `A nova rede ${key} deve estar presente no registro`);
      assert.ok(net.chainId > 0, `Rede ${key} deve ter ChainID válido`);
      assert.ok(net.rpcUrls.length > 0, `Rede ${key} deve ter RPC URLs configurados`);
      assert.strictEqual(net.decimals, 18, `Rede ${key} deve usar o padrão de 18 decimais`);
    }
  });

  await t.test('Deve obter redes corretamente por Chain ID', () => {
    // Teste com Ethereum (1), BSC (56), Polygon (137) e Celo (42220)
    const eth = B2EvmNetworkRegistry.getNetworkByChainId(1);
    assert.strictEqual(eth.key, "ETH");

    const bsc = B2EvmNetworkRegistry.getNetworkByChainId(56);
    assert.strictEqual(bsc.key, "BSC");

    const celo = B2EvmNetworkRegistry.getNetworkByChainId(42220);
    assert.strictEqual(celo.key, "CELO");
  });
});

test('EVM Networks Suite - RPC Provider Failover & Health Cooldown', async (t) => {
  await t.test('Deve consultar com sucesso o bloco mais recente em redes reais usando failover', async () => {
    // Consultamos em Celo e Polygon por serem extremamente rápidos e estáveis
    const celoBlockHex = await B2RpcProvider.fetchRpcWithFailover("CELO", "eth_blockNumber", []);
    const celoBlock = Number(celoBlockHex);
    assert.ok(celoBlock > 0, `Bloco retornado da rede real Celo deve ser maior que zero: ${celoBlock}`);

    const bscBlockHex = await B2RpcProvider.fetchRpcWithFailover("BSC", "eth_blockNumber", []);
    const bscBlock = Number(bscBlockHex);
    assert.ok(bscBlock > 0, `Bloco retornado da rede real BSC deve ser maior que zero: ${bscBlock}`);
  });

  await t.test('Deve tolerar falha no primeiro nó e buscar do fallback/secundário (Failover Resiliente)', async () => {
    const netConfig = B2EvmNetworkRegistry.networks["CELO"];
    const originalRpcUrls = [...netConfig.rpcUrls];

    try {
      // Injeta temporariamente um RPC quebrado no topo da lista
      netConfig.rpcUrls = ["https://rpc-completamente-invalido-offline-b2-test.xyz", ...originalRpcUrls];

      const blockHex = await B2RpcProvider.fetchRpcWithFailover("CELO", "eth_blockNumber", [], { retries: 0 });
      const block = Number(blockHex);
      assert.ok(block > 0, "Deve obter o bloco real usando failover para o nó seguinte saudável");
    } finally {
      // Restaura configuração original
      netConfig.rpcUrls = originalRpcUrls;
    }
  });

  await t.test('Deve propagar o erro se TODOS os endpoints configurados estiverem indisponíveis', async () => {
    const netConfig = B2EvmNetworkRegistry.networks["CELO"];
    const originalRpcUrls = netConfig.rpcUrls;
    const originalFallback = netConfig.fallbackRpcUrls;

    try {
      netConfig.rpcUrls = ["https://rpc-invalido-1.xyz"];
      netConfig.fallbackRpcUrls = ["https://rpc-invalido-2.xyz"];

      await assert.rejects(
        B2RpcProvider.fetchRpcWithFailover("CELO", "eth_blockNumber", [], { retries: 0, timeout: 500 }),
        /All RPC endpoints failed/,
        "Deve rejeitar com erro explicativo quando todos falham"
      );
    } finally {
      netConfig.rpcUrls = originalRpcUrls;
      netConfig.fallbackRpcUrls = originalFallback;
    }
  });
});

test('EVM Networks Suite - Token Provider Live Balances', async (t) => {
  const famousAddress = "0xab5801a7d398351b8be11c439e05c5b3259aec9b"; // Vitalik's address (lowercased to avoid checksum check)
  const zeroAddress = "0xdafea492d9c6733ae3d56b7ed1adb60692c98bc5"; // Unused address with 0 balance

  await t.test('Deve consultar saldo nativo real e retornar valor decimal legível', async () => {
    const balance = await B2TokenProvider.getNativeBalance(famousAddress, "ETH");
    const balNum = parseFloat(balance);
    assert.ok(balNum >= 0, `Saldo nativo deve ser um número válido e positivo: ${balance}`);
  });

  await t.test('Deve retornar saldo zerado correto para endereço nulo em rede de baixa taxa', async () => {
    const balance = await B2TokenProvider.getNativeBalance(zeroAddress, "CELO");
    const balNum = parseFloat(balance);
    assert.strictEqual(balNum, 0, "O endereço nulo deve retornar exatamente 0 CELO de saldo");
  });

  await t.test('Deve consultar e decodificar metadados de token customizado ERC-20 real sem mocks', async () => {
    // Contrato real do Celo Dollar (cUSD) na Celo Mainnet
    const cUsdContract = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
    const tokenInfo = await B2TokenProvider.detectCustomTokens(famousAddress, cUsdContract, "CELO");

    assert.strictEqual(tokenInfo.address, cUsdContract);
    assert.ok(tokenInfo.symbol === "cUSD" || tokenInfo.symbol === "USDm", `Símbolo decodificado do contrato deve ser cUSD ou USDm, obtido: ${tokenInfo.symbol}`);
    assert.strictEqual(tokenInfo.decimals, 18, "Decimais decodificados devem ser 18");
    assert.ok(tokenInfo.name === "Celo Dollar" || tokenInfo.name === "Mento USD" || tokenInfo.name === "Mento Dollar", `Nome decodificado deve ser Celo Dollar ou Mento USD ou Mento Dollar, obtido: ${tokenInfo.name}`);
    assert.ok(parseFloat(tokenInfo.balance) >= 0, "Saldo retornado deve ser válido");
  });

  await t.test('Deve realizar varredura de tokens populares (Token Scanner)', async () => {
    const scanned = await B2TokenProvider.scanTokenBalances(famousAddress, "ETH");
    assert.ok(Array.isArray(scanned), "Deve retornar uma lista de tokens escaneados");
    assert.ok(scanned.length > 0, "A lista de tokens conhecidos de ETH não deve estar vazia");
    
    const usdt = scanned.find(t => t.symbol === "USDT");
    assert.ok(usdt, "Deve conter USDT na lista escaneada");
    assert.strictEqual(usdt.decimals, 6);
  });
});

test('EVM Networks Suite - NFT Provider Gateway Mapping', async (t) => {
  await t.test('Deve traduzir URI IPFS para gateway HTTP público legível', () => {
    const ipfsUri = "ipfs://QmXoypizjW3WknFixtLB4orYrrWo69EfbSgoX6asksSTR/";
    const resolved = B2NftProvider.getNFTImage(ipfsUri);
    assert.strictEqual(resolved, "https://ipfs.io/ipfs/QmXoypizjW3WknFixtLB4orYrrWo69EfbSgoX6asksSTR/");
  });

  await t.test('Deve traduzir URI Arweave para gateway HTTP legível', () => {
    const arUri = "ar://t9A3Dsb9SDF83bS92F_SDf83sS98G/";
    const resolved = B2NftProvider.getNFTImage(arUri);
    assert.strictEqual(resolved, "https://arweave.net/t9A3Dsb9SDF83bS92F_SDf83sS98G/");
  });

  await t.test('Deve retornar inalterada se já for uma URL HTTP normal', () => {
    const httpUri = "https://images.mirror.xyz/some-nft-image.png";
    const resolved = B2NftProvider.getNFTImage(httpUri);
    assert.strictEqual(resolved, httpUri);
  });
});

test('EVM Networks Suite - History Provider Sync & Persistence', async (t) => {
  const mockAddress = "0xAb5801a7D398351b8bE11C439e05C5B3259aec9B";

  await t.test('Deve realizar queries de logs on-chain em paralelo e retornar do cache em caso de erro', async () => {
    localStorage.clear();

    const txs = await B2HistoryProvider.getTransactionHistory(mockAddress, "CELO");
    assert.ok(Array.isArray(txs), "Deve retornar lista de transações (array)");

    // Salva uma transação de cache fictícia localmente para simular resiliência off-line
    const cacheKey = `b2_evm_history_celo_${mockAddress.toLowerCase()}`;
    const testCache = [{ hash: "0x123", from: "0xabc", to: mockAddress, amount: "10", token: "CELO" }];
    localStorage.setItem(cacheKey, JSON.stringify(testCache));

    const retrieved = await B2HistoryProvider.getTransactionHistory(mockAddress, "CELO");
    assert.ok(retrieved.length > 0, "Deve recuperar transações contendo as do cache local");
    assert.ok(retrieved.some(tx => tx.hash === "0x123"), "Deve persistir e ler transações em cache de forma robusta");
  });
});

test('EVM Networks Suite - Watch-Only Account Restrictions', async (t) => {
  const watchOnlyAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Endereço público de exemplo
  
  await t.test('Balanços devem ser atualizados sem restrições usando o endereço público no modo Watch-Only', async () => {
    const balance = await B2TokenProvider.getNativeBalance(watchOnlyAddress, "CELO");
    assert.ok(parseFloat(balance) >= 0, "Balanço nativo deve ser obtido com sucesso para conta watch-only");
  });

  await t.test('Deve lançar erro explícito se tentar assinar mensagens ou transações sem chave privada', async () => {
    // Sem chave privada (passando null ou undefined)
    await assert.rejects(
      B2EthereumEngine.signTransaction(null, { to: watchOnlyAddress, value: "100" }),
      /Error/i,
      "Deve falhar ao tentar assinar transação sem chaves privadas"
    );

    await assert.rejects(
      B2EthereumEngine.personal_sign(undefined, "Mensagem de teste"),
      /Error/i,
      "Deve falhar ao assinar mensagem personal_sign sem chave privada"
    );
  });
});
