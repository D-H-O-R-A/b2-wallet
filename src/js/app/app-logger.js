/**
 * B2 Wallet - Logger de Eventos do Desenvolvedor (Cyberpunk Hacker Style Logs) e Detalhes de Transação
 */

class B2LoggerClass {
  log(message, type = 'info') {
    const validTypes = ['info', 'success', 'warn', 'error', 'success', 'warn', 'err'];
    let finalMessage = message;
    let finalType = type;

    if (typeof message === 'string' && ['info', 'success', 'warn', 'error'].includes(message.toLowerCase())) {
      finalType = message.toLowerCase();
      finalMessage = type;
    }

    if (globalThis.B2LoggerSuppressDerivationErrors && typeof finalMessage === 'string' && (
      finalMessage.includes('Erro ao derivar chaves') ||
      finalMessage.includes('mnemonic') ||
      finalMessage.includes('bip39') ||
      finalMessage.includes('bip-39') ||
      finalMessage.includes('BIP-39') ||
      finalMessage.includes('BIP39') ||
      finalMessage.includes('seed') ||
      finalMessage.includes('keys') ||
      finalMessage.includes('key')
    )) {
      return;
    }

    const consoleLog = document.getElementById("playground-console");
    if (consoleLog) {
      const entry = document.createElement("div");
      entry.className = "console-entry";

      let color = "#39ff14"; // neon green
      let label = "[INFO]";
      if (finalType === 'success') {
        color = "#10b981"; // emerald
        label = "[SUCCESS]";
      } else if (finalType === 'warn' || finalType === 'warning') {
        color = "#f59e0b"; // amber
        label = "[WARN]";
      } else if (finalType === 'error' || finalType === 'err') {
        color = "#ef4444"; // red
        label = "[ERROR]";
      }

      entry.style.borderLeft = `2px solid ${color}`;
      entry.style.color = color;
      entry.style.marginBottom = "8px";
      entry.style.paddingLeft = "8px";
      entry.innerHTML = `<span>[${new Date().toLocaleTimeString()}] ${label} ${finalMessage}</span><button class="console-entry-copy-btn">COPIAR</button>`;
      consoleLog.appendChild(entry);
      consoleLog.scrollTop = consoleLog.scrollHeight;
    } else {
      console.log(`[B2Logger ${finalType.toUpperCase()}] ${finalMessage}`);
    }
  }

  /**
   * Busca detalhes completos de uma transação via node/explorer da chain e mostra modal.
   * Tenta estratégias básicas por engine: EVM (eth_getTransactionByHash + receipt), Solana (getTransaction), Waves (transactions/info/{id}), Bitcoin-like (explorer endpoint if present).
   */
  async fetchTransactionDetails(chainKey, txId, fallbackTxData = null) {
    const chain = (window.B2App && window.B2App.blockchainData && window.B2App.blockchainData.find(c => c.key === chainKey)) || {};
    const engine = chain.engine || '';
    const nodeUrl = chain.nodeUrl || chain.rpc || null;

    const result = { chain: chainKey, id: txId, fetchedAt: Date.now(), raw: null, human: {} };

    if (fallbackTxData) {
      result.human = { ...fallbackTxData };
    }

    // Tenta carregar do localStorage primeiro como fonte de verdade/detalhes locais
    const extraTxsKey = `b2_tx_history_${chainKey}`;
    const extraTxs = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
    // Busca por id OU por txHash — após updateTransactionStatus o campo id é substituído pelo hash real
    const localTx = extraTxs.find(tx => tx.id === txId || tx.txHash === txId || tx.txId === txId);
    if (localTx) {
      result.human = { ...result.human, ...localTx };
    }

    try {
      if (!txId) throw new Error('txId ausente');

      if (engine === 'EVM' && nodeUrl && txId.startsWith('0x')) {
        // JSON-RPC eth_getTransactionByHash + eth_getTransactionReceipt
        const rpc = (method, params) => fetch(nodeUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
        }).then(r => r.json());

        const txRes = await rpc('eth_getTransactionByHash', [txId]);
        const receiptRes = await rpc('eth_getTransactionReceipt', [txId]);
        result.raw = { tx: txRes.result, receipt: receiptRes.result };

        if (txRes.result) {
          result.human = {
            ...result.human,
            from: txRes.result.from || result.human.from || result.human.sender,
            to: txRes.result.to || result.human.to || result.human.recipient,
            value: txRes.result.value ? (parseInt(txRes.result.value, 16) / Math.pow(10, chain.decimals || 18)) : (result.human.amount || result.human.value),
            gasUsed: receiptRes.result?.gasUsed ? parseInt(receiptRes.result.gasUsed, 16) : (result.human.gasUsed || null),
            status: receiptRes.result?.status ? (parseInt(receiptRes.result.status, 16) === 1 ? 'Sucesso' : 'Falha') : (result.human.status || 'Pendente')
          };
        }
      } else if (engine === 'Solana' && nodeUrl && txId.length > 30) {
        // Solana RPC getTransaction
        const body = { jsonrpc: '2.0', id: 1, method: 'getTransaction', params: [txId, { encoding: 'json', commitment: 'confirmed' }] };
        const res = await fetch(nodeUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
        result.raw = res.result;
        if (res.result) {
          result.human = {
            ...result.human,
            slot: res.result.slot,
            meta: res.result.meta,
            signatures: res.result.transaction?.signatures
          };
        }
      } else if (engine === 'Waves' && nodeUrl && txId.length > 20) {
        // Waves node REST: /transactions/info/{id}
        const url = nodeUrl.replace(/\/$/, '') + `/transactions/info/${txId}`;
        const res = await fetch(url).then(r => r.json());
        result.raw = res;
        if (res && !res.error) {
          result.human = {
            ...result.human,
            sender: res.sender || result.human.sender || result.human.from,
            recipient: res.recipient || result.human.recipient || result.human.to,
            amount: (res.amount !== undefined && res.amount !== null) ? (res.amount / Math.pow(10, chain.decimals || 8)) : (result.human.amount || null),
            fee: (res.fee !== undefined && res.fee !== null) ? (res.fee / Math.pow(10, chain.decimals || 8)) : (result.human.fee || null),
            height: res.height,
            timestamp: res.timestamp
          };
        }
      } else {
        // Fallback: tenta GET no nodeUrl/txs/{id} ou explorerApi
        if (nodeUrl && txId.length > 10) {
          let tryUrl = nodeUrl.replace(/\/$/, '') + `/tx/${txId}`;
          try {
            const r = await fetch(tryUrl);
            if (r.ok) {
              result.raw = await r.json();
              result.human = { ...result.human, ...result.raw };
            }
          } catch (e) {
            // fallback silencioso
          }
        }
      }
    } catch (e) {
      result.error = e.message || String(e);
    }

    // Preenche modal com dados e abre
    try {
      const modalBody = document.getElementById('modal-tx-detail-body');
      if (modalBody) {
        const langDict = (window.B2Translations && (window.B2Translations[window.B2App?.currentLanguage] || window.B2Translations['en'])) || {};
        const activeColor = chain.color || 'var(--color-primary)';

        // Coleta metadados formatados com fallbacks inteligentes
        const ownAddress = window.B2App && window.B2App.derivedKeys?.[chainKey]?.address || 'N/A';

        let txSender = result.human.sender || result.human.from || result.raw?.sender || result.raw?.from;
        let txRecipient = result.human.recipient || result.human.to || result.raw?.recipient || result.raw?.to;

        // Fallback construído se não houver do node/logs
        if (!txSender && !txRecipient) {
          const typeLower = String(result.human.type || '').toLowerCase();
          if (typeLower.includes('recebi') || typeLower.includes('receiv')) {
            txSender = result.human.addr || 'N/A';
            txRecipient = ownAddress;
          } else {
            txSender = ownAddress;
            txRecipient = result.human.addr || 'N/A';
          }
        } else {
          txSender = txSender || 'N/A';
          txRecipient = txRecipient || 'N/A';
        }

        const recipientFormatted = typeof txRecipient === 'object' ? (txRecipient.address || JSON.stringify(txRecipient)) : txRecipient;
        const txType = result.human.type || result.raw?.type || 'Transação';

        // Função utilitária para extrair com segurança a parte numérica de uma string (ex: "-1.2345 WAVES" -> -1.2345)
        const safeParseAmount = (val) => {
          if (val === undefined || val === null) return null;
          if (typeof val === 'number') return val;
          const cleanStr = String(val).replace(/[^\d.-]/g, '');
          const num = parseFloat(cleanStr);
          return isNaN(num) ? null : num;
        };

        let txAmount = result.human.amount || result.human.value;
        if (txAmount === undefined && result.raw?.amount !== undefined) {
          txAmount = result.raw.amount / Math.pow(10, chain.decimals || 8);
        }
        const parsedAmount = safeParseAmount(txAmount);
        const formattedAmount = (parsedAmount !== null)
          ? `${Math.abs(parsedAmount).toFixed(chain.decimals > 8 ? 8 : (chain.decimals || 4))} ${chain.symbol || ''}`.trim()
          : (typeof txAmount === 'string' ? txAmount : '0.00 ' + (chain.symbol || ''));

        // Processa Fee (Tarifa de Rede)
        let txFee = result.human.fee !== undefined ? result.human.fee : result.raw?.fee;
        if (txFee === undefined && result.raw?.gasUsed !== undefined) {
          const gasPrice = result.raw?.tx?.gasPrice ? parseInt(result.raw.tx.gasPrice, 16) : 0;
          txFee = (result.raw.gasUsed * gasPrice) / Math.pow(10, chain.decimals || 18);
        }
        const parsedFee = safeParseAmount(txFee);
        const formattedFee = (parsedFee !== null)
          ? `${parsedFee.toFixed(6)} ${chain.symbol || ''}`.trim()
          : (typeof txFee === 'string' ? txFee : '0.00 ' + (chain.symbol || ''));

        // Processa status e cores correspondentes
        const txStatus = result.human.status || result.raw?.status || 'Confirmado';
        const statusLower = String(txStatus).toLowerCase();
        let statusColor = '#10b981'; // green default (Success/Confirmed)
        let statusBg = 'rgba(16, 185, 129, 0.1)';
        let statusBorder = 'rgba(16, 185, 129, 0.2)';

        if (statusLower.includes('pendent') || statusLower.includes('process') || statusLower.includes('enviand') || statusLower.includes('send') || statusLower.includes('wait')) {
          statusColor = '#f59e0b'; // yellow/amber (Pending)
          statusBg = 'rgba(245, 158, 11, 0.1)';
          statusBorder = 'rgba(245, 158, 11, 0.2)';
        } else if (statusLower.includes('falh') || statusLower.includes('err') || statusLower.includes('fail') || statusLower.includes('rejeit') || statusLower.includes('reject') || statusLower.includes('cancel')) {
          statusColor = '#ef4444'; // red (Failed/Error)
          statusBg = 'rgba(239, 68, 68, 0.1)';
          statusBorder = 'rgba(239, 68, 68, 0.2)';
        }

        let txDate = 'N/A';
        if (result.human.time) {
          txDate = result.human.time;
        } else {
          const ts = result.human.timestamp || result.raw?.timestamp;
          if (ts) {
            txDate = new Date(ts).toLocaleString();
          }
        }

        // Emoji de direção
        let directionEmoji = "📤";
        if (txType === "Recebido" || txType === "Received") directionEmoji = "📥";
        else if (txType.includes("Cunhado") || txType.includes("Mint")) directionEmoji = "🎨";
        else if (txType.includes("Arrendado") || txType.includes("Lease")) directionEmoji = "⛓️";
        else if (txType.includes("Stake")) directionEmoji = "☀️";

        // URL do explorer — usa testnet quando ativo
        const isTestnet = typeof localStorage !== 'undefined' && localStorage.getItem('b2_network_mode') === 'testnet';
        const hashToUse = result.human.txHash || result.human.txId || result.human.id || txId;
        let explorerBase = chain.explorer || '';
        let explorerSuffix = ''; // query string appendada depois do path /tx/{hash}
        // Substitui explorador por versão testnet para redes suportadas
        if (isTestnet) {
          if (chainKey === 'BTC') { explorerBase = 'https://mempool.space/testnet4'; }
          else if (chainKey === 'LTC') { explorerBase = 'https://blockexplorer.one/litecoin/testnet'; }
          else if (chainKey === 'ETH') { explorerBase = 'https://sepolia.etherscan.io'; }
          else if (chainKey === 'WAVES') { explorerBase = 'https://wavesexplorer.com/testnet'; }
          else if (chainKey === 'SOL' || chainKey === 'SOLANA') {
            explorerBase = 'https://solscan.io';
            explorerSuffix = '?cluster=devnet';
          }
        }
        const explorerUrl = explorerBase
          ? `${explorerBase.replace(/\/+$/, '')}/tx/${hashToUse}${explorerSuffix}`
          : `/tx/${hashToUse}`;

        modalBody.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: var(--space-4); color: var(--text-primary); font-family: var(--font-body);">
            <!-- Header com ícone de direção -->
            <div style="display: flex; align-items: center; gap: var(--space-3); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, ${activeColor}22 0%, rgba(255,255,255,0.02) 100%); display: flex; justify-content: center; align-items: center; border: 1px solid ${activeColor}44; box-shadow: 0 0 15px ${activeColor}11;">
                <span style="font-size: 1.3rem;">${directionEmoji}</span>
              </div>
              <div style="display: flex; flex-direction: column;">
                <span style="font-size: var(--text-md); font-weight: var(--fw-bold); color: var(--text-primary);">${txType}</span>
                <span style="font-family: var(--font-mono); font-size: var(--text-3xs); color: ${activeColor}; letter-spacing: 0.08em; text-transform: uppercase; font-weight: var(--fw-bold);">${chain.name || chainKey}</span>
              </div>
            </div>

            <!-- Lista de Campos de Detalhes -->
            <div style="display: flex; flex-direction: column; gap: 12px;">
              
              <!-- ID / Hash -->
              <div style="display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
                <span style="font-weight: var(--fw-semibold); color: var(--text-muted); font-size: var(--text-2xs); text-transform: uppercase; letter-spacing: 0.05em;">Hash / ID</span>
                <span class="selectable tx-copyable" data-copy="${hashToUse}" style="font-family: var(--font-mono); color: var(--text-primary); font-size: var(--text-xs); word-break: break-all; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; background: var(--bg-input); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-subtle); transition: all var(--transition-fast);" onmouseover="this.style.borderColor='${activeColor}44'; this.style.background='var(--bg-active)';" onmouseout="this.style.borderColor='var(--border-subtle)'; this.style.background='var(--bg-input)';">
                  ${hashToUse}
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:${activeColor}; flex-shrink:0;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                </span>
              </div>

              <!-- Origem (From) -->
              <div style="display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
                <span style="font-weight: var(--fw-semibold); color: var(--text-muted); font-size: var(--text-2xs); text-transform: uppercase; letter-spacing: 0.05em;">${langDict.from || "Origem"}</span>
                <span class="selectable tx-copyable" data-copy="${txSender}" style="font-family: var(--font-mono); color: var(--text-primary); font-size: var(--text-xs); word-break: break-all; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; background: var(--bg-input); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-subtle); transition: all var(--transition-fast);" onmouseover="this.style.borderColor='${activeColor}44'; this.style.background='var(--bg-active)';" onmouseout="this.style.borderColor='var(--border-subtle)'; this.style.background='var(--bg-input)';">
                  ${txSender}
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:${activeColor}; flex-shrink:0;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                </span>
              </div>

              <!-- Destino (To) -->
              <div style="display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
                <span style="font-weight: var(--fw-semibold); color: var(--text-muted); font-size: var(--text-2xs); text-transform: uppercase; letter-spacing: 0.05em;">${langDict.to || "Destino"}</span>
                <span class="selectable tx-copyable" data-copy="${recipientFormatted}" style="font-family: var(--font-mono); color: var(--text-primary); font-size: var(--text-xs); word-break: break-all; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; background: var(--bg-input); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-subtle); transition: all var(--transition-fast);" onmouseover="this.style.borderColor='${activeColor}44'; this.style.background='var(--bg-active)';" onmouseout="this.style.borderColor='var(--border-subtle)'; this.style.background='var(--bg-input)';">
                  ${recipientFormatted}
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:${activeColor}; flex-shrink:0;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                </span>
              </div>

              <!-- Duas colunas para Valor e Status / Data -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <span style="font-weight: var(--fw-semibold); color: var(--text-muted); font-size: var(--text-2xs); text-transform: uppercase; letter-spacing: 0.05em;">${langDict.amount || "Valor"}</span>
                  <span style="font-family: var(--font-mono); color: var(--text-primary); font-size: var(--text-sm); font-weight: var(--fw-bold);">${formattedAmount}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end; text-align: right;">
                  <span style="font-weight: var(--fw-semibold); color: var(--text-muted); font-size: var(--text-2xs); text-transform: uppercase; letter-spacing: 0.05em;">Status</span>
                  <span style="font-family: var(--font-body); color: ${statusColor}; font-size: var(--text-xs); font-weight: var(--fw-bold); background: ${statusBg}; padding: 2px 8px; border-radius: 4px; border: 1px solid ${statusBorder};">${txStatus}</span>
                </div>
              </div>

              <!-- Tarifa de Rede (Network Fee) -->
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
                <span style="font-weight: var(--fw-semibold); color: var(--text-muted); font-size: var(--text-2xs); text-transform: uppercase; letter-spacing: 0.05em;">Tarifa de Rede</span>
                <span style="font-family: var(--font-mono); color: var(--text-primary); font-size: var(--text-xs);">${formattedFee}</span>
              </div>

              <!-- Data / Hora -->
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
                <span style="font-weight: var(--fw-semibold); color: var(--text-muted); font-size: var(--text-2xs); text-transform: uppercase; letter-spacing: 0.05em;">${langDict.date || "Data / Hora"}</span>
                <span style="font-family: var(--font-mono); color: var(--text-primary); font-size: var(--text-xs);">${txDate}</span>
              </div>

              <!-- Acordeão de Dados Brutos JSON -->
              <div style="border: 1px solid var(--border-subtle); border-radius: 8px; margin-top: var(--space-1); overflow: hidden;">
                <button id="tx-raw-toggle" style="width:100%; background:var(--bg-input); border:none; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; color:var(--text-muted); font-size:var(--text-2xs); cursor:pointer; font-weight:var(--fw-bold); border-bottom: 1px solid var(--border-subtle); transition: background var(--transition-fast);" onmouseover="this.style.background='var(--bg-hover)';" onmouseout="this.style.background='var(--bg-input)';">
                  <span>DADOS BRUTOS JSON (RAW)</span>
                  <span id="tx-raw-arrow" style="transition:transform 0.2s; display:inline-block; transform: rotate(0deg);">▼</span>
                </button>
                <div id="tx-raw-content" style="display:none; padding:12px; max-height:180px; overflow:auto; background:rgba(0,0,0,0.15); font-family:var(--font-mono); font-size:10px; border-radius: 0 0 8px 8px;">
                  <pre style="margin:0; white-space:pre-wrap; word-break:break-all; color:var(--text-muted); line-height: 1.4;">${JSON.stringify(result.raw || result.human, null, 2)}</pre>
                </div>
              </div>

            </div>

            <!-- Botões / CTAs -->
            <div style="display: flex; gap: var(--space-2); margin-top: var(--space-1);">
              <button id="tx-detail-btn-close" class="btn btn-outline" style="flex:1; height:38px; display:flex; justify-content:center; align-items:center; font-weight: var(--fw-bold);">${langDict.tokenDetailClose || "Fechar"}</button>
              <a href="${explorerUrl}" target="_blank" class="btn btn-primary" style="flex:2; height:38px; text-decoration:none; display:flex; justify-content:center; align-items:center; gap:6px; background:linear-gradient(135deg, ${activeColor} 0%, rgba(255,255,255,0.05) 100%); box-shadow: 0 4px 15px ${activeColor}33; border:1px solid var(--border-light); font-weight: var(--fw-bold);">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                ${langDict.viewInExplorer || "Ver no Explorer"}
              </a>
            </div>
          </div>
        `;

        // Eventos do modal de transação
        const btnClose = document.getElementById('tx-detail-btn-close');
        if (btnClose) {
          btnClose.addEventListener('click', () => {
            window.B2UIRenderer.closeModal('modal-tx-detail');
          });
        }

        // Accordion de dados brutos
        const rawToggle = document.getElementById('tx-raw-toggle');
        const rawContent = document.getElementById('tx-raw-content');
        const rawArrow = document.getElementById('tx-raw-arrow');
        if (rawToggle && rawContent) {
          rawToggle.addEventListener('click', () => {
            const isHidden = rawContent.style.display === 'none';
            rawContent.style.display = isHidden ? 'block' : 'none';
            if (rawArrow) {
              rawArrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
            }
          });
        }

        // Eventos de cópia
        const copyElements = modalBody.querySelectorAll('.tx-copyable');
        copyElements.forEach(el => {
          el.addEventListener('click', () => {
            const val = el.getAttribute('data-copy');
            navigator.clipboard.writeText(val);
            if (window.showToast) {
              window.showToast(langDict.addressCopied || langDict.tokenDetailCopied || 'Copiado!', 'success');
            }
          });
        });
      }
      window.B2UIRenderer && window.B2UIRenderer.openModal && window.B2UIRenderer.openModal('modal-tx-detail');
    } catch (e) {
      console.warn('Erro ao mostrar modal de transação:', e && e.message);
    }

    return result;
  }
}
window.B2Logger = new B2LoggerClass();
