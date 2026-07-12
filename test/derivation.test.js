/**
 * B2 Wallet - Testes de Derivação e Compatibilidade Multichain (Derivation Suite)
 * 
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Este módulo testa a derivação hierárquica determinística BIP-44 e a formatação
 * correta de endereços para as 17 redes e seus forks.
 */

const test = require('node:test');
const assert = require('node:assert');
const { B2KeyDerivationEngine } = require('./setup');

test('Suíte de Derivação - BIP-44 Derivação Hierárquica Determinística', async (t) => {
  // Semente padrão BIP-39 (usada em toda a indústria para test vectors)
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  let masterSeed;

  await t.test('Deve derivar a semente mestre (Master Seed) determinística a partir do mnemônico', () => {
    masterSeed = B2KeyDerivationEngine.deriveMasterSeed(mnemonic);
    assert.ok(masterSeed instanceof Uint8Array, 'A semente mestre deve ser um Uint8Array');
    assert.strictEqual(masterSeed.length, 64, 'A semente mestre deve ter exatamente 64 bytes (512 bits)');

    // Chamadas repetidas com o mesmo mnemônico devem gerar exatamente os mesmos bytes
    const masterSeedSecond = B2KeyDerivationEngine.deriveMasterSeed(mnemonic);
    assert.deepStrictEqual(masterSeed, masterSeedSecond, 'Semente mestre deve ser estritamente determinística');
  });

  await t.test('Deve derivar chaves privadas diferentes para diferentes blockchains (coin_type) a partir da mesma semente', () => {
    const seed = masterSeed || B2KeyDerivationEngine.deriveMasterSeed(mnemonic);
    
    const ethPrivateKey = B2KeyDerivationEngine.derivePrivateKey(seed, 60); // EVM (Coin 60)
    const btcPrivateKey = B2KeyDerivationEngine.derivePrivateKey(seed, 0);  // Bitcoin (Coin 0)
    const solPrivateKey = B2KeyDerivationEngine.derivePrivateKey(seed, 501); // Solana (Coin 501)

    assert.strictEqual(ethPrivateKey.length, 64, 'Chave privada Ethereum hex deve ter 64 caracteres (32 bytes)');
    assert.strictEqual(btcPrivateKey.length, 64, 'Chave privada Bitcoin hex deve ter 64 caracteres (32 bytes)');
    assert.strictEqual(solPrivateKey.length, 64, 'Chave privada Solana hex deve ter 64 caracteres (32 bytes)');

    assert.notStrictEqual(ethPrivateKey, btcPrivateKey, 'Chaves privadas de moedas diferentes devem ser distintas');
    assert.notStrictEqual(ethPrivateKey, solPrivateKey, 'Chaves privadas de moedas diferentes devem ser distintas');
  });
});

test('Suíte de Derivação - Formatação de Endereços Públicos (Address Encoding)', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const seed = B2KeyDerivationEngine.deriveMasterSeed(mnemonic);

  await t.test('Deve formatar endereços EVM (Ethereum, Polygon, AVAX, BSC, etc) com mixed-case checksum EIP-55', () => {
    const privateKey = B2KeyDerivationEngine.derivePrivateKey(seed, 60);
    const address = B2KeyDerivationEngine.deriveAddress(privateKey, "EVM");

    assert.strictEqual(address.startsWith("0x"), true, 'Endereço EVM deve iniciar com 0x');
    assert.strictEqual(address.length, 42, 'Endereço EVM deve ter exatamente 42 caracteres de tamanho');
    
    // Testa mixed-case checksum (algumas letras devem ser maiúsculas, outras minúsculas)
    const hasUppercase = /[A-F]/.test(address);
    const hasLowercase = /[a-f]/.test(address);
    assert.ok(hasUppercase && hasLowercase, 'Deve estar formatado com mixed-case checksum EIP-55');
  });

  await t.test('Deve formatar endereços Bitcoin com native SegWit Bech32 (prefixo bc1q)', () => {
    const privateKey = B2KeyDerivationEngine.derivePrivateKey(seed, 0);
    const address = B2KeyDerivationEngine.deriveAddress(privateKey, "Bitcoin");

    assert.strictEqual(address.startsWith("bc1q"), true, 'Endereço Bitcoin deve iniciar com prefixo nativo bc1q');
  });

  await t.test('Deve formatar endereços Solana em Base58 puro de 32 a 44 caracteres', () => {
    const privateKey = B2KeyDerivationEngine.derivePrivateKey(seed, 501);
    const address = B2KeyDerivationEngine.deriveAddress(privateKey, "Solana");

    assert.ok(address.length >= 32 && address.length <= 44, 'Endereço Solana em Base58 deve ter tamanho padrão');
    // Deve conter apenas caracteres Base58 legítimos (não contém O, 0, I, l)
    assert.strictEqual(/[0OlI]/.test(address), false, 'Endereço Base58 não deve conter caracteres ambíguos');
  });

  await t.test('Deve formatar endereços Stellar em StrKey Base32 (prefixo G de public key)', () => {
    const privateKey = B2KeyDerivationEngine.derivePrivateKey(seed, 148);
    const address = B2KeyDerivationEngine.deriveAddress(privateKey, "Stellar");

    assert.strictEqual(address.startsWith("G"), true, 'Endereço público Stellar deve começar com a letra G');
    assert.ok(address.length >= 50 && address.length <= 56, 'Endereço Stellar em Base32 deve ter tamanho padrão');
  });

  await t.test('Deve derivar corretamente endereços para forks de Bitcoin (Litecoin, Dogecoin, Dash, Bitcoin Cash)', () => {
    const btcPriv = B2KeyDerivationEngine.derivePrivateKey(seed, 0);
    const ltcPriv = B2KeyDerivationEngine.derivePrivateKey(seed, 2);
    const dogePriv = B2KeyDerivationEngine.derivePrivateKey(seed, 3);
    const dashPriv = B2KeyDerivationEngine.derivePrivateKey(seed, 5);

    const ltcAddr = B2KeyDerivationEngine.deriveAddress(ltcPriv, "Litecoin");
    const dogeAddr = B2KeyDerivationEngine.deriveAddress(dogePriv, "Doge");
    const dashAddr = B2KeyDerivationEngine.deriveAddress(dashPriv, "Dash");

    assert.strictEqual(ltcAddr.startsWith("L"), true, 'Litecoin deve começar com o prefixo L');
    assert.strictEqual(dogeAddr.startsWith("D"), true, 'Dogecoin deve começar com o prefixo D');
    assert.strictEqual(dashAddr.startsWith("X"), true, 'Dash deve começar com o prefixo X');
  });

  await t.test('Deve derivar corretamente endereços para forks de Waves (AMZX, PLO, Turtle Network)', () => {
    const wavesPriv = B2KeyDerivationEngine.derivePrivateKey(seed, 3600);
    const amzxPriv = B2KeyDerivationEngine.derivePrivateKey(seed, 3600); // Compartilha coin_type da família Waves

    const wavesAddr = B2KeyDerivationEngine.deriveAddress(wavesPriv, "Waves");
    const amzxAddr = B2KeyDerivationEngine.deriveAddress(amzxPriv, "AMZX");
    const ploAddr = B2KeyDerivationEngine.deriveAddress(wavesPriv, "PLO");
    const turtleAddr = B2KeyDerivationEngine.deriveAddress(amzxPriv, "Turtle");

    assert.strictEqual(wavesAddr.startsWith("3P"), true, 'Endereço Waves deve iniciar com prefixo 3P');
    assert.strictEqual(amzxAddr.startsWith("3E"), true, 'Endereço AMZX (fork Waves) deve iniciar com prefixo 3E');
    assert.strictEqual(ploAddr.length, 35, 'Endereço PLO deve ter 35 caracteres');
    assert.strictEqual(turtleAddr.startsWith("3J"), true, 'Endereço Turtle Network deve iniciar com prefixo 3J');
  });

  await t.test('Deve validar corretamente endereços para todas as 17 redes', () => {
    // EVM
    assert.strictEqual(B2KeyDerivationEngine.validateAddress("0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5", "EVM"), true);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress("0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5", "EVM"), true);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress("0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5", "POLYGON"), true);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress("0xInvalidAddress", "EVM"), false);

    // Bitcoin
    const btcPriv = B2KeyDerivationEngine.derivePrivateKey(seed, 0);
    const btcAddr = B2KeyDerivationEngine.deriveAddress(btcPriv, "Bitcoin");
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(btcAddr, "Bitcoin"), true);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "BTC"), true);

    // Litecoin
    const ltcPriv = B2KeyDerivationEngine.derivePrivateKey(seed, 2);
    const ltcAddr = B2KeyDerivationEngine.deriveAddress(ltcPriv, "Litecoin");
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(ltcAddr, "Litecoin"), true);

    // Waves and forks
    const wavesPriv = B2KeyDerivationEngine.derivePrivateKey(seed, 3600);
    const wavesAddr = B2KeyDerivationEngine.deriveAddress(wavesPriv, "Waves");
    const amzxAddr = B2KeyDerivationEngine.deriveAddress(wavesPriv, "AMZX");
    const ploAddr = B2KeyDerivationEngine.deriveAddress(wavesPriv, "PLO");
    const turtleAddr = B2KeyDerivationEngine.deriveAddress(wavesPriv, "Turtle");

    assert.strictEqual(B2KeyDerivationEngine.validateAddress(wavesAddr, "Waves"), true);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(amzxAddr, "AMZX"), true);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(ploAddr, "PLO"), true);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(turtleAddr, "Turtle"), true);

    // Wrong chainId validation should fail
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(wavesAddr, "AMZX"), false);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(amzxAddr, "Waves"), false);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(ploAddr, "AMZX"), false);


    // Solana
    const solPriv = B2KeyDerivationEngine.derivePrivateKey(seed, 501);
    const solAddr = B2KeyDerivationEngine.deriveAddress(solPriv, "Solana");
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(solAddr, "Solana"), true);

    // Stellar
    const xlmPriv = B2KeyDerivationEngine.derivePrivateKey(seed, 148);
    const xlmAddr = B2KeyDerivationEngine.deriveAddress(xlmPriv, "Stellar");
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(xlmAddr, "Stellar"), true);
  });
});
