/**
 * B2 Wallet - Content Script (Manifest V3)
 * 
 * Injeta o SDK Web3 global na página e atua como ponte segura bidirecional
 * entre a página Web (DApp) e o Background Service Worker da Extensão.
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 */

// O SDK Web3 (b2-wallet-sdk.js) é injetado nativamente no escopo principal (MAIN world)
// através do manifest.json da extensão para total conformidade com CSP em Manifest V3.
// O script content.js atua exclusivamente como ponte segura bidirecional.


// 2. Escuta mensagens enviadas pelo SDK injetado na página (DApp) e encaminha para o background worker
window.addEventListener('message', (event) => {
  // Filtra apenas mensagens legítimas vindas do SDK
  if (event.source !== window || !event.data || event.data.source !== 'b2-wallet-sdk') return;

  const { id, method, params } = event.data;

  // Envia de forma segura para o background.js da extensão
  chrome.runtime.sendMessage({
    source: 'b2-wallet-content-script',
    id,
    method,
    params
  }, (response) => {
    // Trata erros de conexão da extensão desativada ou recarregada
    if (chrome.runtime.lastError) {
      window.postMessage({
        source: 'b2-wallet-core',
        id,
        error: "B2 Wallet Extensão: Conexão com o serviço de background indisponível."
      }, '*');
      return;
    }

    if (response) {
      // Devolve o resultado para a página para que o SDK possa resolver a promessa
      window.postMessage({
        source: 'b2-wallet-core',
        id: response.id,
        result: response.result,
        error: response.error
      }, '*');
    }
  });
});
