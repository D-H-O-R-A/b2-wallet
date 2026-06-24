# Especificação Técnica do SDK - B2 Wallet

Para permitir que aplicações web de terceiros (DApps) se conectem e façam chamadas seguras na **B2 Wallet**, desenvolvemos o **B2 Wallet SDK**. Ele opera de forma idêntica à MetaMask ou ao Phantom, fornecendo uma API unificada, limpa e padronizada sob o barramento global do navegador.

Este documento especifica a arquitetura da ponte e o protocolo de comunicação bidirecional desenvolvidos pela equipe sênior sob a direção do **Tech Lead Diego Oris (Better2Better)**.

---

## 1. Arquitetura da Injeção de Provedor (In-Page Provider)

O SDK da B2 Wallet funciona através de dois componentes de software que operam em sandboxes isolados:

1. **In-Page Script (Provedor Injetado)**: Um script JavaScript leve injetado diretamente no escopo de execução da página web do DApp. Ele expõe o objeto global `window.b2wallet`.
2. **Wallet Core (Aplicativo / Extensão)**: O núcleo seguro da B2 Wallet, que ouve as mensagens vindas do In-Page Script, processa as solicitações, solicita confirmações visuais ao usuário e retorna as respostas assinadas de volta ao dApp.

```
+-----------------------------------+             +----------------------------------+
|          CONTEXTO DO DAPP         |             |       CONTEXTO DA B2 WALLET      |
|  (Ex: uniswap.org / playground)   |             |     (Aplicativo ou Extensão)     |
+-----------------------------------+             +----------------------------------+
|                                   |             |                                  |
|   [ Código do DApp ]              |             |                                  |
|         |                         |             |                                  |
|         v                         |             |                                  |
|   [ window.b2wallet.request() ]   |             |                                  |
|         |                         |             |                                  |
|         +---(window.postMessage)--------------->|   [ Ouve Evento 'b2-request' ]   |
|                                   |             |                 |                |
|                                   |             |                 v                |
|                                   |             |       [ Dispara Prompt UI ]      |
|                                   |             |     (Senha/PIN -> Assinatura)    |
|                                   |             |                 |                |
|                                   |             |                 v                |
|   [ Atualiza UI do DApp ]         |             |      [ Gera Assinatura/Contas ]  |
|         ^                         |             |                 |                |
|         |                         |             |                 |                |
|         +---(window.postMessage)----------------+-----------------+                |
|                                   |             |                                  |
+-----------------------------------+             +----------------------------------+
```

---

## 2. API Global `window.b2wallet`

O provedor injetado implementa a interface padrão de provedores Web3 (EIP-1193 compatível), adaptada para suportar múltiplos ecossistemas cripto de uma só vez (EVM, Solana, Bitcoin, etc.):

### 2.1 Conexão de Contas (`connect`)
Solicita ao usuário autorização para compartilhar seus endereços públicos de blockchains com o dApp de terceiros.
```javascript
b2wallet.request({ method: 'connect' })
  .then(accounts => {
    console.log("Contas Autorizadas:", accounts);
    // Retorna um mapeamento de endereços por rede
    // Ex: { "EVM": "0x742d...", "Solana": "3P9a...", "Bitcoin": "bc1q..." }
  })
  .catch(error => {
    console.error("Conexão recusada pelo usuário:", error.message);
  });
```

### 2.2 Assinatura de Mensagem (`sign_message`)
Solicita que a carteira assine criptograficamente uma string de texto usando a chave privada da rede selecionada.
```javascript
b2wallet.request({
  method: 'sign_message',
  params: {
    network: 'EVM', // ou 'Solana', 'Bitcoin', etc.
    message: 'Login em Better2Better DApp'
  }
})
.then(signature => {
  console.log("Assinatura Criptográfica:", signature);
})
.catch(err => {
  console.error("Assinatura cancelada:", err.message);
});
```

### 2.3 Assinatura de Transações (`sign_transaction`)
Solicita a assinatura de uma transação completa. A B2 Wallet exigirá a verificação imediata do PIN/Senha do usuário, validando que nenhuma transação pode ser gerada ou enviada à blockchain sem consentimento expresso.
```javascript
b2wallet.request({
  method: 'sign_transaction',
  params: {
    network: 'EVM',
    transaction: {
      to: '0x9965ab3d1a0d8291a27e...',
      value: '100000000000000000', // 0.1 ETH em wei
      gasLimit: '21000',
      data: '0x'
    }
  }
})
.then(signedTx => {
  console.log("Transação Assinada com Sucesso:", signedTx);
});
```

---

## 3. Protocolo de PostMessage Seguro

Para mitigar ataques de personificação (onde scripts maliciosos tentam simular ser o SDK da carteira), a comunicação interna entre o dApp e a B2 Wallet utiliza um canal de troca de mensagens estruturado com identificadores criptográficos únicos (nonces).

### 3.1 Estrutura da Requisição
Toda mensagem enviada pelo DApp ao núcleo do sistema possui o seguinte formato:
```json
{
  "source": "b2-wallet-inpage",
  "id": "req-98ac-482a-bd1e",
  "method": "connect",
  "params": {}
}
```

### 3.2 Estrutura da Resposta
O núcleo de segurança da B2 Wallet responde à requisição de forma assíncrona, enviando de volta uma mensagem que corresponde exatamente ao `id` da requisição original:
```json
{
  "source": "b2-wallet-core",
  "id": "req-98ac-482a-bd1e",
  "result": {
    "EVM": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "Solana": "3P9aB8f7C6d5E4f3G2h1I0jK"
  },
  "error": null
}
```

O SDK da B2 Wallet mantém um mapa de promessas pendentes em memória, resolvendo (`resolve`) ou rejeitando (`reject`) as chamadas originais assim que os dados criptográficos são gerados após o usuário fornecer a sua senha de transação.

---

O SDK da B2 Wallet é a porta de entrada para que novos desenvolvedores e empresas integrem o ecossistema financeiro descentralizado da B2 Wallet em seus próprios softwares, com segurança e velocidade.

**Better2Better - Tecnologia Confiável e Descentralizada**
*(c) 2026 better2better.com.br - Todos os direitos reservados.*
