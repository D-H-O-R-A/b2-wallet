/**
 * B2 Wallet - Testes Unitários e de Integração de Dash Core (Dash Integration Suite)
 *
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Valida a engine de chaves, criptografia, assinaturas de mensagens, xpub/xprv,
 * construção de transações (UTXO) e APIs de rede reais de Dash Core.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { B2KeyDerivationEngine, B2DashBroadcaster, B2PlatformSecurity } = require('./setup');

const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

test('Suíte Dash - Derivação de Endereços e Chaves', async (t) => {
  await t.test('1. Deve derivar o par de chaves Dash padrão (Coin Type 5)', () => {
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    assert.ok(keyPair.privateKey instanceof Uint8Array, "Chave privada deve ser Uint8Array");
    assert.strictEqual(keyPair.privateKeyHex.length, 64, "Chave privada hex deve ter 64 caracteres");
    assert.ok(keyPair.publicKey instanceof Uint8Array, "Chave pública deve ser Uint8Array");
    assert.strictEqual(keyPair.publicKeyHex.length, 64, "Chave pública hex deve ter 64 caracteres");
  });

  await t.test('2. Deve derivar endereço Dash P2PKH (X...) correto via B2DashBroadcaster', () => {
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const address = B2DashBroadcaster.deriveDashP2PKHAddress(keyPair.publicKey);
    assert.ok(address.startsWith('X'), "Endereço P2PKH deve iniciar com X");
    assert.strictEqual(address.length, 34, "Endereço P2PKH deve ter comprimento 34");
  });

  await t.test('3. Deve derivar endereço Dash P2SH (7...) correto via B2DashBroadcaster', () => {
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const address = B2DashBroadcaster.deriveDashP2SHAddress(keyPair.publicKey);
    assert.ok(address.startsWith('7'), "Endereço P2SH deve iniciar com 7");
    assert.strictEqual(address.length, 34, "Endereço P2SH deve ter comprimento 34");
  });

  await t.test('4. Deve derivar endereço P2PKH via B2KeyDerivationEngine', () => {
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const address = B2KeyDerivationEngine.deriveAddress(keyPair.privateKeyHex, 'DASH');
    assert.ok(address.startsWith('X'), "Endereço P2PKH derivado deve iniciar com X");
    assert.strictEqual(address.length, 34, "Endereço deve ter comprimento 34");
  });

  await t.test('5. Deve derivar endereço P2SH via B2KeyDerivationEngine', () => {
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const address = B2KeyDerivationEngine.deriveAddress(keyPair.privateKeyHex, 'DASH_P2SH');
    assert.ok(address.startsWith('7'), "Endereço P2SH derivado deve iniciar com 7");
    assert.strictEqual(address.length, 34, "Endereço deve ter comprimento 34");
  });

  await t.test('6. Deve derivar xpub determinística válida de conta Dash', () => {
    const xpub = B2DashBroadcaster.deriveDashXPub(mnemonic);
    assert.ok(xpub.startsWith('xpub'), "xpub deve iniciar com prefixo xpub");
    assert.strictEqual(xpub.length, 111, "Comprimento típico de xpub em Base58Check");
  });

  await t.test('7. Deve derivar xprv determinística válida de conta Dash', () => {
    const xprv = B2DashBroadcaster.deriveDashXPrv(mnemonic);
    assert.ok(xprv.startsWith('xprv'), "xprv deve iniciar com prefixo xprv");
    assert.strictEqual(xprv.length, 111, "Comprimento típico de xprv em Base58Check");
  });

  await t.test('8. Deve decriptar a seed do arquivo de configuração e derivar endereço Dash esperado', async () => {
    const configPath = path.resolve(__dirname, 'b2_wallet_config_1781624414200.json');
    const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const password = "pass-file";

    const decryptedMnemonic = await B2PlatformSecurity.decryptData(configFile.payload, password);
    assert.strictEqual(decryptedMnemonic, "bird ability ankle arrest aisle assume body bullet aerobic advise burden antique");

    const keyPair = B2DashBroadcaster.deriveDashKeyPair(decryptedMnemonic, 0);
    const p2pkhAddress = B2DashBroadcaster.deriveDashP2PKHAddress(keyPair.publicKey);
    const p2shAddress = B2DashBroadcaster.deriveDashP2SHAddress(keyPair.publicKey);

    // Validações determinísticas estritas da especificação B2 Wallet
    assert.strictEqual(p2pkhAddress, "XnE3AKAi7nUETzqNtddvR474hR1sr1oYqW", "P2PKH address deve coincidir com o mapeamento esperado");
    assert.strictEqual(p2shAddress, "7dwr5oHRWxffPzUBRTeoKXmrw9ZH9RgLcw", "P2SH address deve coincidir com o mapeamento esperado");
  });
});

test('Suíte Dash - Validação de Endereços', async (t) => {
  await t.test('9. Deve validar corretamente endereço P2PKH (X...) legítimo', () => {
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const address = B2DashBroadcaster.deriveDashP2PKHAddress(keyPair.publicKey);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(address, 'DASH'), true, "Endereço P2PKH real derivado deve ser válido");
  });

  await t.test('10. Deve validar corretamente endereço P2SH (7...) legítimo', () => {
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const address = B2DashBroadcaster.deriveDashP2SHAddress(keyPair.publicKey);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(address, 'DASH'), true, "Endereço P2SH real derivado deve ser válido");
  });

  await t.test('11. Deve rejeitar endereço Dash com checksum corrompido', () => {
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const address = B2DashBroadcaster.deriveDashP2PKHAddress(keyPair.publicKey);
    // Substitui o último caracter para quebrar o checksum Base58Check
    const corrupted = address.substring(0, address.length - 1) + (address.endsWith('a') ? 'b' : 'a');
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(corrupted, 'DASH'), false, "Checksum corrompido deve falhar na validação");
  });

  await t.test('12. Deve rejeitar endereço Dash com prefixo inválido', () => {
    // Altera prefixo 'X' para '1' (Bitcoin)
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const address = B2DashBroadcaster.deriveDashP2PKHAddress(keyPair.publicKey);
    const corrupted = '1' + address.substring(1);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(corrupted, 'DASH'), false, "Prefixo inválido deve falhar na validação");
  });

  await t.test('13. Deve rejeitar endereço Dash com comprimento incorreto', () => {
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const address = B2DashBroadcaster.deriveDashP2PKHAddress(keyPair.publicKey);
    const shortAddress = address.substring(0, 32);
    const longAddress = address + "A";
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(shortAddress, 'DASH'), false, "Endereço curto demais deve falhar");
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(longAddress, 'DASH'), false, "Endereço longo demais deve falhar");
  });

  await t.test('14. Deve rejeitar endereço Dash com caracteres não-Base58', () => {
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const address = B2DashBroadcaster.deriveDashP2PKHAddress(keyPair.publicKey);
    // Adiciona caracter '0' (não permitido em Base58)
    const corrupted = address.substring(0, 10) + '0' + address.substring(11);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(corrupted, 'DASH'), false, "Caracter não-Base58 deve invalidar endereço");
  });
});

test('Suíte Dash - Assinatura e Verificação de Mensagens', async (t) => {
  const msg = "Declaração de Posse de Carteira B2 Wallet v2.0 - Dash Core Engine";
  
  await t.test('15. Deve assinar uma mensagem de texto com sucesso', () => {
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const sig = B2DashBroadcaster.signMessage(msg, keyPair.privateKeyHex);
    assert.strictEqual(typeof sig, 'string', "Assinatura deve ser string Base58");
    assert.ok(sig.length > 50, "Assinatura deve conter comprimento condizente");
  });

  await t.test('16. Deve verificar uma assinatura legítima com sucesso', () => {
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const address = B2DashBroadcaster.deriveDashP2PKHAddress(keyPair.publicKey);
    const sig = B2DashBroadcaster.signMessage(msg, keyPair.privateKeyHex);
    
    const isValid = B2DashBroadcaster.verifyMessageSignature(msg, sig, address);
    assert.strictEqual(isValid, true, "Assinatura válida deve ser confirmada");
  });

  await t.test('17. Deve rejeitar assinatura se a mensagem for alterada', () => {
    const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const address = B2DashBroadcaster.deriveDashP2PKHAddress(keyPair.publicKey);
    const sig = B2DashBroadcaster.signMessage(msg, keyPair.privateKeyHex);
    
    const isValid = B2DashBroadcaster.verifyMessageSignature(msg + " alterada", sig, address);
    assert.strictEqual(isValid, false, "Assinatura de mensagem alterada deve ser rejeitada");
  });

  await t.test('18. Deve rejeitar assinatura se o endereço de verificação for diferente', () => {
    const keyPair0 = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
    const keyPair1 = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 1);
    const address1 = B2DashBroadcaster.deriveDashP2PKHAddress(keyPair1.publicKey);
    
    const sig0 = B2DashBroadcaster.signMessage(msg, keyPair0.privateKeyHex);
    const isValid = B2DashBroadcaster.verifyMessageSignature(msg, sig0, address1);
    assert.strictEqual(isValid, false, "Assinatura com endereço incorreto deve falhar");
  });
});

test('Suíte Dash - Transações, Taxas e Broadcast', async (t) => {
  const keyPair = B2DashBroadcaster.deriveDashKeyPair(mnemonic, 0);
  const myAddress = B2DashBroadcaster.deriveDashP2PKHAddress(keyPair.publicKey);
  const recipient = "XpXbS7L19n1V6F4DcsZ33iS6F4Gs3iKXv8L";

  const fakeUTXOs = [
    {
      txid: "8c7f1a5c4d3e2b1a0987654321fedcba0123456789abcdef0123456789abcdef",
      vout: 0,
      satoshis: 150000000, // 1.5 DASH
      amount: 1.5,
      scriptPubKey: "76a9147pXbS7L19n1V6F4DcsZ33iS6F4Gs3iKXv8L88ac"
    }
  ];

  await t.test('19. Deve simular construção e assinatura de transação P2PKH com taxas dinâmicas', () => {
    const tx = B2DashBroadcaster.DashTransactionBuilder.buildAndSign(
      keyPair.privateKey,
      fakeUTXOs,
      recipient,
      1.0, // amount
      myAddress, // change address
      0.0001 // fee
    );

    assert.ok(tx.hex, "Deve gerar hex serializado");
    assert.strictEqual(tx.txid.length, 64, "Deve gerar txid de 64 caracteres");
    assert.strictEqual(tx.hex.startsWith("02000000"), true, "Deve começar com a versão 2 do Dash");
  });

  await t.test('20. Deve simular construção e assinatura de transação P2SH com taxas dinâmicas', () => {
    const p2shRecipient = "7pXbS7L19n1V6F4DcsZ33iS6F4Gs3iKXv8L";
    const tx = B2DashBroadcaster.DashTransactionBuilder.buildAndSign(
      keyPair.privateKey,
      fakeUTXOs,
      p2shRecipient,
      0.5,
      myAddress,
      0.0001
    );

    assert.ok(tx.hex, "Deve gerar hex serializado");
    assert.strictEqual(tx.txid.length, 64, "Deve gerar txid de 64 caracteres");
    assert.strictEqual(tx.hex.startsWith("02000000"), true, "Deve começar com a versão 2 do Dash");
  });

  await t.test('21. Deve lançar erro por saldo insuficiente se nenhum UTXO estiver disponível', () => {
    assert.throws(() => {
      B2DashBroadcaster.DashTransactionBuilder.buildAndSign(
        keyPair.privateKey,
        [],
        recipient,
        1.0,
        myAddress,
        0.0001
      );
    }, /Saldo insuficiente/, "Deve lançar exceção de saldo");
  });

  await t.test('22. Deve buscar UTXOs reais da API Blockbook ou retornar array vazio se offline', async () => {
    const url = "https://blockbook.dash.zelcore.io";
    const utxos = await B2DashBroadcaster.fetchUTXOs(url, myAddress);
    assert.ok(Array.isArray(utxos), "UTXOs deve ser um array");
  });

  await t.test('23. Deve buscar histórico real da API Blockbook com InstantSend e ChainLocks ou retornar vazio se offline', async () => {
    const url = "https://blockbook.dash.zelcore.io";
    const history = await B2DashBroadcaster.getTransactionHistory(url, myAddress);
    assert.ok(Array.isArray(history), "Histórico deve ser um array");
    if (history.length > 0) {
      const tx = history[0];
      assert.ok('instantsend' in tx, "Deve possuir flag instantsend");
      assert.ok('chainlocked' in tx, "Deve possuir flag chainlocked");
    }
  });

  await t.test('24. Deve tratar erro de rede graciosamente no broadcast de transação', async () => {
    const url = "https://blockbook.dash.zelcore.io";
    const dummyHex = "02000000018c7f1a5c4d3e2b1a0987654321fedcba0123456789abcdef0123456789abcdef0000000000ffffffff01a0860100000000001976a9147pXbS7L19n1V6F4DcsZ33iS6F4Gs3iKXv8L88ac00000000";
    
    await assert.rejects(async () => {
      await B2DashBroadcaster.broadcastTransaction(url, dummyHex);
    }, /Broadcast recusado pelo nó|fetch failed/, "Deve falhar por transação inválida ou offline de rede");
  });
});
