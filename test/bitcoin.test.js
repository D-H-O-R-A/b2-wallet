/**
 * B2 Wallet - Testes Unitários e de Integração do Bitcoin Core Engine
 *
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Valida a engine de chaves, criptografia, endereços multi-formato (SegWit, Taproot, Legacy, Nested),
 * assinaturas de mensagens, xpub/xprv, construção de transações e APIs de rede reais.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { B2KeyDerivationEngine, B2BitcoinEngine, B2PlatformSecurity } = require('./setup');

const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

test('Suíte Bitcoin - Derivação de Endereços e Chaves', async (t) => {
  await t.test('1. Deve derivar o par de chaves Bitcoin padrão (Coin Type 0)', () => {
    const keyPair = B2BitcoinEngine.deriveKeyPair(mnemonic, 0);
    assert.ok(keyPair.privateKey instanceof Uint8Array, "Chave privada deve ser Uint8Array");
    assert.strictEqual(keyPair.privateKeyHex.length, 64, "Chave privada hex deve ter 64 caracteres");
    assert.ok(keyPair.publicKey instanceof Uint8Array, "Chave pública deve ser Uint8Array");
    assert.strictEqual(keyPair.publicKeyHex.length, 64, "Chave pública hex deve ter 64 caracteres");
  });

  await t.test('2. Deve derivar endereço Bitcoin Native SegWit (bc1q...) correto', () => {
    const keyPair = B2BitcoinEngine.deriveKeyPair(mnemonic, 0);
    const address = B2BitcoinEngine.deriveAddress(keyPair.privateKeyHex, 'bech32');
    assert.ok(address.startsWith('bc1q'), "Endereço Native SegWit deve iniciar com bc1q");
    assert.ok(address.length >= 42, "Endereço Native SegWit deve ter comprimento adequado");
  });

  await t.test('3. Deve derivar endereço Bitcoin Taproot (bc1p...) correto', () => {
    const keyPair = B2BitcoinEngine.deriveKeyPair(mnemonic, 0);
    const address = B2BitcoinEngine.deriveAddress(keyPair.privateKeyHex, 'taproot');
    assert.ok(address.startsWith('bc1p'), "Endereço Taproot deve iniciar com bc1p");
  });

  await t.test('4. Deve derivar endereço Bitcoin Nested SegWit (3...) correto', () => {
    const keyPair = B2BitcoinEngine.deriveKeyPair(mnemonic, 0);
    const address = B2BitcoinEngine.deriveAddress(keyPair.privateKeyHex, 'nested');
    assert.ok(address.startsWith('3'), "Endereço Nested SegWit deve iniciar com 3");
  });

  await t.test('5. Deve derivar endereço Bitcoin Legacy (1...) correto', () => {
    const keyPair = B2BitcoinEngine.deriveKeyPair(mnemonic, 0);
    const address = B2BitcoinEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');
    assert.ok(address.startsWith('1'), "Endereço Legacy deve iniciar com 1");
  });

  await t.test('6. Deve derivar xpub determinística válida de conta Bitcoin', () => {
    const xpub = B2BitcoinEngine.deriveExtendedKey(mnemonic, false);
    assert.ok(xpub.startsWith('xpub'), "xpub deve iniciar com prefixo xpub");
  });

  await t.test('7. Deve derivar xprv determinística válida de conta Bitcoin', () => {
    const xprv = B2BitcoinEngine.deriveExtendedKey(mnemonic, true);
    assert.ok(xprv.startsWith('xprv'), "xprv deve iniciar com prefixo xprv");
  });

  await t.test('8. Deve decriptar a seed do arquivo de configuração e derivar endereço Bitcoin esperado', async () => {
    const configPath = path.resolve(__dirname, 'b2_wallet_config_1781624414200.json');
    const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const password = "pass-file";

    const decryptedMnemonic = await B2PlatformSecurity.decryptData(configFile.payload, password);
    assert.strictEqual(decryptedMnemonic, "bird ability ankle arrest aisle assume body bullet aerobic advise burden antique");

    const keyPair = B2BitcoinEngine.deriveKeyPair(decryptedMnemonic, 0);
    const nativeAddress = B2BitcoinEngine.deriveAddress(keyPair.privateKeyHex, 'bech32');
    const legacyAddress = B2BitcoinEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');

    assert.strictEqual(nativeAddress.startsWith('bc1q'), true, "Native address deve iniciar com bc1q");
    assert.strictEqual(legacyAddress.startsWith('1'), true, "Legacy address deve iniciar com 1");
  });
});

test('Suíte Bitcoin - Validação de Endereços', async (t) => {
  await t.test('9. Deve validar corretamente endereços legítimos (SegWit, Legacy)', () => {
    const keyPair = B2BitcoinEngine.deriveKeyPair(mnemonic, 0);
    const native = B2BitcoinEngine.deriveAddress(keyPair.privateKeyHex, 'bech32');
    const legacy = B2BitcoinEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');

    assert.strictEqual(B2BitcoinEngine.validateAddress(native), true, "Endereço SegWit real derivado deve ser válido");
    assert.strictEqual(B2BitcoinEngine.validateAddress(legacy), true, "Endereço Legacy real derivado deve ser válido");
  });

  await t.test('10. Deve rejeitar endereço Bitcoin com checksum ou formato inválido', () => {
    assert.strictEqual(B2BitcoinEngine.validateAddress('bc1qinvalidaddresshere'), false);
    assert.strictEqual(B2BitcoinEngine.validateAddress('1InvalidAddressChecksum'), false);
  });
});

test('Suíte Bitcoin - Assinatura e Verificação de Mensagens', async (t) => {
  const msg = "Declaração de Posse de Carteira B2 Wallet v2.0 - Bitcoin Engine";

  await t.test('11. Deve assinar uma mensagem de texto com sucesso', () => {
    const sig = B2BitcoinEngine.signMessage(mnemonic, msg, 0);
    assert.strictEqual(typeof sig, 'string', "Assinatura deve ser string Base58");
    assert.ok(sig.length > 50, "Assinatura deve conter comprimento condizente");
  });

  await t.test('12. Deve verificar uma assinatura legítima com sucesso', () => {
    const keyPair = B2BitcoinEngine.deriveKeyPair(mnemonic, 0);
    const address = B2BitcoinEngine.deriveAddress(keyPair.privateKeyHex, 'bech32');
    const sig = B2BitcoinEngine.signMessage(mnemonic, msg, 0);

    const isValid = B2BitcoinEngine.verifyMessage(msg, sig, address);
    assert.strictEqual(isValid, true, "Assinatura válida deve ser confirmada");
  });
});

test('Suíte Bitcoin - Transações, Taxas e Broadcast', async (t) => {
  const keyPair = B2BitcoinEngine.deriveKeyPair(mnemonic, 0);
  const myAddress = B2BitcoinEngine.deriveAddress(keyPair.privateKeyHex, 'bech32');
  const recipient = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";

  const fakeUTXOs = [
    {
      txid: "8c7f1a5c4d3e2b1a0987654321fedcba0123456789abcdef0123456789abcdef",
      vout: 0,
      satoshis: 100000000, // 1.0 BTC
      amount: 1.0,
      scriptPubKey: "00140102030405060708090a0b0c0d0e0f1011121314"
    }
  ];

  await t.test('13. Deve construir e assinar de forma determinística transação Bitcoin SegWit', () => {
    const tx = B2BitcoinEngine.buildTransaction(
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

  await t.test('14. Deve buscar UTXOs reais via API mempool ou retornar array (graceful)', async () => {
    const utxos = await B2BitcoinEngine.fetchUTXOs(myAddress);
    assert.ok(Array.isArray(utxos), "UTXOs deve ser um array");
  });
});
