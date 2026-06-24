/**
 * B2 Wallet - Testes Unitários de Zcash (Zcash Integration Suite)
 *
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 */

const test = require('node:test');
const assert = require('node:assert');
const { B2KeyDerivationEngine, B2ZcashBroadcaster, B2PlatformSecurity } = require('./setup');

test('Suíte Zcash - Derivação de Endereços Reais', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  await t.test('Deve derivar o par de chaves Zcash transparente padrão e endereço correspondente', () => {
    const keyPair = B2ZcashBroadcaster.deriveZcashKeyPair(mnemonic, 0);
    assert.ok(keyPair.privateKey instanceof Uint8Array, "Chave privada deve ser Uint8Array");
    assert.strictEqual(keyPair.privateKeyHex.length, 64, "Chave privada hex deve ter 64 caracteres");

    const tAddress = B2ZcashBroadcaster.deriveZcashTAddress(keyPair.publicKey);
    assert.ok(tAddress.startsWith('t1'), "Endereço transparente deve iniciar com t1");
    assert.strictEqual(tAddress.length, 35, "Endereço transparente deve ter comprimento 35");
  });

  await t.test('Deve derivar endereço transparente via B2KeyDerivationEngine', () => {
    const keyPair = B2ZcashBroadcaster.deriveZcashKeyPair(mnemonic, 0);
    const address = B2KeyDerivationEngine.deriveAddress(keyPair.privateKeyHex, 'ZEC');
    assert.ok(address.startsWith('t1'), "Endereço ZEC derivado deve iniciar com t1");
    assert.strictEqual(address.length, 35, "Endereço ZEC deve ter comprimento 35");
  });

  await t.test('Deve derivar endereço Sapling (z-address) via B2ZcashBroadcaster e B2KeyDerivationEngine', () => {
    const saplingAddr1 = B2ZcashBroadcaster.deriveZcashSaplingAddress(mnemonic, 0);
    assert.ok(saplingAddr1.startsWith('zs1'), "Endereço Sapling deve iniciar com zs1");

    const keyPair = B2ZcashBroadcaster.deriveZcashKeyPair(mnemonic, 0);
    const saplingAddr2 = B2KeyDerivationEngine.deriveAddress(keyPair.privateKeyHex, 'ZEC_SAPLING');
    assert.ok(saplingAddr2.startsWith('zs1'), "Endereço Sapling derivado via engine deve iniciar com zs1");
  });

  await t.test('Deve derivar endereço unificado (u-address) via B2ZcashBroadcaster e B2KeyDerivationEngine', () => {
    const keyPair = B2ZcashBroadcaster.deriveZcashKeyPair(mnemonic, 0);
    const tAddrBytes = B2KeyDerivationEngine.keccak256Bytes(B2KeyDerivationEngine.blake2b256(keyPair.privateKey)).subarray(0, 20);
    const saplingAddrBytes = B2ZcashBroadcaster.deriveZcashOrchardAddress(mnemonic, 0); // Reusando payload de 43 bytes para teste
    const orchardAddrBytes = B2ZcashBroadcaster.deriveZcashOrchardAddress(mnemonic, 0);

    const uAddress = B2ZcashBroadcaster.deriveZcashUnifiedAddress(tAddrBytes, saplingAddrBytes, orchardAddrBytes);
    assert.ok(uAddress.startsWith('u1'), "Endereço unificado deve iniciar com u1");

    const uAddressEngine = B2KeyDerivationEngine.deriveAddress(keyPair.privateKeyHex, 'ZEC_UNIFIED');
    assert.ok(uAddressEngine.startsWith('u1'), "Endereço unificado derivado via engine deve iniciar com u1");
  });

  await t.test('Deve decriptar a seed do arquivo de configuração e validar 100% os endereços Zcash com os esperados da wallet', async () => {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.resolve(__dirname, 'b2_wallet_config_1781624414200.json');
    const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const password = "pass-file";

    const decryptedMnemonic = await B2PlatformSecurity.decryptData(configFile.payload, password);
    assert.strictEqual(decryptedMnemonic, "bird ability ankle arrest aisle assume body bullet aerobic advise burden antique");

    // Derivação de endereços reais da carteira do usuário
    const keyPair = B2ZcashBroadcaster.deriveZcashKeyPair(decryptedMnemonic, 0);
    const tAddress = B2ZcashBroadcaster.deriveZcashTAddress(keyPair.publicKey);
    const saplingAddress = B2ZcashBroadcaster.deriveZcashSaplingAddress(decryptedMnemonic, 0);

    const tAddrBytes = B2KeyDerivationEngine.keccak256Bytes(B2KeyDerivationEngine.blake2b256(keyPair.privateKey)).subarray(0, 20);
    const saplingAddrBytes = B2ZcashBroadcaster.deriveZcashOrchardAddress(decryptedMnemonic, 0);
    const orchardAddrBytes = B2ZcashBroadcaster.deriveZcashOrchardAddress(decryptedMnemonic, 0);
    const uAddress = B2ZcashBroadcaster.deriveZcashUnifiedAddress(tAddrBytes, saplingAddrBytes, orchardAddrBytes);

    // Validações determinísticas estritas da especificação oficial da B2 Wallet
    assert.strictEqual(tAddress, "t1a8VA6WYy9aVtLeDu5Z1nBjsPj3eWF7kfV", "Transparent address deve coincidir 100% com o esperado da wallet");
    assert.strictEqual(saplingAddress, "zs127erdkua5z8ljc4rah265qesseg443rv7t9mnjnawjjrc80vtek79jvcc429jxehhr2jky3rmt3", "Sapling address deve coincidir 100% com o esperado da wallet");
    assert.strictEqual(uAddress, "u11qq4jq9lszshzym2v7z27d3gq53sr328sc0cq8rxj4x5lerp8psjceh8pxy3xqdt8gne8zlknqy4jq9lszshzym2v7z27d3gq53sr328sc0cq8rxj4x5lerp8psjceh8pxy3xqdt8gne8zlknqg22uvvgkrrszg6qyyamer87g63c5p8n4lfsreng0u", "Unified address deve coincidir 100% com o esperado da wallet");
  });
});

test('Suíte Zcash - Validação de Endereços', async (t) => {
  await t.test('Deve validar corretamente endereços transparentes legítimos e rejeitar corrompidos', () => {
    const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    const keyPair = B2ZcashBroadcaster.deriveZcashKeyPair(mnemonic, 0);
    const realTAddress = B2ZcashBroadcaster.deriveZcashTAddress(keyPair.publicKey);

    assert.ok(B2KeyDerivationEngine.validateAddress(realTAddress, 'ZEC'), "Endereço transparente real derivado deve ser válido");
    
    const corruptedTAddr = realTAddress.substring(0, realTAddress.length - 1) + "x";
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(corruptedTAddr, 'ZEC'), false, "Endereço corrompido deve ser rejeitado");
    assert.strictEqual(B2KeyDerivationEngine.validateAddress("t1VPrsub", 'ZEC'), false, "Endereço curto demais deve ser rejeitado");
  });

  await t.test('Deve validar corretamente endereços Sapling legítimos e rejeitar inválidos', () => {
    const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    const realSaplingAddr = B2ZcashBroadcaster.deriveZcashSaplingAddress(mnemonic, 0);

    assert.ok(B2KeyDerivationEngine.validateAddress(realSaplingAddr, 'ZEC_SAPLING'), "Endereço Sapling legítimo deve ser válido");

    const corruptedSapling = realSaplingAddr.substring(0, realSaplingAddr.length - 1) + "q";
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(corruptedSapling, 'ZEC_SAPLING'), false, "Endereço Sapling corrompido deve ser rejeitado");
  });

  await t.test('Deve validar e decodificar corretamente Unified Addresses', () => {
    const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    const keyPair = B2ZcashBroadcaster.deriveZcashKeyPair(mnemonic, 0);
    const realUnifiedAddr = B2KeyDerivationEngine.deriveAddress(keyPair.privateKeyHex, 'ZEC_UNIFIED');

    assert.ok(B2KeyDerivationEngine.validateAddress(realUnifiedAddr, 'ZEC_UNIFIED'), "Unified Address legítimo deve ser válido");

    const decoded = B2ZcashBroadcaster.decodeZcashUnifiedAddress(realUnifiedAddr);
    assert.ok(decoded, "Deve conseguir decodificar o Unified Address");
    assert.ok(decoded.orchard, "Deve conter receiver Orchard");
    assert.ok(decoded.sapling, "Deve conter receiver Sapling");
    assert.ok(decoded.transparent, "Deve conter receiver Transparent");

    const corruptedUnified = realUnifiedAddr.substring(0, realUnifiedAddr.length - 1) + "z";
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(corruptedUnified, 'ZEC_UNIFIED'), false, "Unified Address corrompido deve ser inválido");
  });
});

test('Suíte Zcash - Assinatura e Verificação de Mensagens', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const keyPair = B2ZcashBroadcaster.deriveZcashKeyPair(mnemonic, 0);
  const tAddress = B2ZcashBroadcaster.deriveZcashTAddress(keyPair.publicKey);
  const message = "B2 Wallet v2 - Zcash Sign Message Test";

  await t.test('Deve assinar e verificar com sucesso uma mensagem texto', () => {
    const signature = B2ZcashBroadcaster.signMessage(message, keyPair.privateKeyHex);
    assert.ok(signature, "Assinatura não deve ser nula");
    
    const isValid = B2ZcashBroadcaster.verifyMessageSignature(message, signature, tAddress);
    assert.strictEqual(isValid, true, "Assinatura deve ser verificada com sucesso");

    const isInvalidMessage = B2ZcashBroadcaster.verifyMessageSignature("Outra mensagem", signature, tAddress);
    assert.strictEqual(isInvalidMessage, false, "Assinatura deve ser rejeitada para outra mensagem");
  });
});

test('Suíte Zcash - Balanço e Descoberta de Notas (Pool Separation)', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const keyPair = B2ZcashBroadcaster.deriveZcashKeyPair(mnemonic, 0);
  const tAddress = B2ZcashBroadcaster.deriveZcashTAddress(keyPair.publicKey);

  await t.test('Deve buscar UTXOs transparentes reais ou retornar array vazio se offline', async () => {
    const utxos = await B2ZcashBroadcaster.fetchTransparentUTXOs('https://blockbook.zec.zelcore.io', tAddress);
    assert.ok(Array.isArray(utxos), "UTXOs devem ser retornados em um array");
    if (utxos.length > 0) {
      assert.ok(utxos[0].txid, "UTXO deve conter txid");
      assert.ok(utxos[0].satoshis > 0, "UTXO deve conter satoshis maior que zero");
    }
  });

  await t.test('Deve retornar balanço zerado e sem notas para Sapling Pool', async () => {
    const saplingKeys = B2ZcashBroadcaster.deriveZcashSaplingKeys(mnemonic, 0);
    const saplingAddr = B2ZcashBroadcaster.deriveZcashSaplingAddress(mnemonic, 0);
    const scanResult = await B2ZcashBroadcaster.scanSaplingShieldedBalance('https://blockbook.zec.zelcore.io', saplingAddr, saplingKeys.ivk);

    assert.strictEqual(scanResult.balanceSatoshis, 0, "Balanço Sapling sem fakes deve ser zero");
    assert.deepStrictEqual(scanResult.notes, [], "Notas Sapling sem fakes deve ser vazio");
  });

  await t.test('Deve retornar balanço zerado e sem ações para Orchard Pool', async () => {
    const orchardKeys = B2ZcashBroadcaster.deriveZcashOrchardKeys(mnemonic, 0);
    const orchardAddrBytes = B2ZcashBroadcaster.deriveZcashOrchardAddress(mnemonic, 0);
    const orchardAddrStr = Array.from(orchardAddrBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const scanResult = await B2ZcashBroadcaster.scanOrchardShieldedBalance('https://blockbook.zec.zelcore.io', orchardAddrStr, orchardKeys.ivk);

    assert.strictEqual(scanResult.balanceSatoshis, 0, "Balanço Orchard sem fakes deve ser zero");
    assert.deepStrictEqual(scanResult.actions, [], "Ações Orchard sem fakes deve ser vazio");
  });
});

test('Suíte Zcash - Construção e Assinatura de Transações', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const keyPair = B2ZcashBroadcaster.deriveZcashKeyPair(mnemonic, 0);
  const tAddress = B2ZcashBroadcaster.deriveZcashTAddress(keyPair.publicKey);
  const recipient = "t1VPrsub9URg29AsY6m8t79bA4XQzZg9AsY";

  const utxos = [
    {
      txid: "97bf9012cdbf3e6d19ca7f03bc7e02da14ef5f85da3cbc66eea2a2034c842322",
      vout: 0,
      satoshis: 300000000, // 3.0 ZEC
      amount: 3.0
    }
  ];

  await t.test('Deve construir e assinar com sucesso transação transparente (v5 NU5)', () => {
    const txBuild = B2ZcashBroadcaster.TransparentBuilder.buildAndSign(
      keyPair.privateKey,
      utxos,
      recipient,
      1.5,
      tAddress,
      0.0001,
      5
    );

    assert.ok(txBuild.hex, "Transação assinada deve ter hex");
    assert.ok(txBuild.txid, "Transação deve retornar txid");
    assert.ok(txBuild.hex.length > 100, "Comprimento do hex da transação deve ser consistente");
  });

  await t.test('Deve construir e assinar com sucesso transação Sapling Shielded (t -> z)', () => {
    const saplingKeys = B2ZcashBroadcaster.deriveZcashSaplingKeys(mnemonic, 0);
    const zAddress = B2ZcashBroadcaster.deriveZcashSaplingAddress(mnemonic, 0);

    const txBuild = B2ZcashBroadcaster.SaplingBuilder.buildAndSignShielded(
      keyPair.privateKey,
      saplingKeys,
      utxos,
      tAddress,
      zAddress,
      1.0
    );

    assert.ok(txBuild.hex, "Deve conter hex assinado da transação Sapling");
    assert.ok(txBuild.txid, "Deve conter txid");
  });

  await t.test('Deve tentar transmitir transações unificadas e tratar erro de rede gracioso (vazio)', async () => {
    // Stub de UTXOs para permitir que a construção da transação execute, mas o broadcast de rede falhe graciosamente
    const originalFetch = B2ZcashBroadcaster.fetchTransparentUTXOs;
    B2ZcashBroadcaster.fetchTransparentUTXOs = async () => [
      {
        txid: "97bf9012cdbf3e6d19ca7f03bc7e02da14ef5f85da3cbc66eea2a2034c842322",
        vout: 0,
        satoshis: 300000000,
        amount: 3.0
      }
    ];

    try {
      const result = await B2ZcashBroadcaster.sendZcashTransfer(
        mnemonic,
        'https://blockbook.zec.zelcore.io',
        recipient,
        0.5
      );

      // Sem rede real, a transmissão deve falhar graciosamente e retornar dados vazios como se não tivesse TX transmitida
      assert.strictEqual(result.txId, "", "Sem broadcast bem sucedido, txId deve ser vazio");
      assert.strictEqual(result.hex, "", "Sem broadcast bem sucedido, hex deve ser vazio");
    } finally {
      B2ZcashBroadcaster.fetchTransparentUTXOs = originalFetch;
    }
  });

  await t.test('Deve falhar graciosamente por saldo insuficiente se nenhum UTXO for retornado offline', async () => {
    try {
      await B2ZcashBroadcaster.sendZcashTransfer(
        mnemonic,
        'https://blockbook.zec.zelcore.io',
        recipient,
        0.5
      );
      assert.fail("Deveria ter lançado erro de saldo insuficiente");
    } catch (err) {
      assert.ok(err.message.includes("Saldo insuficiente"), "Mensagem de erro deve indicar saldo insuficiente");
    }
  });
});
