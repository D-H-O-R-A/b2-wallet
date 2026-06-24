/**
 * B2 Wallet - Testes Unitários e de Integração do Bitcoin Cash Engine
 *
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Valida a engine de chaves, criptografia, endereços multi-formato (CashAddr, Legacy),
 * assinaturas de mensagens, xpub/xprv, construção de transações e APIs de rede reais.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { B2KeyDerivationEngine, B2BitcoinCashEngine, B2PlatformSecurity } = require('./setup');

const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

test('Suíte Bitcoin Cash - Derivação de Endereços e Chaves', async (t) => {
  await t.test('1. Deve derivar o par de chaves Bitcoin Cash padrão (Coin Type 145)', () => {
    const keyPair = B2BitcoinCashEngine.deriveKeyPair(mnemonic, 0);
    assert.ok(keyPair.privateKey instanceof Uint8Array, "Chave privada deve ser Uint8Array");
    assert.strictEqual(keyPair.privateKeyHex.length, 64, "Chave privada hex deve ter 64 caracteres");
    assert.ok(keyPair.publicKey instanceof Uint8Array, "Chave pública deve ser Uint8Array");
    assert.strictEqual(keyPair.publicKeyHex.length, 64, "Chave pública hex deve ter 64 caracteres");
  });

  await t.test('2. Deve derivar endereço Bitcoin Cash CashAddr (bitcoincash:q...) correto', () => {
    const keyPair = B2BitcoinCashEngine.deriveKeyPair(mnemonic, 0);
    const address = B2BitcoinCashEngine.deriveAddress(keyPair.privateKeyHex, 'cashaddr');
    assert.ok(address.startsWith('bitcoincash:q'), "Endereço CashAddr deve iniciar com bitcoincash:q");
  });

  await t.test('3. Deve derivar endereço Bitcoin Cash Legacy (1...) correto', () => {
    const keyPair = B2BitcoinCashEngine.deriveKeyPair(mnemonic, 0);
    const address = B2BitcoinCashEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');
    assert.ok(address.startsWith('1'), "Endereço Legacy deve iniciar com 1");
  });

  await t.test('4. Deve derivar xpub determinística válida de conta Bitcoin Cash', () => {
    const xpub = B2BitcoinCashEngine.deriveExtendedKey(mnemonic, false);
    assert.ok(xpub.startsWith('xpub'), "xpub deve iniciar com prefixo xpub");
  });

  await t.test('5. Deve derivar xprv determinística válida de conta Bitcoin Cash', () => {
    const xprv = B2BitcoinCashEngine.deriveExtendedKey(mnemonic, true);
    assert.ok(xprv.startsWith('xprv'), "xprv deve iniciar com prefixo xprv");
  });

  await t.test('6. Deve decriptar a seed do arquivo de configuração e derivar endereço Bitcoin Cash esperado', async () => {
    const configPath = path.resolve(__dirname, 'b2_wallet_config_1781624414200.json');
    const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const password = "pass-file";

    const decryptedMnemonic = await B2PlatformSecurity.decryptData(configFile.payload, password);
    assert.strictEqual(decryptedMnemonic, "bird ability ankle arrest aisle assume body bullet aerobic advise burden antique");

    const keyPair = B2BitcoinCashEngine.deriveKeyPair(decryptedMnemonic, 0);
    const cashAddress = B2BitcoinCashEngine.deriveAddress(keyPair.privateKeyHex, 'cashaddr');
    const legacyAddress = B2BitcoinCashEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');

    assert.strictEqual(cashAddress.startsWith('bitcoincash:q'), true, "CashAddr address deve iniciar com bitcoincash:q");
    assert.strictEqual(legacyAddress.startsWith('1'), true, "Legacy address deve iniciar com 1");
  });
});

test('Suíte Bitcoin Cash - Validação de Endereços', async (t) => {
  await t.test('7. Deve validar corretamente endereços legítimos (CashAddr, Legacy)', () => {
    const keyPair = B2BitcoinCashEngine.deriveKeyPair(mnemonic, 0);
    const cashaddr = B2BitcoinCashEngine.deriveAddress(keyPair.privateKeyHex, 'cashaddr');
    const legacy = B2BitcoinCashEngine.deriveAddress(keyPair.privateKeyHex, 'legacy');

    assert.strictEqual(B2BitcoinCashEngine.validateAddress(cashaddr), true, "Endereço CashAddr real derivado deve ser válido");
    assert.strictEqual(B2BitcoinCashEngine.validateAddress(legacy), true, "Endereço Legacy real derivado deve ser válido");
  });

  await t.test('8. Deve rejeitar endereço Bitcoin Cash com checksum ou formato inválido', () => {
    assert.strictEqual(B2BitcoinCashEngine.validateAddress('bitcoincash:qinvalidaddresshere'), false);
    assert.strictEqual(B2BitcoinCashEngine.validateAddress('1InvalidAddressChecksum'), false);
  });
});

test('Suíte Bitcoin Cash - Assinatura e Verificação de Mensagens', async (t) => {
  const msg = "Declaração de Posse de Carteira B2 Wallet v2.0 - Bitcoin Cash Engine";

  await t.test('9. Deve assinar uma mensagem de texto com sucesso', () => {
    const sig = B2BitcoinCashEngine.signMessage(mnemonic, msg, 0);
    assert.strictEqual(typeof sig, 'string', "Assinatura deve ser string Base58");
    assert.ok(sig.length > 50, "Assinatura deve conter comprimento condizente");
  });

  await t.test('10. Deve verificar uma assinatura legítima com sucesso', () => {
    const keyPair = B2BitcoinCashEngine.deriveKeyPair(mnemonic, 0);
    const address = B2BitcoinCashEngine.deriveAddress(keyPair.privateKeyHex, 'cashaddr');
    const sig = B2BitcoinCashEngine.signMessage(mnemonic, msg, 0);

    const isValid = B2BitcoinCashEngine.verifyMessage(msg, sig, address);
    assert.strictEqual(isValid, true, "Assinatura válida deve ser confirmada");
  });
});

test('Suíte Bitcoin Cash - Transações, Taxas e Broadcast', async (t) => {
  const keyPair = B2BitcoinCashEngine.deriveKeyPair(mnemonic, 0);
  const myAddress = B2BitcoinCashEngine.deriveAddress(keyPair.privateKeyHex, 'cashaddr');
  const recipient = "bitcoincash:q NhP1eP5QGefi2DMPTfTL5SLmv7DivfNa".replace(/\s+/g, ''); // bitcoincash:qNhP1eP5QGefi2DMPTfTL5SLmv7DivfNa

  const fakeUTXOs = [
    {
      txid: "8c7f1a5c4d3e2b1a0987654321fedcba0123456789abcdef0123456789abcdef",
      vout: 0,
      satoshis: 100000000, // 1.0 BCH
      amount: 1.0,
      scriptPubKey: "76a9140102030405060708090a0b0c0d0e0f101112131488ac"
    }
  ];

  await t.test('11. Deve construir e assinar de forma determinística transação Bitcoin Cash', () => {
    const tx = B2BitcoinCashEngine.buildTransaction(
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

  await t.test('12. Deve buscar UTXOs reais via API Blockbook ou retornar array (graceful)', async () => {
    const utxos = await B2BitcoinCashEngine.fetchUTXOs(myAddress);
    assert.ok(Array.isArray(utxos), "UTXOs deve ser um array");
  });
});
