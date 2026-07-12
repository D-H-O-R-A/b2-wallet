const TESTNET_DETAILS = {
  "BTC": { name: "Bitcoin ( TESTNET4 )", faucet: "https://coinfaucet.eu/en/btc-testnet4/" },
  "LTC": { name: "Litecoin (Testnet4)", faucet: "https://coinfaucet.eu/en/ltc-testnet/" },
  "ETH": { name: "Ethereum (Sepolia)", faucet: "https://sepoliafaucet.com/" },
  "TRON": { name: "Tron (Nile)", faucet: "https://nileex.io/join/getTRX" },
  "WAVES": { name: "Waves (Testnet)", faucet: "https://testnet.wavesexplorer.com/faucet" },
  "SOLANA": { name: "Solana (Testnet)", faucet: "https://solfaucet.com/" },
  "CARDANO": { name: "Cardano (Preprod)", faucet: "https://docs.cardano.org/cardano-testnets/tools/faucet/" },
  "POLKADOT": { name: "Polkadot (Westend)", faucet: "https://faucet.polkadot.network/" },
  "FILECOIN": { name: "Filecoin (Calibration)", faucet: "https://faucet.calibration.fildev.network/" },
  "NEO": { name: "Neo (COZ Testnet)", faucet: "https://neofaucet.org/" },
  "BSC": { name: "BSC (Testnet)", faucet: "https://testnet.binance.org/faucet-smart" },
  "POLYGON": { name: "Polygon (Amoy)", faucet: "https://faucet.polygon.technology/" },
  "AVAX": { name: "Avalanche (Fuji)", faucet: "https://faucet.avax.network/" },
  "ARBITRUM": { name: "Arbitrum (Sepolia)", faucet: "https://faucet.quicknode.com/arbitrum/sepolia" },
  "OPTIMISM": { name: "Optimism (Sepolia)", faucet: "https://faucet.quicknode.com/optimism/sepolia" },
  "BASE": { name: "Base (Sepolia)", faucet: "https://faucet.quicknode.com/base/sepolia" },
  "ZKSYNC": { name: "zkSync (Sepolia)", faucet: "https://faucet.quicknode.com/zksync/sepolia" },
  "SCROLL": { name: "Scroll (Sepolia)", faucet: "https://faucet.quicknode.com/scroll/sepolia" },
  "LINEA": { name: "Linea (Sepolia)", faucet: "https://faucet.quicknode.com/linea/sepolia" },
  "SONIC": { name: "Sonic (Testnet)", faucet: "https://faucet.soniclabs.com/" },
  "CRONOS": { name: "Cronos (Testnet3)", faucet: "https://cronos.org/faucet" },
  "MANTLE": { name: "Mantle (Sepolia)", faucet: "https://faucet.quicknode.com/mantle/sepolia" },
  "CELO": { name: "Celo (Alfajores)", faucet: "https://faucet.celo.org/" },
  "KAVA": { name: "Kava (Testnet)", faucet: "https://faucet.kava.io/" },
  "MOONBEAM": { name: "Moonbeam (Moonbase Alpha)", faucet: "https://faucet.moonbeam.network/" },
  "MOONRIVER": { name: "Moonriver (Moonbase Alpha)", faucet: "https://faucet.moonbeam.network/" },
  "ROOTSTOCK": { name: "Rootstock (Testnet)", faucet: "https://faucet.rootstock.co/" },
  "COREDAO": { name: "Core (Testnet)", faucet: "https://scan.test.btcs.network/faucet" },
  "BLAST": { name: "Blast (Sepolia)", faucet: "https://faucet.quicknode.com/blast/sepolia" },
  "MODE": { name: "Mode (Sepolia)", faucet: "https://faucet.quicknode.com/mode/sepolia" },
  "POLYGON_ZKEVM": { name: "Polygon zkEVM (Cardona)", faucet: "https://faucet.polygon.technology/" },
  "TAIKO": { name: "Taiko (Hekla)", faucet: "https://faucet.hekla.taiko.xyz/" },
  "BERACHAIN": { name: "Berachain (bArtio)", faucet: "https://bartio.faucet.berachain.com/" },
  "METIS": { name: "Metis (Sepolia)", faucet: "https://faucet.metisdevops.link/" },
  "BOBA": { name: "Boba (Sepolia)", faucet: "https://faucet.boba.network/" },
  "ELECTRONEUM": { name: "Electroneum (Testnet)", faucet: "https://faucet.electroneum.com/" },
  "STELLAR": { name: "Stellar (Horizon Testnet)", faucet: "https://laboratory.stellar.org/#friendbot" }
};
window.TESTNET_DETAILS = TESTNET_DETAILS;

UIRenderer.prototype.getChainName = function (chain) {
  const isTestnet = (window.B2App && window.B2App.networkMode === "testnet") || (typeof localStorage !== "undefined" && localStorage.getItem("b2_network_mode") === "testnet");
  if (isTestnet && TESTNET_DETAILS[chain.key]) {
    return TESTNET_DETAILS[chain.key].name;
  }
  return chain.name;
};

/**
 * Wrapper retro-compatível para renderizar a lista de blockchains.
 * Redireciona para o renderizador focado do Gateway Focus Mode.
 */
UIRenderer.prototype.renderBlockchainList = function (blockchains, filterQuery = "") {
  const activeKey = (window.B2App && window.B2App.activeChainKey) ? window.B2App.activeChainKey : "WAVES";
  this.renderActiveBlockchainDashboard(blockchains, activeKey, filterQuery);
};

/**
 * Renderiza o carrossel horizontal de seleção de blockchain ativa.
 */
UIRenderer.prototype.renderActiveChainSelector = function (blockchains, activeKey) {
  const container = document.getElementById("dashboard-active-chain-selector");
  if (!container) return;

  container.innerHTML = "";

  blockchains.forEach(chain => {
    const badge = document.createElement("div");
    badge.className = `chain-selector-badge${chain.key === activeKey ? " active" : ""}`;
    if (chain.key === activeKey) {
      badge.style.setProperty('--active-chain-color', chain.color || 'var(--color-primary)');
    }

    const icon = document.createElement("div");
    icon.className = "chain-badge-icon";
    icon.style.background = `rgba(255, 255, 255, 0.05)`;
    icon.style.border = `1px solid var(--border-light)`;

    const symbolSpan = document.createElement("span");
    symbolSpan.style.fontFamily = "var(--font-tech)";
    symbolSpan.style.fontSize = "0.45rem";
    symbolSpan.style.fontWeight = "900";
    symbolSpan.style.color = "#fff";
    symbolSpan.innerText = chain.symbol.substring(0, 3);
    symbolSpan.style.display = "none";

    const img = document.createElement("img");
    img.src = chain.logoUrl || "src/img/btc.png";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.borderRadius = "50%";
    img.style.objectFit = "contain";

    img.onerror = () => {
      img.style.display = "none";
      symbolSpan.style.display = "inline";
    };
    img.onload = () => {
      symbolSpan.style.display = "none";
    };

    icon.appendChild(img);
    icon.appendChild(symbolSpan);

    const label = document.createElement("span");
    label.innerText = this.getChainName(chain);

    badge.appendChild(icon);
    badge.appendChild(label);

    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.B2App) {
        window.B2App.setActiveChain(chain.key);
      }
    });

    container.appendChild(badge);
  });

  // Desloca suavemente o item selecionado para o centro
  const activeBadge = container.querySelector(".chain-selector-badge.active");
  if (activeBadge) {
    activeBadge.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }
};

/**
 * Renderiza a lista de blockchains de forma dinâmica no novo modal de seleção premium.
 */
UIRenderer.prototype.renderModalBlockchainList = function (blockchains, activeKey, query = "") {
  const listContainer = document.getElementById("modal-blockchain-list-container");
  if (!listContainer) return;

  listContainer.innerHTML = "";
  const cleanQuery = query.toLowerCase().trim();

  const filtered = blockchains.filter(c =>
    c.name.toLowerCase().includes(cleanQuery) ||
    c.symbol.toLowerCase().includes(cleanQuery) ||
    c.key.toLowerCase().includes(cleanQuery)
  );

  filtered.forEach(chain => {
    const row = document.createElement("div");
    const isActive = chain.key === activeKey;
    row.className = `blockchain-modal-row${isActive ? " active" : ""}`;

    row.style.setProperty('--hover-border-color', chain.color || "var(--border-medium)");
    row.style.setProperty('--hover-shadow-color', `${chain.color || "var(--color-primary)"}25`);
    row.style.setProperty('--active-border-color', chain.color || "var(--color-primary)");
    row.style.setProperty('--active-shadow-color', `${chain.color || "var(--color-primary)"}40`);

    const meta = document.createElement("div");
    meta.className = "blockchain-modal-meta";

    const logoContainer = document.createElement("div");
    logoContainer.className = "blockchain-modal-logo-container";

    const img = document.createElement("img");
    img.src = chain.logoUrl || "src/img/btc.png";
    img.style.width = "22px";
    img.style.height = "22px";
    img.style.borderRadius = "50%";
    img.style.objectFit = "contain";

    const symbolSpan = document.createElement("span");
    symbolSpan.style.fontFamily = "var(--font-tech)";
    symbolSpan.style.fontSize = "0.6rem";
    symbolSpan.style.fontWeight = "900";
    symbolSpan.style.color = "#fff";
    symbolSpan.innerText = chain.symbol.substring(0, 3);
    symbolSpan.style.display = "none";

    img.onerror = () => {
      img.style.display = "none";
      symbolSpan.style.display = "inline";
    };

    logoContainer.appendChild(img);
    logoContainer.appendChild(symbolSpan);

    const info = document.createElement("div");
    info.className = "blockchain-modal-info";

    const nameSpan = document.createElement("span");
    nameSpan.className = "blockchain-modal-name";
    nameSpan.innerText = this.getChainName(chain);

    const symSpan = document.createElement("span");
    symSpan.className = "blockchain-modal-symbol";
    symSpan.innerText = `${chain.symbol} • ${(chain.key === "AMZX") ? "AMZX" : (chain.key === "PLO") ? "PlanetOne" : chain.engine} Engine`;

    info.appendChild(nameSpan);
    info.appendChild(symSpan);

    meta.appendChild(logoContainer);
    meta.appendChild(info);

    const checkCircle = document.createElement("div");
    checkCircle.className = "option-check-circle";
    checkCircle.style.width = "14px";
    checkCircle.style.height = "14px";
    checkCircle.style.borderRadius = "50%";
    checkCircle.style.border = "1px solid var(--border-light)";
    checkCircle.style.display = "flex";
    checkCircle.style.alignItems = "center";
    checkCircle.style.justifyContent = "center";

    const innerDot = document.createElement("div");
    innerDot.className = "inner-dot";
    innerDot.style.width = "6px";
    innerDot.style.height = "6px";
    innerDot.style.borderRadius = "50%";
    innerDot.style.background = chain.color || "var(--color-primary)";
    innerDot.style.display = isActive ? "block" : "none";

    checkCircle.appendChild(innerDot);

    row.appendChild(meta);
    row.appendChild(checkCircle);

    row.addEventListener("click", () => {
      if (window.B2App) {
        window.B2App.setActiveChain(chain.key);
        const modal = document.getElementById("modal-blockchain-select");
        if (modal) modal.classList.remove("active");
      }
    });

    listContainer.appendChild(row);
  });
};

/**
 * Renderiza o painel do Dashboard com isolamento completo de contexto para a rede ativa.
 */
UIRenderer.prototype.renderActiveBlockchainDashboard = function (blockchains, activeKey, filterQuery = "") {
  const listContainer = document.getElementById("blockchain-items-container");
  if (!listContainer) return;

  // Sincroniza o seletor horizontal de blockchains e o card customizado de protocolo nativo
  this.renderActiveChainSelector(blockchains, activeKey);
  const activeChain = blockchains.find(c => c.key === activeKey) || blockchains[0];
  this.renderCustomProtocolCard(activeChain, blockchains);

  listContainer.innerHTML = "";
  const query = filterQuery.toLowerCase().trim();

  // 0. ATUALIZAÇÃO DO STATUS E TIMESTAMP DO BOTÃO DE RECARREGAR
  const lastUpdateText = document.getElementById("last-update-text");
  const lastUpdateIndicator = document.getElementById("last-update-indicator");
  const btnDashReload = document.getElementById("dashboard-btn-reload");

  if (lastUpdateText && lastUpdateIndicator && btnDashReload && activeChain) {
    const lang = (window.B2App && window.B2App.currentLanguage) || 'en';
    const t = (window.B2Translations && window.B2Translations[lang]) || {};

    if (activeChain.isLoadingBalance) {
      lastUpdateText.innerText = t.updating || 'Atualizando...';
      lastUpdateIndicator.className = "pulse-indicator loading";
      lastUpdateIndicator.style.background = "";
      btnDashReload.classList.add("disabled", "spinning");
    } else {
      btnDashReload.classList.remove("disabled", "spinning");
      if (activeChain.lastLoaded) {
        const date = new Date(activeChain.lastLoaded);
        const timeStr = date.toLocaleTimeString();
        lastUpdateText.innerText = `${t.lastUpdate || 'Última atualização:'} ${timeStr}`;
        lastUpdateIndicator.className = "pulse-indicator active";
        lastUpdateIndicator.style.background = "";
      } else {
        lastUpdateText.innerText = t.neverUpdated || 'Nunca atualizado';
        lastUpdateIndicator.className = "pulse-indicator";
        lastUpdateIndicator.style.background = "var(--text-muted, #6b7280)";
      }
    }
  }

  // 1. ATUALIZAÇÃO EM TEMPO REAL DO HEADER DO SALDO DA REDE EM FOCO
  if (activeChain && !query) {
    const headerTitle = document.getElementById("active-chain-header-title");
    const totalBalance = document.getElementById("dashboard-total-balance");
    const cryptoBalance = document.getElementById("active-chain-header-crypto");

    if (headerTitle) {
      headerTitle.innerText = `SALDO ${this.getChainName(activeChain).toUpperCase()}`;
    }

    let chainFiatTotal = activeChain.balanceFiat;
    if (activeChain.discoveredTokens && activeChain.discoveredTokens.length > 0) {
      chainFiatTotal += activeChain.discoveredTokens.reduce((sum, tok) => sum + tok.balanceFiat, 0);
    }

    if (totalBalance) {
      if (activeChain.isLoadingBalance) {
        totalBalance.innerHTML = `<span class="shimmer-loading" style="display:inline-block; width:140px; height:32px; border-radius:6px; vertical-align:middle;"></span>`;
      } else {
        totalBalance.innerText = `$ ${chainFiatTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }

    if (cryptoBalance) {
      if (activeChain.isLoadingBalance) {
        cryptoBalance.innerHTML = `<span class="shimmer-loading" style="display:inline-block; width:100px; height:18px; border-radius:4px; vertical-align:middle; margin-top:4px;"></span>`;
      } else {
        cryptoBalance.innerText = `${this.formatCryptoBalance(activeChain.balanceCrypto, activeChain.decimals)} ${activeChain.symbol}`;
      }
    }

    // 1b. ATUALIZAÇÃO DOS RECURSOS ATIVOS DA BLOCKCHAIN SELECIONADA (TRON/Waves/etc.)
    const resourcesSummary = document.getElementById("active-chain-resources-summary");
    if (resourcesSummary) {
      if (activeKey === "TRON") {
        const r = activeChain.resources || {
          bandwidth: { freeLimit: 0, freeUsed: 0, freeAvailable: 0, stakedLimit: 0, stakedUsed: 0, stakedAvailable: 0, totalAvailable: 0 },
          energy: { limit: 0, used: 0, available: 0 },
          stakedTRX: { bandwidth: 0, energy: 0 }
        };
        const totalBw = r.bandwidth.freeLimit + r.bandwidth.stakedLimit;
        const totalBwAvailable = r.bandwidth.freeAvailable + r.bandwidth.stakedAvailable;
        const bwPercentage = totalBw > 0 ? (totalBwAvailable / totalBw) * 100 : 100;

        const totalEg = r.energy.limit;
        const totalEgAvailable = r.energy.available;
        const egPercentage = totalEg > 0 ? (totalEgAvailable / totalEg) * 100 : 0;

        resourcesSummary.innerHTML = `
          <div class="active-chain-res-summary-inner" style="display:flex; justify-content:space-between; align-items:center; gap:16px; width:100%; max-width:280px; margin: 0 auto;">
            <!-- Bandwidth compact column -->
            <div style="flex:1; display:flex; flex-direction:column; gap:4px; text-align:left;">
              <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:700; color:rgba(255,255,255,0.7); text-transform:uppercase; letter-spacing:0.3px;">
                <span>Bandwidth</span>
                <span style="font-family:var(--font-tech), monospace; font-size:9px;">${totalBwAvailable.toLocaleString()}/${totalBw.toLocaleString()} BP</span>
              </div>
              <div style="height:4px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
                <div style="width:${bwPercentage}%; height:100%; background:linear-gradient(90deg, #ec092c, #f43f5e); box-shadow:0 0 4px rgba(236, 9, 44, 0.4); border-radius:4px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
              </div>
            </div>
            <!-- Energy compact column -->
            <div style="flex:1; display:flex; flex-direction:column; gap:4px; text-align:left;">
              <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:700; color:rgba(255,255,255,0.7); text-transform:uppercase; letter-spacing:0.3px;">
                <span>Energy</span>
                <span style="font-family:var(--font-tech), monospace; font-size:9px;">${totalEgAvailable.toLocaleString()}/${totalEg.toLocaleString()} EP</span>
              </div>
              <div style="height:4px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
                <div style="width:${egPercentage}%; height:100%; background:linear-gradient(90deg, #f97316, #fb923c); box-shadow:0 0 4px rgba(249, 115, 22, 0.4); border-radius:4px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
              </div>
            </div>
          </div>
        `;
        resourcesSummary.style.display = "flex";
      } else if (activeKey === "WAVES") {
        const leases = JSON.parse(localStorage.getItem(`b2_leases_WAVES`) || "[]");
        const totalLeased = leases.reduce((sum, l) => sum + l.amount, 0);
        const totalWaves = activeChain.balanceCrypto + totalLeased;
        const leasePercentage = totalWaves > 0 ? (totalLeased / totalWaves) * 100 : 0;

        resourcesSummary.innerHTML = `
          <div class="active-chain-res-summary-inner" style="display:flex; justify-content:space-between; align-items:center; gap:16px; width:100%; max-width:280px; margin: 0 auto;">
            <div style="flex:1; display:flex; flex-direction:column; gap:4px; text-align:left;">
              <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:700; color:rgba(255,255,255,0.7); text-transform:uppercase; letter-spacing:0.3px;">
                <span>Leasing (Staked)</span>
                <span style="font-family:var(--font-tech), monospace; font-size:9px;">${totalLeased.toFixed(2)}/${totalWaves.toFixed(2)} WAVES</span>
              </div>
              <div style="height:4px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
                <div style="width:${leasePercentage}%; height:100%; background:linear-gradient(90deg, #0055ff, #00aaff); box-shadow:0 0 4px rgba(0, 85, 255, 0.4); border-radius:4px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
              </div>
            </div>
          </div>
        `;
        resourcesSummary.style.display = "flex";
      } else {
        resourcesSummary.style.display = "none";
      }
    }

    // Faucet oficial (Testnet apenas)
    const faucetContainer = document.getElementById("active-chain-faucet-container");
    if (faucetContainer) {
      const isTestnet = (window.B2App && window.B2App.networkMode === "testnet") || (typeof localStorage !== "undefined" && localStorage.getItem("b2_network_mode") === "testnet");
      if (isTestnet && TESTNET_DETAILS[activeKey] && TESTNET_DETAILS[activeKey].faucet) {
        const faucetUrl = TESTNET_DETAILS[activeKey].faucet;
        const testnetName = TESTNET_DETAILS[activeKey].name;
        faucetContainer.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 280px; margin: 0 auto; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 10px 14px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); transition: all 0.3s ease;">
            <div style="display: flex; flex-direction: column; align-items: flex-start; text-align: left; gap: 2px;">
              <span style="font-size: 10px; font-weight: 600; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; letter-spacing: 0.5px;">Faucet Oficial</span>
              <span style="font-size: 12px; font-weight: 700; color: #ffffff;">${testnetName}</span>
            </div>
            <a href="${faucetUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 12px; font-size: 11px; font-weight: 700; border-radius: 8px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; border: none; box-shadow: 0 2px 8px rgba(29, 78, 216, 0.3); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);">
              <span>Solicitar Tokens</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        `;
        faucetContainer.style.display = "flex";
      } else {
        faucetContainer.style.display = "none";
        faucetContainer.innerHTML = "";
      }
    }
  } else {
    const resourcesSummary = document.getElementById("active-chain-resources-summary");
    if (resourcesSummary) {
      resourcesSummary.style.display = "none";
    }
    const faucetContainer = document.getElementById("active-chain-faucet-container");
    if (faucetContainer) {
      faucetContainer.style.display = "none";
      faucetContainer.innerHTML = "";
    }
  }

  // 2. DESENHAR ITENS DE ACORDO COM O CONTEXTO ATIVO
  if (!query) {
    // Modo Focus: Exibe unicamente a blockchain selecionada e seus sub-tokens descobertos
    if (activeChain) {
      this._renderBlockchainRow(activeChain, listContainer, true);

      if (activeChain.discoveredTokens && activeChain.discoveredTokens.length > 0) {
        activeChain.discoveredTokens.forEach(token => {
          this._renderSubAssetRow(activeChain, token, listContainer);
        });
      }
    }

    // Renderiza Donut Chart focado nos sub-ativos e token nativo da rede ativa
    this.drawFocusedPortfolioChart(activeChain);
  } else {
    // Modo Pesquisa: Permite localizar qualquer uma das 28 blockchains unificadas ou tokens
    let matchedChains = blockchains.filter(chain =>
      chain.name.toLowerCase().includes(query) ||
      chain.key.toLowerCase().includes(query) ||
      chain.symbol.toLowerCase().includes(query) ||
      (chain.forkOf && chain.forkOf.toLowerCase().includes(query))
    );

    blockchains.forEach(chain => {
      if (!matchedChains.includes(chain) && chain.discoveredTokens) {
        const hasMatchedToken = chain.discoveredTokens.some(tok =>
          tok.name.toLowerCase().includes(query) ||
          tok.symbol.toLowerCase().includes(query)
        );
        if (hasMatchedToken) {
          matchedChains.push(chain);
        }
      }
    });

    matchedChains.forEach(chain => {
      const isActive = (chain.key === activeKey);
      this._renderBlockchainRow(chain, listContainer, isActive);

      if (chain.discoveredTokens && chain.discoveredTokens.length > 0) {
        chain.discoveredTokens.forEach(token => {
          if (token.name.toLowerCase().includes(query) || token.symbol.toLowerCase().includes(query) || chain.name.toLowerCase().includes(query)) {
            this._renderSubAssetRow(chain, token, listContainer);
          }
        });
      }
    });

    if (matchedChains.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.style.textAlign = "center";
      emptyMsg.style.padding = "24px";
      emptyMsg.style.color = "var(--text-muted)";
      emptyMsg.style.fontFamily = "var(--font-body)";
      emptyMsg.innerText = "Nenhuma blockchain ou token correspondente encontrado.";
      listContainer.appendChild(emptyMsg);
    }

    // Gráfico de Portfólio global no modo busca para mostrar a alocação completa
    this.drawPortfolioChart(blockchains);
  }
};

/**
 * Método auxiliar para desenhar uma linha de blockchain de alta fidelidade visual.
 * Inclui botões de ação rápida (Enviar/Receber) visíveis ao hover.
 */
UIRenderer.prototype._renderBlockchainRow = function (chain, container, isActive) {
  const isL2L3Eth = chain.engine === "EVM" && chain.symbol === "ETH" && chain.key !== "ETH";
  const isTestnet = (window.B2App && window.B2App.networkMode === "testnet") || (typeof localStorage !== "undefined" && localStorage.getItem("b2_network_mode") === "testnet");
  const displayName = isL2L3Eth ? (isTestnet ? this.getChainName(chain) : "Ethereum") : this.getChainName(chain);
  const displayLogo = isL2L3Eth ? "src/img/eth.png" : (chain.logoUrl || "src/img/btc.png");

  const row = document.createElement("div");
  row.className = `blockchain-row glass-card${isActive ? " active-focus-row" : ""}`;
  row.style.cursor = "pointer";
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.justifyContent = "space-between";
  row.style.gap = "10px";
  row.style.padding = "8px 14px";
  row.style.minHeight = "56px";
  row.style.maxHeight = "56px";
  row.style.boxSizing = "border-box";

  if (isActive) {
    row.style.setProperty('--active-chain-color', chain.color || 'var(--color-primary)');
  }

  // Click no row (sem ser nos botões) = troca ou abre receive
  row.addEventListener('click', (e) => {
    if (e.target.closest('.blockchain-row-actions')) return;
    if (isActive) {
      if (window.B2App) window.B2App.showReceiveModal(chain.key);
    } else {
      if (window.B2App) window.B2App.setActiveChain(chain.key);
    }
  });

  // --- META: Logo + Info ---
  const meta = document.createElement("div");
  meta.className = "blockchain-meta";
  meta.style.flex = "1";
  meta.style.minWidth = "0";

  const iconContainer = document.createElement("div");
  iconContainer.className = "blockchain-icon-container";
  iconContainer.style.position = "relative";

  const colorHash = Array.from(chain.key).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hsl1 = colorHash % 360;
  const hsl2 = (colorHash * 2) % 360;
  iconContainer.style.background = `linear-gradient(135deg, ${chain.color || `hsl(${hsl1}, 80%, 45%)`} 0%, ${chain.color ? "rgba(255,255,255,0.1)" : `hsl(${hsl2}, 85%, 55%)`} 100%)`;

  const symbolSpan = document.createElement("span");
  symbolSpan.style.fontFamily = "var(--font-mono)";
  symbolSpan.style.fontSize = "0.6rem";
  symbolSpan.style.fontWeight = "900";
  symbolSpan.style.color = "#fff";
  symbolSpan.style.textAlign = "center";
  symbolSpan.innerText = chain.symbol.substring(0, 3);
  symbolSpan.style.display = "none";

  const img = document.createElement("img");
  img.src = displayLogo;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.borderRadius = "50%";
  img.style.objectFit = "contain";

  img.onerror = () => {
    img.style.display = "none";
    symbolSpan.style.display = "flex";
    symbolSpan.style.alignItems = "center";
    symbolSpan.style.justifyContent = "center";
    symbolSpan.style.width = "100%";
    symbolSpan.style.height = "100%";
  };
  img.onload = () => {
    symbolSpan.style.display = "none";
    iconContainer.style.background = "rgba(255, 255, 255, 0.05)";
    iconContainer.style.border = "1px solid var(--border-subtle)";
  };

  // Network status dot (premium)
  const netDot = document.createElement("div");
  netDot.className = "network-status-dot";
  netDot.style.position = "absolute";
  netDot.style.bottom = "-1px";
  netDot.style.right = "-1px";
  netDot.style.width = "8px";
  netDot.style.height = "8px";
  netDot.style.border = "1.5px solid var(--bg-main)";
  netDot.title = "Rede online";

  iconContainer.appendChild(img);
  iconContainer.appendChild(symbolSpan);
  iconContainer.appendChild(netDot);

  // Name + engine chip
  const nameContainer = document.createElement("div");
  nameContainer.style.display = "flex";
  nameContainer.style.flexDirection = "column";
  nameContainer.style.gap = "3px";
  nameContainer.style.minWidth = "0";

  const nameSpan = document.createElement("span");
  nameSpan.className = "blockchain-name";
  nameSpan.innerText = displayName;
  nameSpan.style.fontSize = "var(--text-sm)";
  nameSpan.style.fontWeight = "var(--fw-semibold)";
  nameSpan.style.color = "var(--text-primary)";
  nameSpan.style.overflow = "hidden";
  nameSpan.style.textOverflow = "ellipsis";
  nameSpan.style.whiteSpace = "nowrap";
  nameContainer.appendChild(nameSpan);

  // Row de engine + fork tag
  const subRow = document.createElement("div");
  subRow.style.display = "flex";
  subRow.style.alignItems = "center";
  subRow.style.gap = "4px";
  subRow.style.flexWrap = "wrap";

  const engineChip = document.createElement("span");
  engineChip.style.cssText = `
    font-size: var(--text-2xs); font-weight: var(--fw-semibold);
    font-family: var(--font-mono); color: var(--text-muted);
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 3px; padding: 1px 5px; text-transform: uppercase;
    letter-spacing: 0.05em; flex-shrink: 0;
  `;
  engineChip.innerText = (chain.key === "AMZX") ? "AMZX" : (chain.key === "PLO") ? "PlanetOne" : (chain.engine || "Custom");
  subRow.appendChild(engineChip);

  if (chain.forkOf) {
    const forkTag = document.createElement("span");
    forkTag.style.cssText = `
      font-size: var(--text-2xs); color: var(--text-muted);
      font-family: var(--font-ui); font-style: italic;
    `;
    forkTag.innerText = `Fork: ${chain.forkOf}`;
    subRow.appendChild(forkTag);
  }

  nameContainer.appendChild(subRow);
  meta.appendChild(iconContainer);
  meta.appendChild(nameContainer);

  // --- VALOR (fiat + crypto) ---
  const val = document.createElement("div");
  val.className = "blockchain-val";
  val.style.flexShrink = "0";

  const balanceFiat = document.createElement("span");
  balanceFiat.className = "blockchain-balance-fiat";
  balanceFiat.innerText = `$ ${chain.balanceFiat.toFixed(2)}`;

  const balanceCrypto = document.createElement("span");
  balanceCrypto.className = "blockchain-balance-crypto";
  balanceCrypto.innerText = `${this.formatCryptoBalance(chain.balanceCrypto, chain.decimals)} ${chain.symbol}`;

  val.appendChild(balanceFiat);
  val.appendChild(balanceCrypto);

  // --- BOTÕES DE AÇÃO RÁPIDA (aparecem no hover via CSS) ---
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "blockchain-row-actions";

  // Botão Receber
  const btnReceive = document.createElement("button");
  btnReceive.className = "blockchain-row-action-btn";
  btnReceive.title = `Receber ${chain.symbol}`;
  btnReceive.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
  btnReceive.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.B2App) window.B2App.showReceiveModal(chain.key);
  });
  actionsDiv.appendChild(btnReceive);

  // Botão Enviar
  const btnSend = document.createElement("button");
  btnSend.className = "blockchain-row-action-btn send-btn";
  btnSend.title = `Enviar ${chain.symbol}`;
  btnSend.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  btnSend.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.B2App) window.B2App.showSendModal(chain.key);
  });
  actionsDiv.appendChild(btnSend);

  // Botão Faucet (se testnet ativa e possuir faucet)
  if (isTestnet && TESTNET_DETAILS[chain.key] && TESTNET_DETAILS[chain.key].faucet) {
    const btnFaucet = document.createElement("button");
    btnFaucet.className = "blockchain-row-action-btn faucet-btn";
    btnFaucet.title = `Abrir Faucet ${chain.symbol}`;
    btnFaucet.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>`;
    btnFaucet.addEventListener('click', (e) => {
      e.stopPropagation();
      window.open(TESTNET_DETAILS[chain.key].faucet, '_blank', 'noopener,noreferrer');
    });
    actionsDiv.appendChild(btnFaucet);
  }

  // Botão Leasing (apenas para chains com supportsStaking)
  if (chain.supportsStaking) {
    const btnLease = document.createElement("button");
    btnLease.className = "blockchain-row-action-btn";
    btnLease.title = `Leasing ${chain.symbol}`;
    btnLease.style.color = "var(--color-secondary)";
    btnLease.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`;
    btnLease.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.B2App) window.B2App.showLeasingView(chain.key);
    });
    actionsDiv.appendChild(btnLease);
  }

  row.appendChild(meta);
  row.appendChild(val);
  row.appendChild(actionsDiv);
  container.appendChild(row);
};

/**
 * Método auxiliar para desenhar uma linha de sub-token (Asset) descoberto.
 */
UIRenderer.prototype._renderSubAssetRow = function (chain, token, container) {
  if (window.B2TokenRegistry && typeof window.B2TokenRegistry.enrichToken === 'function') {
    token = window.B2TokenRegistry.enrichToken(chain.key, token);
  }

  const wrapper = document.createElement("div");
  wrapper.className = "sub-asset-wrapper";
  wrapper.style.marginLeft = "24px";
  wrapper.style.marginTop = "-6px";
  wrapper.style.marginBottom = "10px";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";

  const subRow = document.createElement("div");
  subRow.className = "blockchain-row sub-asset-row glass-card";
  subRow.style.borderLeft = `2.5px solid ${chain.color || "var(--color-primary)"}`;
  subRow.style.padding = "8px 14px";
  subRow.style.background = "rgba(255, 255, 255, 0.015)";
  subRow.style.display = "flex";
  subRow.style.justifyContent = "space-between";
  subRow.style.alignItems = "center";
  subRow.style.cursor = "pointer";
  subRow.style.borderRadius = "var(--radius-sm)";
  subRow.style.transition = "all var(--transition-fast)";
  subRow.style.minHeight = "56px";
  subRow.style.maxHeight = "56px";
  subRow.style.boxSizing = "border-box";

  const subMeta = document.createElement("div");
  subMeta.className = "blockchain-meta";
  subMeta.style.gap = "10px";

  const subIcon = document.createElement("div");
  subIcon.className = "blockchain-icon-container";
  subIcon.style.width = "24px";
  subIcon.style.height = "24px";
  subIcon.style.flexShrink = "0";
  subIcon.style.borderRadius = "50%";
  subIcon.style.display = "flex";
  subIcon.style.justifyContent = "center";
  subIcon.style.alignItems = "center";
  subIcon.style.overflow = "hidden";

  const setupSymbolFallback = () => {
    subIcon.style.background = `linear-gradient(135deg, ${chain.color || "var(--color-primary)"} 0%, rgba(255,255,255,0.1) 100%)`;
    const subSymbol = document.createElement("span");
    subSymbol.style.fontFamily = "var(--font-tech)";
    subSymbol.style.fontSize = "0.55rem";
    subSymbol.style.fontWeight = "900";
    subSymbol.style.color = "#fff";
    subSymbol.innerText = token.symbol || "TKN";
    subIcon.appendChild(subSymbol);
  };

  if (token.imageURL) {
    const img = document.createElement("img");
    img.src = token.imageURL;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.alt = token.symbol;
    img.onerror = () => {
      img.remove();
      setupSymbolFallback();
    };
    subIcon.appendChild(img);
  } else {
    setupSymbolFallback();
  }

  const subNameContainer = document.createElement("div");
  subNameContainer.style.display = "flex";
  subNameContainer.style.flexDirection = "column";
  subNameContainer.style.gap = "2px";
  subNameContainer.style.flex = "1";
  subNameContainer.style.minWidth = "0";

  const subName = document.createElement("span");
  subName.style.fontSize = "0.75rem";
  subName.style.fontWeight = "700";
  subName.style.color = "var(--text-secondary)";
  subName.innerText = token.name;

  const subId = document.createElement("span");
  subId.style.fontSize = "0.55rem";
  subId.style.color = "var(--text-muted)";
  subId.style.fontFamily = "var(--font-tech)";
  subId.innerText = `ID: ${token.assetId.substring(0, 6)}...${token.assetId.substring(token.assetId.length - 4)}`;

  subNameContainer.appendChild(subName);
  subNameContainer.appendChild(subId);
  subMeta.appendChild(subIcon);
  subMeta.appendChild(subNameContainer);

  const subVal = document.createElement("div");
  subVal.className = "blockchain-val";
  subVal.style.textAlign = "right";

  const subBalanceFiat = document.createElement("span");
  subBalanceFiat.className = "blockchain-balance-fiat";
  subBalanceFiat.style.fontSize = "0.75rem";
  subBalanceFiat.innerText = `$ ${token.balanceFiat.toFixed(2)}`;

  const subBalanceCrypto = document.createElement("span");
  subBalanceCrypto.className = "blockchain-balance-crypto";
  subBalanceCrypto.style.fontSize = "0.65rem";
  subBalanceCrypto.innerText = `${this.formatCryptoBalance(token.balanceCrypto, token.decimals)} ${token.symbol}`;

  subVal.appendChild(subBalanceFiat);
  subVal.appendChild(subBalanceCrypto);

  subRow.appendChild(subMeta);
  subRow.appendChild(subVal);

  // CONSTRUÇÃO DO DRAWER DE DETALHES DO TOKEN (GLASSMORPHIC)
  const detailContainer = document.createElement("div");
  detailContainer.className = "token-detail-drawer glass-card";
  detailContainer.style.display = "none";
  detailContainer.style.borderLeft = `2px solid ${chain.color || "var(--color-primary)"}`;
  detailContainer.style.padding = "14px";
  detailContainer.style.background = "rgba(10, 10, 18, 0.65)";
  detailContainer.style.borderRadius = "0 0 var(--radius-sm) var(--radius-sm)";
  detailContainer.style.fontSize = "0.75rem";
  detailContainer.style.color = "var(--text-secondary)";
  detailContainer.style.flexDirection = "column";
  detailContainer.style.gap = "10px";
  detailContainer.style.borderTop = "1px solid rgba(255, 255, 255, 0.04)";
  detailContainer.style.opacity = "0";
  detailContainer.style.transform = "translateY(-8px)";
  detailContainer.style.transition = "opacity 0.2s ease, transform 0.2s ease";

  let socialIconsHTML = "";
  if (token.socialmedias && Array.isArray(token.socialmedias)) {
    token.socialmedias.forEach(url => {
      let icon = "";
      if (url.includes("x.com") || url.includes("twitter.com")) {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="social-icon" style="display:block;"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>`;
      } else if (url.includes("t.me") || url.includes("telegram")) {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="social-icon" style="display:block;"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`;
      } else {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="social-icon" style="display:block;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
      }
      socialIconsHTML += `<a href="${url}" target="_blank" title="Social Media" class="token-social-link" style="color: var(--text-muted); transition: color var(--transition-fast);" onmouseover="this.style.color='var(--color-secondary)'" onmouseout="this.style.color='var(--text-muted)'">${icon}</a>`;
    });
  }

  detailContainer.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="font-size: 0.7rem; line-height: 1.4; color: var(--text-secondary);">
        ${token.description || "Este token customizado foi descoberto ou adicionado à sua carteira. Nenhuma descrição adicional foi fornecida."}
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 8px; margin-top: 4px; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 6px; font-family: var(--font-tech); font-size: 0.65rem;">
          <span style="color: var(--text-muted);">Contrato:</span>
          <span style="color: var(--text-secondary); word-break: break-all;">${token.assetId}</span>
          <button class="copy-contract-btn" style="background: none; border: none; padding: 2px 6px; cursor: pointer; color: var(--color-secondary); display: flex; align-items: center; justify-content: center; border-radius: var(--radius-xs); transition: background var(--transition-fast);" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='none'">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 0.65rem; color: var(--text-muted);">
            Decimais: <span style="color: var(--text-secondary); font-family: var(--font-tech);">${token.decimals}</span>
          </div>
          ${token.website ? `
            <a href="${token.website}" target="_blank" style="display: flex; align-items: center; gap: 4px; font-size: 0.65rem; color: var(--color-secondary); text-decoration: none; font-weight: 700; transition: opacity var(--transition-fast);" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
              Website
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          ` : ""}
          ${socialIconsHTML ? `
            <div style="display: flex; align-items: center; gap: 8px;">
              ${socialIconsHTML}
            </div>
          ` : ""}
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
        <button class="send-token-btn" style="background: linear-gradient(135deg, ${chain.color || "var(--color-primary)"} 0%, rgba(255,255,255,0.05) 100%); border: 1px solid rgba(255,255,255,0.1); padding: 4px 10px; border-radius: var(--radius-xs); color: #fff; font-size: 0.65rem; font-weight: 700; cursor: pointer; transition: all var(--transition-fast); display: flex; align-items: center; gap: 4px;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='none'">
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Enviar ${token.symbol}
        </button>
      </div>
    </div>
  `;

  // Toggling Mechanism on subRow click
  subRow.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = detailContainer.style.display === "flex";
    if (isOpen) {
      detailContainer.style.opacity = "0";
      detailContainer.style.transform = "translateY(-8px)";
      setTimeout(() => {
        detailContainer.style.display = "none";
      }, 200);
      subRow.style.borderRadius = "var(--radius-sm)";
    } else {
      detailContainer.style.display = "flex";
      // Reflow
      detailContainer.offsetHeight;
      detailContainer.style.opacity = "1";
      detailContainer.style.transform = "translateY(0)";
      subRow.style.borderRadius = "var(--radius-sm) var(--radius-sm) 0 0";
    }
  });

  // Action: Copy Contract
  detailContainer.querySelector(".copy-contract-btn")?.addEventListener('click', (e) => {
    e.stopPropagation();
    const contract = token.assetId || token.contractAddress;
    navigator.clipboard.writeText(contract).then(() => {
      window.showToast("Contrato copiado para a área de transferência!", "success");
    }).catch(err => {
      console.error("Failed to copy", err);
    });
  });

  // Action: Direct Transfer
  detailContainer.querySelector(".send-token-btn")?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.B2App) {
      window.B2App.showSendModal(chain.key, token);
    }
  });

  wrapper.appendChild(subRow);
  wrapper.appendChild(detailContainer);
  container.appendChild(wrapper);
};

/**
 * Renderiza a lista de endereços derivados para todas as 28 blockchains configuradas.
 */
UIRenderer.prototype.renderAddressesDirectory = function(blockchains, derivedKeys) {
  const container = document.getElementById("derived-addresses-directory-container");
  if (!container) return;
  container.innerHTML = "";
  blockchains.forEach(chain => {
    const keys = derivedKeys[chain.key];
    if (!keys || !keys.address) return;
    const card = document.createElement("div");
    card.className = "glass-card";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.gap = "6px";
    card.style.padding = "10px 12px";
    card.style.border = "1px solid var(--border-light)";
    card.style.borderRadius = "var(--radius-md)";
    card.style.transition = "transform var(--transition-fast)";
    const topRow = document.createElement("div");
    topRow.style.display = "flex";
    topRow.style.alignItems = "center";
    topRow.style.justifyContent = "space-between";
    const leftPart = document.createElement("div");
    leftPart.style.display = "flex";
    leftPart.style.alignItems = "center";
    leftPart.style.gap = "8px";
    const badge = document.createElement("div");
    badge.style.width = "24px";
    badge.style.height = "24px";
    badge.style.borderRadius = "4px";
    badge.style.display = "flex";
    badge.style.justifyContent = "center";
    badge.style.alignItems = "center";
    badge.style.overflow = "hidden";
    
    const colorHash = Array.from(chain.key).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hsl1 = colorHash % 360;
    
    const sym = document.createElement("span");
    sym.style.fontFamily = "var(--font-tech)";
    sym.style.fontSize = "0.55rem";
    sym.style.fontWeight = "900";
    sym.style.color = "#fff";
    sym.innerText = chain.symbol;
    
    if (chain.logoUrl) {
      const img = document.createElement("img");
      img.src = chain.logoUrl;
      img.style.width = "20px";
      img.style.height = "20px";
      img.style.objectFit = "contain";
      
      badge.style.background = "rgba(255, 255, 255, 0.05)";
      badge.style.border = "1px solid var(--border-light)";
      
      img.onerror = () => {
        img.remove();
        badge.style.background = `linear-gradient(135deg, hsl(${hsl1}, 80%, 45%), hsl(${(hsl1 * 2) % 360}, 85%, 55%))`;
        badge.style.border = "none";
        sym.style.display = "inline";
      };
      
      sym.style.display = "none";
      badge.appendChild(img);
    } else {
      badge.style.background = `linear-gradient(135deg, hsl(${hsl1}, 80%, 45%), hsl(${(hsl1 * 2) % 360}, 85%, 55%))`;
    }
    
    badge.appendChild(sym);
    const name = document.createElement("span");
    name.style.fontFamily = "var(--font-tech)";
    name.style.fontSize = "0.8rem";
    name.style.fontWeight = "700";
    name.innerText = chain.name;
    leftPart.appendChild(badge);
    leftPart.appendChild(name);
    const copyBtn = document.createElement("button");
    copyBtn.className = "btn-outline";
    copyBtn.style.padding = "2px 6px";
    copyBtn.style.fontSize = "0.6rem";
    copyBtn.style.borderRadius = "4px";
    copyBtn.style.fontFamily = "var(--font-tech)";
    copyBtn.style.cursor = "pointer";
    copyBtn.innerText = "COPIAR";
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(keys.address);
      copyBtn.innerText = "COPIADO!";
      copyBtn.style.color = "var(--text-success)";
      setTimeout(() => {
        copyBtn.innerText = "COPIAR";
        copyBtn.style.color = "";
      }, 1500);
    });
    topRow.appendChild(leftPart);
    topRow.appendChild(copyBtn);
    const addrRow = document.createElement("div");
    addrRow.className = "selectable";
    addrRow.style.fontFamily = "var(--font-tech)";
    addrRow.style.fontSize = "0.65rem";
    addrRow.style.color = "var(--text-secondary)";
    addrRow.style.wordBreak = "break-all";
    addrRow.style.background = "var(--bg-input)";
    addrRow.style.padding = "6px 8px";
    addrRow.style.borderRadius = "4px";
    addrRow.style.border = "1px solid var(--border-light)";
    addrRow.innerText = keys.address;
    card.appendChild(topRow);
    card.appendChild(addrRow);
    container.appendChild(card);
  });
};

/**
 * Renderiza a galeria de NFTs (Bento Grid) filtrada por blockchain ativa.
 */
UIRenderer.prototype.renderNFTsGaller = function(activeKey) {
  if (!activeKey) {
    activeKey = (window.B2App && window.B2App.activeChainKey) ? window.B2App.activeChainKey : "WAVES";
  }
  const container = document.getElementById("nfts-bento-grid");
  if (!container) return;
  container.innerHTML = "";
  // Sem dados simulados - apenas NFTs reais
  const initialNfts = [];
  const filteredNfts = initialNfts.filter(nft => nft.chainKey === activeKey);
  // Mescla NFTs descobertos dinamicamente das blockchains da família Waves ou da rede selecionada
  if (window.B2App && Array.isArray(window.B2App.blockchainData)) {
    window.B2App.blockchainData.forEach(chain => {
      if (chain.key === activeKey && chain.discoveredNFTs && chain.discoveredNFTs.length > 0) {
        chain.discoveredNFTs.forEach(discoveredNft => {
          if (!filteredNfts.some(n => n.id === discoveredNft.id)) {
            filteredNfts.push({
              id: discoveredNft.id,
              name: discoveredNft.name,
              collection: discoveredNft.collection,
              color: discoveredNft.color || "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
              price: discoveredNft.price || "1 NFT",
              chainKey: activeKey
            });
          }
        });
      }
    });
  }
  // Mescla NFTs adicionados manualmente armazenados no localStorage
  const localCustomNftsKey = `b2_custom_nfts_${activeKey}`;
  let localCustomNfts = [];
  try {
    localCustomNfts = JSON.parse(localStorage.getItem(localCustomNftsKey) || "[]");
    if (!Array.isArray(localCustomNfts)) localCustomNfts = [];
  } catch (err) {
    console.warn("Erro ao parsear NFTs customizados locais:", err);
  }
  localCustomNfts.forEach(customNft => {
    if (!customNft) return;
    const contractStr = typeof customNft.contract === 'string' ? customNft.contract : '';
    const idToUse = customNft.tokenId || customNft.id || (contractStr ? contractStr.substring(0, 6) : "NFT");
    if (!filteredNfts.some(n => n.id === idToUse || (n.contract && n.contract.toLowerCase() === contractStr.toLowerCase() && n.tokenId === customNft.tokenId))) {
      filteredNfts.push({
        id: idToUse,
        contract: customNft.contract,
        tokenId: customNft.tokenId,
        name: customNft.name,
        collection: customNft.collection || "Coleção Customizada",
        color: customNft.color || "linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)",
        price: "1 NFT",
        chainKey: activeKey,
        addedManually: true
      });
    }
  });

  if (filteredNfts.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.style.gridColumn = "span 2";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.padding = "32px 16px";
    emptyMsg.style.color = "var(--text-muted)";
    emptyMsg.style.fontFamily = "var(--font-body)";
    emptyMsg.style.fontSize = "0.75rem";
    emptyMsg.style.background = "var(--bg-card-light)";
    emptyMsg.style.border = "1px dashed var(--border-medium)";
    emptyMsg.style.borderRadius = "var(--radius-md)";
    emptyMsg.innerText = "Nenhum NFT encontrado nesta rede.";
    container.appendChild(emptyMsg);
    return;
  }

  // NFTs exibidos aqui são apenas aqueles descobertos na blockchain ou adicionados manualmente
  // 2. RENDERIZA OS DEMAIS NFTS FILTRADOS
  filteredNfts.forEach(nft => {
    const card = document.createElement("div");
    card.className = "glass-card";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.borderRadius = "var(--radius-md)";
    card.style.border = "1px solid var(--border-light)";
    card.style.overflow = "hidden";
    card.style.padding = "10px";
    card.style.gap = "8px";
    card.style.boxShadow = "var(--shadow-sm)";
    const imageFrame = document.createElement("div");
    imageFrame.style.width = "100%";
    imageFrame.style.height = "110px";
    imageFrame.style.borderRadius = "var(--radius-sm)";
    imageFrame.style.background = nft.color;
    imageFrame.style.display = "flex";
    imageFrame.style.justifyContent = "center";
    imageFrame.style.alignItems = "center";
    imageFrame.style.position = "relative";
    imageFrame.style.boxShadow = "0 0 10px rgba(139, 92, 246, 0.15)";
    
    const nftLabel = document.createElement("span");
    nftLabel.style.fontFamily = "var(--font-tech)";
    nftLabel.style.fontSize = "1.5rem";
    nftLabel.style.fontWeight = "900";
    nftLabel.style.color = "#fff";
    nftLabel.style.textShadow = "0 2px 10px rgba(0,0,0,0.3)";
    nftLabel.innerText = `NFT #${nft.id}`;
    imageFrame.appendChild(nftLabel);
    const info = document.createElement("div");
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.style.gap = "2px";
    const coll = document.createElement("span");
    coll.style.fontSize = "0.6rem";
    coll.style.color = "var(--text-muted)";
    coll.style.fontFamily = "var(--font-tech)";
    coll.style.textTransform = "uppercase";
    coll.innerText = nft.collection;
    const name = document.createElement("span");
    name.style.fontSize = "0.75rem";
    name.style.fontWeight = "700";
    name.style.color = "var(--text-primary)";
    name.style.whiteSpace = "nowrap";
    name.style.overflow = "hidden";
    name.style.textOverflow = "ellipsis";
    name.innerText = nft.name;
    const price = document.createElement("span");
    price.style.fontSize = "0.7rem";
    price.style.fontFamily = "var(--font-tech)";
    price.style.color = "var(--color-primary)";
    price.style.fontWeight = "bold";
    price.innerText = nft.price;
    info.appendChild(coll);
    info.appendChild(name);
    info.appendChild(price);
    card.appendChild(imageFrame);
    card.appendChild(info);
    container.appendChild(card);
  });
};
