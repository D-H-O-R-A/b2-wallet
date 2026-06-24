/**
 * B2 Wallet - Testes Unitários de Solana (Solana Integration Suite)
 *
 * Tech Lead: Diego Oris (Better2Better)
 */

const test = require('node:test');
const assert = require('node:assert');
const { B2KeyDerivationEngine } = require('./setup');
const B2SolanaBroadcaster = require('../src/js/crypto/solana-broadcaster');
const solanaWeb3 = require('@solana/web3.js');

test('Suíte Solana - Derivação de Endereços Reais', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  await t.test('Deve derivar o endereço Solana padrão exato da especificação a partir do mnemônico', () => {
    // Endereço oficial derivado de m/44'/501'/0'/0' para o mnemônico de teste
    const expectedAddress = "HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk";

    const keypairData = B2SolanaBroadcaster.deriveSolanaKeyPair(mnemonic);
    assert.strictEqual(keypairData.address, expectedAddress, "Endereço derivado via B2SolanaBroadcaster deve bater com o esperado");
  });

  await t.test('Deve derivar o mesmo endereço correto a partir da chave privada hex na engine', () => {
    const expectedAddress = "HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk";
    const privateKeyHex = "37df573b3ac4ad5b522e064e25b63ea16bcbe79d449e81a0268d1047948bb445";

    const derivedAddress = B2KeyDerivationEngine.deriveAddress(privateKeyHex, "Solana");
    assert.strictEqual(derivedAddress, expectedAddress, "B2KeyDerivationEngine.deriveAddress deve retornar o endereço padrão");
  });
});

test('Suíte Solana - Assinatura de Transações', async (t) => {
  const privateKeyHex = "37df573b3ac4ad5b522e064e25b63ea16bcbe79d449e81a0268d1047948bb445";
  const seedBytes = new Uint8Array(privateKeyHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  const keypair = solanaWeb3.Keypair.fromSeed(seedBytes);

  await t.test('Deve assinar com sucesso uma transação de transferência de SOL', async () => {
    const tx = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: keypair.publicKey, // self-transfer
        lamports: 1000
      })
    );

    tx.recentBlockhash = "11111111111111111111111111111111"; // mock blockhash
    tx.feePayer = keypair.publicKey;

    tx.sign(keypair);

    assert.ok(tx.signatures[0].signature !== null, "Transação deve possuir assinatura");
    assert.strictEqual(tx.signatures[0].publicKey.toBase58(), keypair.publicKey.toBase58());
  });
});
