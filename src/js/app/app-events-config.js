/**
 * B2 Wallet - Configurations, Themes, Search, and DApps Simulator Event Listeners (Modulo Eventos Config)
 */

B2WalletApp.prototype.setupConfigEvents = function() {
    // ----------------------------------------------------------------
    // B. SELETOR DE IDIOMAS E TEMA
    // ----------------------------------------------------------------
    // Helper para atualizar o gatilho customizado de idiomas e cards do modal
    const updateLanguageCustomTrigger = (value) => {
      const triggerLabel = document.getElementById("language-custom-value");
      const triggerFlag = document.getElementById("language-custom-flag");
      if (!triggerLabel || !triggerFlag) return;

      const mapping = {
        "pt": { flag: "🇧🇷", label: "PT" },
        "en": { flag: "🇺🇸", label: "EN" },
        "es": { flag: "🇪🇸", label: "ES" },
        "fr": { flag: "🇫🇷", label: "FR" },
        "zh": { flag: "🇨🇳", label: "ZH" },
        "ja": { flag: "🇯🇵", label: "JA" },
        "ko": { flag: "🇰🇷", label: "KO" },
        "de": { flag: "🇩🇪", label: "DE" },
        "it": { flag: "🇮🇹", label: "IT" },
        "ru": { flag: "🇷🇺", label: "RU" }
      };

      const selected = mapping[value] || mapping["pt"];
      triggerLabel.textContent = selected.label;
      triggerFlag.textContent = selected.flag;

      // Sincroniza a marcação ativa e bolinhas no modal de idiomas
      document.querySelectorAll(".language-option-card").forEach(card => {
        const check = card.querySelector(".inner-dot");
        if (check) {
          check.style.display = (card.getAttribute("data-value") === value) ? "block" : "none";
        }
        if (card.getAttribute("data-value") === value) {
          card.classList.add("active");
        } else {
          card.classList.remove("active");
        }
      });
    };

    const langSelect = document.getElementById("b2-language-selector");
    if (langSelect) {
      langSelect.value = this.currentLanguage;
      updateLanguageCustomTrigger(this.currentLanguage);
      langSelect.addEventListener('change', (e) => {
        this.currentLanguage = e.target.value;
        window.B2TranslateUI(e.target.value);
        updateLanguageCustomTrigger(e.target.value);
      });
    }

    // Modal de Idiomas Customizado Premium (Ações)
    const customLanguageTrigger = document.getElementById("language-custom-trigger");
    const modalLanguageSelect = document.getElementById("modal-language-select");
    const btnCloseLanguageSelect = document.getElementById("btn-close-language-select");

    if (customLanguageTrigger && modalLanguageSelect) {
      customLanguageTrigger.addEventListener("click", () => {
        const currentLang = langSelect ? langSelect.value : this.currentLanguage;
        updateLanguageCustomTrigger(currentLang);
        window.B2UIRenderer.openModal("modal-language-select");
      });
    }

    if (btnCloseLanguageSelect && modalLanguageSelect) {
      btnCloseLanguageSelect.addEventListener("click", () => {
        window.B2UIRenderer.closeModal("modal-language-select");
      });
    }

    document.querySelectorAll(".language-option-card").forEach(card => {
      card.addEventListener("click", () => {
        const value = card.getAttribute("data-value");
        if (langSelect) {
          langSelect.value = value;
          langSelect.dispatchEvent(new Event("change"));
        } else {
          this.currentLanguage = value;
          window.B2TranslateUI(value);
          updateLanguageCustomTrigger(value);
        }
        window.B2UIRenderer.closeModal("modal-language-select");
      });
    });

    const themeBtn = document.getElementById("b2-theme-toggle-btn");
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = this.currentTheme === "dark" ? "light" : "dark";
        this.applyTheme(nextTheme);
      });
    }

    // ----------------------------------------------------------------
    // I. BUSCA DINÂMICA NA DASHBOARD E ABAS
    // ----------------------------------------------------------------
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        window.B2UIRenderer.renderBlockchainList(this.blockchainData, e.target.value);
      });
    }

    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tabTarget = btn.getAttribute("data-tab");

        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".tab-content").forEach(content => {
          content.style.display = "none";
          content.classList.remove("active");
        });

        const activeContent = document.getElementById(`tab-content-${tabTarget}`);
        if (activeContent) {
          activeContent.style.display = "flex";
          activeContent.classList.add("active");
        }

        if (tabTarget === "tokens") {
          window.B2UIRenderer.renderBlockchainList(this.blockchainData);
        } else if (tabTarget === "nfts") {
          window.B2UIRenderer.renderNFTsGaller(this.activeChainKey);
        } else if (tabTarget === "history") {
          window.B2UIRenderer.renderHistoryTransactions(this.activeChainKey);
        } else if (tabTarget === "features") {
          const activeChain = this.blockchainData.find(c => c.key === this.activeChainKey) || this.blockchainData[0];
          window.B2UIRenderer.renderCustomProtocolCard(activeChain, this.blockchainData);
        }
      });
    });

    // ----------------------------------------------------------------
    // J. CONFIGURAÇÕES
    // ----------------------------------------------------------------
    const btnExportConfig = document.getElementById("btn-export-backup");
    if (btnExportConfig) {
      btnExportConfig.addEventListener('click', () => {
        this.exportConfigSecure();
      });
    }

    const btnTriggerImport = document.getElementById("btn-trigger-import");
    const fileInput = document.getElementById("import-file-input");
    if (btnTriggerImport && fileInput) {
      btnTriggerImport.addEventListener('click', () => {
        fileInput.click();
      });
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
          await this.importConfigSecure(evt.target.result);
        };
        reader.readAsText(file);
      });
    }

    const btnChangePwd = document.getElementById("btn-change-pwd-submit");
    if (btnChangePwd) {
      btnChangePwd.addEventListener('click', async () => {
        const oldPwd = document.getElementById("change-pwd-old").value;
        const newPwd = document.getElementById("change-pwd-new").value;

        if (!oldPwd || !newPwd) {
          window.B2Toast.alert("Campos Vazios", "Por favor, preencha os campos de senha.", "warning");
          return;
        }

        try {
          await this.changeUserPassword(oldPwd, newPwd);
          document.getElementById("change-pwd-old").value = "";
          document.getElementById("change-pwd-new").value = "";
          window.B2Toast.alert("Senha Alterada", window.B2Translations[this.currentLanguage]?.pwdChangeSuccess || "Senha alterada com sucesso!", "success");
        } catch (err) {
          window.B2Toast.alert("Erro ao Alterar", err.message, "error");
        }
      });
    }

    const btnLockNow = document.getElementById("btn-lock-now");
    if (btnLockNow) {
      btnLockNow.addEventListener('click', () => {
        this.lockWallet();
      });
    }

    const btnServicesAd = document.getElementById("btn-services-contact");
    if (btnServicesAd) {
      btnServicesAd.addEventListener("click", () => {
        const text = encodeURIComponent("Olá, gostaria de solicitar um orçamento para desenvolvimento de software / blockchain / sistemas web.");
        window.open(`https://wa.me/5511974289097?text=${text}`, '_blank');
      });
    }

    const btnUnlockBiometric = document.getElementById("unlock-biometric-btn");
    if (btnUnlockBiometric) {
      btnUnlockBiometric.addEventListener("click", () => {
        this.tryBiometricUnlock();
      });
    }

    const sourceSelector = document.getElementById("price-source-selector");

    // Helper to update Price Source trigger text & icon & modal selected states
    const updatePriceSourceCustomTrigger = (value) => {
      const triggerLabel = document.getElementById("price-source-custom-value");
      const triggerIcon = document.getElementById("price-source-custom-icon");
      if (!triggerLabel || !triggerIcon) return;

      const mapping = {
        "auto": { icon: "⚡", label: "Automático (Cascading Priority)" },
        "coingecko": { icon: "🦎", label: "CoinGecko API" },
        "yahoofinance": { icon: "💜", label: "Yahoo Finance Crypto" },
        "dex": { icon: "🦄", label: "DEX Subgraphs (Uniswap V3)" }
      };

      const selected = mapping[value] || mapping["auto"];
      triggerLabel.textContent = selected.label;
      triggerIcon.textContent = selected.icon;

      // Update active checks in the modal cards
      document.querySelectorAll(".price-source-option-card").forEach(card => {
        const check = card.querySelector(".inner-dot");
        if (check) {
          check.style.display = (card.getAttribute("data-value") === value) ? "block" : "none";
        }
      });
    };

    if (sourceSelector) {
      const currentVal = window.B2PriceOracle.activeSource || "auto";
      sourceSelector.value = currentVal;
      updatePriceSourceCustomTrigger(currentVal);

      sourceSelector.addEventListener("change", (e) => {
        const val = e.target.value;
        window.B2PriceOracle.setSource(val);
        updatePriceSourceCustomTrigger(val);
        if (this.decryptedSeed) {
          this.updateNetworkBalances();
        }
      });
    }

    // Modal Price Source Toggle Event Listeners
    const customPriceTrigger = document.getElementById("price-source-custom-trigger");
    const modalPriceSource = document.getElementById("modal-price-source");
    const btnClosePriceSource = document.getElementById("btn-close-price-source");

    if (customPriceTrigger && modalPriceSource) {
      customPriceTrigger.addEventListener("click", () => {
        const currentVal = sourceSelector ? sourceSelector.value : (window.B2PriceOracle.activeSource || "auto");
        updatePriceSourceCustomTrigger(currentVal);
        window.B2UIRenderer.openModal("modal-price-source");
      });
    }

    if (btnClosePriceSource && modalPriceSource) {
      btnClosePriceSource.addEventListener("click", () => {
        window.B2UIRenderer.closeModal("modal-price-source");
      });
    }

    // Modal Price Source Options Selection
    document.querySelectorAll(".price-source-option-card").forEach(card => {
      card.addEventListener("click", () => {
        const value = card.getAttribute("data-value");
        if (sourceSelector) {
          sourceSelector.value = value;
          sourceSelector.dispatchEvent(new Event("change"));
        } else {
          window.B2PriceOracle.setSource(value);
          updatePriceSourceCustomTrigger(value);
          if (this.decryptedSeed) {
            this.updateNetworkBalances();
          }
        }
        window.B2UIRenderer.closeModal("modal-price-source");
      });
    });

    // Modal Blockchain Selector Event Listeners
    const blockchainTrigger = document.getElementById("blockchain-selector-trigger");
    const modalBlockchainSelect = document.getElementById("modal-blockchain-select");
    const btnCloseBlockchainSelect = document.getElementById("btn-close-blockchain-select");
    const modalBlockchainSearch = document.getElementById("modal-blockchain-search");

    if (blockchainTrigger && modalBlockchainSelect) {
      blockchainTrigger.addEventListener("click", () => {
        if (modalBlockchainSearch) {
          modalBlockchainSearch.value = "";
        }
        window.B2UIRenderer.renderModalBlockchainList(this.blockchainData, this.activeChainKey, "");
        window.B2UIRenderer.openModal("modal-blockchain-select");
        if (modalBlockchainSearch) {
          modalBlockchainSearch.focus();
        }
      });
    }

    if (btnCloseBlockchainSelect && modalBlockchainSelect) {
      btnCloseBlockchainSelect.addEventListener("click", () => {
        window.B2UIRenderer.closeModal("modal-blockchain-select");
      });
    }

    const btnModalAddNetworkShortcut = document.getElementById("btn-modal-add-network-shortcut");
    if (btnModalAddNetworkShortcut) {
      btnModalAddNetworkShortcut.addEventListener("click", () => {
        window.B2UIRenderer.closeModal("modal-blockchain-select");
        window.B2UIRenderer.openModal("modal-add-network");
      });
    }

    if (modalBlockchainSearch) {
      modalBlockchainSearch.addEventListener("input", (e) => {
        const query = e.target.value;
        window.B2UIRenderer.renderModalBlockchainList(this.blockchainData, this.activeChainKey, query);
      });
    }

    // General window click event to close modals when clicking on the backdrop
    window.addEventListener("click", (e) => {
      if (e.target === modalPriceSource) {
        window.B2UIRenderer.closeModal("modal-price-source");
      }
      if (e.target === modalBlockchainSelect) {
        window.B2UIRenderer.closeModal("modal-blockchain-select");
      }
      const modalLanguageSelect = document.getElementById("modal-language-select");
      if (e.target === modalLanguageSelect) {
        window.B2UIRenderer.closeModal("modal-language-select");
      }
      const modalMoreOptions = document.getElementById("modal-more-options");
      if (e.target === modalMoreOptions) {
        window.B2UIRenderer.closeModal("modal-more-options");
      }
    });

    // ----------------------------------------------------------------
    // J2. TESTNET & MODE SWITCHER
    // ----------------------------------------------------------------
    const btnMoreOptions = document.getElementById("btn-more-options");
    const modalMoreOptions = document.getElementById("modal-more-options");
    const btnCloseMoreOptions = document.getElementById("btn-close-more-options");
    const switchEnableTestnet = document.getElementById("switch-enable-testnet");
    const networkModeSwitcher = document.getElementById("network-mode-switcher");

    if (btnMoreOptions) {
      btnMoreOptions.addEventListener("click", () => {
        window.B2UIRenderer.openModal("modal-more-options");
      });
    }

    if (btnCloseMoreOptions) {
      btnCloseMoreOptions.addEventListener("click", () => {
        window.B2UIRenderer.closeModal("modal-more-options");
      });
    }

    // Helper para atualizar o visual e sincronismo do switcher de rede no header
    const updateNetworkSwitcherUI = () => {
      if (!networkModeSwitcher) return;
      if (this.testnetEnabled) {
        networkModeSwitcher.style.display = "inline-flex";
        networkModeSwitcher.className = `b2-network-switcher ${this.networkMode}`;
        networkModeSwitcher.textContent = this.networkMode === "testnet" ? "Testnet" : "Mainnet";
      } else {
        networkModeSwitcher.style.display = "none";
      }
    };

    if (switchEnableTestnet) {
      // Sincronizar estado inicial do toggle
      switchEnableTestnet.checked = this.testnetEnabled;

      switchEnableTestnet.addEventListener("change", (e) => {
        const enabled = e.target.checked;
        this.testnetEnabled = enabled;
        localStorage.setItem("b2_testnet_enabled", enabled ? "true" : "false");

        if (!enabled) {
          // Desativar força o retorno para mainnet imediato
          this.networkMode = "mainnet";
          localStorage.setItem("b2_network_mode", "mainnet");

          this.rebuildBlockchainData();
          this.deriveAllAddresses();

          // Limpa saldos e atualiza
          this.blockchainData.forEach(c => {
            c.balanceCrypto = 0.0;
            c.balanceFiat = 0.0;
          });
          if (this.decryptedSeed) {
            this.updateNetworkBalances();
          }

          // Re-renderiza views
          if (window.B2UIRenderer) {
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.setActiveChain(this.activeChainKey);
          }
        }

        updateNetworkSwitcherUI();
      });
    }

    if (networkModeSwitcher) {
      // Sincronizar estado inicial e visibilidade do switcher
      updateNetworkSwitcherUI();

      networkModeSwitcher.addEventListener("click", () => {
        const newMode = this.networkMode === "mainnet" ? "testnet" : "mainnet";
        this.networkMode = newMode;
        localStorage.setItem("b2_network_mode", newMode);

        updateNetworkSwitcherUI();

        // Reconstrói chains filtrando / aplicando overrides
        this.rebuildBlockchainData();
        this.deriveAllAddresses();

        // Limpa saldos e força novo fetch real
        this.blockchainData.forEach(c => {
          c.balanceCrypto = 0.0;
          c.balanceFiat = 0.0;
        });
        if (this.decryptedSeed) {
          this.updateNetworkBalances();
        }

        // Re-renderiza views
        if (window.B2UIRenderer) {
          window.B2UIRenderer.renderBlockchainList(this.blockchainData);
          window.B2UIRenderer.renderActiveDashboard && window.B2UIRenderer.renderActiveDashboard();
          this.setActiveChain(this.activeChainKey);
        }
      });
    }

    // ----------------------------------------------------------------
    // K. INTERATIVIDADE E SIMULADOR WEB3 BROWSER SHELL (DAPPS)
    // ----------------------------------------------------------------
    const tabs = document.querySelectorAll(".browser-tabs .browser-tab");
    const consoleLog = document.getElementById("playground-console");

    const logToConsole = (msg, type = "info") => {
      if (consoleLog) {
        const entry = document.createElement("div");
        entry.className = `console-entry ${type}`;
        entry.innerHTML = `[${new Date().toLocaleTimeString()}] <span>${msg}</span>`;
        consoleLog.appendChild(entry);
        consoleLog.scrollTop = consoleLog.scrollHeight;
      }
    };

    // Tab switcher
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const dapp = tab.getAttribute("data-dapp");
        const url = tab.getAttribute("data-url");

        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        document.querySelectorAll(".browser-viewport .browser-tab-content").forEach(content => {
          content.classList.remove("active");
        });
        const targetContent = document.getElementById("dapp-" + dapp);
        if (targetContent) targetContent.classList.add("active");

        const urlBar = document.getElementById("browser-current-url");
        if (urlBar) urlBar.textContent = url;

        const netBadgeName = document.getElementById("browser-active-network-name");
        if (netBadgeName) {
          if (dapp === 'uniswap') {
            netBadgeName.textContent = "ETH (MAINNET)";
          } else if (dapp === 'waves-lease') {
            netBadgeName.textContent = "WAVES (MAINNET)";
          } else if (dapp === 'nft-creator') {
            netBadgeName.textContent = "SOLANA (MAINNET)";
          }
        }

        // Auto connection prompt when user opens Waves LPoS Lease or other tabs
        if (dapp === 'waves-lease') {
          const isDisconnected = document.getElementById("lease-badge-text")?.textContent.includes("Desconectado");
          if (isDisconnected && this.decryptedSeed) {
            logToConsole("Iniciando requisição de conexão para o Waves Lease Portal...", "info");
            window.postMessage({
              source: 'b2-wallet-sdk',
              id: 'waves_connect',
              method: 'connect',
              params: {}
            }, '*');
          }
        }
      });
    });

    // Clear console
    const btnClearConsole = document.getElementById("btn-clear-console");
    if (btnClearConsole) {
      btnClearConsole.addEventListener('click', () => {
        if (consoleLog) {
          consoleLog.innerHTML = '<div class="console-entry"><span>[Bridge System] Console limpo pelo usuário.</span><button class="console-entry-copy-btn">COPIAR</button></div>';
        }
      });
    }

    // Copy All Console
    const btnCopyAllConsole = document.getElementById("btn-copy-all-console");
    if (btnCopyAllConsole && consoleLog) {
      btnCopyAllConsole.addEventListener('click', () => {
        const entries = consoleLog.querySelectorAll('.console-entry span');
        const textToCopy = Array.from(entries).map(span => span.innerText).join('\n');
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalText = btnCopyAllConsole.innerText;
          btnCopyAllConsole.innerText = "COPIADO!";
          setTimeout(() => {
            btnCopyAllConsole.innerText = originalText;
          }, 1500);
        }).catch(err => {
          console.error("Erro ao copiar todo o console: ", err);
        });
      });
    }

    // Event delegation on playground-console for copying single entries
    if (consoleLog) {
      consoleLog.addEventListener('click', (e) => {
        if (e.target.classList.contains('console-entry-copy-btn')) {
          e.stopPropagation();
          const entrySpan = e.target.previousElementSibling;
          if (entrySpan) {
            const textToCopy = entrySpan.innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
              const originalText = e.target.innerText;
              e.target.innerText = "COPIADO!";
              setTimeout(() => {
                e.target.innerText = originalText;
              }, 1500);
            }).catch(err => {
              console.error("Erro ao copiar entrada do console: ", err);
            });
          }
        }
      });
    }

    // Uniswap Events
    const revBtn = document.getElementById("uniswap-reverse-btn");
    if (revBtn) {
      revBtn.addEventListener('click', () => {
        revBtn.style.transform = (revBtn.style.transform === "rotate(180deg)") ? "rotate(0deg)" : "rotate(180deg)";
      });
    }

    const fromAmt = document.getElementById("uniswap-from-amount");
    const toAmt = document.getElementById("uniswap-to-amount");
    if (fromAmt && toAmt) {
      fromAmt.addEventListener('input', () => {
        const val = parseFloat(fromAmt.value) || 0;
        toAmt.value = (val * 3450.25).toFixed(2);
      });
    }

    const btnUniswapConnect = document.getElementById("btn-uniswap-connect");
    if (btnUniswapConnect) {
      btnUniswapConnect.addEventListener('click', () => {
        logToConsole("Solicitando autorização de conexão do Uniswap V4 à B2 Wallet...", "info");
        window.postMessage({
          source: 'b2-wallet-sdk',
          id: 'uniswap_connect',
          method: 'connect',
          params: {}
        }, '*');
      });
    }

    const btnUniswapSwap = document.getElementById("btn-uniswap-swap");
    if (btnUniswapSwap) {
      btnUniswapSwap.addEventListener('click', () => {
        if (!this.decryptedSeed) {
          window.showToast("Por favor, desbloqueie a sua B2 Wallet primeiro.", "warning");
          return;
        }
        const val = parseFloat(fromAmt.value) || 0;
        if (val <= 0) {
          window.showToast("Por favor, digite um valor maior que zero para o swap.", "warning");
          return;
        }
        logToConsole(`Enviando solicitação de swap de ${val} ETH via SDK...`, "info");
        window.postMessage({
          source: 'b2-wallet-sdk',
          id: 'uniswap_swap',
          method: 'sign_transaction',
          params: {
            network: 'ETH',
            transaction: {
              to: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
              value: (val * 1e18).toString()
            }
          }
        }, '*');
      });
    }

    // Waves Lease Node Selection & Click Events
    const nodeCards = document.querySelectorAll(".lease-node-grid .lease-node-card");
    nodeCards.forEach(card => {
      card.addEventListener('click', () => {
        nodeCards.forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        const nodeName = card.getAttribute("data-node-name") || "Validador";
        logToConsole(`Selecionado o validador: ${nodeName}`, "info");
      });
    });

    const btnDappLease = document.getElementById("btn-dapp-lease");
    if (btnDappLease) {
      btnDappLease.addEventListener('click', () => {
        if (!this.decryptedSeed) {
          window.showToast("Por favor, desbloqueie a sua B2 Wallet primeiro.", "warning");
          return;
        }
        const selectedNode = document.querySelector(".lease-node-grid .lease-node-card.selected");
        const nodeAddr = selectedNode ? selectedNode.getAttribute("data-node-addr") : "3P8B2BrasilValidatorNodeLease7H9o";
        const nodeName = selectedNode ? selectedNode.getAttribute("data-node-name") : "WavesBrasil Node";
        const amount = parseFloat(document.getElementById("dapp-lease-amount").value) || 0;

        if (amount <= 0) {
          window.showToast("Por favor, digite uma quantidade maior que zero.", "warning");
          return;
        }

        const activeChain = this.blockchainData.find(c => c.key === 'WAVES');
        const sym = activeChain ? activeChain.symbol : 'WAVES';
        logToConsole(`Iniciando arrendamento real de ${amount} ${sym} para o nó "${nodeName}"...`, "info");
        // Chama startLPoSLease que agora faz broadcast real na blockchain
        this.startLPoSLease('WAVES', nodeAddr, nodeName, amount);
      });
    }

    // NFT Studio Events
    const nftGrad = document.getElementById("nft-dapp-gradient");
    const nftPreviewBox = document.getElementById("nft-dapp-preview-box");
    if (nftGrad && nftPreviewBox) {
      nftGrad.addEventListener('change', () => {
        nftPreviewBox.style.background = nftGrad.value;
        logToConsole(`Visualização de gradiente NFT atualizada.`, "info");
      });
    }

    const nftNameInput = document.getElementById("nft-dapp-name");
    const nftPreviewId = document.getElementById("nft-dapp-preview-id");
    if (nftNameInput && nftPreviewId) {
      nftNameInput.addEventListener('input', () => {
        nftPreviewId.textContent = nftNameInput.value ? nftNameInput.value.substring(0, 14) : "NFT #00";
      });
    }

    const btnNftConnect = document.getElementById("btn-nft-connect");
    if (btnNftConnect) {
      btnNftConnect.addEventListener('click', () => {
        logToConsole("Solicitando conexão do NFT Mint Studio à B2 Wallet...", "info");
        window.postMessage({
          source: 'b2-wallet-sdk',
          id: 'nft_connect',
          method: 'connect',
          params: {}
        }, '*');
      });
    }

    const btnNftMint = document.getElementById("btn-nft-mint");
    if (btnNftMint) {
      btnNftMint.addEventListener('click', () => {
        if (!this.decryptedSeed) {
          window.showToast("Por favor, desbloqueie a sua B2 Wallet primeiro.", "warning");
          return;
        }
        const nftName = nftNameInput ? nftNameInput.value : "Cyber Shield Tech";
        logToConsole(`Iniciando cunhagem do NFT "${nftName}"...`, "info");
        window.postMessage({
          source: 'b2-wallet-sdk',
          id: 'nft_mint_tx',
          method: 'sign_transaction',
          params: {
            network: 'SOLANA',
            transaction: {
              to: 'MintStudioContractAddressPool',
              value: '0'
            }
          }
        }, '*');
      });
    }

    // Listen to bridge SDK responses
    window.addEventListener('message', (event) => {
      if (!event.data || event.data.source !== 'b2-wallet-core') return;

      const { id, result, error } = event.data;
      if (error) {
        logToConsole(`FALHA RPC (ID: ${id}): ${error}`, "danger");
      } else {
        logToConsole(`SUCESSO RPC (ID: ${id}): ${JSON.stringify(result)}`, "success");

        if (id === 'uniswap_connect') {
          const dot = document.getElementById("uniswap-badge-dot");
          const txt = document.getElementById("uniswap-badge-text");
          if (dot) dot.classList.add("connected");
          if (txt) txt.textContent = "Status: Conectado";
          if (btnUniswapSwap) btnUniswapSwap.removeAttribute("disabled");
          if (btnUniswapConnect) btnUniswapConnect.setAttribute("disabled", "true");
        }
        if (id === 'waves_connect') {
          const dot = document.getElementById("lease-badge-dot");
          const txt = document.getElementById("lease-badge-text");
          if (dot) dot.classList.add("connected");
          if (txt) txt.textContent = "Conectado";
          if (btnDappLease) btnDappLease.removeAttribute("disabled");
        }
        if (id === 'nft_connect') {
          const dot = document.getElementById("nft-badge-dot");
          const txt = document.getElementById("nft-badge-text");
          if (dot) dot.classList.add("connected");
          if (txt) txt.textContent = "Conectado";
          if (btnNftMint) btnNftMint.removeAttribute("disabled");
          if (btnNftConnect) btnNftConnect.setAttribute("disabled", "true");
        }

        // Custom transaction processing triggers
        if (id === 'uniswap_swap') {
          const ethSwapAmt = parseFloat(fromAmt.value) || 0;
          const usdcGained = ethSwapAmt * 3450.25;
          this.uniswapUsdcBalance = (this.uniswapUsdcBalance || 0) + usdcGained;
          this.updateSimulatorBalances();
          window.showToast(`Swap concluído! Recebeu ${usdcGained.toFixed(2)} USDC`, "success");
        }
        if (id === 'waves_lease_tx') {
          const amount = parseFloat(document.getElementById("dapp-lease-amount").value) || 0;
          const wavesChain = this.blockchainData.find(c => c.key === 'WAVES');
          const wSym = wavesChain ? wavesChain.symbol : 'WAVES';
          window.showToast(`Arrendamento de ${amount} ${wSym} concluído com sucesso!`, "success");
        }
        if (id === 'nft_mint_tx') {
          const nftName = (nftNameInput ? nftNameInput.value : "") || "Cyber Shield Tech";
          const gradient = (nftGrad ? nftGrad.value : "") || "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)";
          this.mintCustomNFT(nftName, gradient);
        }
      }
    });

    // Inits dos novos modals de gerenciamento de contas
    this._initEditAccountModal();
    this._initViewKeysModal();
};
