/**
 * B2 Wallet - Módulo de Transações, Taxas e Modais de Envio/Recebimento de B2WalletApp.
 */

B2WalletApp.prototype.addTransaction = function(chainKey, tx) {
    const key = `b2_tx_history_${chainKey}`;
    const txs = JSON.parse(localStorage.getItem(key) || "[]");

    const txId = tx.id || tx.txHash;
    if (!txId) {
      throw new Error(`[addTransaction] Não é permitido adicionar transações sem um ID real na rede ${chainKey}.`);
    }

    const newTx = {
      id: txId,
      txHash: txId,
      chainKey,          // chave da rede (ex: "BTC", "ETH") — usado pelo renderer para lookup correto
      time: "Agora mesmo",
      timestamp: Date.now(),
      status: "Confirmado",
      ...tx
    };
    txs.unshift(newTx);
    localStorage.setItem(key, JSON.stringify(txs));
    return newTx;
  };

B2WalletApp.prototype.updateTransactionStatus = function(chainKey, txId, newStatus, extraData = {}) {
    const key = `b2_tx_history_${chainKey}`;
    const txs = JSON.parse(localStorage.getItem(key) || "[]");
    const txIndex = txs.findIndex(t => t.id === txId || (t.txHash && t.txHash === txId));
    if (txIndex !== -1) {
      const realTxHash = extraData.txHash || extraData.id || txs[txIndex].txHash || txs[txIndex].id || txId;
      txs[txIndex] = {
        ...txs[txIndex],
        id: realTxHash,
        txHash: realTxHash,   // campo dedicado ao hash real da blockchain (nunca sobrescrito por id aleatório)
        chainKey: txs[txIndex].chainKey || chainKey,  // preserva chainKey se já existia
        status: newStatus,
        ...extraData
      };
      localStorage.setItem(key, JSON.stringify(txs));
      if (this.activeChainKey === chainKey) {
        window.B2UIRenderer.renderHistoryTransactions(chainKey);
      }
      return true;
    }
    return false;
  };

B2WalletApp.prototype._pollEVMTransactionReceipt = function(chain, txHash, localTxId, amt, feeData, price) {
    let attempts = 0;
    const maxAttempts = 30;
    const interval = 5000;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        if (window.B2Logger) {
          window.B2Logger.log('warn', `[EVM Polling] Limite de tentativas atingido para TX: ${txHash}. Mantendo status como Pendente.`);
        }
        return;
      }
      attempts++;

      try {
        const res = await fetch(chain.nodeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: Date.now(),
            method: "eth_getTransactionReceipt",
            params: [txHash]
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.result) {
            const status = json.result.status;
            if (status === "0x1") {
              this.updateTransactionStatus(chain.key, localTxId, "Confirmado");
              if (window.B2Logger) {
                window.B2Logger.log('success', `[EVM Polling] Transação confirmada com sucesso: ${txHash}`);
              }
              this.updateNetworkBalances();
              return;
            } else if (status === "0x0") {
              this.updateTransactionStatus(chain.key, localTxId, "Falhou (Erro EVM)");
              if (window.B2Logger) {
                window.B2Logger.log('error', `[EVM Polling] Transação falhou (revert) na blockchain: ${txHash}`);
              }
              chain.balanceCrypto += amt + feeData.feeCrypto;
              chain.balanceFiat = chain.balanceCrypto * (price || 0);
              window.B2UIRenderer.renderBlockchainList(this.blockchainData);
              this.updateTotalBalanceDisplay();
              this.updateNetworkBalances();
              return;
            }
          }
        }
      } catch (e) {
        console.error("Error polling EVM receipt:", e);
      }

      setTimeout(poll, interval);
    };

    setTimeout(poll, interval);
  };

B2WalletApp.prototype.decodeAbiString = function(hex) {
    if (!hex || hex === '0x') return '';
    let clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (clean.length >= 128) {
      try {
        const offset = parseInt(clean.slice(0, 64), 16);
        const length = parseInt(clean.slice(64, 128), 16);
        if (offset === 32 && length > 0 && clean.length >= 128 + length * 2) {
          const stringHex = clean.slice(128, 128 + length * 2);
          let str = '';
          for (let i = 0; i < stringHex.length; i += 2) {
            const charCode = parseInt(stringHex.slice(i, i + 2), 16);
            if (charCode > 0) str += String.fromCharCode(charCode);
          }
          return str.trim();
        }
      } catch (e) {
        console.warn("Standard ABI string decode failed:", e);
      }
    }
    try {
      let str = '';
      for (let i = 0; i < clean.length; i += 2) {
        const charCode = parseInt(clean.slice(i, i + 2), 16);
        if (charCode > 0 && charCode < 128) {
          str += String.fromCharCode(charCode);
        }
      }
      return str.trim();
    } catch (e) {
      return '';
    }
  };

B2WalletApp.prototype.fetchErc20TokenMetadata = async function(contractAddress, nodeUrl) {
    const callRpc = async (data) => {
      const res = await fetch(nodeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "eth_call",
          params: [{ to: contractAddress, data }, "latest"]
        })
      });
      if (!res.ok) throw new Error("RPC error");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message || "RPC error");
      return json.result;
    };

    try {
      const [nameHex, symbolHex, decimalsHex] = await Promise.all([
        callRpc("0x06fdde03").catch(() => null),
        callRpc("0x95d89b41").catch(() => null),
        callRpc("0x313ce567").catch(() => null)
      ]);

      if (!nameHex || nameHex === "0x" || !symbolHex || symbolHex === "0x" || !decimalsHex || decimalsHex === "0x") {
        throw new Error("Invalid ERC-20 contract");
      }

      const name = this.decodeAbiString(nameHex);
      const symbol = this.decodeAbiString(symbolHex);
      const decimals = parseInt(decimalsHex, 16);

      if (!name || !symbol || isNaN(decimals)) {
        throw new Error("Decoding failed");
      }

      return { name, symbol, decimals };
    } catch (e) {
      console.error("fetchErc20TokenMetadata error:", e);
      throw e;
    }
  };

B2WalletApp.prototype.fetchTokenDetails = async function(chainKey, token) {
    if (token) {
      const tokenIdentifier = token.assetId || token.symbol || token.contractAddress;
      if (tokenIdentifier && this.checkMaintenanceToken(tokenIdentifier)) {
        return;
      }
    }

    if (window.B2TokenRegistry && typeof window.B2TokenRegistry.enrichToken === 'function') {
      token = window.B2TokenRegistry.enrichToken(chainKey, token);
    }

    const chain = this.blockchainData.find(c => c.key === chainKey) || {};
    const engine = chain.engine || '';
    const nodeUrl = chain.nodeUrl || chain.rpc || null;
    const assetId = token.assetId || token.address || token.contractAddress;

    const result = { chain: chainKey, assetId, fetchedAt: Date.now(), details: null, error: null };

    const langDict = window.B2Translations[this.currentLanguage] || window.B2Translations['en'];

    // Set loading message
    const modalBody = document.getElementById('modal-token-detail-body');
    if (modalBody) {
      modalBody.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);"><span class="loading-spinner"></span> ${langDict.tokenDetailLoading || "Carregando..."}</div>`;
    }
    window.B2UIRenderer && window.B2UIRenderer.openModal && window.B2UIRenderer.openModal('modal-token-detail');

    try {
      if (token.isNative || assetId === 'Nativo' || !assetId) {
        result.details = {
          [langDict.tokenDetailCurrency || "Currency"]: chain.symbol,
          [langDict.tokenDetailName || "Name"]: chain.name,
          [langDict.tokenDetailAlgorithm || "Algorithm"]: (chain.key === 'AMZX') ? 'AMZX Network' : (chain.key === 'PLO' ? 'PlanetOne Network' : (chain.engine || 'Waves Core')),
          [langDict.tokenDetailDecimals || "Decimals"]: chain.decimals || 8,
          [langDict.tokenDetailType || "Type"]: langDict.tokenDetailNativeCurrency || "Moeda Nativa do Protocolo",
          [langDict.tokenDetailConsensus || "Consensus"]: chain.engine === 'Waves' ? 'LPoS (Leased Proof of Stake)' : (chain.engine === 'EVM' ? 'PoSA / PoS' : 'Proof of Work (PoW)')
        };
      } else if (engine === 'Waves' && nodeUrl) {
        const sanitizedUrl = nodeUrl.replace(/\/+$/, "");
        const url = `${sanitizedUrl}/assets/details/${assetId}`;
        const res = await fetch(url).then(r => {
          if (!r.ok) throw new Error(`Nó retornou HTTP ${r.status}`);
          return r.json();
        });
        result.details = {
          [langDict.tokenDetailAssetId || "Asset ID"]: res.assetId,
          [langDict.tokenDetailName || "Name"]: res.name,
          [langDict.tokenDetailSymbol || "Symbol"]: token.symbol || res.name,
          [langDict.tokenDetailDecimals || "Decimals"]: res.decimals,
          [langDict.tokenDetailIssuer || "Issuer"]: res.issuer,
          [langDict.tokenDetailTotalSupply || "Total Supply"]: (res.quantity / Math.pow(10, res.decimals)).toLocaleString('en-US'),
          [langDict.tokenDetailReissuable || "Reissuable"]: res.reissuable ? (langDict.tokenDetailYes || "Sim") : (langDict.tokenDetailNo || "Não"),
          [langDict.tokenDetailScripted || "Scripted"]: res.scripted ? (langDict.tokenDetailYes || "Sim") : (langDict.tokenDetailNo || "Não"),
          [langDict.tokenDetailIssueTimestamp || "Issue Timestamp"]: new Date(res.issueTimestamp).toLocaleString()
        };
      } else if (engine === 'EVM' && nodeUrl) {
        const callRpc = async (data) => {
          const res = await fetch(nodeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_call",
              params: [{ to: assetId, data }, "latest"]
            })
          });
          const json = await res.json();
          return json.result;
        };

        let totalSupplyStr = "Desconhecido";
        try {
          const resHex = await callRpc("0x18160ddd"); // totalSupply()
          if (resHex && resHex !== "0x") {
            const supplyBig = BigInt(resHex);
            totalSupplyStr = (Number(supplyBig) / Math.pow(10, token.decimals || 18)).toLocaleString('en-US');
          }
        } catch (e) {
          console.warn("Failed to fetch EVM token supply:", e);
        }

        const registryMeta = window.B2TokenRegistry && typeof window.B2TokenRegistry.getMetadata === 'function'
          ? window.B2TokenRegistry.getMetadata(chainKey, assetId)
          : null;
        if (totalSupplyStr === "Desconhecido" && registryMeta && registryMeta.totalSupply) {
          totalSupplyStr = registryMeta.totalSupply.toLocaleString('en-US');
        }

        result.details = {
          [langDict.tokenDetailContract || "Contract"]: assetId,
          [langDict.tokenDetailName || "Name"]: token.name,
          [langDict.tokenDetailSymbol || "Symbol"]: token.symbol,
          [langDict.tokenDetailDecimals || "Decimals"]: token.decimals || 18,
          [langDict.tokenDetailTotalSupply || "Total Supply"]: totalSupplyStr,
          [langDict.tokenDetailPattern || "Pattern"]: "ERC-20 Token"
        };
      } else {
        const registryMeta = window.B2TokenRegistry && typeof window.B2TokenRegistry.getMetadata === 'function'
          ? window.B2TokenRegistry.getMetadata(chainKey, assetId)
          : null;
        const totalOfflineSupply = registryMeta && registryMeta.totalSupply ? registryMeta.totalSupply.toLocaleString('en-US') : "Desconhecido";

        result.details = {
          [langDict.tokenDetailAddressId || "Address/ID"]: assetId,
          [langDict.tokenDetailName || "Name"]: token.name,
          [langDict.tokenDetailSymbol || "Symbol"]: token.symbol,
          [langDict.tokenDetailDecimals || "Decimals"]: token.decimals || 9,
          [langDict.tokenDetailTotalSupply || "Total Supply"]: totalOfflineSupply,
          [langDict.tokenDetailPattern || "Pattern"]: "SPL Token"
        };
      }
    } catch (e) {
      result.error = e.message || String(e);
    }

    if (modalBody) {
      if (result.error) {
        modalBody.innerHTML = `
          <div style="padding:16px;color:var(--text-danger);text-align:center;">
            <strong>${langDict.tokenDetailError || "Erro ao obter detalhes:"}</strong><br>
            <span style="font-size:0.8rem;font-family:monospace;word-break:break-all;">${result.error}</span>
          </div>`;
      } else {
        let detailsHtml = `
          <div style="display: flex; flex-direction: column; gap: var(--space-4); color: var(--text-primary);">
            <!-- Header Card com Logo/Símbolo -->
            <div style="display:flex;align-items:center;gap:var(--space-3);border-bottom:1px solid var(--border-subtle);padding-bottom:var(--space-3);">
              <div style="position:relative;width:44px;height:44px;flex-shrink:0;">
                ${token.imageURL ? `
                <img src="${token.imageURL}" alt="${token.symbol}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;border:1px solid var(--border-light);box-shadow:0 0 15px ${chain.color || 'var(--color-primary)'}33;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                ` : ''}
                <div style="width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg, ${chain.color || 'var(--color-primary)'} 0%, rgba(255,255,255,0.05) 100%);display:${token.imageURL ? 'none' : 'flex'};justify-content:center;align-items:center;box-shadow:0 0 15px ${chain.color || 'var(--color-primary)'}44; border: 1px solid var(--border-light);">
                  <span style="font-family:var(--font-mono);font-size:var(--text-xs);font-weight:var(--fw-bold);color:#fff;text-shadow: 0 0 8px rgba(255,255,255,0.5);">${token.symbol ? token.symbol.substring(0, 4) : 'TKN'}</span>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;">
                <span style="font-size:var(--text-md);font-weight:var(--fw-bold);color:var(--text-primary);letter-spacing:0.02em;">${token.name || chain.name}</span>
                <span style="font-family:var(--font-mono);font-size:var(--text-3xs);color:${chain.color || 'var(--color-primary)'};letter-spacing:0.08em;text-transform:uppercase;font-weight:var(--fw-bold);">${chain.name || 'Network'}</span>
              </div>
            </div>

            <!-- Descrição (se houver) -->
            ${token.description ? `
            <div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:8px;padding:12px;margin-bottom:4px;backdrop-filter:blur(10px);">
              <span style="font-weight:var(--fw-semibold);color:var(--text-muted);font-size:var(--text-2xs);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px;">${langDict.tokenDetailAbout || "Sobre o Token"}</span>
              <p style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.5;margin:0;">${token.description}</p>
            </div>
            ` : ''}

            <!-- Redes Sociais / Website (se houver) -->
            ${(token.website || (token.socialmedias && token.socialmedias.length > 0)) ? `
            <div style="display:flex;align-items:center;gap:12px;background:var(--bg-active);border-radius:8px;padding:10px 14px;border:1px solid var(--border-subtle);backdrop-filter:blur(10px);">
              <span style="font-weight:var(--fw-semibold);color:var(--text-muted);font-size:var(--text-2xs);text-transform:uppercase;letter-spacing:0.05em;flex-grow:1;">Links oficiais</span>
              <div style="display:flex;gap:10px;align-items:center;">
                ${token.website ? `
                <a href="${token.website}" target="_blank" style="color:${chain.color || 'var(--color-primary)'};text-decoration:none;font-weight:var(--fw-bold);font-size:var(--text-xs);display:flex;align-items:center;gap:4px;" onmouseover="this.style.filter='brightness(1.2)';" onmouseout="this.style.filter='none';">
                  Website
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
                ` : ''}
                ${(token.socialmedias && token.socialmedias.length > 0) ? token.socialmedias.map(link => {
          const isTelegram = link.includes('t.me');
          const isTwitter = link.includes('x.com') || link.includes('twitter');
          const label = isTelegram ? 'Telegram' : (isTwitter ? 'Twitter / X' : 'Social');
          return `
                  <span style="color:var(--text-muted);font-size:var(--text-3xs);">|</span>
                  <a href="${link}" target="_blank" style="color:${chain.color || 'var(--color-primary)'};text-decoration:none;font-weight:var(--fw-bold);font-size:var(--text-xs);display:flex;align-items:center;gap:4px;" onmouseover="this.style.filter='brightness(1.2)';" onmouseout="this.style.filter='none';">
                    ${label}
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>`;
        }).join('') : ''}
              </div>
            </div>
            ` : ''}

            <!-- Grade de Informações -->
            <div style="display:flex;flex-direction:column;gap:14px;">
        `;
        for (const [key, value] of Object.entries(result.details)) {
          const isAddressKey = key === langDict.tokenDetailContract || key === langDict.tokenDetailAssetId || key === langDict.tokenDetailIssuer || key === langDict.tokenDetailAddressId || key === "Contrato (Smart Contract)" || key === "ID do Ativo" || key === "Emissor (Issuer)" || key === "Endereço/ID" || key === "Contract" || key === "Asset ID" || key === "Issuer" || key === "Address/ID";
          detailsHtml += `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-4);padding-bottom:10px;border-bottom:1px solid var(--border-subtle);">
              <span style="font-weight:var(--fw-semibold);color:var(--text-muted);font-size:var(--text-2xs);text-transform:uppercase;letter-spacing:0.05em;flex-shrink:0;margin-top:2px;">${key}</span>
              ${isAddressKey ? `
              <span class="selectable token-detail-copyable" data-copy-value="${value}" style="font-family:var(--font-mono);color:var(--text-primary);font-size:var(--text-xs);word-break:break-all;text-align:right;cursor:pointer;display:inline-flex;align-items:center;gap:6px;background:var(--bg-input);padding:4px 8px;border-radius:4px;border:1px solid var(--border-subtle);transition:all var(--transition-fast);" onmouseover="this.style.borderColor='${chain.color || 'var(--color-primary)'}44'; this.style.background='var(--bg-active)';" onmouseout="this.style.borderColor='var(--border-subtle)'; this.style.background='var(--bg-input)';">
                ${value}
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:${chain.color || 'var(--color-primary)'}; flex-shrink:0;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              </span>
              ` : `
              <span class="selectable" style="font-family:var(--font-mono);color:var(--text-primary);font-size:var(--text-sm);word-break:break-all;text-align:right;">${value}</span>
              `}
            </div>`;
        }

        detailsHtml += `
            </div>
            
            <!-- CTAs -->
            <div style="display:flex;gap:var(--space-2);margin-top:var(--space-2);padding-top:var(--space-3);border-top:1px solid var(--border-subtle);">
              <button id="token-detail-btn-close" class="btn btn-outline" style="flex:1;height:38px;padding:0;display:flex;justify-content:center;align-items:center;font-weight:var(--fw-bold);">${langDict.tokenDetailClose || "Fechar"}</button>
              <button id="token-detail-btn-send" class="btn btn-primary" style="flex:2;height:38px;padding:0;background:linear-gradient(135deg, ${chain.color || 'var(--color-primary)'} 0%, rgba(255,255,255,0.05) 100%);box-shadow: 0 4px 15px ${chain.color || 'var(--color-primary)'}33;border:1px solid var(--border-light);display:flex;justify-content:center;align-items:center;gap:6px;font-weight:var(--fw-bold);">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                ${langDict.tokenDetailSend || langDict.send || "Enviar"} ${token.symbol || 'Token'}
              </button>
            </div>
          </div>
        `;
        modalBody.innerHTML = detailsHtml;

        // Dynamic event binding
        const btnClose = document.getElementById('token-detail-btn-close');
        if (btnClose) {
          btnClose.addEventListener('click', () => {
            window.B2UIRenderer.closeModal('modal-token-detail');
          });
        }

        const btnSend = document.getElementById('token-detail-btn-send');
        if (btnSend) {
          btnSend.addEventListener('click', () => {
            window.B2UIRenderer.closeModal('modal-token-detail');
            this.showSendModal(chain.key, token);
          });
        }

        // Copy events
        const copyElements = modalBody.querySelectorAll('.token-detail-copyable');
        copyElements.forEach(el => {
          el.addEventListener('click', () => {
            const val = el.getAttribute('data-copy-value');
            navigator.clipboard.writeText(val);
            if (window.showToast) {
              window.showToast(langDict.addressCopied || langDict.tokenDetailCopied || 'Copiado!', 'success');
            }
          });
        });
      }
    }
  };

B2WalletApp.prototype.showReceiveModal = function(networkKey) {
    const chain = this.blockchainData.find(c => c.key === networkKey);
    const keys = this.derivedKeys[networkKey];
    if (!chain || !keys) return;

    // Atualiza título e chip da rede
    const modalTitle = document.getElementById("receive-modal-title");
    const chainLabel = document.getElementById("receive-chain-label");
    const chainDot = document.getElementById("receive-chain-dot");
    const addressDisplay = document.getElementById("receive-address-display");
    const qrContainer = document.getElementById("qrcode-container");

    if (modalTitle) modalTitle.innerText = `Receber ${chain.symbol}`;
    if (chainLabel) chainLabel.textContent = `${chain.name} (${chain.symbol})`;
    if (chainDot) chainDot.style.background = chain.color || 'var(--color-primary)';

    // Configura seletor Zcash para o modal de Receber
    const zcashSelector = document.getElementById("receive-zcash-selector-container");
    if (zcashSelector) {
      if (networkKey === 'ZEC') {
        zcashSelector.style.display = 'block';
        const tabs = zcashSelector.querySelectorAll(".zcash-receive-tab");
        tabs.forEach(tab => {
          if (tab.id === 'receive-zcash-tab-transparent') {
            tab.classList.add('active');
            tab.style.background = 'var(--color-primary)';
            tab.style.color = '#fff';
          } else {
            tab.classList.remove('active');
            tab.style.background = 'transparent';
            tab.style.color = 'var(--text-secondary)';
          }
        });
      } else {
        zcashSelector.style.display = 'none';
      }
    }

    // Configura seletor Dash para o modal de Receber
    const dashSelector = document.getElementById("receive-dash-selector-container");
    if (dashSelector) {
      if (networkKey === 'DASH') {
        dashSelector.style.display = 'block';
        const tabs = dashSelector.querySelectorAll(".dash-receive-tab");
        tabs.forEach(tab => {
          if (tab.id === 'receive-dash-tab-p2pkh') {
            tab.classList.add('active');
            tab.style.background = 'var(--color-primary)';
            tab.style.color = '#fff';
          } else {
            tab.classList.remove('active');
            tab.style.background = 'transparent';
            tab.style.color = 'var(--text-secondary)';
          }
        });
      } else {
        dashSelector.style.display = 'none';
      }
    }

    // Configura seletor BTC para o modal de Receber
    const btcSelector = document.getElementById("receive-btc-selector-container");
    if (btcSelector) {
      if (networkKey === 'BTC') {
        const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem("b2_network_mode") === "testnet";
        const tabs = btcSelector.querySelectorAll(".btc-receive-tab");

        if (isTestnet) {
          // Testnet4: apenas Native SegWit (tb1q...) é aceito
          tabs.forEach(tab => {
            if (tab.id === 'receive-btc-tab-native') {
              tab.style.display = '';
              tab.classList.add('active');
              tab.style.background = 'var(--color-primary)';
              tab.style.color = '#fff';
            } else {
              // Esconde Nested, Legacy e Taproot no testnet
              tab.style.display = 'none';
              tab.classList.remove('active');
            }
          });
          btcSelector.style.display = 'block';
        } else {
          // Mainnet: exibe todos os tipos de endereço
          tabs.forEach(tab => {
            tab.style.display = '';
            if (tab.id === 'receive-btc-tab-native') {
              tab.classList.add('active');
              tab.style.background = 'var(--color-primary)';
              tab.style.color = '#fff';
            } else {
              tab.classList.remove('active');
              tab.style.background = 'transparent';
              tab.style.color = 'var(--text-secondary)';
            }
          });
          btcSelector.style.display = 'block';
        }
      } else {
        btcSelector.style.display = 'none';
      }
    }

    // Configura seletor LTC para o modal de Receber
    const ltcSelector = document.getElementById("receive-ltc-selector-container");
    if (ltcSelector) {
      if (networkKey === 'LTC') {
        ltcSelector.style.display = 'block';
        const tabs = ltcSelector.querySelectorAll(".ltc-receive-tab");
        tabs.forEach(tab => {
          if (tab.id === 'receive-ltc-tab-legacy') {
            tab.classList.add('active');
            tab.style.background = 'var(--color-primary)';
            tab.style.color = '#fff';
          } else {
            tab.classList.remove('active');
            tab.style.background = 'transparent';
            tab.style.color = 'var(--text-secondary)';
          }
        });
      } else {
        ltcSelector.style.display = 'none';
      }
    }

    // Configura seletor DOGE para o modal de Receber
    const dogeSelector = document.getElementById("receive-doge-selector-container");
    if (dogeSelector) {
      if (networkKey === 'DOGE') {
        dogeSelector.style.display = 'block';
        const tabs = dogeSelector.querySelectorAll(".doge-receive-tab");
        tabs.forEach(tab => {
          if (tab.id === 'receive-doge-tab-legacy') {
            tab.classList.add('active');
            tab.style.background = 'var(--color-primary)';
            tab.style.color = '#fff';
          } else {
            tab.classList.remove('active');
            tab.style.background = 'transparent';
            tab.style.color = 'var(--text-secondary)';
          }
        });
      } else {
        dogeSelector.style.display = 'none';
      }
    }

    // Configura seletor BCH para o modal de Receber
    const bchSelector = document.getElementById("receive-bch-selector-container");
    if (bchSelector) {
      if (networkKey === 'BCH') {
        bchSelector.style.display = 'block';
        const tabs = bchSelector.querySelectorAll(".bch-receive-tab");
        tabs.forEach(tab => {
          if (tab.id === 'receive-bch-tab-cashaddr') {
            tab.classList.add('active');
            tab.style.background = 'var(--color-primary)';
            tab.style.color = '#fff';
          } else {
            tab.classList.remove('active');
            tab.style.background = 'transparent';
            tab.style.color = 'var(--text-secondary)';
          }
        });
      } else {
        bchSelector.style.display = 'none';
      }
    }

    let initialAddress = keys.address;
    if (networkKey === 'ZEC') {
      initialAddress = keys.tAddress || keys.address;
    } else if (networkKey === 'DASH') {
      initialAddress = keys.p2pkhAddress || keys.address;
    } else if (networkKey === 'BTC') {
      initialAddress = keys.nativeAddress || keys.address;
    } else if (networkKey === 'LTC') {
      initialAddress = keys.legacyAddress || keys.address;
    } else if (networkKey === 'DOGE') {
      initialAddress = keys.legacyAddress || keys.address;
    } else if (networkKey === 'BCH') {
      initialAddress = keys.cashAddress || keys.address;
    }

    if (addressDisplay) addressDisplay.textContent = initialAddress;

    // Gera QR Code real via QRCode.js
    if (qrContainer) {
      qrContainer.innerHTML = '';
      try {
        new QRCode(qrContainer, {
          text: initialAddress,
          width: 200,
          height: 200,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (e) {
        // Fallback: texto centralizado
        qrContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:200px;height:200px;background:#fff;color:#000;font-size:10px;text-align:center;padding:8px;word-break:break-all;">${initialAddress}</div>`;
      }
    }

    window.B2UIRenderer.openModal("modal-receive");
  };

B2WalletApp.prototype.showSendModal = function(networkKey, preSelectedToken = null) {
    const chain = this.blockchainData.find(c => c.key === networkKey);
    const keys = this.derivedKeys[networkKey];
    if (!chain || !keys) {
      window.showToast('Desbloqueie a carteira primeiro.', 'warning');
      return;
    }

    // Armazena contexto para confirmação
    this._sendContext = { chain, keys, selectedToken: preSelectedToken, zcashType: 'transparent', dashType: 'p2pkh' };

    // Selector de Transação Zcash
    const sendZcashSelector = document.getElementById('send-zcash-selector-container');
    if (sendZcashSelector) {
      if (chain.key === 'ZEC') {
        sendZcashSelector.style.display = 'block';
        const tabs = sendZcashSelector.querySelectorAll('.zcash-send-tab');
        tabs.forEach(tab => {
          if (tab.id === 'send-zcash-tab-transparent') {
            tab.classList.add('active');
            tab.style.background = 'var(--color-primary)';
            tab.style.color = '#fff';
          } else {
            tab.classList.remove('active');
            tab.style.background = 'transparent';
            tab.style.color = 'var(--text-secondary)';
          }
        });
      } else {
        sendZcashSelector.style.display = 'none';
      }
    }

    // Selector de Transação Dash
    const sendDashSelector = document.getElementById('send-dash-selector-container');
    if (sendDashSelector) {
      if (chain.key === 'DASH') {
        sendDashSelector.style.display = 'block';
        const tabs = sendDashSelector.querySelectorAll('.dash-send-tab');
        tabs.forEach(tab => {
          if (tab.id === 'send-dash-tab-p2pkh') {
            tab.classList.add('active');
            tab.style.background = 'var(--color-primary)';
            tab.style.color = '#fff';
          } else {
            tab.classList.remove('active');
            tab.style.background = 'transparent';
            tab.style.color = 'var(--text-secondary)';
          }
        });
      } else {
        sendDashSelector.style.display = 'none';
      }
    }

    // Selector de Transação UTXO (BTC, LTC, DOGE, BCH)
    const sendUtxoSelector = document.getElementById('send-utxo-selector-container');
    const sendUtxoTabsContainer = document.getElementById('send-utxo-tabs-container');
    if (sendUtxoSelector && sendUtxoTabsContainer) {
      if (['BTC', 'LTC', 'DOGE', 'BCH'].includes(chain.key)) {
        sendUtxoSelector.style.display = 'block';
        sendUtxoTabsContainer.innerHTML = '';

        const addressTypes = [];
        if (chain.key === 'BTC') {
          addressTypes.push({ type: 'native', label: 'Native SegWit (Bech32)', addr: keys.nativeAddress });
          addressTypes.push({ type: 'nested', label: 'Nested SegWit (P2SH)', addr: keys.nestedAddress });
          addressTypes.push({ type: 'legacy', label: 'Legacy (P2PKH)', addr: keys.legacyAddress });
          addressTypes.push({ type: 'taproot', label: 'Taproot (P2TR)', addr: keys.taprootAddress });
        } else if (chain.key === 'LTC') {
          addressTypes.push({ type: 'legacy', label: 'Legacy (P2PKH)', addr: keys.legacyAddress });
          addressTypes.push({ type: 'nested', label: 'Nested (P2SH)', addr: keys.nestedAddress });
          addressTypes.push({ type: 'native', label: 'Native (Bech32)', addr: keys.nativeAddress });
        } else if (chain.key === 'DOGE') {
          addressTypes.push({ type: 'legacy', label: 'Legacy (P2PKH)', addr: keys.legacyAddress });
          addressTypes.push({ type: 'nested', label: 'Nested (P2SH)', addr: keys.nestedAddress });
        } else if (chain.key === 'BCH') {
          addressTypes.push({ type: 'cashAddress', label: 'CashAddr', addr: keys.cashAddress });
          addressTypes.push({ type: 'legacy', label: 'Legacy (P2PKH)', addr: keys.legacyAddress });
        }

        // Set default active type matching keys.address
        let activeType = addressTypes.find(t => t.addr === keys.address)?.type || addressTypes[0].type;
        this._sendContext.activeUtxoType = activeType;
        this._sendContext.activeUtxoAddress = keys[activeType === 'cashAddress' ? 'cashAddress' : (activeType + 'Address')] || keys.address;

        addressTypes.forEach(t => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'utxo-send-tab';
          btn.setAttribute('data-type', t.type);
          btn.setAttribute('data-address', t.addr);

          const bal = (keys.balances && keys.balances[t.type] !== undefined) ? keys.balances[t.type] : 0;
          btn.textContent = `${t.label} (${bal.toFixed(4)})`;

          btn.style.flex = '1';
          btn.style.border = 'none';
          btn.style.padding = '6px var(--space-2)';
          btn.style.borderRadius = 'var(--radius-md)';
          btn.style.fontFamily = 'var(--font-ui)';
          btn.style.fontSize = 'var(--text-xs)';
          btn.style.fontWeight = 'var(--fw-semibold)';
          btn.style.cursor = 'pointer';
          btn.style.transition = 'all 0.2s ease';

          if (t.type === activeType) {
            btn.classList.add('active');
            btn.style.background = 'var(--color-primary)';
            btn.style.color = '#fff';
          } else {
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-secondary)';
          }

          btn.addEventListener('click', () => {
            this._sendContext.activeUtxoType = t.type;
            this._sendContext.activeUtxoAddress = t.addr;

            const buttons = sendUtxoTabsContainer.querySelectorAll('.utxo-send-tab');
            buttons.forEach(b => {
              if (b === btn) {
                b.classList.add('active');
                b.style.background = 'var(--color-primary)';
                b.style.color = '#fff';
              } else {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = 'var(--text-secondary)';
              }
            });

            if (this.validateSendForm) this.validateSendForm();
          });

          sendUtxoTabsContainer.appendChild(btn);
        });
      } else {
        sendUtxoSelector.style.display = 'none';
      }
    }

    // Atualiza título
    const title = document.getElementById('send-modal-title');
    const updateTitle = (sym) => {
      if (title) title.textContent = `Enviar ${sym}`;
    };

    // Reseta campos
    const toAddr = document.getElementById('send-to-address');
    const amount = document.getElementById('send-amount');
    const amtFiat = document.getElementById('send-amount-fiat');
    const pinInput = document.getElementById('send-pin-input');
    const confirmBtn = document.getElementById('btn-send-confirm');
    const addrValidation = document.getElementById('send-address-validation');
    if (toAddr) toAddr.value = '';
    if (amount) amount.value = '';
    if (amtFiat) amtFiat.textContent = '≈ $ 0.00';
    if (pinInput) pinInput.value = '';
    if (confirmBtn) confirmBtn.disabled = true;
    if (addrValidation) { addrValidation.style.display = 'none'; addrValidation.textContent = ''; }

    // Configuração e exibição do campo dinâmico de Memo/Tag
    const memoContainer = document.getElementById('send-memo-container');
    const memoLabel = document.getElementById('send-memo-label');
    const memoInput = document.getElementById('send-memo-input');
    if (memoContainer && memoInput) {
      memoInput.value = '';
      const memoChains = ['BSC', 'DASH', 'STELLAR', 'XRP', 'EOS', 'TRON', 'MONERO', 'ICP'];
      if (memoChains.includes(chain.key)) {
        memoContainer.style.display = 'flex';
        if (chain.key === 'BSC') {
          if (memoLabel) memoLabel.textContent = 'Memo / Destination Tag (Opcional)';
          memoInput.placeholder = 'Ex: 10482937 (Exigido por certas exchanges)';
        } else if (chain.key === 'DASH') {
          if (memoLabel) memoLabel.textContent = 'Payment ID / Message (Opcional)';
          memoInput.placeholder = 'Ex: Msg ou ID de pagamento';
        } else if (chain.key === 'STELLAR' || chain.key === 'XRP') {
          if (memoLabel) memoLabel.textContent = 'Memo / Tag de Destino (Opcional)';
          memoInput.placeholder = 'Ex: 123456 (Exigido para exchange)';
        } else if (chain.key === 'TRON') {
          if (memoLabel) memoLabel.textContent = 'Memo (Opcional)';
          memoInput.placeholder = 'Ex: 102938';
        } else if (chain.key === 'MONERO') {
          if (memoLabel) memoLabel.textContent = 'Payment ID (Opcional)';
          memoInput.placeholder = 'Ex: 16 ou 64 caracteres hexadecimais';
        } else if (chain.key === 'ICP') {
          if (memoLabel) memoLabel.textContent = 'Memo (Opcional)';
          memoInput.placeholder = 'Ex: 1234567890 (64-bit integer)';
        } else {
          if (memoLabel) memoLabel.textContent = 'Memo / Tag (Opcional)';
          memoInput.placeholder = 'Exigido se enviando para uma exchange...';
        }
      } else {
        memoContainer.style.display = 'none';
      }
    }

    // Atualiza display de gas estimado
    const gasLoading = document.getElementById('gas-fee-loading');
    const gasLimit = document.getElementById('gas-limit-display');
    const gasPrice = document.getElementById('gas-price-display');
    const gasTotal = document.getElementById('gas-total-display');

    const limitLabelEl = document.getElementById('gas-limit-label') || document.querySelector('[for="gas-limit-display"]') || { textContent: '' };
    const priceLabelEl = document.getElementById('gas-price-label') || document.querySelector('[for="gas-price-display"]') || { textContent: '' };
    if (limitLabelEl) limitLabelEl.textContent = 'Limite de Gas / Bytes';
    if (priceLabelEl) priceLabelEl.textContent = 'Preço do Gas / Tx Rate';

    if (gasLoading) gasLoading.textContent = 'Calculando...';
    if (gasLimit) gasLimit.textContent = '—';
    if (gasPrice) gasPrice.textContent = '—';
    if (gasTotal) gasTotal.textContent = '—';

    // Estimativa de taxa por engine
    setTimeout(() => {
      const feeData = this._estimateFeeForChain(chain);
      if (gasLoading) gasLoading.textContent = '';
      if (gasLimit) gasLimit.textContent = feeData.limitLabel;
      if (gasPrice) gasPrice.textContent = feeData.priceLabel;
      if (gasTotal) gasTotal.textContent = feeData.totalLabel;

      if (chain.key === 'TRON' && (window.B2TronEngine || globalThis.B2TronEngine)) {
        const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
        const tronAddress = keys.address;
        if (limitLabelEl) limitLabelEl.textContent = 'Bandwidth Disp.';
        if (priceLabelEl) priceLabelEl.textContent = 'Energy Disp.';

        tronEngine.getResources(tronAddress, chain.nodeUrl, [
          "https://tron-rpc.publicnode.com",
          "https://tron.api.subquery.network"
        ]).then(resources => {
          const bw = resources.bandwidth.totalAvailable;
          const eg = resources.energy.available;
          const selectedToken = this._sendContext?.selectedToken;
          const isTRC20 = !!selectedToken;
          const estimatedFee = isTRC20 ? (eg >= 31890 ? 0.0 : 30.0) : (bw >= 268 ? 0.0 : 1.1);

          if (gasLoading) gasLoading.textContent = '';
          if (gasLimit) gasLimit.textContent = `${bw} BP`;
          if (gasPrice) gasPrice.textContent = `${eg} EP`;
          if (gasTotal) gasTotal.textContent = `≈ ${estimatedFee.toFixed(3)} TRX`;
        }).catch(err => {
          if (gasLoading) gasLoading.textContent = '';
          if (gasLimit) gasLimit.textContent = '1500 BP';
          if (gasPrice) gasPrice.textContent = '0 EP';
          if (gasTotal) gasTotal.textContent = '≈ 1.1 TRX';
        });
      }
    }, 600);

    // Preenche seletor de token com nativo ou token pré-selecionado
    const updateSelectedTokenUI = (tok) => {
      const activeTokenName = document.getElementById('send-token-name');
      const activeTokenIcon = document.getElementById('send-token-icon');
      if (tok) {
        if (activeTokenName) activeTokenName.textContent = `${tok.name} (${tok.symbol})`;
        if (activeTokenIcon) {
          activeTokenIcon.innerHTML = `<img src="${tok.imageURL || tok.logoUrl || chain.logoUrl || 'src/img/eth.png'}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" onerror="this.src='${chain.logoUrl || 'src/img/eth.png'}';this.onerror=null;">`;
        }
        updateTitle(tok.symbol);
      } else {
        if (activeTokenName) activeTokenName.textContent = `${chain.name} (${chain.symbol})`;
        if (activeTokenIcon) {
          activeTokenIcon.innerHTML = `<img src="${chain.logoUrl || 'src/img/btc.png'}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" onerror="this.src='src/img/btc.png';this.onerror=null;">`;
        }
        updateTitle(chain.symbol);
      }
      if (amount) amount.value = '';
      if (amtFiat) amtFiat.textContent = '≈ $ 0.00';

      const optionsContainer = document.getElementById('send-token-dropdown-options');
      if (optionsContainer) {
        const options = optionsContainer.querySelectorAll('.custom-select-option');
        options.forEach(opt => {
          const isMatch = (!tok && opt.isNative) || (tok && opt.tokenObject && (opt.tokenObject === tok || opt.tokenObject.symbol === tok.symbol || opt.tokenObject.assetId === tok.assetId));
          if (isMatch) {
            opt.classList.add('selected');
          } else {
            opt.classList.remove('selected');
          }
        });
      }
    };

    updateSelectedTokenUI(preSelectedToken);

    // Renderiza a lista de opções de tokens para o dropdown
    const dropdownOptions = document.getElementById('send-token-dropdown-options');
    if (dropdownOptions) {
      dropdownOptions.innerHTML = '';
      dropdownOptions.classList.remove('active');
      dropdownOptions.style.display = 'none';
      dropdownOptions.style.flexDirection = 'column';
      dropdownOptions.style.maxHeight = '240px';
      dropdownOptions.style.overflowY = 'hidden';

      // Cria a barra de pesquisa
      const searchContainer = document.createElement('div');
      searchContainer.className = 'custom-select-search-container';
      searchContainer.style.padding = '6px';
      searchContainer.style.borderBottom = '1px solid var(--border-subtle)';
      searchContainer.style.position = 'sticky';
      searchContainer.style.top = '0';
      searchContainer.style.background = 'var(--bg-panel)';
      searchContainer.style.zIndex = '10';

      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.className = 'form-input custom-select-search-input';
      searchInput.placeholder = 'Pesquisar token...';
      searchInput.style.width = '100%';
      searchInput.style.height = '32px';
      searchInput.style.fontSize = 'var(--text-xs)';
      searchInput.style.padding = '0 var(--space-3)';
      searchInput.style.borderRadius = 'var(--radius-sm)';
      searchInput.style.boxSizing = 'border-box';
      searchContainer.appendChild(searchInput);
      dropdownOptions.appendChild(searchContainer);

      // Parar propagação de click no searchInput para não fechar o dropdown ao clicar nele
      searchInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Recipiente das opções que realmente rolará
      const listContainer = document.createElement('div');
      listContainer.className = 'custom-select-options-list';
      listContainer.style.overflowY = 'auto';
      listContainer.style.flex = '1';
      dropdownOptions.appendChild(listContainer);

      // Filtro em tempo real
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const options = listContainer.querySelectorAll('.custom-select-option');
        options.forEach(opt => {
          const text = opt.querySelector('.custom-select-option-meta span').textContent.toLowerCase();
          if (text.includes(query)) {
            opt.style.display = 'flex';
          } else {
            opt.style.display = 'none';
          }
        });
      });

      // Opção 1: Token Nativo
      const nativeOpt = document.createElement('div');
      nativeOpt.className = 'custom-select-option';
      nativeOpt.isNative = true;
      if (!preSelectedToken) {
        nativeOpt.classList.add('selected');
      }
      nativeOpt.innerHTML = `
        <div class="custom-select-option-meta">
          <img src="${chain.logoUrl || 'src/img/btc.png'}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" onerror="this.src='src/img/btc.png';this.onerror=null;">
          <span>${chain.name} (${chain.symbol})</span>
        </div>
        <div class="custom-select-option-balance">${chain.balanceCrypto.toFixed(4)} ${chain.symbol}</div>
      `;
      nativeOpt.addEventListener('click', () => {
        this._sendContext.selectedToken = null;
        updateSelectedTokenUI(null);
        dropdownOptions.classList.remove('active');
        dropdownOptions.style.display = 'none';
        if (this.validateSendForm) this.validateSendForm();
      });
      listContainer.appendChild(nativeOpt);

      // Opção 2+: Outros tokens detectados/importados
      if (chain.discoveredTokens && chain.discoveredTokens.length > 0) {
        chain.discoveredTokens.forEach(tok => {
          const opt = document.createElement('div');
          opt.className = 'custom-select-option';
          opt.tokenObject = tok;
          const isSelected = preSelectedToken && (preSelectedToken === tok || preSelectedToken.symbol === tok.symbol || preSelectedToken.assetId === tok.assetId);
          if (isSelected) {
            opt.classList.add('selected');
          }
          opt.innerHTML = `
            <div class="custom-select-option-meta">
              <img src="${tok.imageURL || tok.logoUrl || chain.logoUrl || 'src/img/eth.png'}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" onerror="this.src='${chain.logoUrl || 'src/img/eth.png'}';this.onerror=null;">
              <span>${tok.name} (${tok.symbol})</span>
            </div>
            <div class="custom-select-option-balance">${tok.balanceCrypto.toFixed(4)} ${tok.symbol}</div>
          `;
          opt.addEventListener('click', () => {
            // Bloqueia token em manutenção
            if (this.checkMaintenanceToken(tok.assetId || tok.symbol || tok.contractAddress)) {
              dropdownOptions.classList.remove('active');
              dropdownOptions.style.display = 'none';
              return;
            }
            this._sendContext.selectedToken = tok;
            updateSelectedTokenUI(tok);
            dropdownOptions.classList.remove('active');
            dropdownOptions.style.display = 'none';
            if (this.validateSendForm) this.validateSendForm();
          });
          listContainer.appendChild(opt);
        });
      }
    }

    // Configura o evento do seletor trigger
    const triggerBtn = document.getElementById('send-token-selector-trigger');
    if (triggerBtn && dropdownOptions) {
      const newTriggerBtn = triggerBtn.cloneNode(true);
      triggerBtn.parentNode.replaceChild(newTriggerBtn, triggerBtn);

      newTriggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = dropdownOptions.classList.toggle('active');
        dropdownOptions.style.display = isActive ? 'flex' : 'none';
        if (isActive) {
          const searchInput = dropdownOptions.querySelector('.custom-select-search-input');
          if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
            searchInput.dispatchEvent(new Event('input'));
          }
        }
      });

      const outsideClickDropdown = (e) => {
        if (!newTriggerBtn.contains(e.target) && !dropdownOptions.contains(e.target)) {
          dropdownOptions.classList.remove('active');
          dropdownOptions.style.display = 'none';
        }
      };
      document.addEventListener('click', outsideClickDropdown);

      const btnCloseSend = document.getElementById('btn-close-send');
      if (btnCloseSend) {
        btnCloseSend.addEventListener('click', () => {
          document.removeEventListener('click', outsideClickDropdown);
        }, { once: true });
      }

      const modalSend = document.getElementById('modal-send');
      if (modalSend) {
        modalSend.addEventListener('click', (e) => {
          if (e.target === modalSend) {
            document.removeEventListener('click', outsideClickDropdown);
          }
        });
      }
    }

    // Seletor de Ativo para Taxa (Pagar taxa com...) para blockchains Waves/AMZX/PlanetOne
    const feeAssetContainer = document.getElementById('send-fee-asset-container');
    const feeAssetTrigger = document.getElementById('send-fee-asset-trigger');
    const feeAssetName = document.getElementById('send-fee-asset-name');
    const feeAssetIcon = document.getElementById('send-fee-asset-icon');
    const feeAssetDropdown = document.getElementById('send-fee-asset-dropdown-options');

    if (chain.engine === 'Waves') {
      if (feeAssetContainer) feeAssetContainer.style.display = 'block';
      this._sendContext.selectedFeeAsset = null; // null significa Nativo (padrão)

      const updateSelectedFeeAssetUI = (tok) => {
        const activeFeeAssetName = document.getElementById('send-fee-asset-name');
        const activeFeeAssetIcon = document.getElementById('send-fee-asset-icon');
        if (tok) {
          if (activeFeeAssetName) activeFeeAssetName.textContent = `${tok.name} (${tok.symbol})`;
          if (activeFeeAssetIcon) {
            activeFeeAssetIcon.innerHTML = `<img src="${tok.imageURL || tok.logoUrl || chain.logoUrl || 'src/img/eth.png'}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" onerror="this.src='${chain.logoUrl || 'src/img/eth.png'}';this.onerror=null;">`;
          }
        } else {
          if (activeFeeAssetName) activeFeeAssetName.textContent = 'Nativo';
          if (activeFeeAssetIcon) {
            activeFeeAssetIcon.innerHTML = `<img src="${chain.logoUrl || 'src/img/waves.png'}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" onerror="this.src='src/img/waves.png';this.onerror=null;">`;
          }
        }
        if (feeAssetDropdown) {
          const options = feeAssetDropdown.querySelectorAll('.custom-select-option');
          options.forEach(opt => {
            const isMatch = (!tok && opt.isNative) || (tok && opt.tokenObject && (opt.tokenObject === tok || opt.tokenObject.symbol === tok.symbol || opt.tokenObject.assetId === tok.assetId));
            if (isMatch) {
              opt.classList.add('selected');
            } else {
              opt.classList.remove('selected');
            }
          });
        }
      };

      if (feeAssetDropdown) {
        feeAssetDropdown.innerHTML = '';
        feeAssetDropdown.classList.remove('active');

        // Opção 1: Ativo Nativo
        const nativeFeeOpt = document.createElement('div');
        nativeFeeOpt.className = 'custom-select-option';
        nativeFeeOpt.isNative = true;
        nativeFeeOpt.innerHTML = `
          <div class="custom-select-option-meta">
            <img src="${chain.logoUrl || 'src/img/waves.png'}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" onerror="this.src='src/img/waves.png';this.onerror=null;">
            <span>Nativo (${chain.symbol})</span>
          </div>
          <div class="custom-select-option-balance">0.001 ${chain.symbol}</div>
        `;
        nativeFeeOpt.addEventListener('click', () => {
          this._sendContext.selectedFeeAsset = null;
          updateSelectedFeeAssetUI(null);
          this._updateWavesFeeDisplay(chain);
          feeAssetDropdown.classList.remove('active');
          if (this.validateSendForm) this.validateSendForm();
        });
        feeAssetDropdown.appendChild(nativeFeeOpt);

        // Opção 2+: Tokens patrocinados ativos
        if (chain.discoveredTokens && chain.discoveredTokens.length > 0) {
          chain.discoveredTokens.forEach(tok => {
            if (tok.minSponsoredAssetFee && tok.minSponsoredAssetFee > 0 && tok.balanceCrypto > 0) {
              const sponsoredFee = tok.minSponsoredAssetFee / Math.pow(10, tok.decimals);
              const opt = document.createElement('div');
              opt.className = 'custom-select-option';
              opt.tokenObject = tok;
              opt.innerHTML = `
                <div class="custom-select-option-meta">
                  <img src="${tok.imageURL || tok.logoUrl || chain.logoUrl || 'src/img/eth.png'}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" onerror="this.src='${chain.logoUrl || 'src/img/eth.png'}';this.onerror=null;">
                  <span>${tok.name} (${tok.symbol})</span>
                </div>
                <div class="custom-select-option-balance">${sponsoredFee} ${tok.symbol} (Disp: ${tok.balanceCrypto.toFixed(2)})</div>
              `;
              opt.addEventListener('click', () => {
                this._sendContext.selectedFeeAsset = tok;
                updateSelectedFeeAssetUI(tok);
                this._updateWavesFeeDisplay(chain);
                feeAssetDropdown.classList.remove('active');
                if (this.validateSendForm) this.validateSendForm();
              });
              feeAssetDropdown.appendChild(opt);
            }
          });
        }

        // Initialize display and selected option visual class
        updateSelectedFeeAssetUI(null);
      }

      // Evento do gatilho (trigger)
      if (feeAssetTrigger && feeAssetDropdown) {
        const newFeeTrigger = feeAssetTrigger.cloneNode(true);
        feeAssetTrigger.parentNode.replaceChild(newFeeTrigger, feeAssetTrigger);

        newFeeTrigger.addEventListener('click', (e) => {
          e.stopPropagation();
          feeAssetDropdown.classList.toggle('active');
        });

        const outsideClickFeeDropdown = (e) => {
          if (!newFeeTrigger.contains(e.target) && !feeAssetDropdown.contains(e.target)) {
            feeAssetDropdown.classList.remove('active');
          }
        };
        document.addEventListener('click', outsideClickFeeDropdown);

        const btnCloseSend = document.getElementById('btn-close-send');
        if (btnCloseSend) {
          btnCloseSend.addEventListener('click', () => {
            document.removeEventListener('click', outsideClickFeeDropdown);
          }, { once: true });
        }

        const modalSend = document.getElementById('modal-send');
        if (modalSend) {
          modalSend.addEventListener('click', (e) => {
            if (e.target === modalSend) {
              document.removeEventListener('click', outsideClickFeeDropdown);
            }
          });
        }
      }
    } else {
      if (feeAssetContainer) feeAssetContainer.style.display = 'none';
      this._sendContext.selectedFeeAsset = null;
    }

    // MAX btn
    const maxBtn = document.getElementById('send-max-btn');
    if (maxBtn) {
      maxBtn.onclick = () => {
        const feeData = this._estimateFeeForChain(chain);
        const fee = feeData.feeCrypto || 0;
        const selTok = this._sendContext.selectedToken;
        const selectedFeeAsset = this._sendContext.selectedFeeAsset;

        if (selTok) {
          let maxAmt = selTok.balanceCrypto;
          if (chain.engine === 'Waves' && selectedFeeAsset && selectedFeeAsset.assetId === selTok.assetId) {
            maxAmt = Math.max(0, selTok.balanceCrypto - fee);
          }
          if (amount) amount.value = maxAmt.toFixed(6);
          this._updateSendAmountFiat(chain, maxAmt, selTok);
        } else {
          let maxAmt = chain.balanceCrypto;
          if (chain.engine === 'Waves') {
            if (!selectedFeeAsset) {
              maxAmt = Math.max(0, chain.balanceCrypto - fee);
            }
          } else {
            maxAmt = Math.max(0, chain.balanceCrypto - fee);
          }
          if (amount) amount.value = maxAmt.toFixed(6);
          this._updateSendAmountFiat(chain, maxAmt, null);
        }
        if (this.validateSendForm) this.validateSendForm();
      };
    }

    window.B2UIRenderer.openModal('modal-send');
  };

B2WalletApp.prototype._updateWavesFeeDisplay = function(chain) {
    const gasLoading = document.getElementById('gas-fee-loading');
    const gasLimit = document.getElementById('gas-limit-display');
    const gasPrice = document.getElementById('gas-price-display');
    const gasTotal = document.getElementById('gas-total-display');

    const feeData = this._estimateFeeForChain(chain);
    if (gasLoading) gasLoading.textContent = '';
    if (gasLimit) gasLimit.textContent = feeData.limitLabel;
    if (gasPrice) gasPrice.textContent = feeData.priceLabel;
    if (gasTotal) gasTotal.textContent = feeData.totalLabel;
  };

B2WalletApp.prototype._estimateFeeForChain = function(chain) {
    if (chain.key === 'DASH') {
      const fee = 0.0001; // Taxa dinâmica típica recomendada de 0.0001 DASH
      return {
        limitLabel: 'Dash Core Standard',
        priceLabel: 'Fixo',
        totalLabel: `${fee.toFixed(4)} DASH`,
        feeCrypto: fee
      };
    }
    if (chain.key === 'ZEC') {
      const fee = 0.0001; // Alinhado perfeitamente com o fee do construtor de Zcash (10.000 satoshis)
      return {
        limitLabel: 'ZIP-313 Standard',
        priceLabel: 'Fixo',
        totalLabel: `${fee.toFixed(4)} ZEC`,
        feeCrypto: fee
      };
    }
    const engine = chain.engine || '';
    if (engine === 'EVM') {
      const gasLimit = 21000;
      const gasPriceGwei = 30; // ~30 Gwei estimado
      const feeCrypto = (gasLimit * gasPriceGwei * 1e9) / 1e18;
      return {
        limitLabel: `${gasLimit.toLocaleString()} gas`,
        priceLabel: `${gasPriceGwei} Gwei`,
        totalLabel: `≈ ${feeCrypto.toFixed(6)} ${chain.symbol}`,
        feeCrypto
      };
    } else if (engine === 'Waves') {
      if (this._sendContext && this._sendContext.selectedFeeAsset) {
        const sponsoredToken = this._sendContext.selectedFeeAsset;
        const fee = sponsoredToken.minSponsoredAssetFee / Math.pow(10, sponsoredToken.decimals);
        return {
          limitLabel: 'Sponsorship',
          priceLabel: 'Mínimo',
          totalLabel: `${fee.toFixed(sponsoredToken.decimals)} ${sponsoredToken.symbol}`,
          feeCrypto: fee
        };
      }
      const fee = 0.001;
      const nativeSym = chain.symbol || 'WAVES'; // AMZX, PLO ou WAVES
      return {
        limitLabel: 'N/A',
        priceLabel: `0.001 ${nativeSym} (fixo)`,
        totalLabel: `0.001 ${nativeSym}`,
        feeCrypto: fee
      };
    } else if (engine === 'Bitcoin') {
      let fee = 0.00005; // 5000 sat
      let vbytes = '~220 vbytes';
      let satRate = '~20 sat/vB';
      if (chain.key === 'BTC') {
        fee = 0.0001; // 10000 satoshis
        vbytes = '~140 vbytes (SegWit)';
        satRate = '~70 sat/vB';
      } else if (chain.key === 'LTC') {
        fee = 0.0001;
        vbytes = '~140 vbytes (SegWit)';
        satRate = '~70 sat/vB';
      } else if (chain.key === 'DOGE') {
        fee = 1.0; // 1 DOGE standard fee
        vbytes = '~220 vbytes (Legacy)';
        satRate = '~450,000 sat/vB';
      } else if (chain.key === 'BCH') {
        fee = 0.0001;
        vbytes = '~220 vbytes (CashAddr)';
        satRate = '~45 sat/vB';
      }
      return {
        limitLabel: vbytes,
        priceLabel: satRate,
        totalLabel: `≈ ${fee.toFixed(chain.key === 'DOGE' ? 1 : 5)} ${chain.symbol}`,
        feeCrypto: fee
      };
    } else if (engine === 'Solana') {
      const fee = 0.000005;
      return {
        limitLabel: '5000 lamports',
        priceLabel: 'Fixo',
        totalLabel: `${fee.toFixed(6)} ${chain.symbol}`,
        feeCrypto: fee
      };
    } else if (chain.key === 'ICP' || engine === 'ICP') {
      const fee = 0.0001;
      return {
        limitLabel: 'Fixo (Rosetta)',
        priceLabel: '10000 e8s',
        totalLabel: `${fee.toFixed(4)} ${chain.symbol}`,
        feeCrypto: fee
      };
    } else if (chain.key === 'FILECOIN' || chain.key === 'FIL' || engine === 'Filecoin') {
      const fee = 0.001;
      return {
        limitLabel: '1,250,000 gas',
        priceLabel: 'Dynamic BaseFee',
        totalLabel: `≈ ${fee.toFixed(4)} ${chain.symbol}`,
        feeCrypto: fee
      };
    } else if (chain.key === 'POLKADOT' || engine === 'POLKADOT') {
      const fee = 0.0156;
      return {
        limitLabel: 'Immortal Era',
        priceLabel: 'Standard weight',
        totalLabel: `≈ ${fee.toFixed(4)} DOT`,
        feeCrypto: fee
      };
    } else if (chain.key === 'MONERO' || engine === 'Monero') {
      const fee = 0.00005;
      return {
        limitLabel: 'Standard Bulletproofs+',
        priceLabel: 'Fixo',
        totalLabel: `${fee.toFixed(5)} XMR`,
        feeCrypto: fee
      };
    } else if (chain.key === 'TRON' || engine === 'TRON') {
      const fee = 1.1; // fallback TRX transfer fee if no bandwidth
      return {
        limitLabel: '268-345 vbytes',
        priceLabel: 'Bandwidth standard',
        totalLabel: `≈ ${fee.toFixed(1)} TRX`,
        feeCrypto: fee
      };
    }
    return {
      limitLabel: '—', priceLabel: '—',
      totalLabel: `≈ 0.001 ${chain.symbol}`,
      feeCrypto: 0.001
    };
  };

B2WalletApp.prototype._updateSendAmountFiat = function(chain, amountCrypto, selectedToken = null) {
    const fiatEl = document.getElementById('send-amount-fiat');
    if (!fiatEl) return;
    const activeToken = selectedToken || (this._sendContext ? this._sendContext.selectedToken : null);
    let price = 0;
    if (activeToken) {
      price = activeToken.balanceCrypto > 0 ? activeToken.balanceFiat / activeToken.balanceCrypto : 0;
    } else {
      price = chain.balanceCrypto > 0 ? chain.balanceFiat / chain.balanceCrypto : 0;
    }
    const fiat = amountCrypto * price;
    fiatEl.textContent = `≈ $ ${fiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

