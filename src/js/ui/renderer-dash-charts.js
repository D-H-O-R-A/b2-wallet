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
