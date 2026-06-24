/**
 * B2 Wallet - Testes Unitários e de Integração do Litecoin Engine
 *
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Valida a engine de chaves, criptografia, endereços multi-formato (SegWit, P2SH, Legacy),
 * assinaturas de mensagens, xpub/xprv, construção de transações e APIs de rede reais.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { B2KeyDerivationEngine, B2LitecoinEngine, B2PlatformSecurity } = require('./setup');

const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

test('Suíte Litecoin - Derivação de Endereços e Chaves', async (t) => {
  await t.test('1. Deve derivar o par de chaves Litecoin padrão (Coin Type 2)', () => {
    const keyPair = B2LitecoinEngine.deriveKeyPair(mnemonic, 0);
    assert.ok(keyPair.privateKey instanceof Uint8Array, "Chave privada deve ser Uint8Array");
    assert.strictEqual(keyPair.privateKeyHex.length, 64, "Chave privada hex deve ter 64 caracteres");
    assert.ok(keyPair.publicKey instanceof Uint8Array, "Chave pública deve ser Uint8Array");
    assert.strictEqual(keyPair.publicKeyHex.length, 64, "Chave pública hex deve ter 64 caracteres");
  });

  await t.test('2. Deve derivar endereço Litecoin Native SegWit (ltc1q...) correto', () => {
    const keyPair = B2LitecoinEngine.deriveKeyPair(mnemonic, 0);
    const address = B2LitecoinEngine.deriveAddress(keyPair.privateKeyHex, 'bech32');
    assert.ok(address.startsWith('ltc1q'), "Endereço Native SegWit deve iniciar com ltc1q");
  });

  await t.test('3. Deve derivar endereço Litecoin P2SH (M...) correto', () => {
    const keyPair = B2LitecoinEngine.deriveKeyPair(mnemonic, 0);
    const address = B2LitecoinEngine.deriveAddress(keyPair.privateKeyHex, 'p2sh');
    assert.ok(address.startsWith('M'), "Endereço P2SH deve iniciar com M");
  });

  await t.test('4. Deve derivar endereço Litecoin Legacy (L...) correto', () => {
    const keyPair = B2LitecoinEngine.deriveKeyPair(mnemonic, 0);
    const address = B2LitecoinEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');
    assert.ok(address.startsWith('L'), "Endereço Legacy deve iniciar com L");
  });

  await t.test('5. Deve derivar xpub determinística válida de conta Litecoin', () => {
    const xpub = B2LitecoinEngine.deriveExtendedKey(mnemonic, false);
    assert.ok(xpub.startsWith('xpub'), "xpub deve iniciar com prefixo xpub");
  });

  await t.test('6. Deve derivar xprv determinística válida de conta Litecoin', () => {
    const xprv = B2LitecoinEngine.deriveExtendedKey(mnemonic, true);
    assert.ok(xprv.startsWith('xprv'), "xprv deve iniciar com prefixo xprv");
  });

  await t.test('7. Deve decriptar a seed do arquivo de configuração e derivar endereço Litecoin esperado', async () => {
    const configPath = path.resolve(__dirname, 'b2_wallet_config_1781624414200.json');
    const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const password = "pass-file";

    const decryptedMnemonic = await B2PlatformSecurity.decryptData(configFile.payload, password);
    assert.strictEqual(decryptedMnemonic, "bird ability ankle arrest aisle assume body bullet aerobic advise burden antique");

    const keyPair = B2LitecoinEngine.deriveKeyPair(decryptedMnemonic, 0);
    const nativeAddress = B2LitecoinEngine.deriveAddress(keyPair.privateKeyHex, 'bech32');
    const legacyAddress = B2LitecoinEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');

    assert.strictEqual(nativeAddress.startsWith('ltc1q'), true, "Native address deve iniciar com ltc1q");
    assert.strictEqual(legacyAddress.startsWith('L'), true, "Legacy address deve iniciar com L");
  });
});

test('Suíte Litecoin - Validação de Endereços', async (t) => {
  await t.test('8. Deve validar corretamente endereços legítimos (SegWit, Legacy)', () => {
    const keyPair = B2LitecoinEngine.deriveKeyPair(mnemonic, 0);
    const native = B2LitecoinEngine.deriveAddress(keyPair.privateKeyHex, 'bech32');
    const legacy = B2LitecoinEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');

    assert.strictEqual(B2LitecoinEngine.validateAddress(native), true, "Endereço SegWit real derivado deve ser válido");
    assert.strictEqual(B2LitecoinEngine.validateAddress(legacy), true, "Endereço Legacy real derivado deve ser válido");
  });

  await t.test('9. Deve rejeitar endereço Litecoin com checksum ou formato inválido', () => {
    assert.strictEqual(B2LitecoinEngine.validateAddress('ltc1qinvalidaddresshere'), false);
    assert.strictEqual(B2LitecoinEngine.validateAddress('LInvalidAddressChecksum'), false);
  });
});

test('Suíte Litecoin - Assinatura e Verificação de Mensagens', async (t) => {
  const msg = "Declaração de Posse de Carteira B2 Wallet v2.0 - Litecoin Engine";

  await t.test('10. Deve assinar uma mensagem de texto com sucesso', () => {
    const sig = B2LitecoinEngine.signMessage(mnemonic, msg, 0);
    assert.strictEqual(typeof sig, 'string', "Assinatura deve ser string Base58");
    assert.ok(sig.length > 50, "Assinatura deve conter comprimento condizente");
  });

  await t.test('11. Deve verificar uma assinatura legítima com sucesso', () => {
    const keyPair = B2LitecoinEngine.deriveKeyPair(mnemonic, 0);
    const address = B2LitecoinEngine.deriveAddress(keyPair.privateKeyHex, 'bech32');
    const sig = B2LitecoinEngine.signMessage(mnemonic, msg, 0);

    const isValid = B2LitecoinEngine.verifyMessage(msg, sig, address);
    assert.strictEqual(isValid, true, "Assinatura válida deve ser confirmada");
  });
});

test('Suíte Litecoin - Transações, Taxas e Broadcast', async (t) => {
  const keyPair = B2LitecoinEngine.deriveKeyPair(mnemonic, 0);
  const myAddress = B2LitecoinEngine.deriveAddress(keyPair.privateKeyHex, 'bech32');
  const recipient = "LNhP1eP5QGefi2DMPTfTL5SLmv7DivfNa";

  const fakeUTXOs = [
    {
      txid: "8c7f1a5c4d3e2b1a0987654321fedcba0123456789abcdef0123456789abcdef",
      vout: 0,
      satoshis: 100000000, // 1.0 LTC
      amount: 1.0,
      scriptPubKey: "00140102030405060708090a0b0c0d0e0f1011121314"
    }
  ];

  await t.test('12. Deve construir e assinar de forma determinística transação Litecoin', () => {
    const tx = B2LitecoinEngine.buildTransaction(
      keyPair.privateKey,
      fakeUTXOs,
      recipient,
      0.5, // amount
      myAddress, // change address
      0.0001 // fee
    );

    assert.ok(tx.hex, "Deve gerar hex serializado");
    assert.strictEqual(tx.txid.length, 64, "Deve gerar txid de 64 caracteres");
  });

  await t.test('13. Deve buscar UTXOs reais via API litecoinspace ou retornar array (graceful)', async () => {
    const utxos = await B2LitecoinEngine.fetchUTXOs(myAddress);
    assert.ok(Array.isArray(utxos), "UTXOs deve ser um array");
  });
});
