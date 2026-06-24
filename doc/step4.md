# Passo 4: Integração Ativa de RPCs Públicos e Customização de Nós
---

Este documento técnico apresenta os mecanismos de conectividade com a rede descentralizada e as APIs de consulta adotados na **B2 Wallet**. Em conformidade com as regras estritas do projeto, **não são tolerados dados estáticos, saldos fictícios ou simulações locais (No Mock Data)**. O saldo do usuário e o histórico de transações são resolvidos diretamente em nós e RPCs públicos.

Supervisão técnica do **Tech Lead Diego Oris (Better2Better)**.

---

## 1. Arquitetura do Motor de Conexão RPC Reativo

A B2 Wallet possui uma camada reativa assíncrona baseada em HTTP REST e JSON-RPC que realiza consultas paralelas no momento do desbloqueio da carteira:

```
                          [ B2 Wallet Core Engine ]
                                     |
           +-------------------------+-------------------------+
           |                         |                         |
           v                         v                         v
     [ RPC Parser ]            [ RPC Parser ]            [ RPC Parser ]
       Bitcoin API                JSON-RPC                  Waves REST
           |                         |                         |
           v                         v                         v
  https://blockstream.info   https://polygon-rpc.com    https://nodes.wavesnodes.com
```

### 1.1 Resolução Paralela Assíncrona
Para evitar latência ou congelamento de UI durante a consulta paralela de 17+ blockchains, o core emite requisições as síncronas usando `Promise.allSettled`. Isso garante que se uma rede estiver instável ou offline, as demais redes carregarão seus saldos reais normalmente sem afetar a usabilidade geral do app.

---

## 2. Endpoints e Protocolos Reais por Família de Redes

### 2.1 Família Bitcoin (REST API)
As moedas derivadas da arquitetura UTXO clássica utilizam endpoints públicos REST e parsers de transações em tempo real:
* **Bitcoin (BTC)**:
  * *Endpoint*: `https://blockstream.info/api/`
  * *Rota*: `/address/{address}`
  * *Algoritmo de Saldo*: Soma de todas as transações UTXO recebidas menos as UTXOs gastas.
* **Litecoin (LTC)**:
  * *Endpoint*: `https://litecoinspace.org/api/`
* **Bitcoin Cash (BCH)**:
  * *Endpoint*: `https://rest.bitcoin.com/v2/`

### 2.2 Família EVM (JSON-RPC)
As blockchains baseadas em Ethereum utilizam o formato padrão JSON-RPC via método `eth_getBalance`:
* **Ethereum Mainnet (ETH)**: `https://cloudflare-eth.com/`
* **Polygon (POL)**: `https://polygon-rpc.com/`
* **Avalanche C-Chain (AVAX)**: `https://api.avax.network/ext/bc/C/rpc`
* **Binance Smart Chain (BNB)**: `https://bsc-dataseed.binance.org/`
* **Arbitrum (ARB)**: `https://arb1.arbitrum.io/rpc`
* **Optimism (OP)**: `https://mainnet.optimism.io/`

*Exemplo de payload JSON-RPC para consulta de saldo real:*
```json
{
  "jsonrpc": "2.0",
  "method": "eth_getBalance",
  "params": ["0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5", "latest"],
  "id": 1
}
```

### 2.3 Família Waves & Forks (REST API Oficial)
* **Waves (WAVES)**: `https://nodes.wavesnodes.com/`
  * *Rota*: `/addresses/balance/{address}`
* **Turtle Network (TN)**: `https://nodes.turtlenetwork.eu/`

### 2.4 Demais Cadeias Nativas (Protocolos Dedicados)
* **Solana (SOL)**: `https://api.mainnet-beta.solana.com/` (JSON-RPC método `getBalance`)
* **Cardano (ADA)**: `https://api.koios.rest/api/v1/`
* **Tron (TRX)**: `https://api.trongrid.io/`
* **Stellar (XLM)**: `https://horizon.stellar.org/`

---

## 3. Gestão e Inclusão de Custom RPCs e Forks do Usuário

Um diferencial central da B2 Wallet é permitir que desenvolvedores e usuários avançados adicionem suas próprias blockchains criadas a partir de forks das redes padrão.

### 3.1 Interface de Adição de Rede Customizada
O usuário pode preencher um formulário simples contendo:
1. **Nome da Rede**: (Ex: *B2 Testnet*)
2. **Símbolo da Moeda**: (Ex: *B2T*)
3. **Caminho de Derivação (BIP-44)**: (Ex: `m/44'/60'/0'/0/0`)
4. **URL de RPC**: (Ex: `https://rpc.better2better.com.br`)
5. **Chain ID** (Se for EVM): (Ex: `9922`)

### 3.2 Persistência e Segurança de Redes Personalizadas
As configurações de redes customizadas adicionadas pelo usuário são salvas no banco de dados local criptografado ou em cache persistente do dispositivo. No momento do bootstrap do aplicativo, o motor de chaves lê os caminhos de derivação personalizados e cria os endereços de recepção públicos dinamicamente, permitindo compatibilidade infinita com blockchains emergentes.

---

**Better2Better - Tecnologia Confiável e Descentralizada**
*(c) 2026 better2better.com.br - Todos os direitos reservados.*
