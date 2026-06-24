/**
 * B2 Wallet — Provedor de RPC com Failover Elástico (B2RpcProvider)
 *
 * Provê requisições HTTP JSON-RPC altamente resilientes, implementando
 * retentativas automáticas, controle de timeouts, circuit breaker temporário
 * para nós caídos/instáveis e balanceamento de carga básico.
 *
 * Desenvolvido por Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  // Armazena o estado de saúde dos RPCs (Circuit Breaker)
  const rpcStatusCache = {}; // { "url": { failures: 0, lastFailureTime: 0 } }
  const CIRCUIT_BREAKER_COOLDOWN = 30000; // 30 segundos de suspensão do nó
  const DEFAULT_TIMEOUT = 5000; // Timeout padrão de 5 segundos por chamada RPC

  const B2RpcProvider = {
    /**
     * Executa uma chamada JSON-RPC para uma determinada rede EVM com failover elástico.
     *
     * @param {string} networkKey - Chave identificadora da rede (ex: 'ETH', 'SONIC').
     * @param {string} method - Método JSON-RPC (ex: 'eth_getBalance').
     * @param {Array} params - Parâmetros do método.
     * @param {object} [options] - Configurações opcionais (timeout, retries).
     * @returns {Promise<any>} - Retorna o resultado direto da chamada RPC ('result' do JSON-RPC).
     */
    async fetchRpcWithFailover(networkKey, method, params = [], options = {}) {
      const registry = global.B2EvmNetworkRegistry;
      if (!registry) {
        throw new Error('B2EvmNetworkRegistry is not loaded');
      }

      const netConfig = registry.getNetworkByKey(networkKey);
      if (!netConfig) {
        throw new Error(`EVM Network not found in registry: ${networkKey}`);
      }

      // Combina rpcUrls e fallbackRpcUrls, garantindo URLs únicas e sem duplicados
      const allUrls = Array.from(new Set([...(netConfig.rpcUrls || []), ...(netConfig.fallbackRpcUrls || [])]));
      if (allUrls.length === 0) {
        throw new Error(`No RPC URLs configured for network: ${networkKey}`);
      }

      // Filtra as URLs pelo Circuit Breaker (ignora se estiverem em cooldown)
      const now = Date.now();
      let healthyUrls = allUrls.filter(url => {
        const status = rpcStatusCache[url];
        if (status && status.failures >= 3) {
          if (now - status.lastFailureTime < CIRCUIT_BREAKER_COOLDOWN) {
            return false; // Ignora o RPC instável temporariamente
          } else {
            // Expira o circuit breaker
            status.failures = 0;
          }
        }
        return true;
      });

      // Se todas as URLs falharem no circuit breaker, usa todas como fallback de emergência
      if (healthyUrls.length === 0) {
        healthyUrls = allUrls;
      }

      // Balanceamento elástico simples: rotaciona as URLs saudáveis aleatoriamente por chamada
      healthyUrls.sort((a, b) => a.localeCompare(b));

      let lastError = null;
      const maxRetries = options.retries !== undefined ? options.retries : 1;
      const timeoutMs = options.timeout !== undefined ? options.timeout : DEFAULT_TIMEOUT;

      // Percorre os nós disponíveis tentando executar a requisição
      for (const rpcUrl of healthyUrls) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const result = await this._postRpc(rpcUrl, method, params, timeoutMs);
            // Sucesso! Registra que o nó está operando perfeitamente
            this._registerRpcSuccess(rpcUrl);
            return result;
          } catch (err) {
            lastError = err;
            console.warn(`[B2RpcProvider] Falha no RPC ${rpcUrl} (Método: ${method}, Tentativa: ${attempt + 1}/${maxRetries + 1}):`, err.message || err);
            this._registerRpcFailure(rpcUrl);
            
            // Aguarda um pequeno delay exponencial antes da próxima retentativa se for o mesmo nó
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 300));
            }
          }
        }
      }

      throw new Error(`All RPC endpoints failed for network ${networkKey}. Last error: ${lastError ? lastError.message : 'Unknown'}`);
    },

    /**
     * Realiza o POST bruto para o nó com controle estrito de timeout.
     */
    async _postRpc(rpcUrl, method, params, timeoutMs) {
      const controller = new AborController(); // Simulação ou global do navegador
      const signal = controller ? controller.signal : null;
      let timeoutId = null;

      if (typeof globalThis.rpcRequestId === 'undefined') {
        globalThis.rpcRequestId = 1;
      }
      const payload = {
        jsonrpc: "2.0",
        id: globalThis.rpcRequestId++,
        method: method,
        params: params
      };

      // Configura o timeout real de requisição
      const fetchPromise = fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: signal
      });

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          if (controller) {
            try {
              controller.abort();
            } catch(e) {}
          }
          reject(new Error(`Timeout of ${timeoutMs}ms exceeded`));
        }, timeoutMs);
      });

      try {
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP Error Status: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.error) {
          throw new Error(`JSON-RPC Error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        if (!data || data.result === undefined) {
          throw new Error('Invalid JSON-RPC response format');
        }

        return data.result;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    },

    _registerRpcSuccess(url) {
      rpcStatusCache[url] = { failures: 0, lastFailureTime: 0 };
    },

    _registerRpcFailure(url) {
      if (!rpcStatusCache[url]) {
        rpcStatusCache[url] = { failures: 0, lastFailureTime: 0 };
      }
      rpcStatusCache[url].failures++;
      rpcStatusCache[url].lastFailureTime = Date.now();
    }
  };

  // Compatibilidade com AbortController em ambientes node/browser mais antigos
  const AborController = global.AbortController || function() {
    this.signal = null;
    this.abort = function() {};
  };

  // Exportação no escopo global
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2RpcProvider;
  }
  if (global.window) {
    global.window.B2RpcProvider = B2RpcProvider;
  } else {
    global.B2RpcProvider = B2RpcProvider;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
