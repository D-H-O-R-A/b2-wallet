/**
 * B2 Wallet - UI Renderer Transactions Module
 * 
 * Extends UIRenderer with transactional UI methods (history rendering, fields).
 */

/**
 * Renderiza o histórico de transações filtradas de forma estrita pela rede ativa.
 */
UIRenderer.prototype.renderHistoryTransactions = function(activeKey) {
  if (!activeKey) {
    activeKey = (window.B2App && window.B2App.activeChainKey) ? window.B2App.activeChainKey : "WAVES";
  }

  const container = document.getElementById("history-transactions-list");
  if (!container) return;

  container.innerHTML = "";

  // Sem dados simulados - apenas transações reais da carteira
  const initialTxs = [];

  const filteredTxs = initialTxs.filter(tx => tx.chainKey === activeKey);

  // Carrega transações extras do localStorage
  const extraTxsKey = `b2_tx_history_${activeKey}`;
  const extraTxs = JSON.parse(localStorage.getItem(extraTxsKey) || "[]");
  extraTxs.forEach(tx => {
    filteredTxs.unshift(tx);
  });

  if (filteredTxs.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.padding = "24px";
    emptyMsg.style.color = "var(--text-muted)";
    emptyMsg.style.fontFamily = "var(--font-body)";
    emptyMsg.style.fontSize = "0.75rem";
    emptyMsg.innerText = "Nenhuma transação registrada nesta rede.";
    container.appendChild(emptyMsg);
    return;
  }

  filteredTxs.forEach(tx => {
    const card = document.createElement("div");
    card.className = "glass-card";
    card.style.display = "flex";
    card.style.alignItems = "center";
    card.style.justifyContent = "space-between";
    card.style.padding = "10px 12px";
    card.style.border = "1px solid var(--border-light)";
    card.style.borderRadius = "var(--radius-md)";

    const leftPart = document.createElement("div");
    leftPart.style.display = "flex";
    leftPart.style.alignItems = "center";
    leftPart.style.gap = "10px";

    const icon = document.createElement("div");
    icon.style.width = "30px";
    icon.style.height = "30px";
    icon.style.borderRadius = "50%";
    icon.style.display = "flex";
    icon.style.justifyContent = "center";
    icon.style.alignItems = "center";
    icon.style.background = "var(--bg-hover)";
    icon.style.fontFamily = "var(--font-tech)";
    icon.style.fontSize = "0.9rem";
    
    const txTypeStr = tx.type || '';
    let emoji = "📤";
    if (txTypeStr === "Recebido" || txTypeStr === "Received") emoji = "📥";
    else if (txTypeStr === "Cunhado NFT" || txTypeStr === "NFT Mint") emoji = "🎨";
    else if (txTypeStr === "Arrendado LPoS" || txTypeStr.includes("Lease")) emoji = "⛓️";
    else if (txTypeStr === "Stake Solana" || txTypeStr.includes("Stake")) emoji = "☀️";
    else if (txTypeStr.includes("EVM")) emoji = "⚡";

    icon.innerText = emoji;

    const details = document.createElement("div");
    details.style.display = "flex";
    details.style.flexDirection = "column";
    details.style.gap = "2px";

    const title = document.createElement("span");
    title.style.fontSize = "0.75rem";
    title.style.fontWeight = "700";
    title.innerText = `${tx.type} (${tx.chain || activeKey})`;

    const sub = document.createElement("span");
    sub.style.fontSize = "0.6rem";
    sub.style.color = "var(--text-muted)";
    sub.innerText = `${tx.addr} • ${tx.time}`;

    details.appendChild(title);
    details.appendChild(sub);
    leftPart.appendChild(icon);
    leftPart.appendChild(details);

    const rightPart = document.createElement("div");
    rightPart.style.textAlign = "right";
    rightPart.style.display = "flex";
    rightPart.style.flexDirection = "column";
    rightPart.style.gap = "2px";

    const amt = document.createElement("span");
    amt.style.fontSize = "0.75rem";
    amt.style.fontFamily = "var(--font-tech)";
    amt.style.fontWeight = "bold";
    amt.style.color = tx.color || "var(--text-danger)";
    amt.innerText = tx.amount;

    const stat = document.createElement("span");
    stat.style.fontSize = "0.55rem";
    stat.style.color = "var(--text-muted)";
    stat.innerText = tx.status || "Confirmado";

    rightPart.appendChild(amt);
    rightPart.appendChild(stat);

    card.appendChild(leftPart);
    card.appendChild(rightPart);
    // Permite clicar na transação para ver detalhes via node
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      // Usa txHash (hash real da blockchain) se disponível, senão cai no id local
      const txId = tx.txHash || tx.txId || tx.id;
      // Usa chainKey (chave da rede) se disponível, senão activeKey — tx.chain é o NOME (ex: "Bitcoin"), não a chave ("BTC")
      const chainKey = tx.chainKey || activeKey;
      if (window.B2App && typeof window.B2App.fetchTransactionDetails === 'function') {
        window.B2App.fetchTransactionDetails(chainKey, txId, tx);
      } else {
        // fallback: abre modal com info local se disponível
        window.B2UIRenderer.openModal && window.B2UIRenderer.openModal('modal-tx-detail');
      }
    });
    container.appendChild(card);
  });
};
