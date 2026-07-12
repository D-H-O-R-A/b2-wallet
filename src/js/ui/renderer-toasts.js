/**
 * Módulo de Feedbacks Visuais e Toasts: ToastEngine para UIRenderer.
 */

class ToastEngine {
  constructor() {
    this.container = null;
  }

  _initContainer() {
    if (typeof document === 'undefined') return;
    this.container = document.getElementById("b2-toast-container");
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "b2-toast-container";
      this.container.className = "b2-toast-container";
      document.body.appendChild(this.container);
    }
  }

  show(msg, type = "info", duration = 3000) {
    if (typeof document === 'undefined') {
      console.log(`[Toast ${type}] ${msg}`);
      return;
    }
    this._initContainer();
    if (!this.container) return;

    const toast = document.createElement("div");
    // Corrige as classes para combinar exatamente com o CSS premium do design-system (b2-toast-success, etc.)
    toast.className = `b2-toast b2-toast-${type}`;

    let icon = "ℹ️";
    if (type === "success") icon = "✓";
    else if (type === "error") icon = "✗";
    else if (type === "warning") icon = "⚠";

    toast.innerHTML = `
      <span class="b2-toast-icon">${icon}</span>
      <span class="b2-toast-msg">${msg}</span>
    `;

    this.container.appendChild(toast);

    // Trigger reflow for animation
    void toast.offsetWidth;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }

  _createSVGIcon(type) {
    if (type === "success") {
      return `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4));">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      `;
    } else if (type === "error") {
      return `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.4));">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      `;
    } else if (type === "warning") {
      return `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.4));">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      `;
    } else {
      return `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      `;
    }
  }

  confirm(title, text, type = "warning") {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        console.log(`[Confirm ${type}] ${title}: ${text}`);
        resolve(true);
        return;
      }

      const overlay = document.createElement("div");
      overlay.className = "b2-swal-overlay";

      const card = document.createElement("div");
      card.className = "b2-swal-card glass-panel animate-view";

      card.innerHTML = `
        <div class="b2-swal-icon-container">
          ${this._createSVGIcon(type)}
        </div>
        <h3 class="b2-swal-title" style="font-family: var(--font-tech); text-transform: uppercase; margin: 12px 0 6px 0; font-size: 1.1rem; letter-spacing: 1px; color: var(--text-primary); text-shadow: var(--shadow-glow-primary);">${title}</h3>
        <p class="b2-swal-text" style="font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 16px 0; line-height: 1.4;">${text}</p>
        <div class="b2-swal-actions" style="display: flex; gap: 10px; width: 100%;">
          <button id="b2-swal-cancel-btn" class="btn btn-outline" style="flex: 1; padding: 10px; font-size: 0.75rem;">Cancelar</button>
          <button id="b2-swal-confirm-btn" class="btn ${type === 'error' ? 'btn-danger' : 'btn-primary'}" style="flex: 1.2; padding: 10px; font-size: 0.75rem;">Confirmar</button>
        </div>
      `;

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      // Trigger reflow for animation
      void overlay.offsetWidth;
      overlay.classList.add("show");

      const cleanup = (result) => {
        overlay.classList.remove("show");
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 300);
      };

      card.querySelector("#b2-swal-cancel-btn").addEventListener("click", () => cleanup(false));
      card.querySelector("#b2-swal-confirm-btn").addEventListener("click", () => cleanup(true));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cleanup(false);
      });
    });
  }

  alert(title, text, type = "info") {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        console.log(`[Alert ${type}] ${title}: ${text}`);
        resolve(true);
        return;
      }

      const overlay = document.createElement("div");
      overlay.className = "b2-swal-overlay";

      const card = document.createElement("div");
      card.className = "b2-swal-card glass-panel animate-view";

      card.innerHTML = `
        <div class="b2-swal-icon-container">
          ${this._createSVGIcon(type)}
        </div>
        <h3 class="b2-swal-title" style="font-family: var(--font-tech); text-transform: uppercase; margin: 12px 0 6px 0; font-size: 1.1rem; letter-spacing: 1px; color: var(--text-primary); text-shadow: var(--shadow-glow-primary);">${title}</h3>
        <p class="b2-swal-text" style="font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 16px 0; line-height: 1.4;">${text}</p>
        <div class="b2-swal-actions" style="display: flex; justify-content: center; width: 100%;">
          <button id="b2-swal-ok-btn" class="btn btn-primary" style="min-width: 120px; padding: 10px 20px; font-size: 0.75rem;">OK</button>
        </div>
      `;

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      // Trigger reflow for animation
      void overlay.offsetWidth;
      overlay.classList.add("show");

      const cleanup = () => {
        overlay.classList.remove("show");
        setTimeout(() => {
          overlay.remove();
          resolve(true);
        }, 300);
      };

      card.querySelector("#b2-swal-ok-btn").addEventListener("click", cleanup);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cleanup();
      });
    });
  }

  prompt(title, text, type = "password", placeholder = "") {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        console.log(`[Prompt ${type}] ${title}: ${text}`);
        resolve("");
        return;
      }

      const overlay = document.createElement("div");
      overlay.className = "b2-swal-overlay";

      const card = document.createElement("div");
      card.className = "b2-swal-card glass-panel animate-view";

      card.innerHTML = `
        <div class="b2-swal-icon-container">
          ${this._createSVGIcon("warning")}
        </div>
        <h3 class="b2-swal-title" style="font-family: var(--font-tech); text-transform: uppercase; margin: 12px 0 6px 0; font-size: 1.1rem; letter-spacing: 1px; color: var(--text-primary); text-shadow: var(--shadow-glow-primary);">${title}</h3>
        <p class="b2-swal-text" style="font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 12px 0; line-height: 1.4;">${text}</p>
        <div style="margin: 0 0 16px 0; width: 100%;">
          <input id="b2-swal-input" type="${type}" placeholder="${placeholder}" class="form-input" style="width: 100%; text-align: center; font-family: var(--font-tech); font-size: 1.1rem; letter-spacing: 2px; padding: 10px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-light); border-radius: var(--radius-sm);">
        </div>
        <div class="b2-swal-actions" style="display: flex; gap: 10px; width: 100%;">
          <button id="b2-swal-cancel-btn" class="btn btn-outline" style="flex: 1; padding: 10px; font-size: 0.75rem;">Cancelar</button>
          <button id="b2-swal-confirm-btn" class="btn btn-primary" style="flex: 1.2; padding: 10px; font-size: 0.75rem;">Confirmar</button>
        </div>
      `;

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      // Focus the input
      setTimeout(() => {
        const input = card.querySelector("#b2-swal-input");
        if (input) input.focus();
      }, 100);

      // Trigger reflow for animation
      void overlay.offsetWidth;
      overlay.classList.add("show");

      const cleanup = (result) => {
        overlay.classList.remove("show");
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 300);
      };

      card.querySelector("#b2-swal-cancel-btn").addEventListener("click", () => cleanup(null));
      card.querySelector("#b2-swal-confirm-btn").addEventListener("click", () => {
        const val = card.querySelector("#b2-swal-input").value;
        cleanup(val);
      });
      card.querySelector("#b2-swal-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const val = card.querySelector("#b2-swal-input").value;
          cleanup(val);
        }
      });
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cleanup(null);
      });
    });
  }

  importSeedModal() {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        resolve(null);
        return;
      }

      const lang = (window.B2App && window.B2App.currentLanguage) || 'en';
      const t = (window.B2Translations && window.B2Translations[lang]) || {};

      const overlay = document.createElement("div");
      overlay.className = "b2-swal-overlay";

      const card = document.createElement("div");
      card.className = "b2-swal-card glass-panel animate-view";
      card.style.maxWidth = "420px";
      card.style.width = "90%";
      card.style.padding = "24px";
      card.style.maxHeight = "90vh";
      card.style.overflowY = "auto";

      card.innerHTML = `
        <div class="b2-swal-icon-container" style="color: var(--color-primary); filter: drop-shadow(0 0 8px var(--color-primary));">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <h3 class="b2-swal-title" style="font-family: var(--font-tech); text-transform: uppercase; margin: 12px 0 4px 0; font-size: 1.15rem; letter-spacing: 1px; color: var(--text-primary); text-shadow: var(--shadow-glow-primary); text-align: center;">${t.importSeedTitle || 'Importar Semente'}</h3>
        
        <!-- Alerta de segurança / Derivação de caminhos -->
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: var(--radius-sm); padding: 12px; margin: 14px 0; font-size: 0.78rem; line-height: 1.4; color: #f59e0b; text-align: left; text-shadow: 0 0 1px rgba(0,0,0,0.5);">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; margin-bottom: 6px; font-family: var(--font-tech); text-transform: uppercase;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            ${t.custodyModeValue || 'Auto-Custódia Total'}
          </div>
          ${t.importWarningBody || 'A B2 Wallet usa uma semente mestre única para derivar chaves de forma determinística.'}
        </div>

        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 8px 0; text-align: left;">${t.importSeedPrompt || 'Digite sua frase secreta de recuperação BIP-39 (12 a 15 palavras):'}</p>
        
        <div style="margin: 0 0 12px 0; width: 100%;">
          <textarea id="b2-import-textarea" class="form-input" style="width: 100%; height: 80px; text-align: left; font-family: var(--font-body); font-size: 0.85rem; line-height: 1.4; padding: 10px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-light); border-radius: var(--radius-sm); resize: none; box-sizing: border-box;" placeholder="${t.placeholderSeed || 'palavra1 palavra2 palavra3...'}"></textarea>
        </div>

        <!-- Indicador reativo de palavras -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; width: 100%; font-size: 0.78rem;">
          <span style="color: var(--text-secondary);">${t.wordCount || 'Contagem de palavras:'}</span>
          <span id="b2-word-badge" style="font-family: var(--font-tech); font-weight: bold; padding: 3px 8px; border-radius: 12px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">${(t.wordsCountFormat || '{count} palavras').replace('{count}', '0')}</span>
        </div>

        <!-- Seção de importação de backup JSON -->
        <div style="display: flex; align-items: center; gap: 10px; margin: 12px 0 16px 0; font-size: 0.72rem; color: var(--text-muted); width: 100%;">
          <div style="flex: 1; height: 1px; background: var(--border-light);"></div>
          <span>${t.orImportBackup || 'OU IMPORTAR BACKUP'}</span>
          <div style="flex: 1; height: 1px; background: var(--border-light);"></div>
        </div>

        <div style="margin: 0 0 20px 0; width: 100%;">
          <input type="file" id="b2-import-file-input-onboarding" accept=".json" style="display: none;">
          <button id="b2-import-file-btn-onboarding" class="btn btn-outline" style="width: 100%; padding: 10px; font-size: 0.78rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            ${t.loadBackupFile || 'Carregar arquivo de backup (.json)'}
          </button>
        </div>

        <div class="b2-swal-actions" style="display: flex; gap: 10px; width: 100%;">
          <button id="b2-import-cancel-btn" class="btn btn-outline" style="flex: 1; padding: 10px; font-size: 0.75rem;">${t.cancelBtn || 'Cancelar'}</button>
          <button id="b2-import-confirm-btn" class="btn btn-primary" style="flex: 1.2; padding: 10px; font-size: 0.75rem;" disabled>${t.confirmBtn || 'Confirmar'}</button>
        </div>
      `;

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      const txt = card.querySelector("#b2-import-textarea");
      const badge = card.querySelector("#b2-word-badge");
      const confirmBtn = card.querySelector("#b2-import-confirm-btn");
      const fileInput = card.querySelector("#b2-import-file-input-onboarding");
      const fileBtn = card.querySelector("#b2-import-file-btn-onboarding");

      // Focus textarea
      setTimeout(() => txt.focus(), 100);

      // Trigger reflow for animation
      void overlay.offsetWidth;
      overlay.classList.add("show");

      const updateWordCount = () => {
        const val = txt.value.trim();
        if (!val) {
          badge.innerText = (t.wordsCountFormat || "{count} palavras").replace("{count}", "0");
          badge.style.background = "rgba(239, 68, 68, 0.15)";
          badge.style.color = "#ef4444";
          badge.style.borderColor = "rgba(239, 68, 68, 0.2)";
          confirmBtn.disabled = true;
          return;
        }

        const words = val.toLowerCase().split(/\s+/);
        const count = words.length;

        // Se tiver entre 12 e 15 palavras (ou até 24 de forma flexível) e passar no validador
        const isValidLength = count >= 12 && count <= 24;
        const isMnemonicValid = isValidLength && window.B2KeyDerivationEngine && window.B2KeyDerivationEngine.validateMnemonic(val);

        badge.innerText = (t.wordsCountFormat || "{count} palavras").replace("{count}", count);

        if (count >= 12 && count <= 15) {
          badge.style.background = "rgba(16, 185, 129, 0.15)";
          badge.style.color = "#10b981";
          badge.style.borderColor = "rgba(16, 185, 129, 0.2)";
        } else if (count > 15 && count <= 24) {
          badge.style.background = "rgba(245, 158, 11, 0.15)";
          badge.style.color = "#f59e0b";
          badge.style.borderColor = "rgba(245, 158, 11, 0.2)";
        } else {
          badge.style.background = "rgba(239, 68, 68, 0.15)";
          badge.style.color = "#ef4444";
          badge.style.borderColor = "rgba(239, 68, 68, 0.2)";
        }

        confirmBtn.disabled = !isMnemonicValid;
      };

      txt.addEventListener("input", updateWordCount);

      if (fileInput && fileBtn) {
        fileBtn.addEventListener("click", (e) => {
          e.preventDefault();
          fileInput.click();
        });

        fileInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = async (evt) => {
            try {
              const fileContents = evt.target.result;
              if (window.B2App && window.B2App.importConfigSecure) {
                cleanup(null); // Fecha o modal
                await window.B2App.importConfigSecure(fileContents);
                window.showToast("Configuração importada com sucesso!", "success");
              } else {
                throw new Error("Motor B2App não inicializado.");
              }
            } catch (err) {
              window.showToast("Erro ao ler arquivo: " + err.message, "danger");
            }
          };
          reader.readAsText(file);
        });
      }

      const cleanup = (result) => {
        overlay.classList.remove("show");
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 300);
      };

      card.querySelector("#b2-import-cancel-btn").addEventListener("click", () => cleanup(null));
      confirmBtn.addEventListener("click", () => {
        cleanup(txt.value.trim());
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cleanup(null);
      });
    });
  }
}

// Exportação global do motor de notificações
window.B2Toast = new ToastEngine();
window.showToast = (msg, type = "info") => window.B2Toast.show(msg, type);

// Hooking window.alert de forma dinâmica e segura para redirecionar para window.B2Toast.alert
if (typeof window !== 'undefined') {
  window.alert = (msg) => {
    window.B2Toast.alert("Notificação do Sistema", msg, "info");
  };
}
