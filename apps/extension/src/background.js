/**
 * B2 Wallet - Background Service Worker (Manifest V3)
 * 
 * Lida com o roteamento de requisições Web3 seguras recebidas de DApps através do Content Script.
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Ouve apenas mensagens originadas pelo content script do B2 Wallet
  if (!message || message.source !== 'b2-wallet-content-script') return;

  console.log("[B2 Wallet Background] Requisição recebida:", message);

  // Aqui as mensagens seriam direcionadas para a popup ou tratadas em background.
  // Simulamos o fluxo de consulta ou aprovação assíncrona.
  handleDAppRequest(message)
    .then(result => {
      sendResponse({ source: 'b2-wallet-background', id: message.id, result });
    })
    .catch(error => {
      sendResponse({ source: 'b2-wallet-background', id: message.id, error: error.message });
    });

  return true; // Mantém a porta de comunicação aberta para resposta assíncrona
});

async function handleDAppRequest(request) {
  const { method, params } = request;

  switch (method) {
    case 'b2_accounts':
      // Retorna as contas conectadas (em produção consultaria o storage seguro)
      return {
        evm: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        solana: "H7m6XGq6b8mZ4UeA1jL7F7q7W9p4B8X7o7K8t7h8V7m"
      };
    
    case 'b2_signTransaction':
      console.log("[B2 Wallet Background] Assinatura de transação solicitada para:", params);
      // Simula uma transação aprovada de forma segura
      return {
        signature: "0x82fca62d55682823812cf9df72834b19280d9441cf830a6c62c93043126f5546"
      };

    default:
      throw new Error(`B2 Wallet SDK: Método '${method}' não suportado ou em desenvolvimento.`);
  }
}
