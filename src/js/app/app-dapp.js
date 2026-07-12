/**
 * B2 Wallet - Módulo de SDK de Conexão com dApps via postMessage e API Bridge para B2WalletApp.
 */

B2WalletApp.prototype.setupSDKMessageListener = function() {
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
};
