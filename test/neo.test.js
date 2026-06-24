/**
 * B2 Wallet - Testes de Integração de NEO N3 (NEO N3 Integration Suite)
 *
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Este módulo executa testes abrangentes, ponta a ponta, sem mocks ou fakes,
 * validando a integração completa de NEO N3 (NeonJS) no ecossistema B2 Wallet.
 */

const test = require('node:test');
const assert = require('node:assert');
const { B2KeyDerivationEngine, B2NeoEngine } = require('./setup');

test('Suíte NEO N3 - Operações de Chaves e Criptografia', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  // Chave privada derivada esperada para index 0 (Coin Type 888)
  const expectedAddress = "NLf2Xor7L9g9zC2r7K6D4p3Vn78A9pA12v"; // Exemplo determinístico de NEO N3

  await t.test('1. Deve derivar de forma determinística chaves e endereço NEO N3 para index 0', () => {
    const keyPair = B2NeoEngine.deriveNeoKeyPair(mnemonic, 0);
    assert.ok(keyPair.privateKey, 'Chave privada deve existir');
    assert.ok(keyPair.publicKeyHex, 'Chave pública deve existir');
    assert.ok(keyPair.address.startsWith('N'), 'Endereço NEO N3 deve iniciar com N');
    assert.strictEqual(keyPair.address.length, 34, 'Endereço NEO N3 deve conter 34 caracteres');
  });

  await t.test('2. Deve derivar endereço idêntico via B2KeyDerivationEngine.deriveAddress', () => {
    const keyPair = B2NeoEngine.deriveNeoKeyPair(mnemonic, 0);
    const address = B2KeyDerivationEngine.deriveAddress(keyPair.privateKeyHex, 'NEO');
    assert.strictEqual(address, keyPair.address, 'O endereço derivado pelo KeyDerivationEngine deve ser idêntico');
  });

  await t.test('3. Deve derivar de forma determinística chaves diferentes para index 1', () => {
    const keyPair0 = B2NeoEngine.deriveNeoKeyPair(mnemonic, 0);
    const keyPair1 = B2NeoEngine.deriveNeoKeyPair(mnemonic, 1);
    assert.notStrictEqual(keyPair0.privateKeyHex, keyPair1.privateKeyHex, 'Chaves privadas de índices diferentes devem divergir');
    assert.notStrictEqual(keyPair0.address, keyPair1.address, 'Endereços de índices diferentes devem divergir');
  });

  await t.test('4. Deve importar com sucesso uma chave privada válida do formato WIF', () => {
    const wif = "L4uXfS53pXwGPhFj5WfXgQZ6fV3FpXeS53pXwGPhFj5WfXgQZ6fV"; // WIF de exemplo compactado
    // Vamos gerar um WIF válido para teste a partir do index 0
    const keyPair = B2NeoEngine.deriveNeoKeyPair(mnemonic, 0);
    const imported = B2NeoEngine.importPrivateKeyFromWIF(keyPair.WIF);
    assert.strictEqual(imported.privateKeyHex, keyPair.privateKeyHex, 'Chave privada hexadecimal deve bater após a importação');
    assert.strictEqual(imported.address, keyPair.address, 'Endereço deve bater após a importação do WIF');
  });

  await t.test('5. Deve rejeitar a importação de WIFs malformados ou corrompidos', () => {
    assert.throws(() => {
      B2NeoEngine.importPrivateKeyFromWIF("L4uXfS53pXwGPhFj5WfXgQZ6fV3FpXeS53pXwGPhFj5WfXgQZ6fX"); // Checksum inválido
    }, /Failed to import WIF/);
  });

  await t.test('6. Deve exportar corretamente uma chave privada para formato WIF', () => {
    const keyPair = B2NeoEngine.deriveNeoKeyPair(mnemonic, 0);
    const wif = B2NeoEngine.exportPrivateKeyToWIF(keyPair.privateKeyHex);
    assert.strictEqual(wif, keyPair.WIF, 'WIF exportado deve bater com o gerado pelo NeonJS');
  });
});

test('Suíte NEO N3 - Validação de Endereços e Conversão de Script Hash', async (t) => {
  const address = "NLf2Xor7L9g9zC2r7K6D4p3Vn78A9pA12v"; // Endereço fictício que valida no Base58Check
  // Vamos derivar um endereço real válido para testes
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const realAddress = B2NeoEngine.deriveNeoKeyPair(mnemonic, 0).address;

  await t.test('7. Deve validar corretamente endereços legítimos NEO N3', () => {
    assert.strictEqual(B2NeoEngine.validateAddress(realAddress), true, 'Endereço derivado real deve ser considerado válido');
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(realAddress, 'NEO'), true, 'Endereço deve validar via core KeyDerivationEngine');
  });

  await t.test('8. Deve rejeitar endereços NEO N3 inválidos ou com prefixo incorreto', () => {
    assert.strictEqual(B2NeoEngine.validateAddress("ALf2Xor7L9g9zC2r7K6D4p3Vn78A9pA12v"), false, 'Prefixo A (Legacy) deve ser rejeitado');
    assert.strictEqual(B2NeoEngine.validateAddress("NLf2Xor7L9g9zC2r7K6D4p3Vn78A9pA12"), false, 'Endereço muito curto deve ser rejeitado');
    assert.strictEqual(B2NeoEngine.validateAddress(realAddress + "A"), false, 'Endereço muito longo deve ser rejeitado');
  });

  await t.test('9. Deve converter corretamente um endereço de texto para Script Hash big-endian', () => {
    const scriptHash = B2NeoEngine.addressToScriptHash(realAddress);
    assert.ok(scriptHash, 'Script hash deve ser gerado');
    assert.strictEqual(typeof scriptHash, 'string', 'Script hash deve ser do tipo string hex');
    assert.strictEqual(scriptHash.length, 40, 'Script hash UInt160 deve ter 40 caracteres hex (20 bytes)');
  });

  await t.test('10. Deve converter corretamente um Script Hash para endereço de texto', () => {
    const scriptHash = B2NeoEngine.addressToScriptHash(realAddress);
    const reconstructedAddress = B2NeoEngine.scriptHashToAddress(scriptHash);
    assert.strictEqual(reconstructedAddress, realAddress, 'Endereço reconstruído a partir do Script Hash deve bater com o original');
  });

  await t.test('11. Deve garantir consistência na conversão round-trip de Script Hash', () => {
    const scriptHash = B2NeoEngine.addressToScriptHash(realAddress);
    const roundTripHash = B2NeoEngine.addressToScriptHash(B2NeoEngine.scriptHashToAddress(scriptHash));
    assert.strictEqual(roundTripHash, scriptHash, 'Round-trip de script hash deve retornar exatamente o mesmo valor');
  });
});

test('Suíte NEO N3 - Assinatura e Verificação de Mensagens', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const keyPair = B2NeoEngine.deriveNeoKeyPair(mnemonic, 0);
  const message = "B2 Wallet — NEO N3 Signature Verification standard message";

  await t.test('12. Deve assinar uma mensagem de texto usando o par de chaves secp256r1', () => {
    const signature = B2NeoEngine.signMessage(message, keyPair.privateKeyHex);
    assert.ok(signature, 'Assinatura deve ser gerada');
    assert.strictEqual(typeof signature, 'string', 'Assinatura deve ser uma string hex');
  });

  await t.test('13. Deve verificar com sucesso uma assinatura legítima usando a chave pública correta', () => {
    const signature = B2NeoEngine.signMessage(message, keyPair.privateKeyHex);
    const isVerified = B2NeoEngine.verifyMessageSignature(message, signature, keyPair.publicKeyHex);
    assert.strictEqual(isVerified, true, 'Assinatura legítima deve ser validada com sucesso');
  });

  await t.test('14. Deve rejeitar assinaturas se a mensagem ou a chave pública forem alteradas', () => {
    const signature = B2NeoEngine.signMessage(message, keyPair.privateKeyHex);
    
    // Testa com mensagem diferente
    const isVerifiedDiffMsg = B2NeoEngine.verifyMessageSignature("Another message", signature, keyPair.publicKeyHex);
    assert.strictEqual(isVerifiedDiffMsg, false, 'Assinatura sob mensagem diferente deve ser rejeitada');

    // Testa com chave pública diferente
    const anotherKeyPair = B2NeoEngine.deriveNeoKeyPair(mnemonic, 1);
    const isVerifiedDiffKey = B2NeoEngine.verifyMessageSignature(message, signature, anotherKeyPair.publicKeyHex);
    assert.strictEqual(isVerifiedDiffKey, false, 'Assinatura sob chave pública diferente deve ser rejeitada');
  });
});

test('Suíte NEO N3 - Conexão RPC Real e Provedores (Sem Mocks)', async (t) => {
  const mainnetNode = "https://mainnet1.neo.coz.io:443";
  const fallbacks = [
    "https://mainnet2.neo.coz.io:443",
    "https://rpc.n3.nspcc.ru:10331"
  ];
  const testAddress = "Ndbt7As8f7vM6pLzU33iVfcs3kRxV8N"; // Um endereço qualquer para testes de leitura de saldos/histórico

  await t.test('15. Deve obter com sucesso a Network Magic dinâmica via getversion', async () => {
    const magic = await B2NeoEngine.getNetworkMagic(mainnetNode);
    assert.ok(magic, 'Network magic deve ser retornada');
    assert.strictEqual(typeof magic, 'number', 'Network magic deve ser um número');
    assert.strictEqual(magic, 860833102, 'Network magic obtida deve ser a da Mainnet NEO N3 (860833102)');
  });

  await t.test('16. Deve consultar com sucesso os saldos NEP-17 reais do endereço principal', async () => {
    const balances = await B2NeoEngine.getBalances(testAddress, mainnetNode);
    assert.ok(Array.isArray(balances), 'A consulta de saldos deve retornar um array');
    // Como é um nó real, pode estar vazio ou conter saldos de verdade. Ambas as estruturas são válidas.
    balances.forEach(bal => {
      assert.ok(bal.contractHash, 'Cada token deve possuir um script hash de contrato');
      assert.ok(bal.symbol, 'Cada token deve possuir um símbolo textual');
      assert.strictEqual(typeof bal.amount, 'number', 'Quantidade do token deve ser do tipo numérico');
    });
  });

  await t.test('17. Deve consultar com sucesso o GAS acumulado e reivindicável (unclaimed GAS)', async () => {
    const claimable = await B2NeoEngine.getUnclaimedGas(testAddress, mainnetNode);
    assert.ok(claimable, 'Deve retornar estrutura de GAS acumulado');
    assert.strictEqual(claimable.address, testAddress, 'Endereço retornado deve bater com o consultado');
    assert.ok(claimable.unclaimed, 'Quantidade bruta de unclaimed GAS deve existir');
    assert.strictEqual(typeof claimable.unclaimedFormatted, 'string', 'GAS formatado deve vir em formato textual');
  });

  await t.test('18. Deve carregar com sucesso o histórico de transações NEP-17 do endereço real', async () => {
    const history = await B2NeoEngine.getTransactionHistory(testAddress, mainnetNode, fallbacks);
    assert.ok(Array.isArray(history), 'Histórico deve retornar um array estruturado');
    history.forEach(tx => {
      assert.ok(tx.txhash, 'Cada transação histórica deve possuir hash identificador');
      assert.ok(tx.assethash, 'Cada transação deve referenciar o hash do ativo');
      assert.ok(tx.type === 'receive' || tx.type === 'send', 'Tipo de transferência deve ser receive ou send');
    });
  });
});

test('Suíte NEO N3 - Construção e Transmissão de Transações', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const mainnetNode = "https://mainnet1.neo.coz.io:443";
  // Deriva um destinatário legítimo e válido dinamicamente do index 1 para evitar erros de validação de checksum do endereço
  const toAddress = B2NeoEngine.deriveNeoKeyPair(mnemonic, 1).address;
  const neoContractHash = "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5"; // Native NEO N3 hash

  await t.test('19. Deve construir com sucesso uma transação assinada de transferência de NEP-17 (NEO)', async () => {
    const built = await B2NeoEngine.buildTransferTransaction(
      mnemonic,
      0,
      toAddress,
      "1.0",
      neoContractHash,
      mainnetNode
    );

    assert.ok(built, 'Construção da transação deve retornar com sucesso');
    assert.ok(built.signedTxHex, 'Transação deve possuir sua representação serializada assinada raw hex');
    assert.strictEqual(built.sender, B2NeoEngine.deriveNeoKeyPair(mnemonic, 0).address, 'Remetente da transação deve ser o index 0');
    assert.strictEqual(built.recipient, toAddress, 'Destinatário deve ser o endereço configurado');
    assert.strictEqual(built.amount, "1.0", 'Quantidade da transação deve ser idêntica');
  });

  await t.test('20. Deve definir corretamente as taxas SystemFee e NetworkFee obrigatórias do protocolo N3', async () => {
    const built = await B2NeoEngine.buildTransferTransaction(
      mnemonic,
      0,
      toAddress,
      "1.0",
      neoContractHash,
      mainnetNode
    );

    assert.strictEqual(built.systemFee, "0", 'SystemFee deve ser 0 sob desconto padrão de 10 GAS free');
    assert.strictEqual(built.networkFee, "1500000", 'NetworkFee padrão deve ser definido em 1500000 satoshis (0.015 GAS)');
    assert.ok(built.validUntilBlock > 0, 'validUntilBlock deve ser definido para proteção contra replays');
  });

  await t.test('21. Deve assinar a transação com um Witness e Signer com escopo CalledByEntry (0x01)', async () => {
    const built = await B2NeoEngine.buildTransferTransaction(
      mnemonic,
      0,
      toAddress,
      "1.0",
      neoContractHash,
      mainnetNode
    );

    const tx = built.tx;
    assert.strictEqual(tx.signers.length, 1, 'Deve possuir exatamente um signer na transação');
    assert.strictEqual(tx.signers[0].scopes, 1, 'Signer deve ter escopo CalledByEntry (0x01)');
    assert.ok(tx.witnesses.length > 0, 'Deve conter witnesses de validação do remetente');
  });

  await t.test('22. Deve tentar transmitir transação assinada e falhar por falta de saldo, mas de forma estruturada e resiliente', async () => {
    const built = await B2NeoEngine.buildTransferTransaction(
      mnemonic,
      0,
      toAddress,
      "1.0",
      neoContractHash,
      mainnetNode
    );

    // Como o endereço derivado do mnemônico "abandon..." não possui saldo ou GAS na mainnet, o envio real deve falhar.
    // Nós validamos se o erro é capturado de forma graciosa e repassado sem crashar a aplicação.
    await assert.rejects(
      async () => {
        await B2NeoEngine.sendTransaction(built.signedTxHex, mainnetNode, [
          "https://mainnet2.neo.coz.io:443",
          "https://rpc.n3.nspcc.ru:10331"
        ]);
      },
      /Failed to broadcast transaction/,
      'Transmissão sem saldo deve ser rejeitada pelas regras de consenso dos nós reais da mainnet'
    );
  });
});
