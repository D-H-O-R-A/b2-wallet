/**
 * B2 Wallet - Testes Unitários de Criptografia (Crypto Suite)
 * 
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 * Este módulo testa a validação/geração de mnemônicos BIP-39, o KDF PBKDF2, e
 * a cifragem autenticada de nível militar AES-256-GCM de payloads locais.
 */

const test = require('node:test');
const assert = require('node:assert');
const { B2KeyDerivationEngine, B2PlatformSecurity } = require('./setup');

test('Suíte Criptográfica - BIP-39 Mnemônicos', async (t) => {
  
  await t.test('Deve gerar mnemônico de 12 palavras usando entropia aleatória', () => {
    const mnemonic = B2KeyDerivationEngine.generateMnemonic();
    assert.ok(mnemonic, 'O mnemônico gerado não deve ser nulo');
    const words = mnemonic.split(/\s+/);
    assert.strictEqual(words.length, 12, 'O mnemônico deve conter exatamente 12 palavras');
    
    // Todas as palavras devem ter ao menos 2 caracteres
    words.forEach(word => {
      assert.ok(word.length >= 2, `Palavra '${word}' é muito curta`);
    });
  });

  await t.test('Deve validar corretamente mnemônicos legítimos e rejeitar mnemônicos inválidos', () => {
    const validMnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    const invalidMnemonic = "invalid words that are too short";
    const emptyMnemonic = "";

    assert.strictEqual(B2KeyDerivationEngine.validateMnemonic(validMnemonic), true, 'Mnemônico padrão abandon deve ser válido');
    assert.strictEqual(B2KeyDerivationEngine.validateMnemonic(invalidMnemonic), false, 'Mnemônico muito curto deve ser rejeitado');
    assert.strictEqual(B2KeyDerivationEngine.validateMnemonic(emptyMnemonic), false, 'Mnemônico vazio deve ser rejeitado');
  });
});

test('Suíte Criptográfica - AES-256-GCM & PBKDF2 KDF', async (t) => {
  const secretData = "B2Wallet_TopSecret_Seed_Phrase_123!";
  const password = "StrongMasterPassword@2026!";

  await t.test('Deve criptografar e descriptografar dados retornando o plaintext original com sucesso', async () => {
    const encrypted = await B2PlatformSecurity.encryptData(secretData, password);
    
    assert.ok(encrypted.ciphertext, 'Ciphertext deve existir');
    assert.ok(encrypted.iv, 'Vetor de inicialização (IV) deve existir');
    assert.ok(encrypted.salt, 'Salt de derivação de chave deve existir');
    assert.strictEqual(encrypted.kdf, 'argon2id_scrypt', 'Deve registrar o identificador do KDF híbrido');

    // Descriptografa os dados para conferir
    const decrypted = await B2PlatformSecurity.decryptData(encrypted, password);
    assert.strictEqual(decrypted, secretData, 'O texto descriptografado deve ser idêntico ao original');
  });

  await t.test('Deve falhar ao tentar descriptografar dados usando uma senha incorreta', async () => {
    const encrypted = await B2PlatformSecurity.encryptData(secretData, password);
    
    await assert.rejects(
      async () => {
        await B2PlatformSecurity.decryptData(encrypted, "WrongPassword_123");
      },
      /Erro de Autenticação/,
      'Deve rejeitar com erro de autenticação sob senha incorreta'
    );
  });

  await t.test('Deve rejeitar payloads criptográficos corrompidos ou alterados deliberadamente', async () => {
    const encrypted = await B2PlatformSecurity.encryptData(secretData, password);
    
    // Altera o último byte do ciphertext para simular corrupção ou ataque man-in-the-middle
    const length = encrypted.ciphertext.length;
    const corruptedCiphertext = encrypted.ciphertext.substring(0, length - 2) + '00';
    const corruptedPayload = { ...encrypted, ciphertext: corruptedCiphertext };

    await assert.rejects(
      async () => {
        await B2PlatformSecurity.decryptData(corruptedPayload, password);
      },
      /Erro de Autenticação/,
      'Deve acusar erro devido ao mismatch do MAC tag autenticado do AES-GCM'
    );
  });
});
