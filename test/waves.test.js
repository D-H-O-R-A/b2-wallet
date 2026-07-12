/**
 * B2 Wallet - Testes Unitários de Waves (Waves Integration Suite)
 *
 * Tech Lead: Diego Oris (Better2Better)
 */

const test = require('node:test');
const assert = require('node:assert');
const { B2WavesBroadcaster, B2KeyDerivationEngine } = require('./setup');

test('Suíte Waves - Derivação de Endereços Reais', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  await t.test('Deve derivar o par de chaves Waves padrão e endereço compatível a partir do mnemônico', () => {
    // Derivação de par de chaves via Waves Broadcaster
    const keypair = B2WavesBroadcaster.deriveWavesKeyPair(mnemonic, 0);
    assert.ok(keypair.privateKey instanceof Uint8Array, "Chave privada deve ser Uint8Array");
    assert.ok(keypair.publicKey instanceof Uint8Array, "Chave pública deve ser Uint8Array");
    assert.strictEqual(keypair.publicKey.length, 32, "Chave pública ed25519 deve ter 32 bytes");
    assert.strictEqual(typeof keypair.publicKeyBase58, "string", "Public key Base58 deve ser uma string");

    // Derivação de endereço Waves (chainId 87)
    const addressWaves = B2WavesBroadcaster.deriveWavesAddress(keypair.publicKey, 87);
    assert.strictEqual(addressWaves.startsWith("3P"), true, "Endereço Waves deve iniciar com 3P");
    assert.strictEqual(addressWaves.length, 35, "Endereço Waves deve ter exatamente 35 caracteres");

    // Valida endereço na KeyDerivationEngine
    const isValidWaves = B2KeyDerivationEngine.validateAddress(addressWaves, "Waves");
    assert.strictEqual(isValidWaves, true, "Endereço Waves gerado deve ser considerado válido pela Engine");
  });

  await t.test('Deve derivar endereços corretos para forks (AMZX, PLO, Turtle Network) e validar chainIds', () => {
    const keypair = B2WavesBroadcaster.deriveWavesKeyPair(mnemonic, 0);

    // AMZX (chainId 65)
    const addressAmzx = B2WavesBroadcaster.deriveWavesAddress(keypair.publicKey, 65);
    assert.strictEqual(addressAmzx.startsWith("3E"), true, "Endereço AMZX deve iniciar com 3E");
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(addressAmzx, "AMZX"), true, "Endereço AMZX deve ser válido");

    // PLO (chainId 80)
    const addressPlo = B2WavesBroadcaster.deriveWavesAddress(keypair.publicKey, 80);
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(addressPlo, "PLO"), true, "Endereço PLO deve ser válido com PLO");
    assert.strictEqual(B2KeyDerivationEngine.validateAddress(addressPlo, "WAVES"), false, "Endereço PLO não deve ser válido para rede WAVES");
  });
});

test('Suíte Waves - Assinatura e Transmissão de Transações', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const nodeUrl = "https://mock-node.wavesnodes.com";
  // Generate a valid Waves recipient address dynamically to avoid invalid Base58 characters
  const keypairTmp = B2WavesBroadcaster.deriveWavesKeyPair(mnemonic, 1);
  const recipient = B2WavesBroadcaster.deriveWavesAddress(keypairTmp.publicKey, 87);

  await t.test('Deve construir, assinar e transmitir uma transação de transferência nativa', async () => {
    // Mock global fetch para interceptar a transmissão
    const originalFetch = globalThis.fetch;
    let broadcastPayload = null;
    let broadcastUrl = null;

    globalThis.fetch = async (url, options) => {
      broadcastUrl = url;
      broadcastPayload = JSON.parse(options.body);
      return {
        ok: true,
        text: async () => JSON.stringify({ ...broadcastPayload, id: "tx_mock_hash_transfer_12345" })
      };
    };

    try {
      const response = await B2WavesBroadcaster.sendWavesTransfer(
        mnemonic,
        nodeUrl,
        recipient,
        1.5, // 1.5 WAVES
        null, // assetId nativo
        "B2 Wallet Rules!" // memo/memo attachment
      );

      assert.strictEqual(broadcastUrl, "https://mock-node.wavesnodes.com/transactions/broadcast");
      assert.strictEqual(broadcastPayload.type, 4, "Tipo da transação de transferência deve ser 4");
      assert.strictEqual(broadcastPayload.version, 2, "Versão deve ser 2");
      assert.strictEqual(broadcastPayload.amount, 150000000, "1.5 WAVES deve ser 150000000 wavelets");
      assert.strictEqual(broadcastPayload.fee, 100000, "Fee padrão deve ser 100000");
      assert.strictEqual(broadcastPayload.recipient, recipient, "Endereço de destino deve ser o destinatário informado");
      assert.ok(Array.isArray(broadcastPayload.proofs) && broadcastPayload.proofs.length === 1, "Deve conter uma assinatura (proof)");
      assert.strictEqual(response.id, "tx_mock_hash_transfer_12345", "A resposta do broadcast deve conter o ID mock");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('Deve construir, assinar e iniciar um arrendamento LPoS (Lease)', async () => {
    const originalFetch = globalThis.fetch;
    let broadcastPayload = null;

    globalThis.fetch = async (url, options) => {
      broadcastPayload = JSON.parse(options.body);
      return {
        ok: true,
        text: async () => JSON.stringify({ ...broadcastPayload, id: "tx_mock_hash_lease_12345" })
      };
    };

    try {
      const response = await B2WavesBroadcaster.startWavesLease(
        mnemonic,
        nodeUrl,
        recipient,
        100.0 // Lease 100 WAVES
      );

      assert.strictEqual(broadcastPayload.type, 8, "Tipo de transação de Lease deve ser 8");
      assert.strictEqual(broadcastPayload.version, 2, "Versão de transação de Lease deve ser 2");
      assert.strictEqual(broadcastPayload.amount, 10000000000, "100 WAVES deve ser 10000000000 wavelets");
      assert.strictEqual(broadcastPayload.recipient, recipient);
      assert.ok(broadcastPayload.proofs[0].length > 40, "Assinatura proof deve ser um Base58 válido de tamanho decente");
      assert.strictEqual(response.id, "tx_mock_hash_lease_12345");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('Deve construir, assinar e cancelar um arrendamento LPoS (LeaseCancel)', async () => {
    const originalFetch = globalThis.fetch;
    let broadcastPayload = null;
    const leaseId = "HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk";

    globalThis.fetch = async (url, options) => {
      broadcastPayload = JSON.parse(options.body);
      return {
        ok: true,
        text: async () => JSON.stringify({ ...broadcastPayload, id: "tx_mock_hash_lease_cancel_123" })
      };
    };

    try {
      const response = await B2WavesBroadcaster.cancelWavesLease(
        mnemonic,
        nodeUrl,
        leaseId,
        87 // chainId WAVES
      );

      assert.strictEqual(broadcastPayload.type, 9, "Tipo de transação LeaseCancel deve ser 9");
      assert.strictEqual(broadcastPayload.version, 2, "Versão de transação LeaseCancel deve ser 2");
      assert.strictEqual(broadcastPayload.leaseId, leaseId, "Deve carregar o Lease ID correto a ser cancelado");
      assert.strictEqual(broadcastPayload.chainId, 87, "Deve carregar a chainId correspondente");
      assert.ok(broadcastPayload.proofs[0].length > 40);
      assert.strictEqual(response.id, "tx_mock_hash_lease_cancel_123");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
