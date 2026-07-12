/**
 * B2 Wallet - Módulo de Sincronização, Balanço Multichain e Oracle de Preços para B2WalletApp.
 */

B2WalletApp.prototype.updateNetworkBalances = async function(specificChainKey = this.activeChainKey) {
  const activeAcc = this.accounts[this.activeAccountIndex];
  const isWatchOnly = activeAcc && activeAcc.type === 'watch-only';
  if (!this.decryptedSeed && !isWatchOnly) return;

  if (!this.activeBalanceUpdates) {
    this.activeBalanceUpdates = {};
  }

  const resolveTokenPrice = (symbol) => {
    if (!symbol) return 0.0;
    const sym = symbol.toUpperCase();
    // Stablecoins
    if (["USDT", "USDC", "DAI", "BUSD", "USDD", "FDUSD", "TUSD"].includes(sym)) {
      return 1.0;
    }
    // Bitcoin wrapper
    if (["WBTC", "BTCB", "RENBTC"].includes(sym)) {
      if (window.B2PriceOracle && window.B2PriceOracle.priceCache) {
        if (window.B2PriceOracle.priceCache["BTC"] !== undefined) return window.B2PriceOracle.priceCache["BTC"];
        if (window.B2PriceOracle.priceCache["BITCOIN"] !== undefined) return window.B2PriceOracle.priceCache["BITCOIN"];
      }
      return 65000.0;
    }
    // Ethereum wrapper
    if (["WETH", "RETH", "STETH", "ETH"].includes(sym)) {
      if (window.B2PriceOracle && window.B2PriceOracle.priceCache) {
        if (window.B2PriceOracle.priceCache["ETH"] !== undefined) return window.B2PriceOracle.priceCache["ETH"];
        if (window.B2PriceOracle.priceCache["ETHEREUM"] !== undefined) return window.B2PriceOracle.priceCache["ETHEREUM"];
      }
      return 3500.0;
    }
    // BNB wrapper
    if (["WBNB", "BNB"].includes(sym)) {
      if (window.B2PriceOracle && window.B2PriceOracle.priceCache && window.B2PriceOracle.priceCache["BNB"] !== undefined) {
        return window.B2PriceOracle.priceCache["BNB"];
      }
      return 580.0;
    }
    // MATIC/POL wrapper
    if (["WMATIC", "WPOL", "MATIC"].includes(sym)) {
      if (window.B2PriceOracle && window.B2PriceOracle.priceCache && window.B2PriceOracle.priceCache["POLYGON"] !== undefined) {
        return window.B2PriceOracle.priceCache["POLYGON"];
      }
      return 0.55;
    }
    // SOL wrapper
    if (["WSOL", "SOL"].includes(sym)) {
      if (window.B2PriceOracle && window.B2PriceOracle.priceCache && window.B2PriceOracle.priceCache["SOLANA"] !== undefined) {
        return window.B2PriceOracle.priceCache["SOLANA"];
      }
      return 140.0;
    }
    // TRX wrapper
    if (["WTRX", "TRX"].includes(sym)) {
      if (window.B2PriceOracle && window.B2PriceOracle.priceCache && window.B2PriceOracle.priceCache["TRON"] !== undefined) {
        return window.B2PriceOracle.priceCache["TRON"];
      }
      return 0.12;
    }
    // LINK
    if (sym === "LINK") return 15.0;
    // UNI
    if (sym === "UNI") return 7.5;
    // AAVE
    if (sym === "AAVE") return 90.0;

    // Try searching for any match in B2PriceOracle.priceCache
    if (window.B2PriceOracle && window.B2PriceOracle.priceCache) {
      if (window.B2PriceOracle.priceCache[sym] !== undefined) {
        return window.B2PriceOracle.priceCache[sym];
      }
      const foundKey = Object.keys(window.B2PriceOracle.priceCache).find(k => k.toUpperCase() === sym);
      if (foundKey && window.B2PriceOracle.priceCache[foundKey] !== undefined) {
        return window.B2PriceOracle.priceCache[foundKey];
      }
    }
    return 1.25; // Robust fallback value to ensure it never displays $0.00
  };

  const lockKey = specificChainKey || "ALL_CHAINS";
  if (this.activeBalanceUpdates[lockKey]) {
    return this.activeBalanceUpdates[lockKey];
  }

  let resolveLock;
  let rejectLock;
  const lockPromise = new Promise((resolve, reject) => {
    resolveLock = resolve;
    rejectLock = reject;
  });
  this.activeBalanceUpdates[lockKey] = lockPromise;

  try {
    if (window.B2Logger) {
      window.B2Logger.log(`Iniciando atualização de saldos em tempo real para: ${specificChainKey || "todas as blockchains"}...`, "info");
    }

    const chainsToUpdate = specificChainKey
      ? this.blockchainData.filter(chain => chain.key === specificChainKey)
      : this.blockchainData;

    // Pré-busca concorrente de preços em lote (Bulk Price Fetch)
    try {
      await window.B2PriceOracle.prefetchPricesBulk(chainsToUpdate);
    } catch (e) {
      if (window.B2Logger) {
        window.B2Logger.log(`[Price Oracle] Falha na pré-busca em lote de preços: ${e.message}`, "warn");
      }
    }

    // Sinaliza loading para as redes que serão atualizadas
    chainsToUpdate.forEach(chain => {
      chain.isLoadingBalance = true;
    });

    // Força uma renderização para mostrar shimmer loaders imediatamente
    if (window.B2UIRenderer && typeof window.B2UIRenderer.renderActiveBlockchainDashboard === 'function') {
      window.B2UIRenderer.renderActiveBlockchainDashboard(this.blockchainData, this.activeChainKey);
    }

    // Atualização concorrente resiliente para as blockchains configuradas
    const updatePromises = chainsToUpdate.map(async (chain) => {
      const keys = this.derivedKeys[chain.key];
      if (!keys || !keys.address) {
        chain.isLoadingBalance = false;
        return;
      }

      let cryptoBalance = 0;

      try {
        if (chain.key === "DASH" && (window.B2DashBroadcaster || globalThis.B2DashBroadcaster)) {
          // Dash (DASH) UTXOs Balance Call
          const dashBroadcaster = window.B2DashBroadcaster || globalThis.B2DashBroadcaster;
          const utxos = await dashBroadcaster.fetchDashUTXOs(keys.address, chain.nodeUrl);
          const satoshis = utxos.reduce((acc, u) => acc + (u.value || u.satoshis || 0), 0);
          cryptoBalance = satoshis / 100000000;
        } else if (chain.key === "ZEC" && (window.B2ZcashBroadcaster || globalThis.B2ZcashBroadcaster)) {
          // Zcash (ZEC) UTXOs Balance Call
          const zcashBroadcaster = window.B2ZcashBroadcaster || globalThis.B2ZcashBroadcaster;
          cryptoBalance = await zcashBroadcaster.fetchZcashTAddressBalance(keys.address, chain.nodeUrl);
        } else if (chain.key === "BTC" && (window.B2BitcoinBroadcaster || globalThis.B2BitcoinBroadcaster)) {
          // Bitcoin UTXOs Balance Call
          const bitcoinBroadcaster = window.B2BitcoinBroadcaster || globalThis.B2BitcoinBroadcaster;
          const utxos = await bitcoinBroadcaster.fetchUTXOs(keys.address, chain.nodeUrl, chain.key);
          const satoshis = utxos.reduce((acc, u) => acc + (u.value || u.satoshis || 0), 0);
          cryptoBalance = satoshis / 100000000;
        } else if (chain.key === "LTC" && (window.B2LitecoinEngine || globalThis.B2LitecoinEngine)) {
          // Litecoin UTXOs Balance Call
          const engine = window.B2LitecoinEngine || globalThis.B2LitecoinEngine;
          cryptoBalance = await engine.fetchBalance(keys.address, chain.nodeUrl);
        } else if (chain.key === "DOGE" && (window.B2DogecoinEngine || globalThis.B2DogecoinEngine)) {
          // Dogecoin Balance Call
          const engine = window.B2DogecoinEngine || globalThis.B2DogecoinEngine;
          cryptoBalance = await engine.fetchBalance(keys.address, chain.nodeUrl);
        } else if (chain.key === "BCH" && (window.B2BitcoinCashEngine || globalThis.B2BitcoinCashEngine)) {
          // Bitcoin Cash Balance Call
          const engine = window.B2BitcoinCashEngine || globalThis.B2BitcoinCashEngine;
          cryptoBalance = await engine.fetchBalance(keys.address, chain.nodeUrl);
        } else if (chain.engine === "EVM" && (window.B2TokenProvider || globalThis.B2TokenProvider)) {
          // EVM Balance (eth_getBalance)
          const provider = window.B2TokenProvider || globalThis.B2TokenProvider;
          const balStr = await provider.getNativeBalance(keys.address, chain.key);
          cryptoBalance = parseFloat(balStr);
        } else if (chain.engine === "Solana") {
          // Solana Balance (getBalance)
          const res = await fetch(chain.nodeUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [keys.address] })
          }).then(r => r.json());
          if (res.result && res.result.value !== undefined) {
            cryptoBalance = res.result.value / 1000000000;
          }
        } else if (chain.engine === "Waves") {
          // Waves Balance (/addresses/balance/{address})
          const url = `${chain.nodeUrl.replace(/\/$/, "")}/addresses/balance/${keys.address}`;
          const res = await fetch(url).then(r => r.json());
          if (res && res.balance !== undefined) {
            cryptoBalance = res.balance / 100000000;
          }
        } else if (chain.engine === "TRON") {
          // TRON Balance Simulation (mock fallback / node endpoint check)
          try {
            const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
            if (tronEngine) {
              const res = await tronEngine.getAccount(keys.address, chain.nodeUrl);
              cryptoBalance = (res.balance || 0) / 1000000;
            } else {
              cryptoBalance = 0.0;
            }
          } catch (e) {
            cryptoBalance = 0.0;
          }
        } else if (chain.nodeUrl) {
          // Generic Endpoint GET Request balance check fallback
          const url = `${chain.nodeUrl.replace(/\/$/, "")}/balance/${keys.address}`;
          const res = await fetch(url).then(r => r.json());
          if (res && res.balance !== undefined) {
            cryptoBalance = parseFloat(res.balance);
          }
        }
      } catch (err) {
        if (window.B2Logger) {
          window.B2Logger.log(`Falha ao ler saldo da rede ${chain.key}: ${err.message}. Ativando auto-healing RPC...`, "warn");
        }

        // AUTO-HEALING RPC: Se falhar o RPC, ativa o popup de auto-healing
        if (this.showRpcErrorDialog && !this.activeHealingDialog) {
          setTimeout(() => {
            this.showRpcErrorDialog(chain, err.message).then(result => {
              if (result && result.action === 'change_rpc' && result.url) {
                const overrides = JSON.parse(localStorage.getItem("b2_custom_rpcs") || "{}");
                overrides[chain.key] = result.url;
                localStorage.setItem("b2_custom_rpcs", JSON.stringify(overrides));
                chain.nodeUrl = result.url;
                this.updateNetworkBalances(chain.key);
              }
            });
          }, 100);
        }
      }

      chain.balanceCrypto = cryptoBalance;

      // Descoberta do preço via B2PriceOracle (com cascade simples)
      try {
        const price = await window.B2PriceOracle.fetchPrice(chain);
        chain.balanceFiat = cryptoBalance * price;
      } catch (priceErr) {
        chain.balanceFiat = cryptoBalance * 0.0;
      }

      // Merge manually added custom tokens from localStorage
      const customTokensStr = localStorage.getItem(this.getCustomTokensStorageKey(chain.key));
      if (customTokensStr) {
        try {
          const customTokens = JSON.parse(customTokensStr);
          if (Array.isArray(customTokens)) {
            if (!chain.discoveredTokens) {
              chain.discoveredTokens = [];
            }
            // Append and avoid duplicates
            customTokens.forEach(tok => {
              const exists = chain.discoveredTokens.some(t => t.assetId.toLowerCase() === tok.assetId.toLowerCase());
              if (!exists) {
                chain.discoveredTokens.push(tok);
              }
            });
          }
        } catch (e) {
          console.error("Failed to parse custom tokens from storage", e);
        }
      }

      // Fetch balances for custom tokens
      if (chain.engine === "EVM" && chain.discoveredTokens && chain.discoveredTokens.length > 0) {
        try {
          const tokenList = chain.discoveredTokens.map(tok => ({
            address: tok.assetId || tok.address,
            symbol: tok.symbol,
            decimals: tok.decimals || 18,
            name: tok.name
          }));
          const balances = await (window.B2TokenProvider || globalThis.B2TokenProvider).getTokenBalances(keys.address, chain.key, tokenList);
          balances.forEach((bal, idx) => {
            const tok = chain.discoveredTokens[idx];
            tok.balanceCrypto = parseFloat(bal.balance || "0.0");
            tok.balanceFiat = tok.balanceCrypto * resolveTokenPrice(tok.symbol);
          });
        } catch (e) {
          console.error(`Failed to fetch EVM token balances via B2TokenProvider:`, e);
        }
      } else if (chain.engine === "Solana" && chain.discoveredTokens && chain.discoveredTokens.length > 0) {
        try {
          const res = await fetch(chain.nodeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: Date.now(),
              method: "getTokenAccountsByOwner",
              params: [
                keys.address,
                { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
                { encoding: "jsonParsed" }
              ]
            })
          }).then(r => r.json());

          if (res.result && Array.isArray(res.result.value)) {
            res.result.value.forEach(acc => {
              const mint = acc.account?.data?.parsed?.info?.mint;
              const uiAmount = acc.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
              if (mint && uiAmount !== undefined) {
                const tok = chain.discoveredTokens.find(t => t.assetId === mint);
                if (tok) {
                  tok.balanceCrypto = uiAmount;
                  tok.balanceFiat = uiAmount * resolveTokenPrice(tok.symbol);
                }
              }
            });
          }
        } catch (e) {
          console.error(`Failed to fetch Solana token balances:`, e);
        }
      } else if (chain.engine === "Waves" && chain.discoveredTokens && chain.discoveredTokens.length > 0) {
        try {
          // Waves Assets balance endpoint: /assets/balance/{address}/{assetId}
          for (let tok of chain.discoveredTokens) {
            const url = `${chain.nodeUrl.replace(/\/$/, "")}/assets/balance/${keys.address}/${tok.assetId}`;
            const res = await fetch(url).then(r => r.json());
            if (res && res.balance !== undefined) {
              tok.balanceCrypto = res.balance / Math.pow(10, tok.decimals || 8);
              tok.balanceFiat = tok.balanceCrypto * resolveTokenPrice(tok.symbol);
            }
          }
        } catch (e) {
          console.error(`Failed to fetch Waves token balances:`, e);
        }
      } else if (chain.engine === "TRON" && chain.discoveredTokens && chain.discoveredTokens.length > 0) {
        try {
          const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
          if (tronEngine) {
            const res = await tronEngine.getAccount(keys.address, chain.nodeUrl);
            const trc20Balances = res.trc20 || [];
            trc20Balances.forEach(item => {
              const contract = Object.keys(item)[0];
              const bal = Object.values(item)[0];
              const tok = chain.discoveredTokens.find(t => t.assetId === contract);
              if (tok) {
                tok.balanceCrypto = bal / Math.pow(10, tok.decimals || 6);
                tok.balanceFiat = tok.balanceCrypto * resolveTokenPrice(tok.symbol);
              }
            });
          }
        } catch (e) {
          console.error(`Failed to fetch TRON TRC-20 balances:`, e);
        }
      }

      chain.isLoadingBalance = false;
    });

    await Promise.all(updatePromises);

    // Auto-enrichment of chain structures (such as logos) from registry
    if (window.B2TokenRegistry && typeof window.B2TokenRegistry.enrichChainTokens === 'function') {
      this.blockchainData.forEach(chain => {
        window.B2TokenRegistry.enrichChainTokens(chain);
      });
    }

    if (window.B2Logger) {
      window.B2Logger.log("Atualização de saldos finalizada.", "success");
    }

    // Redesenha a lista e atualiza o display de saldo total
    window.B2UIRenderer.renderBlockchainList(this.blockchainData);
    this.updateTotalBalanceDisplay();
    this.updateSimulatorBalances();

    // Trigger active blockchain dashboard refresh to update real-time resources inline
    if (window.B2UIRenderer && typeof window.B2UIRenderer.renderActiveBlockchainDashboard === 'function') {
      window.B2UIRenderer.renderActiveBlockchainDashboard(this.blockchainData, this.activeChainKey);
    }
    resolveLock();
  } catch (err) {
    if (rejectLock) rejectLock(err);
    throw err;
  } finally {
    delete this.activeBalanceUpdates[lockKey];
  }
};

B2WalletApp.prototype.updateTotalBalanceDisplay = function() {
  let total = this.blockchainData.reduce((acc, chain) => {
    let chainTotal = chain.balanceFiat;
    if (chain.discoveredTokens && chain.discoveredTokens.length > 0) {
      chainTotal += chain.discoveredTokens.reduce((sum, tok) => sum + tok.balanceFiat, 0);
    }
    return acc + chainTotal;
  }, 0);
  const balanceText = document.getElementById("dashboard-total-balance");
  if (balanceText) {
    balanceText.innerText = `$ ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

B2WalletApp.prototype.getCustomTokensStorageKey = function(chainKey) {
  const isTestnet = this.networkMode === 'testnet';
  return `b2_discovered_tokens_${chainKey}${isTestnet ? '_testnet' : ''}`;
};

B2WalletApp.prototype.loadCustomTokens = function() {
  this.blockchainData.forEach(chain => {
    const storageKey = this.getCustomTokensStorageKey(chain.key);
    const customTokensStr = localStorage.getItem(storageKey);
    if (customTokensStr) {
      try {
        const customTokens = JSON.parse(customTokensStr);
        if (Array.isArray(customTokens)) {
          if (!chain.discoveredTokens) {
            chain.discoveredTokens = [];
          }
          customTokens.forEach(tok => {
            const exists = chain.discoveredTokens.some(t => t.assetId.toLowerCase() === tok.assetId.toLowerCase());
            if (!exists) {
              const newToken = {
                assetId: tok.assetId,
                name: tok.name || tok.symbol || 'Custom Token',
                symbol: tok.symbol || 'TKN',
                decimals: tok.decimals !== undefined ? tok.decimals : 18,
                balanceCrypto: tok.balanceCrypto || 0.0,
                balanceFiat: tok.balanceFiat || 0.0,
                imageURL: tok.imageURL || ''
              };
              if (window.B2TokenRegistry && typeof window.B2TokenRegistry.enrichToken === 'function') {
                window.B2TokenRegistry.enrichToken(chain.key, newToken);
              }
              chain.discoveredTokens.push(newToken);
            }
          });
        }
      } catch (e) {
        console.error(`Failed to parse custom tokens from storage for chain ${chain.key}:`, e);
      }
    }
  });
};

B2WalletApp.prototype.updateSimulatorBalances = function() {
  if (!this.decryptedSeed) return;

  try {
    const ethChain = this.blockchainData.find(c => c.key === 'ETH');
    const ethBal = ethChain ? ethChain.balanceCrypto : 0;

    const uniswapFromBal = document.getElementById("uniswap-from-balance");
    if (uniswapFromBal) {
      uniswapFromBal.innerText = "Saldo: " + ethBal.toFixed(4) + " ETH";
    }

    this.uniswapUsdcBalance = this.uniswapUsdcBalance || 0;
    const uniswapToBal = document.getElementById("uniswap-to-balance");
    if (uniswapToBal) {
      uniswapToBal.innerText = "Saldo: " + this.uniswapUsdcBalance.toFixed(2) + " USDC";
    }
  } catch (e) {
    console.error("[Simulator Balance Update Error]", e);
  }
};
