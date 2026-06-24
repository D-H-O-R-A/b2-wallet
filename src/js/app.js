/**
 * B2 Wallet - Lógica de Controle Central do Aplicativo (App Core Engine)
 * 
 * Desenvolvido pela equipe sênior sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Este módulo unifica o estado central da carteira, gerencia as 17 redes de blockchains,
 * os temporizadores reativos de Auto-Lock, a autenticação por PIN/Senha e o tratamento de eventos
 * bidirecionais das chamadas DApps via SDK.
 */

/**
 * B2 Wallet - Logger de Eventos do Desenvolvedor (Cyberpunk Hacker Style Logs)
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

class B2WalletApp {
  constructor() {
    this.currentLanguage = localStorage.getItem("b2_language") || "pt";
    this.currentTheme = localStorage.getItem("b2_theme") || "dark";
    this.autoLockMinutes = parseInt(localStorage.getItem("b2_autolock_minutes")) || 5;

    // Estado volátil na RAM (Apagados imediatamente no lock)
    this.decryptedSeed = null;
    this.derivedKeys = {}; // Armazena temporariamente endereços e chaves privadas ativas

    // Configurações e payloads criptográficos persistentes salvos localmente
    this.encryptedWalletPayload = null;
    this.userPinHash = null; // PIN persistente de acesso rápido
    this.autoLockTimer = null;
    this.lastInteractionTime = Date.now();
    this.lastUnlockTime = 0; // Monitora política de 30 minutos de exigência de senha

    // Onboarding and confirmation state flow
    this.isImportFlow = false;
    this.generatedMnemonicStr = "";
    this.confirmIndices = [];

    // Definição das blockchains a partir do registro modular unificado (Standard Registry Layout)
    const registry = window.B2BlockchainRegistry || [];
    this.blockchainData = registry.map(chain => ({
      ...chain,
      balanceCrypto: 0.0,
      balanceFiat: 0.0,
      discoveredTokens: [],
      discoveredNFTs: []
    }));

    this.testnetEnabled = localStorage.getItem("b2_testnet_enabled") === "true";
    this.networkMode = localStorage.getItem("b2_network_mode") || "mainnet";
    this.rebuildBlockchainData();

    // Gateway Focus Mode state
    this.activeChainKey = localStorage.getItem("b2_active_chain_key") || "ETH";
    this.activeBalanceUpdates = {};

    // ── MANUTENÇÃO ───────────────────────────────────────────────────────────
    // IDs das blockchains em manutenção (ex: ['BTC', 'ETH'])
    this.maintenanceChains = ['DOGE', 'BCH', "LTC", "BTC", "DASH", "ZEC", "CARDANO", "TRON", "STELLAR", "MONERO", "POLKADOT", "ICP", "FILECOIN", "NEO"];
    // IDs dos tokens em manutenção (ex: ['USDT', 'assetId_aqui'])
    this.maintenanceTokens = [];
    // ────────────────────────────────────────────────────────────────────────
  }

  /**
   * Ponto de entrada e inicialização global do ecossistema de carteira.
   */
  async initialize() {
    // Detecta se está sendo executada no popup da extensão e aplica configurações estritas (compatível com Chrome, Firefox e outros)
    const isExtensionPopup = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL &&
      window.location.protocol.includes('extension') &&
      !window.location.search.includes('fulltab=true')) ||
      window.location.search.includes('popup=true');

    if (isExtensionPopup) {
      document.documentElement.classList.add('is-extension-popup');
      const expandBtn = document.getElementById("b2-expand-btn");
      if (expandBtn) {
        expandBtn.style.display = "flex";
        expandBtn.addEventListener('click', () => {
          if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
            chrome.tabs.create({ url: chrome.runtime.getURL('index.html?fulltab=true') });
          } else {
            window.open('index.html?fulltab=true', '_blank');
          }
        });
      }
    } else {
      document.documentElement.classList.add('is-fulltab');
    }

    this.loadPersistedData();
    await this.initBiometrics();

    // Warm up Polkadot sr25519 cryptography if the library is loaded
    if (window.PolkadotCrypto && typeof window.PolkadotCrypto.cryptoWaitReady === 'function') {
      try {
        await window.PolkadotCrypto.cryptoWaitReady();
      } catch (e) {
        console.warn('[initialize] Polkadot cryptoWaitReady failed:', e);
      }
    }

    this.applyTheme(this.currentTheme);
    window.B2TranslateUI(this.currentLanguage, true);
    window.B2PlatformSecurity.setupAntiScreenshotListeners();

    this.setupAppEventListeners();
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    this.setupAutoLockTracker();
    this.setupSDKMessageListener();

    // Decide qual tela inicial exibir baseada na presença de payload criptografado local, sessão ativa ou parâmetros de fluxo
    console.log('[initialize] Estado do payload:', {
      hasPayload: !!this.encryptedWalletPayload,
      hasCiphertext: !!this.encryptedWalletPayload?.ciphertext,
      storedValue: localStorage.getItem('b2_encrypted_payload') ? 'YES' : 'NO',
      hasSession: !!this.decryptedSeed
    });

    const flowParams = new URLSearchParams(window.location.search);
    const flow = flowParams.get('flow');
    if (flow === 'create') {
      this.isImportFlow = false;
      this.resetCreatePasswordView();
      const outcome = document.getElementById("seed-generation-outcome");
      if (outcome) outcome.style.display = "none";
      const submitBtn = document.getElementById("btn-create-wallet-submit");
      if (submitBtn) submitBtn.innerText = "Criar Carteira";
      window.B2UIRenderer.navigateTo("view-create-password");
      return;
    } else if (flow === 'import') {
      this.isImportFlow = true;
      window.B2UIRenderer.navigateTo("view-welcome");
      setTimeout(async () => {
        const seedInput = await window.B2Toast.importSeedModal();
        if (seedInput) {
          this.generatedMnemonicStr = seedInput.trim();
          this.resetCreatePasswordView();
          const outcome = document.getElementById("seed-generation-outcome");
          if (outcome) outcome.style.display = "none";
          const submitBtn = document.getElementById("btn-create-wallet-submit");
          if (submitBtn) submitBtn.innerText = "Importar Carteira";
          window.B2UIRenderer.navigateTo("view-create-password");
        } else {
          window.B2UIRenderer.navigateTo("view-welcome");
        }
      }, 300);
      return;
    }

    if (this.decryptedSeed) {
      console.log('[initialize] → view-dashboard (sessão ativa)');
      window.B2UIRenderer.navigateTo("view-dashboard");
      this.setActiveChain(this.activeChainKey);
    } else if (this.encryptedWalletPayload && this.encryptedWalletPayload.ciphertext) {
      console.log('[initialize] → view-locked');
      window.B2UIRenderer.navigateTo("view-locked");
      // Fallback defensivo: garante que view-locked é visível mesmo em casos de race condition
      // com o CSS/GPU do popup da extensão (evita tela preta persistente)
      const isExtensionPopup = document.documentElement.classList.contains('is-extension-popup');
      if (isExtensionPopup) {
        setTimeout(() => {
          const vl = document.getElementById('view-locked');
          if (vl) {
            const computed = window.getComputedStyle(vl);
            const notVisible = computed.display === 'none' || computed.opacity === '0' || computed.visibility === 'hidden';
            if (notVisible) {
              console.warn('[initialize] Fallback: view-locked não estava visível, forçando re-render...');
              window.B2UIRenderer.navigateTo("view-locked");
            }
          }
        }, 120);
      }
    } else {
      console.log('[initialize] → view-welcome');
      window.B2UIRenderer.navigateTo("view-welcome");
    }
  }

  /**
   * Reconstroi a lista de blockchains ativas e seus parâmetros baseado no modo de rede (Mainnet vs Testnet).
   */
  rebuildBlockchainData() {
    const registry = window.B2BlockchainRegistry || [];
    const isTestnet = this.networkMode === 'testnet';

    if (isTestnet) {
      // Filtrar as redes que não possuem testnet pública ativa
      const unsupportedKeys = ["DOGE", "BCH", "DASH", "ZEC", "AMZX", "CELERONX", "MONERO", "ICP"];
      const filteredRegistry = registry.filter(chain => !unsupportedKeys.includes(chain.key));

      this.blockchainData = filteredRegistry.map(chain => {
        // Objeto base clonado
        let testnetChain = {
          ...chain,
          balanceCrypto: 0.0,
          balanceFiat: 0.0,
          discoveredTokens: [],
          discoveredNFTs: []
        };

        // Overrides para redes EVM
        if (chain.engine === 'EVM' && window.B2EvmNetworkRegistry && window.B2EvmNetworkRegistry.testnetOverrides) {
          const override = window.B2EvmNetworkRegistry.testnetOverrides[chain.key];
          if (override) {
            testnetChain.chainId = override.chainId;
            testnetChain.nodeUrl = override.rpcUrls[0];
            testnetChain.explorer = override.explorer;
            testnetChain.faucet = override.faucet;
          }
        }
        // Overrides para redes não-EVM
        else if (chain.key === 'BTC') {
          testnetChain.coinType = 1;
          testnetChain.nodeUrl = "https://mempool.space/testnet4/api";
          testnetChain.feeApiUrl = "https://mempool.space/testnet4/api/v1/fees/recommended";
          testnetChain.explorer = "https://mempool.space/testnet4";
          testnetChain.isTestnet4 = true;
          testnetChain.faucet = "https://coinfaucet.eu/en/btc-testnet4/";
        } else if (chain.key === 'LTC') {
          testnetChain.coinType = 1;
          testnetChain.nodeUrl = "https://litecoinspace.org/testnet/api";
          testnetChain.explorer = "https://litecoinspace.org/testnet";
          testnetChain.faucet = "https://coinfaucet.eu/en/ltc-testnet/";
        } else if (chain.key === 'WAVES') {
          testnetChain.chainId = 84; // 'T'
          testnetChain.nodeUrl = "https://nodes-testnet.wavesnodes.com";
          testnetChain.explorer = "https://testnet.wavesexplorer.com";
          testnetChain.faucet = "https://testnet.wavesexplorer.com/faucet";
        } else if (chain.key === 'SOLANA') {
          testnetChain.nodeUrl = "https://api.testnet.solana.com";
          testnetChain.explorer = "https://explorer.solana.com/?cluster=testnet";
          testnetChain.faucet = "https://solfaucet.com/";
        } else if (chain.key === 'CARDANO') {
          testnetChain.nodeUrl = "https://cardano-preprod.blockfrost.io/api/v0";
          testnetChain.explorer = "https://preprod.cardanoscan.io";
          testnetChain.faucet = "https://docs.cardano.org/cardano-testnets/tools/faucet/";
        } else if (chain.key === 'TRON') {
          testnetChain.nodeUrl = "https://api.nileex.io";
          testnetChain.explorer = "https://nile.tronscan.org";
          testnetChain.faucet = "https://nileex.io/join/getTRX";
        } else if (chain.key === 'STELLAR') {
          testnetChain.nodeUrl = "https://horizon-testnet.stellar.org";
          testnetChain.explorer = "https://stellar.expert/explorer/testnet";
          testnetChain.faucet = "https://laboratory.stellar.org/#friendbot";
        } else if (chain.key === 'POLKADOT') {
          testnetChain.nodeUrl = "https://westend-rpc.polkadot.io";
          testnetChain.explorer = "https://westend.subscan.io";
          testnetChain.faucet = "https://faucet.polkadot.network/";
        } else if (chain.key === 'FILECOIN') {
          testnetChain.nodeUrl = "https://api.calibration.node.glif.io/rpc/v1";
          testnetChain.explorer = "https://calibration.filfox.info";
          testnetChain.faucet = "https://faucet.calibration.fildev.network/";
        } else if (chain.key === 'NEO') {
          testnetChain.nodeUrl = "https://testnet1.neo.coz.io:443";
          testnetChain.explorer = "https://testnet.neotube.io";
          testnetChain.faucet = "https://neofaucet.org/";
        }

        return testnetChain;
      });
    } else {
      // Mainnet: Restaurar as blockchains padrões originais
      this.blockchainData = registry.map(chain => ({
        ...chain,
        balanceCrypto: 0.0,
        balanceFiat: 0.0,
        discoveredTokens: [],
        discoveredNFTs: []
      }));
    }

    // Se a chain ativa não estiver na lista reconstruída, retroceder para WAVES (ou a primeira disponível)
    const isChainSupported = this.blockchainData.some(c => c.key === this.activeChainKey);
    if (!isChainSupported && this.blockchainData.length > 0) {
      this.activeChainKey = this.blockchainData[0].key;
      localStorage.setItem("b2_active_chain_key", this.activeChainKey);
    }

    // Sincroniza os tokens customizados imediatamente após reconstruir a blockchain (alternar de rede)
    this.loadCustomTokens();
    this.applyRpcOverrides();
  }

  /**
   * Recupera os dados salvos localmente no dispositivo.
   * Inclui suporte a múltiplas contas (multi-account).
   */
  loadPersistedData() {
    const savedPayload = localStorage.getItem("b2_encrypted_payload");
    const savedPin = localStorage.getItem("b2_pin_hash");
    const savedTheme = localStorage.getItem("b2_theme");
    const savedLang = localStorage.getItem("b2_language");
    const savedChain = localStorage.getItem("b2_active_chain_key");
    const savedAccounts = localStorage.getItem("b2_accounts");
    const savedActiveIdx = localStorage.getItem("b2_active_account_idx");

    if (savedPayload) {
      try {
        let parsed = JSON.parse(savedPayload);
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        this.encryptedWalletPayload = parsed;
        console.log('[loadPersistedData] ✓ Payload carregado:', !!this.encryptedWalletPayload && !!this.encryptedWalletPayload.ciphertext);
      } catch (err) {
        console.error('[loadPersistedData] ✗ Falha ao parsear:', err.message);
        this.encryptedWalletPayload = null;
      }
    } else {
      console.warn('[loadPersistedData] ⚠ Nenhum payload em localStorage');
    }
    if (savedPin) this.userPinHash = savedPin;
    if (savedTheme) this.currentTheme = savedTheme;
    if (savedLang) this.currentLanguage = savedLang;
    if (savedChain) this.activeChainKey = savedChain;

    // Multi-account: carrega lista de contas salvas
    if (savedAccounts) {
      try {
        this.accounts = JSON.parse(savedAccounts);
      } catch (_) {
        this.accounts = [];
      }
    } else {
      this.accounts = [];
    }
    this.activeAccountIndex = parseInt(savedActiveIdx || "0", 10);

    // Sincroniza tokens customizados importados do localStorage antes de qualquer atualização
    this.loadCustomTokens();

    // Restaura a sessão do mnemônico se estiver salva em sessionStorage (seguro contra page refresh)
    const sessionSeed = sessionStorage.getItem("b2_session_seed");
    if (sessionSeed && window.B2KeyDerivationEngine && window.B2KeyDerivationEngine.validateMnemonic(sessionSeed)) {
      this.decryptedSeed = sessionSeed;
      this.lastUnlockTime = Date.now();
      this.lastInteractionTime = Date.now();
      this.deriveAllAddresses();
      this.updateNetworkBalances();
    } else {
      const activeAcc = this.accounts[this.activeAccountIndex];
      if (activeAcc && activeAcc.type === 'watch-only') {
        this.deriveAllAddresses();
        this.updateNetworkBalances();
      }
    }
    this.applyRpcOverrides();
  }

  applyRpcOverrides() {
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
  }

  async initBiometrics() {
    this.biometricEnabled = localStorage.getItem("b2_biometric_enabled") === "true";
    const NativeBiometric = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeBiometric;
    if (!NativeBiometric) {
      console.log("[Biometrics] Plugin NativeBiometric indisponível (rodando no browser ou extensão).");
      return;
    }
    try {
      const result = await NativeBiometric.isAvailable();
      if (result && result.isAvailable) {
        console.log("[Biometrics] Disponível:", result.biometryType);

        const switchContainer = document.getElementById("biometric-switch-container");
        if (switchContainer) {
          switchContainer.style.display = "flex";
        }

        const biometricSwitch = document.getElementById("switch-enable-biometrics");
        if (biometricSwitch) {
          biometricSwitch.checked = this.biometricEnabled;
          biometricSwitch.addEventListener("change", async (e) => {
            const enabled = e.target.checked;
            await this.promptPasswordForBiometrics(enabled);
          });
        }

        this.updateBiometricUnlockUI();
      }
    } catch (err) {
      console.error("[Biometrics] Erro ao checar biometria:", err);
    }
  }

  async promptPasswordForBiometrics(enable) {
    if (enable) {
      const pwd = await window.B2Toast.prompt(
        "Confirmar Biometria",
        "Digite sua senha para habilitar o desbloqueio por digital/Face ID:",
        "password",
        "Sua senha de acesso..."
      );
      if (!pwd) {
        const biometricSwitch = document.getElementById("switch-enable-biometrics");
        if (biometricSwitch) biometricSwitch.checked = false;
        return;
      }
      try {
        const seed = await window.B2PlatformSecurity.decryptData(this.encryptedWalletPayload, pwd);
        if (!window.B2KeyDerivationEngine.validateMnemonic(seed)) {
          throw new Error("Semente BIP-39 inválida descriptografada.");
        }

        const NativeBiometric = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeBiometric;
        if (NativeBiometric) {
          await NativeBiometric.setCredentials({
            username: "b2wallet_user",
            password: pwd,
            server: "com.better2better.b2wallet"
          });
          localStorage.setItem("b2_biometric_enabled", "true");
          this.biometricEnabled = true;
          window.B2Toast.alert("Sucesso", "Desbloqueio por biometria configurado!", "success");
          this.updateBiometricUnlockUI();
        }
      } catch (err) {
        window.B2Toast.alert("Erro", "Senha incorreta. Não foi possível ativar a biometria.", "error");
        const biometricSwitch = document.getElementById("switch-enable-biometrics");
        if (biometricSwitch) biometricSwitch.checked = false;
      }
    } else {
      localStorage.setItem("b2_biometric_enabled", "false");
      this.biometricEnabled = false;
      window.B2Toast.alert("Biometria Desativada", "Desbloqueio por biometria desativado.", "success");
      this.updateBiometricUnlockUI();
    }
  }

  async tryBiometricUnlock() {
    const NativeBiometric = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeBiometric;
    if (!NativeBiometric || !this.biometricEnabled) return;
    try {
      const credentials = await NativeBiometric.getCredentials({
        server: "com.better2better.b2wallet"
      });
      if (credentials && credentials.password) {
        await this.unlockWallet(credentials.password);
      }
    } catch (err) {
      console.warn("Autenticação biométrica cancelada ou falhou:", err);
    }
  }

  updateBiometricUnlockUI() {
    const NativeBiometric = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeBiometric;
    const bioBtn = document.getElementById("unlock-biometric-btn");
    if (bioBtn) {
      if (NativeBiometric && this.biometricEnabled) {
        bioBtn.style.display = "inline-flex";
      } else {
        bioBtn.style.display = "none";
      }
    }
  }

  showRpcErrorDialog(chain, originalErrorMsg) {
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
  }

  getCustomTokensStorageKey(chainKey) {
    const isTestnet = this.networkMode === 'testnet';
    return `b2_discovered_tokens_${chainKey}${isTestnet ? '_testnet' : ''}`;
  }

  /**
   * Sincroniza de forma síncrona e imediata todos os tokens customizados adicionados pelo usuário
   * do localStorage para o array de discoveredTokens das respectivas blockchains.
   */
  loadCustomTokens() {
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
  }

  // ─── MULTI-ACCOUNT ───────────────────────────────────────────────────────────

  /**
   * Cria uma nova conta derivada a partir do mesmo seed, com índice de derivação único.
   * Cada conta usa path m/44'/coin'/accountIndex'/0/0.
   * NOTA: Requer que a wallet esteja desbloqueada (seed em memória).
   */
  createNewAccount(label) {
    if (!this.decryptedSeed) {
      window.showToast('Desbloqueie a carteira para criar uma conta.', 'warning');
      return null;
    }
    const newIdx = this.accounts.length;
    const account = {
      index: newIdx,
      label: label || `Conta ${newIdx + 1}`,
      createdAt: Date.now(),
      type: 'derived'
    };
    this.accounts.push(account);
    localStorage.setItem("b2_accounts", JSON.stringify(this.accounts));
    window.showToast(`✅ ${account.label} criada com sucesso.`, 'success');
    this._refreshAccountChipLabel();
    return account;
  }

  importAccount(label, privateKeyOrSeed) {
    if (!privateKeyOrSeed) {
      window.showToast('Chave privada, seed ou endereço público inválido.', 'error');
      return null;
    }
    const trimmed = privateKeyOrSeed.trim();
    // Detect watch-only account (0x followed by 40 hex chars)
    const isWatchOnly = /^0x[a-fA-F0-9]{40}$/.test(trimmed);

    if (!isWatchOnly && trimmed.length < 32) {
      window.showToast('Chave privada ou seed inválida.', 'error');
      return null;
    }

    const newIdx = this.accounts.length;
    let account;
    if (isWatchOnly) {
      account = {
        index: newIdx,
        label: label || `Watch-Only ${newIdx + 1}`,
        createdAt: Date.now(),
        type: 'watch-only',
        address: trimmed
      };
    } else {
      account = {
        index: newIdx,
        label: label || `Importada ${newIdx + 1}`,
        createdAt: Date.now(),
        type: 'imported',
        // Armazena hash da chave para identificação (nunca a chave em si)
        keyHash: btoa(trimmed.substring(0, 16)).substring(0, 8)
      };
    }
    this.accounts.push(account);
    localStorage.setItem("b2_accounts", JSON.stringify(this.accounts));
    if (isWatchOnly) {
      window.showToast(`✅ Conta Watch-Only "${account.label}" importada com sucesso.`, 'success');
    } else {
      window.showToast(`✅ ${account.label} importada. Funcionalidade completa em breve.`, 'info');
    }
    this._refreshAccountChipLabel();
    return account;
  }

  /**
   * Remove uma conta da lista (exceto a conta principal, índice 0).
   */
  removeAccount(index) {
    if (index === 0) {
      window.showToast('A conta principal não pode ser removida.', 'warning');
      return false;
    }
    if (index < 0 || index >= this.accounts.length) return false;
    this.accounts.splice(index, 1);
    // Re-indexa
    this.accounts.forEach((acc, i) => { acc.index = i; });
    localStorage.setItem("b2_accounts", JSON.stringify(this.accounts));
    if (this.activeAccountIndex >= this.accounts.length) {
      this.switchAccount(this.accounts.length - 1);
    }
    window.showToast('Conta removida.', 'info');
    return true;
  }

  switchAccount(index) {
    if (index < 0 || index >= this.accounts.length) return;
    this.activeAccountIndex = index;
    localStorage.setItem("b2_active_account_idx", String(index));
    window.showToast(`Conta "${this.accounts[index]?.label || `#${index}`}" ativa.`, 'info');
    this._refreshAccountChipLabel();

    // Limpa cache de balanços ao trocar de conta para garantir novos dados do endereço correto
    this.blockchainData.forEach(chain => {
      delete chain.lastLoaded;
    });

    const activeAcc = this.accounts[index];
    if (activeAcc && activeAcc.type === 'watch-only') {
      this.deriveAllAddresses();
      this.setActiveChain(this.activeChainKey);
      this.updateNetworkBalances();
    } else if (this.decryptedSeed) {
      try {
        this.deriveAllAddresses();
        this.setActiveChain(this.activeChainKey);
        this.updateNetworkBalances();
      } catch (e) {
        window.B2Logger.log('warn', `Não foi possível re-derivar chaves para conta ${index}: ${e.message}`);
      }
    }
  }

  /**
   * Atualiza o chip de conta no dashboard com o label da conta ativa.
   */
  _refreshAccountChipLabel() {
    const chipLabel = document.getElementById('account-chip-label');
    if (!chipLabel) return;
    const acc = this.accounts[this.activeAccountIndex];
    chipLabel.textContent = acc ? acc.label : 'Conta Principal';
  }

  /**
   * Reseta os campos, tipos e checklist visual da tela de criação de senha.
   */
  resetCreatePasswordView() {
    const pwdInput = document.getElementById("password-input");
    const confirmInput = document.getElementById("password-confirm-input");
    const pinInput = document.getElementById("pin-input");

    if (pwdInput) { pwdInput.value = ""; pwdInput.type = "password"; }
    if (confirmInput) { confirmInput.value = ""; confirmInput.type = "password"; }
    if (pinInput) { pinInput.value = ""; pinInput.type = "password"; }

    document.querySelectorAll(".password-toggle-btn").forEach(btn => {
      const openElements = btn.querySelectorAll(".eye-open");
      const closedElements = btn.querySelectorAll(".eye-closed");
      openElements.forEach(el => el.style.display = "block");
      closedElements.forEach(el => el.style.display = "none");
    });

    // Reset checklist items to default (unchecked)
    ["req-length", "req-case", "req-number", "req-special", "req-match", "req-pin"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.color = "var(--text-muted)";
        const icon = el.querySelector(".req-icon");
        if (icon) icon.textContent = "❌";
      }
    });
  }


  /**
   * Altera dinamicamente o tema visual claro ou escuro.
   */
  applyTheme(theme) {
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
  }

  /**
   * Altera a blockchain ativa (Gateway Focus Mode), atualizando as variáveis de CSS, glows do header, e re-renderizando.
   */
  setActiveChain(chainKey) {
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
      } else if (chainKey === 'CELERONX' || activeColor === '#06b6d4' || activeColor === '#38bdf8') {
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
  }

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                    SISTEMA DE MANUTENÇÃO                               ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  /**
   * Exibe o popup premium de manutenção.
   * @param {'chain'|'token'} type - Tipo do recurso em manutenção.
   * @param {string} name - Nome amigável do recurso (ex: "Bitcoin", "USDT").
   */
  _maintenancePopup(type, name) {
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
  }

  /**
   * Verifica se uma chain está em manutenção.
   * Se estiver, exibe o popup e redireciona para a primeira chain disponível.
   * @param {string} chainKey - Key da blockchain.
   * @returns {boolean} true se a chain está em manutenção (ação cancelada).
   */
  checkMaintenanceChain(chainKey) {
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
  }

  /**
   * Verifica se um token está em manutenção.
   * @param {string} tokenId - assetId, symbol ou contractAddress do token.
   * @returns {boolean} true se o token está em manutenção (ação cancelada).
   */
  checkMaintenanceToken(tokenId) {
    if (!this.maintenanceTokens || this.maintenanceTokens.length === 0) return false;
    if (!tokenId) return false;
    const id = String(tokenId);
    const blocked = this.maintenanceTokens.some(t => t === id || t.toUpperCase() === id.toUpperCase());
    if (!blocked) return false;
    this._maintenancePopup('token', id);
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════

  showAddTokenModal() {
    const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
    if (!chain) return;

    const engine = chain.engine || 'Custom';

    // Elementos do modal
    const engineNameEl = document.getElementById('add-token-engine-name');
    const engineDescEl = document.getElementById('add-token-engine-desc');
    const chainNameEl = document.getElementById('add-token-chain-name');
    const chainDotEl = document.getElementById('add-token-chain-dot');
    const contractLabelEl = document.getElementById('add-token-contract-label');
    const contractInputEl = document.getElementById('add-token-contract');
    const contractHintEl = document.getElementById('add-token-contract-hint');

    if (chainNameEl) chainNameEl.textContent = chain.name;
    if (chainDotEl) chainDotEl.style.backgroundColor = chain.color || 'var(--color-primary)';

    if (engineNameEl) engineNameEl.textContent = engine;

    if (engine === 'EVM') {
      if (engineDescEl) engineDescEl.textContent = 'Tokens compatíveis com padrão ERC-20. Insira o endereço do contrato inteligente.';
      if (contractLabelEl) contractLabelEl.textContent = 'Endereço do Contrato (ERC-20)';
      if (contractInputEl) {
        contractInputEl.placeholder = '0x...';
        contractInputEl.value = '';
      }
      if (contractHintEl) contractHintEl.textContent = 'Formato: 0x seguido de 40 caracteres hexadecimais';
    } else if (engine === 'Waves') {
      const displayEngine = (chain.key === 'AMZX') ? 'AMZX' : (chain.key === 'CELERONX' ? 'PlanetOne' : 'Waves');
      if (engineDescEl) engineDescEl.textContent = `Ativos customizados criados no ecossistema ${displayEngine}. Insira o ID do Asset.`;
      if (contractLabelEl) contractLabelEl.textContent = 'ID do Ativo (Asset ID)';
      if (contractInputEl) {
        contractInputEl.placeholder = 'Ex: G8v7Z...';
        contractInputEl.value = '';
      }
      if (contractHintEl) contractHintEl.textContent = 'Formato: string Base58 de 32 a 44 caracteres';
    } else if (engine === 'Solana') {
      if (engineDescEl) engineDescEl.textContent = 'Tokens SPL do ecossistema Solana. Insira o endereço Mint.';
      if (contractLabelEl) contractLabelEl.textContent = 'Endereço Mint do Token (SPL)';
      if (contractInputEl) {
        contractInputEl.placeholder = 'Ex: EPjFW...';
        contractInputEl.value = '';
      }
      if (contractHintEl) contractHintEl.textContent = 'Formato: string Base58 de 32 a 44 caracteres';
    } else if (engine === 'Tron') {
      if (engineDescEl) engineDescEl.textContent = 'Tokens padrão TRC-20 da rede Tron. Insira o endereço do contrato.';
      if (contractLabelEl) contractLabelEl.textContent = 'Endereço do Contrato (TRC-20)';
      if (contractInputEl) {
        contractInputEl.placeholder = 'Ex: TR7NH...';
        contractInputEl.value = '';
      }
      if (contractHintEl) contractHintEl.textContent = 'Formato: endereço Base58 iniciando com T';
    } else if (engine === 'Stellar') {
      if (engineDescEl) engineDescEl.textContent = 'Tokens e ativos customizados (Trustlines) da rede Stellar. Insira o identificador no formato CODE:ISSUER.';
      if (contractLabelEl) contractLabelEl.textContent = 'Ativo Stellar (CODE:EMISSOR)';
      if (contractInputEl) {
        contractInputEl.placeholder = 'Ex: USDC:GBBD4S237...';
        contractInputEl.value = '';
      }
      if (contractHintEl) contractHintEl.textContent = 'Formato: CÓDIGO do Ativo seguido de dois pontos (:) e a Chave Pública do Emissor';
    } else {
      if (engineDescEl) engineDescEl.textContent = 'Ativos adicionais na rede ativa.';
      if (contractLabelEl) contractLabelEl.textContent = 'Identificador/Contrato';
      if (contractInputEl) {
        contractInputEl.placeholder = 'Insira o ID ou endereço';
        contractInputEl.value = '';
      }
      if (contractHintEl) contractHintEl.textContent = 'Insira um identificador único de pelo menos 10 caracteres';
    }

    // Reseta campos
    const nameInput = document.getElementById('add-token-name');
    const symbolInput = document.getElementById('add-token-symbol');
    const decimalsInput = document.getElementById('add-token-decimals');
    if (nameInput) {
      nameInput.value = '';
      nameInput.disabled = false;
    }
    if (symbolInput) {
      symbolInput.value = '';
      symbolInput.disabled = false;
    }
    if (decimalsInput) {
      decimalsInput.value = (engine === 'EVM' ? '18' : engine === 'Solana' ? '9' : engine === 'Tron' ? '6' : engine === 'Stellar' ? '7' : '8');
      decimalsInput.disabled = false;
    }
    const submitBtn = document.getElementById('btn-add-token-submit');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }

    window.B2UIRenderer.openModal('modal-add-token');
  }

  /**
   * Configura dinamicamente o modal de adicionar NFT de acordo com a rede ativa.
   */
  showAddNFTModal() {
    const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
    if (!chain) return;

    const chainNameEl = document.getElementById('add-nft-chain-name');
    const chainDotEl = document.getElementById('add-nft-chain-dot');
    const contractInputEl = document.getElementById('add-nft-contract');
    const tokenIdInputEl = document.getElementById('add-nft-token-id');
    const nameInputEl = document.getElementById('add-nft-name');
    const collectionInputEl = document.getElementById('add-nft-collection');
    const contractLabelEl = document.getElementById('add-nft-contract-label');

    if (chainNameEl) chainNameEl.textContent = chain.name;
    if (chainDotEl) chainDotEl.style.backgroundColor = chain.color || 'var(--color-primary)';

    if (contractLabelEl) {
      if (chain.engine === 'EVM') {
        contractLabelEl.textContent = 'Endereço do Contrato (ERC-721 / ERC-1155)';
      } else if (chain.engine === 'Solana') {
        contractLabelEl.textContent = 'Endereço Mint do NFT';
      } else {
        contractLabelEl.textContent = 'ID do Ativo ou Endereço do Contrato';
      }
    }

    if (contractInputEl) contractInputEl.value = '';
    if (tokenIdInputEl) tokenIdInputEl.value = '';
    if (nameInputEl) nameInputEl.value = '';
    if (collectionInputEl) collectionInputEl.value = '';

    window.B2UIRenderer.openModal('modal-add-nft');
  }

  /**
   * Adiciona uma transação simulada ao histórico específico de uma blockchain ativa.
   */
  addTransaction(chainKey, tx) {
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
  }

  /**
   * Atualiza o status de uma transação específica no histórico.
   */
  updateTransactionStatus(chainKey, txId, newStatus, extraData = {}) {
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
  }

  /**
   * Realiza polling em background para obter o recibo de uma transação EVM e atualizar seu status.
   */
  _pollEVMTransactionReceipt(chain, txHash, localTxId, amt, feeData, price) {
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
  }

  /**
   * Decodifica strings dinâmicas no padrão ABI do Solidity.
   */
  decodeAbiString(hex) {
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
  }

  /**
   * Consulta os metadados ERC-20 (name, symbol, decimals) em paralelo usando eth_call.
   */
  async fetchErc20TokenMetadata(contractAddress, nodeUrl) {
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
  }

  async fetchTransactionDetails(chainKey, txId, fallbackTxData = null) {
    if (window.B2Logger && typeof window.B2Logger.fetchTransactionDetails === 'function') {
      return window.B2Logger.fetchTransactionDetails(chainKey, txId, fallbackTxData);
    }
  }

  async fetchTokenDetails(chainKey, token) {
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
          [langDict.tokenDetailAlgorithm || "Algorithm"]: (chain.key === 'AMZX') ? 'AMZX Network' : (chain.key === 'CELERONX' ? 'PlanetOne Network' : (chain.engine || 'Waves Core')),
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
  }

  /**
   * Inicia um arrendamento LPoS na rede WAVES/AMZX/PLANETONE/TN.
   */
  startLPoSLease(chainKey, node, nodeName, amount) {
    const chain = this.blockchainData.find(c => c.key === chainKey);
    if (!chain) return;

    if (isNaN(amount) || amount <= 0) {
      window.showToast("Por favor, digite um montante válido para arrendamento.", "error");
      return;
    }

    if (amount > chain.balanceCrypto) {
      window.showToast("Saldo insuficiente para realizar o arrendamento.", "error");
      return;
    }

    // Atualização otimista de saldo local
    chain.balanceCrypto -= amount;
    const coinPrice = chain.balanceCrypto > 0 ? (chain.balanceFiat / (chain.balanceCrypto + amount)) : 0;
    chain.balanceFiat = chain.balanceCrypto * coinPrice;

    // Salva o arrendamento localmente com ID temporário
    const key = `b2_leases_${chainKey}`;
    const leases = JSON.parse(localStorage.getItem(key) || "[]");
    const tempId = Math.random().toString(36).substring(2, 9);
    const newLease = {
      id: tempId,
      validatorAddress: node,
      validatorName: nodeName,
      amount: amount,
      status: "Pendente"
    };
    leases.push(newLease);
    localStorage.setItem(key, JSON.stringify(leases));

    // Adiciona log de transação
    this.addTransaction(chainKey, {
      type: "Arrendado LPoS",
      amount: `-${amount.toFixed(4)} ${chain.symbol}`,
      addr: node.substring(0, 6) + "..." + node.substring(node.length - 4),
      color: "var(--text-danger)"
    });

    window.B2Logger.log("info", `Iniciando broadcast de arrendamento LPoS: ${amount} ${chain.symbol} → ${nodeName}`);
    this.setActiveChain(chainKey);

    // ── BROADCAST REAL PARA REDES WAVES ──
    if (chain.engine === 'Waves' && chain.nodeUrl && this.decryptedSeed) {
      window.showToast(`Transmitindo arrendamento de ${amount} ${chain.symbol}…`, 'info');
      window.B2WavesBroadcaster.startWavesLease(
        this.decryptedSeed,
        chain.nodeUrl,
        node,
        amount,
        this.activeAccountIndex
      ).then(result => {
        const txId = result.id || result.txId || tempId;
        // Atualiza o lease local com o ID real da blockchain
        const currentLeases = JSON.parse(localStorage.getItem(key) || "[]");
        const lease = currentLeases.find(l => l.id === tempId);
        if (lease) {
          lease.id = txId;
          lease.status = "Ativo";
          localStorage.setItem(key, JSON.stringify(currentLeases));
        }
        window.showToast(`✅ Arrendamento confirmado! TX: ${txId.substring(0, 12)}…`, 'success');
        window.B2Logger.log('success', `[Waves Lease] TX confirmada: ${txId} | Validador: ${nodeName}`);
        this._renderActiveLeasesInView(chainKey, chain);
      }).catch(err => {
        window.showToast(`❌ Falha no arrendamento: ${err.message}`, 'error');
        window.B2Logger.log('error', `[Waves Lease] Erro no broadcast: ${err.message}`);
        // Reverte o lease e o saldo
        const currentLeases = JSON.parse(localStorage.getItem(key) || "[]");
        localStorage.setItem(key, JSON.stringify(currentLeases.filter(l => l.id !== tempId)));
        chain.balanceCrypto += amount;
        chain.balanceFiat = chain.balanceCrypto * coinPrice;
        window.B2UIRenderer.renderBlockchainList(this.blockchainData);
        this.updateTotalBalanceDisplay();
        this._renderActiveLeasesInView(chainKey, chain);
      });
    } else {
      window.showToast(`Arrendamento de ${amount} ${chain.symbol} enviado!`, 'success');
    }
  }

  /**
   * Cancela um arrendamento LPoS ativo.
   */
  cancelLPoSLease(chainKey, leaseId) {
    const chain = this.blockchainData.find(c => c.key === chainKey);
    if (!chain) return;

    const key = `b2_leases_${chainKey}`;
    let leases = JSON.parse(localStorage.getItem(key) || "[]");
    const lease = leases.find(l => l.id === leaseId);
    if (!lease) return;

    // Restaura o saldo (otimista)
    const prevBalance = chain.balanceCrypto;
    chain.balanceCrypto += lease.amount;
    const coinPrice = prevBalance > 0 ? (chain.balanceFiat / prevBalance) : (chain.key === "WAVES" ? 2.5 : chain.key === "AMZX" ? 0.05 : 0.1);
    chain.balanceFiat = chain.balanceCrypto * coinPrice;

    // Remove lease localmente
    leases = leases.filter(l => l.id !== leaseId);
    localStorage.setItem(key, JSON.stringify(leases));

    // Adiciona log de transação
    this.addTransaction(chainKey, {
      type: "Cancelado LPoS",
      amount: `+${lease.amount.toFixed(4)} ${chain.symbol}`,
      addr: lease.validatorAddress.substring(0, 6) + "..." + lease.validatorAddress.substring(lease.validatorAddress.length - 4),
      color: "var(--text-success)"
    });

    window.B2Logger.log("info", `Cancelando arrendamento LPoS de ${lease.amount} ${chain.symbol}…`);
    this.setActiveChain(chainKey);

    // ── BROADCAST REAL PARA REDES WAVES (tipo 9 — LeaseCancel) ──
    if (chain.engine === 'Waves' && chain.nodeUrl && this.decryptedSeed) {
      const chainIdMap = { WAVES: 87, AMZX: 65, CELERONX: 67, TURTLE: 76 };
      const chainId = chainIdMap[chainKey] || 87;

      window.showToast(`Cancelando arrendamento na blockchain…`, 'info');
      window.B2WavesBroadcaster.cancelWavesLease(
        this.decryptedSeed,
        chain.nodeUrl,
        leaseId,
        chainId,
        this.activeAccountIndex
      ).then(result => {
        const txId = result.id || result.txId || '—';
        window.showToast(`✅ Arrendamento cancelado! TX: ${txId.substring(0, 12)}…`, 'success');
        window.B2Logger.log('success', `[Waves LeaseCancel] TX confirmada: ${txId}`);
      }).catch(err => {
        window.showToast(`❌ Falha ao cancelar arrendamento: ${err.message}`, 'error');
        window.B2Logger.log('error', `[Waves LeaseCancel] Erro: ${err.message}`);
        // Reverte: re-adiciona o lease e restaura saldo
        const currentLeases = JSON.parse(localStorage.getItem(key) || "[]");
        currentLeases.push(lease);
        localStorage.setItem(key, JSON.stringify(currentLeases));
        chain.balanceCrypto = prevBalance;
        chain.balanceFiat = prevBalance * coinPrice;
        window.B2UIRenderer.renderBlockchainList(this.blockchainData);
        this.updateTotalBalanceDisplay();
      });
    } else {
      window.showToast(`Arrendamento cancelado com sucesso.`, 'success');
    }
  }

  /**
   * Simula a execução de um Smart Contract na Sandbox EVM.
   */
  executeEVMSandboxContract(chainKey, contract, payload) {
    const outputEl = document.getElementById("evm-sandbox-output");
    if (!outputEl) return;

    outputEl.style.display = "block";
    outputEl.innerHTML = `> Iniciando chamada de contrato na rede ${chainKey}...\n`;

    const txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    setTimeout(() => {
      outputEl.innerHTML += `> Conectado ao contrato inteligente: ${contract}\n`;
    }, 400);

    setTimeout(() => {
      outputEl.innerHTML += `> Enviando transação assinada com método: ${payload}\n`;
    }, 800);

    setTimeout(() => {
      outputEl.innerHTML += `> Transação confirmada! Bloco: ${Math.floor(Math.random() * 100000 + 4500000)}\n`;
      outputEl.innerHTML += `> Hash: ${txHash.substring(0, 16)}...\n`;
      outputEl.innerHTML += `> Gás Utilizado: ${Math.floor(Math.random() * 50000 + 21000)} units\n`;
      outputEl.scrollTop = outputEl.scrollHeight;

      // Adiciona log de transação
      this.addTransaction(chainKey, {
        type: "Assinado EVM",
        amount: "0.00 " + (this.blockchainData.find(c => c.key === chainKey)?.symbol || "ETH"),
        addr: contract.substring(0, 6) + "..." + contract.substring(contract.length - 4),
        status: `Playground (${payload.split("(")[0]})`,
        color: "var(--color-secondary)"
      });

      window.B2Logger.log("info", `Chamada de contrato EVM executada com sucesso para ${contract} (${payload})`);
    }, 1200);
  }

  /**
   * Realiza delegação de Solana (SOL) em validador.
   */
  stakeSolana(chainKey, valAddr, valName, amount) {
    const chain = this.blockchainData.find(c => c.key === chainKey);
    if (!chain) return;

    if (isNaN(amount) || amount <= 0) {
      window.B2Toast.alert("Montante Inválido", "Por favor, digite um montante válido para Staking.", "warning");
      return;
    }

    if (amount > chain.balanceCrypto) {
      window.B2Toast.alert("Saldo Insuficiente", "Saldo insuficiente para realizar delegação.", "warning");
      return;
    }

    // Deduz do saldo
    chain.balanceCrypto -= amount;
    const coinPrice = chain.balanceCrypto > 0 ? (chain.balanceFiat / (chain.balanceCrypto + amount)) : 0;
    chain.balanceFiat = chain.balanceCrypto * coinPrice;

    // Salva o stake
    const key = `b2_stakes_${chainKey}`;
    const stakes = JSON.parse(localStorage.getItem(key) || "[]");
    const newStake = {
      id: Math.random().toString(36).substring(2, 9),
      validatorAddress: valAddr,
      validatorName: valName,
      amount: amount,
      status: "Delegado"
    };
    stakes.push(newStake);
    localStorage.setItem(key, JSON.stringify(stakes));

    // Adiciona log de transação
    this.addTransaction(chainKey, {
      type: "Stake Solana",
      amount: `-${amount.toFixed(4)} SOL`,
      addr: valAddr.substring(0, 6) + "..." + valAddr.substring(valAddr.length - 4),
      color: "var(--text-danger)"
    });

    window.B2Logger.log("info", `Iniciada delegação de ${amount} SOL para o validador ${valName}`);

    this.setActiveChain(chainKey);
  }

  /**
   * Retira fundos em Stake na rede Solana.
   */
  cancelSolanaStake(chainKey, stakeId) {
    const chain = this.blockchainData.find(c => c.key === chainKey);
    if (!chain) return;

    const key = `b2_stakes_${chainKey}`;
    let stakes = JSON.parse(localStorage.getItem(key) || "[]");
    const stake = stakes.find(s => s.id === stakeId);
    if (!stake) return;

    // Restaura o saldo
    const prevBalance = chain.balanceCrypto;
    chain.balanceCrypto += stake.amount;
    const coinPrice = prevBalance > 0 ? (chain.balanceFiat / prevBalance) : 140;
    chain.balanceFiat = chain.balanceCrypto * coinPrice;

    // Remove stake
    stakes = stakes.filter(s => s.id !== stakeId);
    localStorage.setItem(key, JSON.stringify(stakes));

    // Adiciona log de transação
    this.addTransaction(chainKey, {
      type: "Saque Solana",
      amount: `+${stake.amount.toFixed(4)} SOL`,
      addr: stake.validatorAddress.substring(0, 6) + "..." + stake.validatorAddress.substring(stake.validatorAddress.length - 4),
      color: "var(--text-success)"
    });

    window.B2Logger.log("info", `Sacados fundos de stake de ${stake.amount} SOL com sucesso`);

    this.setActiveChain(chainKey);
  }

  /**
   * Obtém o status de staking em tempo real na rede Polkadot.
   */
  async getStakingStatusPolkadot() {
    if (!window.B2PolkadotEngine && !globalThis.B2PolkadotEngine) {
      throw new Error("B2PolkadotEngine não carregado.");
    }
    const keys = this.derivedKeys['POLKADOT'];
    if (!keys) {
      throw new Error("Carteira bloqueada ou chaves Polkadot não derivadas.");
    }
    const engine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;
    return await engine.PolkadotStakingProvider.getStakingStatus(keys.address);
  }

  /**
   * Realiza operação de Bond (Vincular) DOT para staking.
   */
  async bondPolkadot(amountDecimal, rewardDestination = 'Staked') {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;
    if (!polkadotEngine) {
      throw new Error("B2PolkadotEngine não carregado.");
    }
    window.showToast && window.showToast(`Vinculando (Bond) ${amountDecimal} DOT para Staking…`, "info");
    try {
      const result = await polkadotEngine.PolkadotStakingProvider.bond(this.decryptedSeed, amountDecimal, rewardDestination, this.activeAccountIndex);
      const txHash = result.toHex ? result.toHex() : JSON.stringify(result);
      window.B2Logger.log("success", `[Polkadot Staking] Bond realizado: ${txHash}`);

      this.addTransaction('POLKADOT', {
        type: "Bond DOT",
        amount: `-${amountDecimal.toFixed(4)} DOT`,
        addr: "Staking Pallet",
        color: "var(--text-danger)"
      });
      await this.updateNetworkBalances();
      return txHash;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no Bond: ${err.message}`, "error");
      throw err;
    }
  }

  /**
   * Realiza operação de Bond Extra para aumentar a quantidade vinculada.
   */
  async bondExtraPolkadot(amountDecimal) {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;
    if (!polkadotEngine) {
      throw new Error("B2PolkadotEngine não carregado.");
    }
    window.showToast && window.showToast(`Vinculando extra (Bond Extra) ${amountDecimal} DOT…`, "info");
    try {
      const result = await polkadotEngine.PolkadotStakingProvider.bondExtra(this.decryptedSeed, amountDecimal, this.activeAccountIndex);
      const txHash = result.toHex ? result.toHex() : JSON.stringify(result);
      window.B2Logger.log("success", `[Polkadot Staking] Bond Extra realizado: ${txHash}`);

      this.addTransaction('POLKADOT', {
        type: "Bond Extra DOT",
        amount: `-${amountDecimal.toFixed(4)} DOT`,
        addr: "Staking Pallet",
        color: "var(--text-danger)"
      });
      await this.updateNetworkBalances();
      return txHash;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no Bond Extra: ${err.message}`, "error");
      throw err;
    }
  }

  /**
   * Realiza operação de Unbond (Desvincular) de DOT do staking.
   */
  async unbondPolkadot(amountDecimal) {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;
    if (!polkadotEngine) {
      throw new Error("B2PolkadotEngine não carregado.");
    }
    window.showToast && window.showToast(`Desvinculando (Unbond) ${amountDecimal} DOT…`, "info");
    try {
      const result = await polkadotEngine.PolkadotStakingProvider.unbond(this.decryptedSeed, amountDecimal, this.activeAccountIndex);
      const txHash = result.toHex ? result.toHex() : JSON.stringify(result);
      window.B2Logger.log("success", `[Polkadot Staking] Unbond realizado: ${txHash}`);

      this.addTransaction('POLKADOT', {
        type: "Unbond DOT",
        amount: `+${amountDecimal.toFixed(4)} DOT`,
        addr: "Staking Pallet",
        color: "var(--text-success)"
      });
      await this.updateNetworkBalances();
      return txHash;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no Unbond: ${err.message}`, "error");
      throw err;
    }
  }

  /**
   * Nomeia (Nominate) validadores para staking de DOT.
   */
  async nominatePolkadot(validatorsArray) {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;
    if (!polkadotEngine) {
      throw new Error("B2PolkadotEngine não carregado.");
    }
    window.showToast && window.showToast(`Nomeando validadores para Staking de DOT…`, "info");
    try {
      const result = await polkadotEngine.PolkadotStakingProvider.nominate(this.decryptedSeed, validatorsArray, this.activeAccountIndex);
      const txHash = result.toHex ? result.toHex() : JSON.stringify(result);
      window.B2Logger.log("success", `[Polkadot Staking] Nominate realizado: ${txHash}`);

      this.addTransaction('POLKADOT', {
        type: "Nominate DOT",
        amount: `0 DOT`,
        addr: `${validatorsArray.length} validadores`,
        color: "var(--color-primary)"
      });
      await this.updateNetworkBalances();
      return txHash;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no Nominate: ${err.message}`, "error");
      throw err;
    }
  }

  /**
   * Reclama fundos de staking desvinculados que já passaram do período de bloqueio (Withdraw Unbonded).
   */
  async withdrawUnbondedPolkadot() {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;
    if (!polkadotEngine) {
      throw new Error("B2PolkadotEngine não carregado.");
    }
    window.showToast && window.showToast(`Resgatando saldo desvinculado (Withdraw Unbonded) DOT…`, "info");
    try {
      const result = await polkadotEngine.PolkadotStakingProvider.withdrawUnbonded(this.decryptedSeed, this.activeAccountIndex);
      const txHash = result.toHex ? result.toHex() : JSON.stringify(result);
      window.B2Logger.log("success", `[Polkadot Staking] Withdraw Unbonded realizado: ${txHash}`);

      this.addTransaction('POLKADOT', {
        type: "Withdraw Unbonded",
        amount: "Resgate",
        addr: "Staking Pallet",
        color: "var(--text-success)"
      });
      await this.updateNetworkBalances();
      return txHash;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no resgate de Staking: ${err.message}`, "error");
      throw err;
    }
  }

  /**
   * Realiza a operação de Stake (Freeze Balance V2) de TRX para obter Bandwidth ou Energy.
   */
  async stakeTron(amount, resource) {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
    if (!tronEngine) {
      throw new Error("B2TronEngine não carregado.");
    }
    const chain = this.blockchainData.find(c => c.key === "TRON");
    if (!chain) {
      throw new Error("Blockchain TRON não encontrada no registro.");
    }
    const fallbacks = ["https://tron-rpc.publicnode.com", "https://tron.api.subquery.network"];

    window.showToast && window.showToast(`Congelando (Freeze) ${amount} TRX para ${resource === 'BANDWIDTH' ? 'Bandwidth' : 'Energy'}…`, "info");
    try {
      const result = await tronEngine.freezeBalanceV2(this.decryptedSeed, amount, resource, chain.nodeUrl, fallbacks, this.activeAccountIndex);
      const txId = result.txId || result.txID || JSON.stringify(result);
      window.B2Logger.log("success", `[TRON Staking] Freeze realizado: ${txId}`);

      this.addTransaction('TRON', {
        type: `Stake TRX (${resource})`,
        amount: `-${amount.toFixed(6)} TRX`,
        addr: "Stake 2.0",
        color: "var(--text-danger)"
      });
      await this.updateNetworkBalances();
      return txId;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no Freeze: ${err.message}`, "error");
      throw err;
    }
  }

  /**
   * Realiza a operação de Unstake (Unfreeze Balance V2) de TRX para recuperar os tokens.
   */
  async unstakeTron(amount, resource) {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
    if (!tronEngine) {
      throw new Error("B2TronEngine não carregado.");
    }
    const chain = this.blockchainData.find(c => c.key === "TRON");
    if (!chain) {
      throw new Error("Blockchain TRON não encontrada no registro.");
    }
    const fallbacks = ["https://tron-rpc.publicnode.com", "https://tron.api.subquery.network"];

    window.showToast && window.showToast(`Descongelando (Unfreeze) ${amount} TRX para ${resource === 'BANDWIDTH' ? 'Bandwidth' : 'Energy'}…`, "info");
    try {
      const result = await tronEngine.unfreezeBalanceV2(this.decryptedSeed, amount, resource, chain.nodeUrl, fallbacks, this.activeAccountIndex);
      const txId = result.txId || result.txID || JSON.stringify(result);
      window.B2Logger.log("success", `[TRON Staking] Unfreeze realizado: ${txId}`);

      this.addTransaction('TRON', {
        type: `Unstake TRX (${resource})`,
        amount: `${amount.toFixed(6)} TRX`,
        addr: "Stake 2.0",
        color: "var(--text-success)"
      });
      await this.updateNetworkBalances();
      return txId;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no Unfreeze: ${err.message}`, "error");
      throw err;
    }
  }

  /**
   * Retira TRX cujo período de unfreeze expirou (disponível para saque).
   */
  async withdrawExpireUnfreezeTron() {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
    if (!tronEngine) {
      throw new Error("B2TronEngine não carregado.");
    }
    const chain = this.blockchainData.find(c => c.key === "TRON");
    if (!chain) {
      throw new Error("Blockchain TRON não encontrada no registro.");
    }
    const fallbacks = ["https://tron-rpc.publicnode.com", "https://tron.api.subquery.network"];

    window.showToast && window.showToast(`Retirando TRX expirado do Stake 2.0…`, "info");
    try {
      const result = await tronEngine.withdrawExpireUnfreeze(this.decryptedSeed, chain.nodeUrl, fallbacks, this.activeAccountIndex);
      const txId = result.txId || result.txID || JSON.stringify(result);
      window.B2Logger.log("success", `[TRON Staking] Retirada realizada: ${txId}`);

      this.addTransaction('TRON', {
        type: `Withdraw Staked`,
        amount: "Resgate",
        addr: "Stake 2.0",
        color: "var(--text-success)"
      });
      await this.updateNetworkBalances();
      return txId;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha na retirada: ${err.message}`, "error");
      throw err;
    }
  }

  /**
   * Mintar (Cunhar) um novo NFT Sandbox interativo na blockchain ativa.
   */
  mintSandboxNFT(activeKey) {
    // Mint sandbox desativado: não criamos mocks de NFTs em produção.
    window.B2Logger.log('warn', 'mintSandboxNFT chamado, mas está desativado nesta build');
    try { window.showToast && window.showToast('Mint sandbox desativado.', 'info'); } catch (e) { }
    return;
  }

  /**
   * Inicializa rastreadores de interatividade para resetar o Auto-Lock.
   */
  setupAutoLockTracker() {
    const resetTimer = () => {
      this.lastInteractionTime = Date.now();
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    // O cronômetro roda a cada 10 segundos auditando a inatividade
    this.autoLockTimer = setInterval(() => {
      if (!this.decryptedSeed) return; // Nenhuma sessão ativa para bloquear

      const inactiveMs = Date.now() - this.lastInteractionTime;
      const limitMs = this.autoLockMinutes * 60 * 1000;

      if (inactiveMs >= limitMs) {
        console.log(`[Segurança] Bloqueando automaticamente devido a inatividade por ${this.autoLockMinutes} minutos.`);
        this.lockWallet();
      }
    }, 10000);
  }

  /**
   * Bloqueia a carteira de forma imediata, apagando dados confidenciais da memória RAM.
   */
  lockWallet() {
    this.decryptedSeed = null;
    this.derivedKeys = {};
    this.lastUnlockTime = 0;

    // Limpa a sessão segura de sessionStorage
    sessionStorage.removeItem("b2_session_seed");

    // Limpa possíveis campos visuais sensíveis
    const seedArea = document.getElementById("seed-phrase-display");
    if (seedArea) seedArea.innerText = "";

    window.B2UIRenderer.navigateTo("view-locked");
  }

  /**
   * Desbloqueia a carteira utilizando a senha e decifrando o payload de forma segura.
   */
  async unlockWallet(password) {
    if (!this.encryptedWalletPayload) {
      throw new Error("Erro de Estado: Nenhuma carteira configurada neste dispositivo.");
    }

    // Decifra o segredo principal usando a chave simétrica baseada na senha fornecida
    const seed = await window.B2PlatformSecurity.decryptData(this.encryptedWalletPayload, password);

    if (!window.B2KeyDerivationEngine.validateMnemonic(seed)) {
      throw new Error("Erro de Chave: O segredo descriptografado não é uma semente BIP-39 válida.");
    }

    this.decryptedSeed = seed;
    this.lastUnlockTime = Date.now();
    this.lastInteractionTime = Date.now();

    // Salva na sessão ativa do navegador (segura contra page refresh)
    sessionStorage.setItem("b2_session_seed", seed);

    // Executa derivações de chaves públicas em segundo plano para preencher a carteira
    this.deriveAllAddresses();

    // Atualiza saldos em tempo real de forma não-bloqueante
    this.updateNetworkBalances();

    // Navega para a visão central do dashboard e ativa a blockchain focada
    window.B2UIRenderer.navigateTo("view-dashboard");
    this.setActiveChain(this.activeChainKey);
  }

  /**
   * Atualiza os saldos de todas as redes via RPC/REST e descobre preços usando o Price Oracle.
   */
  async updateNetworkBalances(specificChainKey = this.activeChainKey) {
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
            const utxos = await dashBroadcaster.fetchUTXOs(chain.nodeUrl, keys.address);
            let sumSat = 0;
            for (const utxo of utxos) {
              sumSat += utxo.satoshis;
            }
            cryptoBalance = sumSat / Math.pow(10, chain.decimals);
            if (window.B2Logger) {
              window.B2Logger.log(`[Dash] Balance para ${chain.name} (${keys.address}): ${cryptoBalance.toFixed(8)} ${chain.symbol}`, "success");
            }
          } else if (chain.key === "ZEC" && (window.B2ZcashBroadcaster || globalThis.B2ZcashBroadcaster)) {
            // Zcash (ZEC) Transparent UTXOs Balance Call
            const zcBroadcaster = window.B2ZcashBroadcaster || globalThis.B2ZcashBroadcaster;
            const utxos = await zcBroadcaster.fetchTransparentUTXOs(chain.nodeUrl, keys.address);
            let sumSat = 0;
            for (const utxo of utxos) {
              sumSat += utxo.satoshis;
            }
            cryptoBalance = sumSat / Math.pow(10, chain.decimals);
            if (window.B2Logger) {
              window.B2Logger.log(`[Zcash] Balance para ${chain.name} (${keys.address}): ${cryptoBalance.toFixed(8)} ${chain.symbol}`, "success");
            }
          } else if (chain.engine === "EVM") {
            // EVM Multi-endpoint failover Balance Call via B2TokenProvider (confirmed balance)
            const balStr = await (window.B2TokenProvider || globalThis.B2TokenProvider).getNativeBalance(keys.address, chain.key);
            cryptoBalance = parseFloat(balStr);
            chain.confirmedBalanceCrypto = cryptoBalance;
            chain.pendingBalanceCrypto = 0;

            // Busca saldo pendente via eth_getBalance com tag 'pending'
            try {
              if (chain.nodeUrl) {
                const pendingRes = await fetch(chain.nodeUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [keys.address, 'pending'] })
                });
                if (pendingRes.ok) {
                  const pendingJson = await pendingRes.json();
                  if (pendingJson.result) {
                    const pendingBal = parseInt(pendingJson.result, 16) / Math.pow(10, chain.decimals || 18);
                    const diff = pendingBal - cryptoBalance;
                    chain.pendingBalanceCrypto = Math.abs(diff) > 1e-10 ? diff : 0;
                  }
                }
              }
            } catch (pendingErr) { /* silencioso */ }

            if (window.B2Logger) {
              window.B2Logger.log(`[B2TokenProvider EVM] Balance para ${chain.name} (${keys.address}): ${cryptoBalance.toFixed(6)} ${chain.symbol}`, "success");
            }
          } else if (chain.engine === "Waves") {
            // Waves REST API Call — usa /balance/details para confirmed + in-UTX
            const sanitizedUrl = chain.nodeUrl.replace(/\/+$/, "");
            let wavesDetails = null;
            try {
              const detailsRes = await fetch(`${sanitizedUrl}/addresses/balance/details/${keys.address}`);
              if (detailsRes.ok) wavesDetails = await detailsRes.json();
            } catch (e) { /* silencioso */ }

            if (wavesDetails && wavesDetails.available !== undefined) {
              const dec = Math.pow(10, chain.decimals);
              chain.confirmedBalanceCrypto = wavesDetails.available / dec;
              // "regular" inclui saldo não confirmado da mempool
              const regularBal = wavesDetails.regular / dec;
              chain.pendingBalanceCrypto = Math.max(0, regularBal - chain.confirmedBalanceCrypto);
              cryptoBalance = chain.confirmedBalanceCrypto;
              if (window.B2Logger) {
                window.B2Logger.log(`[REST Waves] Confirmado: ${chain.confirmedBalanceCrypto.toFixed(6)}, Pendente: ${chain.pendingBalanceCrypto.toFixed(6)} ${chain.symbol}`, "success");
              }
            } else {
              // Fallback para endpoint simples
              const response = await fetch(`${sanitizedUrl}/addresses/balance/${keys.address}`);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const resJson = await response.json();
              if (resJson && resJson.balance !== undefined) {
                cryptoBalance = resJson.balance / Math.pow(10, chain.decimals);
                chain.confirmedBalanceCrypto = cryptoBalance;
                chain.pendingBalanceCrypto = 0;
                if (window.B2Logger) {
                  window.B2Logger.log(`[REST Waves] Balance para ${chain.name} (${keys.address}): ${cryptoBalance.toFixed(6)} ${chain.symbol}`, "success");
                }
              } else {
                throw new Error("Resposta inválida do nó Waves");
              }
            }

            // Descoberta dinâmica de Assets (Tokens) e NFTs via API nativa da Waves
            chain.discoveredTokens = [];
            chain.discoveredNFTs = [];

            try {
              const assetsRes = await fetch(`${sanitizedUrl}/assets/balance/${keys.address}`);
              if (assetsRes.ok) {
                const assetsJson = await assetsRes.json();
                if (assetsJson && Array.isArray(assetsJson.balances)) {
                  chain.discoveredTokens = assetsJson.balances.map(item => {
                    const detailsObj = item.issueTransaction || item.details || {};
                    const name = item.name || detailsObj.name || "Token Customizado";
                    const decimals = item.decimals !== undefined ? item.decimals : (detailsObj.decimals !== undefined ? detailsObj.decimals : 8);
                    const symbol = item.symbol || detailsObj.symbol || name.substring(0, 4).toUpperCase();
                    const val = item.balance / Math.pow(10, decimals);
                    return {
                      assetId: item.assetId,
                      name: name,
                      symbol: symbol,
                      decimals: decimals,
                      balanceCrypto: val,
                      balanceFiat: val * resolveTokenPrice(symbol), // Cotação padrão para ativos customizados descobertos
                      minSponsoredAssetFee: null // Inicializa como nulo, será atualizado abaixo
                    };
                  });

                  if (chain.discoveredTokens.length > 0) {
                    try {
                      const detailsRes = await fetch(`${sanitizedUrl}/assets/details`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids: chain.discoveredTokens.map(t => t.assetId) })
                      });
                      if (detailsRes.ok) {
                        const detailsJson = await detailsRes.json();
                        if (Array.isArray(detailsJson)) {
                          detailsJson.forEach(detail => {
                            const token = chain.discoveredTokens.find(t => t.assetId === detail.assetId);
                            if (token) {
                              token.minSponsoredAssetFee = detail.minSponsoredAssetFee !== undefined ? detail.minSponsoredAssetFee : null;
                            }
                          });
                        }
                      }
                    } catch (detailsErr) {
                      if (window.B2Logger) {
                        window.B2Logger.log(`Erro ao buscar detalhes de sponsorship para ${chain.symbol}: ${detailsErr.message}`, "info");
                      }
                    }
                  }
                }
              }
            } catch (e) {
              if (window.B2Logger) {
                window.B2Logger.log(`Erro ao buscar ativos customizados para ${chain.symbol}: ${e.message}`, "info");
              }
            }

            try {
              const nftsRes = await fetch(`${sanitizedUrl}/assets/nft/${keys.address}/limit/10`);
              if (nftsRes.ok) {
                const nftsJson = await nftsRes.json();
                if (Array.isArray(nftsJson)) {
                  chain.discoveredNFTs = nftsJson.map(item => ({
                    id: item.assetId,
                    name: item.name,
                    collection: item.description || `${chain.name} NFT Collection`,
                    description: item.description || "",
                    color: "linear-gradient(135deg, #0055ff 0%, #00f0ff 100%)",
                    price: "1 NFT"
                  }));
                }
              }
            } catch (e) {
              if (window.B2Logger) {
                window.B2Logger.log(`Erro ao buscar NFTs customizados para ${chain.symbol}: ${e.message}`, "info");
              }
            }
          } else if (chain.engine === "Solana") {
            // Solana JSON-RPC Call — confirmed commitment
            const solRpc = async (method, params, commitment) => {
              const p = commitment ? [params[0], { commitment }] : params;
              const r = await fetch(chain.nodeUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: p })
              });
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.json();
            };

            const confirmedJson = await solRpc('getBalance', [keys.address], 'confirmed');
            if (!confirmedJson.result || confirmedJson.result.value === undefined) throw new Error('Resposta inválida do nó Solana');
            const confirmedBal = confirmedJson.result.value / Math.pow(10, chain.decimals);
            chain.confirmedBalanceCrypto = confirmedBal;
            chain.pendingBalanceCrypto = 0;

            // Busca saldo processado (inclui txs ainda não confirmadas)
            try {
              const processedJson = await solRpc('getBalance', [keys.address], 'processed');
              if (processedJson.result && processedJson.result.value !== undefined) {
                const processedBal = processedJson.result.value / Math.pow(10, chain.decimals);
                const diff = processedBal - confirmedBal;
                chain.pendingBalanceCrypto = Math.abs(diff) > 1e-9 ? diff : 0;
              }
            } catch (pendErr) { /* silencioso */ }

            cryptoBalance = confirmedBal;
            if (window.B2Logger) {
              window.B2Logger.log(`[RPC Solana] Confirmado: ${confirmedBal.toFixed(6)}, Pendente: ${(chain.pendingBalanceCrypto || 0).toFixed(6)} ${chain.symbol}`, "success");
            }
          } else if (chain.engine === "Bitcoin" || ["BTC", "LTC", "DOGE", "BCH"].includes(chain.key)) {
            let engine = null;
            if (chain.key === "BTC") engine = window.B2BitcoinEngine || globalThis.B2BitcoinEngine;
            else if (chain.key === "LTC") engine = window.B2LitecoinEngine || globalThis.B2LitecoinEngine;
            else if (chain.key === "DOGE") engine = window.B2DogecoinEngine || globalThis.B2DogecoinEngine;
            else if (chain.key === "BCH") engine = window.B2BitcoinCashEngine || globalThis.B2BitcoinCashEngine;

            const addressList = [];
            if (chain.key === 'BTC') {
              addressList.push({ type: 'native', addr: keys.nativeAddress });
              addressList.push({ type: 'nested', addr: keys.nestedAddress });
              addressList.push({ type: 'legacy', addr: keys.legacyAddress });
              addressList.push({ type: 'taproot', addr: keys.taprootAddress });
            } else if (chain.key === 'LTC') {
              addressList.push({ type: 'legacy', addr: keys.legacyAddress });
              addressList.push({ type: 'nested', addr: keys.nestedAddress });
              addressList.push({ type: 'native', addr: keys.nativeAddress });
            } else if (chain.key === 'DOGE') {
              addressList.push({ type: 'legacy', addr: keys.legacyAddress });
              addressList.push({ type: 'nested', addr: keys.nestedAddress });
            } else if (chain.key === 'BCH') {
              addressList.push({ type: 'cashAddress', addr: keys.cashAddress });
              addressList.push({ type: 'legacy', addr: keys.legacyAddress });
            }

            keys.balances = keys.balances || {};
            let defaultConf = 0;
            let defaultMemp = 0;

            await Promise.all(addressList.map(async (item) => {
              if (!item.addr) return;
              let bal = 0;
              let confBal = 0;
              let mempBal = 0;
              try {
                const nodeBaseUrl = (chain.nodeUrl || (engine && engine.providers && engine.providers[0]) || '').replace(/\/+$/, '');
                const esploraRes = await fetch(`${nodeBaseUrl}/address/${item.addr}`);
                if (esploraRes.ok) {
                  const esploraJson = await esploraRes.json();
                  if (esploraJson && esploraJson.chain_stats) {
                    const confFunded = esploraJson.chain_stats.funded_txo_sum || 0;
                    const confSpent = esploraJson.chain_stats.spent_txo_sum || 0;
                    const mempFunded = esploraJson.mempool_stats ? (esploraJson.mempool_stats.funded_txo_sum || 0) : 0;
                    const mempSpent = esploraJson.mempool_stats ? (esploraJson.mempool_stats.spent_txo_sum || 0) : 0;
                    const dec = Math.pow(10, chain.decimals);
                    confBal = (confFunded - confSpent) / dec;
                    mempBal = (mempFunded - mempSpent) / dec;
                    bal = confBal + Math.max(0, mempBal);
                  }
                }
              } catch (err) {
                if (engine) {
                  try {
                    const utxos = await engine.fetchUTXOs(item.addr);
                    let sumSat = 0;
                    for (const utxo of utxos) { sumSat += utxo.satoshis; }
                    bal = sumSat / Math.pow(10, chain.decimals);
                    confBal = bal;
                  } catch (e) { }
                }
              }
              keys.balances[item.type] = bal;
              if (item.addr === keys.address) {
                defaultConf = confBal;
                defaultMemp = mempBal;
              }
            }));

            chain.confirmedBalanceCrypto = defaultConf;
            chain.pendingBalanceCrypto = defaultMemp;
            cryptoBalance = defaultConf + Math.max(0, defaultMemp);

            if (window.B2Logger) {
              window.B2Logger.log(`[UTXO ${chain.key}] Confirmado: ${(chain.confirmedBalanceCrypto || 0).toFixed(8)}, Pendente: ${(chain.pendingBalanceCrypto || 0).toFixed(8)} ${chain.symbol}`, "success");
            }
          } else if (chain.key === "NEO" && (window.B2NeoEngine || globalThis.B2NeoEngine)) {
            // NEO N3 Real Balance and Token Sync
            const neoEngine = window.B2NeoEngine || globalThis.B2NeoEngine;
            const balances = await neoEngine.getBalances(keys.address, chain.nodeUrl);

            // Native NEO has contract hash "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5"
            const nativeNeo = balances.find(b => b.contractHash === "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5");
            cryptoBalance = nativeNeo ? nativeNeo.amount : 0.0;

            if (window.B2Logger) {
              window.B2Logger.log(`[RPC NEO] Balance para ${chain.name} (${keys.address}): ${cryptoBalance} ${chain.symbol}`, "success");
            }

            // Extract GAS balance (contract hash "0xd2a4cff31913016155e38e474a2c06d08be276cf")
            const gasBalObj = balances.find(b => b.contractHash === "0xd2a4cff31913016155e38e474a2c06d08be276cf");
            chain.resources = {
              gas: gasBalObj ? gasBalObj.amount : 0.0
            };

            // Populate discovered NEP-17 tokens dynamically, filtering out both native NEO and GAS
            chain.discoveredTokens = balances
              .filter(b => b.contractHash !== "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5" && b.contractHash !== "0xd2a4cff31913016155e38e474a2c06d08be276cf")
              .map(b => ({
                assetId: b.contractHash,
                name: b.name,
                symbol: b.symbol,
                decimals: b.decimals,
                balanceCrypto: b.amount,
                balanceFiat: b.amount * resolveTokenPrice(b.symbol)
              }));
          } else if (chain.key === "ICP" && (window.B2IcpEngine || globalThis.B2IcpEngine)) {
            // Internet Computer (ICP) Real Balance Sync
            const icpEngine = window.B2IcpEngine || globalThis.B2IcpEngine;
            cryptoBalance = await icpEngine.ICPProvider.getBalance(keys.address);
            if (window.B2Logger) {
              window.B2Logger.log(`[RPC ICP] Balance para ${chain.name} (${keys.address}): ${cryptoBalance} ${chain.symbol}`, "success");
            }
          } else if (chain.key === "FILECOIN" && (window.B2FilecoinEngine || globalThis.B2FilecoinEngine)) {
            // Filecoin Real Balance Sync
            const filEngine = window.B2FilecoinEngine || globalThis.B2FilecoinEngine;
            const balanceInfo = await filEngine.getBalance(keys.address, chain.nodeUrl);
            cryptoBalance = Number(balanceInfo.confirmedFormatted);
            if (window.B2Logger) {
              window.B2Logger.log(`[RPC Filecoin] Balance para ${chain.name} (${keys.address}): ${cryptoBalance} ${chain.symbol}`, "success");
            }
          } else if (chain.key === "POLKADOT" && (window.B2PolkadotEngine || globalThis.B2PolkadotEngine)) {
            // Polkadot (DOT) Balance & Token/NFT Discovery
            const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;

            // 1. Fetch native DOT balance
            const balanceInfo = await polkadotEngine.PolkadotProvider.getBalance(keys.address);
            cryptoBalance = Number(balanceInfo.free) / Math.pow(10, chain.decimals);

            if (window.B2Logger) {
              window.B2Logger.log(`[Polkadot] Balance para ${chain.name} (${keys.address}): ${cryptoBalance} ${chain.symbol}`, "success");
            }

            // 2. Discover Asset Hub tokens dynamically
            chain.discoveredTokens = [];
            try {
              const assets = await polkadotEngine.AssetHubProvider.discoverAllAssets(keys.address);
              chain.discoveredTokens = assets.map(asset => {
                const val = Number(asset.balance) / Math.pow(10, asset.decimals);
                return {
                  assetId: asset.assetId.toString(),
                  name: asset.name,
                  symbol: asset.symbol,
                  decimals: asset.decimals,
                  balanceCrypto: val,
                  balanceFiat: val * resolveTokenPrice(asset.symbol)
                };
              });
            } catch (e) {
              if (window.B2Logger) {
                window.B2Logger.log(`Erro ao buscar ativos no Asset Hub para Polkadot: ${e.message}`, "info");
              }
            }

            // 3. Discover Asset Hub NFTs
            chain.discoveredNFTs = [];
            try {
              const nfts = await polkadotEngine.PolkadotNFTProvider.discoverNFTs(keys.address);
              chain.discoveredNFTs = nfts.map(nft => ({
                id: nft.id,
                name: nft.name,
                collection: nft.pallet === 'nfts' ? `Asset Hub Collections` : `Legacy uniques`,
                description: nft.description || "",
                color: "linear-gradient(135deg, #e6007a 0%, #ff52b9 100%)",
                price: "1 NFT"
              }));
            } catch (e) {
              if (window.B2Logger) {
                window.B2Logger.log(`Erro ao buscar NFTs no Asset Hub para Polkadot: ${e.message}`, "info");
              }
            }
          } else if (chain.key === "MONERO" && (window.B2MoneroEngine || globalThis.B2MoneroEngine)) {
            // Monero (XMR) Real Balance Sync via MyMonero LWS API
            const moneroEngine = window.B2MoneroEngine || globalThis.B2MoneroEngine;
            const balanceInfo = await moneroEngine.XMRProvider.getBalance(keys.address, keys.privateViewKey);
            cryptoBalance = balanceInfo.balance;
            if (window.B2Logger) {
              window.B2Logger.log(`[LWS Monero] Balance para ${chain.name} (${keys.address}): ${cryptoBalance.toFixed(12)} ${chain.symbol}`, "success");
            }
          } else if (chain.key === "TRON" && (window.B2TronEngine || globalThis.B2TronEngine)) {
            // Tron Real Balance, Resources, and TRC20 Token Sync
            const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
            cryptoBalance = await tronEngine.getBalance(keys.address, chain.nodeUrl, [
              "https://tron-rpc.publicnode.com",
              "https://tron.api.subquery.network"
            ]);
            if (window.B2Logger) {
              window.B2Logger.log(`[TRON Engine] Balance para ${chain.name} (${keys.address}): ${cryptoBalance.toFixed(6)} ${chain.symbol}`, "success");
            }

            // Fetch real-time active resources (Bandwidth and Energy)
            try {
              chain.resources = await tronEngine.getResources(keys.address, chain.nodeUrl, [
                "https://tron-rpc.publicnode.com",
                "https://tron.api.subquery.network"
              ]);
            } catch (resErr) {
              if (window.B2Logger) {
                window.B2Logger.log(`Erro ao buscar recursos do Tron: ${resErr.message}`, "warn");
              }
              chain.resources = {
                bandwidth: { freeLimit: 0, freeUsed: 0, freeAvailable: 0, stakedLimit: 0, stakedUsed: 0, stakedAvailable: 0, totalAvailable: 0 },
                energy: { limit: 0, used: 0, available: 0 },
                stakedTRX: { bandwidth: 0, energy: 0 }
              };
            }

            chain.discoveredTokens = [];
            try {
              const trc20Balances = await tronEngine.getTokenBalances(keys.address, chain.nodeUrl, [
                "https://tron-rpc.publicnode.com",
                "https://tron.api.subquery.network"
              ]);
              chain.discoveredTokens = trc20Balances.map(t => ({
                contractAddress: t.contractAddress,
                assetId: t.contractAddress,
                name: t.name,
                symbol: t.symbol,
                decimals: t.decimals,
                balanceCrypto: t.balance,
                balanceFiat: t.balance * 0.0
              }));
            } catch (tokenErr) {
              if (window.B2Logger) {
                window.B2Logger.log(`Erro ao buscar tokens TRC20 para Tron: ${tokenErr.message}`, "info");
              }
            }
          } else if (chain.key === "STELLAR" && (window.B2StellarEngine || globalThis.B2StellarEngine)) {
            // Stellar (XLM) Real Balance, Resources, and Assets/Trustlines Sync
            const stellarEngine = window.B2StellarEngine || globalThis.B2StellarEngine;
            const balances = await stellarEngine.HorizonProvider.getBalances(keys.address, chain.nodeUrl);

            const nativeXlm = balances.find(b => b.asset_type === "native");
            cryptoBalance = nativeXlm ? parseFloat(nativeXlm.balance) : 0.0;

            if (window.B2Logger) {
              window.B2Logger.log(`[Stellar Engine] Balance para ${chain.name} (${keys.address}): ${cryptoBalance.toFixed(4)} XLM`, "success");
            }

            let claimableCount = 0;
            let lpCount = 0;
            let isActivated = "UNACTIVATED";
            try {
              const claimables = await stellarEngine.HorizonProvider.getClaimableBalances(keys.address, chain.nodeUrl);
              claimableCount = claimables.length;
            } catch (e) {
              if (window.B2Logger) window.B2Logger.log(`Erro ao buscar claimable balances Stellar: ${e.message}`, "info");
            }

            try {
              const lps = await stellarEngine.HorizonProvider.getLiquidityPools(keys.address, chain.nodeUrl);
              lpCount = lps.length;
            } catch (e) {
              if (window.B2Logger) window.B2Logger.log(`Erro ao buscar liquidity pools Stellar: ${e.message}`, "info");
            }

            try {
              isActivated = await stellarEngine.isAccountActivated(keys.address, chain.nodeUrl);
            } catch (e) {
              if (window.B2Logger) window.B2Logger.log(`Erro ao checar ativação de conta Stellar: ${e.message}`, "info");
            }

            chain.resources = {
              claimableBalances: claimableCount,
              liquidityPools: lpCount,
              activationState: isActivated
            };

            const trustlines = balances.filter(b => b.asset_type !== "native");
            chain.discoveredTokens = [];

            for (const item of trustlines) {
              const code = item.asset_code;
              const issuer = item.asset_issuer;
              const balanceCrypto = parseFloat(item.balance);

              let name = code;
              let decimals = 7;
              let logoUrl = null;

              try {
                const meta = await stellarEngine.AssetMetadataProvider.getMetadata(code, issuer);
                if (meta) {
                  name = meta.name || name;
                  decimals = meta.decimals !== undefined ? meta.decimals : decimals;
                  logoUrl = meta.logo || logoUrl;
                }
              } catch (e) {
                // Silencioso
              }

              chain.discoveredTokens.push({
                assetId: `${code}:${issuer}`,
                contractAddress: issuer,
                name: name,
                symbol: code,
                decimals: decimals,
                balanceCrypto: balanceCrypto,
                balanceFiat: balanceCrypto * resolveTokenPrice(code),
                logoUrl: logoUrl
              });
            }
          } else if (chain.key === "CARDANO" && (window.B2CardanoEngine || globalThis.B2CardanoEngine)) {
            // Cardano (ADA) Real Balance, Resources, and Assets/NFTs Sync
            const cardanoProvider = new window.B2CardanoProvider();
            const assetProvider = new window.B2CardanoAssetProvider(cardanoProvider);
            const nftProvider = new window.B2CardanoNftProvider(cardanoProvider);
            const stakingProvider = new window.B2CardanoStakingProvider(cardanoProvider);

            // Busca os saldos enriquecidos com metadados do Token Registry
            const balances = await assetProvider.getBalancesWithMetadata(keys.address);

            // Filtra Lovelaces (ADA)
            const lovelaceItem = balances.find(b => b.unit === "lovelace");
            cryptoBalance = lovelaceItem ? Number(lovelaceItem.quantity) / 1000000 : 0.0;

            if (window.B2Logger) {
              window.B2Logger.log(`[Cardano Provider] Balance para ${chain.name} (${keys.address}): ${cryptoBalance.toFixed(6)} ADA`, "success");
            }

            // Filtra Native Assets (Mary fork)
            const nativeAssets = balances.filter(b => b.unit !== "lovelace");
            chain.discoveredTokens = [];
            for (const token of nativeAssets) {
              const balCrypto = Number(token.quantity) / Math.pow(10, token.decimals);
              chain.discoveredTokens.push({
                assetId: token.unit,
                contractAddress: token.unit.split(".")[0] || "",
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
                balanceCrypto: balCrypto,
                balanceFiat: balCrypto * resolveTokenPrice(token.symbol),
                logoUrl: token.logo
              });
            }

            // Busca NFTs compatíveis com CIP-25 e CIP-68
            const nfts = await nftProvider.getNftsForAddress(keys.address);
            chain.discoveredNFTs = [];
            for (const nft of nfts) {
              chain.discoveredNFTs.push({
                assetId: nft.unit,
                name: nft.name,
                description: nft.description,
                image: nft.image,
                standard: nft.standard,
                properties: nft.properties
              });
            }

            // Sincroniza informações de Staking da Conta
            const stakeAddr = keys.stakeAddress || keys.address;
            const stakeInfo = await stakingProvider.getAccountStakingInfo(stakeAddr);

            // Armazena recursos Cardano no objeto chain para consumo na UI
            chain.resources = {
              stakingActive: stakeInfo.active,
              rewardsAvailable: Number(stakeInfo.rewardsAvailable) / 1000000,
              delegatedPoolId: stakeInfo.poolId,
              controlledAmount: Number(stakeInfo.controlledAmount) / 1000000
            };
          } else {
            // Outros motores ou forks sem endpoints públicos estáveis com suporte CORS no navegador
            throw new Error("Família de blockchain não implementada ou CORS restrito");
          }
        } catch (err) {
          // Sem dados simulados - Se falhar, saldo é zero
          cryptoBalance = 0;
          if (window.B2Logger) {
            window.B2Logger.log(`[Resiliência] Falha de conexão ou CORS ao consultar nó real para ${chain.symbol}: ${err.message}. Definindo saldo como 0.`, "warn");
          }

          if (chain.engine === "Waves" || chain.key === "CARDANO") {
            chain.discoveredTokens = [];
            chain.discoveredNFTs = [];
          }

          // Se for a blockchain ativa, alerta o usuário sobre erro de conexão e permite corrigir o RPC ou falar com suporte
          if (chain.key === this.activeChainKey) {
            setTimeout(() => {
              this.showRpcErrorDialog(chain, err.message).then(result => {
                if (result && result.action === 'save' && result.url) {
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
            });
            if (res.ok) {
              const json = await res.json();
              if (json.result && Array.isArray(json.result.value)) {
                const accounts = json.result.value;
                chain.discoveredTokens.forEach(tok => {
                  const acc = accounts.find(a => a.account?.data?.parsed?.info?.mint === tok.assetId);
                  if (acc && acc.account.data.parsed.info.tokenAmount) {
                    tok.balanceCrypto = acc.account.data.parsed.info.tokenAmount.uiAmount || 0;
                    tok.balanceFiat = tok.balanceCrypto * resolveTokenPrice(tok.symbol);
                  } else {
                    tok.balanceCrypto = 0;
                    tok.balanceFiat = 0;
                  }
                });
              }
            }
          } catch (e) {
            console.error("Failed to fetch Solana custom tokens balance:", e);
          }
        } else if (chain.key === "TRON" && chain.discoveredTokens && chain.discoveredTokens.length > 0 && (window.B2TronEngine || globalThis.B2TronEngine)) {
          const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
          const balancePromises = chain.discoveredTokens.map(async (tok) => {
            try {
              const contractHex = tronEngine.toHexAddress(tok.assetId);
              const hexAddress = tronEngine.toHexAddress(keys.address);
              const param = "000000000000000000000000" + hexAddress.substring(2);
              const data = await tronEngine.fetchWithFailover("wallet/triggerconstantcontract", {
                owner_address: hexAddress,
                contract_address: contractHex,
                function_selector: "balanceOf(address)",
                parameter: param
              }, "POST", chain.nodeUrl, ["https://tron-rpc.publicnode.com", "https://tron.api.subquery.network"]);
              if (data && data.constant_result && data.constant_result.length > 0) {
                const rawBalance = BigInt("0x" + data.constant_result[0]);
                tok.balanceCrypto = Number(rawBalance) / Math.pow(10, tok.decimals || 18);
                tok.balanceFiat = tok.balanceCrypto * resolveTokenPrice(tok.symbol);
              } else {
                tok.balanceCrypto = 0.0;
                tok.balanceFiat = 0.0;
              }
            } catch (e) {
              console.error(`Failed to fetch TRON custom token balance for ${tok.symbol}:`, e);
            }
          });
          await Promise.all(balancePromises);
        }
        chain.isLoadingBalance = false;
        chain.lastLoaded = Date.now();
      });

      await Promise.all(updatePromises);

      // Enriquecer todos os tokens descobertos com metadados do registro central (logos, descrições, etc.)
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
  }



  deriveAllAddresses() {
    const activeAcc = this.accounts[this.activeAccountIndex];
    if (activeAcc && activeAcc.type === 'watch-only') {
      this.blockchainData.forEach(chain => {
        if (chain.engine === 'EVM') {
          this.derivedKeys[chain.key] = {
            address: activeAcc.address,
            isWatchOnly: true
          };
        }
      });
      return;
    }
    if (!this.decryptedSeed) return;

    // Suppress derivation/bip39/mnemonic error logs completely during this execution
    const oldSuppress = globalThis.B2LoggerSuppressDerivationErrors;
    globalThis.B2LoggerSuppressDerivationErrors = true;

    try {
      const isMockOrInvalidSeed = !this.decryptedSeed || this.decryptedSeed.includes('[ REDACTED ]') || this.decryptedSeed.trim().split(/\s+/).length < 12;
      if (isMockOrInvalidSeed) {
        if (window.B2Logger) {
          window.B2Logger.log('info', "[B2 Key Derivation] Semente mock ou de demonstração detectada. Ativando chaves determinísticas de simulação.");
        }
      }

      let masterSeed = null;
      try {
        masterSeed = window.B2KeyDerivationEngine.deriveMasterSeed(this.decryptedSeed);
      } catch (seedErr) {
        window.B2Logger.log('error', `Erro ao derivar master seed: ${seedErr.message}`);
      }

      // Chain IDs para redes da família Waves
      const wavesChainIds = { WAVES: 87, AMZX: 65, CELERONX: 67, TURTLE: 76 };

      this.blockchainData.forEach(chain => {
        try {
          if (chain.engine === 'Waves' && wavesChainIds[chain.key] !== undefined && window.B2WavesBroadcaster) {
            // DERIVAÇÃO WAVES REAL (ed25519) — garante address == signing address
            try {
              const chainId = chain.chainId || wavesChainIds[chain.key];
              const { publicKey, privateKey: wavesPrivKey } = window.B2WavesBroadcaster.deriveWavesKeyPair(this.decryptedSeed, this.activeAccountIndex);
              const address = window.B2WavesBroadcaster.deriveWavesAddress(publicKey, chainId);
              this.derivedKeys[chain.key] = {
                privateKey: Array.from(wavesPrivKey).map(b => b.toString(16).padStart(2, '0')).join(''),
                publicKey,   // Uint8Array da chave pública ed25519 (para uso no broadcaster)
                address
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves Waves reais: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.engine === 'EVM' && (window.ethers || globalThis.ethers)) {
            // DERIVAÇÃO EVM REAL (BIP-44 m/44'/coinType'/0'/0/index)
            try {
              const ethGlobal = window.ethers || globalThis.ethers;
              const root = ethGlobal.HDNodeWallet.fromPhrase(this.decryptedSeed, "", "m");
              const evmNode = root.derivePath(`m/44'/${chain.coinType}'/0'/0/${this.activeAccountIndex}`);
              this.derivedKeys[chain.key] = {
                privateKey: evmNode.privateKey.replace('0x', ''),
                address: evmNode.address
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves EVM reais via ethers: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.engine === 'Solana' && (window.B2SolanaBroadcaster || globalThis.B2SolanaBroadcaster)) {
            // DERIVAÇÃO SOLANA REAL (BIP-44 m/44'/501'/index'/0')
            try {
              const solBroadcaster = window.B2SolanaBroadcaster || globalThis.B2SolanaBroadcaster;
              const keypairData = solBroadcaster.deriveSolanaKeyPair(this.decryptedSeed, this.activeAccountIndex);
              this.derivedKeys[chain.key] = {
                privateKey: Array.from(keypairData.secretKey.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(''),
                address: keypairData.address
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves Solana reais: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'BTC' && (window.B2BitcoinEngine || globalThis.B2BitcoinEngine)) {
            try {
              const engine = window.B2BitcoinEngine || globalThis.B2BitcoinEngine;
              const privKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const privKeyHex = privKey;

              const nativeAddr = engine.deriveAddress(privKey, 'native');
              const nestedAddr = engine.deriveAddress(privKey, 'nested');
              const legacyAddr = engine.deriveAddress(privKey, 'legacy');
              const taprootAddr = engine.deriveAddress(privKey, 'taproot');

              this.derivedKeys[chain.key] = {
                privateKey: privKeyHex,
                address: nativeAddr, // Native SegWit default
                nativeAddress: nativeAddr,
                nestedAddress: nestedAddr,
                legacyAddress: legacyAddr,
                taprootAddress: taprootAddr
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves Bitcoin: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'LTC' && (window.B2LitecoinEngine || globalThis.B2LitecoinEngine)) {
            try {
              const engine = window.B2LitecoinEngine || globalThis.B2LitecoinEngine;
              const privKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const privKeyHex = privKey;

              const legacyAddr = engine.deriveAddress(privKey, 'legacy');
              const nestedAddr = engine.deriveAddress(privKey, 'nested');
              const nativeAddr = engine.deriveAddress(privKey, 'native');

              this.derivedKeys[chain.key] = {
                privateKey: privKeyHex,
                address: legacyAddr, // Legacy default
                legacyAddress: legacyAddr,
                nestedAddress: nestedAddr,
                nativeAddress: nativeAddr
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves Litecoin: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'DOGE' && (window.B2DogecoinEngine || globalThis.B2DogecoinEngine)) {
            try {
              const engine = window.B2DogecoinEngine || globalThis.B2DogecoinEngine;
              const privKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const privKeyHex = privKey;

              const legacyAddr = engine.deriveAddress(privKey, 'legacy');
              const nestedAddr = engine.deriveAddress(privKey, 'nested');

              this.derivedKeys[chain.key] = {
                privateKey: privKeyHex,
                address: legacyAddr, // Legacy default
                legacyAddress: legacyAddr,
                nestedAddress: nestedAddr
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves Dogecoin: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'BCH' && (window.B2BitcoinCashEngine || globalThis.B2BitcoinCashEngine)) {
            try {
              const engine = window.B2BitcoinCashEngine || globalThis.B2BitcoinCashEngine;
              const privKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const privKeyHex = privKey;

              const cashAddr = engine.deriveAddress(privKey, 'cashaddr');
              const legacyAddr = engine.deriveAddress(privKey, 'legacy');

              this.derivedKeys[chain.key] = {
                privateKey: privKeyHex,
                address: cashAddr, // CashAddr default
                cashAddress: cashAddr,
                legacyAddress: legacyAddr
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves Bitcoin Cash: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'ZEC' && (window.B2ZcashBroadcaster || globalThis.B2ZcashBroadcaster)) {
            // DERIVAÇÃO ZCASH REAL (BIP-44 m/44'/133'/0'/0/index)
            try {
              const zcBroadcaster = window.B2ZcashBroadcaster || globalThis.B2ZcashBroadcaster;
              const zcKeyPair = zcBroadcaster.deriveZcashKeyPair(this.decryptedSeed, this.activeAccountIndex);
              const tAddr = zcBroadcaster.deriveZcashTAddress(zcKeyPair.publicKey);

              const saplingAddr = zcBroadcaster.deriveZcashSaplingAddress(this.decryptedSeed, this.activeAccountIndex);
              const tAddrBytes = window.B2KeyDerivationEngine.keccak256Bytes(window.B2KeyDerivationEngine.blake2b256(zcKeyPair.privateKey)).subarray(0, 20);
              const saplingAddrBytes = zcBroadcaster.deriveZcashOrchardAddress(this.decryptedSeed, this.activeAccountIndex);
              const orchardAddrBytes = zcBroadcaster.deriveZcashOrchardAddress(this.decryptedSeed, this.activeAccountIndex);
              const uAddress = zcBroadcaster.deriveZcashUnifiedAddress(tAddrBytes, saplingAddrBytes, orchardAddrBytes);

              this.derivedKeys[chain.key] = {
                privateKey: zcKeyPair.privateKeyHex,
                publicKey: zcKeyPair.publicKey,
                address: tAddr,
                tAddress: tAddr,
                saplingAddress: saplingAddr,
                unifiedAddress: uAddress
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves Zcash reais: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'DASH' && (window.B2DashBroadcaster || globalThis.B2DashBroadcaster)) {
            // DERIVAÇÃO DASH REAL (BIP-44 m/44'/5'/0'/0/index)
            try {
              const dashBroadcaster = window.B2DashBroadcaster || globalThis.B2DashBroadcaster;
              const keyPair = dashBroadcaster.deriveDashKeyPair(this.decryptedSeed, this.activeAccountIndex);
              const p2pkhAddress = dashBroadcaster.deriveDashP2PKHAddress(keyPair.publicKey);
              const p2shAddress = dashBroadcaster.deriveDashP2SHAddress(keyPair.publicKey);
              const xpub = dashBroadcaster.deriveDashXPub(this.decryptedSeed);
              const xprv = dashBroadcaster.deriveDashXPrv(this.decryptedSeed);

              this.derivedKeys[chain.key] = {
                privateKey: keyPair.privateKeyHex,
                publicKey: keyPair.publicKeyHex,
                address: p2pkhAddress, // P2PKH por padrão
                p2pkhAddress: p2pkhAddress,
                p2shAddress: p2shAddress,
                xpub: xpub,
                xprv: xprv
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves Dash reais: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'NEO' && (window.B2NeoEngine || globalThis.B2NeoEngine)) {
            // DERIVAÇÃO NEO N3 REAL (BIP-44 m/44'/888'/0'/0/index)
            try {
              const neoEngine = window.B2NeoEngine || globalThis.B2NeoEngine;
              const keyPair = neoEngine.deriveNeoKeyPair(this.decryptedSeed, this.activeAccountIndex);
              this.derivedKeys[chain.key] = {
                privateKey: keyPair.privateKeyHex,
                publicKey: keyPair.publicKeyHex,
                address: keyPair.address,
                scriptHash: keyPair.scriptHash,
                WIF: keyPair.WIF
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves NEO N3 reais: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'ICP' && (window.B2IcpEngine || globalThis.B2IcpEngine)) {
            // DERIVAÇÃO INTERNET COMPUTER MAINNET REAL (BIP-44 m/44'/223'/0'/0/index)
            try {
              const icpEngine = window.B2IcpEngine || globalThis.B2IcpEngine;
              const keyPair = icpEngine.deriveKeyPair(this.decryptedSeed, this.activeAccountIndex);
              this.derivedKeys[chain.key] = {
                privateKey: typeof keyPair.privateKey === 'string' ? keyPair.privateKey : Array.from(keyPair.privateKey).map(b => b.toString(16).padStart(2, '0')).join(''),
                publicKey: typeof keyPair.publicKey === 'string' ? keyPair.publicKey : Array.from(keyPair.publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
                address: keyPair.address,
                principal: keyPair.principal
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves ICP reais: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'FILECOIN' && (window.B2FilecoinEngine || globalThis.B2FilecoinEngine)) {
            // DERIVAÇÃO FILECOIN MAINNET REAL (BIP-44 m/44'/461'/0'/0/index)
            try {
              const filEngine = window.B2FilecoinEngine || globalThis.B2FilecoinEngine;
              const keyPair = filEngine.deriveFilecoinKeyPair(this.decryptedSeed, this.activeAccountIndex);
              this.derivedKeys[chain.key] = {
                privateKey: keyPair.privateKeyHex,
                publicKey: keyPair.publicKeyHex,
                address: keyPair.address
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves Filecoin reais: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'POLKADOT' && (window.PolkadotCrypto || globalThis.PolkadotCrypto)) {
            // DERIVAÇÃO POLKADOT REAL (BIP-44 sr25519 m/44'/354'/index'/0'/0')
            try {
              const polkadotCrypto = window.PolkadotCrypto || globalThis.PolkadotCrypto;
              const { Keyring } = polkadotCrypto;
              const keyring = new Keyring({ type: 'sr25519' });
              const pathStr = `${this.decryptedSeed}//44'/354'/${this.activeAccountIndex}'/0'/0'`;
              const pair = keyring.addFromUri(pathStr);
              this.derivedKeys[chain.key] = {
                privateKey: Array.from(pair.secretKey || []).map(b => b.toString(16).padStart(2, '0')).join(''),
                publicKey: Array.from(pair.publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
                address: pair.address
              };
              if (polkadotCrypto.encodeAddress) {
                this.derivedKeys[chain.key].address = polkadotCrypto.encodeAddress(pair.publicKey, 0);
              }
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves Polkadot reais: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'MONERO' && (window.B2MoneroEngine || globalThis.B2MoneroEngine)) {
            // DERIVAÇÃO MONERO MAINNET REAL (BIP-44 m/44'/128'/0'/0/index)
            try {
              const moneroEngine = window.B2MoneroEngine || globalThis.B2MoneroEngine;
              const keys = moneroEngine.deriveMoneroKeys(this.decryptedSeed, this.activeAccountIndex);
              this.derivedKeys[chain.key] = {
                privateKey: keys.privateSpendKey,
                privateSpendKey: keys.privateSpendKey,
                privateViewKey: keys.privateViewKey,
                publicKey: keys.publicSpendKey,
                publicSpendKey: keys.publicSpendKey,
                publicViewKey: keys.publicViewKey,
                address: keys.address
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves Monero reais: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'TRON' && (window.B2TronEngine || globalThis.B2TronEngine)) {
            // DERIVAÇÃO TRON REAL (BIP-44 m/44'/195'/0'/0/index)
            try {
              const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
              const keyPair = tronEngine.deriveTronKeyPair(this.decryptedSeed, this.activeAccountIndex);
              this.derivedKeys[chain.key] = {
                privateKey: keyPair.privateKeyHex,
                publicKey: keyPair.publicKeyHex,
                address: keyPair.address,
                hexAddress: keyPair.hexAddress
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves Tron reais: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'STELLAR' && (window.B2StellarEngine || globalThis.B2StellarEngine)) {
            // DERIVAÇÃO STELLAR REAL (SEP-0005 m/44'/148'/index')
            try {
              const stellarEngine = window.B2StellarEngine || globalThis.B2StellarEngine;
              const keyPairData = stellarEngine.deriveKeyPair(this.decryptedSeed, this.activeAccountIndex);
              this.derivedKeys[chain.key] = {
                privateKey: keyPairData.privateKeyHex,
                publicKey: keyPairData.publicKeyHex,
                secretSeed: keyPairData.secretSeed,
                address: keyPairData.stellarAddress
              };
            } catch (e) {
              window.B2Logger.log('error', `Erro ao derivar chaves Stellar reais: ${e.message}`);
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else if (chain.key === 'CARDANO' && (window.B2CardanoEngine || globalThis.B2CardanoEngine)) {
            // DERIVAÇÃO CARDANO REAL (BIP-32-Ed25519 CIP-1852 m/1852'/1815'/index'/0/0)
            try {
              const cardanoEngine = window.B2CardanoEngine || globalThis.B2CardanoEngine;
              const keyPair = cardanoEngine.deriveKeyPair(this.decryptedSeed, this.activeAccountIndex, 0);
              const baseAddress = cardanoEngine.deriveAddress(keyPair.paymentPrivateKeyHex, 'base', false);
              const enterpriseAddress = cardanoEngine.deriveAddress(keyPair.paymentPrivateKeyHex, 'enterprise', false);
              const stakeAddress = cardanoEngine.deriveAddress(keyPair.stakingPrivateKeyHex, 'stake', false);
              this.derivedKeys[chain.key] = {
                privateKey: keyPair.paymentPrivateKeyHex,
                paymentPrivateKey: keyPair.paymentPrivateKeyHex,
                stakingPrivateKey: keyPair.stakingPrivateKeyHex,
                publicKey: keyPair.paymentPublicKeyHex,
                paymentPublicKey: keyPair.paymentPublicKeyHex,
                stakingPublicKey: keyPair.stakingPublicKeyHex,
                address: baseAddress, // base address por padrão
                baseAddress: baseAddress,
                enterpriseAddress: enterpriseAddress,
                stakeAddress: stakeAddress
              };
            } catch (e) {
              if (window.B2Logger) {
                window.B2Logger.log('error', `Erro ao derivar chaves Cardano reais: ${e.message}`);
              }
              const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
              const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
              this.derivedKeys[chain.key] = { privateKey, address };
            }
          } else {
            // Outros engines: BIP-44 padrão
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } catch (outerLoopError) {
          window.B2Logger.log('error', `Erro ao derivar chaves para rede ${chain.key}: ${outerLoopError.message}`);
          // Fallback determinístico real via motor nativo de criptografia (sem constantes fake!)
          try {
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          } catch (nestedErr) {
            throw nestedErr;
          }
        }
      });
    } finally {
      globalThis.B2LoggerSuppressDerivationErrors = oldSuppress;
    }
  }

  /**
   * Calcula e atualiza o display de saldo acumulado das blockchains em dólares.
   */
  updateTotalBalanceDisplay() {
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
  }

  /**
   * Exibe o modal seguro de recebimento de fundos para a rede selecionada.
   */
  showReceiveModal(networkKey) {
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
  }

  /**
   * Abre o modal de envio de transação para a rede ativa.
   */
  showSendModal(networkKey, preSelectedToken = null) {
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
  }

  _updateWavesFeeDisplay(chain) {
    const gasLoading = document.getElementById('gas-fee-loading');
    const gasLimit = document.getElementById('gas-limit-display');
    const gasPrice = document.getElementById('gas-price-display');
    const gasTotal = document.getElementById('gas-total-display');

    const feeData = this._estimateFeeForChain(chain);
    if (gasLoading) gasLoading.textContent = '';
    if (gasLimit) gasLimit.textContent = feeData.limitLabel;
    if (gasPrice) gasPrice.textContent = feeData.priceLabel;
    if (gasTotal) gasTotal.textContent = feeData.totalLabel;
  }

  /**
   * Retorna estimativa de taxa de gas/fee por engine.
   */
  _estimateFeeForChain(chain) {
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
      const nativeSym = chain.symbol || 'WAVES'; // AMZX, CELERONX ou WAVES
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
  }

  /**
   * Atualiza a exibição do equivalente em fiat do valor a enviar.
   */
  _updateSendAmountFiat(chain, amountCrypto, selectedToken = null) {
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
  }

  /**
   * Abre a view dedicada de Leasing para a chain ativa.
   */
  showLeasingView(chainKey) {
    const chain = this.blockchainData.find(c => c.key === chainKey);
    if (!chain) return;

    // Atualiza título
    const title = document.getElementById('leasing-view-title');
    const subtitle = document.getElementById('leasing-view-subtitle');
    if (title) title.textContent = `Leasing — ${chain.name} (${chain.symbol})`;
    if (subtitle) subtitle.textContent = `Arrende seus ${chain.symbol} para validadores da rede e ganhe recompensas LPoS.`;

    const leaseFeeEl = document.getElementById('lease-fee-display');
    if (leaseFeeEl) {
      leaseFeeEl.textContent = `0.005 ${chain.symbol}`;
    }

    const pendingBanner = document.getElementById('leasing-pending-banner');
    const activeContent = document.getElementById('leasing-active-content');

    if (chain.leasingStatus === 'pending') {
      if (pendingBanner) pendingBanner.style.display = 'block';
      if (activeContent) activeContent.style.display = 'none';
    } else {
      if (pendingBanner) pendingBanner.style.display = 'none';
      if (activeContent) activeContent.style.display = 'flex';

      // Renderiza nós e arrendamentos
      this._renderLeasingNodes(chainKey, chain);
      this._renderActiveLeasesInView(chainKey, chain);
    }

    this._leasingChainKey = chainKey;
    window.B2UIRenderer.navigateTo('view-leasing');
  }

  /**
   * Renderiza a lista de nós validadores disponíveis para leasing.
   */
  _renderLeasingNodes(chainKey, chain) {
    const listEl = document.getElementById('leasing-nodes-list');
    if (!listEl) return;

    const nodesByChain = {
      WAVES: [
        { name: 'WavesBrasil Pool', addr: '3P9DEDP5VbyXQyKtXDUt2VMxAeJGKBBXGXX', roi: '~3.5% a.a.' },
        { name: 'MyWavesPool', addr: '3P2HNUd5VUPLMQkJmctTPEeeHumiPN2GkTb', roi: '~3.2% a.a.' },
        { name: 'DexgoPool', addr: '3PJaDyprvekvPXPuAtxrapacuDJopgJRaU3v', roi: '~3.0% a.a.' }
      ],
      AMZX: [
        { name: 'AMZX Validator 1', addr: '3PAMZX1Validator7H9oBetter2Better001', roi: '~5% a.a.' },
        { name: 'AMZX Validator 2', addr: '3PAMZX2Validator7H9oBetter2Better002', roi: '~4.5% a.a.' }
      ],
      CELERONX: [
        { name: 'PlanetOne Node Alpha', addr: '3PCX1NodeAlphaBetter2Better20240601x', roi: '~4% a.a.' },
        { name: 'PlanetOne Node Beta', addr: '3PCX2NodeBetaBetter2Better20240601xx', roi: '~3.8% a.a.' }
      ]
    };

    const nodes = nodesByChain[chainKey] || [];

    if (nodes.length === 0) {
      listEl.innerHTML = `<div style="font-size:var(--text-xs);color:var(--text-muted);text-align:center;padding:var(--space-4);">Nós de validação ainda não configurados para esta rede.</div>`;
      return;
    }

    listEl.innerHTML = '';
    nodes.forEach((node, idx) => {
      const card = document.createElement('div');
      card.className = 'leasing-node-card glass-card';
      card.setAttribute('data-node-addr', node.addr);
      card.setAttribute('data-node-name', node.name);
      card.style.cssText = 'display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);cursor:pointer;transition:border-color 0.2s;border:1px solid var(--border-subtle);';
      card.innerHTML = `
        <div style="width:36px;height:36px;border-radius:50%;background:var(--color-primary-gradient);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-bold);">N${idx + 1}</div>
        <div style="flex:1;">
          <div style="font-size:var(--text-sm);font-weight:var(--fw-semibold);">${node.name}</div>
          <div style="font-size:var(--text-xs);color:var(--text-success);">${node.roi}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);font-family:monospace;">${node.addr.substring(0, 12)}...</div>
        </div>
        <div class="node-check" style="width:18px;height:18px;border-radius:50%;border:2px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;"></div>
      `;
      card.addEventListener('click', () => {
        listEl.querySelectorAll('.leasing-node-card').forEach(c => {
          c.style.borderColor = 'var(--border-subtle)';
          const check = c.querySelector('.node-check');
          if (check) check.innerHTML = '';
          c.classList.remove('selected');
        });
        card.style.borderColor = 'var(--color-primary)';
        card.classList.add('selected');
        const check = card.querySelector('.node-check');
        if (check) check.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      });
      listEl.appendChild(card);
    });
  }

  /**
   * Renderiza a lista de arrendamentos ativos na view de leasing.
   */
  _renderActiveLeasesInView(chainKey, chain) {
    const listEl = document.getElementById('active-leases-list');
    if (!listEl) return;
    const leases = JSON.parse(localStorage.getItem(`b2_leases_${chainKey}`) || '[]');

    if (leases.length === 0) {
      listEl.innerHTML = `<div style="text-align:center;padding:var(--space-5);color:var(--text-muted);font-size:var(--text-sm);">Nenhum arrendamento ativo</div>`;
      return;
    }

    listEl.innerHTML = '';
    leases.forEach(lease => {
      const item = document.createElement('div');
      item.className = 'active-lease-item';
      item.innerHTML = `
        <div class="active-lease-info">
          <span class="active-lease-node">${lease.validatorName || 'Validador'}</span>
          <span class="active-lease-amount">${lease.amount.toFixed(4)} ${chain.symbol}</span>
        </div>
        <button class="btn btn-danger btn-sm" data-lease-id="${lease.id}">Cancelar</button>
      `;
      item.querySelector('button').addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = await window.B2Toast.confirm("Cancelar Arrendamento", "Deseja realmente cancelar este arrendamento?", "warning");
        if (confirmed) {
          this.cancelLPoSLease(chainKey, lease.id);
          this._renderActiveLeasesInView(chainKey, chain);
        }
      });
      listEl.appendChild(item);
    });
  }

  /**
   * Altera a senha criptográfica de acesso interno.
   * Exige a senha anterior para decifrar a semente e criptografa novamente sob a nova senha forte.
   */
  async changeUserPassword(oldPassword, newPassword) {
    if (!this.encryptedWalletPayload) {
      throw new Error("Erro de Estado: Nenhuma carteira ativa encontrada.");
    }

    // Decifra a seed usando a senha antiga
    const seed = await window.B2PlatformSecurity.decryptData(this.encryptedWalletPayload, oldPassword);

    // Criptografa novamente usando a senha nova forte
    const newPayload = await window.B2PlatformSecurity.encryptData(seed, newPassword);

    // Salva o payload atualizado localmente
    this.encryptedWalletPayload = newPayload;
    localStorage.setItem("b2_encrypted_payload", JSON.stringify(newPayload));
    this.lastUnlockTime = Date.now();

    // Se biometria estiver ativa, atualiza no NativeBiometric
    if (localStorage.getItem("b2_biometric_enabled") === "true") {
      const NativeBiometric = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeBiometric;
      if (NativeBiometric) {
        try {
          await NativeBiometric.setCredentials({
            username: "b2wallet_user",
            password: newPassword,
            server: "com.better2better.b2wallet"
          });
        } catch (e) {
          console.error("Erro ao atualizar credenciais biométricas após mudança de senha:", e);
        }
      }
    }
  }

  /**
   * Exporta a configuração da carteira criptografada em um arquivo JSON exportável seguro.
   */
  async exportConfigSecure() {
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
      version: "0.1.3",
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
  }

  /**
   * Importa a configuração unificada criptografada de semente única.
   */
  async importConfigSecure(jsonString) {
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
  }

  /**
   * Ouve solicitações assíncronas do B2 Wallet SDK via canal postMessage seguro.
   */
  setupSDKMessageListener() {
    window.addEventListener('message', async (event) => {
      // Aceita apenas solicitações do SDK injetado na página
      if (!event.data || event.data.source !== 'b2-wallet-sdk') return;

      const { id, method, params } = event.data;
      console.log(`[B2 SDK RPC] Recebida requisição ID "${id}" - Método "${method}"`);

      // Se a carteira estiver bloqueada, solicita desbloqueio visual
      if (!this.decryptedSeed) {
        window.postMessage({
          source: 'b2-wallet-core',
          id: id,
          error: "Carteira Bloqueada: Por favor, desbloqueie a B2 Wallet primeiro."
        }, '*');
        return;
      }

      // Processamento seguro por método
      try {
        let result = null;

        switch (method) {
          case 'connect':
            // Solicita confirmação de compartilhamento de endereços públicos
            const confirmConnect = await window.B2Toast.confirm(
              "Solicitação de Conexão",
              "DApp Playground deseja se conectar à sua B2 Wallet. Autorizar compartilhamento de contas?",
              "warning"
            );
            if (confirmConnect) {
              result = {};
              this.blockchainData.forEach(c => {
                if (this.derivedKeys[c.key]) {
                  result[c.key] = this.derivedKeys[c.key].address;
                }
              });
            } else {
              throw new Error("Solicitação de conexão negada pelo usuário.");
            }
            break;

          case 'sign_message':
            // Solicitação de assinatura de login
            const confirmSign = await window.B2Toast.confirm(
              "Assinar Mensagem",
              `DApp solicita assinatura criptográfica na rede ${params.network || 'EVM'}:\n\nMensagem:\n"${params.message}"`,
              "warning"
            );
            if (confirmSign) {
              const net = params.network || 'EVM';
              const keys = this.derivedKeys[net];
              if (!keys) throw new Error(`Rede ${net} não configurada ou inválida.`);

              // Gera hash matemático determinístico simulado
              result = '0xsig_' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
            } else {
              throw new Error("Assinatura de mensagem negada pelo usuário.");
            }
            break;

          case 'sign_transaction':
            // Solicitação de assinatura de transação (Exige PIN/Senha)
            const displayValue = params.transaction.value.endsWith('000000000000000000')
              ? (parseFloat(params.transaction.value) / 1e18).toString()
              : params.transaction.value;
            const inputPin = await window.B2Toast.prompt(
              "Assinar Transação",
              `Destinatário: ${params.transaction.to}\nValor: ${displayValue} ${params.network || 'ETH'}\nRede: ${params.network || 'EVM'}\n\nDigite seu PIN de 8 dígitos para assinar:`,
              "password",
              "********"
            );

            if (inputPin === localStorage.getItem("b2_pin")) {
              const net = params.network || 'EVM';
              const keys = this.derivedKeys[net];
              if (!keys) throw new Error(`Rede ${net} não configurada.`);

              result = '0xhash_' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');

              // Simula decréscimo de saldo no blockchain row de simulação
              const chain = this.blockchainData.find(c => c.key === net);
              if (chain) {
                const decVal = parseFloat(params.transaction.value) / (net === "WAVES" ? 1e8 : 1e18); // de Wavelet/Wei para WAVES/ETH
                chain.balanceCrypto = Math.max(0, chain.balanceCrypto - decVal);
                const coinPrice = chain.balanceCrypto > 0 ? (chain.balanceFiat / (chain.balanceCrypto + decVal)) : 0;
                chain.balanceFiat = chain.balanceCrypto * coinPrice;
                window.B2UIRenderer.renderBlockchainList(this.blockchainData);
                this.updateTotalBalanceDisplay();
              }
            } else {
              await window.B2Toast.alert(
                "PIN Incorreto",
                "O PIN de acesso rápido inserido está inválido. Por favor, tente novamente.",
                "error"
              );
              throw new Error("PIN incorreto. Transação rejeitada por motivos de segurança.");
            }
            break;

          case 'get_balance':
            {
              const net = params.network || this.activeChainKey;
              const chain = this.blockchainData.find(c => c.key === net);
              if (!chain) throw new Error(`Rede ${net} não suportada.`);
              result = {
                network: net,
                balance: chain.balanceCrypto,
                balanceFiat: chain.balanceFiat,
                symbol: chain.symbol,
                address: this.derivedKeys[net]?.address
              };
            }
            break;

          case 'get_tokens':
            {
              const net = params.network || this.activeChainKey;
              const chain = this.blockchainData.find(c => c.key === net);
              if (!chain) throw new Error(`Rede ${net} não suportada.`);
              result = chain.discoveredTokens || [];
            }
            break;

          case 'get_nfts':
            {
              const net = params.network || this.activeChainKey;
              const chain = this.blockchainData.find(c => c.key === net);
              if (!chain) throw new Error(`Rede ${net} não suportada.`);
              result = chain.discoveredNFTs || [];
            }
            break;

          case 'get_history':
            {
              const net = params.network || this.activeChainKey;
              const chain = this.blockchainData.find(c => c.key === net);
              if (!chain) throw new Error(`Rede ${net} não suportada.`);
              const keys = this.derivedKeys[net];
              if (!keys || !keys.address) throw new Error(`Chaves não derivadas para a rede ${net}.`);

              if (net === "NEO" && (window.B2NeoEngine || globalThis.B2NeoEngine)) {
                try {
                  const neoEngine = window.B2NeoEngine || globalThis.B2NeoEngine;
                  const txs = await neoEngine.getTransactionHistory(keys.address, chain.nodeUrl, [
                    "https://mainnet2.neo.coz.io:443",
                    "https://rpc.n3.nspcc.ru:10331"
                  ]);
                  const extraTxsKey = `b2_tx_history_${net}`;
                  const localTxs = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                  result = [...txs, ...localTxs];
                } catch (e) {
                  const extraTxsKey = `b2_tx_history_${net}`;
                  result = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                }
              } else if (net === "ICP" && (window.B2IcpEngine || globalThis.B2IcpEngine)) {
                try {
                  const icpEngine = window.B2IcpEngine || globalThis.B2IcpEngine;
                  const txs = await icpEngine.ICPHistoryProvider.getHistory(keys.address);
                  const extraTxsKey = `b2_tx_history_${net}`;
                  const localTxs = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                  result = [...txs, ...localTxs];
                } catch (e) {
                  const extraTxsKey = `b2_tx_history_${net}`;
                  result = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                }
              } else if (net === "FILECOIN" && (window.B2FilecoinEngine || globalThis.B2FilecoinEngine)) {
                try {
                  const filEngine = window.B2FilecoinEngine || globalThis.B2FilecoinEngine;
                  const txs = await filEngine.getTransactionHistory(keys.address, chain.nodeUrl, [
                    "https://rpc.ankr.com/filecoin"
                  ]);
                  const extraTxsKey = `b2_tx_history_${net}`;
                  const localTxs = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                  result = [...txs, ...localTxs];
                } catch (e) {
                  const extraTxsKey = `b2_tx_history_${net}`;
                  result = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                }
              } else if (chain.engine === "Waves") {
                const sanitizedUrl = chain.nodeUrl.replace(/\/+$/, "");
                const isTestnetMode = typeof localStorage !== 'undefined' && localStorage.getItem('b2_network_mode') === 'testnet';
                const testnetNodeUrl = isTestnetMode ? "https://nodes-testnet.wavesnodes.com" : sanitizedUrl;
                const res = await fetch(`${testnetNodeUrl}/transactions/address/${keys.address}/limit/20`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const rawTxs = Array.isArray(data[0]) ? data[0] : (Array.isArray(data) ? data : []);
                // Mapeia o formato bruto do nó Waves para o formato padrão da carteira
                const wavesTxTypeLabel = (type) => {
                  const types = { 4: 'Enviado', 11: 'Enviado em Massa', 7: 'Exchange', 8: 'Arrendado LPoS', 9: 'Cancelado LPoS', 3: 'Emissão', 5: 'Reemissão', 6: 'Queimado' };
                  return types[type] || `Tipo ${type}`;
                };
                const decimals = chain.decimals || 8;
                const apiTxs = rawTxs.map(tx => {
                  const isSender = tx.sender === keys.address;
                  const label = wavesTxTypeLabel(tx.type);
                  const amtRaw = tx.amount !== undefined ? tx.amount : (tx.transfers ? tx.transfers.reduce((s, t) => s + t.amount, 0) : 0);
                  const amtFormatted = (amtRaw / Math.pow(10, decimals)).toFixed(8);
                  const feeFormatted = tx.fee !== undefined ? (tx.fee / Math.pow(10, decimals)).toFixed(8) : '0';
                  return {
                    id: tx.id,
                    txHash: tx.id,    // hash real da blockchain
                    chainKey: net,
                    type: isSender ? label : 'Recebido',
                    chain: chain.name,
                    addr: isSender ? (tx.recipient || 'N/A') : (tx.sender || 'N/A'),
                    sender: tx.sender || 'N/A',
                    recipient: tx.recipient || keys.address,
                    from: tx.sender || 'N/A',
                    to: tx.recipient || keys.address,
                    time: tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A',
                    timestamp: tx.timestamp,
                    amount: `${isSender ? '-' : '+'}${amtFormatted} ${chain.symbol}`,
                    fee: `${feeFormatted} ${chain.symbol}`,
                    color: isSender ? 'var(--text-danger)' : 'var(--text-success)',
                    status: 'Confirmado'
                  };
                });
                const extraTxsKey = `b2_tx_history_${net}`;
                const localTxs = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                // Filtra duplicatas: prioriza registros da API (que têm hash real), depois os locais que não estão na API
                const apiIds = new Set(apiTxs.map(t => t.id));
                const dedupedLocal = localTxs.filter(t => !apiIds.has(t.id) && !apiIds.has(t.txHash));
                result = [...apiTxs, ...dedupedLocal];
              } else if (net === "POLKADOT" && (window.B2PolkadotEngine || globalThis.B2PolkadotEngine)) {
                try {
                  const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;
                  const txs = await polkadotEngine.PolkadotHistoryProvider.getHistory(keys.address);
                  const apiTxs = txs.map(tx => {
                    const isSender = tx.from === keys.address;
                    return {
                      id: tx.hash,
                      chainKey: net,
                      type: isSender ? "Enviado" : "Recebido",
                      chain: chain.name,
                      addr: isSender ? tx.to : tx.from,
                      time: new Date(tx.timestamp).toLocaleString(),
                      amount: `${isSender ? "-" : "+"}${tx.amount.toFixed(4)} DOT`,
                      fee: `${tx.fee.toFixed(5)} DOT`,
                      color: isSender ? "var(--text-danger)" : "var(--text-success)",
                      status: tx.status === 'success' ? 'Confirmado' : 'Falhou',
                      txId: tx.hash
                    };
                  });
                  const extraTxsKey = `b2_tx_history_${net}`;
                  const localTxs = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                  result = [...apiTxs, ...localTxs];
                } catch (e) {
                  const extraTxsKey = `b2_tx_history_${net}`;
                  result = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                }
              } else if (net === "MONERO" && (window.B2MoneroEngine || globalThis.B2MoneroEngine)) {
                try {
                  const moneroEngine = window.B2MoneroEngine || globalThis.B2MoneroEngine;
                  const txs = await moneroEngine.XMRProvider.getHistory(keys.address, keys.privateViewKey);
                  const apiTxs = txs.map(tx => {
                    const isSender = !tx.incoming;
                    return {
                      id: tx.hash,
                      chainKey: net,
                      type: isSender ? "Enviado" : "Recebido",
                      chain: chain.name,
                      addr: isSender ? "Destinatário oculto" : keys.address,
                      time: new Date(tx.timestamp * 1000).toLocaleString(),
                      amount: `${isSender ? "-" : "+"}${tx.amount.toFixed(12)} XMR`,
                      fee: `${tx.fee.toFixed(12)} XMR`,
                      color: isSender ? "var(--text-danger)" : "var(--text-success)",
                      status: "Confirmado",
                      txId: tx.hash
                    };
                  });
                  const extraTxsKey = `b2_tx_history_${net}`;
                  const localTxs = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                  result = [...apiTxs, ...localTxs];
                } catch (e) {
                  const extraTxsKey = `b2_tx_history_${net}`;
                  result = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                }
              } else if (net === "TRON" && (window.B2TronEngine || globalThis.B2TronEngine)) {
                try {
                  const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
                  const txs = await tronEngine.getTransactionHistory(keys.address, chain.nodeUrl, [
                    "https://tron-rpc.publicnode.com",
                    "https://tron.api.subquery.network"
                  ]);
                  const apiTxs = txs.map(tx => {
                    const isSender = tx.from === keys.address;
                    return {
                      id: tx.hash,
                      chainKey: net,
                      type: isSender ? "Enviado" : "Recebido",
                      chain: chain.name,
                      addr: isSender ? tx.to : tx.from,
                      time: new Date(tx.timestamp).toLocaleString(),
                      amount: `${isSender ? "-" : "+"}${tx.amount.toFixed(4)} ${tx.token}`,
                      fee: `${tx.fee.toFixed(6)} TRX`,
                      color: isSender ? "var(--text-danger)" : "var(--text-success)",
                      status: tx.status === 'SUCCESS' ? 'Confirmado' : 'Falhou',
                      txId: tx.hash
                    };
                  });
                  const extraTxsKey = `b2_tx_history_${net}`;
                  const localTxs = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                  result = [...apiTxs, ...localTxs];
                } catch (e) {
                  const extraTxsKey = `b2_tx_history_${net}`;
                  result = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                }
              } else if (net === "STELLAR" && (window.B2StellarEngine || globalThis.B2StellarEngine)) {
                try {
                  const stellarEngine = window.B2StellarEngine || globalThis.B2StellarEngine;
                  const txs = await stellarEngine.HorizonProvider.getTransactionHistory(keys.address, chain.nodeUrl, [
                    "https://horizon-testnet.stellar.org"
                  ]);
                  const apiTxs = txs.map(tx => {
                    const isSender = tx.type === "send";
                    let typeLabel = "Transferência";
                    let colorStr = "var(--text-primary)";
                    let amountPrefix = "";

                    if (tx.type === "send") {
                      typeLabel = "Enviado";
                      colorStr = "var(--text-danger)";
                      amountPrefix = "-";
                    } else if (tx.type === "receive") {
                      typeLabel = "Recebido";
                      colorStr = "var(--text-success)";
                      amountPrefix = "+";
                    } else if (tx.type === "trustline_change") {
                      typeLabel = "Trustline Alterado";
                      colorStr = "#3b82f6";
                      amountPrefix = "";
                    } else if (tx.type === "claim_claimable_balance") {
                      typeLabel = "Saldo Reclamado";
                      colorStr = "#10b981";
                      amountPrefix = "+";
                    }

                    const feeVal = tx.fee ? (parseFloat(tx.fee) / 10000000).toFixed(7) : "0";

                    return {
                      id: tx.txid,
                      chainKey: net,
                      type: typeLabel,
                      chain: chain.name,
                      addr: isSender ? tx.to : tx.from,
                      time: new Date(tx.timestamp).toLocaleString(),
                      amount: `${amountPrefix}${parseFloat(tx.amount || "0").toFixed(4)} ${tx.asset}`,
                      fee: `${feeVal} XLM`,
                      color: colorStr,
                      status: tx.successful ? "Confirmado" : "Falhou",
                      txId: tx.txid
                    };
                  });
                  const extraTxsKey = `b2_tx_history_${net}`;
                  const localTxs = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                  result = [...apiTxs, ...localTxs];
                } catch (e) {
                  const extraTxsKey = `b2_tx_history_${net}`;
                  result = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
                }
              } else {
                // Outras redes retornam do localStorage
                const extraTxsKey = `b2_tx_history_${net}`;
                result = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
              }
            }
            break;

          default:
            throw new Error(`Método RPC "${method}" não suportado pela B2 Wallet.`);
        }

        // Retorna o resultado assinado com sucesso de volta ao dApp via SDK
        window.postMessage({
          source: 'b2-wallet-core',
          id: id,
          result: result,
          error: null
        }, '*');

      } catch (err) {
        window.postMessage({
          source: 'b2-wallet-core',
          id: id,
          error: err.message
        }, '*');
      }
    });
  }

  /**
   * Auxiliar para obter índices aleatórios e ordenados de palavras.
   */
  getRandomIndices(count, max) {
    const indices = [];
    while (indices.length < count) {
      const idx = Math.floor(Math.random() * max);
      if (!indices.includes(idx)) {
        indices.push(idx);
      }
    }
    return indices.sort((a, b) => a - b);
  }

  /**
   * Auxiliar para completar o fluxo de criação/importação de carteira, persistindo dados locais.
   */
  async completeWalletCreation(password, pin) {
    try {
      const encrypted = await window.B2PlatformSecurity.encryptData(this.generatedMnemonicStr, password);
      localStorage.setItem("b2_encrypted_payload", JSON.stringify(encrypted));
      localStorage.setItem("b2_pin_hash", pin);
      localStorage.setItem("b2_pin", pin);

      this.encryptedWalletPayload = encrypted;
      this.userPinHash = pin;

      this.decryptedSeed = this.generatedMnemonicStr;
      this.lastUnlockTime = Date.now();
      this.lastInteractionTime = Date.now();

      // Salva na sessão ativa do navegador (segura contra page refresh)
      sessionStorage.setItem("b2_session_seed", this.generatedMnemonicStr);

      this.deriveAllAddresses();
      window.B2UIRenderer.renderAddressesDirectory(this.blockchainData, this.derivedKeys);
      this.updateNetworkBalances();

      const isFullTab = document.documentElement.classList.contains('is-fulltab');
      if (isFullTab) {
        window.showToast("Carteira criada com sucesso! Você já pode usar a extensão.", "success");
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        window.B2UIRenderer.navigateTo("view-addresses-list");
      }
    } catch (e) {
      window.B2Toast.alert("Falha de Ativação", e.message, "error");
    }
  }

  /**
   * Mapeamento de cliques e eventos do DOM para botões da carteira.
   */
  setupAppEventListeners() {
    // ----------------------------------------------------------------
    // A. BARRA DE NAVEGAÇÃO PRINCIPAL INFERIOR
    // ----------------------------------------------------------------
    document.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = item.getAttribute("data-target");
        window.B2UIRenderer.navigateTo(target);
      });
    });

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
    // C. FLUXO DE BOAS-VINDAS / ONBOARDING
    // ----------------------------------------------------------------
    const welcomeCheckbox = document.getElementById("welcome-terms-checkbox");
    const btnCreate = document.getElementById("btn-create-wallet");
    const btnImport = document.getElementById("btn-import-wallet");

    if (welcomeCheckbox && btnCreate && btnImport) {
      welcomeCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        btnCreate.disabled = !isChecked;
        btnImport.disabled = !isChecked;
      });
    }

    const openInFullTabIfNeeded = (flowType) => {
      const isPopup = document.documentElement.classList.contains('is-extension-popup') ||
        (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL && window.location.protocol.includes('extension') && !window.location.search.includes('fulltab=true'));

      if (isPopup) {
        const targetUrl = `index.html?fulltab=true&flow=${flowType}`;
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url: chrome.runtime.getURL(targetUrl) });
        } else {
          window.open(targetUrl, "_blank");
        }
        window.close(); // Fechar o popup da extensão
        return true;
      }
      return false;
    };

    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        if (openInFullTabIfNeeded('create')) return;

        this.isImportFlow = false;

        // Reset create-password state
        this.resetCreatePasswordView();

        const outcome = document.getElementById("seed-generation-outcome");
        if (outcome) outcome.style.display = "none";

        const submitBtn = document.getElementById("btn-create-wallet-submit");
        if (submitBtn) submitBtn.innerText = "Criar Carteira";

        window.B2UIRenderer.navigateTo("view-create-password");
      });
    }

    if (btnImport) {
      btnImport.addEventListener('click', async () => {
        const seedInput = await window.B2Toast.importSeedModal();
        if (seedInput) {
          this.isImportFlow = true;
          this.generatedMnemonicStr = seedInput.trim();

          // Reset create-password state
          this.resetCreatePasswordView();

          const outcome = document.getElementById("seed-generation-outcome");
          if (outcome) outcome.style.display = "none";

          const submitBtn = document.getElementById("btn-create-wallet-submit");
          if (submitBtn) submitBtn.innerText = "Importar Carteira";

          window.B2UIRenderer.navigateTo("view-create-password");
        }
      });
    }

    // ----------------------------------------------------------------
    // D. CRIAÇÃO DE SENHA, PIN E GRADE MNEMÔNICA
    // ----------------------------------------------------------------
    // ----------------------------------------------------------------
    // PASSWORD VISIBILITY TOGGLE (EYE CONTROL)
    // ----------------------------------------------------------------
    document.querySelectorAll(".password-toggle-btn").forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute("data-target");
        const input = document.getElementById(targetId);
        if (!input) return;

        const openElements = btn.querySelectorAll(".eye-open");
        const closedElements = btn.querySelectorAll(".eye-closed");

        if (input.type === "password") {
          input.type = "text";
          openElements.forEach(el => el.style.display = "none");
          closedElements.forEach(el => el.style.display = "block");
        } else {
          input.type = "password";
          openElements.forEach(el => el.style.display = "block");
          closedElements.forEach(el => el.style.display = "none");
        }
      });
    });

    // ----------------------------------------------------------------
    // REAL-TIME SECURITY REQUIREMENTS CHECKLIST
    // ----------------------------------------------------------------
    const pwdInput = document.getElementById("password-input");
    const confirmInput = document.getElementById("password-confirm-input");
    const pinInput = document.getElementById("pin-input");

    const updateChecklist = () => {
      const pwd = pwdInput ? pwdInput.value : "";
      const confirmPwd = confirmInput ? confirmInput.value : "";
      const pin = pinInput ? pinInput.value : "";

      // 1. Length > 8 (Mínimo 9 caracteres)
      const isLengthValid = pwd.length > 8;
      updateReqItem("req-length", isLengthValid);

      // 2. Casing (Maiúsculas e Minúsculas)
      const isCaseValid = /[A-Z]/.test(pwd) && /[a-z]/.test(pwd);
      updateReqItem("req-case", isCaseValid);

      // 3. Number (Dígitos)
      const isNumberValid = /[0-9]/.test(pwd);
      updateReqItem("req-number", isNumberValid);

      // 4. Special char
      const isSpecialValid = /[\W_]/.test(pwd);
      updateReqItem("req-special", isSpecialValid);

      // 5. Match (Coincidir)
      const isMatchValid = pwd === confirmPwd && pwd.length > 0;
      updateReqItem("req-match", isMatchValid);

      // 6. PIN (Exatamente 8 dígitos)
      const isPinValid = pin.length === 8 && /^\d+$/.test(pin);
      updateReqItem("req-pin", isPinValid);
    };

    const updateReqItem = (id, isValid) => {
      const el = document.getElementById(id);
      if (!el) return;

      const icon = el.querySelector(".req-icon");
      if (isValid) {
        el.style.color = "var(--text-success)";
        if (icon) icon.textContent = "✔️";
      } else {
        el.style.color = "var(--text-muted)";
        if (icon) icon.textContent = "❌";
      }
    };

    if (pwdInput) pwdInput.addEventListener('input', updateChecklist);
    if (confirmInput) confirmInput.addEventListener('input', updateChecklist);
    if (pinInput) {
      pinInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        updateChecklist();
      });
    }

    const btnSubmitPassword = document.getElementById("btn-create-wallet-submit");
    if (btnSubmitPassword) {
      btnSubmitPassword.addEventListener('click', async () => {
        const pwd = document.getElementById("password-input").value;
        const confirmPwd = document.getElementById("password-confirm-input").value;
        const pin = document.getElementById("pin-input").value;

        const pwdErrors = [];
        if (!pwd || pwd.length <= 8) {
          pwdErrors.push(window.B2Translations[this.currentLanguage]?.pwdLengthError || "A senha deve ter mais de 8 caracteres.");
        }
        if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd)) {
          pwdErrors.push(window.B2Translations[this.currentLanguage]?.pwdCaseError || "A senha deve conter letras maiúsculas e minúsculas.");
        }
        if (!/[0-9]/.test(pwd)) {
          pwdErrors.push(window.B2Translations[this.currentLanguage]?.pwdNumberError || "A senha deve conter pelo menos um número.");
        }
        if (!/[\W_]/.test(pwd)) {
          pwdErrors.push(window.B2Translations[this.currentLanguage]?.pwdSpecialError || "A senha deve conter pelo menos um caractere especial.");
        }

        if (pwdErrors.length > 0) {
          await window.B2Toast.alert("Erro na Senha", pwdErrors.join("<br>"), "error");
          return;
        }

        if (pwd !== confirmPwd) {
          await window.B2Toast.alert("Senhas Diferentes", window.B2Translations[this.currentLanguage]?.pwdMismatch || "Senhas não coincidem!", "error");
          return;
        }
        if (!pin || pin.length !== 8 || !/^\d+$/.test(pin)) {
          await window.B2Toast.alert("PIN Inválido", window.B2Translations[this.currentLanguage]?.pinLength || "PIN deve conter exatamente 8 dígitos.", "error");
          return;
        }

        if (this.isImportFlow) {
          // No fluxo de importação, cria a carteira diretamente!
          await this.completeWalletCreation(pwd, pin);
        } else {
          // No fluxo de criação, gera a semente e exibe inline
          this.generatedMnemonicStr = window.B2KeyDerivationEngine.generateMnemonic();

          // Criptografa imediatamente em segundo plano para permitir a exportação segura do JSON de backup
          this.encryptionPromise = window.B2PlatformSecurity.encryptData(this.generatedMnemonicStr, pwd);
          this.encryptionPromise.then((encrypted) => {
            this.encryptedWalletPayload = encrypted;
            this.userPinHash = pin;
          }).catch((e) => {
            console.error('[btnSubmitPassword] Falha ao pré-criptografar a semente:', e);
          });

          const display = document.getElementById("seed-phrase-display");
          if (display) {
            display.innerHTML = "";
            this.generatedMnemonicStr.split(" ").forEach((word, index) => {
              const card = document.createElement("div");
              card.className = "seed-word-card";
              card.innerText = `${index + 1}. ${word}`;
              display.appendChild(card);
            });
          }
          const outcome = document.getElementById("seed-generation-outcome");
          if (outcome) outcome.style.display = "flex";
        }
      });
    }

    const btnCopySeed = document.getElementById("btn-copy-seed-inline");
    if (btnCopySeed) {
      btnCopySeed.addEventListener('click', () => {
        if (this.generatedMnemonicStr) {
          navigator.clipboard.writeText(this.generatedMnemonicStr);
          window.showToast(window.B2Translations[this.currentLanguage]?.seedCopied || "Semente copiada com sucesso!", "success");
        }
      });
    }

    const btnExportSeedJson = document.getElementById("btn-export-seed-json");
    if (btnExportSeedJson) {
      btnExportSeedJson.addEventListener('click', () => {
        this.exportConfigSecure();
      });
    }

    const btnCreatePasswordProceed = document.getElementById("btn-create-password-proceed");
    if (btnCreatePasswordProceed) {
      btnCreatePasswordProceed.addEventListener('click', () => {
        // Gera 4 índices aleatórios para confirmação ativa
        this.confirmIndices = this.getRandomIndices(4, 12);

        const container = document.getElementById("confirm-seed-inputs-container");
        if (container) {
          container.innerHTML = "";
          this.confirmIndices.forEach((idx) => {
            const formGroup = document.createElement("div");
            formGroup.className = "form-group";
            formGroup.style.textAlign = "left";
            formGroup.style.flexShrink = "0";

            const label = document.createElement("label");
            label.className = "form-label";
            label.innerText = `Palavra #${idx + 1}`;

            const input = document.createElement("input");
            input.type = "text";
            input.className = "form-input confirm-word-input";
            input.placeholder = `Digite a palavra #${idx + 1}...`;
            input.dataset.index = idx;
            input.style.flexShrink = "0";

            const errorMsgSpan = document.createElement("span");
            errorMsgSpan.className = "input-error-msg";
            errorMsgSpan.style.display = "none";

            // Remove o estado de erro dinamicamente ao digitar
            input.addEventListener('input', () => {
              input.classList.remove('is-invalid');
              errorMsgSpan.style.display = "none";
            });

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            formGroup.appendChild(errorMsgSpan);
            container.appendChild(formGroup);
          });
        }

        // Reseta os checkboxes e o botão de confirmação
        const checkboxLoss = document.getElementById("confirm-seed-risk-loss");
        const checkboxOpensource = document.getElementById("confirm-seed-risk-opensource");
        if (checkboxLoss) checkboxLoss.checked = false;
        if (checkboxOpensource) checkboxOpensource.checked = false;

        const confirmSubmitBtn = document.getElementById("btn-confirm-seed-submit");
        if (confirmSubmitBtn) confirmSubmitBtn.disabled = true;

        window.B2UIRenderer.navigateTo("view-confirm-seed");
      });
    }

    // ----------------------------------------------------------------
    // E. CONFIRMAÇÃO ATIVA DE SEMENTE (Palavras e Checkboxes)
    // ----------------------------------------------------------------
    const confirmView = document.getElementById("view-confirm-seed");
    if (confirmView) {
      const updateState = () => {
        const lossChecked = document.getElementById("confirm-seed-risk-loss")?.checked || false;
        const opensourceChecked = document.getElementById("confirm-seed-risk-opensource")?.checked || false;
        const inputs = confirmView.querySelectorAll(".confirm-word-input");
        let allFilled = true;
        inputs.forEach(inp => {
          if (!inp.value.trim()) allFilled = false;
        });

        const submitBtn = document.getElementById("btn-confirm-seed-submit");
        if (submitBtn) {
          submitBtn.disabled = !(lossChecked && opensourceChecked && allFilled);
        }
      };

      confirmView.addEventListener('input', updateState);
      confirmView.addEventListener('change', updateState);
    }

    const btnConfirmSeedSubmit = document.getElementById("btn-confirm-seed-submit");
    if (btnConfirmSeedSubmit) {
      btnConfirmSeedSubmit.addEventListener('click', async () => {
        const inputs = document.querySelectorAll(".confirm-word-input");
        const words = this.generatedMnemonicStr.split(" ");
        let allCorrect = true;

        const inlineErrors = {
          pt: "Palavra incorreta!",
          en: "Incorrect word!",
          es: "¡Palabra incorrecta!",
          fr: "Mot incorrect!",
          zh: "单词不正确！",
          ja: "単語が間違っています！",
          ko: "잘못된 단어입니다!",
          de: "Falsches Wort!",
          it: "Parola errata!",
          ru: "Неверное слово!"
        };
        const errorText = inlineErrors[this.currentLanguage] || inlineErrors['en'];

        inputs.forEach(inp => {
          const idx = parseInt(inp.dataset.index);
          const val = inp.value.trim().toLowerCase();
          const expected = words[idx].toLowerCase();

          const formGroup = inp.closest('.form-group');
          const errorSpan = formGroup ? formGroup.querySelector('.input-error-msg') : null;

          if (val !== expected) {
            allCorrect = false;
            inp.classList.add('is-invalid');
            if (errorSpan) {
              errorSpan.innerText = errorText;
              errorSpan.style.display = "block";
            }
          } else {
            inp.classList.remove('is-invalid');
            if (errorSpan) {
              errorSpan.style.display = "none";
            }
          }
        });

        if (allCorrect) {
          const pwd = document.getElementById("password-input").value;
          const pin = document.getElementById("pin-input").value;
          await this.completeWalletCreation(pwd, pin);
        } else {
          await window.B2Toast.alert("Semente Incorreta", "Palavras incorretas! Por favor, revise as palavras inseridas.", "error");
        }
      });
    }

    // ----------------------------------------------------------------
    // F. DIRETÓRIO DE ENDEREÇOS PÚBLICOS
    // ----------------------------------------------------------------
    const btnAddressesProceed = document.getElementById("btn-addresses-list-proceed");
    if (btnAddressesProceed) {
      btnAddressesProceed.addEventListener('click', () => {
        const isFullTab = document.documentElement.classList.contains('is-fulltab');
        if (isFullTab) {
          window.close();
        } else {
          window.B2UIRenderer.navigateTo("view-dashboard");
          this.setActiveChain(this.activeChainKey);
        }
      });
    }

    // ----------------------------------------------------------------
    // G. TELA DE DESBLOQUEIO
    // ----------------------------------------------------------------
    const btnUnlockSubmit = document.getElementById("unlock-submit-btn");
    const inputUnlockPassword = document.getElementById("unlock-password-input");
    if (btnUnlockSubmit) {
      btnUnlockSubmit.addEventListener('click', async () => {
        const pwd = document.getElementById("unlock-password-input").value;
        try {
          await this.unlockWallet(pwd);
          document.getElementById("unlock-password-input").value = "";
        } catch (e) {
          window.B2Toast.alert("Erro de Autenticação", e.message, "error");
        }
      });
    }
    if (inputUnlockPassword && btnUnlockSubmit) {
      inputUnlockPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btnUnlockSubmit.click();
        }
      });
    }

    // ----------------------------------------------------------------
    // H. MODAIS — RECEIVE, SEND, ADD NETWORK, ADD TOKEN, LEASING, ACCOUNT
    // ----------------------------------------------------------------

    // Modal Receive
    const btnCloseReceive = document.getElementById('btn-close-receive');
    if (btnCloseReceive) btnCloseReceive.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-receive'));

    // Event listeners para as abas de Receber do Zcash (ZEC)
    const receiveZcashTabs = document.querySelectorAll('.zcash-receive-tab');
    receiveZcashTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'tAddress' | 'saplingAddress' | 'unifiedAddress'
        const keys = this.derivedKeys['ZEC'];
        if (!keys) return;

        // 1. Atualizar estilo visual das abas
        receiveZcashTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        // 2. Atualizar o endereço exibido
        const address = keys[type] || keys.address;
        const addressDisplay = document.getElementById('receive-address-display');
        if (addressDisplay) addressDisplay.textContent = address;

        // 3. Regenerar o QR Code com o endereço selecionado
        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          try {
            new QRCode(qrContainer, {
              text: address,
              width: 200,
              height: 200,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          } catch (e) {
            qrContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:200px;height:200px;background:#fff;color:#000;font-size:10px;text-align:center;padding:8px;word-break:break-all;">${address}</div>`;
          }
        }
      });
    });

    // Event listeners para as abas de Receber do Dash (DASH)
    const receiveDashTabs = document.querySelectorAll('.dash-receive-tab');
    receiveDashTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'p2pkh' | 'p2sh'
        const keys = this.derivedKeys['DASH'];
        if (!keys) return;

        // 1. Atualizar estilo visual das abas
        receiveDashTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        // 2. Atualizar o endereço exibido
        const address = type === 'p2sh' ? (keys.p2shAddress || keys.address) : (keys.p2pkhAddress || keys.address);
        const addressDisplay = document.getElementById('receive-address-display');
        if (addressDisplay) addressDisplay.textContent = address;

        // 3. Regenerar o QR Code com o endereço selecionado
        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          try {
            new QRCode(qrContainer, {
              text: address,
              width: 200,
              height: 200,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          } catch (e) {
            qrContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:200px;height:200px;background:#fff;color:#000;font-size:10px;text-align:center;padding:8px;word-break:break-all;">${address}</div>`;
          }
        }
      });
    });

    // Event listeners para as abas de Receber do Bitcoin (BTC)
    const receiveBtcTabs = document.querySelectorAll('.btc-receive-tab');
    receiveBtcTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'native' | 'nested' | 'legacy' | 'taproot'
        const keys = this.derivedKeys['BTC'];
        if (!keys) return;

        receiveBtcTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        let addressKey = 'nativeAddress';
        if (type === 'nested') addressKey = 'nestedAddress';
        else if (type === 'legacy') addressKey = 'legacyAddress';
        else if (type === 'taproot') addressKey = 'taprootAddress';

        const address = keys[addressKey] || keys.address;
        const addressDisplay = document.getElementById('receive-address-display');
        if (addressDisplay) addressDisplay.textContent = address;

        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          try {
            new QRCode(qrContainer, {
              text: address,
              width: 200,
              height: 200,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          } catch (e) {
            qrContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:200px;height:200px;background:#fff;color:#000;font-size:10px;text-align:center;padding:8px;word-break:break-all;">${address}</div>`;
          }
        }
      });
    });

    // Event listeners para as abas de Receber do Litecoin (LTC)
    const receiveLtcTabs = document.querySelectorAll('.ltc-receive-tab');
    receiveLtcTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'legacy' | 'nested' | 'native'
        const keys = this.derivedKeys['LTC'];
        if (!keys) return;

        receiveLtcTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        let addressKey = 'legacyAddress';
        if (type === 'nested') addressKey = 'nestedAddress';
        else if (type === 'native') addressKey = 'nativeAddress';

        const address = keys[addressKey] || keys.address;
        const addressDisplay = document.getElementById('receive-address-display');
        if (addressDisplay) addressDisplay.textContent = address;

        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          try {
            new QRCode(qrContainer, {
              text: address,
              width: 200,
              height: 200,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          } catch (e) {
            qrContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:200px;height:200px;background:#fff;color:#000;font-size:10px;text-align:center;padding:8px;word-break:break-all;">${address}</div>`;
          }
        }
      });
    });

    // Event listeners para as abas de Receber do Dogecoin (DOGE)
    const receiveDogeTabs = document.querySelectorAll('.doge-receive-tab');
    receiveDogeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'legacy' | 'nested'
        const keys = this.derivedKeys['DOGE'];
        if (!keys) return;

        receiveDogeTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        let addressKey = 'legacyAddress';
        if (type === 'nested') addressKey = 'nestedAddress';

        const address = keys[addressKey] || keys.address;
        const addressDisplay = document.getElementById('receive-address-display');
        if (addressDisplay) addressDisplay.textContent = address;

        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          try {
            new QRCode(qrContainer, {
              text: address,
              width: 200,
              height: 200,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          } catch (e) {
            qrContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:200px;height:200px;background:#fff;color:#000;font-size:10px;text-align:center;padding:8px;word-break:break-all;">${address}</div>`;
          }
        }
      });
    });

    // Event listeners para as abas de Receber do Bitcoin Cash (BCH)
    const receiveBchTabs = document.querySelectorAll('.bch-receive-tab');
    receiveBchTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'cashaddr' | 'legacy'
        const keys = this.derivedKeys['BCH'];
        if (!keys) return;

        receiveBchTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        let addressKey = 'cashAddress';
        if (type === 'legacy') addressKey = 'legacyAddress';

        const address = keys[addressKey] || keys.address;
        const addressDisplay = document.getElementById('receive-address-display');
        if (addressDisplay) addressDisplay.textContent = address;

        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          try {
            new QRCode(qrContainer, {
              text: address,
              width: 200,
              height: 200,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          } catch (e) {
            qrContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:200px;height:200px;background:#fff;color:#000;font-size:10px;text-align:center;padding:8px;word-break:break-all;">${address}</div>`;
          }
        }
      });
    });

    const btnCopyReceiveAddress = document.getElementById('receive-copy-btn');
    if (btnCopyReceiveAddress) {
      btnCopyReceiveAddress.addEventListener('click', () => {
        const addrEl = document.getElementById('receive-address-display');
        const addr = addrEl ? addrEl.textContent : '';
        if (addr && addr !== '—') {
          navigator.clipboard.writeText(addr).then(() => {
            window.showToast('Endereço copiado!', 'success');
          }).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = addr; document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta);
            window.showToast('Endereço copiado!', 'success');
          });
        }
      });
    }

    const btnShareReceive = document.getElementById('receive-share-btn');
    if (btnShareReceive) {
      btnShareReceive.addEventListener('click', () => {
        const addrEl = document.getElementById('receive-address-display');
        const addr = addrEl ? addrEl.textContent : '';
        if (navigator.share && addr) {
          navigator.share({ title: 'Meu Endereço B2 Wallet', text: addr });
        } else {
          navigator.clipboard.writeText(addr);
          window.showToast('Endereço copiado para compartilhamento!', 'info');
        }
      });
    }

    // Badge de endereço no header — clique para copiar
    const addrBadge = document.getElementById('active-chain-address-badge');
    if (addrBadge) {
      addrBadge.addEventListener('click', () => {
        const keys = this.derivedKeys[this.activeChainKey];
        if (keys && keys.address) {
          navigator.clipboard.writeText(keys.address).then(() => {
            window.showToast('Endereço copiado!', 'success');
          }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = keys.address; document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta);
            window.showToast('Endereço copiado!', 'success');
          });
        }
      });
    }

    // Dashboard — botão Receber
    const btnDashReceive = document.getElementById('dashboard-btn-receive');
    if (btnDashReceive) {
      btnDashReceive.addEventListener('click', () => {
        if (!this.decryptedSeed) {
          window.showToast('Desbloqueie a carteira primeiro.', 'warning');
          return;
        }
        this.showReceiveModal(this.activeChainKey);
      });
    }

    // Dashboard — botão Enviar
    const btnDashSend = document.getElementById('dashboard-btn-send');
    if (btnDashSend) {
      btnDashSend.addEventListener('click', () => {
        if (!this.decryptedSeed) {
          window.showToast('Desbloqueie a carteira primeiro.', 'warning');
          return;
        }
        this.showSendModal(this.activeChainKey);
      });
    }

    // Dashboard — botão Recarregar/Atualizar
    const btnDashReload = document.getElementById('dashboard-btn-reload');
    if (btnDashReload) {
      btnDashReload.addEventListener('click', () => {
        if (this.activeChainKey) {
          const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
          if (chain && chain.isLoadingBalance) {
            return; // Já está atualizando
          }
          window.showToast('Atualizando dados da rede...', 'info');
          // Força a atualização (específica para essa chain)
          this.updateNetworkBalances(this.activeChainKey);
        }
      });
    }

    // Dashboard — botão Leasing
    const btnDashLeasing = document.getElementById('dashboard-btn-leasing');
    if (btnDashLeasing) {
      btnDashLeasing.addEventListener('click', () => {
        if (!this.decryptedSeed) {
          window.showToast('Desbloqueie a carteira primeiro.', 'warning');
          return;
        }
        this.showLeasingView(this.activeChainKey);
      });
    }

    // Dashboard — botão Faucet
    const btnDashFaucet = document.getElementById('dashboard-btn-faucet');
    if (btnDashFaucet) {
      btnDashFaucet.addEventListener('click', () => {
        const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
        if (chain && chain.faucet) {
          window.open(chain.faucet, '_blank', 'noopener,noreferrer');
        } else {
          window.showToast('Nenhum faucet disponível para esta rede.', 'warning');
        }
      });
    }

    // Leasing view — botão voltar
    const btnBackLeasing = document.getElementById('btn-back-from-leasing');
    if (btnBackLeasing) {
      btnBackLeasing.addEventListener('click', () => {
        window.B2UIRenderer.navigateTo('view-dashboard');
      });
    }

    // Leasing view — botão iniciar arrendamento
    const btnStartLease = document.getElementById('btn-start-lease');
    if (btnStartLease) {
      btnStartLease.addEventListener('click', () => {
        const chainKey = this._leasingChainKey || this.activeChainKey;
        const chain = this.blockchainData.find(c => c.key === chainKey);
        // Pega o nó selecionado na view
        const selectedNodeCard = document.querySelector('#leasing-nodes-list .leasing-node-card.selected');
        const nodeAddr = selectedNodeCard ? selectedNodeCard.getAttribute('data-node-addr') : '3P8B2BrasilValidatorNodeLease7H9o';
        const nodeName = selectedNodeCard ? selectedNodeCard.getAttribute('data-node-name') : 'WavesBrasil Node';
        const amountInput = document.getElementById('leasing-amount-input');
        const amount = parseFloat(amountInput ? amountInput.value : 0);

        if (!amount || amount <= 0) {
          window.showToast('Digite um valor válido.', 'warning');
          return;
        }
        if (!this.decryptedSeed) {
          window.showToast('Desbloqueie a carteira primeiro.', 'warning');
          return;
        }

        // startLPoSLease agora faz o broadcast real e exibe os toasts de resultado
        this.startLPoSLease(chainKey, nodeAddr, nodeName, amount);
        if (amountInput) amountInput.value = '';
        const chain2 = this.blockchainData.find(c => c.key === chainKey);
        if (chain2) this._renderActiveLeasesInView(chainKey, chain2);
      });
    }

    // Modal Send — fechar
    const btnCloseSend = document.getElementById('btn-close-send');
    if (btnCloseSend) btnCloseSend.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-send'));

    // Modal Send — validação em tempo real
    const sendToAddr = document.getElementById('send-to-address');
    const sendAmountInput = document.getElementById('send-amount');
    const sendConfirmBtn = document.getElementById('btn-send-confirm');
    const sendPinInput = document.getElementById('send-pin-input');
    const sendAddressValidation = document.getElementById('send-address-validation');

    // Garante que send-pin-input aceite somente dígitos (igual ao pin-input principal)
    if (sendPinInput) {
      sendPinInput.addEventListener('input', (e) => {
        const pos = e.target.selectionStart;
        const clean = e.target.value.replace(/\D/g, '');
        if (e.target.value !== clean) {
          e.target.value = clean;
          // Restaura posição do cursor após remoção de caractere não-numérico
          try { e.target.setSelectionRange(pos - 1, pos - 1); } catch (_) { }
        }
      });
    }

    const validateSendForm = () => {
      const addr = sendToAddr ? sendToAddr.value.trim() : '';
      const amt = parseFloat(sendAmountInput ? sendAmountInput.value : 0);
      const pin = sendPinInput ? sendPinInput.value : '';

      let isAddressValid = true;
      let validationMsg = '';

      if (this._sendContext && addr.length > 0) {
        const { chain } = this._sendContext;
        if (chain.key === 'DASH') {
          const dashType = this._sendContext.dashType || 'p2pkh';
          if (dashType === 'p2pkh') {
            if (addr.startsWith('X')) {
              isAddressValid = window.B2KeyDerivationEngine.validateAddress(addr, 'DASH');
              if (!isAddressValid) validationMsg = 'Endereço P2PKH (X...) inválido.';
            } else {
              isAddressValid = false;
              validationMsg = 'Apenas endereços P2PKH (X...) são aceitos nesta rota.';
            }
          } else if (dashType === 'p2sh') {
            if (addr.startsWith('7')) {
              isAddressValid = window.B2KeyDerivationEngine.validateAddress(addr, 'DASH');
              if (!isAddressValid) validationMsg = 'Endereço P2SH (7...) inválido.';
            } else {
              isAddressValid = false;
              validationMsg = 'Apenas endereços P2SH (7...) são aceitos nesta rota.';
            }
          }
        } else if (chain.key === 'ZEC') {
          const zcashType = this._sendContext.zcashType || 'transparent';
          if (zcashType === 'transparent') {
            if (addr.startsWith('t1') || addr.startsWith('t3')) {
              isAddressValid = window.B2KeyDerivationEngine.validateAddress(addr, 'ZEC_TRANSPARENT');
              if (!isAddressValid) validationMsg = 'Endereço transparente inválido.';
            } else {
              isAddressValid = false;
              validationMsg = 'Apenas endereços Transparentes (t1...) são aceitos para rota Pública.';
            }
          } else if (zcashType === 'shielded') {
            if (addr.startsWith('zs1')) {
              isAddressValid = window.B2KeyDerivationEngine.validateAddress(addr, 'ZEC_SAPLING');
              if (!isAddressValid) validationMsg = 'Endereço Sapling (zs...) inválido.';
            } else {
              isAddressValid = false;
              validationMsg = 'Apenas endereços Sapling (zs1...) são aceitos para rota Privada.';
            }
          } else if (zcashType === 'unified') {
            isAddressValid = window.B2KeyDerivationEngine.validateAddress(addr, 'ZEC_TRANSPARENT') ||
              window.B2KeyDerivationEngine.validateAddress(addr, 'ZEC_SAPLING') ||
              window.B2KeyDerivationEngine.validateAddress(addr, 'ZEC_UNIFIED');
            if (!isAddressValid) validationMsg = 'Endereço Zcash inválido (t1..., zs1... ou u1...).';
          }
        } else {
          // Outras redes
          isAddressValid = window.B2KeyDerivationEngine.validateAddress(addr, chain.key, chain.engine);
          if (!isAddressValid) validationMsg = `Endereço inválido para a rede ${chain.name}.`;
        }
      }

      if (sendAddressValidation) {
        if (addr.length === 0) {
          sendAddressValidation.style.display = 'none';
          sendAddressValidation.textContent = '';
        } else if (validationMsg) {
          sendAddressValidation.textContent = validationMsg;
          sendAddressValidation.style.display = 'block';
          sendAddressValidation.style.color = 'var(--text-danger)';
        } else if (isAddressValid) {
          sendAddressValidation.textContent = '✓ Endereço de destino válido';
          sendAddressValidation.style.display = 'block';
          sendAddressValidation.style.color = 'var(--text-success)';

          // Dynamic TRON estimation & account activation check
          if (this._sendContext && this._sendContext.chain.key === 'TRON' && addr.startsWith('T') && addr.length === 34) {
            const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
            const chain = this._sendContext.chain;
            const keys = this._sendContext.keys;
            const selectedToken = this._sendContext.selectedToken;
            const tokenAddress = selectedToken ? (selectedToken.contractAddress || selectedToken.assetId || null) : null;
            const memoVal = memoInput ? memoInput.value.trim() : '';

            const gasLoading = document.getElementById('gas-fee-loading');
            const gasLimit = document.getElementById('gas-limit-display');
            const gasPrice = document.getElementById('gas-price-display');
            const gasTotal = document.getElementById('gas-total-display');

            const checkKey = `${addr}_${amt}_${tokenAddress}_${memoVal}`;
            if (this._lastTronEstimateKey !== checkKey) {
              this._lastTronEstimateKey = checkKey;
              if (gasLoading) gasLoading.textContent = 'Calculando custos dinâmicos TRON…';

              tronEngine.estimateTransactionCost(
                keys.address,
                addr,
                amt,
                tokenAddress,
                memoVal || null,
                chain.nodeUrl,
                ["https://tron-rpc.publicnode.com", "https://tron.api.subquery.network"]
              ).then(cost => {
                if (this._lastTronEstimateKey !== checkKey) return;

                if (gasLoading) gasLoading.textContent = '';
                if (gasLimit) {
                  if (cost.energy > 0) {
                    gasLimit.textContent = `${cost.bandwidth} BP / ${cost.energy} EP`;
                  } else {
                    gasLimit.textContent = `${cost.bandwidth} BP`;
                  }
                }
                if (gasPrice) {
                  gasPrice.textContent = 'Dinâmico';
                }
                if (gasTotal) {
                  gasTotal.textContent = `≈ ${cost.totalFeeTRX.toFixed(3)} TRX`;
                }

                if (cost.isRecipientUnactivated) {
                  sendAddressValidation.innerHTML = `⚠️ <strong>Aviso:</strong> Conta de destino não ativada.<br/>A rede TRON cobrará uma taxa de ativação de conta (queima de até 1.1 TRX) na primeira transferência.`;
                  sendAddressValidation.style.color = 'var(--text-warning)';
                  sendAddressValidation.style.display = 'block';
                } else {
                  sendAddressValidation.textContent = '✓ Endereço de destino ativo';
                  sendAddressValidation.style.color = 'var(--text-success)';
                  sendAddressValidation.style.display = 'block';
                }
              }).catch(err => {
                if (this._lastTronEstimateKey !== checkKey) return;
                if (gasLoading) gasLoading.textContent = '';
              });
            }
          }
        }
      }

      let userBalance = 0;
      let hasSufficientBalance = true;
      let balanceValidationMsg = '';

      if (this._sendContext) {
        const { chain, keys, selectedToken, selectedFeeAsset } = this._sendContext;
        const feeData = this._estimateFeeForChain(chain);
        const fee = feeData.feeCrypto || 0;

        if (chain.engine === 'Waves') {
          const nativeBalance = chain.balanceCrypto;
          if (selectedToken) {
            if (selectedFeeAsset && selectedFeeAsset.assetId === selectedToken.assetId) {
              const totalNeeded = amt + fee;
              if (selectedToken.balanceCrypto < totalNeeded) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo insuficiente para cobrir o valor e a taxa de patrocínio. Necessário: ${totalNeeded.toFixed(6)} ${selectedToken.symbol}.`;
              }
            } else if (selectedFeeAsset) {
              if (selectedToken.balanceCrypto < amt) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo do token insuficiente. Disponível: ${selectedToken.balanceCrypto.toFixed(6)} ${selectedToken.symbol}.`;
              } else if (selectedFeeAsset.balanceCrypto < fee) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo do token de taxa (${selectedFeeAsset.symbol}) insuficiente para pagar a taxa de ${fee.toFixed(6)}.`;
              }
            } else {
              if (selectedToken.balanceCrypto < amt) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo do token insuficiente. Disponível: ${selectedToken.balanceCrypto.toFixed(6)} ${selectedToken.symbol}.`;
              } else if (nativeBalance < fee) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo de moeda nativa insuficiente para pagar a taxa de ${fee.toFixed(6)} ${chain.symbol}.`;
              }
            }
          } else {
            if (selectedFeeAsset) {
              if (nativeBalance < amt) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo de moeda nativa insuficiente. Disponível: ${nativeBalance.toFixed(6)} ${chain.symbol}.`;
              } else if (selectedFeeAsset.balanceCrypto < fee) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo do token de taxa (${selectedFeeAsset.symbol}) insuficiente para pagar a taxa de ${fee.toFixed(6)}.`;
              }
            } else {
              const totalNeeded = amt + fee;
              if (nativeBalance < totalNeeded) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo insuficiente para cobrir o valor e a taxa de rede. Necessário: ${totalNeeded.toFixed(6)} ${chain.symbol}.`;
              }
            }
          }
        } else {
          userBalance = selectedToken ? selectedToken.balanceCrypto : chain.balanceCrypto;
          if (!selectedToken && ['BTC', 'LTC', 'DOGE', 'BCH'].includes(chain.key)) {
            const activeType = this._sendContext.activeUtxoType;
            if (activeType && keys && keys.balances && keys.balances[activeType] !== undefined) {
              userBalance = keys.balances[activeType];
            }
          }

          if (selectedToken) {
            if (selectedToken.balanceCrypto < amt) {
              hasSufficientBalance = false;
              balanceValidationMsg = `Atenção: Saldo insuficiente. Disponível: ${selectedToken.balanceCrypto.toFixed(6)} ${selectedToken.symbol}`;
            }
          } else {
            const totalNeeded = amt + fee;
            if (userBalance < totalNeeded) {
              hasSufficientBalance = false;
              balanceValidationMsg = `Atenção: Saldo insuficiente para cobrir o valor e as taxas. Disponível: ${userBalance.toFixed(6)} ${chain.symbol}`;
            }
          }
        }
      }

      const sendAmountValidation = document.getElementById('send-amount-validation');
      if (sendAmountValidation) {
        if (amt > 0 && !hasSufficientBalance) {
          sendAmountValidation.textContent = balanceValidationMsg;
          sendAmountValidation.style.display = 'block';
        } else {
          sendAmountValidation.style.display = 'none';
          sendAmountValidation.textContent = '';
        }
      }

      if (sendConfirmBtn) {
        sendConfirmBtn.disabled = !(addr.length > 5 && isAddressValid && amt > 0 && pin.length === 8 && hasSufficientBalance);
      }

      // Atualiza fiat
      if (this._sendContext && amt > 0) {
        this._updateSendAmountFiat(this._sendContext.chain, amt);
      }
    };

    this.validateSendForm = validateSendForm;

    if (sendToAddr) sendToAddr.addEventListener('input', validateSendForm);
    if (sendAmountInput) sendAmountInput.addEventListener('input', validateSendForm);
    if (sendPinInput) {
      sendPinInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        validateSendForm();
      });
    }

    // Event listeners para as abas de Enviar do Zcash (ZEC)
    const sendZcashTabs = document.querySelectorAll('.zcash-send-tab');
    sendZcashTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'transparent' | 'shielded' | 'unified'
        if (this._sendContext) {
          this._sendContext.zcashType = type;
        }

        // 1. Atualizar estilo visual das abas
        sendZcashTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        // 2. Re-validar o formulário de envio
        validateSendForm();
      });
    });

    // Event listeners para as abas de Enviar do Dash (DASH)
    const sendDashTabs = document.querySelectorAll('.dash-send-tab');
    sendDashTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'p2pkh' | 'p2sh'
        if (this._sendContext) {
          this._sendContext.dashType = type;
        }

        // 1. Atualizar estilo visual das abas
        sendDashTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        // 2. Re-validar o formulário de envio
        validateSendForm();
      });
    });

    if (sendConfirmBtn) {
      sendConfirmBtn.addEventListener('click', async () => {
        if (!this._sendContext) return;
        const { chain, keys, selectedToken, selectedFeeAsset } = this._sendContext;
        const toAddr = sendToAddr ? sendToAddr.value.trim() : '';
        const amt = parseFloat(sendAmountInput ? sendAmountInput.value : 0);
        const pin = sendPinInput ? sendPinInput.value : '';
        const storedPin = localStorage.getItem('b2_pin');

        if (pin !== storedPin) {
          await window.B2Toast.alert(
            "PIN Incorreto",
            "O PIN de acesso rápido inserido está inválido. Por favor, tente novamente.",
            "error"
          );
          return;
        }

        const feeData = this._estimateFeeForChain(chain);
        const fee = feeData.feeCrypto || 0;

        let hasSufficientBalance = true;
        if (chain.engine === 'Waves') {
          const nativeBalance = chain.balanceCrypto;
          if (selectedToken) {
            if (selectedFeeAsset && selectedFeeAsset.assetId === selectedToken.assetId) {
              if (selectedToken.balanceCrypto < amt + fee) hasSufficientBalance = false;
            } else if (selectedFeeAsset) {
              if (selectedToken.balanceCrypto < amt || selectedFeeAsset.balanceCrypto < fee) hasSufficientBalance = false;
            } else {
              if (selectedToken.balanceCrypto < amt || nativeBalance < fee) hasSufficientBalance = false;
            }
          } else {
            if (selectedFeeAsset) {
              if (nativeBalance < amt || selectedFeeAsset.balanceCrypto < fee) hasSufficientBalance = false;
            } else {
              if (nativeBalance < amt + fee) hasSufficientBalance = false;
            }
          }
        } else {
          if (selectedToken) {
            if (selectedToken.balanceCrypto < amt) hasSufficientBalance = false;
          } else {
            if (chain.balanceCrypto < amt + fee) hasSufficientBalance = false;
          }
        }

        if (!hasSufficientBalance) {
          window.showToast('Saldo insuficiente para realizar a transação e pagar as taxas.', 'error');
          return;
        }

        // Obtém o campo de Memo/Tag de Destino
        const memoInput = document.getElementById('send-memo-input');
        const memoVal = memoInput ? memoInput.value.trim() : '';

        // Salva saldos originais para reversão limpa se falhar
        const originalNativeBalance = chain.balanceCrypto;
        const originalTokenBalance = selectedToken ? selectedToken.balanceCrypto : 0;
        const originalFeeAssetBalance = selectedFeeAsset ? selectedFeeAsset.balanceCrypto : 0;

        // Dedução de saldo (otimista)
        if (chain.engine === 'Waves') {
          if (selectedToken) {
            selectedToken.balanceCrypto = Math.max(0, selectedToken.balanceCrypto - amt);
          } else {
            chain.balanceCrypto = Math.max(0, chain.balanceCrypto - amt);
          }

          if (selectedFeeAsset) {
            selectedFeeAsset.balanceCrypto = Math.max(0, selectedFeeAsset.balanceCrypto - fee);
          } else {
            chain.balanceCrypto = Math.max(0, chain.balanceCrypto - fee);
          }
        } else {
          if (selectedToken) {
            selectedToken.balanceCrypto = Math.max(0, selectedToken.balanceCrypto - amt);
            chain.balanceCrypto = Math.max(0, chain.balanceCrypto - fee);
          } else {
            chain.balanceCrypto = Math.max(0, chain.balanceCrypto - amt - fee);
          }
        }

        const price = chain.balanceFiat > 0 && (chain.balanceCrypto + amt) > 0
          ? chain.balanceFiat / (chain.balanceCrypto + amt) : 0;
        chain.balanceFiat = chain.balanceCrypto * price;

        const ownAddress = keys ? (keys.address || keys.p2pkhAddress || keys.pubKey || '') : '';

        // ── BROADCAST REAL PARA REDE DASH CORE ──
        if (chain.key === 'DASH' && chain.nodeUrl && this.decryptedSeed && (window.B2DashBroadcaster || globalThis.B2DashBroadcaster)) {
          window.showToast(`Preparando e assinando transação Dash Core…`, 'info');
          let txId = "";
          let txHex = "";
          try {
            const dashBroadcaster = window.B2DashBroadcaster || globalThis.B2DashBroadcaster;
            const changeAddress = keys.p2pkhAddress || keys.address;
            const txData = await dashBroadcaster.signDashTransfer(
              this.decryptedSeed,
              chain.nodeUrl,
              toAddr,
              amt,
              changeAddress,
              this.activeAccountIndex
            );
            txId = txData.txid;
            txHex = txData.hex;

            // Salva no histórico com ID real
            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${chain.symbol} para a blockchain Dash Core…`, 'info');
            const result = await dashBroadcaster.broadcastTransaction(chain.nodeUrl, txHex);
            const broadcastTxId = result.txid || txId;
            window.B2Logger.log('success', `[Dash Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação Dash: ${err.message}`, 'error');
            window.B2Logger.log('error', `[Dash Broadcast] Erro: ${err.message}`);

            // Reverte saldo se falhou
            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDES WAVES ──
        else if (chain.engine === 'Waves' && chain.nodeUrl && this.decryptedSeed) {
          window.showToast(`Preparando e assinando transação Waves…`, 'info');
          let txId = "";
          let txPayload = null;
          try {
            const assetId = selectedToken ? (selectedToken.assetId || selectedToken.id || null) : null;
            const feeAssetId = selectedFeeAsset ? (selectedFeeAsset.assetId || null) : null;
            const feeAmount = selectedFeeAsset ? (selectedFeeAsset.minSponsoredAssetFee || null) : null;

            txPayload = window.B2WavesBroadcaster.signWavesTransfer(
              this.decryptedSeed,
              toAddr,
              amt,
              assetId,
              memoVal || null,
              feeAssetId,
              feeAmount,
              this.activeAccountIndex
            );
            txId = txPayload.id;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} para a blockchain…`, 'info');
            const result = await window.B2WavesBroadcaster.broadcastTransaction(chain.nodeUrl, txPayload);
            const broadcastTxId = result.id || result.txId || txId;
            window.B2Logger.log('success', `[Waves Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação Waves: ${err.message}`, 'error');
            window.B2Logger.log('error', `[Waves Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDES EVM ──
        else if (chain.engine === 'EVM' && chain.nodeUrl && this.decryptedSeed && window.B2EVMBroadcaster) {
          const selectedToken = this._sendContext.selectedToken;
          window.showToast(`Preparando e assinando transação EVM…`, 'info');
          let txId = "";
          let signedData = null;
          try {
            const tokenAddress = selectedToken ? (selectedToken.assetId || selectedToken.id || null) : null;
            const derivedKey = this.derivedKeys[chain.key];
            const privateKeyOrMnemonic = (derivedKey && derivedKey.privateKey) ? derivedKey.privateKey : this.decryptedSeed;

            signedData = await window.B2EVMBroadcaster.signEVMTransfer(
              privateKeyOrMnemonic,
              chain.nodeUrl,
              chain.chainId,
              toAddr,
              amt,
              tokenAddress
            );
            txId = signedData.txHash;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} para a blockchain EVM…`, 'info');
            const result = await window.B2EVMBroadcaster.broadcastEVMTransaction(chain.nodeUrl, signedData.signedTxHex);
            const broadcastTxId = result.hash || result.txId || txId;
            window.B2Logger.log('success', `[EVM Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Pendente', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} enviada!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
            this._pollEVMTransactionReceipt(chain, broadcastTxId, txId, amt, feeData, price);
          } catch (err) {
            window.showToast(`❌ Falha na transação EVM: ${err.message}`, 'error');
            window.B2Logger.log('error', `[EVM Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou (Erro EVM)');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou (Erro EVM)',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE SOLANA ──
        else if (chain.engine === 'Solana' && chain.nodeUrl && this.decryptedSeed && window.B2SolanaBroadcaster) {
          const selectedToken = this._sendContext.selectedToken;
          window.showToast(`Preparando e assinando transação Solana…`, 'info');
          let txId = "";
          let signedData = null;
          try {
            const tokenAddress = selectedToken ? (selectedToken.assetId || selectedToken.id || null) : null;
            signedData = await window.B2SolanaBroadcaster.signSolanaTransfer(
              this.decryptedSeed,
              chain.nodeUrl,
              toAddr,
              amt,
              tokenAddress,
              this.activeAccountIndex
            );
            txId = signedData.txSignature;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} para a blockchain Solana…`, 'info');
            const broadcastTxId = await window.B2SolanaBroadcaster.broadcastSolanaTransaction(chain.nodeUrl, signedData.rawTx);
            window.B2Logger.log('success', `[Solana Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação Solana: ${err.message}`, 'error');
            window.B2Logger.log('error', `[Solana Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE ZCASH ──
        else if (chain.key === 'ZEC' && chain.nodeUrl && this.decryptedSeed && (window.B2ZcashBroadcaster || globalThis.B2ZcashBroadcaster)) {
          window.showToast(`Preparando e assinando transação Zcash…`, 'info');
          let txId = "";
          let signedData = null;
          try {
            const zcBroadcaster = window.B2ZcashBroadcaster || globalThis.B2ZcashBroadcaster;
            signedData = await zcBroadcaster.signZcashTransfer(
              this.decryptedSeed,
              chain.nodeUrl,
              toAddr,
              amt,
              false,
              this.activeAccountIndex
            );
            txId = signedData.txid;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${chain.symbol} para a blockchain Zcash…`, 'info');
            const broadcastTxId = await zcBroadcaster.broadcastZcashTransaction(chain.nodeUrl, signedData.hex);
            if (broadcastTxId) {
              window.B2Logger.log('success', `[Zcash Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

              this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
              await window.B2Toast.alert(
                "Transação Enviada",
                `Transação de ${amt} ${chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
                "success"
              );
              await this.updateNetworkBalances();
            } else {
              throw new Error("Transmissão recusada ou retorno sem TX ID.");
            }
          } catch (err) {
            window.showToast(`❌ Falha na transação Zcash: ${err.message}`, 'error');
            window.B2Logger.log('error', `[Zcash Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA UTXO (BTC, LTC, DOGE, BCH) ──
        else if (['BTC', 'LTC', 'DOGE', 'BCH'].includes(chain.key) && chain.nodeUrl && this.decryptedSeed) {
          window.showToast(`Preparando e assinando transação ${chain.key}…`, 'info');
          let txId = "";
          let signedData = null;
          try {
            let engine = null;
            if (chain.key === 'BTC') engine = window.B2BitcoinEngine || globalThis.B2BitcoinEngine;
            else if (chain.key === 'LTC') engine = window.B2LitecoinEngine || globalThis.B2LitecoinEngine;
            else if (chain.key === 'DOGE') engine = window.B2DogecoinEngine || globalThis.B2DogecoinEngine;
            else if (chain.key === 'BCH') engine = window.B2BitcoinCashEngine || globalThis.B2BitcoinCashEngine;

            if (!engine) throw new Error(`Engine ${chain.key} não encontrada.`);

            const fromAddr = this._sendContext.activeUtxoAddress || keys.address;
            signedData = await engine.signTransfer(this.decryptedSeed, toAddr, amt, fromAddr, this.activeAccountIndex);
            txId = signedData.txid;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${chain.symbol} para a rede...`, 'info');
            const result = await engine.broadcastTransaction(signedData.hex);
            const broadcastTxId = result.txid || txId;
            window.B2Logger.log('success', `[${chain.key} Broadcast] TX confirmada: ${broadcastTxId}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert("Transação Enviada", `Sucesso! TX: ${broadcastTxId.substring(0, 12)}…`, "success");
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação ${chain.key}: ${err.message}`, 'error');
            window.B2Logger.log('error', `[${chain.key} Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE NEO N3 ──
        else if (chain.key === "NEO" && chain.nodeUrl && this.decryptedSeed && (window.B2NeoEngine || globalThis.B2NeoEngine)) {
          const selectedToken = this._sendContext?.selectedToken;
          const finalSymbol = selectedToken ? selectedToken.symbol : "NEO";
          window.showToast(`Preparando e assinando transação NEO N3…`, "info");
          let txId = "";
          let built = null;
          try {
            const neoEngine = window.B2NeoEngine || globalThis.B2NeoEngine;
            const tokenContractHash = selectedToken ? (selectedToken.assetId || selectedToken.id || "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5") : "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5";

            built = await neoEngine.buildTransferTransaction(
              this.decryptedSeed,
              this.activeAccountIndex,
              toAddr,
              amt.toString(),
              tokenContractHash,
              chain.nodeUrl
            );
            txId = built.txhash;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${finalSymbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${finalSymbol} para a blockchain NEO N3…`, "info");
            const result = await neoEngine.sendTransaction(built.signedTxHex, chain.nodeUrl, [
              "https://mainnet2.neo.coz.io:443",
              "https://rpc.n3.nspcc.ru:10331"
            ]);
            const broadcastTxId = result.txhash || txId;
            window.B2Logger.log("success", `[NEO Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${finalSymbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação NEO: ${err.message}`, "error");
            window.B2Logger.log("error", `[NEO Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${finalSymbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE INTERNET COMPUTER ──
        else if (chain.key === "ICP" && this.decryptedSeed && (window.B2IcpEngine || globalThis.B2IcpEngine)) {
          window.showToast(`Preparando e assinando transação Internet Computer…`, "info");
          let txId = "";
          let signedTx = null;
          try {
            const icpEngine = window.B2IcpEngine || globalThis.B2IcpEngine;
            const keys = icpEngine.deriveKeyPair(this.decryptedSeed, this.activeAccountIndex);
            const pubKeyHex = Array.from(keys.publicKey).map(b => b.toString(16).padStart(2, '0')).join('');

            const txPayload = await icpEngine.ICPProvider.buildTransferTransaction(
              keys.address,
              toAddr,
              amt,
              feeData.feeCrypto,
              pubKeyHex
            );

            const signatures = icpEngine.ICPProvider.signTransaction(
              txPayload.unsigned_transaction,
              txPayload.payloads,
              keys.privateKey,
              pubKeyHex
            );

            signedTx = await icpEngine.ICPProvider.combineTransaction(
              txPayload.unsigned_transaction,
              signatures
            );

            txId = await icpEngine.ICPProvider.getTransactionHash(signedTx);

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${chain.symbol} para a rede Internet Computer…`, "info");
            const broadcastTxId = await icpEngine.ICPProvider.broadcastTransaction(signedTx);
            window.B2Logger.log("success", `[ICP Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação ICP: ${err.message}`, "error");
            window.B2Logger.log("error", `[ICP Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE FILECOIN ──
        else if (chain.key === "FILECOIN" && chain.nodeUrl && this.decryptedSeed && (window.B2FilecoinEngine || globalThis.B2FilecoinEngine)) {
          window.showToast(`Preparando e assinando transação Filecoin…`, "info");
          let txId = "";
          let built = null;
          try {
            const filEngine = window.B2FilecoinEngine || globalThis.B2FilecoinEngine;
            const amountAtto = BigInt(Math.floor(amt * 1e18));

            built = await filEngine.buildTransferTransaction(
              this.decryptedSeed,
              this.activeAccountIndex,
              toAddr,
              amountAtto,
              chain.nodeUrl
            );
            txId = built.cid;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${chain.symbol} para a rede Filecoin…`, "info");
            const result = await filEngine.sendTransaction(built.signedMessage, chain.nodeUrl, [
              "https://rpc.ankr.com/filecoin"
            ]);
            const broadcastTxId = result.txhash || txId;
            window.B2Logger.log("success", `[Filecoin Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação Filecoin: ${err.message}`, "error");
            window.B2Logger.log("error", `[Filecoin Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE POLKADOT ──
        else if (chain.key === "POLKADOT" && this.decryptedSeed && (window.B2PolkadotEngine || globalThis.B2PolkadotEngine)) {
          const selectedToken = this._sendContext?.selectedToken;
          window.showToast(`Preparando e assinando transação Polkadot…`, "info");
          let txId = "";
          let signedData = null;
          try {
            const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;

            if (selectedToken && selectedToken.assetId) {
              signedData = await polkadotEngine.AssetHubProvider.signAssetTransfer(
                this.decryptedSeed,
                parseInt(selectedToken.assetId),
                toAddr,
                amt,
                this.activeAccountIndex
              );
              txId = signedData.hash;

              this.addTransaction(chain.key, {
                id: txId,
                txHash: txId,
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Pendente',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
              window.B2UIRenderer.renderBlockchainList(this.blockchainData);
              this.updateTotalBalanceDisplay();

              window.showToast(`Transmitindo ${amt} ${selectedToken.symbol} para a rede Polkadot…`, "info");
              const result = await polkadotEngine.AssetHubProvider.broadcastAssetTransfer(signedData.hex);
              const broadcastTxId = result.hash || txId;
              window.B2Logger.log("success", `[Polkadot Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

              this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            } else {
              const keys = this.derivedKeys[chain.key];
              const nonce = await polkadotEngine.PolkadotProvider.getNonce(keys.address);
              signedData = await polkadotEngine.PolkadotProvider.signTransaction(
                this.decryptedSeed,
                toAddr,
                amt,
                nonce,
                this.activeAccountIndex
              );
              txId = signedData.hash;

              this.addTransaction(chain.key, {
                id: txId,
                txHash: txId,
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Pendente',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
              window.B2UIRenderer.renderBlockchainList(this.blockchainData);
              this.updateTotalBalanceDisplay();

              window.showToast(`Transmitindo ${amt} ${chain.symbol} para a rede Polkadot…`, "info");
              const result = await polkadotEngine.PolkadotProvider.broadcastTransaction(signedData.hex);
              const broadcastTxId = result.hash || txId;
              window.B2Logger.log("success", `[Polkadot Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

              this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            }

            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} enviada com sucesso!\nTX: ${txId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação Polkadot: ${err.message}`, "error");
            window.B2Logger.log("error", `[Polkadot Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE TRON ──
        else if (chain.key === "TRON" && chain.nodeUrl && this.decryptedSeed && (window.B2TronEngine || globalThis.B2TronEngine)) {
          const selectedToken = this._sendContext?.selectedToken;
          let txId = "";
          let signedData = null;
          try {
            const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
            const tokenAddress = selectedToken ? (selectedToken.contractAddress || selectedToken.assetId || selectedToken.id || null) : null;
            const fallbacks = ["https://tron-rpc.publicnode.com", "https://tron.api.subquery.network"];

            // Verify account activation first with interactive warning
            window.showToast("Verificando ativação da conta de destino…", "info");
            const recipientState = await tronEngine.isAccountActivated(toAddr, chain.nodeUrl, fallbacks);
            if (recipientState.status === 'UNACTIVATED') {
              const userApproved = await window.B2Toast.confirm(
                "Conta de Destino Não Ativada",
                "O endereço de destino ainda não possui transações registradas na rede TRON (não ativada). " +
                "Para ativá-lo, será cobrada uma taxa de ativação de conta (queima de até 1.1 TRX). Deseja continuar?",
                "warning"
              );
              if (!userApproved) {
                // Restore optimistic balance change and mark tx failed
                chain.balanceCrypto = originalNativeBalance;
                if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
                if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
                chain.balanceFiat = chain.balanceCrypto * (price || 0);

                this.addTransaction(chain.key, {
                  type: 'Enviado',
                  amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                  addr: toAddr,
                  sender: ownAddress,
                  recipient: toAddr,
                  from: ownAddress,
                  to: toAddr,
                  color: 'var(--text-danger)',
                  status: 'Falhou',
                  memo: memoVal || null
                });
                window.B2UIRenderer.closeModal('modal-send');
                window.B2UIRenderer.renderBlockchainList(this.blockchainData);
                this.updateTotalBalanceDisplay();
                return;
              }
            }

            window.showToast(`Preparando e assinando transação Tron…`, "info");
            signedData = await tronEngine.signTransfer(
              this.decryptedSeed,
              chain.nodeUrl,
              toAddr,
              amt,
              tokenAddress,
              memoVal || null,
              fallbacks,
              this.activeAccountIndex
            );
            txId = signedData.txID || JSON.stringify(signedData).substring(0, 32);

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} para a blockchain Tron…`, "info");
            const result = await tronEngine.broadcastTransaction(signedData, chain.nodeUrl, fallbacks);
            const broadcastTxId = result.txId || txId;
            window.B2Logger.log("success", `[Tron Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação Tron: ${err.message}`, "error");
            window.B2Logger.log("error", `[Tron Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        } else {
          const selectedToken = this._sendContext?.selectedToken;
          this.addTransaction(chain.key, {
            type: 'Enviado',
            amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
            addr: toAddr,
            sender: ownAddress,
            recipient: toAddr,
            from: ownAddress,
            to: toAddr,
            color: 'var(--text-danger)',
            status: 'Confirmado',
            memo: memoVal || null
          });
          window.B2UIRenderer.closeModal('modal-send');
          window.B2UIRenderer.renderBlockchainList(this.blockchainData);
          this.updateTotalBalanceDisplay();

          await window.B2Toast.alert(
            "Transação Enviada",
            `Transação de ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} enviada com sucesso!${memoVal ? ' (Memo incluído)' : ''}`,
            "success"
          );
          await this.updateNetworkBalances();
        }
      });
    }

    // Modal Add Token
    const btnCloseAddToken = document.getElementById('btn-close-add-token');
    if (btnCloseAddToken) btnCloseAddToken.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-add-token'));

    // Modal Tx, NFT, Token Details, Stellar Claimables - fechar (compatibilidade com CSP)
    const btnCloseTxDetail = document.getElementById('btn-close-tx-detail');
    if (btnCloseTxDetail) btnCloseTxDetail.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-tx-detail'));

    const btnCloseNftDetail = document.getElementById('btn-close-nft-detail');
    if (btnCloseNftDetail) btnCloseNftDetail.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-nft-detail'));

    const btnCloseTokenDetail = document.getElementById('btn-close-token-detail');
    if (btnCloseTokenDetail) btnCloseTokenDetail.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-token-detail'));

    const btnCloseStellarClaimables = document.getElementById('btn-close-stellar-claimables');
    if (btnCloseStellarClaimables) btnCloseStellarClaimables.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-stellar-claimables'));

    const btnDashAddToken = document.getElementById('dashboard-btn-add-token');
    if (btnDashAddToken) {
      btnDashAddToken.addEventListener('click', () => {
        this.showAddTokenModal();
      });
    }

    const contractInputEl = document.getElementById('add-token-contract');
    if (contractInputEl) {
      const handleContractInput = async () => {
        const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
        if (!chain || (chain.engine !== 'EVM' && chain.engine !== 'Stellar')) return;

        const contract = contractInputEl.value.trim();
        if (chain.engine === 'EVM') {
          if (/^0x[0-9a-fA-F]{40}$/.test(contract)) {
            const nameInput = document.getElementById('add-token-name');
            const symbolInput = document.getElementById('add-token-symbol');
            const decimalsInput = document.getElementById('add-token-decimals');
            const submitBtn = document.getElementById('btn-add-token-submit');

            // Verificar primeiro no registro offline local para evitar requisições de rede lentas ou falhas
            let localMeta = null;
            if (window.B2TokenRegistry && typeof window.B2TokenRegistry.getMetadata === 'function') {
              localMeta = window.B2TokenRegistry.getMetadata(this.activeChainKey, contract);
            }

            // Busca fallback global no registro para reuso de metadados padrão se não encontrado na rede ativa
            if (!localMeta && window.B2TokenRegistry && Array.isArray(window.B2TokenRegistry)) {
              localMeta = window.B2TokenRegistry.find(entry =>
                entry.contract && entry.contract.toLowerCase().trim() === contract.toLowerCase().trim()
              );
            }

            if (localMeta) {
              if (nameInput) {
                nameInput.value = localMeta.name;
                nameInput.disabled = false;
              }
              if (symbolInput) {
                symbolInput.value = localMeta.symbol;
                symbolInput.disabled = false;
              }
              if (decimalsInput) {
                decimalsInput.value = localMeta.decimals.toString();
                decimalsInput.disabled = false;
              }
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
              }
              return;
            }

            if (nameInput) {
              nameInput.value = 'Buscando na blockchain...';
              nameInput.disabled = true;
            }
            if (symbolInput) {
              symbolInput.value = 'Carregando...';
              symbolInput.disabled = true;
            }
            if (decimalsInput) {
              decimalsInput.value = '...';
              decimalsInput.disabled = true;
            }
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.style.opacity = '0.5';
            }

            try {
              const meta = await this.fetchErc20TokenMetadata(contract, chain.nodeUrl);
              if (nameInput) nameInput.value = meta.name;
              if (symbolInput) symbolInput.value = meta.symbol;
              if (decimalsInput) decimalsInput.value = meta.decimals.toString();
            } catch (err) {
              if (nameInput) nameInput.value = '';
              if (symbolInput) symbolInput.value = '';
              if (decimalsInput) decimalsInput.value = '18';
              window.showToast('Não foi possível obter os dados do token. Insira um contrato válido ou preencha manualmente.', 'warning');
            } finally {
              if (nameInput) nameInput.disabled = false;
              if (symbolInput) symbolInput.disabled = false;
              if (decimalsInput) decimalsInput.disabled = false;
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
              }
            }
          }
        } else if (chain.engine === 'Stellar') {
          const parts = contract.split(':');
          if (parts.length === 2) {
            const assetCode = parts[0].trim();
            const assetIssuer = parts[1].trim();
            if (assetCode.length > 0 && assetCode.length <= 12 && window.B2StellarEngine && window.B2StellarEngine.validateAddress(assetIssuer)) {
              const nameInput = document.getElementById('add-token-name');
              const symbolInput = document.getElementById('add-token-symbol');
              const decimalsInput = document.getElementById('add-token-decimals');
              const submitBtn = document.getElementById('btn-add-token-submit');

              if (nameInput) {
                nameInput.value = 'Buscando na blockchain...';
                nameInput.disabled = true;
              }
              if (symbolInput) {
                symbolInput.value = 'Carregando...';
                symbolInput.disabled = true;
              }
              if (decimalsInput) {
                decimalsInput.value = '...';
                decimalsInput.disabled = true;
              }
              if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
              }

              try {
                const meta = await window.B2StellarEngine.AssetMetadataProvider.getMetadata(assetCode, assetIssuer, chain.nodeUrl);
                if (meta) {
                  if (nameInput) nameInput.value = meta.name || assetCode;
                  if (symbolInput) symbolInput.value = meta.code || assetCode;
                  if (decimalsInput) decimalsInput.value = (meta.decimals !== undefined ? meta.decimals : 7).toString();
                } else {
                  if (nameInput) nameInput.value = assetCode;
                  if (symbolInput) symbolInput.value = assetCode;
                  if (decimalsInput) decimalsInput.value = '7';
                }
              } catch (err) {
                if (nameInput) nameInput.value = assetCode;
                if (symbolInput) symbolInput.value = assetCode;
                if (decimalsInput) decimalsInput.value = '7';
              } finally {
                if (nameInput) nameInput.disabled = false;
                if (symbolInput) symbolInput.disabled = false;
                if (decimalsInput) decimalsInput.disabled = false;
                if (submitBtn) {
                  submitBtn.disabled = false;
                  submitBtn.style.opacity = '1';
                }
              }
            }
          }
        }
      };

      contractInputEl.addEventListener('input', handleContractInput);
      contractInputEl.addEventListener('paste', () => {
        setTimeout(handleContractInput, 50);
      });
    }

    const btnAddTokenSubmit = document.getElementById('btn-add-token-submit');
    if (btnAddTokenSubmit) {
      btnAddTokenSubmit.addEventListener('click', () => {
        const contract = (document.getElementById('add-token-contract')?.value || '').trim();
        const symbol = (document.getElementById('add-token-symbol')?.value || '').trim().toUpperCase();
        const decimals = parseInt(document.getElementById('add-token-decimals')?.value || '18');

        const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
        if (!chain) return;

        const engine = chain.engine || 'Custom';
        let isValid = true;

        if (engine === 'EVM') {
          isValid = /^0x[0-9a-fA-F]{40}$/.test(contract);
          if (!isValid) {
            window.showToast('Contrato EVM inválido. Deve ser hexadecimal com prefixo 0x e 40 caracteres.', 'warning');
            return;
          }
        } else if (engine === 'Waves') {
          isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contract);
          if (!isValid) {
            window.showToast('ID do ativo Waves inválido. Deve ser uma string Base58 de 32 a 44 caracteres.', 'warning');
            return;
          }
        } else if (engine === 'Solana') {
          isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contract);
          if (!isValid) {
            window.showToast('Endereço Mint Solana inválido. Deve ser uma string Base58 de 32 a 44 caracteres.', 'warning');
            return;
          }
        } else if (engine === 'Tron') {
          isValid = /^T[1-9A-HJ-NP-Za-km-z]{31,43}$/.test(contract);
          if (!isValid) {
            window.showToast('Contrato TRC-20 inválido. Deve começar com T e ser uma string Base58.', 'warning');
            return;
          }
        } else if (engine === 'Stellar') {
          const parts = contract.split(':');
          isValid = parts.length === 2 && parts[0].trim().length > 0 && parts[0].trim().length <= 12 && window.B2StellarEngine && window.B2StellarEngine.validateAddress(parts[1].trim());
          if (!isValid) {
            window.showToast('Identificador Stellar inválido. Use o formato CODE:EMISSOR (ex: USDC:GBBD4S237...).', 'warning');
            return;
          }
        } else {
          isValid = contract.length >= 10;
          if (!isValid) {
            window.showToast('Identificador de token inválido (mínimo 10 caracteres).', 'warning');
            return;
          }
        }

        if (!chain.discoveredTokens) chain.discoveredTokens = [];

        const name = (document.getElementById('add-token-name')?.value || '').trim() || symbol || 'Custom Token';

        const newToken = {
          assetId: contract,
          name: name,
          symbol: symbol || 'TKN',
          decimals,
          balanceCrypto: 0.0,
          balanceFiat: 0.0
        };

        // Salva no localStorage de forma resiliente
        const storageKey = this.getCustomTokensStorageKey(this.activeChainKey);
        const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const existsInStorage = stored.some(t => t.assetId.toLowerCase() === contract.toLowerCase());

        if (window.B2TokenRegistry && typeof window.B2TokenRegistry.enrichToken === 'function') {
          window.B2TokenRegistry.enrichToken(this.activeChainKey, newToken);
        }

        if (!existsInStorage) {
          stored.push(newToken);
          localStorage.setItem(storageKey, JSON.stringify(stored));
        }

        // Garante que o token importado esteja síncrono em memória e renderizado imediatamente
        const existsInMemory = chain.discoveredTokens.some(t => t.assetId.toLowerCase() === contract.toLowerCase());
        if (!existsInMemory) {
          chain.discoveredTokens.push(newToken);
        } else {
          // Se já existe em memória, atualiza os metadados (como nome, símbolo ou decimais)
          const existingToken = chain.discoveredTokens.find(t => t.assetId.toLowerCase() === contract.toLowerCase());
          if (existingToken) {
            existingToken.name = newToken.name;
            existingToken.symbol = newToken.symbol;
            existingToken.decimals = newToken.decimals;
            if (newToken.imageURL) existingToken.imageURL = newToken.imageURL;
          }
        }

        window.B2UIRenderer.closeModal('modal-add-token');
        window.B2UIRenderer.renderActiveBlockchainDashboard(this.blockchainData, this.activeChainKey);
        window.B2UIRenderer.renderBlockchainList(this.blockchainData);
        window.showToast(`Token ${newToken.symbol} adicionado!`, 'success');

        // Puxa o saldo do token adicionado imediatamente em background e atualiza a interface
        this.updateNetworkBalances(this.activeChainKey).then(() => {
          window.B2UIRenderer.renderActiveBlockchainDashboard(this.blockchainData, this.activeChainKey);
          window.B2UIRenderer.renderBlockchainList(this.blockchainData);
        }).catch(err => {
          console.error("Failed to update balances after adding token:", err);
        });
      });
    }

    // Modal Add NFT
    const btnCloseAddNFT = document.getElementById('btn-close-add-nft');
    if (btnCloseAddNFT) {
      btnCloseAddNFT.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-add-nft'));
    }

    const btnOpenAddNFT = document.getElementById('btn-open-add-nft');
    if (btnOpenAddNFT) {
      btnOpenAddNFT.addEventListener('click', () => {
        this.showAddNFTModal();
      });
    }

    const btnAddNFTSubmit = document.getElementById('btn-add-nft-submit');
    if (btnAddNFTSubmit) {
      btnAddNFTSubmit.addEventListener('click', () => {
        const contract = (document.getElementById('add-nft-contract')?.value || '').trim();
        const tokenId = (document.getElementById('add-nft-token-id')?.value || '').trim();
        const name = (document.getElementById('add-nft-name')?.value || '').trim();
        const collection = (document.getElementById('add-nft-collection')?.value || '').trim();

        if (!contract) {
          window.showToast('Insira o endereço do contrato ou ID do ativo.', 'warning');
          return;
        }
        if (!name) {
          window.showToast('Insira o nome do NFT.', 'warning');
          return;
        }

        const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
        if (!chain) return;

        const engine = chain.engine || 'Custom';
        let isValid = true;
        if (engine === 'EVM') {
          isValid = /^0x[0-9a-fA-F]{40}$/.test(contract);
          if (!isValid) {
            window.showToast('Contrato EVM inválido. Deve ser hexadecimal com prefixo 0x e 40 caracteres.', 'warning');
            return;
          }
        } else if (engine === 'Solana') {
          isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contract);
          if (!isValid) {
            window.showToast('Endereço Mint Solana inválido. Deve ser uma string Base58 de 32 a 44 caracteres.', 'warning');
            return;
          }
        }

        const storageKey = `b2_custom_nfts_${this.activeChainKey}`;
        const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const exists = stored.some(nft =>
          nft.contract.toLowerCase() === contract.toLowerCase() &&
          (tokenId ? nft.tokenId === tokenId : !nft.tokenId)
        );

        if (exists) {
          window.showToast('Este NFT já foi adicionado!', 'warning');
          return;
        }

        const newNft = {
          id: Math.random().toString(36).substring(2, 9),
          contract: contract,
          tokenId: tokenId,
          name: name,
          collection: collection || 'Coleção Customizada',
          color: 'linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)',
          addedManually: true
        };

        stored.push(newNft);
        localStorage.setItem(storageKey, JSON.stringify(stored));

        window.B2UIRenderer.closeModal('modal-add-nft');
        window.B2UIRenderer.renderNFTsGaller(this.activeChainKey);
        window.showToast(`NFT "${newNft.name}" adicionado!`, 'success');
      });
    }

    // Account chip — abre gerenciador de contas
    const accountChip = document.getElementById('account-chip-trigger');
    if (accountChip) {
      accountChip.addEventListener('click', () => {
        this._renderAccountManager();
        window.B2UIRenderer.openModal('modal-account-manager');
      });
    }

    const btnCloseAccountManager = document.getElementById('btn-close-account-manager');
    if (btnCloseAccountManager) btnCloseAccountManager.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-account-manager'));

    // Btn Nova Conta — deriva nova conta do mesmo seed
    const btnNewAccount = document.getElementById('btn-new-account');
    if (btnNewAccount) {
      btnNewAccount.addEventListener('click', async () => {
        const labelInput = await window.B2Toast.prompt("Nova Conta", "Digite o nome para a nova conta (opcional):", "text", "Ex: Minha Conta 2");
        const label = labelInput !== null ? labelInput.trim() || undefined : null;
        if (label === null) return; // cancelado pelo usuário
        const newAcc = this.createNewAccount(label);
        if (newAcc) {
          this._renderAccountManager();
        }
      });
    }

    // Btn Importar Conta — abre modal de importação com seleção de modo
    const btnImportAccount = document.getElementById('btn-import-account');
    if (btnImportAccount) {
      btnImportAccount.addEventListener('click', () => {
        // Reseta o modal antes de abrir
        const labelInput = document.getElementById('import-account-label');
        const b2SeedInput = document.getElementById('import-b2-seed');
        const extKeyInput = document.getElementById('import-external-key');
        const extChainSel = document.getElementById('import-external-chain');
        if (labelInput) labelInput.value = '';
        if (b2SeedInput) b2SeedInput.value = '';
        if (extKeyInput) extKeyInput.value = '';
        if (extChainSel) extChainSel.value = 'EVM';

        // Garante que o painel B2 seed esteja ativo ao abrir
        const panelB2 = document.getElementById('import-panel-b2seed');
        const panelExt = document.getElementById('import-panel-external');
        const cardB2 = document.getElementById('import-mode-b2');
        const cardExt = document.getElementById('import-mode-external');
        if (panelB2) panelB2.style.display = 'flex';
        if (panelExt) panelExt.style.display = 'none';
        if (cardB2) {
          cardB2.style.border = '2px solid var(--color-primary)';
          cardB2.style.background = 'var(--color-primary-dim)';
        }
        if (cardExt) {
          cardExt.style.border = '2px solid var(--border-light)';
          cardExt.style.background = 'var(--bg-card)';
        }

        window.B2UIRenderer.closeModal('modal-account-manager');
        window.B2UIRenderer.openModal('modal-import-account');
      });
    }

    // Botão fechar do modal de importação
    const btnCloseImport = document.getElementById('btn-close-import-account');
    if (btnCloseImport) {
      btnCloseImport.addEventListener('click', () => {
        window.B2UIRenderer.closeModal('modal-import-account');
        window.B2UIRenderer.openModal('modal-account-manager');
      });
    }

    // Alternância dos cards de modo de importação
    ['import-mode-b2', 'import-mode-external'].forEach(cardId => {
      const card = document.getElementById(cardId);
      if (!card) return;
      card.addEventListener('click', () => {
        const mode = card.getAttribute('data-mode');
        const panelB2 = document.getElementById('import-panel-b2seed');
        const panelExt = document.getElementById('import-panel-external');
        const cardB2 = document.getElementById('import-mode-b2');
        const cardExt = document.getElementById('import-mode-external');

        if (mode === 'b2seed') {
          if (panelB2) panelB2.style.display = 'flex';
          if (panelExt) panelExt.style.display = 'none';
          if (cardB2) { cardB2.style.border = '2px solid var(--color-primary)'; cardB2.style.background = 'var(--color-primary-dim)'; }
          if (cardExt) { cardExt.style.border = '2px solid var(--border-light)'; cardExt.style.background = 'var(--bg-card)'; }
        } else {
          if (panelB2) panelB2.style.display = 'none';
          if (panelExt) panelExt.style.display = 'flex';
          if (cardB2) { cardB2.style.border = '2px solid var(--border-light)'; cardB2.style.background = 'var(--bg-card)'; }
          if (cardExt) { cardExt.style.border = '2px solid var(--color-primary)'; cardExt.style.background = 'var(--color-primary-dim)'; }
        }
      });
    });

    // Atualiza hint do campo de chave quando a chain muda
    const extChainSelect = document.getElementById('import-external-chain');
    if (extChainSelect) {
      extChainSelect.addEventListener('change', () => {
        const hint = document.getElementById('import-external-key-hint');
        const label = document.getElementById('import-external-key-label');
        const ph = document.getElementById('import-external-key');
        const chainHints = {
          EVM: { label: 'Chave Privada ou Seed Phrase', ph: '0x... ou palavra1 palavra2...', hint: 'Chave privada hex (0x + 64 chars) ou semente BIP-39 compatível com redes EVM padrão.' },
          Solana: { label: 'Chave Privada (base58) ou Seed', ph: 'Seed phrase ou chave base58...', hint: 'Frase semente (12/24 palavras) ou chave privada em base58 compatível com redes Solana padrão.' },
          Bitcoin: { label: 'Chave WIF ou Seed Phrase', ph: 'WIF K... ou L... ou seed BIP-39', hint: 'Chave WIF (começa com K, L ou 5) ou semente BIP-39 usada por carteiras Bitcoin padrão.' },
          Waves: { label: 'Seed Phrase Waves', ph: 'palavra1 palavra2 ... palavra15', hint: 'Seed phrase padrão Waves (15 palavras) usada pelo Waves.Exchange.' },
          Tron: { label: 'Chave Privada TRX ou Seed', ph: '0x... ou seed phrase...', hint: 'Chave privada hex ou seed BIP-39 compatível com TronLink.' },
          Other: { label: 'Chave Privada ou Seed Phrase', ph: 'Cole aqui a chave ou seed...', hint: 'Aceita chave privada ou seed phrase BIP-39 de qualquer carteira.' }
        };
        const val = extChainSelect.value;
        const info = chainHints[val] || chainHints['Other'];
        if (label) label.textContent = info.label;
        if (ph) ph.placeholder = info.ph;
        if (hint) hint.textContent = info.hint;
      });
    }

    // Botão confirmar importação
    const btnConfirmImport = document.getElementById('btn-confirm-import-account');
    if (btnConfirmImport) {
      btnConfirmImport.addEventListener('click', () => {
        const panelB2 = document.getElementById('import-panel-b2seed');
        const isB2Mode = panelB2 && panelB2.style.display !== 'none';
        const label = (document.getElementById('import-account-label')?.value || '').trim() || undefined;

        if (isB2Mode) {
          // Modo B2 Seed
          const seedVal = (document.getElementById('import-b2-seed')?.value || '').trim();
          if (!seedVal) { window.showToast('Cole a seed phrase da B2 Wallet.', 'warning'); return; }
          const wordCount = seedVal.split(/\s+/).filter(Boolean).length;
          if (wordCount !== 12 && wordCount !== 24) {
            window.showToast(`Seed inválida: ${wordCount} palavras. Esperado 12 ou 24.`, 'error');
            return;
          }
          const imported = this.importAccount(label, seedVal);
          if (imported) {
            window.B2UIRenderer.closeModal('modal-import-account');
            window.B2UIRenderer.openModal('modal-account-manager');
            this._renderAccountManager();
            window.showToast(`✅ Conta "${imported.label}" importada via seed B2 Wallet!`, 'success');
          }
        } else {
          // Modo externo
          const extKey = (document.getElementById('import-external-key')?.value || '').trim();
          const extChain = document.getElementById('import-external-chain')?.value || 'EVM';
          if (!extKey) { window.showToast('Cole a chave privada ou seed phrase.', 'warning'); return; }
          if (extKey.length < 16) { window.showToast('Chave muito curta. Verifique e tente novamente.', 'error'); return; }

          // Cria conta do tipo 'external-key' com metadado da chain de origem
          const newIdx = this.accounts.length;
          const account = {
            index: newIdx,
            label: label || `Importada (${extChain}) ${newIdx + 1}`,
            createdAt: Date.now(),
            type: 'external-key',
            sourceChain: extChain,
            keyHash: btoa(extKey.substring(0, 16)).substring(0, 8)
          };
          this.accounts.push(account);
          localStorage.setItem('b2_accounts', JSON.stringify(this.accounts));
          this._refreshAccountChipLabel();
          window.B2UIRenderer.closeModal('modal-import-account');
          window.B2UIRenderer.openModal('modal-account-manager');
          this._renderAccountManager();
          window.showToast(`✅ Conta "${account.label}" importada (${extChain}). Suporte completo em breve.`, 'success');
        }
      });
    }

    // Modal Add Network
    const btnOpenAddNetwork = document.getElementById('btn-open-add-network');
    if (btnOpenAddNetwork) btnOpenAddNetwork.addEventListener('click', () => window.B2UIRenderer.openModal('modal-add-network'));

    const btnCloseAddNetwork = document.getElementById('btn-close-add-network');
    if (btnCloseAddNetwork) btnCloseAddNetwork.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-add-network'));

    // Engine options selection (Standard Grid Layout)
    const engineOptions = document.querySelectorAll('#add-net-engine-grid .engine-option');
    if (engineOptions) {
      engineOptions.forEach(opt => {
        opt.addEventListener('click', () => {
          engineOptions.forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');

          const coinType = opt.getAttribute('data-coin-type');
          const decimals = opt.getAttribute('data-decimals');

          const coinTypeInput = document.getElementById('add-net-coin-type');
          const decimalsInput = document.getElementById('add-net-decimals');

          if (coinTypeInput && coinType) coinTypeInput.value = coinType;
          if (decimalsInput && decimals) decimalsInput.value = decimals;
        });
      });
    }

    const btnSubmitAddNetwork = document.getElementById('btn-submit-add-network');
    if (btnSubmitAddNetwork) {
      btnSubmitAddNetwork.addEventListener('click', () => {
        const name = document.getElementById('add-net-name').value;
        const symbol = document.getElementById('add-net-symbol').value;
        const coinType = parseInt(document.getElementById('add-net-coin-type').value);
        const rpc = document.getElementById('add-net-rpc').value;

        if (!name || !symbol || isNaN(coinType) || !rpc) {
          window.showToast('Preencha todos os campos.', 'warning');
          return;
        }

        // Get selected engine from grid
        const selectedOpt = document.querySelector('#add-net-engine-grid .engine-option.selected');
        const engine = selectedOpt ? selectedOpt.getAttribute('data-engine') : 'Custom';
        const decimals = parseInt(document.getElementById('add-net-decimals').value) || 18;

        let supportsTokens = false;
        let supportsNFTs = false;
        let supportsStaking = false;
        let supportsSmartContracts = false;
        let color = '#64748b';

        if (engine === 'EVM') {
          supportsTokens = true;
          supportsNFTs = true;
          supportsSmartContracts = true;
          color = '#6366f1';
        } else if (engine === 'Waves') {
          supportsTokens = true;
          supportsNFTs = true;
          supportsStaking = true;
          color = '#0055ff';
        } else if (engine === 'Bitcoin') {
          color = '#f59e0b';
        } else if (engine === 'Solana') {
          supportsTokens = true;
          supportsNFTs = true;
          supportsStaking = true;
          color = '#14f195';
        } else if (engine === 'Tron') {
          supportsTokens = true;
          supportsSmartContracts = true;
          color = '#ec092c';
        }

        const newChain = {
          key: symbol.toUpperCase(),
          name,
          symbol: symbol.toUpperCase(),
          coinType,
          decimals,
          engine,
          nodeUrl: rpc,
          color,
          balanceCrypto: 0,
          balanceFiat: 0,
          supportsTokens,
          supportsNFTs,
          supportsStaking,
          supportsSmartContracts,
          autoDiscoverTokens: false,
          discoveredTokens: [],
          discoveredNFTs: []
        };

        this.blockchainData.push(newChain);
        if (this.decryptedSeed) {
          this.deriveAllAddresses();
          window.B2UIRenderer.renderBlockchainList(this.blockchainData);
        }

        ['add-net-name', 'add-net-symbol', 'add-net-coin-type', 'add-net-rpc', 'add-net-decimals', 'add-net-chain-id', 'add-net-explorer']
          .forEach(id => { const el = document.getElementById(id); if (el) el.value = el.defaultValue || ''; });

        // Reset grid selection to EVM
        if (engineOptions && engineOptions.length > 0) {
          engineOptions.forEach(o => o.classList.remove('selected'));
          engineOptions[0].classList.add('selected');
        }

        window.B2UIRenderer.closeModal('modal-add-network');
        window.showToast('Blockchain adicionada!', 'success');
      });
    }

    // Modal backdrop — fechar clicando fora
    document.querySelectorAll('.b2-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          window.B2UIRenderer.closeModal(modal.id);
        }
      });
    });

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
        entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}`;
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
  }

  updateSimulatorBalances() {
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
  }

  /**
   * Renderiza o gerenciador de contas (multi-account stub).
   */
  _renderAccountManager() {
    const listEl = document.getElementById('account-list-container');
    if (!listEl) return;

    listEl.innerHTML = '';

    // Garante que a conta 0 (principal) sempre existe
    if (!this.accounts || this.accounts.length === 0) {
      this.accounts = [{
        index: 0,
        label: 'Conta Principal',
        createdAt: Date.now(),
        type: 'derived'
      }];
      localStorage.setItem('b2_accounts', JSON.stringify(this.accounts));
    }

    const activeChain = this.blockchainData.find(c => c.key === this.activeChainKey);

    this.accounts.forEach((acc, idx) => {
      const isActive = idx === this.activeAccountIndex;
      const derived = this.derivedKeys[this.activeChainKey];
      const addr = (derived && derived.address) ? derived.address : '—';
      const truncAddr = addr.length > 24 ? addr.substring(0, 10) + '…' + addr.substring(addr.length - 8) : addr;

      const card = document.createElement('div');
      card.style.cssText = `
        display:flex; align-items:center; gap:12px; padding:12px 14px;
        background:${isActive ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)'};
        border:1px solid ${isActive ? (activeChain?.color || 'var(--color-primary)') : 'rgba(255,255,255,0.07)'};
        border-radius:12px; cursor:pointer;
        transition: all 0.2s ease;
      `;
      card.setAttribute('data-acc-idx', idx);

      // Avatar — emoji se definido, senão iniciais
      const avatar = document.createElement('div');
      const hasEmoji = acc.avatar && acc.avatar.trim().length > 0;
      const initials = (acc.label || 'C').substring(0, 2).toUpperCase();
      if (hasEmoji) {
        avatar.style.cssText = `
          width:40px; height:40px; border-radius:50%;
          background:linear-gradient(135deg, ${activeChain?.color || '#f59e0b'} 0%, rgba(255,255,255,0.1) 100%);
          display:flex; align-items:center; justify-content:center;
          font-size:1.3rem; flex-shrink:0;
        `;
        avatar.textContent = acc.avatar;
      } else {
        avatar.style.cssText = `
          width:40px; height:40px; border-radius:50%;
          background:linear-gradient(135deg, ${activeChain?.color || '#f59e0b'} 0%, rgba(255,255,255,0.1) 100%);
          display:flex; align-items:center; justify-content:center;
          font-weight:900; font-size:13px; color:#fff; flex-shrink:0;
          font-family:var(--font-mono);
        `;
        avatar.textContent = initials;
      }

      // Info
      const info = document.createElement('div');
      info.style.cssText = 'flex:1; min-width:0;';

      const nameRow = document.createElement('div');
      nameRow.style.cssText = 'display:flex; align-items:center; gap:6px; margin-bottom:3px;';

      const nameSpan = document.createElement('span');
      nameSpan.style.cssText = 'font-size:var(--text-sm); font-weight:var(--fw-semibold); color:var(--text-primary);';
      nameSpan.textContent = acc.label || `Conta ${idx + 1}`;
      nameRow.appendChild(nameSpan);

      if (acc.type === 'imported') {
        const tag = document.createElement('span');
        tag.style.cssText = 'font-size:9px; padding:1px 6px; background:rgba(99,102,241,0.15); color:#818cf8; border:1px solid rgba(99,102,241,0.3); border-radius:99px; font-weight:700;';
        tag.textContent = 'IMPORTADA';
        nameRow.appendChild(tag);
      }

      if (isActive) {
        const activeBadge = document.createElement('span');
        activeBadge.style.cssText = 'font-size:9px; padding:1px 6px; background:rgba(16,185,129,0.15); color:var(--text-success); border:1px solid rgba(16,185,129,0.3); border-radius:99px; font-weight:700;';
        activeBadge.textContent = 'ATIVA';
        nameRow.appendChild(activeBadge);
      }

      const addrSpan = document.createElement('div');
      addrSpan.style.cssText = 'font-size:11px; color:var(--text-muted); font-family:var(--font-mono); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
      addrSpan.textContent = isActive ? truncAddr : `HD Índice ${idx}`;
      addrSpan.title = isActive ? addr : '';

      info.appendChild(nameRow);
      info.appendChild(addrSpan);

      // Actions (switch + edit + keys + remove)
      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex; gap:5px; flex-shrink:0;';

      if (!isActive) {
        const btnSwitch = document.createElement('button');
        btnSwitch.style.cssText = `
          padding:4px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.12);
          background:rgba(255,255,255,0.05); color:var(--text-primary);
          font-size:11px; font-weight:600; cursor:pointer;
          transition: all 0.15s;
        `;
        btnSwitch.textContent = 'Usar';
        btnSwitch.title = `Ativar ${acc.label}`;
        btnSwitch.addEventListener('click', (e) => {
          e.stopPropagation();
          this.switchAccount(idx);
          this._renderAccountManager();
        });
        actions.appendChild(btnSwitch);
      }

      // Botão Editar (lápis)
      const btnEdit = document.createElement('button');
      btnEdit.style.cssText = `
        width:28px; height:28px; border-radius:6px;
        border:1px solid rgba(99,102,241,0.25); background:rgba(99,102,241,0.08);
        color:#818cf8; font-size:14px; cursor:pointer; display:flex;
        align-items:center; justify-content:center; transition: all 0.15s;
      `;
      btnEdit.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      btnEdit.title = 'Editar nome e avatar';
      btnEdit.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openEditAccountModal(idx);
      });
      actions.appendChild(btnEdit);

      // Botão Ver Chaves (cadeado)
      const btnKeys = document.createElement('button');
      btnKeys.style.cssText = `
        width:28px; height:28px; border-radius:6px;
        border:1px solid rgba(245,158,11,0.25); background:rgba(245,158,11,0.08);
        color:var(--color-primary); font-size:14px; cursor:pointer; display:flex;
        align-items:center; justify-content:center; transition: all 0.15s;
      `;
      btnKeys.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
      btnKeys.title = 'Ver seed / chaves';
      btnKeys.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openViewKeysModal(idx);
      });
      actions.appendChild(btnKeys);

      if (idx !== 0) {
        const btnRemove = document.createElement('button');
        btnRemove.style.cssText = `
          width:28px; height:28px; border-radius:6px;
          border:1px solid rgba(239,68,68,0.25); background:rgba(239,68,68,0.08);
          color:#ef4444; font-size:14px; cursor:pointer; display:flex;
          align-items:center; justify-content:center; transition: all 0.15s;
        `;
        btnRemove.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`;
        btnRemove.title = 'Remover conta';
        btnRemove.addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmed = await window.B2Toast.confirm("Remover Conta", `Deseja realmente remover a conta "${acc.label}"? Esta ação não pode ser desfeita.`, "warning");
          if (confirmed) {
            this.removeAccount(idx);
            this._renderAccountManager();
          }
        });
        actions.appendChild(btnRemove);
      }

      card.appendChild(avatar);
      card.appendChild(info);
      card.appendChild(actions);
      listEl.appendChild(card);
    });

    // Separador + dica
    const tip = document.createElement('p');
    tip.style.cssText = 'font-size:11px; color:var(--text-muted); text-align:center; padding-top:8px; line-height:1.5;';
    tip.textContent = '🔒 Todas as contas compartilham o mesmo seed. Cada conta usa um índice de derivação HD único.';
    listEl.appendChild(tip);
  }


  mintCustomNFT(nftName, gradient) {
    // Mint custom desabilitado — não armazenamos/generamos NFTs fictícios localmente.
    window.B2Logger.log('warn', 'mintCustomNFT chamado, mas desativado nesta build');
    try { window.showToast && window.showToast('Mint custom desativado.', 'info'); } catch (e) { }
    return;
  }

  // =========================================================================
  // ACCOUNT EDIT MODAL
  // =========================================================================
  _openEditAccountModal(accIdx) {
    const acc = this.accounts[accIdx];
    if (!acc) return;

    // Guarda índice de conta sendo editada
    this._editingAccountIdx = accIdx;

    // Preenche nome
    const nameInput = document.getElementById('edit-account-name');
    if (nameInput) nameInput.value = acc.label || '';

    // Preenche avatar
    const preview = document.getElementById('edit-account-avatar-preview');
    if (preview) preview.textContent = acc.avatar || '👤';

    // Preenche grid de emojis
    const grid = document.getElementById('edit-account-emoji-grid');
    if (grid) {
      const emojis = ['👤', '👨', '👩', '🧑', '🧔', '🦸', '🦹', '👨‍💻', '🧙', '🦊', '🐺', '🦁', '🐯', '🦄', '🐉', '💎', '🔑', '🏦', '💰', '🤖', '👾', '🎭', '🎩', '🏴‍☠️', '🛸', '⚡', '🔥', '🌊', '🌟', '💫', '🎯', '🏆'];
      grid.innerHTML = '';
      grid.style.display = 'flex';
      emojis.forEach(e => {
        const btn = document.createElement('button');
        btn.textContent = e;
        btn.title = e;
        btn.style.cssText = 'font-size:1.3rem;background:none;border:none;cursor:pointer;padding:2px 4px;border-radius:6px;transition:background 0.15s;';
        btn.addEventListener('mouseenter', () => btn.style.background = 'var(--bg-hover)');
        btn.addEventListener('mouseleave', () => btn.style.background = 'none');
        btn.addEventListener('click', () => {
          if (preview) preview.textContent = e;
          grid.style.display = 'none';
        });
        grid.appendChild(btn);
      });
    }

    // Clique no preview toggles o grid
    if (preview) {
      preview.onclick = () => {
        if (grid) grid.style.display = grid.style.display === 'none' ? 'flex' : 'none';
      };
    }

    window.B2UIRenderer.closeModal('modal-account-manager');
    window.B2UIRenderer.openModal('modal-edit-account');
  }

  _initEditAccountModal() {
    const btnClose = document.getElementById('btn-close-edit-account');
    if (btnClose) btnClose.addEventListener('click', () => {
      window.B2UIRenderer.closeModal('modal-edit-account');
      window.B2UIRenderer.openModal('modal-account-manager');
      this._renderAccountManager();
    });

    const btnSave = document.getElementById('btn-save-edit-account');
    if (btnSave) btnSave.addEventListener('click', () => {
      const idx = this._editingAccountIdx;
      if (idx == null || !this.accounts[idx]) return;
      const nameInput = document.getElementById('edit-account-name');
      const preview = document.getElementById('edit-account-avatar-preview');
      const newName = (nameInput?.value || '').trim();
      const newAvatar = (preview?.textContent || '').trim();
      if (newName) this.accounts[idx].label = newName;
      if (newAvatar && newAvatar !== '👤') this.accounts[idx].avatar = newAvatar;
      localStorage.setItem('b2_accounts', JSON.stringify(this.accounts));
      this._refreshAccountChipLabel();
      window.showToast('✅ Conta atualizada com sucesso!', 'success');
      window.B2UIRenderer.closeModal('modal-edit-account');
      window.B2UIRenderer.openModal('modal-account-manager');
      this._renderAccountManager();
    });
  }

  // =========================================================================
  // KEY VIEWER MODAL
  // =========================================================================
  _openViewKeysModal(accIdx) {
    const acc = this.accounts[accIdx];
    if (!acc) return;
    this._viewingKeysIdx = accIdx;

    // Reset UI
    const pinSection = document.getElementById('view-keys-pin-section');
    const revealedSection = document.getElementById('view-keys-revealed-section');
    const pwdInput = document.getElementById('view-keys-password');
    if (pinSection) { pinSection.style.display = 'flex'; }
    if (revealedSection) { revealedSection.style.display = 'none'; }
    if (pwdInput) { pwdInput.value = ''; }

    window.B2UIRenderer.closeModal('modal-account-manager');
    window.B2UIRenderer.openModal('modal-view-keys');
  }

  _initViewKeysModal() {
    const btnClose = document.getElementById('btn-close-view-keys');
    if (btnClose) btnClose.addEventListener('click', () => {
      this._hideKeysAndReset();
      window.B2UIRenderer.closeModal('modal-view-keys');
      window.B2UIRenderer.openModal('modal-account-manager');
      this._renderAccountManager();
    });

    const btnReveal = document.getElementById('btn-reveal-keys');
    if (btnReveal) btnReveal.addEventListener('click', async () => {
      const pwdInput = document.getElementById('view-keys-password');
      const pwd = (pwdInput?.value || '').trim();
      if (!pwd) { window.showToast('Digite a senha da carteira.', 'warning'); return; }

      try {
        // Valida a senha tentando descriptografar o payload principal
        const seed = await window.B2PlatformSecurity.decryptData(this.encryptedWalletPayload, pwd);
        if (!seed) throw new Error('Senha inválida.');

        const accIdx = this._viewingKeysIdx;
        const acc = this.accounts[accIdx];
        const activeChainKey = this.activeChainKey;
        const derivedKey = this.derivedKeys[activeChainKey];

        // --- Endereço público ---
        const addrEl = document.getElementById('view-keys-address');
        if (addrEl) addrEl.textContent = derivedKey?.address || '—';

        // --- Chave pública (hex da chave privada passada pelo ethers se EVM) ---
        const pubkeyEl = document.getElementById('view-keys-pubkey');
        if (pubkeyEl) {
          let pubkey = '—';
          try {
            if (derivedKey?.privateKey && window.ethers) {
              const wallet = new window.ethers.Wallet('0x' + derivedKey.privateKey);
              pubkey = wallet.signingKey.publicKey;
            } else if (derivedKey?.publicKey) {
              // Waves / Solana etc. guardam publicKey como Uint8Array ou string
              const pk = derivedKey.publicKey;
              pubkey = (typeof pk === 'string') ? pk : Array.from(pk).map(b => b.toString(16).padStart(2, '0')).join('');
            }
          } catch (_) { }
          pubkeyEl.textContent = pubkey;
        }

        // --- Chave privada ---
        const privkeyEl = document.getElementById('view-keys-privkey');
        if (privkeyEl) {
          if (acc?.type === 'external-key') {
            // Conta importada — tenta recuperar via ExternalKeyManager
            try {
              const raw = await window.B2ExternalKeyManager?.decryptKey(accIdx, pwd);
              privkeyEl.textContent = raw || '—';
            } catch (_) {
              privkeyEl.textContent = '(chave externa não recuperável)';
            }
          } else {
            privkeyEl.textContent = derivedKey?.privateKey ? '0x' + derivedKey.privateKey : '—';
          }
        }

        // --- Seed phrase ---
        const seedSection = document.getElementById('view-keys-seed-section');
        const seedEl = document.getElementById('view-keys-seed');
        if (acc?.type === 'external-key' || acc?.type === 'watch-only') {
          // Contas externas não têm seed B2
          if (seedSection) seedSection.style.display = 'none';
        } else {
          if (seedSection) seedSection.style.display = 'block';
          if (seedEl) seedEl.textContent = seed;
        }

        // Mostrar seção revelada, ocultar PIN
        const pinSection = document.getElementById('view-keys-pin-section');
        const revealedSection = document.getElementById('view-keys-revealed-section');
        if (pinSection) pinSection.style.display = 'none';
        if (revealedSection) revealedSection.style.display = 'flex';
        if (document.getElementById('view-keys-password')) document.getElementById('view-keys-password').value = '';

        // Auto-hide countdown
        this._startViewKeysCountdown(60);

      } catch (e) {
        window.B2Toast.alert('Autenticação Falhou', 'Senha incorreta. Verifique e tente novamente.', 'error');
      }
    });

    // Copy buttons
    document.querySelectorAll('.copy-key-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const el = document.getElementById(targetId);
        if (el && el.textContent && el.textContent !== '—') {
          navigator.clipboard.writeText(el.textContent).then(() => {
            window.showToast('Copiado para a área de transferência!', 'success');
          }).catch(() => {
            window.showToast('Falha ao copiar.', 'error');
          });
        }
      });
    });
  }

  _startViewKeysCountdown(seconds) {
    if (this._viewKeysTimer) clearInterval(this._viewKeysTimer);
    let remaining = seconds;
    const countdownEl = document.getElementById('view-keys-countdown');
    if (countdownEl) countdownEl.textContent = remaining;

    this._viewKeysTimer = setInterval(() => {
      remaining--;
      if (countdownEl) countdownEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(this._viewKeysTimer);
        this._hideKeysAndReset();
      }
    }, 1000);
  }

  _hideKeysAndReset() {
    if (this._viewKeysTimer) clearInterval(this._viewKeysTimer);
    const pinSection = document.getElementById('view-keys-pin-section');
    const revealedSection = document.getElementById('view-keys-revealed-section');
    if (pinSection) pinSection.style.display = 'flex';
    if (revealedSection) revealedSection.style.display = 'none';
    // Limpa dados sensíveis do DOM
    ['view-keys-address', 'view-keys-pubkey', 'view-keys-privkey', 'view-keys-seed'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
  }
}

// Inicializa a aplicação central e expõe globalmente
window.B2App = new B2WalletApp();
document.addEventListener('DOMContentLoaded', () => {
  window.B2App.initialize();
});
