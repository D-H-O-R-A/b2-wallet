/**
 * B2 Wallet - Testes Unitários de EVM (EVM Integration Suite)
 *
 * Tech Lead: Diego Oris (Better2Better)
 */

const test = require('node:test');
const assert = require('node:assert');
const { B2KeyDerivationEngine } = require('./setup');
const B2EVMBroadcaster = require('../src/js/crypto/evm-broadcaster');
const ethers = require('ethers');

test('Suíte EVM - Derivação de Endereços Reais', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  await t.test('Deve derivar o endereço Ethereum padrão exato da especificação a partir do mnemônico', () => {
    // Endereço oficial derivado de m/44'/60'/0'/0/0 para o mnemônico de teste
    const expectedAddress = "0x9858EfFD232B4033E47d90003D41EC34EcaEda94";

    const root = ethers.HDNodeWallet.fromPhrase(mnemonic, "", "m");
    const evmNode = root.derivePath("m/44'/60'/0'/0/0");
    
    assert.strictEqual(evmNode.address, expectedAddress, "Endereço derivado via ethers HDWallet deve bater com o esperado");
  });

  await t.test('Deve derivar o mesmo endereço correto a partir da chave privada hex na engine', () => {
    const expectedAddress = "0x9858EfFD232B4033E47d90003D41EC34EcaEda94";
    const privateKeyHex = "1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727";

    const derivedAddress = B2KeyDerivationEngine.deriveAddress(privateKeyHex, "EVM");
    assert.strictEqual(derivedAddress, expectedAddress, "B2KeyDerivationEngine.deriveAddress deve retornar o endereço padrão");
  });

  await t.test('Deve derivar o endereço a partir do B2EVMBroadcaster', () => {
    const expectedAddress = "0x9858EfFD232B4033E47d90003D41EC34EcaEda94";
    const privateKeyHex = "1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727";

    const derivedAddress = B2EVMBroadcaster.deriveEVMAddress(privateKeyHex);
    assert.strictEqual(derivedAddress, expectedAddress, "B2EVMBroadcaster.deriveEVMAddress deve retornar o endereço padrão");
  });
});

test('Suíte EVM - Assinatura de Transações', async (t) => {
  const privateKeyHex = "1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727";
  const wallet = new ethers.Wallet("0x" + privateKeyHex);

  await t.test('Deve assinar com sucesso uma transação de transferência nativa', async () => {
    const tx = {
      to: "0x9858EfFD232B4033E47d90003D41EC34EcaEda94",
      value: ethers.parseEther("0.1"),
      gasLimit: 21000n,
      gasPrice: ethers.parseUnits("30", "gwei"),
      nonce: 0,
      chainId: 1
    };

    const signedTx = await wallet.signTransaction(tx);
    assert.ok(signedTx.startsWith("0x"), "A transação assinada deve ser um hex de 0x");
    
    // Decodifica a transação assinada para verificar os dados
    const parsedTx = ethers.Transaction.from(signedTx);
    assert.strictEqual(parsedTx.to, tx.to);
    assert.strictEqual(parsedTx.value, tx.value);
    assert.strictEqual(parsedTx.nonce, tx.nonce);
    assert.strictEqual(parsedTx.chainId, 1n);
    assert.ok(parsedTx.signature, "Deve conter assinatura");
  });
});
