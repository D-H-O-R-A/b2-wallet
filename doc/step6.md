# Passo 6: Arquitetura do B2 Wallet SDK e Provedor Injetado Web3
---

Este documento técnico descreve o funcionamento, a segurança e as especificações de injeção da biblioteca **B2 Wallet SDK**. Desenvolvido com uma API idêntica e compatível com os preceitos clássicos da MetaMask, o SDK permite que dApps externos (Sites Web3, Playgrounds, Finanças Descentralizadas) façam chamadas criptográficas estruturadas na B2 Wallet de maneira descentralizada e 100% segura.

Supervisão técnica do **Tech Lead Diego Oris (Better2Better)**.

---

## 1. Funcionamento do Provedor Injetado (`window.b2wallet`)

O SDK opera por meio de injeção assíncrona de um objeto de controle global chamado `b2wallet` no contexto do navegador ou runtime Webview:

```
+------------------+                        +--------------------+
|  DApp / Website  |                        |  B2 Wallet App     |
+--------+---------+                        +---------+----------+
         |                                            |
         | --- window.b2wallet.request(method) -----> |
         |                                            |  [Exige PIN / Senha]
         |                                            |  [Confirmação de Ação]
         | <--- postMessage (Result / Signature) ---- |
         v                                            v
```

Ao rodar como uma Extensão ou aplicativo móvel, o sistema injeta o script `b2-wallet-sdk.js` logo no início do carregamento do documento (`run_at: document_start`). Isso garante que, desde o primeiro milissegundo de execução, qualquer framework dApp (como ethers.js ou web3.js) consiga ler e instanciar o provedor para conexões de carteira.

---

## 2. Protocolo de Comunicação por Canais Seguros (`postMessage`)

Uma vez que o contexto da dApp (Página web convencional) e a carteira criptográfica rodam em ambientes isolados com privilégios diferentes, a comunicação bidirecional ocorre por meio de canais seguros de mensageria da janela ativa (`window.postMessage`):

### 2.1 Envio de Requisição RPC (DApp -> Core)
O script injetado empacota os parâmetros de solicitação gerando um identificador de mensagem exclusivo de 128-bits (ID) e envia ao listener central do aplicativo:
```js
window.postMessage({
  source: 'b2-wallet-sdk',
  id: 'req_a9f87cde28ea30c71a39f046',
  method: 'sign_transaction',
  params: {
    network: 'EVM',
    transaction: {
      to: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
      value: '1000000000000000000' // 1 ETH em Wei
    }
  }
}, '*');
```

### 2.2 Tratamento no Core e Resposta (Core -> DApp)
O ouvinte do barramento no aplicativo B2 Wallet:
1. Intercepta a requisição.
2. Se a carteira estiver bloqueada, rejeita a ação instruindo o dApp a aguardar o login do usuário.
3. Se a carteira estiver desbloqueada, exibe o popup interno do sistema ao usuário, mostrando os detalhes da transação real obtida das RPCs reais daquela blockchain.
4. Exige que o usuário autorize a operação digitando seu PIN de 6 dígitos (se logado há menos de 30 minutos) ou a senha mestre.
5. Se autorizado, assina a mensagem criptograficamente com a chave privada correta derivada da semente única BIP-44 correspondente à rede selecionada.
6. Retorna o resultado assinado de volta ao dApp contendo o hash binário de transação ou token de assinatura correspondente:

```js
window.postMessage({
  source: 'b2-wallet-core',
  id: 'req_a9f87cde28ea30c71a39f046',
  result: '0xhash_a9f87cde28ea30c71a39f046b0de8e1782bcde94751abf3b0c82de94751ab12c',
  error: null
}, '*');
```

---

## 3. Gestão e Controle de Autorizações de dApps

Para resguardar a privacidade e o saldo dos usuários do app de invasões fantasmas de sites maliciosos, a B2 Wallet impõe políticas restritivas de compartilhamento de metadados:

* **Controle de Domínios**: O aplicativo mantém uma lista branca local de conexões ativas. Uma dApp *nunca* tem permissão de ler os endereços públicos do usuário nas 17 blockchains sem disparar uma solicitação inicial explícita de conexão (`connect`) para obter consentimento visual.
* **Isolamento de Chaves Privadas**: O SDK *nunca*, sob nenhuma hipótese, expõe chaves privadas ou a semente mestre BIP-39 fora do domínio seguro da B2 Wallet. Toda assinatura é gerada de forma local no core criptográfico e devolvida pronta ao dApp.
* **Bloqueio de Clickjacking**: Os modais de confirmação de transação ignoram eventos de cliques artificiais gerados por scripts da dApp para impedir que sites maliciosos simulem confirmações forçadas do usuário.

---

**Better2Better - Tecnologia Confiável e Descentralizada**
*(c) 2026 better2better.com.br - Todos os direitos reservados.*
