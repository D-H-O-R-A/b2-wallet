/**
 * B2 Wallet - Módulo de Modais de Ativos, NFT Minting e Gerenciamento de Chaves de B2WalletApp.
 */

B2WalletApp.prototype.showAddTokenModal = function() {
    const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
    if (!chain) return;

    const engine = chain.engine || 'Custom';

    // Elementos do modal
    const engineNameEl = document.getElementById('add-token-engine-name');
    const engineDescEl = document.getElementById('add-token-engine-desc');
    const chainNameEl = document.getElementById('add-token-chain-name');
    const chainDotEl = document.getElementById('add-token-chain-dot');
    const contractLabelEl = document.getElementById('add-token-contract-label');
    const contractInputEl = document.getElementById('add-token-contract');
    const contractHintEl = document.getElementById('add-token-contract-hint');

    if (chainNameEl) chainNameEl.textContent = chain.name;
    if (chainDotEl) chainDotEl.style.backgroundColor = chain.color || 'var(--color-primary)';

    if (engineNameEl) engineNameEl.textContent = engine;

    if (engine === 'EVM') {
      if (engineDescEl) engineDescEl.textContent = 'Tokens compatíveis com padrão ERC-20. Insira o endereço do contrato inteligente.';
      if (contractLabelEl) contractLabelEl.textContent = 'Endereço do Contrato (ERC-20)';
      if (contractInputEl) {
        contractInputEl.placeholder = '0x...';
        contractInputEl.value = '';
      }
      if (contractHintEl) contractHintEl.textContent = 'Formato: 0x seguido de 40 caracteres hexadecimais';
    } else if (engine === 'Waves') {
      const displayEngine = (chain.key === 'AMZX') ? 'AMZX' : (chain.key === 'PLO' ? 'PlanetOne' : 'Waves');
      if (engineDescEl) engineDescEl.textContent = `Ativos customizados criados no ecossistema ${displayEngine}. Insira o ID do Asset.`;
      if (contractLabelEl) contractLabelEl.textContent = 'ID do Ativo (Asset ID)';
      if (contractInputEl) {
        contractInputEl.placeholder = 'Ex: G8v7Z...';
        contractInputEl.value = '';
      }
      if (contractHintEl) contractHintEl.textContent = 'Formato: string Base58 de 32 a 44 caracteres';
    } else if (engine === 'Solana') {
      if (engineDescEl) engineDescEl.textContent = 'Tokens SPL do ecossistema Solana. Insira o endereço Mint.';
      if (contractLabelEl) contractLabelEl.textContent = 'Endereço Mint do Token (SPL)';
      if (contractInputEl) {
        contractInputEl.placeholder = 'Ex: EPjFW...';
        contractInputEl.value = '';
      }
      if (contractHintEl) contractHintEl.textContent = 'Formato: string Base58 de 32 a 44 caracteres';
    } else if (engine === 'Tron') {
      if (engineDescEl) engineDescEl.textContent = 'Tokens padrão TRC-20 da rede Tron. Insira o endereço do contrato.';
      if (contractLabelEl) contractLabelEl.textContent = 'Endereço do Contrato (TRC-20)';
      if (contractInputEl) {
        contractInputEl.placeholder = 'Ex: TR7NH...';
        contractInputEl.value = '';
      }
      if (contractHintEl) contractHintEl.textContent = 'Formato: endereço Base58 iniciando com T';
    } else if (engine === 'Stellar') {
      if (engineDescEl) engineDescEl.textContent = 'Tokens e ativos customizados (Trustlines) da rede Stellar. Insira o identificador no formato CODE:ISSUER.';
      if (contractLabelEl) contractLabelEl.textContent = 'Ativo Stellar (CODE:EMISSOR)';
      if (contractInputEl) {
        contractInputEl.placeholder = 'Ex: USDC:GBBD4S237...';
        contractInputEl.value = '';
      }
      if (contractHintEl) contractHintEl.textContent = 'Formato: CÓDIGO do Ativo seguido de dois pontos (:) e a Chave Pública do Emissor';
    } else {
      if (engineDescEl) engineDescEl.textContent = 'Ativos adicionais na rede ativa.';
      if (contractLabelEl) contractLabelEl.textContent = 'Identificador/Contrato';
      if (contractInputEl) {
        contractInputEl.placeholder = 'Insira o ID ou endereço';
        contractInputEl.value = '';
      }
      if (contractHintEl) contractHintEl.textContent = 'Insira um identificador único de pelo menos 10 caracteres';
    }

    // Reseta campos
    const nameInput = document.getElementById('add-token-name');
    const symbolInput = document.getElementById('add-token-symbol');
    const decimalsInput = document.getElementById('add-token-decimals');
    if (nameInput) {
      nameInput.value = '';
      nameInput.disabled = false;
    }
    if (symbolInput) {
      symbolInput.value = '';
      symbolInput.disabled = false;
    }
    if (decimalsInput) {
      decimalsInput.value = (engine === 'EVM' ? '18' : engine === 'Solana' ? '9' : engine === 'Tron' ? '6' : engine === 'Stellar' ? '7' : '8');
      decimalsInput.disabled = false;
    }
    const submitBtn = document.getElementById('btn-add-token-submit');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }

    window.B2UIRenderer.openModal('modal-add-token');
  };

B2WalletApp.prototype.showAddNFTModal = function() {
    const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
    if (!chain) return;

    const chainNameEl = document.getElementById('add-nft-chain-name');
    const chainDotEl = document.getElementById('add-nft-chain-dot');
    const contractInputEl = document.getElementById('add-nft-contract');
    const tokenIdInputEl = document.getElementById('add-nft-token-id');
    const nameInputEl = document.getElementById('add-nft-name');
    const collectionInputEl = document.getElementById('add-nft-collection');
    const contractLabelEl = document.getElementById('add-nft-contract-label');

    if (chainNameEl) chainNameEl.textContent = chain.name;
    if (chainDotEl) chainDotEl.style.backgroundColor = chain.color || 'var(--color-primary)';

    if (contractLabelEl) {
      if (chain.engine === 'EVM') {
        contractLabelEl.textContent = 'Endereço do Contrato (ERC-721 / ERC-1155)';
      } else if (chain.engine === 'Solana') {
        contractLabelEl.textContent = 'Endereço Mint do NFT';
      } else {
        contractLabelEl.textContent = 'ID do Ativo ou Endereço do Contrato';
      }
    }

    if (contractInputEl) contractInputEl.value = '';
    if (tokenIdInputEl) tokenIdInputEl.value = '';
    if (nameInputEl) nameInputEl.value = '';
    if (collectionInputEl) collectionInputEl.value = '';

    window.B2UIRenderer.openModal('modal-add-nft');
  };

B2WalletApp.prototype.mintSandboxNFT = function(activeKey) {
    // Mint sandbox desativado: não criamos mocks de NFTs em produção.
    window.B2Logger.log('warn', 'mintSandboxNFT chamado, mas está desativado nesta build');
    try { window.showToast && window.showToast('Mint sandbox desativado.', 'info'); } catch (e) { }
    return;
  };

B2WalletApp.prototype.mintCustomNFT = function(nftName, gradient) {
    // Mint custom desabilitado — não armazenamos/generamos NFTs fictícios localmente.
    window.B2Logger.log('warn', 'mintCustomNFT chamado, mas desativado nesta build');
    try { window.showToast && window.showToast('Mint custom desativado.', 'info'); } catch (e) { }
    return;
  };

B2WalletApp.prototype._renderAccountManager = function() {
    const listEl = document.getElementById('account-list-container');
    if (!listEl) return;

    listEl.innerHTML = '';

    // Garante que a conta 0 (principal) sempre existe
    if (!this.accounts || this.accounts.length === 0) {
      this.accounts = [{
        index: 0,
        label: 'Conta Principal',
        createdAt: Date.now(),
        type: 'derived'
      }];
      localStorage.setItem('b2_accounts', JSON.stringify(this.accounts));
    }

    const activeChain = this.blockchainData.find(c => c.key === this.activeChainKey);

    this.accounts.forEach((acc, idx) => {
      const isActive = idx === this.activeAccountIndex;
      const derived = this.derivedKeys[this.activeChainKey];
      const addr = (derived && derived.address) ? derived.address : '—';
      const truncAddr = addr.length > 24 ? addr.substring(0, 10) + '…' + addr.substring(addr.length - 8) : addr;

      const card = document.createElement('div');
      card.style.cssText = `
        display:flex; align-items:center; gap:12px; padding:12px 14px;
        background:${isActive ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)'};
        border:1px solid ${isActive ? (activeChain?.color || 'var(--color-primary)') : 'rgba(255,255,255,0.07)'};
        border-radius:12px; cursor:pointer;
        transition: all 0.2s ease;
      `;
      card.setAttribute('data-acc-idx', idx);

      // Avatar — emoji se definido, senão iniciais
      const avatar = document.createElement('div');
      const hasEmoji = acc.avatar && acc.avatar.trim().length > 0;
      const initials = (acc.label || 'C').substring(0, 2).toUpperCase();
      if (hasEmoji) {
        avatar.style.cssText = `
          width:40px; height:40px; border-radius:50%;
          background:linear-gradient(135deg, ${activeChain?.color || '#f59e0b'} 0%, rgba(255,255,255,0.1) 100%);
          display:flex; align-items:center; justify-content:center;
          font-size:1.3rem; flex-shrink:0;
        `;
        avatar.textContent = acc.avatar;
      } else {
        avatar.style.cssText = `
          width:40px; height:40px; border-radius:50%;
          background:linear-gradient(135deg, ${activeChain?.color || '#f59e0b'} 0%, rgba(255,255,255,0.1) 100%);
          display:flex; align-items:center; justify-content:center;
          font-weight:900; font-size:13px; color:#fff; flex-shrink:0;
          font-family:var(--font-mono);
        `;
        avatar.textContent = initials;
      }

      // Info
      const info = document.createElement('div');
      info.style.cssText = 'flex:1; min-width:0;';

      const nameRow = document.createElement('div');
      nameRow.style.cssText = 'display:flex; align-items:center; gap:6px; margin-bottom:3px;';

      const nameSpan = document.createElement('span');
      nameSpan.style.cssText = 'font-size:var(--text-sm); font-weight:var(--fw-semibold); color:var(--text-primary);';
      nameSpan.textContent = acc.label || `Conta ${idx + 1}`;
      nameRow.appendChild(nameSpan);

      if (acc.type === 'imported') {
        const tag = document.createElement('span');
        tag.style.cssText = 'font-size:9px; padding:1px 6px; background:rgba(99,102,241,0.15); color:#818cf8; border:1px solid rgba(99,102,241,0.3); border-radius:99px; font-weight:700;';
        tag.textContent = 'IMPORTADA';
        nameRow.appendChild(tag);
      }

      if (isActive) {
        const activeBadge = document.createElement('span');
        activeBadge.style.cssText = 'font-size:9px; padding:1px 6px; background:rgba(16,185,129,0.15); color:var(--text-success); border:1px solid rgba(16,185,129,0.3); border-radius:99px; font-weight:700;';
        activeBadge.textContent = 'ATIVA';
        nameRow.appendChild(activeBadge);
      }

      const addrSpan = document.createElement('div');
      addrSpan.style.cssText = 'font-size:11px; color:var(--text-muted); font-family:var(--font-mono); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
      addrSpan.textContent = isActive ? truncAddr : `HD Índice ${idx}`;
      addrSpan.title = isActive ? addr : '';

      info.appendChild(nameRow);
      info.appendChild(addrSpan);

      // Actions (switch + edit + keys + remove)
      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex; gap:5px; flex-shrink:0;';

      if (!isActive) {
        const btnSwitch = document.createElement('button');
        btnSwitch.style.cssText = `
          padding:4px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.12);
          background:rgba(255,255,255,0.05); color:var(--text-primary);
          font-size:11px; font-weight:600; cursor:pointer;
          transition: all 0.15s;
        `;
        btnSwitch.textContent = 'Usar';
        btnSwitch.title = `Ativar ${acc.label}`;
        btnSwitch.addEventListener('click', (e) => {
          e.stopPropagation();
          this.switchAccount(idx);
          this._renderAccountManager();
        });
        actions.appendChild(btnSwitch);
      }

      // Botão Editar (lápis)
      const btnEdit = document.createElement('button');
      btnEdit.style.cssText = `
        width:28px; height:28px; border-radius:6px;
        border:1px solid rgba(99,102,241,0.25); background:rgba(99,102,241,0.08);
        color:#818cf8; font-size:14px; cursor:pointer; display:flex;
        align-items:center; justify-content:center; transition: all 0.15s;
      `;
      btnEdit.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      btnEdit.title = 'Editar nome e avatar';
      btnEdit.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openEditAccountModal(idx);
      });
      actions.appendChild(btnEdit);

      // Botão Ver Chaves (cadeado)
      const btnKeys = document.createElement('button');
      btnKeys.style.cssText = `
        width:28px; height:28px; border-radius:6px;
        border:1px solid rgba(245,158,11,0.25); background:rgba(245,158,11,0.08);
        color:var(--color-primary); font-size:14px; cursor:pointer; display:flex;
        align-items:center; justify-content:center; transition: all 0.15s;
      `;
      btnKeys.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
      btnKeys.title = 'Ver seed / chaves';
      btnKeys.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openViewKeysModal(idx);
      });
      actions.appendChild(btnKeys);

      if (idx !== 0) {
        const btnRemove = document.createElement('button');
        btnRemove.style.cssText = `
          width:28px; height:28px; border-radius:6px;
          border:1px solid rgba(239,68,68,0.25); background:rgba(239,68,68,0.08);
          color:#ef4444; font-size:14px; cursor:pointer; display:flex;
          align-items:center; justify-content:center; transition: all 0.15s;
        `;
        btnRemove.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`;
        btnRemove.title = 'Remover conta';
        btnRemove.addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmed = await window.B2Toast.confirm("Remover Conta", `Deseja realmente remover a conta "${acc.label}"? Esta ação não pode ser desfeita.`, "warning");
          if (confirmed) {
            this.removeAccount(idx);
            this._renderAccountManager();
          }
        });
        actions.appendChild(btnRemove);
      }

      card.appendChild(avatar);
      card.appendChild(info);
      card.appendChild(actions);
      listEl.appendChild(card);
    });

    // Separador + dica
    const tip = document.createElement('p');
    tip.style.cssText = 'font-size:11px; color:var(--text-muted); text-align:center; padding-top:8px; line-height:1.5;';
    tip.textContent = '🔒 Todas as contas compartilham o mesmo seed. Cada conta usa um índice de derivação HD único.';
    listEl.appendChild(tip);
  };

B2WalletApp.prototype._openEditAccountModal = function(accIdx) {
    const acc = this.accounts[accIdx];
    if (!acc) return;

    // Guarda índice de conta sendo editada
    this._editingAccountIdx = accIdx;

    // Preenche nome
    const nameInput = document.getElementById('edit-account-name');
    if (nameInput) nameInput.value = acc.label || '';

    // Preenche avatar
    const preview = document.getElementById('edit-account-avatar-preview');
    if (preview) preview.textContent = acc.avatar || '👤';

    // Preenche grid de emojis
    const grid = document.getElementById('edit-account-emoji-grid');
    if (grid) {
      const emojis = ['👤', '👨', '👩', '🧑', '🧔', '🦸', '🦹', '👨‍💻', '🧙', '🦊', '🐺', '🦁', '🐯', '🦄', '🐉', '💎', '🔑', '🏦', '💰', '🤖', '👾', '🎭', '🎩', '🏴‍☠️', '🛸', '⚡', '🔥', '🌊', '🌟', '💫', '🎯', '🏆'];
      grid.innerHTML = '';
      grid.style.display = 'flex';
      emojis.forEach(e => {
        const btn = document.createElement('button');
        btn.textContent = e;
        btn.title = e;
        btn.style.cssText = 'font-size:1.3rem;background:none;border:none;cursor:pointer;padding:2px 4px;border-radius:6px;transition:background 0.15s;';
        btn.addEventListener('mouseenter', () => btn.style.background = 'var(--bg-hover)');
        btn.addEventListener('mouseleave', () => btn.style.background = 'none');
        btn.addEventListener('click', () => {
          if (preview) preview.textContent = e;
          grid.style.display = 'none';
        });
        grid.appendChild(btn);
      });
    }

    // Clique no preview toggles o grid
    if (preview) {
      preview.onclick = () => {
        if (grid) grid.style.display = grid.style.display === 'none' ? 'flex' : 'none';
      };
    }

    window.B2UIRenderer.closeModal('modal-account-manager');
    window.B2UIRenderer.openModal('modal-edit-account');
  };

B2WalletApp.prototype._initEditAccountModal = function() {
    const btnClose = document.getElementById('btn-close-edit-account');
    if (btnClose) btnClose.addEventListener('click', () => {
      window.B2UIRenderer.closeModal('modal-edit-account');
      window.B2UIRenderer.openModal('modal-account-manager');
      this._renderAccountManager();
    });

    const btnSave = document.getElementById('btn-save-edit-account');
    if (btnSave) btnSave.addEventListener('click', () => {
      const idx = this._editingAccountIdx;
      if (idx == null || !this.accounts[idx]) return;
      const nameInput = document.getElementById('edit-account-name');
      const preview = document.getElementById('edit-account-avatar-preview');
      const newName = (nameInput?.value || '').trim();
      const newAvatar = (preview?.textContent || '').trim();
      if (newName) this.accounts[idx].label = newName;
      if (newAvatar && newAvatar !== '👤') this.accounts[idx].avatar = newAvatar;
      localStorage.setItem('b2_accounts', JSON.stringify(this.accounts));
      this._refreshAccountChipLabel();
      window.showToast('✅ Conta atualizada com sucesso!', 'success');
      window.B2UIRenderer.closeModal('modal-edit-account');
      window.B2UIRenderer.openModal('modal-account-manager');
      this._renderAccountManager();
    });
  };

B2WalletApp.prototype._openViewKeysModal = function(accIdx) {
    const acc = this.accounts[accIdx];
    if (!acc) return;
    this._viewingKeysIdx = accIdx;

    // Reset UI
    const pinSection = document.getElementById('view-keys-pin-section');
    const revealedSection = document.getElementById('view-keys-revealed-section');
    const pwdInput = document.getElementById('view-keys-password');
    if (pinSection) { pinSection.style.display = 'flex'; }
    if (revealedSection) { revealedSection.style.display = 'none'; }
    if (pwdInput) { pwdInput.value = ''; }

    window.B2UIRenderer.closeModal('modal-account-manager');
    window.B2UIRenderer.openModal('modal-view-keys');
  };

B2WalletApp.prototype._initViewKeysModal = function() {
    const btnClose = document.getElementById('btn-close-view-keys');
    if (btnClose) btnClose.addEventListener('click', () => {
      this._hideKeysAndReset();
      window.B2UIRenderer.closeModal('modal-view-keys');
      window.B2UIRenderer.openModal('modal-account-manager');
      this._renderAccountManager();
    });

    const btnReveal = document.getElementById('btn-reveal-keys');
    if (btnReveal) btnReveal.addEventListener('click', async () => {
      const pwdInput = document.getElementById('view-keys-password');
      const pwd = (pwdInput?.value || '').trim();
      if (!pwd) { window.showToast('Digite a senha da carteira.', 'warning'); return; }

      try {
        // Valida a senha tentando descriptografar o payload principal
        const seed = await window.B2PlatformSecurity.decryptData(this.encryptedWalletPayload, pwd);
        if (!seed) throw new Error('Senha inválida.');

        const accIdx = this._viewingKeysIdx;
        const acc = this.accounts[accIdx];
        const activeChainKey = this.activeChainKey;
        const derivedKey = this.derivedKeys[activeChainKey];

        // --- Endereço público ---
        const addrEl = document.getElementById('view-keys-address');
        if (addrEl) addrEl.textContent = derivedKey?.address || '—';

        // --- Chave pública (hex da chave privada passada pelo ethers se EVM) ---
        const pubkeyEl = document.getElementById('view-keys-pubkey');
        if (pubkeyEl) {
          let pubkey = '—';
          try {
            if (derivedKey?.privateKey && window.ethers) {
              const wallet = new window.ethers.Wallet('0x' + derivedKey.privateKey);
              pubkey = wallet.signingKey.publicKey;
            } else if (derivedKey?.publicKey) {
              // Waves / Solana etc. guardam publicKey como Uint8Array ou string
              const pk = derivedKey.publicKey;
              pubkey = (typeof pk === 'string') ? pk : Array.from(pk).map(b => b.toString(16).padStart(2, '0')).join('');
            }
          } catch (_) { }
          pubkeyEl.textContent = pubkey;
        }

        // --- Chave privada ---
        const privkeyEl = document.getElementById('view-keys-privkey');
        if (privkeyEl) {
          if (acc?.type === 'external-key') {
            // Conta importada — tenta recuperar via ExternalKeyManager
            try {
              const raw = await window.B2ExternalKeyManager?.decryptKey(accIdx, pwd);
              privkeyEl.textContent = raw || '—';
            } catch (_) {
              privkeyEl.textContent = '(chave externa não recuperável)';
            }
          } else {
            privkeyEl.textContent = derivedKey?.privateKey ? '0x' + derivedKey.privateKey : '—';
          }
        }

        // --- Seed phrase ---
        const seedSection = document.getElementById('view-keys-seed-section');
        const seedEl = document.getElementById('view-keys-seed');
        if (acc?.type === 'external-key' || acc?.type === 'watch-only') {
          // Contas externas não têm seed B2
          if (seedSection) seedSection.style.display = 'none';
        } else {
          if (seedSection) seedSection.style.display = 'block';
          if (seedEl) seedEl.textContent = seed;
        }

        // Mostrar seção revelada, ocultar PIN
        const pinSection = document.getElementById('view-keys-pin-section');
        const revealedSection = document.getElementById('view-keys-revealed-section');
        if (pinSection) pinSection.style.display = 'none';
        if (revealedSection) revealedSection.style.display = 'flex';
        if (document.getElementById('view-keys-password')) document.getElementById('view-keys-password').value = '';

        // Auto-hide countdown
        this._startViewKeysCountdown(60);

      } catch (e) {
        window.B2Toast.alert('Autenticação Falhou', 'Senha incorreta. Verifique e tente novamente.', 'error');
      }
    });

    // Copy buttons
    document.querySelectorAll('.copy-key-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const el = document.getElementById(targetId);
        if (el && el.textContent && el.textContent !== '—') {
          navigator.clipboard.writeText(el.textContent).then(() => {
            window.showToast('Copiado para a área de transferência!', 'success');
          }).catch(() => {
            window.showToast('Falha ao copiar.', 'error');
          });
        }
      });
    });
  };

B2WalletApp.prototype._startViewKeysCountdown = function(seconds) {
    if (this._viewKeysTimer) clearInterval(this._viewKeysTimer);
    let remaining = seconds;
    const countdownEl = document.getElementById('view-keys-countdown');
    if (countdownEl) countdownEl.textContent = remaining;

    this._viewKeysTimer = setInterval(() => {
      remaining--;
      if (countdownEl) countdownEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(this._viewKeysTimer);
        this._hideKeysAndReset();
      }
    }, 1000);
  };

B2WalletApp.prototype._hideKeysAndReset = function() {
    if (this._viewKeysTimer) clearInterval(this._viewKeysTimer);
    const pinSection = document.getElementById('view-keys-pin-section');
    const revealedSection = document.getElementById('view-keys-revealed-section');
    if (pinSection) pinSection.style.display = 'flex';
    if (revealedSection) revealedSection.style.display = 'none';
    // Limpa dados sensíveis do DOM
    ['view-keys-address', 'view-keys-pubkey', 'view-keys-privkey', 'view-keys-seed'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
  };

