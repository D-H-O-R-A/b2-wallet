/**
 * B2 Wallet - Onboarding and Unlock Event Listeners (Modulo Eventos Onboarding)
 */

B2WalletApp.prototype.setupOnboardingEvents = function() {
    // ----------------------------------------------------------------
    // C. FLUXO DE BOAS-VINDAS / ONBOARDING
    // ----------------------------------------------------------------
    const welcomeCheckbox = document.getElementById("welcome-terms-checkbox");
    const btnCreate = document.getElementById("btn-create-wallet");
    const btnImport = document.getElementById("btn-import-wallet");

    if (welcomeCheckbox && btnCreate && btnImport) {
      welcomeCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        btnCreate.disabled = !isChecked;
        btnImport.disabled = !isChecked;
      });
    }

    const openInFullTabIfNeeded = (flowType) => {
      const isPopup = document.documentElement.classList.contains('is-extension-popup') ||
        (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL && window.location.protocol.includes('extension') && !window.location.search.includes('fulltab=true'));

      if (isPopup) {
        const targetUrl = `index.html?fulltab=true&flow=${flowType}`;
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url: chrome.runtime.getURL(targetUrl) });
        } else {
          window.open(targetUrl, "_blank");
        }
        window.close(); // Fechar o popup da extensão
        return true;
      }
      return false;
    };

    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        if (openInFullTabIfNeeded('create')) return;

        this.isImportFlow = false;

        // Reset create-password state
        this.resetCreatePasswordView();

        const outcome = document.getElementById("seed-generation-outcome");
        if (outcome) outcome.style.display = "none";

        const submitBtn = document.getElementById("btn-create-wallet-submit");
        if (submitBtn) submitBtn.innerText = "Criar Carteira";

        window.B2UIRenderer.navigateTo("view-create-password");
      });
    }

    if (btnImport) {
      btnImport.addEventListener('click', async () => {
        const seedInput = await window.B2Toast.importSeedModal();
        if (seedInput) {
          this.isImportFlow = true;
          this.generatedMnemonicStr = seedInput.trim();

          // Reset create-password state
          this.resetCreatePasswordView();

          const outcome = document.getElementById("seed-generation-outcome");
          if (outcome) outcome.style.display = "none";

          const submitBtn = document.getElementById("btn-create-wallet-submit");
          if (submitBtn) submitBtn.innerText = "Importar Carteira";

          window.B2UIRenderer.navigateTo("view-create-password");
        }
      });
    }

    // ----------------------------------------------------------------
    // D. CRIAÇÃO DE SENHA, PIN E GRADE MNEMÔNICA
    // ----------------------------------------------------------------
    // PASSWORD VISIBILITY TOGGLE (EYE CONTROL)
    document.querySelectorAll(".password-toggle-btn").forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute("data-target");
        const input = document.getElementById(targetId);
        if (!input) return;

        const openElements = btn.querySelectorAll(".eye-open");
        const closedElements = btn.querySelectorAll(".eye-closed");

        if (input.type === "password") {
          input.type = "text";
          openElements.forEach(el => el.style.display = "none");
          closedElements.forEach(el => el.style.display = "block");
        } else {
          input.type = "password";
          openElements.forEach(el => el.style.display = "block");
          closedElements.forEach(el => el.style.display = "none");
        }
      });
    });

    // REAL-TIME SECURITY REQUIREMENTS CHECKLIST
    const pwdInput = document.getElementById("password-input");
    const confirmInput = document.getElementById("password-confirm-input");
    const pinInput = document.getElementById("pin-input");

    const updateChecklist = () => {
      const pwd = pwdInput ? pwdInput.value : "";
      const confirmPwd = confirmInput ? confirmInput.value : "";
      const pin = pinInput ? pinInput.value : "";

      // 1. Length > 8 (Mínimo 9 caracteres)
      const isLengthValid = pwd.length > 8;
      updateReqItem("req-length", isLengthValid);

      // 2. Casing (Maiúsculas e Minúsculas)
      const isCaseValid = /[A-Z]/.test(pwd) && /[a-z]/.test(pwd);
      updateReqItem("req-case", isCaseValid);

      // 3. Number (Dígitos)
      const isNumberValid = /[0-9]/.test(pwd);
      updateReqItem("req-number", isNumberValid);

      // 4. Special char
      const isSpecialValid = /[\W_]/.test(pwd);
      updateReqItem("req-special", isSpecialValid);

      // 5. Match (Coincidir)
      const isMatchValid = pwd === confirmPwd && pwd.length > 0;
      updateReqItem("req-match", isMatchValid);

      // 6. PIN (Exatamente 8 dígitos)
      const isPinValid = pin.length === 8 && /^\d+$/.test(pin);
      updateReqItem("req-pin", isPinValid);
    };

    const updateReqItem = (id, isValid) => {
      const el = document.getElementById(id);
      if (!el) return;

      const icon = el.querySelector(".req-icon");
      if (isValid) {
        el.style.color = "var(--text-success)";
        if (icon) icon.textContent = "✔️";
      } else {
        el.style.color = "var(--text-muted)";
        if (icon) icon.textContent = "❌";
      }
    };

    if (pwdInput) pwdInput.addEventListener('input', updateChecklist);
    if (confirmInput) confirmInput.addEventListener('input', updateChecklist);
    if (pinInput) {
      pinInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        updateChecklist();
      });
    }

    const btnSubmitPassword = document.getElementById("btn-create-wallet-submit");
    if (btnSubmitPassword) {
      btnSubmitPassword.addEventListener('click', async () => {
        const pwd = document.getElementById("password-input").value;
        const confirmPwd = document.getElementById("password-confirm-input").value;
        const pin = document.getElementById("pin-input").value;

        const pwdErrors = [];
        if (!pwd || pwd.length <= 8) {
          pwdErrors.push(window.B2Translations[this.currentLanguage]?.pwdLengthError || "A senha deve ter mais de 8 caracteres.");
        }
        if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd)) {
          pwdErrors.push(window.B2Translations[this.currentLanguage]?.pwdCaseError || "A senha deve conter letras maiúsculas e minúsculas.");
        }
        if (!/[0-9]/.test(pwd)) {
          pwdErrors.push(window.B2Translations[this.currentLanguage]?.pwdNumberError || "A senha deve conter pelo menos um número.");
        }
        if (!/[\W_]/.test(pwd)) {
          pwdErrors.push(window.B2Translations[this.currentLanguage]?.pwdSpecialError || "A senha deve conter pelo menos um caractere especial.");
        }

        if (pwdErrors.length > 0) {
          await window.B2Toast.alert("Erro na Senha", pwdErrors.join("<br>"), "error");
          return;
        }

        if (pwd !== confirmPwd) {
          await window.B2Toast.alert("Senhas Diferentes", window.B2Translations[this.currentLanguage]?.pwdMismatch || "Senhas não coincidem!", "error");
          return;
        }
        if (!pin || pin.length !== 8 || !/^\d+$/.test(pin)) {
          await window.B2Toast.alert("PIN Inválido", window.B2Translations[this.currentLanguage]?.pinLength || "PIN deve conter exatamente 8 dígitos.", "error");
          return;
        }

        if (this.isImportFlow) {
          // No fluxo de importação, cria a carteira diretamente!
          await this.completeWalletCreation(pwd, pin);
        } else {
          // No fluxo de criação, gera a semente e exibe inline
          this.generatedMnemonicStr = window.B2KeyDerivationEngine.generateMnemonic();

          // Criptografa imediatamente em segundo plano para permitir a exportação segura do JSON de backup
          this.encryptionPromise = window.B2PlatformSecurity.encryptData(this.generatedMnemonicStr, pwd);
          this.encryptionPromise.then((encrypted) => {
            this.encryptedWalletPayload = encrypted;
            this.userPinHash = pin;
          }).catch((e) => {
            console.error('[btnSubmitPassword] Falha ao pré-criptografar a semente:', e);
          });

          const display = document.getElementById("seed-phrase-display");
          if (display) {
            display.innerHTML = "";
            this.generatedMnemonicStr.split(" ").forEach((word, index) => {
              const card = document.createElement("div");
              card.className = "seed-word-card";
              card.innerText = `${index + 1}. ${word}`;
              display.appendChild(card);
            });
          }
          const outcome = document.getElementById("seed-generation-outcome");
          if (outcome) outcome.style.display = "flex";
        }
      });
    }

    const btnCopySeed = document.getElementById("btn-copy-seed-inline");
    if (btnCopySeed) {
      btnCopySeed.addEventListener('click', () => {
        if (this.generatedMnemonicStr) {
          navigator.clipboard.writeText(this.generatedMnemonicStr);
          window.showToast(window.B2Translations[this.currentLanguage]?.seedCopied || "Semente copied com sucesso!", "success");
        }
      });
    }

    const btnExportSeedJson = document.getElementById("btn-export-seed-json");
    if (btnExportSeedJson) {
      btnExportSeedJson.addEventListener('click', () => {
        this.exportConfigSecure();
      });
    }

    const btnCreatePasswordProceed = document.getElementById("btn-create-password-proceed");
    if (btnCreatePasswordProceed) {
      btnCreatePasswordProceed.addEventListener('click', () => {
        // Gera 4 índices aleatórios para confirmação ativa
        this.confirmIndices = this.getRandomIndices(4, 12);

        const container = document.getElementById("confirm-seed-inputs-container");
        if (container) {
          container.innerHTML = "";
          this.confirmIndices.forEach((idx) => {
            const formGroup = document.createElement("div");
            formGroup.className = "form-group";
            formGroup.style.textAlign = "left";
            formGroup.style.flexShrink = "0";

            const label = document.createElement("label");
            label.className = "form-label";
            label.innerText = `Palavra #${idx + 1}`;

            const input = document.createElement("input");
            input.type = "text";
            input.className = "form-input confirm-word-input";
            input.placeholder = `Digite a palavra #${idx + 1}...`;
            input.dataset.index = idx;
            input.style.flexShrink = "0";

            const errorMsgSpan = document.createElement("span");
            errorMsgSpan.className = "input-error-msg";
            errorMsgSpan.style.display = "none";

            // Remove o estado de erro dinamicamente ao digitar
            input.addEventListener('input', () => {
              input.classList.remove('is-invalid');
              errorMsgSpan.style.display = "none";
            });

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            formGroup.appendChild(errorMsgSpan);
            container.appendChild(formGroup);
          });
        }

        // Reseta os checkboxes e o botão de confirmação
        const checkboxLoss = document.getElementById("confirm-seed-risk-loss");
        const checkboxOpensource = document.getElementById("confirm-seed-risk-opensource");
        if (checkboxLoss) checkboxLoss.checked = false;
        if (checkboxOpensource) checkboxOpensource.checked = false;

        const confirmSubmitBtn = document.getElementById("btn-confirm-seed-submit");
        if (confirmSubmitBtn) confirmSubmitBtn.disabled = true;

        window.B2UIRenderer.navigateTo("view-confirm-seed");
      });
    }

    // ----------------------------------------------------------------
    // E. CONFIRMAÇÃO ATIVA DE SEMENTE (Palavras e Checkboxes)
    // ----------------------------------------------------------------
    const confirmView = document.getElementById("view-confirm-seed");
    if (confirmView) {
      const updateState = () => {
        const lossChecked = document.getElementById("confirm-seed-risk-loss")?.checked || false;
        const opensourceChecked = document.getElementById("confirm-seed-risk-opensource")?.checked || false;
        const inputs = confirmView.querySelectorAll(".confirm-word-input");
        let allFilled = true;
        inputs.forEach(inp => {
          if (!inp.value.trim()) allFilled = false;
        });

        const submitBtn = document.getElementById("btn-confirm-seed-submit");
        if (submitBtn) {
          submitBtn.disabled = !(lossChecked && opensourceChecked && allFilled);
        }
      };

      confirmView.addEventListener('input', updateState);
      confirmView.addEventListener('change', updateState);
    }

    const btnConfirmSeedSubmit = document.getElementById("btn-confirm-seed-submit");
    if (btnConfirmSeedSubmit) {
      btnConfirmSeedSubmit.addEventListener('click', async () => {
        const inputs = document.querySelectorAll(".confirm-word-input");
        const words = this.generatedMnemonicStr.split(" ");
        let allCorrect = true;

        const inlineErrors = {
          pt: "Palavra incorreta!",
          en: "Incorrect word!",
          es: "¡Palabra incorrecta!",
          fr: "Mot incorrect!",
          zh: "单词不正确！",
          ja: "単語が間違っています！",
          ko: "잘못된 단어입니다!",
          de: "Falsches Wort!",
          it: "Parola errata!",
          ru: "Неверное слово!"
        };
        const errorText = inlineErrors[this.currentLanguage] || inlineErrors['en'];

        inputs.forEach(inp => {
          const idx = parseInt(inp.dataset.index);
          const val = inp.value.trim().toLowerCase();
          const expected = words[idx].toLowerCase();

          const formGroup = inp.closest('.form-group');
          const errorSpan = formGroup ? formGroup.querySelector('.input-error-msg') : null;

          if (val !== expected) {
            allCorrect = false;
            inp.classList.add('is-invalid');
            if (errorSpan) {
              errorSpan.innerText = errorText;
              errorSpan.style.display = "block";
            }
          } else {
            inp.classList.remove('is-invalid');
            if (errorSpan) {
              errorSpan.style.display = "none";
            }
          }
        });

        if (allCorrect) {
          const pwd = document.getElementById("password-input").value;
          const pin = document.getElementById("pin-input").value;
          await this.completeWalletCreation(pwd, pin);
        } else {
          await window.B2Toast.alert("Semente Incorreta", "Palavras incorretas! Por favor, revise as palavras inseridas.", "error");
        }
      });
    }

    // ----------------------------------------------------------------
    // F. DIRETÓRIO DE ENDEREÇOS PÚBLICOS
    // ----------------------------------------------------------------
    const btnAddressesProceed = document.getElementById("btn-addresses-list-proceed");
    if (btnAddressesProceed) {
      btnAddressesProceed.addEventListener('click', () => {
        const isFullTab = document.documentElement.classList.contains('is-fulltab');
        if (isFullTab) {
          window.close();
        } else {
          window.B2UIRenderer.navigateTo("view-dashboard");
          this.setActiveChain(this.activeChainKey);
        }
      });
    }

    // ----------------------------------------------------------------
    // G. TELA DE DESBLOQUEIO
    // ----------------------------------------------------------------
    const btnUnlockSubmit = document.getElementById("unlock-submit-btn");
    const inputUnlockPassword = document.getElementById("unlock-password-input");
    if (btnUnlockSubmit) {
      btnUnlockSubmit.addEventListener('click', async () => {
        const pwd = document.getElementById("unlock-password-input").value;
        try {
          await this.unlockWallet(pwd);
          document.getElementById("unlock-password-input").value = "";
        } catch (e) {
          window.B2Toast.alert("Erro de Autenticação", e.message, "error");
        }
      });
    }
    if (inputUnlockPassword && btnUnlockSubmit) {
      inputUnlockPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btnUnlockSubmit.click();
        }
      });
    }
};
