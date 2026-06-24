/**
 * B2 Wallet - UI Renderer Core Module
 * 
 * Defines the base UIRenderer class, standard navigation, and modal helpers.
 */

class UIRenderer {
  constructor() {
    this.currentViewId = "view-welcome";
  }

  /**
   * Navega para uma visualização de tela específica, aplicando as animações premium de entrada.
   * 
   * @param {string} viewId - O identificador da tela (Ex: 'view-dashboard', 'view-settings').
   */
  navigateTo(viewId) {
    const nextView = document.getElementById(viewId);
    if (!nextView) return;

    // Oculta todas as telas ativas
    document.querySelectorAll(".wallet-view").forEach(view => {
      view.classList.remove("active", "animate-view");
    });

    // Ativa a tela solicitada e dispara a animação de entrada fade-scale
    nextView.classList.add("active");
    // Força reflow para garantir que a animação dispara
    void nextView.offsetWidth;
    nextView.classList.add("animate-view");
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
      this.renderNFTsGaller();
      this.renderHistoryTransactions();
    }

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Abre um modal B2 na interface com animação elástica GSAP.
   * 
   * @param {string} modalId - ID do elemento do modal.
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
    }
  }

  /**
   * Fecha um modal B2 na interface com animação suave CSS.
   * 
   * @param {string} modalId - ID do elemento do modal.
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("active");
    }
  }
}
