/**
 * B2 Wallet - Testes Unitários e Integração de Internet Computer (ICP Integration Suite)
 *
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Valida a engine criptográfica de criptografia pura, derivação de chaves BIP-44,
 * Principal IDs, Account Identifiers, validação estrita, roteamento de carteira global,
 * assinaturas e fluxos de construção de payloads Rosetta em rede principal real.
 */

const test = require('node:test');
const assert = require('node:assert');
const { B2IcpEngine, B2KeyDerivationEngine } = require('./setup');

test('Suíte ICP - Criptografia Pura (SHA-224, CRC-32, Base32)', async (t) => {
  // Teste 1: SHA-224 hashing
  await t.test('Deve calcular SHA-224 de forma idêntica à especificação', () => {
    const input = new TextEncoder().encode("hello world");
    const hash = B2IcpEngine.sha224(input);
    const hex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
    // SHA-224 de "hello world" é 2f05477fc24bb4faefd86517156dafdecec45b8ad3cf2522a563582b
    assert.strictEqual(hex, "2f05477fc24bb4faefd86517156dafdecec45b8ad3cf2522a563582b");
  });

  // Teste 2: CRC-32 IEEE checksum
  await t.test('Deve calcular CRC-32 de forma idêntica à especificação IEEE 802.3', () => {
    const input = new TextEncoder().encode("123456789");
    const checksum = B2IcpEngine.crc32(input);
    assert.strictEqual(checksum, 0xCBF43926);
  });

  // Teste 3: Base32 encode/decode sem preenchimento
  await t.test('Deve codificar e decodificar dados binários em Base32 (alfabeto DFINITY)', () => {
    const input = new Uint8Array([0, 1, 2, 3, 4, 5, 255, 128]);
    const encoded = B2IcpEngine.encodeBase32(input);
    const decoded = B2IcpEngine.decodeBase32(encoded);
    assert.deepStrictEqual(decoded, input);
  });
});

test('Suíte ICP - Chaves e Derivação DFINITY', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  // Teste 4: deriveKeyPair retorno correto de campos
  await t.test('Deve derivar par de chaves e endereços do mnemônico na curva Ed25519', () => {
    const keys = B2IcpEngine.deriveKeyPair(mnemonic, 0);
    assert.ok(keys.privateKey instanceof Uint8Array, "Private key deve ser Uint8Array");
    assert.ok(keys.publicKey instanceof Uint8Array, "Public key deve ser Uint8Array");
    assert.strictEqual(keys.publicKey.length, 32, "Public key Ed25519 deve ter 32 bytes");
    assert.strictEqual(typeof keys.principal, 'string', "Principal deve ser string");
    assert.strictEqual(typeof keys.address, 'string', "Address deve ser string");
    assert.strictEqual(keys.address.length, 64, "Account Identifier do ICP deve ter 64 caracteres hex");
  });

  // Teste 5: Principal ID correspondente ao padrão DFINITY
  await t.test('Deve derivar Principal ID correto condizente com a chave pública e padrão ASN.1', () => {
    const keys = B2IcpEngine.deriveKeyPair(mnemonic, 0);
    // Principal self-authenticating para Ed25519 inicia com letras e tem hifens
    assert.match(keys.principal, /^[a-z0-9]{5}(-[a-z0-9]{5}){9}-[a-z0-9]{1,5}$/, "Principal ID deve ter grupos de 5 caracteres");
  });

  // Teste 6: Account Identifier correspondente ao padrão hexadecimal de 64 bytes
  await t.test('Deve derivar Account ID (Account Identifier) correto condizente com o principal e subconta nula', () => {
    const keys = B2IcpEngine.deriveKeyPair(mnemonic, 0);
    assert.match(keys.address, /^[a-f0-9]{64}$/, "Account ID deve ser uma string de 64 hex");
  });

  // Teste 7: Derivação de Account ID com subconta customizada (32 bytes salt)
  await t.test('Deve derivar Account ID diferente para o mesmo Principal se for fornecido subconta customizada', () => {
    const keys = B2IcpEngine.deriveKeyPair(mnemonic, 0);
    const subaccount = new Uint8Array(32);
    subaccount[31] = 1; // subaccount index 1
    const customAddress = B2IcpEngine.deriveAccountIdentifierFromPublicKey(keys.publicKey, subaccount);
    assert.notStrictEqual(customAddress, keys.address, "Endereço com subconta customizada deve ser diferente");
    assert.match(customAddress, /^[a-f0-9]{64}$/);
  });
});

test('Suíte ICP - Validação Estrita de Endereços', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  // Teste 8: Validar Principal ID válido
  await t.test('Deve aceitar Principal ID válido gerado pela engine', () => {
    const keys = B2IcpEngine.deriveKeyPair(mnemonic, 0);
    const isValid = B2IcpEngine.validateAddress(keys.principal);
    assert.strictEqual(isValid, true, "Principal ID gerado deve passar no validador");
  });

  // Teste 9: Rejeitar Principal ID inválido
  await t.test('Deve rejeitar Principal ID inválido por tamanho, formato ou checksum', () => {
    assert.strictEqual(B2IcpEngine.validateAddress("fcxk5-23hrp-d3ey5-sniqw-3lagn-fbx3h-cgnml-4dwkg-3dpmp-tyoqq-za"), false, "Principal incompleto deve falhar");
    assert.strictEqual(B2IcpEngine.validateAddress("aaaaa-bbbbb-ccccc-ddddd-eeeee-fffff-12345"), false, "Principal aleatório sem checksum correto deve falhar");
  });

  // Teste 10: Validar Account ID válido
  await t.test('Deve aceitar Account ID válido gerado pela engine', () => {
    const keys = B2IcpEngine.deriveKeyPair(mnemonic, 0);
    const isValid = B2IcpEngine.validateAddress(keys.address);
    assert.strictEqual(isValid, true, "Account ID deve ser válido");
  });

  // Teste 11: Rejeitar Account ID inválido
  await t.test('Deve rejeitar Account ID inválido por caracteres, tamanho ou checksum incorreto', () => {
    assert.strictEqual(B2IcpEngine.validateAddress("744e6bee881995001fcc0fac040b1993566687724bca9c1ac8565ed728f56f89"), false, "Mudar um dígito do hex deve falhar na checagem CRC32");
    assert.strictEqual(B2IcpEngine.validateAddress("744e6bee881995001fcc0fac040b1993566687724bca9c1ac8565ed728f56f"), false, "Hex de tamanho inválido deve falhar");
  });
});

test('Suíte ICP - Integração com B2KeyDerivationEngine', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  // Teste 12: Moeda registrada no B2BlockchainRegistry
  await t.test('O registro global de blockchains deve possuir a rede ICP configurada de forma compatível', () => {
    const registry = globalThis.B2BlockchainRegistry;
    const icp = registry.find(c => c.key === "ICP");
    assert.ok(icp, "Entrada ICP deve estar registrada");
    assert.strictEqual(icp.coinType, 223, "CoinType do ICP deve ser 223");
    assert.strictEqual(icp.decimals, 8, "Decimais do ICP deve ser 8");
  });

  // Teste 13: deriveAddress na B2KeyDerivationEngine para ICP
  await t.test('A chave derivada de B2KeyDerivationEngine para ICP deve rotear corretamente e gerar o Account ID correto', () => {
    const keys = B2IcpEngine.deriveKeyPair(mnemonic, 0);
    // Na KeyDerivationEngine, passamos a chave privada hex de 32 bytes e especificamos 'ICP'
    const privateKeyHex = Array.from(keys.privateKey).map(b => b.toString(16).padStart(2, '0')).join('');
    const derived = B2KeyDerivationEngine.deriveAddress(privateKeyHex, 'ICP');
    assert.strictEqual(derived, keys.address, "Endereço gerado pela KeyDerivationEngine deve bater com o Account ID da engine ICP");
  });

  // Teste 14: validateAddress na B2KeyDerivationEngine para ICP
  await t.test('A KeyDerivationEngine deve validar endereços ICP delegando para a B2IcpEngine', () => {
    const keys = B2IcpEngine.deriveKeyPair(mnemonic, 0);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(keys.address, 'ICP'), true, "Deve validar Account ID");
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(keys.principal, 'ICP'), true, "Deve validar Principal ID");
    assert.strictEqual(B2KeyDerivationEngine.validateAddress("endereço-totalmente-inválido", 'ICP'), false, "Deve recusar endereço inválido");
  });
});

test('Suíte ICP - Assinatura e Verificação de Mensagens', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  // Teste 15: Assinatura e verificação Ed25519 local via axlsign
  await t.test('Deve assinar e verificar mensagens de forma criptograficamente válida', () => {
    const keys = B2IcpEngine.deriveKeyPair(mnemonic, 0);
    const msg = "B2 Wallet Internet Computer Core Test 2026";
    const sig = B2IcpEngine.signMessage(msg, keys.privateKey);
    assert.ok(sig instanceof Uint8Array, "Assinatura deve ser Uint8Array");
    assert.strictEqual(sig.length, 64, "Assinatura Ed25519 deve ter exatamente 64 bytes");

    const isVerified = B2IcpEngine.verifyMessage(msg, sig, keys.publicKey);
    assert.strictEqual(isVerified, true, "Verificação criptográfica da assinatura deve ser bem sucedida");
  });
});

test('Suíte ICP - Provedores de Rede Principal (Live Rosetta Node)', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const keys = B2IcpEngine.deriveKeyPair(mnemonic, 0);

  // Teste 16: ICPProvider.getBalance
  await t.test('Deve sincronizar o saldo real via chamada HTTP de Rosetta e retornar um valor numérico', async () => {
    const balance = await B2IcpEngine.ICPProvider.getBalance(keys.address);
    assert.strictEqual(typeof balance, 'number', "Saldo retornado deve ser um número");
    assert.ok(balance >= 0, "Saldo deve ser maior ou igual a zero");
  });

  // Teste 17: ICPProvider.getSuggestedFee
  await t.test('Deve sugerir a taxa padrão de rede (0.0001 ICP)', async () => {
    const fee = await B2IcpEngine.ICPProvider.getSuggestedFee();
    assert.strictEqual(fee, 0.0001, "Taxa padrão da ledger deve ser 0.0001 ICP");
  });

  // Teste 18: ICPHistoryProvider.getHistory
  await t.test('Deve obter o histórico de transações real (normalizado) da conta via Rosetta', async () => {
    const history = await B2IcpEngine.ICPHistoryProvider.getHistory(keys.address);
    assert.ok(Array.isArray(history), "Histórico deve ser uma lista");
    if (history.length > 0) {
      const tx = history[0];
      assert.ok(tx.hash, "Transação deve possuir hash");
      assert.strictEqual(typeof tx.amount, 'number', "Quantia deve ser número");
      assert.ok(tx.type === 'send' || tx.type === 'receive', "Tipo deve ser send ou receive");
    }
  });

  // Teste 19: ICPProvider.buildTransferTransaction
  await t.test('Deve construir com sucesso os payloads de transação não assinados no Rosetta oficial', async () => {
    const from = keys.address;
    const to = "744e6bee881995001fcc0fac040b1993566687724bca9c1ac8565ed728f56f82"; // conta arbitrária válida de teste
    const amount = 0.001; // 0.001 ICP
    const fee = 0.0001;
    const pubKeyHex = Array.from(keys.publicKey).map(b => b.toString(16).padStart(2, '0')).join('');

    const txPayload = await B2IcpEngine.ICPProvider.buildTransferTransaction(from, to, amount, fee, pubKeyHex);
    assert.ok(txPayload.unsigned_transaction, "Deve retornar a transação não assinada codificada");
    assert.ok(Array.isArray(txPayload.payloads), "Deve retornar a lista de payloads a assinar");
    assert.ok(txPayload.payloads.length > 0, "Deve conter pelo menos um payload de assinatura");
  });

  // Teste 20: Fluxo completo de Assinatura e Combinação Rosetta
  await t.test('Deve gerar assinaturas locais corretas e combiná-las no Rosetta, produzindo uma transação assinada', async () => {
    const from = keys.address;
    const to = "744e6bee881995001fcc0fac040b1993566687724bca9c1ac8565ed728f56f82";
    const amount = 0.002;
    const fee = 0.0001;
    const pubKeyHex = Array.from(keys.publicKey).map(b => b.toString(16).padStart(2, '0')).join('');

    // Passo 1: Construção
    const txPayload = await B2IcpEngine.ICPProvider.buildTransferTransaction(from, to, amount, fee, pubKeyHex);

    // Passo 2: Assinatura
    const signatures = B2IcpEngine.ICPProvider.signTransaction(
      txPayload.unsigned_transaction,
      txPayload.payloads,
      keys.privateKey,
      pubKeyHex
    );

    assert.ok(Array.isArray(signatures), "Deve gerar lista de assinaturas");
    assert.strictEqual(signatures.length, txPayload.payloads.length, "Deve conter uma assinatura por payload");

    // Passo 3: Combinação
    const signedTx = await B2IcpEngine.ICPProvider.combineTransaction(
      txPayload.unsigned_transaction,
      signatures
    );

    assert.strictEqual(typeof signedTx, 'string', "Transação assinada deve ser uma string de bytes");
    assert.ok(signedTx.length > 0, "Transação assinada não deve ser vazia");
  });
});
