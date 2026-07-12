/**
 * Módulo de Navegação e Rotas para UIRenderer.
 */

UIRenderer.prototype.navigateTo = function(viewId) {
  const nextView = document.getElementById(viewId);
  if (!nextView) {
    console.warn('[UIRenderer.navigateTo] Elemento não encontrado:', viewId);
    return;
  }
  // Detecta contexto de popup da extensão para evitar tela preta por keyframe opacity:0
  const isExtensionPopup = document.documentElement.classList.contains('is-extension-popup');
  // Oculta todas as telas ativas, removendo também estilos inline de visibilidade
  document.querySelectorAll(".wallet-view").forEach(view => {
    view.classList.remove("active", "animate-view");
    // Remove estilos inline de visibilidade que possam ter sido aplicados
    if (isExtensionPopup) {
      view.style.removeProperty('display');
      view.style.removeProperty('opacity');
      view.style.removeProperty('visibility');
    }
  });
  // Ativa a tela solicitada
  nextView.classList.add("active");
  if (isExtensionPopup) {
    // No popup da extensão: aplica estilos inline diretos para garantir visibilidade imediata
    // sem depender de CSS cascade que pode sofrer conflito com keyframe opacity:0
    nextView.style.cssText = 'display:flex !important; opacity:1 !important; visibility:visible !important; animation:none !important; transform:none !important;';
    // Força um reflow para que o browser processe os estilos
    void nextView.offsetWidth;
    // Adiciona animate-view apenas fora do popup (evita flash opacity:0)
  } else {
    // Fora do popup: comportamento padrão com animação
    void nextView.offsetWidth;
    nextView.classList.add("animate-view");
  }
  this.currentViewId = viewId;
  // Exibe ou oculta a barra de navegação inferior
  const navBar = document.getElementById("wallet-nav-bar");
  const onboardingScreens = ["view-welcome", "view-generate-seed", "view-create-password", "view-confirm-seed", "view-addresses-list", "view-locked"];
  if (onboardingScreens.includes(viewId)) {
    if (navBar) navBar.style.display = "none";
  } else {
    if (navBar) {
      navBar.style.display = "flex";
      document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
        if (item.getAttribute("data-target") === viewId) {
          item.classList.add("active");
        }
      });
    }
  }
  // Tela sensível (seed) — adiciona classe de proteção
  if (viewId === "view-generate-seed") {
    document.body.classList.add("sensitive-screen-active");
  } else {
    document.body.classList.remove("sensitive-screen-active");
  }
  // Remove desfoque de segurança ao navegar para telas isentas (boas-vindas ou login/lock) para evitar tela preta de falso-positivo
  if (viewId === "view-welcome" || viewId === "view-locked") {
    document.body.classList.remove("window-blurred");
  }
  // Se estiver no Dashboard:
  if (viewId === "view-dashboard") {
    // Aba NFTs: visível apenas para chains com supportsNFTs
    const tabBtnNFTs = document.getElementById("tab-btn-nfts");
    const nftTab = document.getElementById("tab-content-nfts");
    const activeChainKey = (window.B2App && window.B2App.activeChainKey) ? window.B2App.activeChainKey : null;
    const activeChain = activeChainKey && window.B2App
      ? window.B2App.blockchainData?.find(c => c.key === activeChainKey)
      : null;
    const supportsNFTs = activeChain ? !!activeChain.supportsNFTs : false;
    if (tabBtnNFTs) {
      tabBtnNFTs.style.display = supportsNFTs ? '' : 'none';
      // Se aba NFT estava ativa e a chain não suporta, muda para tokens
      if (!supportsNFTs && tabBtnNFTs.classList.contains('active')) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => { t.style.display = 'none'; });
        const tokensBtn = document.querySelector('.tab-btn[data-tab="tokens"]');
        const tokensTab = document.getElementById('tab-content-tokens');
        if (tokensBtn) tokensBtn.classList.add('active');
        if (tokensTab) tokensTab.style.display = 'flex';
      }
    }
    // Renderiza NFTs e Histórico para o cache inicial
    try {
      this.renderNFTsGaller();
    } catch (err) {
      console.error("Erro ao renderizar galeria de NFTs no setup inicial:", err);
    }
    try {
      this.renderHistoryTransactions();
    } catch (err) {
      console.error("Erro ao renderizar histórico no setup inicial:", err);
    }
  }
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  if (viewId === "view-locked" && window.B2App && typeof window.B2App.tryBiometricUnlock === "function") {
    setTimeout(() => {
      window.B2App.tryBiometricUnlock();
    }, 300);
  }
};
