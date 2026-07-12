/**
 * B2 Wallet - Módulo de Configurações, Temas, Redes e Políticas de Manutenção de B2WalletApp.
 */

B2WalletApp.prototype.applyRpcOverrides = function() {
    const savedCustomRpcs = localStorage.getItem("b2_custom_rpcs");
    if (savedCustomRpcs) {
      try {
        const overrides = JSON.parse(savedCustomRpcs);
        this.blockchainData.forEach(chain => {
          if (overrides[chain.key]) {
            chain.nodeUrl = overrides[chain.key];
          }
        });
      } catch (e) {
        console.error("Erro ao aplicar overrides de RPC:", e);
      }
    }
  };

B2WalletApp.prototype.showRpcErrorDialog = function(chain, originalErrorMsg) {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        resolve(null);
        return;
      }
      const overlay = document.createElement("div");
      overlay.className = "b2-swal-overlay";

      const card = document.createElement("div");
      card.className = "b2-swal-card glass-panel animate-view";
      card.style.maxWidth = "400px";

      card.innerHTML = `
      <div class="b2-swal-icon-container" style="color: var(--color-danger);">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <h3 class="b2-swal-title" style="font-family: var(--font-tech); text-transform: uppercase; margin: 12px 0 6px 0; font-size: 1.05rem; letter-spacing: 1px; color: var(--color-danger); text-shadow: 0 0 8px rgba(239,68,68,0.35);">Erro de Conexão RPC</h3>
      <p class="b2-swal-text" style="font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 12px 0; line-height: 1.45; text-align: left;">
        Não foi possível conectar ao nó da blockchain <strong>${chain.name} (${chain.symbol})</strong>.
        <br><br>
        <span style="font-size: 0.75rem; color: var(--text-muted); word-break: break-all;">Detalhes: ${originalErrorMsg}</span>
        <br><br>
        Deseja alterar a URL do RPC/Node para um servidor próprio ou relatar este erro ao suporte técnico?
      </p>
      <div style="margin: 0 0 16px 0; width: 100%; text-align: left;">
        <label class="form-label" style="font-size:0.75rem; margin-bottom:4px;">Novo Endpoint RPC/Node URL</label>
        <input id="rpc-custom-input" type="text" value="${chain.nodeUrl || ''}" class="form-input" style="width: 100%; font-family: var(--font-mono); font-size: 0.78rem; padding: 8px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-light); border-radius: var(--radius-sm);">
      </div>
      <div class="b2-swal-actions" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
        <div style="display: flex; gap: 8px; width: 100%;">
          <button id="rpc-cancel-btn" class="btn btn-outline" style="flex: 1; padding: 10px; font-size: 0.72rem;">Cancelar</button>
          <button id="rpc-save-btn" class="btn btn-primary" style="flex: 1.2; padding: 10px; font-size: 0.72rem;">Salvar RPC</button>
        </div>
        <button id="rpc-support-btn" class="btn" style="width: 100%; padding: 10px; font-size: 0.72rem; background: #25d366; color: #fff; border: none; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(37,211,102,0.25);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          Relatar ao Suporte via WhatsApp
        </button>
      </div>
    `;

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      void overlay.offsetWidth;
      overlay.classList.add("show");

      const cleanup = (result) => {
        overlay.classList.remove("show");
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 300);
      };

      card.querySelector("#rpc-cancel-btn").addEventListener("click", () => cleanup(null));
      card.querySelector("#rpc-save-btn").addEventListener("click", () => {
        const val = card.querySelector("#rpc-custom-input").value.trim();
        cleanup({ action: 'save', url: val });
      });
      card.querySelector("#rpc-support-btn").addEventListener("click", () => {
        const text = encodeURIComponent(`Olá Suporte B2 Wallet, estou com erro de conexão RPC na rede ${chain.name} (${chain.symbol}).\nErro: ${originalErrorMsg}`);
        window.open(`https://wa.me/5511974289097?text=${text}`, '_blank');
        cleanup({ action: 'support' });
      });
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cleanup(null);
      });
    });
  };

B2WalletApp.prototype.applyTheme = function(theme) {
    // define atributo no <html> e também no <body> para compatibilidade com seletores variados
    document.documentElement.setAttribute("data-theme", theme);
    try { document.body.setAttribute('data-theme', theme); } catch (e) { /* body pode não existir em alguns testes */ }
    // adiciona classes auxiliares para compatibilidade (alguns estilos podem usar classes ao invés de atributos)
    document.documentElement.classList.remove('theme-dark', 'theme-light');
    document.documentElement.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');

    localStorage.setItem("b2_theme", theme);
    this.currentTheme = theme;

    // Atualiza os seletores de rádio ou UI correspondentes
    const toggleIcon = document.getElementById("theme-toggle-icon");
    if (toggleIcon) {
      toggleIcon.innerHTML = theme === "dark"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  };

B2WalletApp.prototype.setActiveChain = function(chainKey) {
    const chain = this.blockchainData.find(c => c.key === chainKey);
    if (!chain) return;

    // Verifica manutenção antes de trocar a chain ativa
    if (this.checkMaintenanceChain(chainKey)) return;

    this.activeChainKey = chainKey;
    localStorage.setItem('b2_active_chain_key', chainKey);

    // Atualiza trigger do seletor
    const selectedChainLogo = document.getElementById('selected-chain-logo');
    const selectedChainName = document.getElementById('selected-chain-name');
    if (selectedChainName) selectedChainName.textContent = chain.name;
    if (selectedChainLogo) {
      selectedChainLogo.src = chain.logoUrl || 'src/img/btc.png';
      selectedChainLogo.style.display = 'block';
      selectedChainLogo.onerror = () => { selectedChainLogo.style.display = 'none'; };
    }

    // CSS var de cor da chain ativa
    const activeColor = chain.color || 'var(--color-primary)';
    document.documentElement.style.setProperty('--active-chain-color', activeColor);

    // Glow no header de saldo
    const headerEl = document.getElementById('active-chain-header');
    if (headerEl) {
      headerEl.classList.remove('glow-gold', 'glow-blue', 'glow-green', 'glow-purple');
      if (chainKey === 'WAVES' || chainKey === 'AMZX' || activeColor === '#f59e0b') {
        headerEl.classList.add('glow-gold');
      } else if (chainKey === 'PLO' || activeColor === '#06b6d4' || activeColor === '#38bdf8') {
        headerEl.classList.add('glow-blue');
      } else if (activeColor === '#10b981' || activeColor === '#22c55e' || activeColor === '#14f195') {
        headerEl.classList.add('glow-green');
      } else {
        headerEl.classList.add('glow-purple');
      }
    }

    // Atualiza badge de endereço no topo do saldo
    const addrBadge = document.getElementById('active-chain-address-text');
    if (addrBadge) {
      const derived = this.derivedKeys[chainKey];
      if (derived && derived.address) {
        const addr = derived.address;
        // Trunca: primeiros 10 + ... + últimos 8 chars
        const truncated = addr.length > 24 ? addr.substring(0, 10) + '…' + addr.substring(addr.length - 8) : addr;
        addrBadge.textContent = truncated;
        addrBadge.title = addr;
      } else {
        addrBadge.textContent = 'Desbloqueie a Carteira';
        addrBadge.title = '';
      }
    }

    // Botões de ação condicionais por flags do registry
    const btnAddToken = document.getElementById('dashboard-btn-add-token');
    const btnLeasing = document.getElementById('dashboard-btn-leasing');
    const btnFaucet = document.getElementById('dashboard-btn-faucet');
    const tabBtnNFTs = document.getElementById('tab-btn-nfts');
    const tabBtnFeatures = document.getElementById('tab-btn-features');

    const supportsFeatures = chain.supportsStaking || chain.supportsSmartContracts || chain.engine === 'Bitcoin';

    if (btnAddToken) {
      // Mostra apenas para chains com tokens e que NÃO sejam do ecossistema Waves (onde auto-discovery é dinâmico)
      const showAddToken = !!chain.supportsTokens && chain.engine !== 'Waves';
      btnAddToken.style.display = showAddToken ? 'flex' : 'none';
    }
    if (btnLeasing) {
      btnLeasing.style.display = chain.supportsStaking ? 'flex' : 'none';
    }
    if (btnFaucet) {
      const isTestnet = this.networkMode === 'testnet';
      const showFaucet = isTestnet && !!chain.faucet;
      btnFaucet.style.display = showFaucet ? 'flex' : 'none';
    }
    if (tabBtnNFTs) {
      tabBtnNFTs.style.display = chain.supportsNFTs ? '' : 'none';
    }
    const nftActionsRow = document.getElementById('nft-actions-row');
    if (nftActionsRow) {
      // O botão "+ NFT" também é irrelevante para redes Waves que descobrem tudo nativamente
      const showNftActions = !!chain.supportsNFTs && chain.engine !== 'Waves';
      nftActionsRow.style.display = showNftActions ? 'flex' : 'none';
    }
    if (tabBtnFeatures) {
      tabBtnFeatures.style.display = supportsFeatures ? '' : 'none';
    }

    // Re-renderiza a dashboard com a tab ativa
    let activeTabButton = document.querySelector('.tab-btn.active');
    let activeTab = activeTabButton ? activeTabButton.getAttribute('data-tab') : 'tokens';

    if (activeTab === 'features' && !supportsFeatures) {
      if (tabBtnFeatures) tabBtnFeatures.classList.remove('active');
      const tabBtnTokens = document.querySelector('.tab-btn[data-tab="tokens"]');
      if (tabBtnTokens) tabBtnTokens.classList.add('active');
      activeTab = 'tokens';

      document.querySelectorAll(".tab-content").forEach(content => {
        content.style.display = "none";
        content.classList.remove("active");
      });
      const tokensContent = document.getElementById("tab-content-tokens");
      if (tokensContent) {
        tokensContent.style.display = "flex";
        tokensContent.classList.add("active");
      }
    }

    // Sincroniza sempre o dashboard ativo (carrossel de seleção, cabeçalho de saldo, gráficos de portfólio, etc.)
    if (window.B2UIRenderer && typeof window.B2UIRenderer.renderActiveBlockchainDashboard === 'function') {
      window.B2UIRenderer.renderActiveBlockchainDashboard(this.blockchainData, chainKey);
    }

    // Busca o saldo sob demanda para a blockchain recém selecionada (Lazy Loading com cache)
    if (!chain.lastLoaded && !chain.isLoadingBalance) {
      this.updateNetworkBalances(chainKey);
    }

    if (activeTab === 'tokens') {
      // Já sincronizado e renderizado pelo renderActiveBlockchainDashboard acima
    } else if (activeTab === 'nfts') {
      if (window.B2UIRenderer && typeof window.B2UIRenderer.renderNFTsGaller === 'function') {
        window.B2UIRenderer.renderNFTsGaller(chainKey);
      }
    } else if (activeTab === 'history') {
      if (window.B2UIRenderer && typeof window.B2UIRenderer.renderHistoryTransactions === 'function') {
        window.B2UIRenderer.renderHistoryTransactions(chainKey);
      }
    } else if (activeTab === 'features') {
      if (window.B2UIRenderer && typeof window.B2UIRenderer.renderCustomProtocolCard === 'function') {
        window.B2UIRenderer.renderCustomProtocolCard(chain, this.blockchainData);
      }
    }

    window.B2Logger.log('info', `Rede ativa: ${chain.name} (${chainKey})`);

    // Para redes Waves: atualiza saldo REAL da blockchain em background
    if (chain.engine === 'Waves' && chain.nodeUrl && this.derivedKeys[chainKey]?.address) {
      const wavesAddr = this.derivedKeys[chainKey].address;
      const sanitizedUrl = chain.nodeUrl.replace(/\/+$/, '');

      // Mostra indicador no badge de endereço
      const addrBadge2 = document.getElementById('active-chain-address-text');
      if (addrBadge2) addrBadge2.title = `${wavesAddr} · Atualizando saldo...`;

      fetch(`${sanitizedUrl}/addresses/balance/${wavesAddr}`)
        .then(r => r.json())
        .then(json => {
          if (json && json.balance !== undefined) {
            const realBalance = json.balance / Math.pow(10, chain.decimals || 8);
            chain.balanceCrypto = realBalance;
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
            window.B2Logger.log('success', `[Waves] Saldo real de ${chain.name}: ${realBalance.toFixed(6)} ${chain.symbol} (${wavesAddr})`);
          }
        })
        .catch(err => {
          window.B2Logger.log('warn', `[Waves] Falha ao atualizar saldo de ${chain.name}: ${err.message}`);
        });
    }
  };

B2WalletApp.prototype._maintenancePopup = function(type, name) {
    const overlay = document.createElement('div');
    overlay.id = 'maintenance-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.72);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px; animation: b2-fade-in 0.2s ease;
    `;

    const isChain = type === 'chain';
    const icon = isChain ? '⛓️' : '🪙';

    // Resolver de Tradução Localizado
    const lang = this.currentLanguage || 'en';
    const t = window.B2Translations[lang] || window.B2Translations['en'] || {};
    const defaultT = window.B2Translations['en'] || {};
    const getVal = (key) => (t[key] !== undefined ? t[key] : defaultT[key]);

    const titleText = isChain
      ? getVal('maintenanceChainTitle') || "Blockchain em Manutenção"
      : getVal('maintenanceTokenTitle') || "Token em Manutenção";
    const subtitleText = getVal('maintenanceUnavailable') || "Indisponível temporariamente";

    let descTemplate = isChain
      ? getVal('maintenanceChainDesc') || "A rede <strong>{name}</strong> está em manutenção temporária. Todos os recursos de saldo, transferências e contratos estão desabilitados no momento."
      : getVal('maintenanceTokenDesc') || "O token <strong>{name}</strong> está em manutenção temporária. Negociações e transferências para este ativo estão suspensas no momento.";

    const descText = descTemplate.replace('{name}', name);
    const btnText = getVal('understandBtn') || "Entendido";

    overlay.innerHTML = `
      <div style="
        width: 100%; max-width: 320px;
        background: linear-gradient(160deg, #1a1f2e 0%, #141820 100%);
        border: 1px solid rgba(245,158,11,0.35);
        border-radius: 20px;
        padding: 32px 24px 24px;
        display: flex; flex-direction: column; align-items: center; gap: 16px;
        box-shadow: 0 0 40px rgba(245,158,11,0.15), 0 24px 48px rgba(0,0,0,0.6);
        animation: b2-scale-in 0.25s cubic-bezier(0.34,1.56,0.64,1);
        text-align: center;
      ">
        <!-- Ícone animado -->
        <div style="
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(245,158,11,0.12);
          border: 2px solid rgba(245,158,11,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px;
          animation: b2-pending-pulse 1.8s ease-in-out infinite;
        ">${icon}</div>

        <!-- Título -->
        <div>
          <div style="font-size: 1.1rem; font-weight: 800; color: #f59e0b; font-family: var(--font-ui); letter-spacing: -0.02em;">
            ${titleText}
          </div>
          <div style="font-size: 0.75rem; color: rgba(255,255,255,0.45); margin-top: 4px; font-family: var(--font-body);">
            ${subtitleText}
          </div>
        </div>

        <!-- Descrição -->
        <div style="
          background: rgba(245,158,11,0.07);
          border: 1px solid rgba(245,158,11,0.18);
          border-radius: 12px; padding: 14px 16px;
          font-size: 0.8rem; color: rgba(255,255,255,0.75);
          font-family: var(--font-body); line-height: 1.5;
        ">
          ${descText}
        </div>

        <!-- Botão fechar -->
        <button id="maintenance-close-btn" style="
          width: 100%; padding: 12px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border: none; border-radius: 12px;
          font-family: var(--font-ui); font-size: 0.875rem; font-weight: 700;
          color: #000; cursor: pointer; letter-spacing: 0.02em;
          transition: opacity 0.15s, transform 0.15s;
        ">${btnText}</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#maintenance-close-btn');
    const dismiss = () => {
      overlay.style.animation = 'b2-fade-out 0.2s ease forwards';
      setTimeout(() => overlay.remove(), 200);
    };
    closeBtn.addEventListener('click', dismiss);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.opacity = '0.85'; closeBtn.style.transform = 'translateY(-1px)'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.opacity = '1'; closeBtn.style.transform = ''; });
  };

B2WalletApp.prototype.checkMaintenanceChain = function(chainKey) {
    if (!this.maintenanceChains || this.maintenanceChains.length === 0) return false;
    if (!this.maintenanceChains.includes(chainKey)) return false;

    const chain = this.blockchainData.find(c => c.key === chainKey);
    const name = chain ? chain.name : chainKey;
    this._maintenancePopup('chain', name);

    // Redireciona para a primeira chain disponível fora de manutenção
    const fallback = this.blockchainData.find(c => !this.maintenanceChains.includes(c.key));
    if (fallback && fallback.key !== chainKey) {
      // Usa setTimeout para não conflitar com o popup
      setTimeout(() => this.setActiveChain(fallback.key), 50);
    }
    return true;
  };

B2WalletApp.prototype.checkMaintenanceToken = function(tokenId) {
    if (!this.maintenanceTokens || this.maintenanceTokens.length === 0) return false;
    if (!tokenId) return false;
    const id = String(tokenId);
    const blocked = this.maintenanceTokens.some(t => t === id || t.toUpperCase() === id.toUpperCase());
    if (!blocked) return false;
    this._maintenancePopup('token', id);
    return true;
  };

B2WalletApp.prototype.exportConfigSecure = async function() {
    if (this.encryptionPromise) {
      try {
        await this.encryptionPromise;
      } catch (e) {
        console.error('[exportConfigSecure] Erro ao aguardar criptografia:', e);
      }
    }

    if (!this.encryptedWalletPayload) {
      window.showToast("Falha ao exportar backup: semente não criptografada ou vazia.", "error");
      return;
    }

    const configData = {
      version: "0.1.5",
      generator: "better2better.com.br",
      engineer: "Diego Oris",
      payload: this.encryptedWalletPayload,
      pinHash: this.userPinHash,
      networks: this.blockchainData.map(c => ({ key: c.key, name: c.name, symbol: c.symbol }))
    };

    try {
      const jsonStr = JSON.stringify(configData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `b2_wallet_config_${Date.now()}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      setTimeout(() => {
        downloadAnchor.remove();
        URL.revokeObjectURL(url);
      }, 200);

      window.showToast("Backup exportado com sucesso!", "success");
    } catch (e) {
      console.error('[exportConfigSecure] Falha ao exportar backup:', e);
      window.showToast("Erro ao gerar arquivo de backup.", "error");
    }
  };

B2WalletApp.prototype.importConfigSecure = async function(jsonString) {
    try {
      const config = JSON.parse(jsonString);
      if (!config.payload || !config.payload.ciphertext) {
        throw new Error("Formato inválido do arquivo de backup de semente única B2 Wallet.");
      }

      this.encryptedWalletPayload = config.payload;
      if (config.pinHash) {
        this.userPinHash = config.pinHash;
        localStorage.setItem("b2_pin_hash", config.pinHash);
      }

      localStorage.setItem("b2_encrypted_payload", JSON.stringify(config.payload));
      this.loadPersistedData();

      window.B2UIRenderer.navigateTo("view-locked");
    } catch (error) {
      window.B2Toast.alert("Falha na Importação", error.message, "error");
    }
  };

