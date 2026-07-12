/**
 * B2 Wallet - UI Renderer Core
 * 
 * Este arquivo define a classe base UIRenderer.
 * Seus métodos e responsabilidades foram modularizados em arquivos específicos
 * no mesmo diretório, estendendo o protótipo da classe (UIRenderer.prototype).
 */

class UIRenderer {
  constructor() {
    this.currentViewId = "view-welcome";
  }
}

// Inicialização da instância global do renderizador
if (typeof window !== 'undefined') {
  window.B2UIRenderer = new UIRenderer();
}
