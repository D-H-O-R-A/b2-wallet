/**
 * B2 Wallet SDK - Provedor Web3 Injetado (window.b2wallet)
 * 
 * Desenvolvido pela equipe sênior sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Este script é injetado diretamente no escopo das páginas web de terceiros (DApps), permitindo
 * que elas solicitem conexões de contas, assinaturas de mensagens e aprovações de transações
 * de forma unificada e segura através de postMessage de navegador.
 */

class B2WalletProvider {
  constructor() {
    this.isB2Wallet = true;
    this.connected = false;
    this.callbacks = new Map();
    this.setupMessageListener();
  }

  /**
   * Método de solicitação principal (Padrão EIP-1193).
   * Canaliza todas as chamadas assíncronas do dApp para o núcleo seguro da carteira.
   * 
   * @param {object} args - Objeto contendo método e parâmetros da requisição.
   * @param {string} args.method - O método RPC solicitado (Ex: 'connect', 'sign_message', 'sign_transaction').
   * @param {object} [args.params] - Parâmetros adicionais exigidos pelo método.
   * @returns {Promise<any>} - Retorna uma promessa com a resposta da carteira após a autenticação.
   */
  async request(args) {
    if (!args || !args.method) {
      throw new Error("B2 Wallet SDK: O argumento 'method' é obrigatório.");
    }

    if (typeof globalThis.b2SdkRequestId === 'undefined') {
      globalThis.b2SdkRequestId = 1;
    }
    const requestId = 'b2_req_' + (globalThis.b2SdkRequestId++) + '_' + Date.now();

    return new Promise((resolve, reject) => {
      // Registra os handlers de callback para esta requisição específica
      this.callbacks.set(requestId, { resolve, reject });

      // Dispara a mensagem bidirecional no window para escuta do app central/extensão
      window.postMessage({
        source: 'b2-wallet-sdk',
        id: requestId,
        method: args.method,
        params: args.params || {}
      }, '*');

      // Define um timeout de 3 minutos de segurança para evitar promessas infinitas
      const timer = setTimeout(() => {
        if (this.callbacks.has(requestId)) {
          const cb = this.callbacks.get(requestId);
          this.callbacks.delete(requestId);
          cb.reject(new Error(`B2 Wallet SDK: Tempo limite esgotado para o método '${args.method}'.`));
        }
      }, 180000);
      if (timer && typeof timer.unref === 'function') {
        timer.unref();
      }
    });
  }

  /**
   * Ouve as respostas retornadas de forma assíncrona pelo barramento central da carteira.
   */
  setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Aceita apenas mensagens legítimas originadas no Core da B2 Wallet
      if (!event.data || event.data.source !== 'b2-wallet-core') return;

      const { id, result, error } = event.data;
      
      // Confere se existe um callback pendente para este ID de requisição
      if (this.callbacks.has(id)) {
        const { resolve, reject } = this.callbacks.get(id);
        this.callbacks.delete(id);

        if (error) {
          reject(new Error(error));
        } else {
          resolve(result);
        }
      }
    });
  }
}

// Injeta o provedor no escopo global para acesso idêntico a carteiras padrão/DApps Web3
if (typeof window !== 'undefined' && !window.b2wallet) {
  window.b2wallet = new B2WalletProvider();
  console.log("[B2 Wallet SDK] Provedor `window.b2wallet` injetado e ativo com sucesso no escopo global.");
}

if (typeof module !== 'undefined') {
  module.exports = B2WalletProvider;
}
