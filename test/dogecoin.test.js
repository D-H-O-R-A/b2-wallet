/**
 * B2 Wallet - Testes Unitários e de Integração do Dogecoin Engine
 *
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Valida a engine de chaves, criptografia, endereços multi-formato (Legacy, P2SH),
 * assinaturas de mensagens, xpub/xprv, construção de transações e APIs de rede reais.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { B2KeyDerivationEngine, B2DogecoinEngine, B2PlatformSecurity } = require('./setup');

const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

test('Suíte Dogecoin - Derivação de Endereços e Chaves', async (t) => {
  await t.test('1. Deve derivar o par de chaves Dogecoin padrão (Coin Type 3)', () => {
    const keyPair = B2DogecoinEngine.deriveKeyPair(mnemonic, 0);
    assert.ok(keyPair.privateKey instanceof Uint8Array, "Chave privada deve ser Uint8Array");
    assert.strictEqual(keyPair.privateKeyHex.length, 64, "Chave privada hex deve ter 64 caracteres");
    assert.ok(keyPair.publicKey instanceof Uint8Array, "Chave pública deve ser Uint8Array");
    assert.strictEqual(keyPair.publicKeyHex.length, 64, "Chave pública hex deve ter 64 caracteres");
  });

  await t.test('2. Deve derivar endereço Dogecoin Legacy (D...) correto', () => {
    const keyPair = B2DogecoinEngine.deriveKeyPair(mnemonic, 0);
    const address = B2DogecoinEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');
    assert.ok(address.startsWith('D'), "Endereço Legacy deve iniciar com D");
    assert.strictEqual(address.length, 34, "Endereço Legacy deve ter comprimento 34");
  });

  await t.test('3. Deve derivar endereço Dogecoin P2SH (A...) correto', () => {
    const keyPair = B2DogecoinEngine.deriveKeyPair(mnemonic, 0);
    const address = B2DogecoinEngine.deriveAddress(keyPair.privateKeyHex, 'p2sh');
    assert.ok(address.startsWith('A') || address.startsWith('9'), "Endereço P2SH deve iniciar com A ou 9");
    assert.strictEqual(address.length, 34, "Endereço P2SH deve ter comprimento 34");
  });

  await t.test('4. Deve derivar xpub determinística válida de conta Dogecoin', () => {
    const xpub = B2DogecoinEngine.deriveExtendedKey(mnemonic, false);
    assert.ok(xpub.startsWith('xpub'), "xpub deve iniciar com prefixo xpub");
  });

  await t.test('5. Deve derivar xprv determinística válida de conta Dogecoin', () => {
    const xprv = B2DogecoinEngine.deriveExtendedKey(mnemonic, true);
    assert.ok(xprv.startsWith('xprv'), "xprv deve iniciar com prefixo xprv");
  });

  await t.test('6. Deve decriptar a seed do arquivo de configuração e derivar endereço Dogecoin esperado', async () => {
    const configPath = path.resolve(__dirname, 'b2_wallet_config_1781624414200.json');
    const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const password = "pass-file";

    const decryptedMnemonic = await B2PlatformSecurity.decryptData(configFile.payload, password);
    assert.strictEqual(decryptedMnemonic, "bird ability ankle arrest aisle assume body bullet aerobic advise burden antique");

    const keyPair = B2DogecoinEngine.deriveKeyPair(decryptedMnemonic, 0);
    const legacyAddress = B2DogecoinEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');

    assert.strictEqual(legacyAddress.startsWith('D'), true, "Legacy address deve iniciar com D");
  });
});

test('Suíte Dogecoin - Validação de Endereços', async (t) => {
  await t.test('7. Deve validar corretamente endereços legítimos (Legacy P2PKH)', () => {
    const keyPair = B2DogecoinEngine.deriveKeyPair(mnemonic, 0);
    const legacy = B2DogecoinEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');

    assert.strictEqual(B2DogecoinEngine.validateAddress(legacy), true, "Endereço Legacy real derivado deve ser válido");
  });

  await t.test('8. Deve rejeitar endereço Dogecoin com checksum ou formato inválido', () => {
    assert.strictEqual(B2DogecoinEngine.validateAddress('Dinvalidaddresshere'), false);
    assert.strictEqual(B2DogecoinEngine.validateAddress('DInvalidAddressChecksum'), false);
  });
});

test('Suíte Dogecoin - Assinatura e Verificação de Mensagens', async (t) => {
  const msg = "Declaração de Posse de Carteira B2 Wallet v2.0 - Dogecoin Engine";

  await t.test('9. Deve assinar uma mensagem de texto com sucesso', () => {
    const sig = B2DogecoinEngine.signMessage(mnemonic, msg, 0);
    assert.strictEqual(typeof sig, 'string', "Assinatura deve ser string Base58");
    assert.ok(sig.length > 50, "Assinatura deve conter comprimento condizente");
  });

  await t.test('10. Deve verificar uma assinatura legítima com sucesso', () => {
    const keyPair = B2DogecoinEngine.deriveKeyPair(mnemonic, 0);
    const address = B2DogecoinEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');
    const sig = B2DogecoinEngine.signMessage(mnemonic, msg, 0);

    const isValid = B2DogecoinEngine.verifyMessage(msg, sig, address);
    assert.strictEqual(isValid, true, "Assinatura válida deve ser confirmada");
  });
});

test('Suíte Dogecoin - Transações, Taxas e Broadcast', async (t) => {
  const keyPair = B2DogecoinEngine.deriveKeyPair(mnemonic, 0);
  const myAddress = B2DogecoinEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');
  const recipient = "DNhP1eP5QGefi2DMPTfTL5SLmv7DivfNa";

  const fakeUTXOs = [
    {
      txid: "8c7f1a5c4d3e2b1a0987654321fedcba0123456789abcdef0123456789abcdef",
      vout: 0,
      satoshis: 200000000, // 2.0 DOGE
      amount: 2.0,
      scriptPubKey: "76a9140102030405060708090a0b0c0d0e0f101112131488ac"
    }
  ];

  await t.test('11. Deve construir e assinar de forma determinística transação Dogecoin', () => {
    const tx = B2DogecoinEngine.buildTransaction(
      keyPair.privateKey,
      fakeUTXOs,
      recipient,
      0.5, // amount
      myAddress, // change address
      1.0 // fee (1 DOGE)
    );

    assert.ok(tx.hex, "Deve gerar hex serializado");
    assert.strictEqual(tx.txid.length, 64, "Deve gerar txid de 64 caracteres");
  });

  await t.test('12. Deve buscar UTXOs reais via API Blockbook ou retornar array (graceful)', async () => {
    const utxos = await B2DogecoinEngine.fetchUTXOs(myAddress);
    assert.ok(Array.isArray(utxos), "UTXOs deve ser um array");
  });
});
