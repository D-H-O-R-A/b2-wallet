/**
 * B2 Wallet - Lógica de Controle Central do Aplicativo (App Core Engine)
 * 
 * Desenvolvido pela equipe sênior sob a liderança do Diego Oris.
 * Este módulo unifica o estado central da carteira, gerencia as 17 redes de blockchains,
 * os temporizadores reativos de Auto-Lock, a autenticação por PIN/Senha e o tratamento de eventos
 * bidirecionais das chamadas DApps via SDK.
 */

class B2WalletApp {
  constructor() {
    this.currentLanguage = localStorage.getItem("b2_language") || "pt";
    this.currentTheme = localStorage.getItem("b2_theme") || "dark";
    this.autoLockMinutes = parseInt(localStorage.getItem("b2_autolock_minutes")) || 5;

    // Estado volátil na RAM (Apagados imediatamente no lock)
    this.decryptedSeed = null;
    this.derivedKeys = {}; // Armazena temporariamente endereços e chaves privadas ativas

    // Configurações e payloads criptográficos persistentes salvos localmente
    this.encryptedWalletPayload = null;
    this.userPinHash = null; // PIN persistente de acesso rápido
    this.autoLockTimer = null;
    this.lastInteractionTime = Date.now();
    this.lastUnlockTime = 0; // Monitora política de 30 minutos de exigência de senha

    // Onboarding and confirmation state flow
    this.isImportFlow = false;
    this.generatedMnemonicStr = "";
    this.confirmIndices = [];

    // Definição das blockchains a partir do registro modular unificado (Standard Registry Layout)
    const registry = window.B2BlockchainRegistry || [];
    this.blockchainData = registry.map(chain => ({
      ...chain,
      balanceCrypto: 0.0,
      balanceFiat: 0.0,
      discoveredTokens: [],
      discoveredNFTs: []
    }));

    this.testnetEnabled = localStorage.getItem("b2_testnet_enabled") === "true";
    this.networkMode = localStorage.getItem("b2_network_mode") || "mainnet";
    this.rebuildBlockchainData();

    // Gateway Focus Mode state
    this.activeChainKey = localStorage.getItem("b2_active_chain_key") || "ETH";
    this.activeBalanceUpdates = {};

    // ── MANUTENÇÃO ───────────────────────────────────────────────────────────
    // IDs das blockchains em manutenção (ex: ['BTC', 'ETH'])
    this.maintenanceChains = ['DOGE', 'BCH', "LTC", "BTC", "DASH", "ZEC", "CARDANO", "TRON", "STELLAR", "MONERO", "POLKADOT", "ICP", "FILECOIN", "NEO"];
    // IDs dos tokens em manutenção (ex: ['USDT', 'assetId_aqui'])
    this.maintenanceTokens = [];
    // ────────────────────────────────────────────────────────────────────────
  }

  /**
   * Ponto de entrada e inicialização global do ecossistema de carteira.
   */
  async initialize() {
    // Detecta se está sendo executada no popup da extensão e aplica configurações estritas (compatível com Chrome, Firefox e outros)
    const isExtensionPopup = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL &&
      window.location.protocol.includes('extension') &&
      !window.location.search.includes('fulltab=true')) ||
      window.location.search.includes('popup=true');

    if (isExtensionPopup) {
      document.documentElement.classList.add('is-extension-popup');
      const expandBtn = document.getElementById("b2-expand-btn");
      if (expandBtn) {
        expandBtn.style.display = "flex";
        expandBtn.addEventListener('click', () => {
          if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
            chrome.tabs.create({ url: chrome.runtime.getURL('index.html?fulltab=true') });
          } else {
            window.open('index.html?fulltab=true', '_blank');
          }
        });
      }
    } else {
      document.documentElement.classList.add('is-fulltab');
    }

    this.loadPersistedData();
    await this.initBiometrics();

    // Warm up Polkadot sr25519 cryptography if the library is loaded
    if (window.PolkadotCrypto && typeof window.PolkadotCrypto.cryptoWaitReady === 'function') {
      try {
        await window.PolkadotCrypto.cryptoWaitReady();
      } catch (e) {
        console.warn('[initialize] Polkadot cryptoWaitReady failed:', e);
      }
    }

    this.applyTheme(this.currentTheme);
    window.B2TranslateUI(this.currentLanguage, true);
    window.B2PlatformSecurity.setupAntiScreenshotListeners();

    this.setupAppEventListeners();
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    this.setupAutoLockTracker();
    this.setupSDKMessageListener();

    // Decide qual tela inicial exibir baseada na presença de payload criptografado local, sessão ativa ou parâmetros de fluxo
    console.log('[initialize] Estado do payload:', {
      hasPayload: !!this.encryptedWalletPayload,
      hasCiphertext: !!this.encryptedWalletPayload?.ciphertext,
      storedValue: localStorage.getItem('b2_encrypted_payload') ? 'YES' : 'NO',
      hasSession: !!this.decryptedSeed
    });

    const flowParams = new URLSearchParams(window.location.search);
    const flow = flowParams.get('flow');
    if (flow === 'create') {
      this.isImportFlow = false;
      this.resetCreatePasswordView();
      const outcome = document.getElementById("seed-generation-outcome");
      if (outcome) outcome.style.display = "none";
      const submitBtn = document.getElementById("btn-create-wallet-submit");
      if (submitBtn) submitBtn.innerText = "Criar Carteira";
      window.B2UIRenderer.navigateTo("view-create-password");
      return;
    } else if (flow === 'import') {
      this.isImportFlow = true;
      window.B2UIRenderer.navigateTo("view-welcome");
      setTimeout(async () => {
        const seedInput = await window.B2Toast.importSeedModal();
        if (seedInput) {
          this.generatedMnemonicStr = seedInput.trim();
          this.resetCreatePasswordView();
          const outcome = document.getElementById("seed-generation-outcome");
          if (outcome) outcome.style.display = "none";
          const submitBtn = document.getElementById("btn-create-wallet-submit");
          if (submitBtn) submitBtn.innerText = "Importar Carteira";
          window.B2UIRenderer.navigateTo("view-create-password");
        } else {
          window.B2UIRenderer.navigateTo("view-welcome");
        }
      }, 300);
      return;
    }

    if (this.decryptedSeed) {
      console.log('[initialize] → view-dashboard (sessão ativa)');
      window.B2UIRenderer.navigateTo("view-dashboard");
      this.setActiveChain(this.activeChainKey);
    } else if (this.encryptedWalletPayload && this.encryptedWalletPayload.ciphertext) {
      console.log('[initialize] → view-locked');
      window.B2UIRenderer.navigateTo("view-locked");
      // Fallback defensivo: garante que view-locked é visível mesmo em casos de race condition
      // com o CSS/GPU do popup da extensão (evita tela preta persistente)
      const isExtensionPopup = document.documentElement.classList.contains('is-extension-popup');
      if (isExtensionPopup) {
        setTimeout(() => {
          const vl = document.getElementById('view-locked');
          if (vl) {
            const computed = window.getComputedStyle(vl);
            const notVisible = computed.display === 'none' || computed.opacity === '0' || computed.visibility === 'hidden';
            if (notVisible) {
              console.warn('[initialize] Fallback: view-locked não estava visível, forçando re-render...');
              window.B2UIRenderer.navigateTo("view-locked");
            }
          }
        }, 120);
      }
    } else {
      console.log('[initialize] → view-welcome');
      window.B2UIRenderer.navigateTo("view-welcome");
    }
  }

  /**
   * Reconstroi a lista de blockchains ativas e seus parâmetros baseado no modo de rede (Mainnet vs Testnet).
   */
  rebuildBlockchainData() {
    const registry = window.B2BlockchainRegistry || [];
    const isTestnet = this.networkMode === 'testnet';

    if (isTestnet) {
      // Filtrar as redes que não possuem testnet pública ativa
      const unsupportedKeys = ["DOGE", "BCH", "DASH", "ZEC", "AMZX", "PLO", "MONERO", "ICP"];
      const filteredRegistry = registry.filter(chain => !unsupportedKeys.includes(chain.key));

      this.blockchainData = filteredRegistry.map(chain => {
        // Objeto base clonado
        let testnetChain = {
          ...chain,
          balanceCrypto: 0.0,
          balanceFiat: 0.0,
          discoveredTokens: [],
          discoveredNFTs: []
        };

        // Overrides para redes EVM
        if (chain.engine === 'EVM' && window.B2EvmNetworkRegistry && window.B2EvmNetworkRegistry.testnetOverrides) {
          const override = window.B2EvmNetworkRegistry.testnetOverrides[chain.key];
          if (override) {
            testnetChain.chainId = override.chainId;
            testnetChain.nodeUrl = override.rpcUrls[0];
            testnetChain.explorer = override.explorer;
            testnetChain.faucet = override.faucet;
          }
        }
        // Overrides para redes não-EVM
        else if (chain.key === 'BTC') {
          testnetChain.coinType = 1;
          testnetChain.nodeUrl = "https://mempool.space/testnet4/api";
          testnetChain.feeApiUrl = "https://mempool.space/testnet4/api/v1/fees/recommended";
          testnetChain.explorer = "https://mempool.space/testnet4";
          testnetChain.isTestnet4 = true;
          testnetChain.faucet = "https://coinfaucet.eu/en/btc-testnet4/";
        } else if (chain.key === 'LTC') {
          testnetChain.coinType = 1;
          testnetChain.nodeUrl = "https://litecoinspace.org/testnet/api";
          testnetChain.explorer = "https://litecoinspace.org/testnet";
          testnetChain.faucet = "https://coinfaucet.eu/en/ltc-testnet/";
        } else if (chain.key === 'WAVES') {
          testnetChain.chainId = 84; // 'T'
          testnetChain.nodeUrl = "https://nodes-testnet.wavesnodes.com";
          testnetChain.explorer = "https://testnet.wavesexplorer.com";
          testnetChain.faucet = "https://testnet.wavesexplorer.com/faucet";
        } else if (chain.key === 'SOLANA') {
          testnetChain.nodeUrl = "https://api.testnet.solana.com";
          testnetChain.explorer = "https://explorer.solana.com/?cluster=testnet";
          testnetChain.faucet = "https://solfaucet.com/";
        } else if (chain.key === 'CARDANO') {
          testnetChain.nodeUrl = "https://cardano-preprod.blockfrost.io/api/v0";
          testnetChain.explorer = "https://preprod.cardanoscan.io";
          testnetChain.faucet = "https://docs.cardano.org/cardano-testnets/tools/faucet/";
        } else if (chain.key === 'TRON') {
          testnetChain.nodeUrl = "https://api.nileex.io";
          testnetChain.explorer = "https://nile.tronscan.org";
          testnetChain.faucet = "https://nileex.io/join/getTRX";
        } else if (chain.key === 'STELLAR') {
          testnetChain.nodeUrl = "https://horizon-testnet.stellar.org";
          testnetChain.explorer = "https://stellar.expert/explorer/testnet";
          testnetChain.faucet = "https://laboratory.stellar.org/#friendbot";
        } else if (chain.key === 'POLKADOT') {
          testnetChain.nodeUrl = "https://westend-rpc.polkadot.io";
          testnetChain.explorer = "https://westend.subscan.io";
          testnetChain.faucet = "https://faucet.polkadot.network/";
        } else if (chain.key === 'FILECOIN') {
          testnetChain.nodeUrl = "https://api.calibration.node.glif.io/rpc/v1";
          testnetChain.explorer = "https://calibration.filfox.info";
          testnetChain.faucet = "https://faucet.calibration.fildev.network/";
        } else if (chain.key === 'NEO') {
          testnetChain.nodeUrl = "https://testnet1.neo.coz.io:443";
          testnetChain.explorer = "https://testnet.neotube.io";
          testnetChain.faucet = "https://neofaucet.org/";
        }

        return testnetChain;
      });
    } else {
      // Mainnet: Restaurar as blockchains padrões originais
      this.blockchainData = registry.map(chain => ({
        ...chain,
        balanceCrypto: 0.0,
        balanceFiat: 0.0,
        discoveredTokens: [],
        discoveredNFTs: []
      }));
    }

    // Se a chain ativa não estiver na lista reconstruída, retroceder para WAVES (ou a primeira disponível)
    const isChainSupported = this.blockchainData.some(c => c.key === this.activeChainKey);
    if (!isChainSupported && this.blockchainData.length > 0) {
      this.activeChainKey = this.blockchainData[0].key;
      localStorage.setItem("b2_active_chain_key", this.activeChainKey);
    }

    // Sincroniza os tokens customizados imediatamente após reconstruir a blockchain (alternar de rede)
    this.loadCustomTokens();
    this.applyRpcOverrides();
  }

  /**
   * Recupera os dados salvos localmente no dispositivo.
   * Inclui suporte a múltiplas contas (multi-account).
   */
  loadPersistedData() {
    const savedPayload = localStorage.getItem("b2_encrypted_payload");
    const savedPin = localStorage.getItem("b2_pin_hash");
    const savedTheme = localStorage.getItem("b2_theme");
    const savedLanguage = localStorage.getItem("b2_language");
    const savedChain = localStorage.getItem("b2_active_chain_key");
    const savedAccounts = localStorage.getItem("b2_accounts");
    const savedActiveIdx = localStorage.getItem("b2_active_account_idx");

    if (savedPayload) {
      try {
        let parsed = JSON.parse(savedPayload);
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        this.encryptedWalletPayload = parsed;
        console.log('[loadPersistedData] ✓ Payload carregado:', !!this.encryptedWalletPayload && !!this.encryptedWalletPayload.ciphertext);
      } catch (err) {
        console.error('[loadPersistedData] ✗ Falha ao parsear:', err.message);
        this.encryptedWalletPayload = null;
      }
    } else {
      console.warn('[loadPersistedData] ⚠ Nenhum payload em localStorage');
    }
    if (savedPin) this.userPinHash = savedPin;
    if (savedTheme) this.currentTheme = savedTheme;
    if (savedLanguage) this.currentLanguage = savedLanguage;
    if (savedChain) this.activeChainKey = savedChain;

    // Multi-account: carrega lista de contas salvas
    if (savedAccounts) {
      try {
        this.accounts = JSON.parse(savedAccounts);
      } catch (_) {
        this.accounts = [];
      }
    } else {
      this.accounts = [];
    }
    this.activeAccountIndex = parseInt(savedActiveIdx || "0", 10);

    // Sincroniza tokens customizados importados do localStorage antes de qualquer atualização
    this.loadCustomTokens();

    // Restaura a sessão do mnemônico se estiver salva em sessionStorage (seguro contra page refresh)
    const sessionSeed = sessionStorage.getItem("b2_session_seed");
    if (sessionSeed && window.B2KeyDerivationEngine && window.B2KeyDerivationEngine.validateMnemonic(sessionSeed)) {
      this.decryptedSeed = sessionSeed;
      this.lastUnlockTime = Date.now();
      this.lastInteractionTime = Date.now();
      this.deriveAllAddresses();
      this.updateNetworkBalances();
    } else {
      const activeAcc = this.accounts[this.activeAccountIndex];
      if (activeAcc && activeAcc.type === 'watch-only') {
        this.deriveAllAddresses();
        this.updateNetworkBalances();
      }
    }
    this.applyRpcOverrides();
  }
}

// Vincula a instância global da aplicação ao objeto window
window.B2WalletApp = B2WalletApp;
