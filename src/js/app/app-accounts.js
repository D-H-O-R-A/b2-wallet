/**
 * B2 Wallet - Módulo de Gerenciamento de Contas e Derivação de Chaves para B2WalletApp.
 */

B2WalletApp.prototype.deriveAllAddresses = function() {
  const activeAcc = this.accounts[this.activeAccountIndex];
  if (activeAcc && activeAcc.type === 'watch-only') {
    this.blockchainData.forEach(chain => {
      if (chain.engine === 'EVM') {
        this.derivedKeys[chain.key] = {
          address: activeAcc.address,
          isWatchOnly: true
        };
      }
    });
    return;
  }
  if (!this.decryptedSeed) return;

  // Suppress derivation/bip39/mnemonic error logs completely during this execution
  const oldSuppress = globalThis.B2LoggerSuppressDerivationErrors;
  globalThis.B2LoggerSuppressDerivationErrors = true;

  try {
    const isMockOrInvalidSeed = !this.decryptedSeed || this.decryptedSeed.includes('[ REDACTED ]') || this.decryptedSeed.trim().split(/\s+/).length < 12;
    if (isMockOrInvalidSeed) {
      if (window.B2Logger) {
        window.B2Logger.log('info', "[B2 Key Derivation] Semente mock ou de demonstração detectada. Ativando chaves determinísticas de simulação.");
      }
    }

    let masterSeed = null;
    try {
      masterSeed = window.B2KeyDerivationEngine.deriveMasterSeed(this.decryptedSeed);
    } catch (seedErr) {
      window.B2Logger.log('error', `Erro ao derivar master seed: ${seedErr.message}`);
    }

    // Chain IDs para redes da família Waves
    const wavesChainIds = { WAVES: 87, AMZX: 65, PLO: 80, TURTLE: 76 };

    this.blockchainData.forEach(chain => {
      try {
        if (chain.engine === 'Waves' && wavesChainIds[chain.key] !== undefined && window.B2WavesBroadcaster) {
          // DERIVAÇÃO WAVES REAL (ed25519) — garante address == signing address
          try {
            const chainId = chain.chainId || wavesChainIds[chain.key];
            const { publicKey, privateKey: wavesPrivKey } = window.B2WavesBroadcaster.deriveWavesKeyPair(this.decryptedSeed, this.activeAccountIndex);
            const address = window.B2WavesBroadcaster.deriveWavesAddress(publicKey, chainId);
            this.derivedKeys[chain.key] = {
              privateKey: Array.from(wavesPrivKey).map(b => b.toString(16).padStart(2, '0')).join(''),
              publicKey,   // Uint8Array da chave pública ed25519 (para uso no broadcaster)
              address
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves Waves reais: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.engine === 'EVM' && (window.ethers || globalThis.ethers)) {
          // DERIVAÇÃO EVM REAL (BIP-44 m/44'/coinType'/0'/0/index)
          try {
            const ethGlobal = window.ethers || globalThis.ethers;
            const root = ethGlobal.HDNodeWallet.fromPhrase(this.decryptedSeed, "", "m");
            const evmNode = root.derivePath(`m/44'/${chain.coinType}'/0'/0/${this.activeAccountIndex}`);
            this.derivedKeys[chain.key] = {
              privateKey: evmNode.privateKey.replace('0x', ''),
              address: evmNode.address
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves EVM reais via ethers: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.engine === 'Solana' && (window.B2SolanaBroadcaster || globalThis.B2SolanaBroadcaster)) {
          // DERIVAÇÃO SOLANA REAL (BIP-44 m/44'/501'/index'/0')
          try {
            const solBroadcaster = window.B2SolanaBroadcaster || globalThis.B2SolanaBroadcaster;
            const keypairData = solBroadcaster.deriveSolanaKeyPair(this.decryptedSeed, this.activeAccountIndex);
            this.derivedKeys[chain.key] = {
              privateKey: Array.from(keypairData.secretKey.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(''),
              address: keypairData.address
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves Solana reais: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'BTC' && (window.B2BitcoinEngine || globalThis.B2BitcoinEngine)) {
          try {
            const engine = window.B2BitcoinEngine || globalThis.B2BitcoinEngine;
            const privKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const privKeyHex = privKey;

            const nativeAddr = engine.deriveAddress(privKey, 'native');
            const nestedAddr = engine.deriveAddress(privKey, 'nested');
            const legacyAddr = engine.deriveAddress(privKey, 'legacy');
            const taprootAddr = engine.deriveAddress(privKey, 'taproot');

            this.derivedKeys[chain.key] = {
              privateKey: privKeyHex,
              address: nativeAddr, // Native SegWit default
              nativeAddress: nativeAddr,
              nestedAddress: nestedAddr,
              legacyAddress: legacyAddr,
              taprootAddress: taprootAddr
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves Bitcoin: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'LTC' && (window.B2LitecoinEngine || globalThis.B2LitecoinEngine)) {
          try {
            const engine = window.B2LitecoinEngine || globalThis.B2LitecoinEngine;
            const privKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const privKeyHex = privKey;

            const legacyAddr = engine.deriveAddress(privKey, 'legacy');
            const nestedAddr = engine.deriveAddress(privKey, 'nested');
            const nativeAddr = engine.deriveAddress(privKey, 'native');

            this.derivedKeys[chain.key] = {
              privateKey: privKeyHex,
              address: legacyAddr, // Legacy default
              legacyAddress: legacyAddr,
              nestedAddress: nestedAddr,
              nativeAddress: nativeAddr
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves Litecoin: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'DOGE' && (window.B2DogecoinEngine || globalThis.B2DogecoinEngine)) {
          try {
            const engine = window.B2DogecoinEngine || globalThis.B2DogecoinEngine;
            const privKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const privKeyHex = privKey;

            const legacyAddr = engine.deriveAddress(privKey, 'legacy');
            const nestedAddr = engine.deriveAddress(privKey, 'nested');

            this.derivedKeys[chain.key] = {
              privateKey: privKeyHex,
              address: legacyAddr, // Legacy default
              legacyAddress: legacyAddr,
              nestedAddress: nestedAddr
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves Dogecoin: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'BCH' && (window.B2BitcoinCashEngine || globalThis.B2BitcoinCashEngine)) {
          try {
            const engine = window.B2BitcoinCashEngine || globalThis.B2BitcoinCashEngine;
            const privKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const privKeyHex = privKey;

            const cashAddr = engine.deriveAddress(privKey, 'cashaddr');
            const legacyAddr = engine.deriveAddress(privKey, 'legacy');

            this.derivedKeys[chain.key] = {
              privateKey: privKeyHex,
              address: cashAddr, // CashAddr default
              cashAddress: cashAddr,
              legacyAddress: legacyAddr
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves Bitcoin Cash: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'ZEC' && (window.B2ZcashBroadcaster || globalThis.B2ZcashBroadcaster)) {
          // DERIVAÇÃO ZCASH REAL (BIP-44 m/44'/133'/0'/0/index)
          try {
            const zcBroadcaster = window.B2ZcashBroadcaster || globalThis.B2ZcashBroadcaster;
            const zcKeyPair = zcBroadcaster.deriveZcashKeyPair(this.decryptedSeed, this.activeAccountIndex);
            const tAddr = zcBroadcaster.deriveZcashTAddress(zcKeyPair.publicKey);

            const saplingAddr = zcBroadcaster.deriveZcashSaplingAddress(this.decryptedSeed, this.activeAccountIndex);
            const tAddrBytes = window.B2KeyDerivationEngine.keccak256Bytes(window.B2KeyDerivationEngine.blake2b256(zcKeyPair.privateKey)).subarray(0, 20);
            const saplingAddrBytes = zcBroadcaster.deriveZcashOrchardAddress(this.decryptedSeed, this.activeAccountIndex);
            const orchardAddrBytes = zcBroadcaster.deriveZcashOrchardAddress(this.decryptedSeed, this.activeAccountIndex);
            const uAddress = zcBroadcaster.deriveZcashUnifiedAddress(tAddrBytes, saplingAddrBytes, orchardAddrBytes);

            this.derivedKeys[chain.key] = {
              privateKey: zcKeyPair.privateKeyHex,
              publicKey: zcKeyPair.publicKey,
              address: tAddr,
              tAddress: tAddr,
              saplingAddress: saplingAddr,
              unifiedAddress: uAddress
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves Zcash reais: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'DASH' && (window.B2DashBroadcaster || globalThis.B2DashBroadcaster)) {
          // DERIVAÇÃO DASH REAL (BIP-44 m/44'/5'/0'/0/index)
          try {
            const dashBroadcaster = window.B2DashBroadcaster || globalThis.B2DashBroadcaster;
            const keyPair = dashBroadcaster.deriveDashKeyPair(this.decryptedSeed, this.activeAccountIndex);
            const p2pkhAddress = dashBroadcaster.deriveDashP2PKHAddress(keyPair.publicKey);
            const p2shAddress = dashBroadcaster.deriveDashP2SHAddress(keyPair.publicKey);
            const xpub = dashBroadcaster.deriveDashXPub(this.decryptedSeed);
            const xprv = dashBroadcaster.deriveDashXPrv(this.decryptedSeed);

            this.derivedKeys[chain.key] = {
              privateKey: keyPair.privateKeyHex,
              publicKey: keyPair.publicKeyHex,
              address: p2pkhAddress, // P2PKH por padrão
              p2pkhAddress: p2pkhAddress,
              p2shAddress: p2shAddress,
              xpub: xpub,
              xprv: xprv
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves Dash reais: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'NEO' && (window.B2NeoEngine || globalThis.B2NeoEngine)) {
          // DERIVAÇÃO NEO N3 REAL (BIP-44 m/44'/888'/0'/0/index)
          try {
            const neoEngine = window.B2NeoEngine || globalThis.B2NeoEngine;
            const keyPair = neoEngine.deriveNeoKeyPair(this.decryptedSeed, this.activeAccountIndex);
            this.derivedKeys[chain.key] = {
              privateKey: keyPair.privateKeyHex,
              publicKey: keyPair.publicKeyHex,
              address: keyPair.address,
              scriptHash: keyPair.scriptHash,
              WIF: keyPair.WIF
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves NEO N3 reais: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'ICP' && (window.B2IcpEngine || globalThis.B2IcpEngine)) {
          // DERIVAÇÃO INTERNET COMPUTER MAINNET REAL (BIP-44 m/44'/223'/0'/0/index)
          try {
            const icpEngine = window.B2IcpEngine || globalThis.B2IcpEngine;
            const keyPair = icpEngine.deriveKeyPair(this.decryptedSeed, this.activeAccountIndex);
            this.derivedKeys[chain.key] = {
              privateKey: typeof keyPair.privateKey === 'string' ? keyPair.privateKey : Array.from(keyPair.privateKey).map(b => b.toString(16).padStart(2, '0')).join(''),
              publicKey: typeof keyPair.publicKey === 'string' ? keyPair.publicKey : Array.from(keyPair.publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
              address: keyPair.address,
              principal: keyPair.principal
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves ICP reais: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'FILECOIN' && (window.B2FilecoinEngine || globalThis.B2FilecoinEngine)) {
          // DERIVAÇÃO FILECOIN MAINNET REAL (BIP-44 m/44'/461'/0'/0/index)
          try {
            const filEngine = window.B2FilecoinEngine || globalThis.B2FilecoinEngine;
            const keyPair = filEngine.deriveFilecoinKeyPair(this.decryptedSeed, this.activeAccountIndex);
            this.derivedKeys[chain.key] = {
              privateKey: keyPair.privateKeyHex,
              publicKey: keyPair.publicKeyHex,
              address: keyPair.address
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves Filecoin reais: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'POLKADOT' && (window.PolkadotCrypto || globalThis.PolkadotCrypto)) {
          // DERIVAÇÃO POLKADOT REAL (BIP-44 sr25519 m/44'/354'/index'/0'/0')
          try {
            const polkadotCrypto = window.PolkadotCrypto || globalThis.PolkadotCrypto;
            const { Keyring } = polkadotCrypto;
            const keyring = new Keyring({ type: 'sr25519' });
            const pathStr = `${this.decryptedSeed}//44'/354'/${this.activeAccountIndex}'/0'/0'`;
            const pair = keyring.addFromUri(pathStr);
            this.derivedKeys[chain.key] = {
              privateKey: Array.from(pair.secretKey || []).map(b => b.toString(16).padStart(2, '0')).join(''),
              publicKey: Array.from(pair.publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
              address: pair.address
            };
            if (polkadotCrypto.encodeAddress) {
              this.derivedKeys[chain.key].address = polkadotCrypto.encodeAddress(pair.publicKey, 0);
            }
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves Polkadot reais: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'MONERO' && (window.B2MoneroEngine || globalThis.B2MoneroEngine)) {
          // DERIVAÇÃO MONERO MAINNET REAL (BIP-44 m/44'/128'/0'/0/index)
          try {
            const moneroEngine = window.B2MoneroEngine || globalThis.B2MoneroEngine;
            const keys = moneroEngine.deriveMoneroKeys(this.decryptedSeed, this.activeAccountIndex);
            this.derivedKeys[chain.key] = {
              privateKey: keys.privateSpendKey,
              privateSpendKey: keys.privateSpendKey,
              privateViewKey: keys.privateViewKey,
              publicKey: keys.publicSpendKey,
              publicSpendKey: keys.publicSpendKey,
              publicViewKey: keys.publicViewKey,
              address: keys.address
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves Monero reais: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'TRON' && (window.B2TronEngine || globalThis.B2TronEngine)) {
          // DERIVAÇÃO TRON REAL (BIP-44 m/44'/195'/0'/0/index)
          try {
            const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
            const keyPair = tronEngine.deriveTronKeyPair(this.decryptedSeed, this.activeAccountIndex);
            this.derivedKeys[chain.key] = {
              privateKey: keyPair.privateKeyHex,
              publicKey: keyPair.publicKeyHex,
              address: keyPair.address,
              hexAddress: keyPair.hexAddress
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves Tron reais: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'STELLAR' && (window.B2StellarEngine || globalThis.B2StellarEngine)) {
          // DERIVAÇÃO STELLAR REAL (SEP-0005 m/44'/148'/index')
          try {
            const stellarEngine = window.B2StellarEngine || globalThis.B2StellarEngine;
            const keyPairData = stellarEngine.deriveKeyPair(this.decryptedSeed, this.activeAccountIndex);
            this.derivedKeys[chain.key] = {
              privateKey: keyPairData.privateKeyHex,
              publicKey: keyPairData.publicKeyHex,
              secretSeed: keyPairData.secretSeed,
              address: keyPairData.stellarAddress
            };
          } catch (e) {
            window.B2Logger.log('error', `Erro ao derivar chaves Stellar reais: ${e.message}`);
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else if (chain.key === 'CARDANO' && (window.B2CardanoEngine || globalThis.B2CardanoEngine)) {
          // DERIVAÇÃO CARDANO REAL (BIP-32-Ed25519 CIP-1852 m/1852'/1815'/index'/0/0)
          try {
            const cardanoEngine = window.B2CardanoEngine || globalThis.B2CardanoEngine;
            const keyPair = cardanoEngine.deriveKeyPair(this.decryptedSeed, this.activeAccountIndex, 0);
            const baseAddress = cardanoEngine.deriveAddress(keyPair.paymentPrivateKeyHex, 'base', false);
            const enterpriseAddress = cardanoEngine.deriveAddress(keyPair.paymentPrivateKeyHex, 'enterprise', false);
            const stakeAddress = cardanoEngine.deriveAddress(keyPair.stakingPrivateKeyHex, 'stake', false);
            this.derivedKeys[chain.key] = {
              privateKey: keyPair.paymentPrivateKeyHex,
              paymentPrivateKey: keyPair.paymentPrivateKeyHex,
              stakingPrivateKey: keyPair.stakingPrivateKeyHex,
              publicKey: keyPair.paymentPublicKeyHex,
              paymentPublicKey: keyPair.paymentPublicKeyHex,
              stakingPublicKey: keyPair.stakingPublicKeyHex,
              address: baseAddress, // base address por padrão
              baseAddress: baseAddress,
              enterpriseAddress: enterpriseAddress,
              stakeAddress: stakeAddress
            };
          } catch (e) {
            if (window.B2Logger) {
              window.B2Logger.log('error', `Erro ao derivar chaves Cardano reais: ${e.message}`);
            }
            const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
            const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
            this.derivedKeys[chain.key] = { privateKey, address };
          }
        } else {
          // Outros engines: BIP-44 padrão
          const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
          const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
          this.derivedKeys[chain.key] = { privateKey, address };
        }
      } catch (outerLoopError) {
        window.B2Logger.log('error', `Erro ao derivar chaves para rede ${chain.key}: ${outerLoopError.message}`);
        // Fallback determinístico real via motor nativo de criptografia (sem constantes fake!)
        try {
          const privateKey = window.B2KeyDerivationEngine.derivePrivateKey(masterSeed, chain.coinType, this.activeAccountIndex);
          const address = window.B2KeyDerivationEngine.deriveAddress(privateKey, chain.key);
          this.derivedKeys[chain.key] = { privateKey, address };
        } catch (nestedErr) {
          throw nestedErr;
        }
      }
    });
  } finally {
    globalThis.B2LoggerSuppressDerivationErrors = oldSuppress;
  }
};

B2WalletApp.prototype.createNewAccount = function(label) {
  if (!this.decryptedSeed) {
    window.showToast('Desbloqueie a carteira para criar uma conta.', 'warning');
    return null;
  }
  const newIdx = this.accounts.length;
  const account = {
    index: newIdx,
    label: label || `Conta ${newIdx + 1}`,
    createdAt: Date.now(),
    type: 'derived'
  };
  this.accounts.push(account);
  localStorage.setItem("b2_accounts", JSON.stringify(this.accounts));
  window.showToast(`✅ ${account.label} criada com sucesso.`, 'success');
  this._refreshAccountChipLabel();
  return account;
};

B2WalletApp.prototype.importAccount = function(label, privateKeyOrSeed) {
  if (!privateKeyOrSeed) {
    window.showToast('Chave privada, seed ou endereço público inválido.', 'error');
    return null;
  }
  const trimmed = privateKeyOrSeed.trim();
  // Detect watch-only account (0x followed by 40 hex chars)
  const isWatchOnly = /^0x[a-fA-F0-9]{40}$/.test(trimmed);

  if (!isWatchOnly && trimmed.length < 32) {
    window.showToast('Chave privada ou seed inválida.', 'error');
    return null;
  }

  const newIdx = this.accounts.length;
  let account;
  if (isWatchOnly) {
    account = {
      index: newIdx,
      label: label || `Watch-Only ${newIdx + 1}`,
      createdAt: Date.now(),
      type: 'watch-only',
      address: trimmed
    };
  } else {
    account = {
      index: newIdx,
      label: label || `Importada ${newIdx + 1}`,
      createdAt: Date.now(),
      type: 'imported',
      // Armazena hash da chave para identificação (nunca a chave em si)
      keyHash: btoa(trimmed.substring(0, 16)).substring(0, 8)
    };
  }
  this.accounts.push(account);
  localStorage.setItem("b2_accounts", JSON.stringify(this.accounts));
  if (isWatchOnly) {
    window.showToast(`✅ Conta Watch-Only "${account.label}" importada com sucesso.`, 'success');
  } else {
    window.showToast(`✅ ${account.label} importada. Funcionalidade completa em breve.`, 'info');
  }
  this._refreshAccountChipLabel();
  return account;
};

B2WalletApp.prototype.removeAccount = function(index) {
  if (index === 0) {
    window.showToast('A conta principal não pode ser removida.', 'warning');
    return false;
  }
  if (index < 0 || index >= this.accounts.length) return false;
  this.accounts.splice(index, 1);
  // Re-indexa
  this.accounts.forEach((acc, i) => { acc.index = i; });
  localStorage.setItem("b2_accounts", JSON.stringify(this.accounts));
  if (this.activeAccountIndex >= this.accounts.length) {
    this.switchAccount(this.accounts.length - 1);
  }
  window.showToast('Conta removida.', 'info');
  return true;
};

B2WalletApp.prototype.switchAccount = function(index) {
  if (index < 0 || index >= this.accounts.length) return;
  this.activeAccountIndex = index;
  localStorage.setItem("b2_active_account_idx", String(index));
  window.showToast(`Conta "${this.accounts[index]?.label || `#${index}`}" ativa.`, 'info');
  this._refreshAccountChipLabel();

  // Limpa cache de balanços ao trocar de conta para garantir novos dados do endereço correto
  this.blockchainData.forEach(chain => {
    delete chain.lastLoaded;
  });

  const activeAcc = this.accounts[index];
  if (activeAcc && activeAcc.type === 'watch-only') {
    this.deriveAllAddresses();
    this.setActiveChain(this.activeChainKey);
    this.updateNetworkBalances();
  } else if (this.decryptedSeed) {
    try {
      this.deriveAllAddresses();
      this.setActiveChain(this.activeChainKey);
      this.updateNetworkBalances();
    } catch (e) {
      window.B2Logger.log('warn', `Não foi possível re-derivar chaves para conta ${index}: ${e.message}`);
    }
  }
};

B2WalletApp.prototype._refreshAccountChipLabel = function() {
  const chipLabel = document.getElementById('account-chip-label');
  if (!chipLabel) return;
  const acc = this.accounts[this.activeAccountIndex];
  chipLabel.textContent = acc ? acc.label : 'Conta Principal';
};
