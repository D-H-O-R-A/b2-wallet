/**
 * B2 Wallet - Módulo de Autenticação, Biometria, Segurança e Auto-Lock para B2WalletApp.
 */

B2WalletApp.prototype.setupAutoLockTracker = function() {
  const resetTimer = () => {
    this.lastInteractionTime = Date.now();
  };

  window.addEventListener('mousemove', resetTimer);
  window.addEventListener('keydown', resetTimer);
  window.addEventListener('click', resetTimer);
  window.addEventListener('touchstart', resetTimer);

  // O cronômetro roda a cada 10 segundos auditando a inatividade
  this.autoLockTimer = setInterval(() => {
    if (!this.decryptedSeed) return; // Nenhuma sessão ativa para bloquear

    const inactiveMs = Date.now() - this.lastInteractionTime;
    const limitMs = this.autoLockMinutes * 60 * 1000;

    if (inactiveMs >= limitMs) {
      console.log(`[Segurança] Bloqueando automaticamente devido a inatividade por ${this.autoLockMinutes} minutos.`);
      this.lockWallet();
    }
  }, 10000);
};

B2WalletApp.prototype.lockWallet = function() {
  this.decryptedSeed = null;
  this.derivedKeys = {};
  this.lastUnlockTime = 0;

  // Limpa a sessão segura de sessionStorage
  sessionStorage.removeItem("b2_session_seed");

  // Limpa possíveis campos visuais sensíveis
  const seedArea = document.getElementById("seed-phrase-display");
  if (seedArea) seedArea.innerText = "";

  window.B2UIRenderer.navigateTo("view-locked");
};

B2WalletApp.prototype.unlockWallet = async function(password) {
  if (!this.encryptedWalletPayload) {
    throw new Error("Erro de Estado: Nenhuma carteira configurada neste dispositivo.");
  }

  // Decifra o segredo principal usando a chave simétrica baseada na senha fornecida
  const seed = await window.B2PlatformSecurity.decryptData(this.encryptedWalletPayload, password);

  if (!window.B2KeyDerivationEngine.validateMnemonic(seed)) {
    throw new Error("Erro de Chave: O segredo descriptografado não é uma semente BIP-39 válida.");
  }

  this.decryptedSeed = seed;
  this.lastUnlockTime = Date.now();
  this.lastInteractionTime = Date.now();

  // Salva na sessão ativa do navegador (segura contra page refresh)
  sessionStorage.setItem("b2_session_seed", seed);

  // Executa derivações de chaves públicas em segundo plano para preencher a carteira
  this.deriveAllAddresses();

  // Atualiza saldos em tempo real de forma não-bloqueante
  this.updateNetworkBalances();

  // Navega para a visão central do dashboard e ativa a blockchain focada
  window.B2UIRenderer.navigateTo("view-dashboard");
  this.setActiveChain(this.activeChainKey);
};

B2WalletApp.prototype.initBiometrics = async function() {
  this.biometricEnabled = localStorage.getItem("b2_biometric_enabled") === "true";
  const NativeBiometric = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeBiometric;
  if (!NativeBiometric) {
    console.log("[Biometrics] Plugin NativeBiometric indisponível (rodando no browser ou extensão).");
    return;
  }
  try {
    const result = await NativeBiometric.isAvailable();
    if (result && result.isAvailable) {
      console.log("[Biometrics] Disponível:", result.biometryType);

      const switchContainer = document.getElementById("biometric-switch-container");
      if (switchContainer) {
        switchContainer.style.display = "flex";
      }

      const biometricSwitch = document.getElementById("switch-enable-biometrics");
      if (biometricSwitch) {
        biometricSwitch.checked = this.biometricEnabled;
        biometricSwitch.addEventListener("change", async (e) => {
          const enabled = e.target.checked;
          await this.promptPasswordForBiometrics(enabled);
        });
      }

      this.updateBiometricUnlockUI();
    }
  } catch (err) {
    console.error("[Biometrics] Erro ao checar biometria:", err);
  }
};

B2WalletApp.prototype.promptPasswordForBiometrics = async function(enable) {
  if (enable) {
    const pwd = await window.B2Toast.prompt(
      "Confirmar Biometria",
      "Digite sua senha para habilitar o desbloqueio por digital/Face ID:",
      "password",
      "Sua senha de acesso..."
    );
    if (!pwd) {
      const biometricSwitch = document.getElementById("switch-enable-biometrics");
      if (biometricSwitch) biometricSwitch.checked = false;
      return;
    }
    try {
      const seed = await window.B2PlatformSecurity.decryptData(this.encryptedWalletPayload, pwd);
      if (!window.B2KeyDerivationEngine.validateMnemonic(seed)) {
        throw new Error("Semente BIP-39 inválida descriptografada.");
      }

      const NativeBiometric = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeBiometric;
      if (NativeBiometric) {
        await NativeBiometric.setCredentials({
          username: "b2wallet_user",
          password: pwd,
          server: "com.better2better.b2wallet"
        });
        localStorage.setItem("b2_biometric_enabled", "true");
        this.biometricEnabled = true;
        window.B2Toast.alert("Sucesso", "Desbloqueio por biometria configurado!", "success");
        this.updateBiometricUnlockUI();
      }
    } catch (err) {
      window.B2Toast.alert("Erro", "Senha incorreta. Não foi possível ativar a biometria.", "error");
      const biometricSwitch = document.getElementById("switch-enable-biometrics");
      if (biometricSwitch) biometricSwitch.checked = false;
    }
  } else {
    localStorage.setItem("b2_biometric_enabled", "false");
    this.biometricEnabled = false;
    window.B2Toast.alert("Biometria Desativada", "Desbloqueio por biometria desativado.", "success");
    this.updateBiometricUnlockUI();
  }
};

B2WalletApp.prototype.tryBiometricUnlock = async function() {
  const NativeBiometric = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeBiometric;
  if (!NativeBiometric || !this.biometricEnabled) return;
  try {
    const credentials = await NativeBiometric.getCredentials({
      server: "com.better2better.b2wallet"
    });
    if (credentials && credentials.password) {
      await this.unlockWallet(credentials.password);
    }
  } catch (err) {
    console.warn("Autenticação biométrica cancelada ou falhou:", err);
  }
};

B2WalletApp.prototype.updateBiometricUnlockUI = function() {
  const NativeBiometric = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeBiometric;
  const bioBtn = document.getElementById("unlock-biometric-btn");
  if (bioBtn) {
    if (NativeBiometric && this.biometricEnabled) {
      bioBtn.style.display = "inline-flex";
    } else {
      bioBtn.style.display = "none";
    }
  }
};

B2WalletApp.prototype.changeUserPassword = async function(oldPassword, newPassword) {
  if (!this.encryptedWalletPayload) {
    throw new Error("Erro de Estado: Nenhuma carteira ativa encontrada.");
  }

  // Decifra a seed usando a senha antiga
  const seed = await window.B2PlatformSecurity.decryptData(this.encryptedWalletPayload, oldPassword);

  // Criptografa novamente usando a senha nova forte
  const newPayload = await window.B2PlatformSecurity.encryptData(seed, newPassword);

  // Salva o payload atualizado localmente
  this.encryptedWalletPayload = newPayload;
  localStorage.setItem("b2_encrypted_payload", JSON.stringify(newPayload));
  this.lastUnlockTime = Date.now();

  // Se biometria estiver ativa, atualiza no NativeBiometric
  if (localStorage.getItem("b2_biometric_enabled") === "true") {
    const NativeBiometric = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeBiometric;
    if (NativeBiometric) {
      try {
        await NativeBiometric.setCredentials({
          username: "b2wallet_user",
          password: newPassword,
          server: "com.better2better.b2wallet"
        });
      } catch (e) {
        console.error("Erro ao atualizar credenciais biométricas após mudança de senha:", e);
      }
    }
  }
};

B2WalletApp.prototype.resetCreatePasswordView = function() {
  const pwdInput = document.getElementById("password-input");
  const confirmInput = document.getElementById("password-confirm-input");
  const pinInput = document.getElementById("pin-input");

  if (pwdInput) { pwdInput.value = ""; pwdInput.type = "password"; }
  if (confirmInput) { confirmInput.value = ""; confirmInput.type = "password"; }
  if (pinInput) { pinInput.value = ""; pinInput.type = "password"; }

  document.querySelectorAll(".password-toggle-btn").forEach(btn => {
    const openElements = btn.querySelectorAll(".eye-open");
    const closedElements = btn.querySelectorAll(".eye-closed");
    openElements.forEach(el => el.style.display = "block");
    closedElements.forEach(el => el.style.display = "none");
  });

  // Reset checklist items to default (unchecked)
  ["req-length", "req-case", "req-number", "req-special", "req-match", "req-pin"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove("checked");
      const icon = el.querySelector(".requirement-icon");
      if (icon) icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>';
    }
  });
};
