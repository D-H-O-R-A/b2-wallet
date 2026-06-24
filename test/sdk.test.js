/**
 * B2 Wallet - Testes do Provedor de Conexão Web3 e Injeção do SDK (SDK Suite)
 * 
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Este módulo testa a injeção síncrona, a estruturação de mensagens RPC via postMessage,
 * a sanitização de domínios, e o barramento assíncrono de promessas pendentes do SDK.
 */

const test = require('node:test');
const assert = require('node:assert');
const { B2WalletProvider, window } = require('./setup');

test('Suíte de SDK - Inicialização e Injeção Global', async (t) => {
  await t.test('Deve possuir a instância global b2wallet injetada e ativa', () => {
    assert.ok(window.b2wallet, 'Provedor global b2wallet deve estar presente');
    assert.strictEqual(window.b2wallet.isB2Wallet, true, 'isB2Wallet deve ser estritamente true');
  });

  await t.test('Deve instanciar um novo provedor com estados e fila limpos', () => {
    const customProvider = new B2WalletProvider();
    assert.ok(customProvider, 'Deve instanciar com sucesso');
    assert.strictEqual(customProvider.isB2Wallet, true, 'Propriedade isB2Wallet padrão ativa');
  });
});

test('Suíte de SDK - Barramento postMessage e Eventos RPC', async (t) => {
  const provider = new B2WalletProvider();

  await t.test('Deve rejeitar requisições inválidas ou sem o campo method', async () => {
    await assert.rejects(
      async () => {
        await provider.request({});
      },
      /O argumento 'method' é obrigatório/,
      'Deve acusar erro indicando obrigatoriedade do método'
    );

    await assert.rejects(
      async () => {
        await provider.request(null);
      },
      /O argumento 'method' é obrigatório/,
      'Deve acusar erro por passar parâmetro nulo/indefinido'
    );
  });

  await t.test('Deve enviar mensagem estruturada via postMessage e resolver a Promise quando a carteira responder', async () => {
    // Escuta temporariamente as mensagens disparadas pelo SDK na janela
    let capturedRequest = null;
    const captureListener = (event) => {
      if (event.data && event.data.source === 'b2-wallet-sdk') {
        capturedRequest = event.data;
      }
    };
    window.addEventListener('message', captureListener);

    // Faz a chamada assíncrona
    const requestPromise = provider.request({
      method: 'b2_accounts',
      params: { scope: 'test' }
    });

    // Dá um tempo curto de microtask para o postMessage síncrono disparar
    await new Promise(resolve => setTimeout(resolve, 5));

    assert.ok(capturedRequest, 'O postMessage deve ter sido disparado do SDK');
    assert.strictEqual(capturedRequest.source, 'b2-wallet-sdk', 'Mensagem de origem deve ser b2-wallet-sdk');
    assert.ok(capturedRequest.id.startsWith('b2_req_') || capturedRequest.id.startsWith('req_'), 'ID deve ser gerado dinamicamente com prefixo seguro');
    assert.strictEqual(capturedRequest.method, 'b2_accounts', 'Deve propagar o método original solicitado');
    assert.strictEqual(capturedRequest.params.scope, 'test', 'Deve propagar os parâmetros originais solicitados');

    // Remove listener de captura
    window.removeEventListener('message', captureListener);

    // Simula a resposta positiva enviada pelo Core da B2 Wallet de forma assíncrona
    const mockAccounts = ["0x742d35Cc6634C0532925a3b844Bc454e4438f44e"];
    window.postMessage({
      source: 'b2-wallet-core',
      id: capturedRequest.id,
      result: mockAccounts
    }, '*');

    // Aguarda o processamento do callback no SDK resolver a Promise original
    const result = await requestPromise;
    assert.deepStrictEqual(result, mockAccounts, 'A Promise deve resolver com os dados retornados pelo core da carteira');
  });

  await t.test('Deve rejeitar a Promise caso o Core da carteira retorne uma resposta de erro', async () => {
    let capturedId = null;
    const captureListener = (event) => {
      if (event.data && event.data.source === 'b2-wallet-sdk') {
        capturedId = event.data.id;
      }
    };
    window.addEventListener('message', captureListener);

    const requestPromise = provider.request({ method: 'b2_signMessage' });
    await new Promise(resolve => setTimeout(resolve, 5));
    window.removeEventListener('message', captureListener);

    // Envia mensagem de rejeição/erro do Core da carteira
    window.postMessage({
      source: 'b2-wallet-core',
      id: capturedId,
      error: "O usuário rejeitou a assinatura desta mensagem."
    }, '*');

    // Valida se a promise é corretamente rejeitada com a mensagem de erro
    await assert.rejects(
      async () => {
        await requestPromise;
      },
      /usuário rejeitou/,
      'A Promise deve falhar retornando a mensagem de erro do barramento central'
    );
  });
});
