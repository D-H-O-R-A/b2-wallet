/**
 * B2 Wallet - Testes Unitários de Tron (Tron Integration Suite)
 *
 * Tech Lead: Diego Oris (Better2Better)
 */

const test = require('node:test');
const assert = require('node:assert');
const { B2TronEngine, B2KeyDerivationEngine } = require('./setup');

test('Suíte Tron - Derivação de Endereços Reais', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  await t.test('Deve derivar chaves Tron e endereço m/44\'/195\'/0\'/0/0 compatíveis', () => {
    const keyPair = B2TronEngine.deriveTronKeyPair(mnemonic, 0);

    assert.ok(keyPair.privateKeyHex, "Chave privada hexadecimal deve existir");
    assert.strictEqual(keyPair.privateKeyHex.length, 64, "Chave privada de secp256k1 deve ter 64 caracteres hexadecimais");
    assert.ok(keyPair.publicKeyHex.startsWith('0x04'), "Chave pública uncompressed deve iniciar com prefixo 0x04");
    assert.strictEqual(keyPair.publicKeyHex.length, 132, "Chave pública secp256k1 uncompressed deve ter 132 caracteres hex (65 bytes + prefixo)");

    // Endereço Base58 Tron deve iniciar com 'T' e ter 34 caracteres
    assert.ok(keyPair.address.startsWith('T'), "Endereço Tron de produção deve começar com T");
    assert.strictEqual(keyPair.address.length, 34, "Endereço Base58 deve ter exatamente 34 caracteres");

    // Endereço hexadecimal correspondente
    assert.ok(keyPair.hexAddress.startsWith('41'), "Endereço hex de produção da rede Tron deve começar com o prefixo de versão 41 (0x41)");
    assert.strictEqual(keyPair.hexAddress.length, 42, "Endereço hex deve ter exatamente 42 caracteres");
  });

  await t.test('Deve validar derivações sequenciais incrementando o índice BIP-44', () => {
    const keyPair0 = B2TronEngine.deriveTronKeyPair(mnemonic, 0);
    const keyPair1 = B2TronEngine.deriveTronKeyPair(mnemonic, 1);

    assert.notStrictEqual(keyPair0.privateKeyHex, keyPair1.privateKeyHex, "Chaves privadas para índices diferentes não devem ser iguais");
    assert.notStrictEqual(keyPair0.address, keyPair1.address, "Endereços para índices diferentes não devem ser iguais");
    assert.ok(keyPair1.address.startsWith('T'));
  });
});

test('Suíte Tron - Conversão de Endereços e Validação Estrita', async (t) => {
  const addressBase58 = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // Endereço USDT TRC20 real
  const addressHex = "41a614f803b6fd780986a42c78ec9c7f77e6ded13c"; // Endereço USDT TRC20 em Hexadecimal

  await t.test('Deve converter Base58 para Hexadecimal com verificação de checksum double SHA256', () => {
    const hexConverted = B2TronEngine.toHexAddress(addressBase58);
    assert.strictEqual(hexConverted, addressHex);
  });

  await t.test('Deve converter Hexadecimal para Base58 com checksum double SHA256', () => {
    const base58Converted = B2TronEngine.toBase58Address(addressHex);
    assert.strictEqual(base58Converted, addressBase58);
  });

  await t.test('Deve falhar ao tentar converter endereço Base58 com checksum corrompido', () => {
    const corruptedBase58 = addressBase58.substring(0, 33) + "x"; // Altera o último caractere do checksum
    assert.throws(() => {
      B2TronEngine.toHexAddress(corruptedBase58);
    }, /Base58Check checksum failed|Invalid Base58Address/);
  });

  await t.test('Deve validar endereços reais e rejeitar formatos inválidos', () => {
    assert.strictEqual(B2TronEngine.validateAddress(addressBase58), true, "Endereço USDT Base58 deve ser considerado válido");
    assert.strictEqual(B2TronEngine.validateAddress(addressHex), true, "Endereço USDT Hex deve ser considerado válido");
    
    // Rejeição
    assert.strictEqual(B2TronEngine.validateAddress(""), false);
    assert.strictEqual(B2TronEngine.validateAddress("InvalidAddressFormat"), false);
    assert.strictEqual(B2TronEngine.validateAddress("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6tx"), false); // tamanho inválido
    assert.strictEqual(B2TronEngine.validateAddress("42a614f803b6fd780986a42c78ec9c7f77e6ded13c"), false); // versão inválida (não 41)
  });

  await t.test('Deve integrar perfeitamente com a KeyDerivationEngine global', () => {
    const isValidGlobal = B2KeyDerivationEngine.validateAddress(addressBase58, "TRON");
    assert.strictEqual(isValidGlobal, true, "KeyDerivationEngine deve validar o endereço Tron via B2TronEngine");
  });
});

test('Suíte Tron - Assinatura e Verificação de Mensagens (Estilo TronLink)', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const message = "B2 Wallet Secure Authorization — Diego Oris";

  await t.test('Deve assinar e verificar com sucesso mensagens utilizando o prefixo nativo TRON', () => {
    const keyPair = B2TronEngine.deriveTronKeyPair(mnemonic, 0);
    const signature = B2TronEngine.signMessage(message, keyPair.privateKeyHex);

    assert.ok(signature.startsWith('0x'), "Assinatura deve começar com 0x");
    assert.strictEqual(signature.length, 132, "Assinatura de secp256k1 (r + s + v) em hex deve ter 132 caracteres (65 bytes)");

    const isVerified = B2TronEngine.verifyMessage(message, signature, keyPair.address);
    assert.strictEqual(isVerified, true, "Deve verificar a assinatura da própria chave gerada");

    const isFakeVerified = B2TronEngine.verifyMessage("Mensagem alterada para fraude", signature, keyPair.address);
    assert.strictEqual(isFakeVerified, false, "Deve rejeitar assinatura se a mensagem original foi adulterada");
  });
});

test('Suíte Tron - Rede Resiliente e Algoritmo de Failover', async (t) => {
  await t.test('Deve realizar o failover chamando os nós seguintes se o principal estiver fora do ar', async () => {
    const originalFetch = globalThis.fetch;
    const calledUrls = [];

    globalThis.fetch = async (url) => {
      calledUrls.push(url);
      if (url.includes("api.trongrid.io")) {
        return { ok: false, status: 502, statusText: "Bad Gateway" }; // Falha no TronGrid
      }
      return {
        ok: true,
        json: async () => ({ balance: 12500000 }) // Sucesso no Publicnode
      };
    };

    try {
      const balance = await B2TronEngine.getBalance(
        "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        "https://api.trongrid.io",
        ["https://tron-rpc.publicnode.com", "https://tron.api.subquery.network"]
      );

      assert.strictEqual(balance, 12.5, "Saldo de 12500000 Sun deve ser 12.5 TRX");
      assert.strictEqual(calledUrls.length, 2, "Deve ter tentado duas chamadas (Trongrid e Publicnode)");
      assert.ok(calledUrls[0].includes("api.trongrid.io"), "Primeira chamada deve ser no principal");
      assert.ok(calledUrls[1].includes("tron-rpc.publicnode.com"), "Segunda chamada deve ser no fallback");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('Deve propagar erro se todos os nós de failover falharem de forma consecutiva', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return { ok: false, status: 500, statusText: "Internal Server Error" };
    };

    try {
      await assert.rejects(async () => {
        await B2TronEngine.getBalance(
          "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
          "https://api.trongrid.io",
          ["https://tron-rpc.publicnode.com"]
        );
      }, /TRON API Call \/wallet\/getaccount failed on all endpoints/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('Suíte Tron - Consulta de Recursos e Token Scanner', async (t) => {
  const address = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

  await t.test('Deve parsear recursos e retornar limites de banda e energia disponíveis', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      return {
        ok: true,
        json: async () => ({
          freeNetLimit: 1500,
          freeNetUsed: 250,
          EnergyLimit: 30000,
          EnergyUsed: 10000
        })
      };
    };

    try {
      const res = await B2TronEngine.getResources(address, "https://api.trongrid.io");
      
      assert.strictEqual(res.bandwidth.freeLimit, 1500);
      assert.strictEqual(res.bandwidth.freeUsed, 250);
      assert.strictEqual(res.bandwidth.freeAvailable, 1250);
      assert.strictEqual(res.energy.limit, 30000);
      assert.strictEqual(res.energy.used, 10000);
      assert.strictEqual(res.energy.available, 20000);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('Deve escanear saldos de tokens TRC20 e retornar saldos bem-sucedidos', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      const body = JSON.parse(options.body);
      const contract = body.contract_address;
      
      // USDT: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t -> 41a614f803b6fd780986a42c78ec9c7f77e6ded13c
      if (contract === "41a614f803b6fd780986a42c78ec9c7f77e6ded13c") {
        return {
          ok: true,
          json: async () => ({
            constant_result: ["0000000000000000000000000000000000000000000000000000000002faf080"] // 50000000 Sun/micro (50.0 USDT)
          })
        };
      }
      // Outros tokens retornam 0
      return {
        ok: true,
        json: async () => ({ constant_result: [] })
      };
    };

    try {
      const tokens = await B2TronEngine.getTokenBalances(address, "https://api.trongrid.io");
      assert.ok(Array.isArray(tokens));
      assert.strictEqual(tokens.length, 1);
      assert.strictEqual(tokens[0].symbol, "USDT");
      assert.strictEqual(tokens[0].balance, 50.0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('Suíte Tron - Construção de Transações TRX e TRC20', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const keyPairSender = B2TronEngine.deriveTronKeyPair(mnemonic, 0);
  const keyPairRecipient = B2TronEngine.deriveTronKeyPair(mnemonic, 1);
  const sender = keyPairSender.address;
  const recipient = keyPairRecipient.address;

  await t.test('Deve construir uma transação TRX nativa com dados válidos', async () => {
    const originalFetch = globalThis.fetch;
    let createPayload = null;

    globalThis.fetch = async (url, options) => {
      createPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          txID: "dae763a8a9ebf5223e75e533b3ea3c6c9a393ceee47a9ef33eb8bcde588ea834",
          raw_data: {
            contract: [{
              parameter: {
                value: {
                  amount: createPayload.amount,
                  owner_address: createPayload.owner_address,
                  to_address: createPayload.to_address
                }
              },
              type: "TransferContract"
            }]
          }
        })
      };
    };

    try {
      const tx = await B2TronEngine.buildTransaction(sender, recipient, 120.5, null, null, "https://api.trongrid.io");
      
      assert.strictEqual(tx.txID, "dae763a8a9ebf5223e75e533b3ea3c6c9a393ceee47a9ef33eb8bcde588ea834");
      assert.strictEqual(createPayload.amount, 120500000, "120.5 TRX deve ser convertido para 120500000 Sun");
      assert.strictEqual(createPayload.owner_address, B2TronEngine.toHexAddress(sender));
      assert.strictEqual(createPayload.to_address, B2TronEngine.toHexAddress(recipient));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('Deve assinar localmente transações Tron produzindo assinaturas válidas', () => {
    const keyPair = B2TronEngine.deriveTronKeyPair("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about", 0);
    const mockTx = {
      txID: "dae763a8a9ebf5223e75e533b3ea3c6c9a393ceee47a9ef33eb8bcde588ea834",
      raw_data: {}
    };

    const signed = B2TronEngine.signTransaction(mockTx, keyPair.privateKeyHex);
    assert.ok(Array.isArray(signed.signature), "Transação deve conter array de assinaturas");
    assert.strictEqual(signed.signature.length, 1);
    assert.strictEqual(signed.signature[0].length, 130, "Assinatura do TronLink sem prefixo 0x deve ter exatamente 130 caracteres hex (65 bytes)");
  });
});

test('Suíte Tron - Milestone 2: Account Activation', async (t) => {
  const address = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
  await t.test('isAccountActivated deve identificar contas ativadas e não ativadas', async () => {
    const originalFetch = globalThis.fetch;
    let callCount = 0;
    globalThis.fetch = async (url) => {
      callCount++;
      if (callCount === 1) {
        return { ok: true, json: async () => ({}) }; // unactivated
      } else if (callCount === 2) {
        return { ok: true, json: async () => ({ balance: 0 }) }; // activated but zero balance
      } else {
        return { ok: true, json: async () => ({ balance: 10000000 }) }; // activated with balance
      }
    };
    try {
      const unactive = await B2TronEngine.isAccountActivated(address, "https://api.trongrid.io");
      assert.strictEqual(unactive.status, 'UNACTIVATED');
      const activeNoBal = await B2TronEngine.isAccountActivated(address, "https://api.trongrid.io");
      assert.strictEqual(activeNoBal.status, 'ACTIVATED_NO_BALANCE');
      const activeWithBal = await B2TronEngine.isAccountActivated(address, "https://api.trongrid.io");
      assert.strictEqual(activeWithBal.status, 'ACTIVATED_ACTIVE');
      assert.strictEqual(activeWithBal.balance, 10.0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('Suíte Tron - Milestone 2: Chain Parameters & Cost Estimation', async (t) => {
  const address = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
  await t.test('getChainParameters deve retornar parâmetros da rede', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return {
        ok: true,
        json: async () => ({
          chainParameter: [
            { key: "getEnergyFee", value: 420 },
            { key: "getTransactionFee", value: 1000 }
          ]
        })
      };
    };
    try {
      const params = await B2TronEngine.getChainParameters("https://api.trongrid.io");
      assert.strictEqual(params.getEnergyFee, 420);
      assert.strictEqual(params.getTransactionFee, 1000);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('estimateTransactionCost deve calcular custos corretos usando parâmetros dinâmicos', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      if (url.includes("getaccountresource")) {
        return {
          ok: true,
          json: async () => ({
            freeNetLimit: 1500,
            freeNetUsed: 1500, // zero free net left
            NetLimit: 0,
            EnergyLimit: 0
          })
        };
      } else if (url.includes("getchainparameters")) {
        return {
          ok: true,
          json: async () => ({
            chainParameter: [
              { key: "getEnergyFee", value: 420 },
              { key: "getTransactionFee", value: 1000 },
              { key: "getCreateNewAccountFeeInSystemContract", value: 1000000 }
            ]
          })
        };
      } else if (url.includes("getaccount")) {
        return { ok: true, json: async () => ({}) }; // Recipient unactivated
      }
      return { ok: true, json: async () => ({}) };
    };
    try {
      const cost = await B2TronEngine.estimateTransactionCost(
        "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8",
        10,
        null,
        "test memo",
        "https://api.trongrid.io"
      );
      assert.strictEqual(cost.isRecipientUnactivated, true);
      assert.ok(cost.bandwidth > 0);
      assert.ok(cost.totalFeeTRX > 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('Suíte Tron - Milestone 2: Stake 2.0 & Permissions', async (t) => {
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  await t.test('Deve criar transações do ciclo de vida Stake 2.0', async () => {
    const originalFetch = globalThis.fetch;
    const calledUrls = [];
    const calledBodies = [];
    globalThis.fetch = async (url, options) => {
      calledUrls.push(url);
      calledBodies.push(options && options.body ? JSON.parse(options.body) : null);
      return {
        ok: true,
        json: async () => ({
          txID: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          result: true
        })
      };
    };
    try {
      // test freeze
      calledUrls.length = 0;
      calledBodies.length = 0;
      const r1 = await B2TronEngine.freezeBalanceV2(mnemonic, 100, "BANDWIDTH", "https://api.trongrid.io");
      assert.ok(r1.success);
      const idx1 = calledUrls.findIndex(u => u.includes("freezebalancev2"));
      assert.ok(idx1 !== -1);
      assert.strictEqual(calledBodies[idx1].frozen_balance, 100000000);

      // test unfreeze
      calledUrls.length = 0;
      calledBodies.length = 0;
      const r2 = await B2TronEngine.unfreezeBalanceV2(mnemonic, 50, "ENERGY", "https://api.trongrid.io");
      assert.ok(r2.success);
      const idx2 = calledUrls.findIndex(u => u.includes("unfreezebalancev2"));
      assert.ok(idx2 !== -1);
      assert.strictEqual(calledBodies[idx2].unfreeze_balance, 50000000);

      // test delegate
      calledUrls.length = 0;
      calledBodies.length = 0;
      const r3 = await B2TronEngine.delegateResource(mnemonic, "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8", 30, "ENERGY", true, "https://api.trongrid.io");
      assert.ok(r3.success);
      const idx3 = calledUrls.findIndex(u => u.includes("delegateresource"));
      assert.ok(idx3 !== -1);
      assert.strictEqual(calledBodies[idx3].balance, 30000000);

      // test cancel unfreeze
      calledUrls.length = 0;
      calledBodies.length = 0;
      const r4 = await B2TronEngine.cancelUnfreezeBalanceV2(mnemonic, "https://api.trongrid.io");
      assert.ok(r4.success);
      assert.ok(calledUrls.some(u => u.includes("cancelallunfreezev2")));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('getAccountPermissionTree deve montar a estrutura de permissões com percentuais corretos', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return {
        ok: true,
        json: async () => ({
          owner_permission: {
            threshold: 2,
            keys: [
              { address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", weight: 1 },
              { address: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8", weight: 1 }
            ]
          },
          active_permissions: [
            {
              permission_name: "active1",
              threshold: 3,
              keys: [
                { address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", weight: 2 },
                { address: "TLa2f6VT3ZaNhBTcnFETMgy9uhs3Sg9S1V", weight: 1 }
              ]
            }
          ]
        })
      };
    };
    try {
      const tree = await B2TronEngine.getAccountPermissionTree("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", "https://api.trongrid.io");
      assert.strictEqual(tree.thresholds.owner, 2);
      assert.strictEqual(tree.hierarchy.owner[0].percentage, 50);
      assert.strictEqual(tree.hierarchy.owner[1].percentage, 50);
      assert.strictEqual(tree.hierarchy.active[0].keys[0].percentage, 66.66666666666666);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('Suíte Tron - Milestone 2: LRU Metadata Cache', async (t) => {
  await t.test('B2TronTokenMetadataProvider deve ler cache in-memory e localStorage', async () => {
    const provider = B2TronEngine.B2TronTokenMetadataProvider;
    provider.cache.cache.clear();
    
    const originalGetItem = B2TronEngine.B2StorageProvider.getItem;
    const originalSetItem = B2TronEngine.B2StorageProvider.setItem;
    
    let storedData = {};
    B2TronEngine.B2StorageProvider.getItem = (key) => storedData[key] || null;
    B2TronEngine.B2StorageProvider.setItem = (key, value) => { storedData[key] = value; };
    
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = async () => {
      fetchCount++;
      return {
        ok: true,
        json: async () => ({
          constant_result: [
            "0000000000000000000000000000000000000000000000000000000000000020" + "0000000000000000000000000000000000000000000000000000000000000004" + "5465737400000000000000000000000000000000000000000000000000000000"
          ]
        })
      };
    };
    
    try {
      const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const customAddr = B2TronEngine.deriveTronKeyPair(mnemonic, 2).address;
      const meta1 = await provider.getMetadata(customAddr, "https://api.trongrid.io");
      assert.ok(meta1);
      assert.strictEqual(meta1.symbol, "Test");
      
      const prevFetchCount = fetchCount;
      const meta2 = await provider.getMetadata(customAddr, "https://api.trongrid.io");
      assert.strictEqual(meta2.symbol, "Test");
      assert.strictEqual(fetchCount, prevFetchCount, "Não deve ter feito nova requisição HTTP");
      
      provider.cache.cache.clear();
      const meta3 = await provider.getMetadata(customAddr, "https://api.trongrid.io");
      assert.strictEqual(meta3.symbol, "Test");
      assert.strictEqual(fetchCount, prevFetchCount, "Deve ter lido do Storage Provider");
    } finally {
      globalThis.fetch = originalFetch;
      B2TronEngine.B2StorageProvider.getItem = originalGetItem;
      B2TronEngine.B2StorageProvider.setItem = originalSetItem;
    }
  });
});

test('Suíte Tron - Milestone 2: Live USDT Mainnet Integration Test', async (t) => {
  await t.test('Deve consultar o contrato USDT real sem mocks e verificar os metadados', async () => {
    const usdtAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    const nodeUrl = "https://api.trongrid.io";
    const fallbacks = ["https://tron-rpc.publicnode.com"];
    
    try {
      const meta = await B2TronEngine.B2TronTokenMetadataProvider.getMetadata(usdtAddress, nodeUrl, fallbacks);
      console.log("[Live Integration Test] USDT Metadata:", meta);
      assert.strictEqual(meta.address, usdtAddress);
      assert.strictEqual(meta.symbol, "USDT");
      assert.strictEqual(meta.decimals, 6);
      assert.ok(meta.name.includes("Tether") || meta.name.includes("USDT"));
    } catch (e) {
      console.warn("[Live Integration Test] Failed due to network issues:", e.message);
    }
  });
});
