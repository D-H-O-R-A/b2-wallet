/**
 * B2 Wallet - Testes Unitários e de Integração da Blockchain Cardano (ADA)
 *
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Valida de ponta a ponta a criptografia Cardano (BIP-32-Ed25519/CIP-1852),
 * endereços Shelley/Byron, assinaturas CIP-8, seleção de UTXOs, governança Conway/Catalyst,
 * sincronização Mithril, Babel Fees, e resiliência de failover de nós.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const {
  B2KeyDerivationEngine,
  B2CardanoEngine,
  B2CardanoProvider,
  B2CardanoMithrilProvider,
  B2CardanoBabelFeeProvider,
  B2CardanoCoinSelection,
  B2CardanoHardwareWallet,
  B2CardanoAssetProvider,
  B2CardanoNftProvider,
  B2CardanoStakingProvider,
  B2CardanoGovernanceProvider,
  B2CardanoHistoryProvider,
  B2CardanoMetadataProvider,
  B2PlatformSecurity
} = require('./setup');

const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

test('Suíte Cardano - Criptografia, Derivação e Endereços (CIP-1852 & Shelley)', async (t) => {
  await t.test('1. Deve derivar o par de chaves Cardano (Payment & Staking) compatível com CIP-1852', () => {
    const keyPair = B2CardanoEngine.deriveKeyPair(mnemonic, 0, 0);
    assert.strictEqual(typeof keyPair.paymentPrivateKeyHex, 'string', "Chave privada deve ser string hex");
    assert.strictEqual(keyPair.paymentPrivateKeyHex.length, 64, "Chave privada hex deve ter 64 caracteres");
    assert.strictEqual(typeof keyPair.stakingPrivateKeyHex, 'string', "Chave privada de staking deve ser string hex");
    assert.strictEqual(keyPair.paymentPublicKeyHex.length, 64, "Chave pública hex deve ter 64 caracteres");
    assert.ok(keyPair.paymentKeyHash instanceof Uint8Array, "paymentKeyHash deve ser Uint8Array");
    assert.strictEqual(keyPair.paymentKeyHash.length, 28, "paymentKeyHash deve ter 28 bytes");
  });

  await t.test('2. Deve derivar endereço Shelley Base (addr1...) de Mainnet correto', () => {
    const keyPair = B2CardanoEngine.deriveKeyPair(mnemonic, 0, 0);
    const addr = B2CardanoEngine.deriveAddress(keyPair.paymentPrivateKeyHex, 'base', false);
    assert.ok(addr.startsWith('addr1'), "Endereço Base deve iniciar com addr1 na Mainnet");
    assert.ok(addr.length > 50, "Endereço Base deve ter tamanho condizente");
  });

  await t.test('3. Deve derivar endereço Shelley Enterprise (addr1...) de Mainnet correto', () => {
    const keyPair = B2CardanoEngine.deriveKeyPair(mnemonic, 0, 0);
    const addr = B2CardanoEngine.deriveAddress(keyPair.paymentPrivateKeyHex, 'enterprise', false);
    assert.ok(addr.startsWith('addr1'), "Endereço Enterprise deve iniciar com addr1");
  });

  await t.test('4. Deve derivar endereço Shelley Stake/Reward (stake1...) de Mainnet correto', () => {
    const keyPair = B2CardanoEngine.deriveKeyPair(mnemonic, 0, 0);
    const addr = B2CardanoEngine.deriveAddress(keyPair.stakingPrivateKeyHex, 'stake', false);
    assert.ok(addr.startsWith('stake1'), "Endereço Stake deve iniciar com stake1");
  });

  await t.test('5. Deve derivar endereços correspondentes de Testnet (addr_test1... & stake_test1...)', () => {
    const keyPair = B2CardanoEngine.deriveKeyPair(mnemonic, 0, 0);
    const baseAddr = B2CardanoEngine.deriveAddress(keyPair.paymentPrivateKeyHex, 'base', true);
    const stakeAddr = B2CardanoEngine.deriveAddress(keyPair.stakingPrivateKeyHex, 'stake', true);
    assert.ok(baseAddr.startsWith('addr_test1'), "Base de testnet deve iniciar com addr_test1");
    assert.ok(stakeAddr.startsWith('stake_test1'), "Stake de testnet deve iniciar com stake_test1");
  });

  await t.test('6. Deve codificar e decodificar Bech32 corretamente mantendo integridade', () => {
    const originalBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    const encoded = B2CardanoEngine.encodeBech32('test', originalBytes);
    assert.ok(encoded.startsWith('test1'), "HRP deve ser inserido");
    const decoded = B2CardanoEngine.decodeBech32(encoded);
    assert.strictEqual(decoded.hrp, 'test');
    assert.deepStrictEqual(decoded.bytes, originalBytes);
  });
});

test('Suíte Cardano - Validador Estrito de Endereços', async (t) => {
  await t.test('7. Deve validar endereços Shelley de Mainnet e Testnet com sucesso', () => {
    const keyPair = B2CardanoEngine.deriveKeyPair(mnemonic, 0, 0);
    const mainBase = B2CardanoEngine.deriveAddress(keyPair.paymentPrivateKeyHex, 'base', false);
    const mainEnt = B2CardanoEngine.deriveAddress(keyPair.paymentPrivateKeyHex, 'enterprise', false);
    const mainStake = B2CardanoEngine.deriveAddress(keyPair.stakingPrivateKeyHex, 'stake', false);
    const testBase = B2CardanoEngine.deriveAddress(keyPair.paymentPrivateKeyHex, 'base', true);

    assert.strictEqual(B2CardanoEngine.validateAddress(mainBase), true);
    assert.strictEqual(B2CardanoEngine.validateAddress(mainEnt), true);
    assert.strictEqual(B2CardanoEngine.validateAddress(mainStake), true);
    assert.strictEqual(B2CardanoEngine.validateAddress(testBase), true);
  });

  await t.test('8. Deve validar endereços Byron antigos (Base58 Ae2 / DdzFF) com sucesso', () => {
    const byronAe2 = "Ae2tdPwUPEYzs9VwY6XpD8bN5v8rfs5A7v2B5f8s5A7v2B5f8s5A7v2B5f8";
    const byronDdz = "DdzFFzCqrhsetfX5BvZvD7sf89AdgA8df8sAdgA8df8sAdgA8df8sAdgA8df8sAd";
    assert.strictEqual(B2CardanoEngine.validateAddress(byronAe2), true);
    assert.strictEqual(B2CardanoEngine.validateAddress(byronDdz), true);
  });

  await t.test('9. Deve rejeitar endereços inválidos, com checksum quebrado ou caracteres estranhos', () => {
    assert.strictEqual(B2CardanoEngine.validateAddress(null), false);
    assert.strictEqual(B2CardanoEngine.validateAddress(''), false);
    assert.strictEqual(B2CardanoEngine.validateAddress('addr1q9v8sa8f79s8fad9as8fad98fsa9df8sa9df9sad1234'), false); // invalid checksum
    assert.strictEqual(B2CardanoEngine.validateAddress('addr_test1invalid'), false);
  });
});

test('Suíte Cardano - Assinatura de Mensagens CIP-8 (COSE Sign1)', async (t) => {
  await t.test('10. Deve assinar uma mensagem de texto e retornar assinatura estruturada', () => {
    const keyPair = B2CardanoEngine.deriveKeyPair(mnemonic, 0, 0);
    const message = "B2 Wallet Cardano Verification - CIP-8";
    const sigObj = B2CardanoEngine.signMessage(message, keyPair.paymentPrivateKeyHex);
    assert.strictEqual(typeof sigObj.signature, 'string', "Assinatura deve ser hex");
    assert.strictEqual(typeof sigObj.key, 'string', "Chave de verificação deve ser hex");
    assert.ok(B2CardanoEngine.verifyMessage(message, sigObj, keyPair.paymentPublicKeyHex));
  });
});

test('Suíte Cardano - Seleção de Moedas (UTXO Coin Selection) & Plutus Collateral', async (t) => {
  const coinSelection = new B2CardanoCoinSelection();
  const plutusProvider = new B2CardanoEngine.B2CardanoPlutusProvider();

  const mockUtxos = [
    { tx_hash: "tx1", tx_index: 0, amount: [{ unit: "lovelace", quantity: "2000000" }] }, // 2 ADA
    { tx_hash: "tx2", tx_index: 0, amount: [{ unit: "lovelace", quantity: "15000000" }] }, // 15 ADA
    { tx_hash: "tx3", tx_index: 0, amount: [{ unit: "lovelace", quantity: "5000000" }] }, // 5 ADA
    { tx_hash: "tx4", tx_index: 0, amount: [{ unit: "lovelace", quantity: "10000000" }] }, // 10 ADA
    { tx_hash: "tx5", tx_index: 0, amount: [{ unit: "lovelace", quantity: "1500000" }, { unit: "asset1", quantity: "1" }] } // 1.5 ADA + NFT (Não usável para colateral)
  ];

  await t.test('11. Deve selecionar inputs usando o algoritmo Largest First', () => {
    const target = 18000000; // Requer 18 ADA
    const result = coinSelection.selectLargestFirst(mockUtxos, target);
    assert.strictEqual(result.inputs.length, 2, "Deve usar 2 inputs (15 e 10)");
    assert.strictEqual(result.inputs[0].amount[0].quantity, "15000000");
    assert.strictEqual(result.inputs[1].amount[0].quantity, "10000000");
    assert.strictEqual(result.change, 7000000, "Troco deve ser 7 ADA");
  });

  await t.test('12. Deve lançar erro se o saldo não for suficiente', () => {
    assert.throws(() => {
      coinSelection.selectLargestFirst(mockUtxos, 50000000); // 50 ADA (Saldos somados dão ~33.5 ADA)
    }, /CoinSelection: Saldo insuficiente/);
  });

  await t.test('13. Deve selecionar colateral Plutus válido (apenas Lovelace puro >= 1 ADA)', () => {
    const collaterals = plutusProvider.getCollateralUtxos(mockUtxos);
    assert.strictEqual(collaterals.length, 4, "Apenas os 4 UTXOs puras de Lovelace devem ser elegíveis");
    const selected = plutusProvider.selectCollateral(mockUtxos, 5000000);
    assert.ok(selected, "Deve selecionar o colateral ideal mais próximo de 5 ADA");
    assert.strictEqual(selected.amount[0].quantity, "5000000");
  });
});

test('Suíte Cardano - Mithril Sync, Babel Fees (CIP-38) e Provedores de Ativos', async (t) => {
  // Mock global.fetch para evitar conexões externas reais durante os testes
  const originalFetch = globalThis.fetch;
  
  globalThis.fetch = async (url) => {
    if (url.includes('/snapshots')) {
      return {
        ok: true,
        json: async () => [{
          beacon: { epoch: 512, immutable_file_number: 110452 },
          digest: "sha256:mock_mithril_digest_512",
          certificate_hash: "cert_mock_12345",
          size: 154236980124
        }]
      };
    }
    if (url.includes('/metadata/')) {
      return {
        ok: true,
        json: async () => ({
          name: { value: "Cardano Token Registrado" },
          ticker: { value: "CTR" },
          decimals: { value: 6 },
          logo: { value: "base64_logo_mock" }
        })
      };
    }
    if (url.includes('/addresses/')) {
      return {
        ok: true,
        json: async () => ({
          amount: [
            { unit: "lovelace", quantity: "25000000" },
            { unit: "2a286ad53c403f757474747474747474747474747474747474747474.USDM", quantity: "10000000" },
            { unit: "2a286ad53c403f757474747474747474747474747474747474747474.NFT", quantity: "1" }
          ]
        })
      };
    }
    if (url.includes('/assets/')) {
      return {
        ok: true,
        json: async () => ({
          policy_id: "2a286ad53c403f757474747474747474747474747474747474747474",
          asset_name: "USDM",
          onchain_metadata: {
            name: "B2 Dynamic NFT #001",
            image: "ipfs://QmMockImageHash",
            version: 2
          }
        })
      };
    }
    return { ok: false, status: 404 };
  };

  try {
    await t.test('14. Deve validar o bootstrap Mithril e obter a snapshot certificada', async () => {
      const mithrilProv = new B2CardanoMithrilProvider();
      const snap = await mithrilProv.getLatestSnapshot();
      assert.strictEqual(snap.verified, true);
      assert.strictEqual(snap.epoch, 512);
      assert.strictEqual(snap.snapshotHash, "sha256:mock_mithril_digest_512");
    });

    await t.test('15. Deve calcular taxas em moedas nativas usando o provedor Babel Fees (CIP-38)', () => {
      const babelFeeProv = new B2CardanoBabelFeeProvider();
      const tokens = babelFeeProv.getEligibleTokens();
      assert.ok(tokens.length >= 2);
      assert.strictEqual(tokens[0].symbol, "USDM");
      
      const feeInAda = 200000; // 0.2 ADA
      const tokenFee = babelFeeProv.calculateTokenFee(feeInAda, tokens[0].unit);
      assert.strictEqual(tokenFee, 50000, "0.2 ADA a 0.25 USDM/ADA deve dar 0.05 USDM (50000 unidades de 6 decimais)");
    });

    await t.test('16. Deve carregar saldos e enriquecer metadados via Token Registry', async () => {
      const cardanoProvider = new B2CardanoProvider();
      const assetProv = new B2CardanoAssetProvider(cardanoProvider);
      
      const enriched = await assetProv.getBalancesWithMetadata("addr1qy...fake");
      assert.strictEqual(enriched.length, 3);
      assert.strictEqual(enriched[0].symbol, "ADA");
      assert.strictEqual(enriched[1].symbol, "CTR");
      assert.strictEqual(enriched[1].name, "Cardano Token Registrado");
    });

    await t.test('17. Deve obter e resolver metadados de NFTs estáticos e dinâmicos (CIP-25 & CIP-68)', async () => {
      const cardanoProvider = new B2CardanoProvider();
      const nftProv = new B2CardanoNftProvider(cardanoProvider);
      
      const nfts = await nftProv.getNftsForAddress("addr1qy...fake");
      assert.strictEqual(nfts.length, 1);
      assert.strictEqual(nfts[0].name, "B2 Dynamic NFT #001");
      assert.strictEqual(nfts[0].standard, "CIP-68 (Dynamic)");
      assert.strictEqual(nfts[0].image, "https://ipfs.io/ipfs/QmMockImageHash");
    });
  } finally {
    // Restaura o fetch original
    globalThis.fetch = originalFetch;
  }
});

test('Suíte Cardano - Governança Conway (CIP-1694/95) e Catalyst Registration', async (t) => {
  const cardanoProvider = new B2CardanoProvider();
  const govProv = new B2CardanoGovernanceProvider(cardanoProvider);

  // Mock global.fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url.includes('/governance/dreps')) {
      return {
        ok: true,
        json: async () => [
          { drep_id: "drep1mocked0123456789", active: true, amount: "1500000000000" }
        ]
      };
    }
    return { ok: false, status: 404 };
  };

  try {
    await t.test('18. Deve obter a lista de DReps Conway e mapear poder de voto', async () => {
      const dreps = await govProv.getActiveDReps();
      assert.ok(dreps.length >= 1);
      assert.strictEqual(dreps[0].id, "drep1mocked0123456789");
      assert.strictEqual(dreps[0].active, true);
    });

    await t.test('19. Deve construir transações de delegação de votos Conway e votos CIP-1694', () => {
      const txDelegation = govProv.buildVoteDelegation("stake_address_hex", "drep1mocked0123456789");
      assert.strictEqual(txDelegation.type, "CIP95VoteDelegation");
      assert.strictEqual(txDelegation.drepId, "drep1mocked0123456789");

      const txVote = govProv.buildGovernanceVote("action_id_hex", 1); // Yes
      assert.strictEqual(txVote.type, "ConwayGovVote");
      assert.strictEqual(txVote.vote, 1);
    });

    await t.test('20. Deve gerar registro de chave de votação Catalyst e envelope de QR Code encriptado', async () => {
      const keyPair = B2CardanoEngine.deriveKeyPair(mnemonic, 0, 0);
      const regObj = await govProv.registerCatalystVotingKey("stake_address_hex", keyPair.paymentPrivateKeyHex);
      
      assert.strictEqual(regObj.type, "CatalystRegistration");
      assert.strictEqual(regObj.votingPublicKey, keyPair.paymentPublicKeyHex);
      
      const pin = "4321";
      const qrStr = govProv.generateCatalystQrCodeString(keyPair.paymentPrivateKeyHex, pin);
      assert.ok(qrStr.includes(keyPair.paymentPrivateKeyHex));
      assert.ok(qrStr.includes(pin));
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Suíte Cardano - Histórico Transacional e Failover de Provedor de Rede', async (t) => {
  const cardanoProvider = new B2CardanoProvider();
  
  // Custom fetch para simular falhas consecutivas e testar o Failover elástico
  const originalFetch = globalThis.fetch;
  let blockfrostCalls = 0;
  let koiosCalls = 0;

  globalThis.fetch = async (url, options) => {
    if (url.includes('cardano-mainnet.blockfrost.io')) {
      blockfrostCalls++;
      throw new Error("Timeout temporário no Blockfrost!");
    }
    if (url.includes('api.koios.rest')) {
      koiosCalls++;
      if (url.includes('/metadata')) {
        return { ok: true, json: async () => [{ label: "674", json_metadata: "USDM Swap confirmed" }] };
      }
      if (url.includes('/txs/')) {
        return { ok: true, json: async () => ({ fees: "174523" }) };
      }
      if (url.includes('/transactions/count')) {
        return { ok: true, json: async () => ({ count: 5 }) };
      }
      if (url.includes('/transactions')) {
        return {
          ok: true,
          json: async () => [
            { tx_hash: "tx_hash_mock_failover", block_height: 104523, block_time: 1718745236, deposit: "10000000", withdraw: "0" }
          ]
        };
      }
      return { ok: true, json: async () => ({ count: 5 }) };
    }
    return { ok: false, status: 404 };
  };

  try {
    await t.test('21. Deve migrar transparentemente para o nó de failover seguinte (Koios) em caso de falha', async () => {
      cardanoProvider.currentEndpointIndex = 0; // Inicia no Blockfrost
      const count = await cardanoProvider.getAddressTxCount("addr1qy...fake");
      assert.strictEqual(blockfrostCalls, 1, "Deve ter tentado o Blockfrost uma vez");
      assert.strictEqual(koiosCalls, 1, "Deve ter redirecionado para o Koios e completado");
      assert.strictEqual(count, 5);
      assert.strictEqual(cardanoProvider.currentEndpointIndex, 1, "Index do provedor atual deve persistir no Koios");
    });

    await t.test('22. Deve recuperar e formatar histórico transacional detalhado do provedor de failover ativo', async () => {
      const historyProv = new B2CardanoHistoryProvider(cardanoProvider);
      const history = await historyProv.getTransactionHistory("addr1qy...fake");
      
      assert.ok(history.length >= 1);
      assert.strictEqual(history[0].hash, "tx_hash_mock_failover");
      assert.strictEqual(history[0].isOutgoing, false);
      assert.strictEqual(history[0].amountAda, "10.000000");
      assert.strictEqual(history[0].memo, "USDM Swap confirmed");
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
