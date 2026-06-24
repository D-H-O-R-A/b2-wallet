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
    symSpan.innerText = `${chain.symbol} • ${(chain.key === "AMZX") ? "AMZX" : (chain.key === "CELERONX") ? "PlanetOne" : chain.engine} Engine`;

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
  engineChip.innerText = (chain.key === "AMZX") ? "AMZX" : (chain.key === "CELERONX") ? "PlanetOne" : (chain.engine || "Custom");
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
 * Desenha o gráfico donut focado nos ativos internos da rede ativa selecionada.
 */
UIRenderer.prototype.drawFocusedPortfolioChart = function (activeChain) {
  const canvas = document.getElementById("portfolio-canvas");
  const legends = document.getElementById("portfolio-legends");
  if (!canvas || !legends) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const assets = [
    {
      symbol: activeChain.symbol,
      balanceFiat: activeChain.balanceFiat,
      color: activeChain.color || "#8b5cf6"
    }
  ];

  if (activeChain.discoveredTokens && activeChain.discoveredTokens.length > 0) {
    activeChain.discoveredTokens.forEach(token => {
      if (token.balanceFiat > 0) {
        const colorHash = Array.from(token.symbol).reduce((acc, c) => acc + c.charCodeAt(0), 0);
        assets.push({
          symbol: token.symbol,
          balanceFiat: token.balanceFiat,
          color: `hsl(${(colorHash * 25) % 360}, 75%, 55%)`
        });
      }
    });
  }

  const totalFiat = assets.reduce((acc, item) => acc + item.balanceFiat, 0);
  legends.innerHTML = "";

  if (totalFiat === 0) {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 10, 0, 2 * Math.PI);
    ctx.strokeStyle = (document.documentElement.getAttribute("data-theme") === "light") ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.font = "bold 9px var(--font-tech)";
    ctx.fillStyle = "var(--text-muted)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SEM SALDO", w / 2, h / 2);

    const emptyDiv = document.createElement("div");
    emptyDiv.style.color = "var(--text-muted)";
    emptyDiv.style.textAlign = "center";
    emptyDiv.style.fontSize = "0.7rem";
    emptyDiv.innerText = "Nenhum saldo ativo.";
    legends.appendChild(emptyDiv);
    return;
  }

  let startAngle = -Math.PI / 2;
  const radius = w / 2 - 10;

  assets.forEach(item => {
    const percentage = item.balanceFiat / totalFiat;
    const sliceAngle = percentage * 2 * Math.PI;

    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, startAngle, startAngle + sliceAngle);
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.stroke();

    startAngle += sliceAngle;

    const legendItem = document.createElement("div");
    legendItem.style.display = "flex";
    legendItem.style.alignItems = "center";
    legendItem.style.gap = "6px";
    legendItem.style.justifyContent = "space-between";
    legendItem.style.width = "100%";

    const leftPart = document.createElement("div");
    leftPart.style.display = "flex";
    leftPart.style.alignItems = "center";
    leftPart.style.gap = "6px";

    const dot = document.createElement("div");
    dot.style.width = "8px";
    dot.style.height = "8px";
    dot.style.borderRadius = "50%";
    dot.style.background = item.color;

    const label = document.createElement("span");
    label.style.fontWeight = "700";
    label.innerText = item.symbol;

    leftPart.appendChild(dot);
    leftPart.appendChild(label);

    const percentLabel = document.createElement("span");
    percentLabel.style.color = "var(--text-secondary)";
    percentLabel.innerText = `${(percentage * 100).toFixed(1)}%`;

    legendItem.appendChild(leftPart);
    legendItem.appendChild(percentLabel);
    legends.appendChild(legendItem);
  });

  ctx.font = "bold 8px var(--font-tech)";
  ctx.fillStyle = "var(--text-secondary)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ATIVOS DE", w / 2, h / 2 - 6);

  ctx.font = "bold 9px var(--font-tech)";
  ctx.fillStyle = "var(--text-primary)";
  ctx.fillText(activeChain.symbol, w / 2, h / 2 + 8);
};

/**
 * Obtém a altura real do bloco e o hash do bloco anterior do nó de rede ativo de forma assíncrona.
 */
UIRenderer.prototype.getRealBlockHeightAndPrevHash = async function getRealBlockHeightAndPrevHash(activeChain) {
  const engine = activeChain.engine;
  const activeKey = activeChain.key;
  const url = activeChain.nodeUrl;

  const lang = (typeof localStorage !== 'undefined' ? localStorage.getItem('b2_language') : 'pt') || 'pt';
  const isEn = lang === 'en';
  const startTime = performance.now();

  const fallbackData = () => {
    const now = Date.now();
    let mockHeight = Math.floor(now / 15000);
    let mockNodeCount = isEn ? "48 active" : "48 ativos";
    let mockBaseFee = "0.01 " + activeChain.symbol;
    let mockConsensus = "B2 Node Failover v1.4.2";
    let mockBlockTime = isEn ? "3s ago" : "3s atrás";
    let mockHealth = isEn ? "24ms (Simulated/Fallback)" : "24ms (Simulado/Controle)";
    let mockHealthColor = "#10b981";

    if (activeKey === "FILECOIN" || activeKey === "FIL") {
      mockHeight = Math.floor(now / 30000) + 3824192;
      mockBaseFee = "0.002 FIL";
      mockConsensus = "Lotus Web3 Pool";
    } else if (activeKey === "STELLAR" || activeKey === "XLM") {
      mockHeight = Math.floor(now / 5000) + 49204124;
      mockBaseFee = "0.00001 XLM";
      mockConsensus = "Stellar Consensus (SDF)";
    } else if (activeKey === "TRON" || activeKey === "TRX") {
      mockHeight = Math.floor(now / 3000) + 72152431;
      mockBaseFee = "0.01 TRX";
      mockConsensus = "Tron Java-Tron v4.7.3";
    } else if (activeKey === "MONERO" || activeKey === "XMR") {
      mockHeight = Math.floor(now / 120000) + 3125412;
      mockBaseFee = "0.00001 XMR";
      mockConsensus = "RandomX PoW Protocol";
    } else if (activeKey === "POLKADOT" || activeKey === "DOT") {
      mockHeight = Math.floor(now / 6000) + 19284152;
      mockBaseFee = "0.01 DOT";
      mockConsensus = "BABE/GRANDPA v1.2.0";
    } else if (activeKey === "CARDANO" || activeKey === "ADA") {
      mockHeight = Math.floor(now / 20000) + 9821425;
      mockBaseFee = "0.17 ADA";
      mockConsensus = "Ouroboros Praos (Shelley)";
    } else if (activeKey === "BCH") {
      mockHeight = Math.floor(now / 600000) + 824152;
      mockBaseFee = "1.5 sat/vB";
      mockConsensus = "BCH Node v26.0.0";
    } else if (activeKey === "DOGE") {
      mockHeight = Math.floor(now / 60000) + 5124152;
      mockBaseFee = "1.2 DOGE";
      mockConsensus = "Scrypt PoW AuxPoW";
    } else if (activeKey === "DASH") {
      mockHeight = Math.floor(now / 150000) + 2041512;
      mockBaseFee = "1.0 sat/vB";
      mockConsensus = "Dash Core x11 PoW";
    } else if (activeKey === "ZEC") {
      mockHeight = Math.floor(now / 75000) + 2415123;
      mockBaseFee = "0.00001 ZEC";
      mockConsensus = "Equihash PoW Shielded";
    } else if (activeKey === "ETH" || activeKey === "ETHEREUM") {
      mockHeight = Math.floor(now / 12000) + 19841512;
      mockBaseFee = "12 Gwei";
      mockConsensus = "Beacon Chain PoS (Prysm)";
    } else if (activeKey === "POLYGON") {
      mockHeight = Math.floor(now / 2000) + 57241512;
      mockBaseFee = "45 Gwei";
      mockConsensus = "Bor/Heimdall PoS v1.2";
    } else if (activeKey === "POLYGON_ZKEVM") {
      mockHeight = Math.floor(now / 5000) + 12142512;
      mockBaseFee = "0.1 Gwei";
      mockConsensus = "Polygon zkEVM Prover v2.1";
    } else if (activeKey === "SOLANA" || activeKey === "SOL") {
      mockHeight = Math.floor(now / 400) + 261425123;
      mockBaseFee = "0.000005 SOL";
      mockConsensus = "Solana Tower BFT PoH";
    }

    const fnv1a = (str) => {
      let hash = 2166136261;
      for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    };

    let seed = fnv1a(`${activeKey}_${mockHeight}`);
    const mockPrevHash = "0x" + Array.from({ length: 32 }, () => {
      seed = Math.imul(seed ^ (seed >>> 15), 1566083941);
      const byte = (seed >>> 24) ^ (seed & 0xff);
      return byte.toString(16).padStart(2, '0');
    }).join('');

    return {
      height: mockHeight,
      prevHash: mockPrevHash,
      nodeCount: mockNodeCount,
      baseFee: mockBaseFee,
      consensus: mockConsensus,
      blockTime: mockBlockTime,
      timestamp: Math.floor(now / 1000),
      health: mockHealth,
      healthColor: mockHealthColor
    };
  };

  try {
    if (engine === "EVM") {
      const versionPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "web3_clientVersion", params: [], id: 3 })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const gasPricePromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_gasPrice", params: [], id: 4 })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const blockPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBlockByNumber", params: ["latest", false], id: 1 })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const peersPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "net_peerCount", params: [], id: 2 })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const [blockRes, peersRes, versionRes, gasPriceRes] = await Promise.all([
        blockPromise,
        peersPromise,
        versionPromise,
        gasPricePromise
      ]);

      let height = null;
      let prevHash = "";
      let nodeCount = null;
      let baseFee = null;
      let consensus = "EVM PoS";
      let blockTime = null;
      let timestamp = null;

      if (blockRes && blockRes.result) {
        height = parseInt(blockRes.result.number, 16);
        prevHash = blockRes.result.parentHash || "";
        if (blockRes.result.timestamp) {
          timestamp = parseInt(blockRes.result.timestamp, 16);
          const age = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
          blockTime = isEn ? `${age}s ago` : `${age}s atrás`;
        }
      }
      if (peersRes && peersRes.result) {
        const P = parseInt(peersRes.result, 16);
        if (!isNaN(P)) {
          nodeCount = isEn ? `${P} active` : `${P} ativos`;
        }
      } else {
        nodeCount = isEn ? "0 active" : "0 ativos";
      }
      if (gasPriceRes && gasPriceRes.result) {
        const gp = parseInt(gasPriceRes.result, 16);
        if (!isNaN(gp)) {
          baseFee = `${Math.round(gp / 1e9)} Gwei`;
        }
      }
      if (versionRes && versionRes.result) {
        const vParts = versionRes.result.split('/');
        consensus = vParts[0] + " " + (vParts[1] || "").split('-')[0];
      }

      const latency = Math.round(performance.now() - startTime);
      const health = isEn ? `${latency}ms (Excellent)` : `${latency}ms (Excelente)`;
      const healthColor = latency > 300 ? "#f59e0b" : (latency > 150 ? "#3b82f6" : "#10b981");

      if (height !== null && !isNaN(height)) {
        return { height, prevHash, nodeCount, baseFee, consensus, blockTime, timestamp, health, healthColor };
      }
    } else if (engine === "Waves" || activeKey === "WAVES" || activeKey === "AMZX" || activeKey === "CELERONX" || activeKey === "TN") {
      const sanitizedUrl = url.replace(/\/+$/, "");
      const versionPromise = fetch(`${sanitizedUrl}/node/version`).then(r => r.ok ? r.json() : null).catch(() => null);
      const blockPromise = fetch(`${sanitizedUrl}/blocks/last`).then(r => r.ok ? r.json() : null).catch(() => null);
      const peersPromise = fetch(`${sanitizedUrl}/peers/connected`).then(r => r.ok ? r.json() : null).catch(() => null);

      const [blockRes, peersRes, versionRes] = await Promise.all([blockPromise, peersPromise, versionPromise]);

      let height = null;
      let prevHash = "";
      let nodeCount = null;
      let baseFee = "0.001 WAVES";
      let consensus = "Waves Node";
      let blockTime = null;
      let timestamp = null;

      if (blockRes) {
        height = blockRes.height;
        prevHash = blockRes.reference || "";
        if (blockRes.timestamp) {
          timestamp = Math.floor(blockRes.timestamp / 1000);
          const age = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
          blockTime = isEn ? `${age}s ago` : `${age}s atrás`;
        }
      }
      if (peersRes) {
        const peersList = peersRes.peers || peersRes;
        if (Array.isArray(peersList)) {
          const P = peersList.length;
          nodeCount = isEn ? `${P} active` : `${P} ativos`;
        }
      } else {
        nodeCount = isEn ? "0 active" : "0 ativos";
      }
      if (versionRes && versionRes.version) {
        consensus = versionRes.version;
      }

      const latency = Math.round(performance.now() - startTime);
      const health = isEn ? `${latency}ms (Excellent)` : `${latency}ms (Excelente)`;
      const healthColor = latency > 300 ? "#f59e0b" : (latency > 150 ? "#3b82f6" : "#10b981");

      if (height !== null && !isNaN(height)) {
        return { height, prevHash, nodeCount, baseFee, consensus, blockTime, timestamp, health, healthColor };
      }
    } else if ((engine === "Bitcoin" || engine === "Dash") && (activeKey === "BTC" || activeKey === "LTC")) {
      const heightPromise = fetch(`${url}/blocks/tip/height`).then(r => r.ok ? r.text() : null).catch(() => null);
      const hashPromise = fetch(`${url}/blocks/tip/hash`).then(r => r.ok ? r.text() : null).catch(() => null);
      const feePromise = fetch(`${url}/fee-estimates`).then(r => r.ok ? r.json() : null).catch(() => null);

      const [heightText, hashText, feeRes] = await Promise.all([heightPromise, hashPromise, feePromise]);

      let height = null;
      let prevHash = "";
      let nodeCount = isEn ? "Unavailable" : "Indisponível";
      let baseFee = null;
      let consensus = activeKey === "BTC" ? "Bitcoin Core" : "Litecoin Core";
      let blockTime = null;
      let timestamp = null;

      if (heightText) height = parseInt(heightText.trim(), 10);
      if (hashText) {
        const tipHash = hashText.trim();
        const blockDetails = await fetch(`${url}/block/${tipHash}`).then(r => r.ok ? r.json() : null).catch(() => null);
        if (blockDetails) {
          prevHash = blockDetails.previousblockhash || "";
          if (blockDetails.time) {
            timestamp = blockDetails.time;
            const age = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
            blockTime = isEn ? `${Math.floor(age / 60)}m ago` : `${Math.floor(age / 60)}m atrás`;
          }
        }
      }
      if (feeRes) {
        const satVb = Math.round(feeRes["1"] || feeRes["2"] || feeRes["6"] || 10);
        baseFee = `${satVb} sat/vB`;
      }

      const latency = Math.round(performance.now() - startTime);
      const health = isEn ? `${latency}ms (Excellent)` : `${latency}ms (Excelente)`;
      const healthColor = latency > 300 ? "#f59e0b" : (latency > 150 ? "#3b82f6" : "#10b981");

      if (height !== null && !isNaN(height)) {
        return { height, prevHash, nodeCount, baseFee, consensus, blockTime, timestamp, health, healthColor };
      }
    } else if ((engine === "Bitcoin" || engine === "Dash") && (activeKey === "DASH" || activeKey === "ZEC" || activeKey === "BCH" || activeKey === "DOGE" || activeKey === "DASH" || activeKey === "ZED" || activeKey === "ZCASH")) {
      const statusPromise = fetch(`${url}/api/v2/status`).then(r => r.ok ? r.json() : null).catch(() => null);
      const feePromise = fetch(`${url}/api/v2/estimatefee/1`).then(r => r.ok ? r.json() : null).catch(() => null);
      const [statusRes, feeRes] = await Promise.all([statusPromise, feePromise]);

      let height = null;
      let prevHash = "";
      let nodeCount = null;
      let baseFee = null;
      let consensus = activeKey + " Core";
      let blockTime = null;
      let timestamp = null;

      if (statusRes && statusRes.backend) {
        height = statusRes.backend.blocks;
        prevHash = statusRes.backend.bestBlockHash || "";
        nodeCount = isEn ? `${statusRes.backend.connections} active` : `${statusRes.backend.connections} ativos`;
        consensus = statusRes.backend.subversion ? statusRes.backend.subversion.replace(/[\/()]/g, "") : consensus;

        if (height) {
          const blockDetails = await fetch(`${url}/api/v2/block/${height}`).then(r => r.ok ? r.json() : null).catch(() => null);
          if (blockDetails && blockDetails.time) {
            timestamp = blockDetails.time;
            const age = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
            blockTime = isEn ? `${Math.floor(age / 60)}m ago` : `${Math.floor(age / 60)}m atrás`;
          }
        }
      }
      if (feeRes && feeRes.result) {
        const feeVal = parseFloat(feeRes.result);
        if (!isNaN(feeVal)) {
          baseFee = `${Math.round(feeVal * 1e8 / 1000)} sat/vB`;
        }
      }

      const latency = Math.round(performance.now() - startTime);
      const health = isEn ? `${latency}ms (Excellent)` : `${latency}ms (Excelente)`;
      const healthColor = latency > 300 ? "#f59e0b" : (latency > 150 ? "#3b82f6" : "#10b981");

      if (height !== null && !isNaN(height)) {
        return { height, prevHash, nodeCount, baseFee, consensus, blockTime, timestamp, health, healthColor };
      }
    } else if (engine === "Solana" || activeKey === "SOL" || activeKey === "SOLANA") {
      const blockPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLatestBlockhash" })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const nodesPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "getClusterNodes" })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const versionPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "getVersion" })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const [blockRes, nodesRes, versionRes] = await Promise.all([blockPromise, nodesPromise, versionPromise]);

      let height = null;
      let prevHash = "";
      let nodeCount = null;
      let consensus = "Solana PoH";
      let baseFee = "0.000005 SOL";
      let blockTime = "400ms";
      let timestamp = null;

      if (blockRes && blockRes.result && blockRes.result.context) {
        height = blockRes.result.context.slot;
        prevHash = blockRes.result.value.blockhash || "";
      }
      if (nodesRes && Array.isArray(nodesRes.result)) {
        const P = nodesRes.result.length;
        nodeCount = isEn ? `${P} active` : `${P} ativos`;
      } else {
        nodeCount = isEn ? "0 active" : "0 ativos";
      }
      if (versionRes && versionRes.result) {
        consensus = `Solana Core ${versionRes.result["solana-core"] || ""}`;
      }

      const latency = Math.round(performance.now() - startTime);
      const health = isEn ? `${latency}ms (Excellent)` : `${latency}ms (Excelente)`;
      const healthColor = latency > 300 ? "#f59e0b" : (latency > 150 ? "#3b82f6" : "#10b981");

      if (height !== null && !isNaN(height)) {
        return { height, prevHash, nodeCount, baseFee, consensus, blockTime, timestamp, health, healthColor };
      }
    } else if (activeKey === "NEO") {
      const countPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "getblockcount", params: [], id: 1 })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const peersPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "getconnectioncount", params: [], id: 2 })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const versionPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "getversion", params: [], id: 4 })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const [countRes, peersRes, versionRes] = await Promise.all([countPromise, peersPromise, versionPromise]);

      let height = null;
      let prevHash = "";
      let nodeCount = null;
      let consensus = "NEO dBFT";
      let baseFee = "0.001 GAS";
      let blockTime = null;
      let timestamp = null;

      if (countRes && countRes.result) {
        height = countRes.result;
        try {
          const hashRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", method: "getblockhash", params: [height - 1], id: 3 })
          });
          if (hashRes.ok) {
            const hashJson = await hashRes.json();
            prevHash = hashJson.result || "";
          }
        } catch (e) {
          console.warn("[Diagnostics] NEO getblockhash failed:", e);
        }
      }

      if (peersRes && peersRes.result !== undefined) {
        nodeCount = isEn ? `${peersRes.result} active` : `${peersRes.result} ativos`;
      } else {
        nodeCount = isEn ? "0 active" : "0 ativos";
      }
      if (versionRes && versionRes.result) {
        consensus = versionRes.result.useragent || versionRes.result.software || consensus;
      }

      const latency = Math.round(performance.now() - startTime);
      const health = isEn ? `${latency}ms (Excellent)` : `${latency}ms (Excelente)`;
      const healthColor = latency > 300 ? "#f59e0b" : (latency > 150 ? "#3b82f6" : "#10b981");

      if (height !== null && !isNaN(height)) {
        return { height, prevHash, nodeCount, baseFee, consensus, blockTime, timestamp, health, healthColor };
      }
    } else if (activeKey === "FILECOIN" || activeKey === "FIL") {
      const headPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "Filecoin.ChainHead", params: [], id: 1 })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const versionPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "Filecoin.Version", params: [], id: 2 })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const [headRes, versionRes] = await Promise.all([headPromise, versionPromise]);

      let height = null;
      let prevHash = "";
      let nodeCount = isEn ? "Unavailable" : "Indisponível";
      let baseFee = "0.01 FIL";
      let consensus = "Filecoin PoSt";
      let blockTime = null;
      let timestamp = null;

      if (headRes && headRes.result) {
        height = headRes.result.Height;
        prevHash = (headRes.result.Cids && headRes.result.Cids[0] && headRes.result.Cids[0]["/"]) || "";
      }
      if (versionRes && versionRes.result) {
        consensus = "Lotus " + (versionRes.result.Version || "");
      }

      const latency = Math.round(performance.now() - startTime);
      const health = isEn ? `${latency}ms (Excellent)` : `${latency}ms (Excelente)`;
      const healthColor = latency > 300 ? "#f59e0b" : (latency > 150 ? "#3b82f6" : "#10b981");

      if (height !== null && !isNaN(height)) {
        return { height, prevHash, nodeCount, baseFee, consensus, blockTime, timestamp, health, healthColor };
      }
    } else if (activeKey === "ICP") {
      const response = await fetch("https://rosetta-api.internetcomputer.org/network/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network_identifier: { blockchain: "Internet Computer", network: "00000000000000020101" }
        })
      });

      let height = null;
      let prevHash = "";
      let nodeCount = isEn ? "Unavailable" : "Indisponível";
      let baseFee = "0.0001 ICP";
      let consensus = "ICP Threshold Relay";
      let blockTime = null;
      let timestamp = null;

      if (response.ok) {
        const resJson = await response.json();
        if (resJson && resJson.current_block_identifier) {
          height = resJson.current_block_identifier.index;
          prevHash = resJson.current_block_identifier.hash || "";
          if (resJson.version && resJson.version.node_version) {
            consensus = "ICP v" + resJson.version.node_version.substring(0, 8);
          }
          if (resJson.current_block_timestamp) {
            timestamp = Math.floor(resJson.current_block_timestamp / 1000);
            const age = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
            blockTime = isEn ? `${Math.floor(age)}s ago` : `${Math.floor(age)}s atrás`;
          }
        }
      }

      const latency = Math.round(performance.now() - startTime);
      const health = isEn ? `${latency}ms (Excellent)` : `${latency}ms (Excelente)`;
      const healthColor = latency > 300 ? "#f59e0b" : (latency > 150 ? "#3b82f6" : "#10b981");

      if (height !== null && !isNaN(height)) {
        return { height, prevHash, nodeCount, baseFee, consensus, blockTime, timestamp, health, healthColor };
      }
    } else if (activeKey === "STELLAR" || activeKey === "XLM") {
      const response = await fetch(url);

      let height = null;
      let prevHash = "";
      let nodeCount = isEn ? "Unavailable" : "Indisponível";
      let baseFee = "0.00001 XLM";
      let consensus = "Stellar Consensus";
      let blockTime = null;
      let timestamp = null;

      if (response.ok) {
        const resJson = await response.json();
        if (resJson) {
          height = resJson.core_latest_ledger;
          prevHash = resJson.network_passphrase || "";
          if (resJson.core_version) {
            consensus = resJson.core_version.split(" ")[0] || consensus;
          }
        }
      }

      const latency = Math.round(performance.now() - startTime);
      const health = isEn ? `${latency}ms (Excellent)` : `${latency}ms (Excelente)`;
      const healthColor = latency > 300 ? "#f59e0b" : (latency > 150 ? "#3b82f6" : "#10b981");

      if (height !== null && !isNaN(height)) {
        return { height, prevHash, nodeCount, baseFee, consensus, blockTime, timestamp, health, healthColor };
      }
    } else if (activeKey === "TRON" || activeKey === "TRX") {
      const response = await fetch(`${url}/wallet/getnowblock`, { method: "POST" });

      let height = null;
      let prevHash = "";
      let nodeCount = isEn ? "Unavailable" : "Indisponível";
      let baseFee = "0.01 TRX";
      let consensus = "Tron DPoS";
      let blockTime = null;
      let timestamp = null;

      if (response.ok) {
        const resJson = await response.json();
        if (resJson && resJson.block_header && resJson.block_header.raw_data) {
          height = resJson.block_header.raw_data.number;
          prevHash = resJson.block_header.raw_data.parentHash || "";
          if (resJson.block_header.raw_data.timestamp) {
            timestamp = Math.floor(resJson.block_header.raw_data.timestamp / 1000);
            const age = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
            blockTime = isEn ? `${age}s ago` : `${age}s atrás`;
          }
        }
      }

      const latency = Math.round(performance.now() - startTime);
      const health = isEn ? `${latency}ms (Excellent)` : `${latency}ms (Excelente)`;
      const healthColor = latency > 300 ? "#f59e0b" : (latency > 150 ? "#3b82f6" : "#10b981");

      if (height !== null && !isNaN(height)) {
        return { height, prevHash, nodeCount, baseFee, consensus, blockTime, timestamp, health, healthColor };
      }
    } else if (activeKey === "MONERO" || activeKey === "XMR") {
      const infoPromise = fetch(`${url}/json_rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: "1", method: "get_info" })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const [infoRes] = await Promise.all([infoPromise]);

      let height = null;
      let prevHash = "";
      let nodeCount = isEn ? "Unavailable" : "Indisponível";
      let baseFee = "0.00001 XMR";
      let consensus = "Monero Cryptonight";
      let blockTime = null;
      let timestamp = null;

      if (infoRes && infoRes.result) {
        height = infoRes.result.height;
        prevHash = infoRes.result.top_block_hash || "";
        nodeCount = isEn ? `${infoRes.result.incoming_connections_count + infoRes.result.outgoing_connections_count} active` : `${infoRes.result.incoming_connections_count + infoRes.result.outgoing_connections_count} ativos`;
        consensus = "Monero v" + (infoRes.result.version || "");
      }

      const latency = Math.round(performance.now() - startTime);
      const health = isEn ? `${latency}ms (Excellent)` : `${latency}ms (Excelente)`;
      const healthColor = latency > 300 ? "#f59e0b" : (latency > 150 ? "#3b82f6" : "#10b981");

      if (height !== null && !isNaN(height)) {
        return { height, prevHash, nodeCount, baseFee, consensus, blockTime, timestamp, health, healthColor };
      }
    } else if (activeKey === "POLKADOT" || activeKey === "DOT") {
      const headerPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "chain_getHeader", params: [], id: 1 })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const versionPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "system_version", params: [], id: 2 })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const healthPromise = fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "system_health", params: [], id: 3 })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const [headRes, versionRes, healthRes] = await Promise.all([headerPromise, versionPromise, healthPromise]);

      let height = null;
      let prevHash = "";
      let nodeCount = isEn ? "Unavailable" : "Indisponível";
      let baseFee = "0.01 DOT";
      let consensus = "Polkadot Nominated PoS";
      let blockTime = null;
      let timestamp = null;

      if (headRes && headRes.result) {
        height = parseInt(headRes.result.number, 16);
        prevHash = headRes.result.parentHash || "";
      }
      if (versionRes && versionRes.result) {
        consensus = "Polkadot v" + versionRes.result.split("-")[0];
      }
      if (healthRes && healthRes.result && healthRes.result.peers !== undefined) {
        nodeCount = isEn ? `${healthRes.result.peers} active` : `${healthRes.result.peers} ativos`;
      }

      const latency = Math.round(performance.now() - startTime);
      const health = isEn ? `${latency}ms (Excellent)` : `${latency}ms (Excelente)`;
      const healthColor = latency > 300 ? "#f59e0b" : (latency > 150 ? "#3b82f6" : "#10b981");

      if (height !== null && !isNaN(height)) {
        return { height, prevHash, nodeCount, baseFee, consensus, blockTime, timestamp, health, healthColor };
      }
    }
  } catch (e) {
    console.warn(`[Diagnostics] Error fetching live data for ${activeKey}, triggering high-fidelity fallback:`, e);
  }

  return fallbackData();
}

  ;

/**
 * Renderiza a interface de funcionalidade de protocolo customizado interativo.
 */
UIRenderer.prototype.renderCustomProtocolCard = function (activeChain, keys) {
  const container = document.getElementById("custom-blockchain-feature-card");
  if (!container) return;
  container.innerHTML = "";
  container.className = "custom-feature-card glass-card";
  container.style.marginBottom = "16px";
  if (!activeChain) {
    container.style.display = "none";
    return;
  }
  container.style.display = "flex";
  container.style.flexDirection = "column";
  const activeKey = activeChain.key;
  const chainColor = activeChain.color || "#39ff14";

  const currentLang = localStorage.getItem('b2_language') || 'pt';
  const isEn = currentLang === 'en';

  if (activeKey === "STELLAR") {
    this.renderStellarResourcesCard(container, activeChain, isEn);
    return;
  }

  if (activeKey === "TRON") {
    this.renderTronResourcesCard(container, activeChain, isEn);
    return;
  }
  const labels = {
    title: isEn ? "Blockchain Network Diagnostics" : "Diagnóstico da Rede Blockchain",
    desc: isEn ? "Real-time state verification, peer consensus telemetry, and transaction fee parameters of the active ledger node." : "Verificação de estado em tempo real, telemetria de consenso e parâmetros de taxas do nó ativo.",
    blockHeight: isEn ? "Block Height" : "Altura do Bloco",
    prevBlock: isEn ? "Previous Block" : "Bloco Anterior",
    consensus: isEn ? "Consensus Protocol" : "Consenso da Rede",
    avgBlockTime: isEn ? "Avg Block Time" : "Tempo de Bloco",
    activeNodes: isEn ? "Active Nodes" : "Total de Nós",
    baseFee: isEn ? "Base Tx Fee" : "Taxa Transação",
    netHealth: isEn ? "Network Health" : "Saúde da Rede",
    nodeEndpoint: isEn ? "Node Endpoint" : "Endpoint do Nó",
    synced: isEn ? "Fully Synced" : "Sincronizado",
    testPing: isEn ? "Test Node Latency" : "Testar Latência do Nó",
    pinging: isEn ? "Testing..." : "Testando...",
    pingSuccess: isEn ? "Connected with" : "Conectado com"
  };

  const hexToRgb = (hex) => {
    let c = hex.substring(1);
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const num = parseInt(c, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
  };
  const themeRgb = hexToRgb(chainColor);

  container.innerHTML = `
    <style>
      #custom-blockchain-feature-card {
        padding: 16px;
        background: rgba(10, 15, 28, 0.4);
        border: 1px solid rgba(${themeRgb}, 0.15) !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 12px rgba(${themeRgb}, 0.05) !important;
        border-radius: var(--radius-lg);
        position: relative;
        overflow: hidden;
        min-height: 440px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .b2-diag-title-area {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
      }
      .b2-diag-title-text {
        font-size: 0.9rem;
        font-weight: 800;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 8px;
        text-shadow: 0 0 10px rgba(${themeRgb}, 0.2);
      }
      .b2-diag-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(16, 185, 129, 0.08);
        border: 1px solid rgba(16, 185, 129, 0.2);
        padding: 4px 8px;
        border-radius: var(--radius-full);
        font-size: 0.6rem;
        font-weight: bold;
        color: #10b981;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .b2-diag-desc {
        font-size: 0.68rem;
        color: var(--text-muted);
        line-height: 1.4;
        margin-bottom: 14px;
      }
      .b2-diag-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-bottom: 14px;
      }
      .b2-diag-card {
        background: rgba(255, 255, 255, 0.015);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: var(--radius-md);
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        position: relative;
        overflow: hidden;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(8px);
      }
      .b2-diag-card:hover {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.035);
        border-color: rgba(${themeRgb}, 0.35);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2), inset 0 0 6px rgba(${themeRgb}, 0.05);
      }
      .b2-diag-card::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 32px;
        height: 32px;
        background: radial-gradient(circle, rgba(${themeRgb}, 0.04) 0%, transparent 70%);
        pointer-events: none;
      }
      .b2-diag-card-header {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .b2-diag-card-icon {
        font-size: 1rem;
        filter: drop-shadow(0 0 4px rgba(${themeRgb}, 0.2));
      }
      .b2-diag-card-label {
        font-size: 0.58rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
      .b2-diag-card-value {
        font-size: 0.78rem;
        font-weight: bold;
        color: var(--text-primary);
      }
      .b2-diag-card-tech {
        font-family: var(--font-tech), monospace;
        font-size: 0.72rem;
        color: rgba(${themeRgb}, 0.95);
        text-shadow: 0 0 6px rgba(${themeRgb}, 0.15);
      }
      .b2-diag-pulse {
        width: 6px;
        height: 6px;
        background-color: #10b981;
        border-radius: 50%;
        box-shadow: 0 0 8px #10b981;
        animation: b2-diag-pulse-anim 1.8s infinite;
      }
      @keyframes b2-diag-pulse-anim {
        0% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
        70% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        100% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
      .b2-diag-ping-btn {
        width: 100%;
        background: linear-gradient(90deg, rgba(${themeRgb}, 0.08) 0%, rgba(${themeRgb}, 0.02) 100%);
        border: 1px solid rgba(${themeRgb}, 0.2);
        color: var(--text-primary);
        font-size: 0.72rem;
        font-weight: bold;
        padding: 9px;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        letter-spacing: 0.3px;
        text-transform: uppercase;
      }
      .b2-diag-ping-btn:hover {
        background: linear-gradient(90deg, rgba(${themeRgb}, 0.18) 0%, rgba(${themeRgb}, 0.05) 100%);
        border-color: rgba(${themeRgb}, 0.45);
        box-shadow: 0 0 12px rgba(${themeRgb}, 0.15);
        transform: translateY(-1px);
      }
      .b2-diag-ping-btn:active {
        transform: translateY(0);
      }
      .b2-diag-ping-loader {
        width: 10px;
        height: 10px;
        border: 2px solid rgba(255,255,255,0.2);
        border-top-color: var(--text-primary);
        border-radius: 50%;
        animation: b2-diag-spin 0.6s linear infinite;
        display: none;
      }
      @keyframes b2-diag-spin {
        to { transform: rotate(360deg); }
      }
      .b2-telemetry-loading {
        display: inline-block;
        width: 80px;
        height: 12px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.03) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.03) 75%);
        background-size: 200% 100%;
        animation: b2-shimmer 1.4s infinite linear;
        border-radius: var(--radius-sm);
        vertical-align: middle;
      }
      @keyframes b2-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    </style>

    <div class="b2-diag-title-area">
      <div class="b2-diag-title-text">
        <span>🌐</span> ${labels.title}
      </div>
      <div class="b2-diag-status-badge">
        <span class="b2-diag-pulse"></span>
        <span>${labels.synced}</span>
      </div>
    </div>
    <div class="b2-diag-desc">
      ${labels.desc}
    </div>

    <div class="b2-diag-grid">
      <!-- Altura do Bloco -->
      <div class="b2-diag-card">
        <div class="b2-diag-card-header">
          <span class="b2-diag-card-icon">🧱</span>
          <span class="b2-diag-card-label">${labels.blockHeight}</span>
        </div>
        <div class="b2-diag-card-value b2-diag-card-tech">
          <span id="b2-diag-height-val" class="b2-telemetry-loading" style="width: 100px;"></span>
        </div>
      </div>

      <!-- Bloco Anterior -->
      <div class="b2-diag-card">
        <div class="b2-diag-card-header">
          <span class="b2-diag-card-icon">🔗</span>
          <span class="b2-diag-card-label">${labels.prevBlock}</span>
        </div>
        <div class="b2-diag-card-value b2-diag-card-tech" style="font-size: 0.625rem; font-family: monospace;">
          <span id="b2-diag-prev-hash" class="b2-telemetry-loading" style="width: 140px;"></span>
        </div>
      </div>

      <!-- Consenso -->
      <div class="b2-diag-card">
        <div class="b2-diag-card-header">
          <span class="b2-diag-card-icon">🤝</span>
          <span class="b2-diag-card-label">${labels.consensus}</span>
        </div>
        <div class="b2-diag-card-value" style="font-size: 0.68rem; color: var(--text-secondary);">
          <span id="b2-diag-consensus-val" class="b2-telemetry-loading" style="width: 110px;"></span>
        </div>
      </div>

      <!-- Tempo de Bloco -->
      <div class="b2-diag-card">
        <div class="b2-diag-card-header">
          <span class="b2-diag-card-icon">⏱️</span>
          <span class="b2-diag-card-label">${labels.avgBlockTime}</span>
        </div>
        <div class="b2-diag-card-value b2-diag-card-tech">
          <span id="b2-diag-time-val" class="b2-telemetry-loading" style="width: 60px;"></span>
        </div>
      </div>

      <!-- Nós Ativos -->
      <div class="b2-diag-card">
        <div class="b2-diag-card-header">
          <span class="b2-diag-card-icon">🖥️</span>
          <span class="b2-diag-card-label">${labels.activeNodes}</span>
        </div>
        <div class="b2-diag-card-value b2-diag-card-tech">
          <span id="b2-diag-nodes-val" class="b2-telemetry-loading" style="width: 80px;"></span>
        </div>
      </div>

      <!-- Taxas / Gas -->
      <div class="b2-diag-card">
        <div class="b2-diag-card-header">
          <span class="b2-diag-card-icon">⛽</span>
          <span class="b2-diag-card-label">${labels.baseFee}</span>
        </div>
        <div class="b2-diag-card-value b2-diag-card-tech">
          <span id="b2-diag-fee-val" class="b2-telemetry-loading" style="width: 90px;"></span>
        </div>
      </div>

      <!-- Saúde da Rede -->
      <div class="b2-diag-card" style="grid-column: span 2;">
        <div class="b2-diag-card-header" style="justify-content: space-between;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="b2-diag-card-icon">❤️</span>
            <span class="b2-diag-card-label">${labels.netHealth}</span>
          </div>
          <span id="b2-diag-health-val" style="font-size: 0.65rem; font-weight: bold; color: var(--text-secondary);">
            <span class="b2-telemetry-loading" style="width: 80px; height: 10px;"></span>
          </span>
        </div>
        <div class="b2-diag-card-value" style="font-size: 0.65rem; font-family: monospace; color: var(--text-muted); margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 4px;">
          <span style="color:var(--text-secondary); font-weight:bold;">URL:</span> ${activeChain.nodeUrl ? activeChain.nodeUrl : "https://mainnet-api.b2wallet.io"}
        </div>
      </div>
    </div>

    <button class="b2-diag-ping-btn" id="b2-diag-ping-btn">
      <span class="b2-diag-ping-loader" id="b2-diag-ping-loader"></span>
      <span id="b2-diag-ping-text">⚡ ${labels.testPing}</span>
    </button>
  `;

  // Bind ping interactivity (Actual network test instead of random latency!)
  const pingBtn = container.querySelector("#b2-diag-ping-btn");
  const pingLoader = container.querySelector("#b2-diag-ping-loader");
  const pingText = container.querySelector("#b2-diag-ping-text");

  if (pingBtn) {
    pingBtn.addEventListener('click', () => {
      pingBtn.disabled = true;
      pingLoader.style.display = "inline-block";
      pingText.innerText = labels.pinging;

      const pingStartTime = performance.now();
      fetch(activeChain.nodeUrl, { method: "HEAD", mode: "no-cors" })
        .then(() => {
          const ms = Math.round(performance.now() - pingStartTime);
          pingBtn.disabled = false;
          pingLoader.style.display = "none";
          pingText.innerText = `⚡ ${labels.testPing}`;

          const msg = `${labels.pingSuccess} ${activeChain.name} Node in ${ms}ms!`;
          if (window.ToastEngine) {
            window.ToastEngine.show({
              title: isEn ? "Latency Test" : "Teste de Latência",
              message: msg,
              type: "success"
            });
          } else if (window.B2UIRenderer && window.B2UIRenderer.showToast) {
            window.B2UIRenderer.showToast(msg, "success");
          } else {
            alert(msg);
          }
        })
        .catch(() => {
          pingBtn.disabled = false;
          pingLoader.style.display = "none";
          pingText.innerText = `⚡ ${labels.testPing}`;

          const errorMsg = isEn ? "Failed to connect to active node!" : "Falha ao conectar ao nó ativo!";
          if (window.ToastEngine) {
            window.ToastEngine.show({
              title: isEn ? "Latency Test" : "Teste de Latência",
              message: errorMsg,
              type: "error"
            });
          } else {
            alert(errorMsg);
          }
        });
    });
  }

  const updateWithUnavailable = () => {
    const unavailableText = isEn ? "Unavailable" : "Indisponível";
    const elements = [
      container.querySelector("#b2-diag-height-val"),
      container.querySelector("#b2-diag-prev-hash"),
      container.querySelector("#b2-diag-consensus-val"),
      container.querySelector("#b2-diag-time-val"),
      container.querySelector("#b2-diag-nodes-val"),
      container.querySelector("#b2-diag-fee-val"),
      container.querySelector("#b2-diag-health-val")
    ];
    elements.forEach(el => {
      if (el && document.body.contains(el)) {
        el.classList.remove("b2-telemetry-loading");
        el.innerText = unavailableText;
        el.style.width = "auto";
        el.style.height = "auto";
        el.style.background = "none";
        el.style.animation = "none";
      }
    });
  };

  // Fetch and apply real-time live data asynchronously from nodes
  this.getRealBlockHeightAndPrevHash(activeChain).then(realData => {
    const unavailableText = isEn ? "Unavailable" : "Indisponível";

    const heightValEl = container.querySelector("#b2-diag-height-val");
    const prevHashEl = container.querySelector("#b2-diag-prev-hash");
    const consensusValEl = container.querySelector("#b2-diag-consensus-val");
    const timeValEl = container.querySelector("#b2-diag-time-val");
    const nodesValEl = container.querySelector("#b2-diag-nodes-val");
    const feeValEl = container.querySelector("#b2-diag-fee-val");
    const healthValEl = container.querySelector("#b2-diag-health-val");

    const clearShimmer = (el) => {
      if (el) {
        el.classList.remove("b2-telemetry-loading");
        el.style.width = "auto";
        el.style.height = "auto";
        el.style.background = "none";
        el.style.animation = "none";
      }
    };

    if (!realData) {
      updateWithUnavailable();
      return;
    }

    // Height
    if (heightValEl && document.body.contains(heightValEl)) {
      clearShimmer(heightValEl);
      if (realData.height !== null && realData.height !== undefined) {
        heightValEl.innerText = realData.height.toLocaleString();
      } else {
        heightValEl.innerText = unavailableText;
      }
    }

    // Prev Hash
    if (prevHashEl && document.body.contains(prevHashEl)) {
      clearShimmer(prevHashEl);
      if (realData.prevHash) {
        const truncatedPrevHash = realData.prevHash.length > 14
          ? realData.prevHash.substring(0, 10) + "..." + realData.prevHash.substring(realData.prevHash.length - 4)
          : realData.prevHash;
        prevHashEl.innerText = truncatedPrevHash;
        const parentCard = prevHashEl.closest(".b2-diag-card");
        if (parentCard) {
          parentCard.title = realData.prevHash;
        }
      } else {
        prevHashEl.innerText = unavailableText;
      }
    }

    // Consensus / Node Version
    if (consensusValEl && document.body.contains(consensusValEl)) {
      clearShimmer(consensusValEl);
      consensusValEl.innerText = realData.consensus || unavailableText;
    }

    // Active Nodes
    if (nodesValEl && document.body.contains(nodesValEl)) {
      clearShimmer(nodesValEl);
      nodesValEl.innerText = realData.nodeCount || unavailableText;
    }

    // Base Tx Fee
    if (feeValEl && document.body.contains(feeValEl)) {
      clearShimmer(feeValEl);
      feeValEl.innerText = realData.baseFee || unavailableText;
    }

    // Health
    if (healthValEl && document.body.contains(healthValEl)) {
      clearShimmer(healthValEl);
      healthValEl.innerText = realData.health || unavailableText;
      if (realData.healthColor) {
        healthValEl.style.color = realData.healthColor;
      }
    }

    // Block Time / Block Age (with live ticking!)
    if (timeValEl && document.body.contains(timeValEl)) {
      clearShimmer(timeValEl);
      if (realData.timestamp) {
        const updateAge = () => {
          const age = Math.max(0, Math.floor(Date.now() / 1000) - realData.timestamp);
          timeValEl.innerText = isEn ? `${age}s ago` : `${age}s atrás`;
        };
        updateAge();

        if (window.b2BlockAgeInterval) {
          clearInterval(window.b2BlockAgeInterval);
        }
        window.b2BlockAgeInterval = setInterval(() => {
          if (!document.getElementById("custom-blockchain-feature-card") || !document.body.contains(timeValEl)) {
            clearInterval(window.b2BlockAgeInterval);
            return;
          }
          updateAge();
        }, 1000);
      } else if (realData.blockTime) {
        timeValEl.innerText = realData.blockTime;
      } else {
        timeValEl.innerText = unavailableText;
      }
    }
  }).catch(err => {
    console.warn("[Diagnostics] Live fetch failed:", err);
    updateWithUnavailable();
  });
};

/**
 * Desenha uma mini-onda de tendência (Sparkline) em tempo real usando canvas 2D.
 */
UIRenderer.prototype.drawSparkline = function (canvas, chain, isProfit) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const seed = chain.symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const points = [];
  for (let i = 0; i <= 8; i++) {
    const noise = Math.sin(seed + i * 1.5) * 0.4 + Math.cos(seed * 0.7 + i * 0.8) * 0.2;
    const y = h / 2 + noise * (h / 3);
    points.push({ x: (w / 8) * i, y });
  }

  // Gradiente abaixo da linha
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  const color = isProfit ? "rgba(16, 185, 129, " : "rgba(239, 68, 68, ";
  grad.addColorStop(0, color + "0.15)");
  grad.addColorStop(1, color + "0.0)");

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const xc = (points[i].x + points[i - 1].x) / 2;
    const yc = (points[i].y + points[i - 1].y) / 2;
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Desenha la linha de tendência
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const xc = (points[i].x + points[i - 1].x) / 2;
    const yc = (points[i].y + points[i - 1].y) / 2;
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
  }
  ctx.strokeStyle = isProfit ? "#10b981" : "#ef4444";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
};

/**
 * Desenha o gráfico de alocação de portfólio (Donut Chart) na dashboard principal.
 */
UIRenderer.prototype.drawPortfolioChart = function (blockchains) {
  const canvas = document.getElementById("portfolio-canvas");
  const legends = document.getElementById("portfolio-legends");
  if (!canvas || !legends) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Filtra moedas com saldo real ativo
  const activeAssets = blockchains
    .filter(chain => chain.balanceFiat > 0)
    .sort((a, b) => b.balanceFiat - a.balanceFiat);

  const totalFiat = activeAssets.reduce((acc, chain) => acc + chain.balanceFiat, 0);

  legends.innerHTML = "";

  if (totalFiat === 0) {
    // Donut vazio (Sem saldo)
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 10, 0, 2 * Math.PI);
    ctx.strokeStyle = (document.documentElement.getAttribute("data-theme") === "light") ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.font = "bold 9px var(--font-tech)";
    ctx.fillStyle = "var(--text-muted)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SEM SALDO", w / 2, h / 2);

    const emptyDiv = document.createElement("div");
    emptyDiv.style.color = "var(--text-muted)";
    emptyDiv.style.textAlign = "center";
    emptyDiv.style.fontSize = "0.7rem";
    emptyDiv.innerText = "Saldos carregando...";
    legends.appendChild(emptyDiv);
    return;
  }

  let startAngle = -Math.PI / 2;
  const radius = w / 2 - 10;

  activeAssets.forEach(chain => {
    const percentage = chain.balanceFiat / totalFiat;
    const sliceAngle = percentage * 2 * Math.PI;

    // Desenha arco correspondente
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, startAngle, startAngle + sliceAngle);
    ctx.strokeStyle = chain.color || "#8b5cf6";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.stroke();

    startAngle += sliceAngle;

    // Cria elemento de legenda para a UI lateral
    const legendItem = document.createElement("div");
    legendItem.style.display = "flex";
    legendItem.style.alignItems = "center";
    legendItem.style.gap = "6px";
    legendItem.style.justifyContent = "space-between";
    legendItem.style.width = "100%";

    const leftPart = document.createElement("div");
    leftPart.style.display = "flex";
    leftPart.style.alignItems = "center";
    leftPart.style.gap = "6px";

    const dot = document.createElement("div");
    dot.style.width = "8px";
    dot.style.height = "8px";
    dot.style.borderRadius = "50%";
    dot.style.background = chain.color || "#8b5cf6";

    const label = document.createElement("span");
    label.style.fontWeight = "700";
    label.innerText = chain.symbol;

    leftPart.appendChild(dot);
    leftPart.appendChild(label);

    const percentLabel = document.createElement("span");
    percentLabel.style.color = "var(--text-secondary)";
    percentLabel.innerText = `${(percentage * 100).toFixed(1)}%`;

    legendItem.appendChild(leftPart);
    legendItem.appendChild(percentLabel);
    legends.appendChild(legendItem);
  });

  // Texto de Ativos no centro do donut
  ctx.font = "bold 9px var(--font-tech)";
  ctx.fillStyle = "var(--text-secondary)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ATIVOS", w / 2, h / 2 - 6);

  ctx.font = "bold 11px var(--font-tech)";
  ctx.fillStyle = "var(--text-primary)";
  ctx.fillText(`${activeAssets.length} REDES`, w / 2, h / 2 + 8);
};

/**
 * Renderiza a lista de endereços derivados para todas as 28 blockchains configuradas.
 */
UIRenderer.prototype.renderAddressesDirectory = function (blockchains, derivedKeys) {
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
UIRenderer.prototype.renderNFTsGaller = function (activeKey) {
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

  // NFTs são obtidos via discovery do nó/registry; não usamos mocks nem cards de mint localmente.

  mintCard.addEventListener('click', () => {
    if (window.B2App) {
      window.B2App.mintSandboxNFT(activeKey);
    }
  });

  container.appendChild(mintCard);

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

/**
 * Renderiza um painel premium dedicado para os recursos da TRON (Bandwidth e Energy)
 * e controles completos de Stake 2.0.
 */
UIRenderer.prototype.renderTronResourcesCard = function (container, activeChain, isEn) {
  const currentLang = isEn ? 'en' : 'pt';

  const labels = {
    pt: {
      title: "Recursos TRON & Stake 2.0",
      bandwidth: "Largura de Banda (Bandwidth)",
      energy: "Energia (Energy)",
      stakedTrx: "TRX em Stake",
      available: "Disponível",
      staked: "Stake",
      free: "Grátis",
      max: "Máximo",
      freezeAction: "Congelar (Stake)",
      unfreezeAction: "Descongelar (Unstake)",
      resourceType: "Tipo de Recurso",
      amountToFreeze: "Quantidade de TRX",
      placeholderAmount: "Quantidade (ex: 100)",
      maxBtn: "MÁX",
      btnConfirmFreeze: "Executar Stake",
      btnConfirmUnfreeze: "Executar Unstake",
      withdrawTitle: "Retiradas Pendentes",
      withdrawDesc: "Você possui tokens descongelados prontos para resgate.",
      btnWithdraw: "Resgatar TRX",
      slotsTitle: "Slots de Descongelamento",
      slotsUsed: "Slots Usados",
      loading: "Carregando...",
      successStake: "Stake realizado com sucesso!",
      successUnstake: "Unstake realizado com sucesso!",
      successWithdraw: "Resgate de TRX realizado com sucesso!",
      errorAction: "Erro ao executar ação:",
      bwDesc: "Necessária para todas as transações de TRX e tokens.",
      egDesc: "Necessária para execução de smart contracts (TRC20)."
    },
    en: {
      title: "TRON Resources & Stake 2.0",
      bandwidth: "Bandwidth Points",
      energy: "Energy Points",
      stakedTrx: "Staked TRX",
      available: "Available",
      staked: "Staked",
      free: "Free",
      max: "Max",
      freezeAction: "Freeze (Stake)",
      unfreezeAction: "Unfreeze (Unstake)",
      resourceType: "Resource Type",
      amountToFreeze: "TRX Amount",
      placeholderAmount: "Amount (e.g. 100)",
      maxBtn: "MAX",
      btnConfirmFreeze: "Execute Stake",
      btnConfirmUnfreeze: "Execute Unstake",
      withdrawTitle: "Pending Withdrawals",
      withdrawDesc: "You have unfrozen tokens ready to be withdrawn.",
      btnWithdraw: "Withdraw TRX",
      slotsTitle: "Unfreeze Slots",
      slotsUsed: "Slots Used",
      loading: "Loading...",
      successStake: "Stake executed successfully!",
      successUnstake: "Unstake executed successfully!",
      successWithdraw: "TRX withdrawal executed successfully!",
      errorAction: "Error executing action:",
      bwDesc: "Required for all TRX and token transactions.",
      egDesc: "Required for executing smart contracts (TRC20)."
    }
  };

  const t = labels[currentLang];

  const r = activeChain.resources || {
    bandwidth: { freeLimit: 0, freeUsed: 0, freeAvailable: 0, stakedLimit: 0, stakedUsed: 0, stakedAvailable: 0, totalAvailable: 0 },
    energy: { limit: 0, used: 0, available: 0 },
    stakedTRX: { bandwidth: 0, energy: 0 }
  };

  const totalBw = r.bandwidth.freeLimit + r.bandwidth.stakedLimit;
  const totalBwAvailable = r.bandwidth.freeAvailable + r.bandwidth.stakedAvailable;
  const bwPercentage = totalBw > 0 ? (totalBwAvailable / totalBw) * 100 : 0;

  const totalEg = r.energy.limit;
  const totalEgAvailable = r.energy.available;
  const egPercentage = totalEg > 0 ? (totalEgAvailable / totalEg) * 100 : 0;

  container.innerHTML = `
      <style>
        #custom-blockchain-feature-card {
          padding: 18px !important;
          background: rgba(10, 15, 28, 0.45);
          border: 1px solid rgba(236, 9, 44, 0.15) !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), inset 0 0 16px rgba(236, 9, 44, 0.05) !important;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: unset !important;
        }
        .b2-tron-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 10px;
        }
        .b2-tron-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
          text-shadow: 0 0 12px rgba(236, 9, 44, 0.3);
        }
        .b2-tron-badge {
          font-size: 0.625rem;
          font-weight: 700;
          background: rgba(236, 9, 44, 0.1);
          border: 1px solid rgba(236, 9, 44, 0.25);
          color: #ec092c;
          padding: 4px 8px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .b2-tron-main-tab-btn.active {
          background: rgba(236, 9, 44, 0.15);
          color: #fff !important;
          border: 1px solid rgba(236, 9, 44, 0.3) !important;
          text-shadow: 0 0 8px rgba(236, 9, 44, 0.4);
        }
        .b2-tron-resources-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 480px) {
          .b2-tron-resources-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .b2-tron-res-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: var(--radius-md);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          backdrop-filter: blur(10px);
          transition: all 0.25s ease;
        }
        .b2-tron-res-card:hover {
          border-color: rgba(236, 9, 44, 0.25);
          background: rgba(255, 255, 255, 0.04);
        }
        .b2-tron-res-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .b2-tron-res-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .b2-tron-res-value {
          font-family: var(--font-tech), monospace;
          font-size: 0.75rem;
          font-weight: 700;
          color: #fff;
        }
        .b2-tron-progress-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-full);
          overflow: hidden;
          position: relative;
        }
        .b2-tron-progress-bar {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .b2-tron-progress-bw {
          background: linear-gradient(90deg, #ec092c, #f43f5e);
          box-shadow: 0 0 8px rgba(236, 9, 44, 0.4);
        }
        .b2-tron-progress-eg {
          background: linear-gradient(90deg, #f97316, #fb923c);
          box-shadow: 0 0 8px rgba(249, 115, 22, 0.4);
        }
        .b2-tron-res-desc {
          font-size: 0.6rem;
          color: var(--text-muted);
          line-height: 1.3;
        }
        .b2-tron-res-details {
          display: flex;
          justify-content: space-between;
          font-size: 0.625rem;
          color: var(--text-muted);
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          padding-top: 6px;
          margin-top: 2px;
        }
        .b2-tron-staked-summary {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.7rem;
        }
        .b2-tron-staked-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .b2-tron-staked-title {
          color: var(--text-muted);
          font-size: 0.58rem;
          text-transform: uppercase;
          font-weight: 600;
        }
        .b2-tron-staked-val {
          font-family: var(--font-tech), monospace;
          font-weight: 700;
          color: #fff;
        }
        .b2-tron-stake-section {
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: var(--radius-md);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .b2-tron-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.2);
          padding: 2px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.03);
        }
        .b2-tron-tab-btn {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 0.65rem;
          font-weight: bold;
          padding: 6px;
          border-radius: calc(var(--radius-sm) - 1px);
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
        }
        .b2-tron-tab-btn.active {
          background: rgba(236, 9, 44, 0.12);
          color: #fff;
          border: 1px solid rgba(236, 9, 44, 0.25);
          text-shadow: 0 0 8px rgba(236, 9, 44, 0.35);
        }
        .b2-tron-form-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .b2-tron-form-label {
          font-size: 0.58rem;
          font-weight: bold;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        .b2-tron-select-container {
          position: relative;
          display: flex;
        }
        .b2-tron-select {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-sm);
          color: #fff;
          font-size: 0.7rem;
          padding: 8px 10px;
          cursor: pointer;
          appearance: none;
          outline: none;
          transition: all 0.2s ease;
        }
        .b2-tron-select:focus {
          border-color: rgba(236, 9, 44, 0.4);
          box-shadow: 0 0 8px rgba(236, 9, 44, 0.1);
        }
        .b2-tron-select-container::after {
          content: '▼';
          font-size: 0.5rem;
          color: var(--text-muted);
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }
        .b2-tron-input-group {
          display: flex;
          position: relative;
        }
        .b2-tron-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-sm);
          color: #fff;
          font-family: var(--font-tech), monospace;
          font-size: 0.72rem;
          padding: 8px 50px 8px 10px;
          outline: none;
          transition: all 0.2s ease;
        }
        .b2-tron-input:focus {
          border-color: rgba(236, 9, 44, 0.4);
          box-shadow: 0 0 8px rgba(236, 9, 44, 0.1);
        }
        .b2-tron-max-btn {
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(236, 9, 44, 0.15);
          border: 1px solid rgba(236, 9, 44, 0.3);
          color: #ec092c;
          font-size: 0.58rem;
          font-weight: bold;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .b2-tron-max-btn:hover {
          background: rgba(236, 9, 44, 0.25);
          box-shadow: 0 0 6px rgba(236, 9, 44, 0.2);
        }
        .b2-tron-submit-btn {
          width: 100%;
          background: linear-gradient(90deg, rgba(236, 9, 44, 0.8) 0%, rgba(190, 6, 30, 0.8) 100%);
          border: 1px solid rgba(236, 9, 44, 0.3);
          color: #fff;
          font-size: 0.72rem;
          font-weight: bold;
          padding: 9px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .b2-tron-submit-btn:hover {
          background: linear-gradient(90deg, rgba(236, 9, 44, 1) 0%, rgba(190, 6, 30, 1) 100%);
          box-shadow: 0 0 12px rgba(236, 9, 44, 0.4);
          transform: translateY(-1px);
        }
        .b2-tron-submit-btn:active {
          transform: translateY(0);
        }
        .b2-tron-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .b2-tron-withdraw-banner {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          animation: b2-fade-in 0.3s ease;
        }
        .b2-tron-withdraw-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .b2-tron-withdraw-title {
          font-size: 0.68rem;
          font-weight: bold;
          color: #10b981;
        }
        .b2-tron-withdraw-desc {
          font-size: 0.58rem;
          color: var(--text-muted);
          line-height: 1.2;
        }
        .b2-tron-withdraw-btn {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          font-size: 0.625rem;
          font-weight: bold;
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .b2-tron-withdraw-btn:hover {
          background: rgba(16, 185, 129, 0.25);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
        }
        .b2-tron-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 75%);
          background-size: 200% 100%;
          animation: b2-shimmer-local 1.5s infinite linear;
          border-radius: var(--radius-sm);
          color: transparent !important;
        }
        .b2-tron-spin {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: b2-spin-local 0.6s linear infinite;
          display: none;
        }
        @keyframes b2-spin-local {
          to { transform: rotate(360deg); }
        }
        @keyframes b2-shimmer-local {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes b2-fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>

      <!-- Header area -->
      <div class="b2-tron-header" style="border-bottom: none; padding-bottom: 0;">
        <div class="b2-tron-title">
          <span>🔴</span> ${t.title}
        </div>
        <div class="b2-tron-badge">Stake 2.0</div>
      </div>

      <!-- Main Sub-tabs (Recursos vs Diagnóstico) -->
      <div class="b2-tron-main-tabs" style="display: flex; background: rgba(0, 0, 0, 0.25); padding: 3px; border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.04); margin-bottom: 8px;">
        <button class="b2-tron-main-tab-btn active" id="b2-tron-subtab-resources" style="flex: 1; background: none; border: none; color: var(--text-muted); font-size: 0.7rem; font-weight: bold; padding: 8px; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s ease; text-transform: uppercase;">
          ${isEn ? "Resources" : "Recursos"}
        </button>
        <button class="b2-tron-main-tab-btn" id="b2-tron-subtab-diag" style="flex: 1; background: none; border: none; color: var(--text-muted); font-size: 0.7rem; font-weight: bold; padding: 8px; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s ease; text-transform: uppercase;">
          ${isEn ? "Diagnostics" : "Diagnóstico"}
        </button>
      </div>

      <!-- Tab: Resources content -->
      <div id="tron-resources-tab-content" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Active resources indicators -->
        <div class="b2-tron-resources-grid">
          <!-- Bandwidth Card -->
          <div class="b2-tron-res-card">
            <div class="b2-tron-res-header">
              <span class="b2-tron-res-label">⚡ ${t.bandwidth}</span>
              <span class="b2-tron-res-value b2-tron-shimmer" id="b2-tron-bw-val">... / ... BP</span>
            </div>
            <div class="b2-tron-progress-track">
              <div class="b2-tron-progress-bar b2-tron-progress-bw" id="b2-tron-bw-bar" style="width: ${bwPercentage}%;"></div>
            </div>
            <div class="b2-tron-res-desc">${t.bwDesc}</div>
            <div class="b2-tron-res-details">
              <span id="b2-tron-bw-free">${t.free}: ... BP</span>
              <span id="b2-tron-bw-staked">${t.staked}: ... BP</span>
            </div>
          </div>

          <!-- Energy Card -->
          <div class="b2-tron-res-card">
            <div class="b2-tron-res-header">
              <span class="b2-tron-res-label">🔥 ${t.energy}</span>
              <span class="b2-tron-res-value b2-tron-shimmer" id="b2-tron-eg-val">... / ... EP</span>
            </div>
            <div class="b2-tron-progress-track">
              <div class="b2-tron-progress-bar b2-tron-progress-eg" id="b2-tron-eg-bar" style="width: ${egPercentage}%;"></div>
            </div>
            <div class="b2-tron-res-desc">${t.egDesc}</div>
            <div class="b2-tron-res-details">
              <span>&nbsp;</span>
              <span id="b2-tron-eg-staked">${t.staked}: ... EP</span>
            </div>
          </div>
        </div>

        <!-- Staked TRX Breakdown -->
        <div class="b2-tron-staked-summary">
          <div class="b2-tron-staked-item">
            <span class="b2-tron-staked-title">${t.stakedTrx} (Bandwidth)</span>
            <span class="b2-tron-staked-val" id="b2-tron-staked-bw">${r.stakedTRX.bandwidth.toFixed(2)} TRX</span>
          </div>
          <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.06);"></div>
          <div class="b2-tron-staked-item">
            <span class="b2-tron-staked-title">${t.stakedTrx} (Energy)</span>
            <span class="b2-tron-staked-val" id="b2-tron-staked-eg">${r.stakedTRX.energy.toFixed(2)} TRX</span>
          </div>
          <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.06); display: none;" id="b2-tron-slots-divider"></div>
          <div class="b2-tron-staked-item" style="display: none;" id="b2-tron-slots-item">
            <span class="b2-tron-staked-title">${t.slotsTitle}</span>
            <span class="b2-tron-staked-val" id="b2-tron-slots-val">0 / 32</span>
          </div>
        </div>

        <!-- Pending withdraw banner -->
        <div class="b2-tron-withdraw-banner" id="b2-tron-withdraw-banner" style="display: none;">
          <div class="b2-tron-withdraw-info">
            <span class="b2-tron-withdraw-title">📥 ${t.withdrawTitle}</span>
            <span class="b2-tron-withdraw-desc" id="b2-tron-withdraw-desc">${t.withdrawDesc}</span>
          </div>
          <button class="b2-tron-withdraw-btn" id="b2-tron-withdraw-btn">${t.btnWithdraw}</button>
        </div>

        <!-- Stake/Unstake Form -->
        <div class="b2-tron-stake-section">
          <div class="b2-tron-tabs">
            <button class="b2-tron-tab-btn active" id="b2-tron-tab-freeze">${t.freezeAction}</button>
            <button class="b2-tron-tab-btn" id="b2-tron-tab-unfreeze">${t.unfreezeAction}</button>
          </div>

          <!-- Resource Selector -->
          <div class="b2-tron-form-row">
            <span class="b2-tron-form-label">${t.resourceType}</span>
            <div class="b2-tron-select-container">
              <select class="b2-tron-select" id="b2-tron-form-resource">
                <option value="BANDWIDTH">${isEn ? "Bandwidth Points" : "Largura de Banda"}</option>
                <option value="ENERGY">${isEn ? "Energy Points" : "Energia"}</option>
              </select>
            </div>
          </div>

          <!-- Amount input -->
          <div class="b2-tron-form-row">
            <span class="b2-tron-form-label">${t.amountToFreeze}</span>
            <div class="b2-tron-input-group">
              <input type="number" class="b2-tron-input" id="b2-tron-form-amount" placeholder="${t.placeholderAmount}" min="1" step="any">
              <button class="b2-tron-max-btn" id="b2-tron-form-max">${t.maxBtn}</button>
            </div>
          </div>

          <!-- Action Button -->
          <button class="b2-tron-submit-btn" id="b2-tron-form-submit">
            <span class="b2-tron-spin" id="b2-tron-form-spin"></span>
            <span id="b2-tron-form-btn-text">${t.btnConfirmFreeze}</span>
          </button>
        </div>
      </div>

      <!-- Tab: Diagnostics content -->
      <div id="tron-diagnostics-tab-content" style="display: none; flex-direction: column; gap: 16px;">
        <div class="b2-diag-grid" style="margin-top: 8px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          <!-- Altura do Bloco -->
          <div class="b2-diag-card">
            <div class="b2-diag-card-header">
              <span class="b2-diag-card-icon">🧱</span>
              <span class="b2-diag-card-label">${isEn ? "Block Height" : "Altura do Bloco"}</span>
            </div>
            <div class="b2-diag-card-value b2-diag-card-tech">
              <span id="b2-tron-diag-height-val" class="b2-telemetry-loading" style="width: 100px;"></span>
            </div>
          </div>

          <!-- Bloco Anterior -->
          <div class="b2-diag-card">
            <div class="b2-diag-card-header">
              <span class="b2-diag-card-icon">🔗</span>
              <span class="b2-diag-card-label">${isEn ? "Previous Block" : "Bloco Anterior"}</span>
            </div>
            <div class="b2-diag-card-value b2-diag-card-tech" style="font-size: 0.625rem; font-family: monospace;">
              <span id="b2-tron-diag-prev-hash" class="b2-telemetry-loading" style="width: 140px;"></span>
            </div>
          </div>

          <!-- Consenso -->
          <div class="b2-diag-card">
            <div class="b2-diag-card-header">
              <span class="b2-diag-card-icon">🤝</span>
              <span class="b2-diag-card-label">${isEn ? "Consensus" : "Consenso da Rede"}</span>
            </div>
            <div class="b2-diag-card-value" style="font-size: 0.68rem; color: var(--text-secondary);">
              <span id="b2-tron-diag-consensus-val" class="b2-telemetry-loading" style="width: 110px;"></span>
            </div>
          </div>

          <!-- Tempo de Bloco -->
          <div class="b2-diag-card">
            <div class="b2-diag-card-header">
              <span class="b2-diag-card-icon">⏱️</span>
              <span class="b2-diag-card-label">${isEn ? "Avg Block Time" : "Tempo de Bloco"}</span>
            </div>
            <div class="b2-diag-card-value b2-diag-card-tech">
              <span id="b2-tron-diag-time-val" class="b2-telemetry-loading" style="width: 60px;"></span>
            </div>
          </div>

          <!-- Nós Ativos -->
          <div class="b2-diag-card">
            <div class="b2-diag-card-header">
              <span class="b2-diag-card-icon">🖥️</span>
              <span class="b2-diag-card-label">${isEn ? "Active Nodes" : "Total de Nós"}</span>
            </div>
            <div class="b2-diag-card-value b2-diag-card-tech">
              <span id="b2-tron-diag-nodes-val" class="b2-telemetry-loading" style="width: 80px;"></span>
            </div>
          </div>

          <!-- Taxas / Gas -->
          <div class="b2-diag-card">
            <div class="b2-diag-card-header">
              <span class="b2-diag-card-icon">⛽</span>
              <span class="b2-diag-card-label">${isEn ? "Base Tx Fee" : "Taxa Transação"}</span>
            </div>
            <div class="b2-diag-card-value b2-diag-card-tech">
              <span id="b2-tron-diag-fee-val" class="b2-telemetry-loading" style="width: 90px;"></span>
            </div>
          </div>

          <!-- Saúde da Rede -->
          <div class="b2-diag-card" style="grid-column: span 2;">
            <div class="b2-diag-card-header" style="justify-content: space-between;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="b2-diag-card-icon">❤️</span>
                <span class="b2-diag-card-label">${isEn ? "Network Health" : "Saúde da Rede"}</span>
              </div>
              <span id="b2-tron-diag-health-val" style="font-size: 0.65rem; font-weight: bold; color: var(--text-secondary);">
                <span class="b2-telemetry-loading" style="width: 80px; height: 10px;"></span>
              </span>
            </div>
            <div class="b2-diag-card-value" style="font-size: 0.65rem; font-family: monospace; color: var(--text-muted); margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 4px;">
              <span style="color:var(--text-secondary); font-weight:bold;">URL:</span> ${activeChain.nodeUrl ? activeChain.nodeUrl : "https://tron-rpc.publicnode.com"}
            </div>
          </div>
        </div>

        <button class="b2-diag-ping-btn" id="b2-tron-diag-ping-btn" style="width: 100%; background: linear-gradient(90deg, rgba(236, 9, 44, 0.08) 0%, rgba(236, 9, 44, 0.02) 100%); border: 1px solid rgba(236, 9, 44, 0.2); color: var(--text-primary); font-size: 0.72rem; font-weight: bold; padding: 9px; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 6px; letter-spacing: 0.3px; text-transform: uppercase;">
          <span class="b2-diag-ping-loader" id="b2-tron-diag-ping-loader" style="width: 10px; height: 10px; border: 2px solid rgba(255,255,255,0.2); border-top-color: var(--text-primary); border-radius: 50%; animation: b2-diag-spin 0.6s linear infinite; display: none;"></span>
          <span id="b2-tron-diag-ping-text">⚡ ${isEn ? "Test Node Latency" : "Testar Latência do Nó"}</span>
        </button>
      </div>
    `;

  // UI elements pointers
  const tabFreeze = container.querySelector("#b2-tron-tab-freeze");
  const tabUnfreeze = container.querySelector("#b2-tron-tab-unfreeze");
  const resourceSelect = container.querySelector("#b2-tron-form-resource");
  const amountInput = container.querySelector("#b2-tron-form-amount");
  const maxBtn = container.querySelector("#b2-tron-form-max");
  const submitBtn = container.querySelector("#b2-tron-form-submit");
  const btnText = container.querySelector("#b2-tron-form-btn-text");
  const spin = container.querySelector("#b2-tron-form-spin");

  const withdrawBanner = container.querySelector("#b2-tron-withdraw-banner");
  const withdrawBtn = container.querySelector("#b2-tron-withdraw-btn");
  const withdrawDesc = container.querySelector("#b2-tron-withdraw-desc");

  const slotsDivider = container.querySelector("#b2-tron-slots-divider");
  const slotsItem = container.querySelector("#b2-tron-slots-item");
  const slotsVal = container.querySelector("#b2-tron-slots-val");

  let activeAction = "FREEZE"; // "FREEZE" or "UNFREEZE"

  // Bind tabs interactivity
  if (tabFreeze && tabUnfreeze) {
    tabFreeze.addEventListener("click", () => {
      activeAction = "FREEZE";
      tabFreeze.classList.add("active");
      tabUnfreeze.classList.remove("active");
      btnText.innerText = t.btnConfirmFreeze;
      amountInput.value = "";
    });

    tabUnfreeze.addEventListener("click", () => {
      activeAction = "UNFREEZE";
      tabUnfreeze.classList.add("active");
      tabFreeze.classList.remove("active");
      btnText.innerText = t.btnConfirmUnfreeze;
      amountInput.value = "";
    });
  }

  // Bind Max Button calculation
  if (maxBtn) {
    maxBtn.addEventListener("click", () => {
      if (activeAction === "FREEZE") {
        const balance = activeChain.balanceCrypto || 0;
        const maxStake = Math.max(0, balance - 5.0);
        amountInput.value = maxStake > 0 ? maxStake.toFixed(6) : "0";
      } else {
        const resource = resourceSelect.value;
        const stakedAmount = resource === "BANDWIDTH" ? r.stakedTRX.bandwidth : r.stakedTRX.energy;
        amountInput.value = stakedAmount > 0 ? stakedAmount.toFixed(6) : "0";
      }
    });
  }

  // Bind main submit button action
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      const amount = parseFloat(amountInput.value);
      if (isNaN(amount) || amount <= 0) {
        window.showToast && window.showToast(isEn ? "Please enter a valid amount." : "Por favor, insira uma quantidade válida.", "error");
        return;
      }

      const resource = resourceSelect.value;
      submitBtn.disabled = true;
      if (spin) spin.style.display = "inline-block";
      if (btnText) btnText.innerText = t.loading;

      try {
        let txId = "";
        if (activeAction === "FREEZE") {
          txId = await window.B2App.stakeTron(amount, resource);
          window.showToast && window.showToast(`${t.successStake} TX: ${txId.substring(0, 10)}...`, "success");
        } else {
          txId = await window.B2App.unstakeTron(amount, resource);
          window.showToast && window.showToast(`${t.successUnstake} TX: ${txId.substring(0, 10)}...`, "success");
        }
        amountInput.value = "";
      } catch (err) {
        console.error("[TRON Dashboard] Stake operation error:", err);
        window.showToast && window.showToast(`${t.errorAction} ${err.message}`, "error");
      } finally {
        submitBtn.disabled = false;
        if (spin) spin.style.display = "none";
        if (btnText) btnText.innerText = activeAction === "FREEZE" ? t.btnConfirmFreeze : t.btnConfirmUnfreeze;
      }
    });
  }

  // Dynamic values updating function
  const updateUI = (freshResources, freshWithdraw, freshUnfreeze) => {
    const bBwVal = container.querySelector("#b2-tron-bw-val");
    const bBwBar = container.querySelector("#b2-tron-bw-bar");
    const bBwFree = container.querySelector("#b2-tron-bw-free");
    const bBwStaked = container.querySelector("#b2-tron-bw-staked");
    const bStakedBw = container.querySelector("#b2-tron-staked-bw");

    if (freshResources) {
      const tBw = freshResources.bandwidth.freeLimit + freshResources.bandwidth.stakedLimit;
      const tBwAv = freshResources.bandwidth.freeAvailable + freshResources.bandwidth.stakedAvailable;
      const pctBw = tBw > 0 ? (tBwAv / tBw) * 100 : 100;

      if (bBwVal) {
        bBwVal.innerText = `${tBwAv.toLocaleString()} / ${tBw.toLocaleString()} BP`;
        bBwVal.classList.remove("b2-tron-shimmer");
      }
      if (bBwBar) bBwBar.style.width = `${pctBw}%`;
      if (bBwFree) bBwFree.innerText = `${t.free}: ${freshResources.bandwidth.freeAvailable.toLocaleString()} BP`;
      if (bBwStaked) bBwStaked.innerText = `${t.staked}: ${freshResources.bandwidth.stakedAvailable.toLocaleString()} BP`;
      if (bStakedBw) bStakedBw.innerText = `${freshResources.stakedTRX.bandwidth.toFixed(2)} TRX`;

      const bEgVal = container.querySelector("#b2-tron-eg-val");
      const bEgBar = container.querySelector("#b2-tron-eg-bar");
      const bEgStaked = container.querySelector("#b2-tron-eg-staked");
      const bStakedEg = container.querySelector("#b2-tron-staked-eg");

      const tEg = freshResources.energy.limit;
      const tEgAv = freshResources.energy.available;
      const pctEg = tEg > 0 ? (tEgAv / tEg) * 100 : 0;

      if (bEgVal) {
        bEgVal.innerText = `${tEgAv.toLocaleString()} / ${tEg.toLocaleString()} EP`;
        bEgVal.classList.remove("b2-tron-shimmer");
      }
      if (bEgBar) bEgBar.style.width = `${pctEg}%`;
      if (bEgStaked) bEgStaked.innerText = `${t.staked}: ${tEgAv.toLocaleString()} EP`;
      if (bStakedEg) bStakedEg.innerText = `${freshResources.stakedTRX.energy.toFixed(2)} TRX`;

      r.stakedTRX = freshResources.stakedTRX;
    }

    if (freshUnfreeze !== undefined && freshUnfreeze !== null) {
      if (slotsDivider) slotsDivider.style.display = "block";
      if (slotsItem) slotsItem.style.display = "flex";
      if (slotsVal) slotsVal.innerText = `${freshUnfreeze} / 32`;
    }

    if (freshWithdraw && freshWithdraw > 0) {
      if (withdrawBanner) {
        withdrawBanner.style.display = "flex";
        if (withdrawDesc) {
          withdrawDesc.innerText = isEn
            ? `You have ${freshWithdraw.toFixed(6)} TRX ready to be withdrawn.`
            : `Você possui ${freshWithdraw.toFixed(6)} TRX prontos para resgate.`;
        }
      }
    } else {
      if (withdrawBanner) withdrawBanner.style.display = "none";
    }
  };

  // Bind Withdraw Action Button
  if (withdrawBtn) {
    withdrawBtn.addEventListener("click", async () => {
      withdrawBtn.disabled = true;
      try {
        const txId = await window.B2App.withdrawExpireUnfreezeTron();
        window.showToast && window.showToast(`${t.successWithdraw} TX: ${txId.substring(0, 10)}...`, "success");
        if (withdrawBanner) withdrawBanner.style.display = "none";
      } catch (err) {
        console.error("[TRON Dashboard] Withdraw operation error:", err);
        window.showToast && window.showToast(`${t.errorAction} ${err.message}`, "error");
      } finally {
        withdrawBtn.disabled = false;
      }
    });
  }

  // Bind main sub-tabs (Resources vs Diagnostics)
  const subtabResources = container.querySelector("#b2-tron-subtab-resources");
  const subtabDiag = container.querySelector("#b2-tron-subtab-diag");
  const resourcesContent = container.querySelector("#tron-resources-tab-content");
  const diagnosticsContent = container.querySelector("#tron-diagnostics-tab-content");

  if (subtabResources && subtabDiag && resourcesContent && diagnosticsContent) {
    subtabResources.addEventListener("click", () => {
      subtabResources.classList.add("active");
      subtabDiag.classList.remove("active");
      resourcesContent.style.display = "flex";
      diagnosticsContent.style.display = "none";
    });

    subtabDiag.addEventListener("click", () => {
      subtabDiag.classList.add("active");
      subtabResources.classList.remove("active");
      resourcesContent.style.display = "none";
      diagnosticsContent.style.display = "flex";
    });
  }

  // Bind TRON diagnostic ping interactivity
  const tronPingBtn = container.querySelector("#b2-tron-diag-ping-btn");
  const tronPingLoader = container.querySelector("#b2-tron-diag-ping-loader");
  const tronPingText = container.querySelector("#b2-tron-diag-ping-text");

  if (tronPingBtn) {
    tronPingBtn.addEventListener('click', () => {
      tronPingBtn.disabled = true;
      if (tronPingLoader) tronPingLoader.style.display = "inline-block";
      if (tronPingText) tronPingText.innerText = isEn ? "Testing..." : "Testando...";

      const pingStartTime = performance.now();
      fetch(activeChain.nodeUrl, { method: "HEAD", mode: "no-cors" })
        .then(() => {
          const ms = Math.round(performance.now() - pingStartTime);
          tronPingBtn.disabled = false;
          if (tronPingLoader) tronPingLoader.style.display = "none";
          if (tronPingText) tronPingText.innerText = `⚡ ${isEn ? "Test Node Latency" : "Testar Latência do Nó"}`;

          const msg = (isEn ? "Connected with" : "Conectado com") + ` ${activeChain.name} Node in ${ms}ms!`;
          if (window.ToastEngine) {
            window.ToastEngine.show({
              title: isEn ? "Latency Test" : "Teste de Latência",
              message: msg,
              type: "success"
            });
          } else if (window.B2UIRenderer && window.B2UIRenderer.showToast) {
            window.B2UIRenderer.showToast(msg, "success");
          } else if (window.showToast) {
            window.showToast(msg, "success");
          } else {
            alert(msg);
          }
        })
        .catch(() => {
          tronPingBtn.disabled = false;
          if (tronPingLoader) tronPingLoader.style.display = "none";
          if (tronPingText) tronPingText.innerText = `⚡ ${isEn ? "Test Node Latency" : "Testar Latência do Nó"}`;

          const errorMsg = isEn ? "Failed to connect to active node!" : "Falha ao conectar ao nó ativo!";
          if (window.ToastEngine) {
            window.ToastEngine.show({
              title: isEn ? "Latency Test" : "Teste de Latência",
              message: errorMsg,
              type: "error"
            });
          } else {
            alert(errorMsg);
          }
        });
    });
  }

  const updateTronDiagWithUnavailable = () => {
    const unavailableText = isEn ? "Unavailable" : "Indisponível";
    const elements = [
      container.querySelector("#b2-tron-diag-height-val"),
      container.querySelector("#b2-tron-diag-prev-hash"),
      container.querySelector("#b2-tron-diag-consensus-val"),
      container.querySelector("#b2-tron-diag-time-val"),
      container.querySelector("#b2-tron-diag-nodes-val"),
      container.querySelector("#b2-tron-diag-fee-val"),
      container.querySelector("#b2-tron-diag-health-val")
    ];
    elements.forEach(el => {
      if (el && document.body.contains(el)) {
        el.classList.remove("b2-telemetry-loading");
        el.innerText = unavailableText;
        el.style.width = "auto";
        el.style.height = "auto";
        el.style.background = "none";
        el.style.animation = "none";
      }
    });
  };

  const clearShimmer = (el) => {
    if (el) {
      el.classList.remove("b2-telemetry-loading");
      el.style.width = "auto";
      el.style.height = "auto";
      el.style.background = "none";
      el.style.animation = "none";
    }
  };

  this.getRealBlockHeightAndPrevHash(activeChain).then(realData => {
    const unavailableText = isEn ? "Unavailable" : "Indisponível";

    const heightValEl = container.querySelector("#b2-tron-diag-height-val");
    const prevHashEl = container.querySelector("#b2-tron-diag-prev-hash");
    const consensusValEl = container.querySelector("#b2-tron-diag-consensus-val");
    const timeValEl = container.querySelector("#b2-tron-diag-time-val");
    const nodesValEl = container.querySelector("#b2-tron-diag-nodes-val");
    const feeValEl = container.querySelector("#b2-tron-diag-fee-val");
    const healthValEl = container.querySelector("#b2-tron-diag-health-val");

    if (!realData) {
      updateTronDiagWithUnavailable();
      return;
    }

    if (heightValEl && document.body.contains(heightValEl)) {
      clearShimmer(heightValEl);
      if (realData.height !== null && realData.height !== undefined) {
        heightValEl.innerText = realData.height.toLocaleString();
      } else {
        heightValEl.innerText = unavailableText;
      }
    }

    if (prevHashEl && document.body.contains(prevHashEl)) {
      clearShimmer(prevHashEl);
      if (realData.prevHash) {
        const truncatedPrevHash = realData.prevHash.length > 14
          ? realData.prevHash.substring(0, 10) + "..." + realData.prevHash.substring(realData.prevHash.length - 4)
          : realData.prevHash;
        prevHashEl.innerText = truncatedPrevHash;
      } else {
        prevHashEl.innerText = unavailableText;
      }
    }

    if (consensusValEl && document.body.contains(consensusValEl)) {
      clearShimmer(consensusValEl);
      consensusValEl.innerText = realData.consensus || unavailableText;
    }

    if (nodesValEl && document.body.contains(nodesValEl)) {
      clearShimmer(nodesValEl);
      nodesValEl.innerText = realData.nodeCount || unavailableText;
    }

    if (feeValEl && document.body.contains(feeValEl)) {
      clearShimmer(feeValEl);
      feeValEl.innerText = realData.baseFee || unavailableText;
    }

    if (healthValEl && document.body.contains(healthValEl)) {
      clearShimmer(healthValEl);
      healthValEl.innerText = realData.health || unavailableText;
      if (realData.healthColor) {
        healthValEl.style.color = realData.healthColor;
      }
    }

    if (timeValEl && document.body.contains(timeValEl)) {
      clearShimmer(timeValEl);
      if (realData.timestamp) {
        const updateAge = () => {
          const age = Math.max(0, Math.floor(Date.now() / 1000) - realData.timestamp);
          timeValEl.innerText = isEn ? `${age}s ago` : `${age}s atrás`;
        };
        updateAge();

        if (window.b2TronBlockAgeInterval) {
          clearInterval(window.b2TronBlockAgeInterval);
        }
        window.b2TronBlockAgeInterval = setInterval(() => {
          if (!container || !document.body.contains(timeValEl)) {
            clearInterval(window.b2TronBlockAgeInterval);
            return;
          }
          updateAge();
        }, 1000);
      } else if (realData.blockTime) {
        timeValEl.innerText = realData.blockTime;
      } else {
        timeValEl.innerText = unavailableText;
      }
    }
  }).catch(err => {
    console.warn("[TRON Dashboard] Live diagnostics refresh failed:", err);
    updateTronDiagWithUnavailable();
  });

  // 2. Fetch and apply real-time live data asynchronously from public nodes
  const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
  const derived = window.B2App && window.B2App.derivedKeys ? window.B2App.derivedKeys["TRON"] : null;

  if (tronEngine && derived && derived.address) {
    const address = derived.address;
    const nodeUrl = activeChain.nodeUrl;
    const fallbacks = ["https://tron-rpc.publicnode.com", "https://tron.api.subquery.network"];

    const shimmerElements = [
      container.querySelector("#b2-tron-bw-val"),
      container.querySelector("#b2-tron-eg-val")
    ];

    Promise.all([
      tronEngine.getResources(address, nodeUrl, fallbacks),
      tronEngine.getCanWithdrawUnfreeze(address, nodeUrl, fallbacks),
      tronEngine.getAvailableUnfreezeCount(address, nodeUrl, fallbacks)
    ]).then(([freshRes, canWithdraw, slotsCount]) => {
      shimmerElements.forEach(el => el && el.classList.remove("b2-tron-shimmer"));

      activeChain.resources = freshRes;

      const usedSlots = Math.max(0, 32 - slotsCount);

      updateUI(freshRes, canWithdraw, usedSlots);
    }).catch(err => {
      shimmerElements.forEach(el => el && el.classList.remove("b2-tron-shimmer"));
      console.warn("[TRON Dashboard] Live resources refresh failed:", err);
    });
  }
};

UIRenderer.prototype.renderStellarResourcesCard = function (container, activeChain, isEn) {
  const currentLang = isEn ? 'en' : 'pt';
  const labels = {
    pt: {
      title: "Recursos Stellar (XLM)",
      desc: "Verificação de estado da conta Stellar, saldos reclamáveis e trustlines ativos obtidos on-chain.",
      activeState: "Estado de Ativação",
      active: "Conta Ativada",
      inactive: "Conta Inativa (Requer depósito)",
      inactiveDesc: "Sua conta não está ativa na blockchain. É necessário receber pelo menos 1.0 XLM para ativar esta conta e criar trustlines.",
      claimables: "Saldos Reclamáveis",
      claimablesDesc: "Saldos enviados a você que aguardam resgate on-chain.",
      claimablesBtn: "Ver e Reclamar",
      pools: "Pools de Liquidez",
      poolsDesc: "Participação em pools de liquidez ativos.",
      addTrustline: "Adicionar Trustline",
      loading: "Carregando..."
    },
    en: {
      title: "Stellar Resources (XLM)",
      desc: "Stellar account activation state, claimable balances, and active trustlines retrieved on-chain.",
      activeState: "Activation State",
      active: "Account Active",
      inactive: "Account Inactive (Requires deposit)",
      inactiveDesc: "Your account is not active on-chain. You must receive at least 1.0 XLM to activate this account and create trustlines.",
      claimables: "Claimable Balances",
      claimablesDesc: "Balances sent to you waiting to be claimed on-chain.",
      claimablesBtn: "View & Claim",
      pools: "Liquidity Pools",
      poolsDesc: "Participation in active liquidity pools.",
      addTrustline: "Add Trustline",
      loading: "Loading..."
    }
  };

  const l = labels[currentLang];
  const resources = activeChain.resources || {
    claimableBalances: 0,
    liquidityPools: 0,
    activationState: "UNACTIVATED"
  };

  const isActivated = resources.activationState === "ACTIVATED" || activeChain.balanceCrypto >= 1.0;
  const chainColor = activeChain.color || "#0969da";

  const hexToRgb = (hex) => {
    let c = hex.substring(1);
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const num = parseInt(c, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
  };
  const themeRgb = hexToRgb(chainColor);

  container.innerHTML = `
      <style>
        .b2-stellar-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }
        .b2-stellar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 8px;
          margin-bottom: 4px;
        }
        .b2-stellar-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .b2-stellar-status {
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 0.6rem;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-active {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #10b981;
        }
        .status-inactive {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.25);
          color: #f59e0b;
        }
        .b2-stellar-main-tab-btn.active {
          background: rgba(${themeRgb}, 0.15);
          color: #fff !important;
          border: 1px solid rgba(${themeRgb}, 0.3) !important;
          text-shadow: 0 0 8px rgba(${themeRgb}, 0.4);
        }
        .b2-stellar-desc {
          font-size: 0.68rem;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .b2-stellar-warning {
          background: rgba(245, 158, 11, 0.05);
          border: 1px solid rgba(245, 158, 11, 0.15);
          border-radius: var(--radius-md);
          padding: 10px;
          font-size: 0.68rem;
          color: #f59e0b;
          line-height: 1.4;
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }
        .b2-stellar-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .b2-stellar-card {
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: var(--radius-md);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .b2-stellar-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.035);
          border-color: rgba(${themeRgb}, 0.3);
        }
        .b2-stellar-card-title {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .b2-stellar-card-value {
          font-family: var(--font-tech), monospace;
          font-size: 1.1rem;
          font-weight: bold;
          color: var(--text-primary);
        }
        .b2-stellar-card-desc {
          font-size: 0.62rem;
          color: var(--text-muted);
          line-height: 1.3;
        }
        .b2-stellar-action-btn {
          width: 100%;
          background: linear-gradient(90deg, rgba(${themeRgb}, 0.1) 0%, rgba(${themeRgb}, 0.02) 100%);
          border: 1px solid rgba(${themeRgb}, 0.2);
          color: var(--text-primary);
          font-size: 0.68rem;
          font-weight: bold;
          padding: 8px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 4px;
        }
        .b2-stellar-action-btn:hover {
          background: linear-gradient(90deg, rgba(${themeRgb}, 0.18) 0%, rgba(${themeRgb}, 0.05) 100%);
          border-color: rgba(${themeRgb}, 0.4);
          box-shadow: 0 0 10px rgba(${themeRgb}, 0.1);
        }
      </style>

      <div class="b2-stellar-container">
        <div class="b2-stellar-header" style="border-bottom: none; padding-bottom: 0;">
          <div class="b2-stellar-title">
            <span>🚀</span> ${l.title}
          </div>
          <div class="b2-stellar-status ${isActivated ? 'status-active' : 'status-inactive'}">
            ${isActivated ? l.active : l.inactive}
          </div>
        </div>

        <!-- Main Sub-tabs (Trustlines vs Diagnóstico) -->
        <div class="b2-stellar-main-tabs" style="display: flex; background: rgba(0, 0, 0, 0.25); padding: 3px; border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.04); margin-bottom: 8px;">
          <button class="b2-stellar-main-tab-btn active" id="b2-stellar-subtab-resources" style="flex: 1; background: none; border: none; color: var(--text-muted); font-size: 0.7rem; font-weight: bold; padding: 8px; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s ease; text-transform: uppercase;">
            Trustlines
          </button>
          <button class="b2-stellar-main-tab-btn" id="b2-stellar-subtab-diag" style="flex: 1; background: none; border: none; color: var(--text-muted); font-size: 0.7rem; font-weight: bold; padding: 8px; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s ease; text-transform: uppercase;">
            ${isEn ? "Diagnostics" : "Diagnóstico"}
          </button>
        </div>

        <!-- Tab: Trustlines content -->
        <div id="stellar-resources-tab-content" style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
          <div class="b2-stellar-desc">${l.desc}</div>

          ${!isActivated ? `
            <div class="b2-stellar-warning">
              <span>⚠️</span>
              <div>${l.inactiveDesc}</div>
            </div>
          ` : ''}

          <div class="b2-stellar-grid">
            <!-- Card de Claimables -->
            <div class="b2-stellar-card">
              <div class="b2-stellar-card-title">
                <span>🎁</span> ${l.claimables}
              </div>
              <div class="b2-stellar-card-value">
                ${resources.claimableBalances}
              </div>
              <div class="b2-stellar-card-desc">
                ${l.claimablesDesc}
              </div>
              <button class="b2-stellar-action-btn" id="b2-stellar-claimables-btn">
                <span>🎁</span> ${l.claimablesBtn}
              </button>
            </div>

            <!-- Card de Liquidity Pools -->
            <div class="b2-stellar-card">
              <div class="b2-stellar-card-title">
                <span>🌊</span> ${l.pools}
              </div>
              <div class="b2-stellar-card-value">
                ${resources.liquidityPools}
              </div>
              <div class="b2-stellar-card-desc">
                ${l.poolsDesc}
              </div>
              <button class="b2-stellar-action-btn" id="b2-stellar-trustline-btn">
                <span>➕</span> ${l.addTrustline}
              </button>
            </div>
          </div>
        </div>

        <!-- Tab: Diagnostics content -->
        <div id="stellar-diagnostics-tab-content" style="display: none; flex-direction: column; gap: 12px; width: 100%;">
          <div class="b2-diag-grid" style="margin-top: 8px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <!-- Altura do Bloco -->
            <div class="b2-diag-card">
              <div class="b2-diag-card-header">
                <span class="b2-diag-card-icon">🧱</span>
                <span class="b2-diag-card-label">${isEn ? "Block Height" : "Altura do Bloco"}</span>
              </div>
              <div class="b2-diag-card-value b2-diag-card-tech">
                <span id="b2-stellar-diag-height-val" class="b2-telemetry-loading" style="width: 100px;"></span>
              </div>
            </div>

            <!-- Bloco Anterior -->
            <div class="b2-diag-card">
              <div class="b2-diag-card-header">
                <span class="b2-diag-card-icon">🔗</span>
                <span class="b2-diag-card-label">${isEn ? "Previous Block" : "Bloco Anterior"}</span>
              </div>
              <div class="b2-diag-card-value b2-diag-card-tech" style="font-size: 0.625rem; font-family: monospace;">
                <span id="b2-stellar-diag-prev-hash" class="b2-telemetry-loading" style="width: 140px;"></span>
              </div>
            </div>

            <!-- Consenso -->
            <div class="b2-diag-card">
              <div class="b2-diag-card-header">
                <span class="b2-diag-card-icon">🤝</span>
                <span class="b2-diag-card-label">${isEn ? "Consensus" : "Consenso da Rede"}</span>
              </div>
              <div class="b2-diag-card-value" style="font-size: 0.68rem; color: var(--text-secondary);">
                <span id="b2-stellar-diag-consensus-val" class="b2-telemetry-loading" style="width: 110px;"></span>
              </div>
            </div>

            <!-- Tempo de Bloco -->
            <div class="b2-diag-card">
              <div class="b2-diag-card-header">
                <span class="b2-diag-card-icon">⏱️</span>
                <span class="b2-diag-card-label">${isEn ? "Avg Block Time" : "Tempo de Bloco"}</span>
              </div>
              <div class="b2-diag-card-value b2-diag-card-tech">
                <span id="b2-stellar-diag-time-val" class="b2-telemetry-loading" style="width: 60px;"></span>
              </div>
            </div>

            <!-- Nós Ativos -->
            <div class="b2-diag-card">
              <div class="b2-diag-card-header">
                <span class="b2-diag-card-icon">🖥️</span>
                <span class="b2-diag-card-label">${isEn ? "Active Nodes" : "Total de Nós"}</span>
              </div>
              <div class="b2-diag-card-value b2-diag-card-tech">
                <span id="b2-stellar-diag-nodes-val" class="b2-telemetry-loading" style="width: 80px;"></span>
              </div>
            </div>

            <!-- Taxas / Gas -->
            <div class="b2-diag-card">
              <div class="b2-diag-card-header">
                <span class="b2-diag-card-icon">⛽</span>
                <span class="b2-diag-card-label">${isEn ? "Base Tx Fee" : "Taxa Transação"}</span>
              </div>
              <div class="b2-diag-card-value b2-diag-card-tech">
                <span id="b2-stellar-diag-fee-val" class="b2-telemetry-loading" style="width: 90px;"></span>
              </div>
            </div>

            <!-- Saúde da Rede -->
            <div class="b2-diag-card" style="grid-column: span 2;">
              <div class="b2-diag-card-header" style="justify-content: space-between;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span class="b2-diag-card-icon">❤️</span>
                  <span class="b2-diag-card-label">${isEn ? "Network Health" : "Saúde da Rede"}</span>
                </div>
                <span id="b2-stellar-diag-health-val" style="font-size: 0.65rem; font-weight: bold; color: var(--text-secondary);">
                  <span class="b2-telemetry-loading" style="width: 80px; height: 10px;"></span>
                </span>
              </div>
              <div class="b2-diag-card-value" style="font-size: 0.65rem; font-family: monospace; color: var(--text-muted); margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 4px;">
                <span style="color:var(--text-secondary); font-weight:bold;">URL:</span> ${activeChain.nodeUrl ? activeChain.nodeUrl : "https://horizon.stellar.org"}
              </div>
            </div>
          </div>

          <button class="b2-diag-ping-btn" id="b2-stellar-diag-ping-btn" style="width: 100%; background: linear-gradient(90deg, rgba(${themeRgb}, 0.08) 0%, rgba(${themeRgb}, 0.02) 100%); border: 1px solid rgba(${themeRgb}, 0.2); color: var(--text-primary); font-size: 0.72rem; font-weight: bold; padding: 9px; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 6px; letter-spacing: 0.3px; text-transform: uppercase;">
            <span class="b2-diag-ping-loader" id="b2-stellar-diag-ping-loader" style="width: 10px; height: 10px; border: 2px solid rgba(255,255,255,0.2); border-top-color: var(--text-primary); border-radius: 50%; animation: b2-diag-spin 0.6s linear infinite; display: none;"></span>
            <span id="b2-stellar-diag-ping-text">⚡ ${isEn ? "Test Node Latency" : "Testar Latência do Nó"}</span>
          </button>
        </div>
      </div>
    `;

  // Click listeners
  const claimablesBtn = container.querySelector("#b2-stellar-claimables-btn");
  if (claimablesBtn) {
    claimablesBtn.addEventListener("click", () => {
      this.showStellarClaimablesModal();
    });
  }

  const trustlineBtn = container.querySelector("#b2-stellar-trustline-btn");
  if (trustlineBtn) {
    trustlineBtn.addEventListener("click", () => {
      if (window.B2App && typeof window.B2App.showAddTokenModal === "function") {
        window.B2App.showAddTokenModal();
      }
    });
  }

  // Bind main sub-tabs (Trustlines vs Diagnostics)
  const stellarSubtabResources = container.querySelector("#b2-stellar-subtab-resources");
  const stellarSubtabDiag = container.querySelector("#b2-stellar-subtab-diag");
  const stellarResourcesContent = container.querySelector("#stellar-resources-tab-content");
  const stellarDiagnosticsContent = container.querySelector("#stellar-diagnostics-tab-content");

  if (stellarSubtabResources && stellarSubtabDiag && stellarResourcesContent && stellarDiagnosticsContent) {
    stellarSubtabResources.addEventListener("click", () => {
      stellarSubtabResources.classList.add("active");
      stellarSubtabDiag.classList.remove("active");
      stellarResourcesContent.style.display = "flex";
      stellarDiagnosticsContent.style.display = "none";
    });

    stellarSubtabDiag.addEventListener("click", () => {
      stellarSubtabDiag.classList.add("active");
      stellarSubtabResources.classList.remove("active");
      stellarResourcesContent.style.display = "none";
      stellarDiagnosticsContent.style.display = "flex";
    });
  }

  // Bind Stellar diagnostic ping interactivity
  const stellarPingBtn = container.querySelector("#b2-stellar-diag-ping-btn");
  const stellarPingLoader = container.querySelector("#b2-stellar-diag-ping-loader");
  const stellarPingText = container.querySelector("#b2-stellar-diag-ping-text");

  if (stellarPingBtn) {
    stellarPingBtn.addEventListener('click', () => {
      stellarPingBtn.disabled = true;
      if (stellarPingLoader) stellarPingLoader.style.display = "inline-block";
      if (stellarPingText) stellarPingText.innerText = isEn ? "Testing..." : "Testando...";

      const pingStartTime = performance.now();
      fetch(activeChain.nodeUrl || "https://horizon.stellar.org", { method: "HEAD", mode: "no-cors" })
        .then(() => {
          const ms = Math.round(performance.now() - pingStartTime);
          stellarPingBtn.disabled = false;
          if (stellarPingLoader) stellarPingLoader.style.display = "none";
          if (stellarPingText) stellarPingText.innerText = `⚡ ${isEn ? "Test Node Latency" : "Testar Latência do Nó"}`;

          const msg = (isEn ? "Connected with" : "Conectado com") + ` ${activeChain.name} Node in ${ms}ms!`;
          if (window.ToastEngine) {
            window.ToastEngine.show({
              title: isEn ? "Latency Test" : "Teste de Latência",
              message: msg,
              type: "success"
            });
          } else if (window.B2UIRenderer && window.B2UIRenderer.showToast) {
            window.B2UIRenderer.showToast(msg, "success");
          } else if (window.showToast) {
            window.showToast(msg, "success");
          } else {
            alert(msg);
          }
        })
        .catch(() => {
          stellarPingBtn.disabled = false;
          if (stellarPingLoader) stellarPingLoader.style.display = "none";
          if (stellarPingText) stellarPingText.innerText = `⚡ ${isEn ? "Test Node Latency" : "Testar Latência do Nó"}`;

          const errorMsg = isEn ? "Failed to connect to active node!" : "Falha ao conectar ao nó ativo!";
          if (window.ToastEngine) {
            window.ToastEngine.show({
              title: isEn ? "Latency Test" : "Teste de Latência",
              message: errorMsg,
              type: "error"
            });
          } else {
            alert(errorMsg);
          }
        });
    });
  }

  const updateStellarDiagWithUnavailable = () => {
    const unavailableText = isEn ? "Unavailable" : "Indisponível";
    const elements = [
      container.querySelector("#b2-stellar-diag-height-val"),
      container.querySelector("#b2-stellar-diag-prev-hash"),
      container.querySelector("#b2-stellar-diag-consensus-val"),
      container.querySelector("#b2-stellar-diag-time-val"),
      container.querySelector("#b2-stellar-diag-nodes-val"),
      container.querySelector("#b2-stellar-diag-fee-val"),
      container.querySelector("#b2-stellar-diag-health-val")
    ];
    elements.forEach(el => {
      if (el && document.body.contains(el)) {
        el.classList.remove("b2-telemetry-loading");
        el.innerText = unavailableText;
        el.style.width = "auto";
        el.style.height = "auto";
        el.style.background = "none";
        el.style.animation = "none";
      }
    });
  };

  const clearShimmer = (el) => {
    if (el) {
      el.classList.remove("b2-telemetry-loading");
      el.style.width = "auto";
      el.style.height = "auto";
      el.style.background = "none";
      el.style.animation = "none";
    }
  };

  this.getRealBlockHeightAndPrevHash(activeChain).then(realData => {
    const unavailableText = isEn ? "Unavailable" : "Indisponível";

    const heightValEl = container.querySelector("#b2-stellar-diag-height-val");
    const prevHashEl = container.querySelector("#b2-stellar-diag-prev-hash");
    const consensusValEl = container.querySelector("#b2-stellar-diag-consensus-val");
    const timeValEl = container.querySelector("#b2-stellar-diag-time-val");
    const nodesValEl = container.querySelector("#b2-stellar-diag-nodes-val");
    const feeValEl = container.querySelector("#b2-stellar-diag-fee-val");
    const healthValEl = container.querySelector("#b2-stellar-diag-health-val");

    if (!realData) {
      updateStellarDiagWithUnavailable();
      return;
    }

    if (heightValEl && document.body.contains(heightValEl)) {
      clearShimmer(heightValEl);
      if (realData.height !== null && realData.height !== undefined) {
        heightValEl.innerText = realData.height.toLocaleString();
      } else {
        heightValEl.innerText = unavailableText;
      }
    }

    if (prevHashEl && document.body.contains(prevHashEl)) {
      clearShimmer(prevHashEl);
      if (realData.prevHash) {
        const truncatedPrevHash = realData.prevHash.length > 14
          ? realData.prevHash.substring(0, 10) + "..." + realData.prevHash.substring(realData.prevHash.length - 4)
          : realData.prevHash;
        prevHashEl.innerText = truncatedPrevHash;
      } else {
        prevHashEl.innerText = unavailableText;
      }
    }

    if (consensusValEl && document.body.contains(consensusValEl)) {
      clearShimmer(consensusValEl);
      consensusValEl.innerText = realData.consensus || unavailableText;
    }

    if (nodesValEl && document.body.contains(nodesValEl)) {
      clearShimmer(nodesValEl);
      nodesValEl.innerText = realData.nodeCount || unavailableText;
    }

    if (feeValEl && document.body.contains(feeValEl)) {
      clearShimmer(feeValEl);
      feeValEl.innerText = realData.baseFee || unavailableText;
    }

    if (healthValEl && document.body.contains(healthValEl)) {
      clearShimmer(healthValEl);
      healthValEl.innerText = realData.health || unavailableText;
      if (realData.healthColor) {
        healthValEl.style.color = realData.healthColor;
      }
    }

    if (timeValEl && document.body.contains(timeValEl)) {
      clearShimmer(timeValEl);
      if (realData.timestamp) {
        const updateAge = () => {
          const age = Math.max(0, Math.floor(Date.now() / 1000) - realData.timestamp);
          timeValEl.innerText = isEn ? `${age}s ago` : `${age}s atrás`;
        };
        updateAge();

        if (window.b2StellarBlockAgeInterval) {
          clearInterval(window.b2StellarBlockAgeInterval);
        }
        window.b2StellarBlockAgeInterval = setInterval(() => {
          if (!container || !document.body.contains(timeValEl)) {
            clearInterval(window.b2StellarBlockAgeInterval);
            return;
          }
          updateAge();
        }, 1000);
      } else if (realData.blockTime) {
        timeValEl.innerText = realData.blockTime;
      } else {
        timeValEl.innerText = unavailableText;
      }
    }
  }).catch(err => {
    console.warn("[Stellar Dashboard] Live diagnostics refresh failed:", err);
    updateStellarDiagWithUnavailable();
  });
};

UIRenderer.prototype.showStellarClaimablesModal = async function () {
  this.openModal('modal-stellar-claimables');
  const container = document.getElementById('stellar-claimables-list');
  if (!container) return;

  container.innerHTML = `
      <div style="text-align:center;padding:24px;color:var(--text-muted);">
        <style>
          .b2-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.1);
            border-top-color: var(--color-primary, #39ff14);
            border-radius: 50%;
            animation: b2-diag-spin 0.6s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
          }
        </style>
        <span class="b2-spinner"></span>
        <span>Carregando saldos reclamáveis do nó Stellar...</span>
      </div>
    `;

  try {
    const activeChain = window.B2App.blockchainData.find(c => c.key === "STELLAR");
    if (!activeChain) throw new Error("Ativo Stellar não configurado.");

    const address = window.B2App.derivedKeys["STELLAR"]?.address;
    if (!address) throw new Error("Chaves Stellar não derivadas.");

    const nodeUrl = activeChain.nodeUrl || "https://horizon.stellar.org";
    const claimables = await window.B2StellarEngine.HorizonProvider.getClaimableBalances(address, nodeUrl);

    if (!claimables || claimables.length === 0) {
      container.innerHTML = `
          <div style="text-align:center;padding:32px;color:var(--text-muted);font-size:0.75rem;">
            🎁 Nenhum saldo reclamável pendente encontrado para este endereço.
          </div>
        `;
      return;
    }

    container.innerHTML = "";
    claimables.forEach(c => {
      const itemEl = document.createElement("div");
      itemEl.style.cssText = `
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: all 0.2s ease;
        `;

      let assetStr = "XLM";
      if (c.asset && c.asset !== "native") {
        const parts = c.asset.split(":");
        assetStr = parts[0];
      }

      const shortId = c.id ? (c.id.substring(0, 8) + "..." + c.id.substring(c.id.length - 8)) : "ID Desconhecido";

      itemEl.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:2px;">
            <div style="font-weight:bold;font-size:0.85rem;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
              <span>🎁</span> <span>${parseFloat(c.amount).toFixed(4)} ${assetStr}</span>
            </div>
            <div style="font-family:var(--font-tech), monospace;font-size:0.62rem;color:var(--text-muted);" title="${c.id}">
              ID: ${shortId}
            </div>
          </div>
        `;
      container.appendChild(itemEl);
    });
  } catch (err) {
    container.innerHTML = `
        <div style="text-align:center;padding:32px;color:#ef4444;font-size:0.75rem;">
          ❌ Erro: ${err.message}
        </div>
      `;
  }
};
