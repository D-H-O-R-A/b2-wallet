/**
 * B2 Wallet - Modal Dialogs and Transaction flows Event Listeners (Modulo Eventos Modais)
 */

B2WalletApp.prototype.setupModalEvents = function() {
    // ----------------------------------------------------------------
    // H. MODAIS — RECEIVE, SEND, ADD NETWORK, ADD TOKEN, LEASING, ACCOUNT
    // ----------------------------------------------------------------

    // Modal Receive
    const btnCloseReceive = document.getElementById('btn-close-receive');
    if (btnCloseReceive) btnCloseReceive.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-receive'));

    // Event listeners para as abas de Receber do Zcash (ZEC)
    const receiveZcashTabs = document.querySelectorAll('.zcash-receive-tab');
    receiveZcashTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'tAddress' | 'saplingAddress' | 'unifiedAddress'
        const keys = this.derivedKeys['ZEC'];
        if (!keys) return;

        // 1. Atualizar estilo visual das abas
        receiveZcashTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        // 2. Atualizar o endereço exibido
        const address = keys[type] || keys.address;
        const addressDisplay = document.getElementById('receive-address-display');
        if (addressDisplay) addressDisplay.textContent = address;

        // 3. Regenerar o QR Code com o endereço selecionado
        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          try {
            new QRCode(qrContainer, {
              text: address,
              width: 200,
              height: 200,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          } catch (e) {
            qrContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:200px;height:200px;background:#fff;color:#000;font-size:10px;text-align:center;padding:8px;word-break:break-all;">${address}</div>`;
          }
        }
      });
    });

    // Event listeners para as abas de Receber do Dash (DASH)
    const receiveDashTabs = document.querySelectorAll('.dash-receive-tab');
    receiveDashTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'p2pkh' | 'p2sh'
        const keys = this.derivedKeys['DASH'];
        if (!keys) return;

        // 1. Atualizar estilo visual das abas
        receiveDashTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        // 2. Atualizar o endereço exibido
        const address = type === 'p2sh' ? (keys.p2shAddress || keys.address) : (keys.p2pkhAddress || keys.address);
        const addressDisplay = document.getElementById('receive-address-display');
        if (addressDisplay) addressDisplay.textContent = address;

        // 3. Regenerar o QR Code com o endereço selecionado
        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          try {
            new QRCode(qrContainer, {
              text: address,
              width: 200,
              height: 200,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          } catch (e) {
            qrContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:200px;height:200px;background:#fff;color:#000;font-size:10px;text-align:center;padding:8px;word-break:break-all;">${address}</div>`;
          }
        }
      });
    });

    // Event listeners para as abas de Receber do Bitcoin (BTC)
    const receiveBtcTabs = document.querySelectorAll('.btc-receive-tab');
    receiveBtcTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'native' | 'nested' | 'legacy' | 'taproot'
        const keys = this.derivedKeys['BTC'];
        if (!keys) return;

        receiveBtcTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        let addressKey = 'nativeAddress';
        if (type === 'nested') addressKey = 'nestedAddress';
        else if (type === 'legacy') addressKey = 'legacyAddress';
        else if (type === 'taproot') addressKey = 'taprootAddress';

        const address = keys[addressKey] || keys.address;
        const addressDisplay = document.getElementById('receive-address-display');
        if (addressDisplay) addressDisplay.textContent = address;

        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          try {
            new QRCode(qrContainer, {
              text: address,
              width: 200,
              height: 200,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          } catch (e) {
            qrContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:200px;height:200px;background:#fff;color:#000;font-size:10px;text-align:center;padding:8px;word-break:break-all;">${address}</div>`;
          }
        }
      });
    });

    // Event listeners para as abas de Receber do Litecoin (LTC)
    const receiveLtcTabs = document.querySelectorAll('.ltc-receive-tab');
    receiveLtcTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'legacy' | 'nested' | 'native'
        const keys = this.derivedKeys['LTC'];
        if (!keys) return;

        receiveLtcTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        let addressKey = 'legacyAddress';
        if (type === 'nested') addressKey = 'nestedAddress';
        else if (type === 'native') addressKey = 'nativeAddress';

        const address = keys[addressKey] || keys.address;
        const addressDisplay = document.getElementById('receive-address-display');
        if (addressDisplay) addressDisplay.textContent = address;

        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          try {
            new QRCode(qrContainer, {
              text: address,
              width: 200,
              height: 200,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          } catch (e) {
            qrContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:200px;height:200px;background:#fff;color:#000;font-size:10px;text-align:center;padding:8px;word-break:break-all;">${address}</div>`;
          }
        }
      });
    });

    // Event listeners para as abas de Receber do Dogecoin (DOGE)
    const receiveDogeTabs = document.querySelectorAll('.doge-receive-tab');
    receiveDogeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'legacy' | 'nested'
        const keys = this.derivedKeys['DOGE'];
        if (!keys) return;

        receiveDogeTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        let addressKey = 'legacyAddress';
        if (type === 'nested') addressKey = 'nestedAddress';

        const address = keys[addressKey] || keys.address;
        const addressDisplay = document.getElementById('receive-address-display');
        if (addressDisplay) addressDisplay.textContent = address;

        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          try {
            new QRCode(qrContainer, {
              text: address,
              width: 200,
              height: 200,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          } catch (e) {
            qrContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:200px;height:200px;background:#fff;color:#000;font-size:10px;text-align:center;padding:8px;word-break:break-all;">${address}</div>`;
          }
        }
      });
    });

    // Event listeners para as abas de Receber do Bitcoin Cash (BCH)
    const receiveBchTabs = document.querySelectorAll('.bch-receive-tab');
    receiveBchTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'cashaddr' | 'legacy'
        const keys = this.derivedKeys['BCH'];
        if (!keys) return;

        receiveBchTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        let addressKey = 'cashAddress';
        if (type === 'legacy') addressKey = 'legacyAddress';

        const address = keys[addressKey] || keys.address;
        const addressDisplay = document.getElementById('receive-address-display');
        if (addressDisplay) addressDisplay.textContent = address;

        const qrContainer = document.getElementById('qrcode-container');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          try {
            new QRCode(qrContainer, {
              text: address,
              width: 200,
              height: 200,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          } catch (e) {
            qrContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:200px;height:200px;background:#fff;color:#000;font-size:10px;text-align:center;padding:8px;word-break:break-all;">${address}</div>`;
          }
        }
      });
    });

    const btnCopyReceiveAddress = document.getElementById('receive-copy-btn');
    if (btnCopyReceiveAddress) {
      btnCopyReceiveAddress.addEventListener('click', () => {
        const addrEl = document.getElementById('receive-address-display');
        const addr = addrEl ? addrEl.textContent : '';
        if (addr && addr !== '—') {
          navigator.clipboard.writeText(addr).then(() => {
            window.showToast('Endereço copiado!', 'success');
          }).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = addr; document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta);
            window.showToast('Endereço copiado!', 'success');
          });
        }
      });
    }

    const btnShareReceive = document.getElementById('receive-share-btn');
    if (btnShareReceive) {
      btnShareReceive.addEventListener('click', () => {
        const addrEl = document.getElementById('receive-address-display');
        const addr = addrEl ? addrEl.textContent : '';
        if (navigator.share && addr) {
          navigator.share({ title: 'Meu Endereço B2 Wallet', text: addr });
        } else {
          navigator.clipboard.writeText(addr);
          window.showToast('Endereço copiado para compartilhamento!', 'info');
        }
      });
    }

    // Badge de endereço no header — clique para copiar
    const addrBadge = document.getElementById('active-chain-address-badge');
    if (addrBadge) {
      addrBadge.addEventListener('click', () => {
        const keys = this.derivedKeys[this.activeChainKey];
        if (keys && keys.address) {
          navigator.clipboard.writeText(keys.address).then(() => {
            window.showToast('Endereço copiado!', 'success');
          }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = keys.address; document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta);
            window.showToast('Endereço copiado!', 'success');
          });
        }
      });
    }

    // Dashboard — botão Receber
    const btnDashReceive = document.getElementById('dashboard-btn-receive');
    if (btnDashReceive) {
      btnDashReceive.addEventListener('click', () => {
        if (!this.decryptedSeed) {
          window.showToast('Desbloqueie a carteira primeiro.', 'warning');
          return;
        }
        this.showReceiveModal(this.activeChainKey);
      });
    }

    // Dashboard — botão Enviar
    const btnDashSend = document.getElementById('dashboard-btn-send');
    if (btnDashSend) {
      btnDashSend.addEventListener('click', () => {
        if (!this.decryptedSeed) {
          window.showToast('Desbloqueie a carteira primeiro.', 'warning');
          return;
        }
        this.showSendModal(this.activeChainKey);
      });
    }

    // Dashboard — botão Recarregar/Atualizar
    const btnDashReload = document.getElementById('dashboard-btn-reload');
    if (btnDashReload) {
      btnDashReload.addEventListener('click', () => {
        if (this.activeChainKey) {
          const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
          if (chain && chain.isLoadingBalance) {
            return; // Já está atualizando
          }
          window.showToast('Atualizando dados da rede...', 'info');
          // Força a atualização (específica para essa chain)
          this.updateNetworkBalances(this.activeChainKey);
        }
      });
    }

    // Dashboard — botão Leasing
    const btnDashLeasing = document.getElementById('dashboard-btn-leasing');
    if (btnDashLeasing) {
      btnDashLeasing.addEventListener('click', () => {
        if (!this.decryptedSeed) {
          window.showToast('Desbloqueie a carteira primeiro.', 'warning');
          return;
        }
        this.showLeasingView(this.activeChainKey);
      });
    }

    // Dashboard — botão Faucet
    const btnDashFaucet = document.getElementById('dashboard-btn-faucet');
    if (btnDashFaucet) {
      btnDashFaucet.addEventListener('click', () => {
        const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
        if (chain && chain.faucet) {
          window.open(chain.faucet, '_blank', 'noopener,noreferrer');
        } else {
          window.showToast('Nenhum faucet disponível para esta rede.', 'warning');
        }
      });
    }

    // Leasing view — botão voltar
    const btnBackLeasing = document.getElementById('btn-back-from-leasing');
    if (btnBackLeasing) {
      btnBackLeasing.addEventListener('click', () => {
        window.B2UIRenderer.navigateTo('view-dashboard');
      });
    }

    // Leasing view — botão iniciar arrendamento
    const btnStartLease = document.getElementById('btn-start-lease');
    if (btnStartLease) {
      btnStartLease.addEventListener('click', () => {
        const chainKey = this._leasingChainKey || this.activeChainKey;
        const chain = this.blockchainData.find(c => c.key === chainKey);
        // Pega o nó selecionado na view
        const selectedNodeCard = document.querySelector('#leasing-nodes-list .leasing-node-card.selected');
        const nodeAddr = selectedNodeCard ? selectedNodeCard.getAttribute('data-node-addr') : '3P8B2BrasilValidatorNodeLease7H9o';
        const nodeName = selectedNodeCard ? selectedNodeCard.getAttribute('data-node-name') : 'WavesBrasil Node';
        const amountInput = document.getElementById('leasing-amount-input');
        const amount = parseFloat(amountInput ? amountInput.value : 0);

        if (!amount || amount <= 0) {
          window.showToast('Digite um valor válido.', 'warning');
          return;
        }
        if (!this.decryptedSeed) {
          window.showToast('Desbloqueie a carteira primeiro.', 'warning');
          return;
        }

        // startLPoSLease agora faz o broadcast real e exibe os toasts de resultado
        this.startLPoSLease(chainKey, nodeAddr, nodeName, amount);
        if (amountInput) amountInput.value = '';
        const chain2 = this.blockchainData.find(c => c.key === chainKey);
        if (chain2) this._renderActiveLeasesInView(chainKey, chain2);
      });
    }

    // Modal Send — fechar
    const btnCloseSend = document.getElementById('btn-close-send');
    if (btnCloseSend) btnCloseSend.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-send'));

    // Modal Send — validação em tempo real
    const sendToAddr = document.getElementById('send-to-address');
    const sendAmountInput = document.getElementById('send-amount');
    const sendConfirmBtn = document.getElementById('btn-send-confirm');
    const sendPinInput = document.getElementById('send-pin-input');
    const sendAddressValidation = document.getElementById('send-address-validation');
    const memoInput = document.getElementById('send-memo-input');

    // Garante que send-pin-input aceite somente dígitos (igual ao pin-input principal)
    if (sendPinInput) {
      sendPinInput.addEventListener('input', (e) => {
        const pos = e.target.selectionStart;
        const clean = e.target.value.replace(/\D/g, '');
        if (e.target.value !== clean) {
          e.target.value = clean;
          // Restaura posição do cursor após remoção de caractere não-numérico
          try { e.target.setSelectionRange(pos - 1, pos - 1); } catch (_) { }
        }
      });
    }

    const validateSendForm = () => {
      const addr = sendToAddr ? sendToAddr.value.trim() : '';
      const amt = parseFloat(sendAmountInput ? sendAmountInput.value : 0);
      const pin = sendPinInput ? sendPinInput.value : '';

      let isAddressValid = true;
      let validationMsg = '';

      if (this._sendContext && addr.length > 0) {
        const { chain } = this._sendContext;
        if (chain.key === 'DASH') {
          const dashType = this._sendContext.dashType || 'p2pkh';
          if (dashType === 'p2pkh') {
            if (addr.startsWith('X')) {
              isAddressValid = window.B2KeyDerivationEngine.validateAddress(addr, 'DASH');
              if (!isAddressValid) validationMsg = 'Endereço P2PKH (X...) inválido.';
            } else {
              isAddressValid = false;
              validationMsg = 'Apenas endereços P2PKH (X...) são aceitos nesta rota.';
            }
          } else if (dashType === 'p2sh') {
            if (addr.startsWith('7')) {
              isAddressValid = window.B2KeyDerivationEngine.validateAddress(addr, 'DASH');
              if (!isAddressValid) validationMsg = 'Endereço P2SH (7...) inválido.';
            } else {
              isAddressValid = false;
              validationMsg = 'Apenas endereços P2SH (7...) são aceitos nesta rota.';
            }
          }
        } else if (chain.key === 'ZEC') {
          const zcashType = this._sendContext.zcashType || 'transparent';
          if (zcashType === 'transparent') {
            if (addr.startsWith('t1') || addr.startsWith('t3')) {
              isAddressValid = window.B2KeyDerivationEngine.validateAddress(addr, 'ZEC_TRANSPARENT');
              if (!isAddressValid) validationMsg = 'Endereço transparente inválido.';
            } else {
              isAddressValid = false;
              validationMsg = 'Apenas endereços Transparentes (t1...) são aceitos para rota Pública.';
            }
          } else if (zcashType === 'shielded') {
            if (addr.startsWith('zs1')) {
              isAddressValid = window.B2KeyDerivationEngine.validateAddress(addr, 'ZEC_SAPLING');
              if (!isAddressValid) validationMsg = 'Endereço Sapling (zs...) inválido.';
            } else {
              isAddressValid = false;
              validationMsg = 'Apenas endereços Sapling (zs1...) são aceitos para rota Privada.';
            }
          } else if (zcashType === 'unified') {
            isAddressValid = window.B2KeyDerivationEngine.validateAddress(addr, 'ZEC_TRANSPARENT') ||
              window.B2KeyDerivationEngine.validateAddress(addr, 'ZEC_SAPLING') ||
              window.B2KeyDerivationEngine.validateAddress(addr, 'ZEC_UNIFIED');
            if (!isAddressValid) validationMsg = 'Endereço Zcash inválido (t1..., zs1... ou u1...).';
          }
        } else {
          // Outras redes
          isAddressValid = window.B2KeyDerivationEngine.validateAddress(addr, chain.key, chain.engine);
          if (!isAddressValid) validationMsg = `Endereço inválido para a rede ${chain.name}.`;
        }
      }

      if (sendAddressValidation) {
        if (addr.length === 0) {
          sendAddressValidation.style.display = 'none';
          sendAddressValidation.textContent = '';
        } else if (validationMsg) {
          sendAddressValidation.textContent = validationMsg;
          sendAddressValidation.style.display = 'block';
          sendAddressValidation.style.color = 'var(--text-danger)';
        } else if (isAddressValid) {
          sendAddressValidation.textContent = '✓ Endereço de destino válido';
          sendAddressValidation.style.display = 'block';
          sendAddressValidation.style.color = 'var(--text-success)';

          // Dynamic TRON estimation & account activation check
          if (this._sendContext && this._sendContext.chain.key === 'TRON' && addr.startsWith('T') && addr.length === 34) {
            const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
            const chain = this._sendContext.chain;
            const keys = this._sendContext.keys;
            const selectedToken = this._sendContext.selectedToken;
            const tokenAddress = selectedToken ? (selectedToken.contractAddress || selectedToken.assetId || null) : null;
            const memoVal = memoInput ? memoInput.value.trim() : '';

            const gasLoading = document.getElementById('gas-fee-loading');
            const gasLimit = document.getElementById('gas-limit-display');
            const gasPrice = document.getElementById('gas-price-display');
            const gasTotal = document.getElementById('gas-total-display');

            const checkKey = `${addr}_${amt}_${tokenAddress}_${memoVal}`;
            if (this._lastTronEstimateKey !== checkKey) {
              this._lastTronEstimateKey = checkKey;
              if (gasLoading) gasLoading.textContent = 'Calculando custos dinâmicos TRON…';

              tronEngine.estimateTransactionCost(
                keys.address,
                addr,
                amt,
                tokenAddress,
                memoVal || null,
                chain.nodeUrl,
                ["https://tron-rpc.publicnode.com", "https://tron.api.subquery.network"]
              ).then(cost => {
                if (this._lastTronEstimateKey !== checkKey) return;

                if (gasLoading) gasLoading.textContent = '';
                if (gasLimit) {
                  if (cost.energy > 0) {
                    gasLimit.textContent = `${cost.bandwidth} BP / ${cost.energy} EP`;
                  } else {
                    gasLimit.textContent = `${cost.bandwidth} BP`;
                  }
                }
                if (gasPrice) {
                  gasPrice.textContent = 'Dinâmico';
                }
                if (gasTotal) {
                  gasTotal.textContent = `≈ ${cost.totalFeeTRX.toFixed(3)} TRX`;
                }

                if (cost.isRecipientUnactivated) {
                  sendAddressValidation.innerHTML = `⚠️ <strong>Aviso:</strong> Conta de destino não ativada.<br/>A rede TRON cobrará uma taxa de ativação de conta (queima de até 1.1 TRX) na primeira transferência.`;
                  sendAddressValidation.style.color = 'var(--text-warning)';
                  sendAddressValidation.style.display = 'block';
                } else {
                  sendAddressValidation.textContent = '✓ Endereço de destino ativo';
                  sendAddressValidation.style.color = 'var(--text-success)';
                  sendAddressValidation.style.display = 'block';
                }
              }).catch(err => {
                if (this._lastTronEstimateKey !== checkKey) return;
                if (gasLoading) gasLoading.textContent = '';
              });
            }
          }
        }
      }

      let userBalance = 0;
      let hasSufficientBalance = true;
      let balanceValidationMsg = '';

      if (this._sendContext) {
        const { chain, keys, selectedToken, selectedFeeAsset } = this._sendContext;
        const feeData = this._estimateFeeForChain(chain);
        const fee = feeData.feeCrypto || 0;

        if (chain.engine === 'Waves') {
          const nativeBalance = chain.balanceCrypto;
          if (selectedToken) {
            if (selectedFeeAsset && selectedFeeAsset.assetId === selectedToken.assetId) {
              const totalNeeded = amt + fee;
              if (selectedToken.balanceCrypto < totalNeeded) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo insuficiente para cobrir o valor e a taxa de patrocínio. Necessário: ${totalNeeded.toFixed(6)} ${selectedToken.symbol}.`;
              }
            } else if (selectedFeeAsset) {
              if (selectedToken.balanceCrypto < amt) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo do token insuficiente. Disponível: ${selectedToken.balanceCrypto.toFixed(6)} ${selectedToken.symbol}.`;
              } else if (selectedFeeAsset.balanceCrypto < fee) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo do token de taxa (${selectedFeeAsset.symbol}) insuficiente para pagar a taxa de ${fee.toFixed(6)}.`;
              }
            } else {
              if (selectedToken.balanceCrypto < amt) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo do token insuficiente. Disponível: ${selectedToken.balanceCrypto.toFixed(6)} ${selectedToken.symbol}.`;
              } else if (nativeBalance < fee) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo de moeda nativa insuficiente para pagar a taxa de ${fee.toFixed(6)} ${chain.symbol}.`;
              }
            }
          } else {
            if (selectedFeeAsset) {
              if (nativeBalance < amt) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo de moeda nativa insuficiente. Disponível: ${nativeBalance.toFixed(6)} ${chain.symbol}.`;
              } else if (selectedFeeAsset.balanceCrypto < fee) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo do token de taxa (${selectedFeeAsset.symbol}) insuficiente para pagar a taxa de ${fee.toFixed(6)}.`;
              }
            } else {
              const totalNeeded = amt + fee;
              if (nativeBalance < totalNeeded) {
                hasSufficientBalance = false;
                balanceValidationMsg = `Saldo insuficiente para cobrir o valor e a taxa de rede. Necessário: ${totalNeeded.toFixed(6)} ${chain.symbol}.`;
              }
            }
          }
        } else {
          userBalance = selectedToken ? selectedToken.balanceCrypto : chain.balanceCrypto;
          if (!selectedToken && ['BTC', 'LTC', 'DOGE', 'BCH'].includes(chain.key)) {
            const activeType = this._sendContext.activeUtxoType;
            if (activeType && keys && keys.balances && keys.balances[activeType] !== undefined) {
              userBalance = keys.balances[activeType];
            }
          }

          if (selectedToken) {
            if (selectedToken.balanceCrypto < amt) {
              hasSufficientBalance = false;
              balanceValidationMsg = `Atenção: Saldo insuficiente. Disponível: ${selectedToken.balanceCrypto.toFixed(6)} ${selectedToken.symbol}`;
            }
          } else {
            const totalNeeded = amt + fee;
            if (userBalance < totalNeeded) {
              hasSufficientBalance = false;
              balanceValidationMsg = `Atenção: Saldo insuficiente para cobrir o valor e as taxas. Disponível: ${userBalance.toFixed(6)} ${chain.symbol}`;
            }
          }
        }
      }

      const sendAmountValidation = document.getElementById('send-amount-validation');
      if (sendAmountValidation) {
        if (amt > 0 && !hasSufficientBalance) {
          sendAmountValidation.textContent = balanceValidationMsg;
          sendAmountValidation.style.display = 'block';
        } else {
          sendAmountValidation.style.display = 'none';
          sendAmountValidation.textContent = '';
        }
      }

      if (sendConfirmBtn) {
        sendConfirmBtn.disabled = !(addr.length > 5 && isAddressValid && amt > 0 && pin.length === 8 && hasSufficientBalance);
      }

      // Atualiza fiat
      if (this._sendContext && amt > 0) {
        this._updateSendAmountFiat(this._sendContext.chain, amt);
      }
    };

    this.validateSendForm = validateSendForm;

    if (sendToAddr) sendToAddr.addEventListener('input', validateSendForm);
    if (sendAmountInput) sendAmountInput.addEventListener('input', validateSendForm);
    if (sendPinInput) {
      sendPinInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        validateSendForm();
      });
    }

    // Event listeners para as abas de Enviar do Zcash (ZEC)
    const sendZcashTabs = document.querySelectorAll('.zcash-send-tab');
    sendZcashTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'transparent' | 'shielded' | 'unified'
        if (this._sendContext) {
          this._sendContext.zcashType = type;
        }

        // 1. Atualizar estilo visual das abas
        sendZcashTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        // 2. Re-validar o formulário de envio
        validateSendForm();
      });
    });

    // Event listeners para as abas de Enviar do Dash (DASH)
    const sendDashTabs = document.querySelectorAll('.dash-send-tab');
    sendDashTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type'); // 'p2pkh' | 'p2sh'
        if (this._sendContext) {
          this._sendContext.dashType = type;
        }

        // 1. Atualizar estilo visual das abas
        sendDashTabs.forEach(t => {
          if (t === tab) {
            t.classList.add('active');
            t.style.background = 'var(--color-primary)';
            t.style.color = '#fff';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = 'var(--text-secondary)';
          }
        });

        // 2. Re-validar o formulário de envio
        validateSendForm();
      });
    });

    if (sendConfirmBtn) {
      sendConfirmBtn.addEventListener('click', async () => {
        if (!this._sendContext) return;
        const { chain, keys, selectedToken, selectedFeeAsset } = this._sendContext;
        const toAddr = sendToAddr ? sendToAddr.value.trim() : '';
        const amt = parseFloat(sendAmountInput ? sendAmountInput.value : 0);
        const pin = sendPinInput ? sendPinInput.value : '';
        const storedPin = localStorage.getItem('b2_pin');

        if (pin !== storedPin) {
          await window.B2Toast.alert(
            "PIN Incorreto",
            "O PIN de acesso rápido inserido está inválido. Por favor, tente novamente.",
            "error"
          );
          return;
        }

        const feeData = this._estimateFeeForChain(chain);
        const fee = feeData.feeCrypto || 0;

        let hasSufficientBalance = true;
        if (chain.engine === 'Waves') {
          const nativeBalance = chain.balanceCrypto;
          if (selectedToken) {
            if (selectedFeeAsset && selectedFeeAsset.assetId === selectedToken.assetId) {
              if (selectedToken.balanceCrypto < amt + fee) hasSufficientBalance = false;
            } else if (selectedFeeAsset) {
              if (selectedToken.balanceCrypto < amt || selectedFeeAsset.balanceCrypto < fee) hasSufficientBalance = false;
            } else {
              if (selectedToken.balanceCrypto < amt || nativeBalance < fee) hasSufficientBalance = false;
            }
          } else {
            if (selectedFeeAsset) {
              if (nativeBalance < amt || selectedFeeAsset.balanceCrypto < fee) hasSufficientBalance = false;
            } else {
              if (nativeBalance < amt + fee) hasSufficientBalance = false;
            }
          }
        } else {
          if (selectedToken) {
            if (selectedToken.balanceCrypto < amt) hasSufficientBalance = false;
          } else {
            if (chain.balanceCrypto < amt + fee) hasSufficientBalance = false;
          }
        }

        if (!hasSufficientBalance) {
          window.showToast('Saldo insuficiente para realizar a transação e pagar as taxas.', 'error');
          return;
        }

        // Obtém o campo de Memo/Tag de Destino
        const memoVal = memoInput ? memoInput.value.trim() : '';

        // Salva saldos originais para reversão limpa se falhar
        const originalNativeBalance = chain.balanceCrypto;
        const originalTokenBalance = selectedToken ? selectedToken.balanceCrypto : 0;
        const originalFeeAssetBalance = selectedFeeAsset ? selectedFeeAsset.balanceCrypto : 0;

        // Dedução de saldo (otimista)
        if (chain.engine === 'Waves') {
          if (selectedToken) {
            selectedToken.balanceCrypto = Math.max(0, selectedToken.balanceCrypto - amt);
          } else {
            chain.balanceCrypto = Math.max(0, chain.balanceCrypto - amt);
          }

          if (selectedFeeAsset) {
            selectedFeeAsset.balanceCrypto = Math.max(0, selectedFeeAsset.balanceCrypto - fee);
          } else {
            chain.balanceCrypto = Math.max(0, chain.balanceCrypto - fee);
          }
        } else {
          if (selectedToken) {
            selectedToken.balanceCrypto = Math.max(0, selectedToken.balanceCrypto - amt);
            chain.balanceCrypto = Math.max(0, chain.balanceCrypto - fee);
          } else {
            chain.balanceCrypto = Math.max(0, chain.balanceCrypto - amt - fee);
          }
        }

        const price = chain.balanceFiat > 0 && (chain.balanceCrypto + amt) > 0
          ? chain.balanceFiat / (chain.balanceCrypto + amt) : 0;
        chain.balanceFiat = chain.balanceCrypto * price;

        const ownAddress = keys ? (keys.address || keys.p2pkhAddress || keys.pubKey || '') : '';

        // ── BROADCAST REAL PARA REDE DASH CORE ──
        if (chain.key === 'DASH' && chain.nodeUrl && this.decryptedSeed && (window.B2DashBroadcaster || globalThis.B2DashBroadcaster)) {
          window.showToast(`Preparando e assinando transação Dash Core…`, 'info');
          let txId = "";
          let txHex = "";
          try {
            const dashBroadcaster = window.B2DashBroadcaster || globalThis.B2DashBroadcaster;
            const changeAddress = keys.p2pkhAddress || keys.address;
            const txData = await dashBroadcaster.signDashTransfer(
              this.decryptedSeed,
              chain.nodeUrl,
              toAddr,
              amt,
              changeAddress,
              this.activeAccountIndex
            );
            txId = txData.txid;
            txHex = txData.hex;

            // Salva no histórico com ID real
            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${chain.symbol} para a blockchain Dash Core…`, 'info');
            const result = await dashBroadcaster.broadcastTransaction(chain.nodeUrl, txHex);
            const broadcastTxId = result.txid || txId;
            window.B2Logger.log('success', `[Dash Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação Dash: ${err.message}`, 'error');
            window.B2Logger.log('error', `[Dash Broadcast] Erro: ${err.message}`);

            // Reverte saldo se falhou
            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDES WAVES ──
        else if (chain.engine === 'Waves' && chain.nodeUrl && this.decryptedSeed) {
          window.showToast(`Preparando e assinando transação Waves…`, 'info');
          let txId = "";
          let txPayload = null;
          try {
            const assetId = selectedToken ? (selectedToken.assetId || selectedToken.id || null) : null;
            const feeAssetId = selectedFeeAsset ? (selectedFeeAsset.assetId || null) : null;
            const feeAmount = selectedFeeAsset ? (selectedFeeAsset.minSponsoredAssetFee || null) : null;

            txPayload = window.B2WavesBroadcaster.signWavesTransfer(
              this.decryptedSeed,
              toAddr,
              amt,
              assetId,
              memoVal || null,
              feeAssetId,
              feeAmount,
              this.activeAccountIndex
            );
            txId = txPayload.id;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} para a blockchain…`, 'info');
            const result = await window.B2WavesBroadcaster.broadcastTransaction(chain.nodeUrl, txPayload);
            const broadcastTxId = result.id || result.txId || txId;
            window.B2Logger.log('success', `[Waves Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação Waves: ${err.message}`, 'error');
            window.B2Logger.log('error', `[Waves Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDES EVM ──
        else if (chain.engine === 'EVM' && chain.nodeUrl && this.decryptedSeed && window.B2EVMBroadcaster) {
          const selectedToken = this._sendContext.selectedToken;
          window.showToast(`Preparando e assinando transação EVM…`, 'info');
          let txId = "";
          let signedData = null;
          try {
            const tokenAddress = selectedToken ? (selectedToken.assetId || selectedToken.id || null) : null;
            const derivedKey = this.derivedKeys[chain.key];
            const privateKeyOrMnemonic = (derivedKey && derivedKey.privateKey) ? derivedKey.privateKey : this.decryptedSeed;

            signedData = await window.B2EVMBroadcaster.signEVMTransfer(
              privateKeyOrMnemonic,
              chain.nodeUrl,
              chain.chainId,
              toAddr,
              amt,
              tokenAddress
            );
            txId = signedData.txHash;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} para a blockchain EVM…`, 'info');
            const result = await window.B2EVMBroadcaster.broadcastEVMTransaction(chain.nodeUrl, signedData.signedTxHex);
            const broadcastTxId = result.hash || result.txId || txId;
            window.B2Logger.log('success', `[EVM Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Pendente', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} enviada!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
            this._pollEVMTransactionReceipt(chain, broadcastTxId, txId, amt, feeData, price);
          } catch (err) {
            window.showToast(`❌ Falha na transação EVM: ${err.message}`, 'error');
            window.B2Logger.log('error', `[EVM Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou (Erro EVM)');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou (Erro EVM)',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE SOLANA ──
        else if (chain.engine === 'Solana' && chain.nodeUrl && this.decryptedSeed && window.B2SolanaBroadcaster) {
          const selectedToken = this._sendContext.selectedToken;
          window.showToast(`Preparando e assinando transação Solana…`, 'info');
          let txId = "";
          let signedData = null;
          try {
            const tokenAddress = selectedToken ? (selectedToken.assetId || selectedToken.id || null) : null;
            signedData = await window.B2SolanaBroadcaster.signSolanaTransfer(
              this.decryptedSeed,
              chain.nodeUrl,
              toAddr,
              amt,
              tokenAddress,
              this.activeAccountIndex
            );
            txId = signedData.txSignature;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} para a blockchain Solana…`, 'info');
            const broadcastTxId = await window.B2SolanaBroadcaster.broadcastSolanaTransaction(chain.nodeUrl, signedData.rawTx);
            window.B2Logger.log('success', `[Solana Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação Solana: ${err.message}`, 'error');
            window.B2Logger.log('error', `[Solana Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE ZCASH ──
        else if (chain.key === 'ZEC' && chain.nodeUrl && this.decryptedSeed && (window.B2ZcashBroadcaster || globalThis.B2ZcashBroadcaster)) {
          window.showToast(`Preparando e assinando transação Zcash…`, 'info');
          let txId = "";
          let signedData = null;
          try {
            const zcBroadcaster = window.B2ZcashBroadcaster || globalThis.B2ZcashBroadcaster;
            signedData = await zcBroadcaster.signZcashTransfer(
              this.decryptedSeed,
              chain.nodeUrl,
              toAddr,
              amt,
              false,
              this.activeAccountIndex
            );
            txId = signedData.txid;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${chain.symbol} para a blockchain Zcash…`, 'info');
            const broadcastTxId = await zcBroadcaster.broadcastZcashTransaction(chain.nodeUrl, signedData.hex);
            if (broadcastTxId) {
              window.B2Logger.log('success', `[Zcash Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

              this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
              await window.B2Toast.alert(
                "Transação Enviada",
                `Transação de ${amt} ${chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
                "success"
              );
              await this.updateNetworkBalances();
            } else {
              throw new Error("Transmissão recusada ou retorno sem TX ID.");
            }
          } catch (err) {
            window.showToast(`❌ Falha na transação Zcash: ${err.message}`, 'error');
            window.B2Logger.log('error', `[Zcash Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA UTXO (BTC, LTC, DOGE, BCH) ──
        else if (['BTC', 'LTC', 'DOGE', 'BCH'].includes(chain.key) && chain.nodeUrl && this.decryptedSeed) {
          window.showToast(`Preparando e assinando transação ${chain.key}…`, 'info');
          let txId = "";
          let signedData = null;
          try {
            let engine = null;
            if (chain.key === 'BTC') engine = window.B2BitcoinEngine || globalThis.B2BitcoinEngine;
            else if (chain.key === 'LTC') engine = window.B2LitecoinEngine || globalThis.B2LitecoinEngine;
            else if (chain.key === 'DOGE') engine = window.B2DogecoinEngine || globalThis.B2DogecoinEngine;
            else if (chain.key === 'BCH') engine = window.B2BitcoinCashEngine || globalThis.B2BitcoinCashEngine;

            if (!engine) throw new Error(`Engine ${chain.key} não encontrada.`);

            const fromAddr = this._sendContext.activeUtxoAddress || keys.address;
            signedData = await engine.signTransfer(this.decryptedSeed, toAddr, amt, fromAddr, this.activeAccountIndex);
            txId = signedData.txid;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${chain.symbol} para a rede...`, 'info');
            const result = await engine.broadcastTransaction(signedData.hex);
            const broadcastTxId = result.txid || txId;
            window.B2Logger.log('success', `[${chain.key} Broadcast] TX confirmada: ${broadcastTxId}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert("Transação Enviada", `Sucesso! TX: ${broadcastTxId.substring(0, 12)}…`, "success");
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação ${chain.key}: ${err.message}`, 'error');
            window.B2Logger.log('error', `[${chain.key} Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE NEO N3 ──
        else if (chain.key === "NEO" && chain.nodeUrl && this.decryptedSeed && (window.B2NeoEngine || globalThis.B2NeoEngine)) {
          const selectedToken = this._sendContext?.selectedToken;
          const finalSymbol = selectedToken ? selectedToken.symbol : "NEO";
          window.showToast(`Preparando e assinando transação NEO N3…`, "info");
          let txId = "";
          let built = null;
          try {
            const neoEngine = window.B2NeoEngine || globalThis.B2NeoEngine;
            const tokenContractHash = selectedToken ? (selectedToken.assetId || selectedToken.id || "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5") : "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5";

            built = await neoEngine.buildTransferTransaction(
              this.decryptedSeed,
              this.activeAccountIndex,
              toAddr,
              amt.toString(),
              tokenContractHash,
              chain.nodeUrl
            );
            txId = built.txhash;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${finalSymbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${finalSymbol} para a blockchain NEO N3…`, "info");
            const result = await neoEngine.sendTransaction(built.signedTxHex, chain.nodeUrl, [
              "https://mainnet2.neo.coz.io:443",
              "https://rpc.n3.nspcc.ru:10331"
            ]);
            const broadcastTxId = result.txhash || txId;
            window.B2Logger.log("success", `[NEO Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${finalSymbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação NEO: ${err.message}`, "error");
            window.B2Logger.log("error", `[NEO Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${finalSymbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE INTERNET COMPUTER ──
        else if (chain.key === "ICP" && this.decryptedSeed && (window.B2IcpEngine || globalThis.B2IcpEngine)) {
          window.showToast(`Preparando e assinando transação Internet Computer…`, "info");
          let txId = "";
          let signedTx = null;
          try {
            const icpEngine = window.B2IcpEngine || globalThis.B2IcpEngine;
            const keys = icpEngine.deriveKeyPair(this.decryptedSeed, this.activeAccountIndex);
            const pubKeyHex = Array.from(keys.publicKey).map(b => b.toString(16).padStart(2, '0')).join('');

            const txPayload = await icpEngine.ICPProvider.buildTransferTransaction(
              keys.address,
              toAddr,
              amt,
              feeData.feeCrypto,
              pubKeyHex
            );

            const signatures = icpEngine.ICPProvider.signTransaction(
              txPayload.unsigned_transaction,
              txPayload.payloads,
              keys.privateKey,
              pubKeyHex
            );

            signedTx = await icpEngine.ICPProvider.combineTransaction(
              txPayload.unsigned_transaction,
              signatures
            );

            txId = await icpEngine.ICPProvider.getTransactionHash(signedTx);

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${chain.symbol} para a rede Internet Computer…`, "info");
            const broadcastTxId = await icpEngine.ICPProvider.broadcastTransaction(signedTx);
            window.B2Logger.log("success", `[ICP Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação ICP: ${err.message}`, "error");
            window.B2Logger.log("error", `[ICP Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE FILECOIN ──
        else if (chain.key === "FILECOIN" && chain.nodeUrl && this.decryptedSeed && (window.B2FilecoinEngine || globalThis.B2FilecoinEngine)) {
          window.showToast(`Preparando e assinando transação Filecoin…`, "info");
          let txId = "";
          let built = null;
          try {
            const filEngine = window.B2FilecoinEngine || globalThis.B2FilecoinEngine;
            const amountAtto = BigInt(Math.floor(amt * 1e18));

            built = await filEngine.buildTransferTransaction(
              this.decryptedSeed,
              this.activeAccountIndex,
              toAddr,
              amountAtto,
              chain.nodeUrl
            );
            txId = built.cid;

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${chain.symbol} para a rede Filecoin…`, "info");
            const result = await filEngine.sendTransaction(built.signedMessage, chain.nodeUrl, [
              "https://rpc.ankr.com/filecoin"
            ]);
            const broadcastTxId = result.txhash || txId;
            window.B2Logger.log("success", `[Filecoin Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação Filecoin: ${err.message}`, "error");
            window.B2Logger.log("error", `[Filecoin Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE POLKADOT ──
        else if (chain.key === "POLKADOT" && this.decryptedSeed && (window.B2PolkadotEngine || globalThis.B2PolkadotEngine)) {
          const selectedToken = this._sendContext?.selectedToken;
          window.showToast(`Preparando e assinando transação Polkadot…`, "info");
          let txId = "";
          let signedData = null;
          try {
            const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;

            if (selectedToken && selectedToken.assetId) {
              signedData = await polkadotEngine.AssetHubProvider.signAssetTransfer(
                this.decryptedSeed,
                parseInt(selectedToken.assetId),
                toAddr,
                amt,
                this.activeAccountIndex
              );
              txId = signedData.hash;

              this.addTransaction(chain.key, {
                id: txId,
                txHash: txId,
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Pendente',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
              window.B2UIRenderer.renderBlockchainList(this.blockchainData);
              this.updateTotalBalanceDisplay();

              window.showToast(`Transmitindo ${amt} ${selectedToken.symbol} para a rede Polkadot…`, "info");
              const result = await polkadotEngine.AssetHubProvider.broadcastAssetTransfer(signedData.hex);
              const broadcastTxId = result.hash || txId;
              window.B2Logger.log("success", `[Polkadot Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

              this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            } else {
              const keys = this.derivedKeys[chain.key];
              const nonce = await polkadotEngine.PolkadotProvider.getNonce(keys.address);
              signedData = await polkadotEngine.PolkadotProvider.signTransaction(
                this.decryptedSeed,
                toAddr,
                amt,
                nonce,
                this.activeAccountIndex
              );
              txId = signedData.hash;

              this.addTransaction(chain.key, {
                id: txId,
                txHash: txId,
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Pendente',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
              window.B2UIRenderer.renderBlockchainList(this.blockchainData);
              this.updateTotalBalanceDisplay();

              window.showToast(`Transmitindo ${amt} ${chain.symbol} para a rede Polkadot…`, "info");
              const result = await polkadotEngine.PolkadotProvider.broadcastTransaction(signedData.hex);
              const broadcastTxId = result.hash || txId;
              window.B2Logger.log("success", `[Polkadot Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

              this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            }

            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} enviada com sucesso!\nTX: ${txId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação Polkadot: ${err.message}`, "error");
            window.B2Logger.log("error", `[Polkadot Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        }
        // ── BROADCAST REAL PARA REDE TRON ──
        else if (chain.key === "TRON" && chain.nodeUrl && this.decryptedSeed && (window.B2TronEngine || globalThis.B2TronEngine)) {
          const selectedToken = this._sendContext?.selectedToken;
          let txId = "";
          let signedData = null;
          try {
            const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
            const tokenAddress = selectedToken ? (selectedToken.contractAddress || selectedToken.assetId || selectedToken.id || null) : null;
            const fallbacks = ["https://tron-rpc.publicnode.com", "https://tron.api.subquery.network"];

            // Verify account activation first with interactive warning
            window.showToast("Verificando ativação da conta de destino…", "info");
            const recipientState = await tronEngine.isAccountActivated(toAddr, chain.nodeUrl, fallbacks);
            if (recipientState.status === 'UNACTIVATED') {
              const userApproved = await window.B2Toast.confirm(
                "Conta de Destino Não Ativada",
                "O endereço de destino ainda não possui transações registradas na rede TRON (não ativada). " +
                "Para ativá-lo, será cobrada uma taxa de ativação de conta (queima de até 1.1 TRX). Deseja continuar?",
                "warning"
              );
              if (!userApproved) {
                // Restore optimistic balance change and mark tx failed
                chain.balanceCrypto = originalNativeBalance;
                if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
                if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
                chain.balanceFiat = chain.balanceCrypto * (price || 0);

                this.addTransaction(chain.key, {
                  type: 'Enviado',
                  amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                  addr: toAddr,
                  sender: ownAddress,
                  recipient: toAddr,
                  from: ownAddress,
                  to: toAddr,
                  color: 'var(--text-danger)',
                  status: 'Falhou',
                  memo: memoVal || null
                });
                window.B2UIRenderer.closeModal('modal-send');
                window.B2UIRenderer.renderBlockchainList(this.blockchainData);
                this.updateTotalBalanceDisplay();
                return;
              }
            }

            window.showToast(`Preparando e assinando transação Tron…`, "info");
            signedData = await tronEngine.signTransfer(
              this.decryptedSeed,
              chain.nodeUrl,
              toAddr,
              amt,
              tokenAddress,
              memoVal || null,
              fallbacks,
              this.activeAccountIndex
            );
            txId = signedData.txID || JSON.stringify(signedData).substring(0, 32);

            this.addTransaction(chain.key, {
              id: txId,
              txHash: txId,
              type: 'Enviado',
              amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
              addr: toAddr,
              sender: ownAddress,
              recipient: toAddr,
              from: ownAddress,
              to: toAddr,
              color: 'var(--text-danger)',
              status: 'Pendente',
              memo: memoVal || null
            });
            window.B2UIRenderer.closeModal('modal-send');
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();

            window.showToast(`Transmitindo ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} para a blockchain Tron…`, "info");
            const result = await tronEngine.broadcastTransaction(signedData, chain.nodeUrl, fallbacks);
            const broadcastTxId = result.txId || txId;
            window.B2Logger.log("success", `[Tron Broadcast] TX confirmada: ${broadcastTxId} | Rede: ${chain.name} | Para: ${toAddr}`);

            this.updateTransactionStatus(chain.key, txId, 'Confirmado', { txHash: broadcastTxId });
            await window.B2Toast.alert(
              "Transação Enviada",
              `Transação de ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} enviada com sucesso!\nTX: ${broadcastTxId.substring(0, 12)}…`,
              "success"
            );
            await this.updateNetworkBalances();
          } catch (err) {
            window.showToast(`❌ Falha na transação Tron: ${err.message}`, "error");
            window.B2Logger.log("error", `[Tron Broadcast] Erro: ${err.message}`);

            chain.balanceCrypto = originalNativeBalance;
            if (selectedToken) selectedToken.balanceCrypto = originalTokenBalance;
            if (selectedFeeAsset) selectedFeeAsset.balanceCrypto = originalFeeAssetBalance;
            chain.balanceFiat = chain.balanceCrypto * (price || 0);

            if (txId) {
              this.updateTransactionStatus(chain.key, txId, 'Falhou');
            } else {
              this.addTransaction(chain.key, {
                type: 'Enviado',
                amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
                addr: toAddr,
                sender: ownAddress,
                recipient: toAddr,
                from: ownAddress,
                to: toAddr,
                color: 'var(--text-danger)',
                status: 'Falhou',
                memo: memoVal || null
              });
              window.B2UIRenderer.closeModal('modal-send');
            }
            window.B2UIRenderer.renderBlockchainList(this.blockchainData);
            this.updateTotalBalanceDisplay();
          }
        } else {
          const selectedToken = this._sendContext?.selectedToken;
          this.addTransaction(chain.key, {
            type: 'Enviado',
            amount: `-${amt.toFixed(6)} ${selectedToken ? selectedToken.symbol : chain.symbol}`,
            addr: toAddr,
            sender: ownAddress,
            recipient: toAddr,
            from: ownAddress,
            to: toAddr,
            color: 'var(--text-danger)',
            status: 'Confirmado',
            memo: memoVal || null
          });
          window.B2UIRenderer.closeModal('modal-send');
          window.B2UIRenderer.renderBlockchainList(this.blockchainData);
          this.updateTotalBalanceDisplay();

          await window.B2Toast.alert(
            "Transação Enviada",
            `Transação de ${amt} ${selectedToken ? selectedToken.symbol : chain.symbol} enviada com sucesso!${memoVal ? ' (Memo incluído)' : ''}`,
            "success"
          );
          await this.updateNetworkBalances();
        }
      });
    }

    // Modal Add Token
    const btnCloseAddToken = document.getElementById('btn-close-add-token');
    if (btnCloseAddToken) btnCloseAddToken.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-add-token'));

    // Modal Tx, NFT, Token Details, Stellar Claimables - fechar (compatibilidade com CSP)
    const btnCloseTxDetail = document.getElementById('btn-close-tx-detail');
    if (btnCloseTxDetail) btnCloseTxDetail.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-tx-detail'));

    const btnCloseNftDetail = document.getElementById('btn-close-nft-detail');
    if (btnCloseNftDetail) btnCloseNftDetail.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-nft-detail'));

    const btnCloseTokenDetail = document.getElementById('btn-close-token-detail');
    if (btnCloseTokenDetail) btnCloseTokenDetail.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-token-detail'));

    const btnCloseStellarClaimables = document.getElementById('btn-close-stellar-claimables');
    if (btnCloseStellarClaimables) btnCloseStellarClaimables.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-stellar-claimables'));

    const btnDashAddToken = document.getElementById('dashboard-btn-add-token');
    if (btnDashAddToken) {
      btnDashAddToken.addEventListener('click', () => {
        this.showAddTokenModal();
      });
    }

    const contractInputEl = document.getElementById('add-token-contract');
    if (contractInputEl) {
      const handleContractInput = async () => {
        const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
        if (!chain || (chain.engine !== 'EVM' && chain.engine !== 'Stellar')) return;

        const contract = contractInputEl.value.trim();
        if (chain.engine === 'EVM') {
          if (/^0x[0-9a-fA-F]{40}$/.test(contract)) {
            const nameInput = document.getElementById('add-token-name');
            const symbolInput = document.getElementById('add-token-symbol');
            const decimalsInput = document.getElementById('add-token-decimals');
            const submitBtn = document.getElementById('btn-add-token-submit');

            // Verificar primeiro no registro offline local para evitar requisições de rede lentas ou falhas
            let localMeta = null;
            if (window.B2TokenRegistry && typeof window.B2TokenRegistry.getMetadata === 'function') {
              localMeta = window.B2TokenRegistry.getMetadata(this.activeChainKey, contract);
            }

            // Busca fallback global no registro para reuso de metadados padrão se não encontrado na rede ativa
            if (!localMeta && window.B2TokenRegistry && Array.isArray(window.B2TokenRegistry)) {
              localMeta = window.B2TokenRegistry.find(entry =>
                entry.contract && entry.contract.toLowerCase().trim() === contract.toLowerCase().trim()
              );
            }

            if (localMeta) {
              if (nameInput) {
                nameInput.value = localMeta.name;
                nameInput.disabled = false;
              }
              if (symbolInput) {
                symbolInput.value = localMeta.symbol;
                symbolInput.disabled = false;
              }
              if (decimalsInput) {
                decimalsInput.value = localMeta.decimals.toString();
                decimalsInput.disabled = false;
              }
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
              }
              return;
            }

            if (nameInput) {
              nameInput.value = 'Buscando na blockchain...';
              nameInput.disabled = true;
            }
            if (symbolInput) {
              symbolInput.value = 'Carregando...';
              symbolInput.disabled = true;
            }
            if (decimalsInput) {
              decimalsInput.value = '...';
              decimalsInput.disabled = true;
            }
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.style.opacity = '0.5';
            }

            try {
              const meta = await this.fetchErc20TokenMetadata(contract, chain.nodeUrl);
              if (nameInput) nameInput.value = meta.name;
              if (symbolInput) symbolInput.value = meta.symbol;
              if (decimalsInput) decimalsInput.value = meta.decimals.toString();
            } catch (err) {
              if (nameInput) nameInput.value = '';
              if (symbolInput) symbolInput.value = '';
              if (decimalsInput) decimalsInput.value = '18';
              window.showToast('Não foi possível obter os dados do token. Insira um contrato válido ou preencha manualmente.', 'warning');
            } finally {
              if (nameInput) nameInput.disabled = false;
              if (symbolInput) symbolInput.disabled = false;
              if (decimalsInput) decimalsInput.disabled = false;
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
              }
            }
          }
        } else if (chain.engine === 'Stellar') {
          const parts = contract.split(':');
          if (parts.length === 2) {
            const assetCode = parts[0].trim();
            const assetIssuer = parts[1].trim();
            if (assetCode.length > 0 && assetCode.length <= 12 && window.B2StellarEngine && window.B2StellarEngine.validateAddress(assetIssuer)) {
              const nameInput = document.getElementById('add-token-name');
              const symbolInput = document.getElementById('add-token-symbol');
              const decimalsInput = document.getElementById('add-token-decimals');
              const submitBtn = document.getElementById('btn-add-token-submit');

              if (nameInput) {
                nameInput.value = 'Buscando na blockchain...';
                nameInput.disabled = true;
              }
              if (symbolInput) {
                symbolInput.value = 'Carregando...';
                symbolInput.disabled = true;
              }
              if (decimalsInput) {
                decimalsInput.value = '...';
                decimalsInput.disabled = true;
              }
              if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
              }

              try {
                const meta = await window.B2StellarEngine.AssetMetadataProvider.getMetadata(assetCode, assetIssuer, chain.nodeUrl);
                if (meta) {
                  if (nameInput) nameInput.value = meta.name || assetCode;
                  if (symbolInput) symbolInput.value = meta.code || assetCode;
                  if (decimalsInput) decimalsInput.value = (meta.decimals !== undefined ? meta.decimals : 7).toString();
                } else {
                  if (nameInput) nameInput.value = assetCode;
                  if (symbolInput) symbolInput.value = assetCode;
                  if (decimalsInput) decimalsInput.value = '7';
                }
              } catch (err) {
                if (nameInput) nameInput.value = assetCode;
                if (symbolInput) symbolInput.value = assetCode;
                if (decimalsInput) decimalsInput.value = '7';
              } finally {
                if (nameInput) nameInput.disabled = false;
                if (symbolInput) symbolInput.disabled = false;
                if (decimalsInput) decimalsInput.disabled = false;
                if (submitBtn) {
                  submitBtn.disabled = false;
                  submitBtn.style.opacity = '1';
                }
              }
            }
          }
        }
      };

      contractInputEl.addEventListener('input', handleContractInput);
      contractInputEl.addEventListener('paste', () => {
        setTimeout(handleContractInput, 50);
      });
    }

    const btnAddTokenSubmit = document.getElementById('btn-add-token-submit');
    if (btnAddTokenSubmit) {
      btnAddTokenSubmit.addEventListener('click', () => {
        const contract = (document.getElementById('add-token-contract')?.value || '').trim();
        const symbol = (document.getElementById('add-token-symbol')?.value || '').trim().toUpperCase();
        const decimals = parseInt(document.getElementById('add-token-decimals')?.value || '18');

        const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
        if (!chain) return;

        const engine = chain.engine || 'Custom';
        let isValid = true;

        if (engine === 'EVM') {
          isValid = /^0x[0-9a-fA-F]{40}$/.test(contract);
          if (!isValid) {
            window.showToast('Contrato EVM inválido. Deve ser hexadecimal com prefixo 0x e 40 caracteres.', 'warning');
            return;
          }
        } else if (engine === 'Waves') {
          isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contract);
          if (!isValid) {
            window.showToast('ID do ativo Waves inválido. Deve ser uma string Base58 de 32 a 44 caracteres.', 'warning');
            return;
          }
        } else if (engine === 'Solana') {
          isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contract);
          if (!isValid) {
            window.showToast('Endereço Mint Solana inválido. Deve ser uma string Base58 de 32 a 44 caracteres.', 'warning');
            return;
          }
        } else if (engine === 'Tron') {
          isValid = /^T[1-9A-HJ-NP-Za-km-z]{31,43}$/.test(contract);
          if (!isValid) {
            window.showToast('Contrato TRC-20 inválido. Deve começar com T e ser uma string Base58.', 'warning');
            return;
          }
        } else if (engine === 'Stellar') {
          const parts = contract.split(':');
          isValid = parts.length === 2 && parts[0].trim().length > 0 && parts[0].trim().length <= 12 && window.B2StellarEngine && window.B2StellarEngine.validateAddress(parts[1].trim());
          if (!isValid) {
            window.showToast('Identificador Stellar inválido. Use o formato CODE:EMISSOR (ex: USDC:GBBD4S237...).', 'warning');
            return;
          }
        } else {
          isValid = contract.length >= 10;
          if (!isValid) {
            window.showToast('Identificador de token inválido (mínimo 10 caracteres).', 'warning');
            return;
          }
        }

        if (!chain.discoveredTokens) chain.discoveredTokens = [];

        const name = (document.getElementById('add-token-name')?.value || '').trim() || symbol || 'Custom Token';

        const newToken = {
          assetId: contract,
          name: name,
          symbol: symbol || 'TKN',
          decimals,
          balanceCrypto: 0.0,
          balanceFiat: 0.0
        };

        // Salva no localStorage de forma resiliente
        const storageKey = this.getCustomTokensStorageKey(this.activeChainKey);
        const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const existsInStorage = stored.some(t => t.assetId.toLowerCase() === contract.toLowerCase());

        if (window.B2TokenRegistry && typeof window.B2TokenRegistry.enrichToken === 'function') {
          window.B2TokenRegistry.enrichToken(this.activeChainKey, newToken);
        }

        if (!existsInStorage) {
          stored.push(newToken);
          localStorage.setItem(storageKey, JSON.stringify(stored));
        }

        // Garante que o token importado esteja síncrono em memória e renderizado imediatamente
        const existsInMemory = chain.discoveredTokens.some(t => t.assetId.toLowerCase() === contract.toLowerCase());
        if (!existsInMemory) {
          chain.discoveredTokens.push(newToken);
        } else {
          // Se já existe em memória, atualiza os metadados (como nome, símbolo ou decimais)
          const existingToken = chain.discoveredTokens.find(t => t.assetId.toLowerCase() === contract.toLowerCase());
          if (existingToken) {
            existingToken.name = newToken.name;
            existingToken.symbol = newToken.symbol;
            existingToken.decimals = newToken.decimals;
            if (newToken.imageURL) existingToken.imageURL = newToken.imageURL;
          }
        }

        window.B2UIRenderer.closeModal('modal-add-token');
        window.B2UIRenderer.renderActiveBlockchainDashboard(this.blockchainData, this.activeChainKey);
        window.B2UIRenderer.renderBlockchainList(this.blockchainData);
        window.showToast(`Token ${newToken.symbol} adicionado!`, 'success');

        // Puxa o saldo do token adicionado imediatamente em background e atualiza a interface
        this.updateNetworkBalances(this.activeChainKey).then(() => {
          window.B2UIRenderer.renderActiveBlockchainDashboard(this.blockchainData, this.activeChainKey);
          window.B2UIRenderer.renderBlockchainList(this.blockchainData);
        }).catch(err => {
          console.error("Failed to update balances after adding token:", err);
        });
      });
    }

    // Modal Add NFT
    const btnCloseAddNFT = document.getElementById('btn-close-add-nft');
    if (btnCloseAddNFT) {
      btnCloseAddNFT.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-add-nft'));
    }

    const btnOpenAddNFT = document.getElementById('btn-open-add-nft');
    if (btnOpenAddNFT) {
      btnOpenAddNFT.addEventListener('click', () => {
        this.showAddNFTModal();
      });
    }

    const btnAddNFTSubmit = document.getElementById('btn-add-nft-submit');
    if (btnAddNFTSubmit) {
      btnAddNFTSubmit.addEventListener('click', () => {
        const contract = (document.getElementById('add-nft-contract')?.value || '').trim();
        const tokenId = (document.getElementById('add-nft-token-id')?.value || '').trim();
        const name = (document.getElementById('add-nft-name')?.value || '').trim();
        const collection = (document.getElementById('add-nft-collection')?.value || '').trim();

        if (!contract) {
          window.showToast('Insira o endereço do contrato ou ID do ativo.', 'warning');
          return;
        }
        if (!name) {
          window.showToast('Insira o nome do NFT.', 'warning');
          return;
        }

        const chain = this.blockchainData.find(c => c.key === this.activeChainKey);
        if (!chain) return;

        const engine = chain.engine || 'Custom';
        let isValid = true;
        if (engine === 'EVM') {
          isValid = /^0x[0-9a-fA-F]{40}$/.test(contract);
          if (!isValid) {
            window.showToast('Contrato EVM inválido. Deve ser hexadecimal com prefixo 0x e 40 caracteres.', 'warning');
            return;
          }
        } else if (engine === 'Solana') {
          isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contract);
          if (!isValid) {
            window.showToast('Endereço Mint Solana inválido. Deve ser uma string Base58 de 32 a 44 caracteres.', 'warning');
            return;
          }
        }

        const storageKey = `b2_custom_nfts_${this.activeChainKey}`;
        const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const exists = stored.some(nft =>
          nft.contract.toLowerCase() === contract.toLowerCase() &&
          (tokenId ? nft.tokenId === tokenId : !nft.tokenId)
        );

        if (exists) {
          window.showToast('Este NFT já foi adicionado!', 'warning');
          return;
        }

        const newNft = {
          id: Math.random().toString(36).substring(2, 9),
          contract: contract,
          tokenId: tokenId,
          name: name,
          collection: collection || 'Coleção Customizada',
          color: 'linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)',
          addedManually: true
        };

        stored.push(newNft);
        localStorage.setItem(storageKey, JSON.stringify(stored));

        window.B2UIRenderer.closeModal('modal-add-nft');
        window.B2UIRenderer.renderNFTsGaller(this.activeChainKey);
        window.showToast(`NFT "${newNft.name}" adicionado!`, 'success');
      });
    }

    // Account chip — abre gerenciador de contas
    const accountChip = document.getElementById('account-chip-trigger');
    if (accountChip) {
      accountChip.addEventListener('click', () => {
        this._renderAccountManager();
        window.B2UIRenderer.openModal('modal-account-manager');
      });
    }

    const btnCloseAccountManager = document.getElementById('btn-close-account-manager');
    if (btnCloseAccountManager) btnCloseAccountManager.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-account-manager'));

    // Btn Nova Conta — deriva nova conta do mesmo seed
    const btnNewAccount = document.getElementById('btn-new-account');
    if (btnNewAccount) {
      btnNewAccount.addEventListener('click', async () => {
        const labelInput = await window.B2Toast.prompt("Nova Conta", "Digite o nome para a nova conta (opcional):", "text", "Ex: Minha Conta 2");
        const label = labelInput !== null ? labelInput.trim() || undefined : null;
        if (label === null) return; // cancelado pelo usuário
        const newAcc = this.createNewAccount(label);
        if (newAcc) {
          this._renderAccountManager();
        }
      });
    }

    // Btn Importar Conta — abre modal de importação com seleção de modo
    const btnImportAccount = document.getElementById('btn-import-account');
    if (btnImportAccount) {
      btnImportAccount.addEventListener('click', () => {
        // Reseta o modal antes de abrir
        const labelInput = document.getElementById('import-account-label');
        const b2SeedInput = document.getElementById('import-b2-seed');
        const extKeyInput = document.getElementById('import-external-key');
        const extChainSel = document.getElementById('import-external-chain');
        if (labelInput) labelInput.value = '';
        if (b2SeedInput) b2SeedInput.value = '';
        if (extKeyInput) extKeyInput.value = '';
        if (extChainSel) extChainSel.value = 'EVM';

        // Garante que o painel B2 seed esteja ativo ao abrir
        const panelB2 = document.getElementById('import-panel-b2seed');
        const panelExt = document.getElementById('import-panel-external');
        const cardB2 = document.getElementById('import-mode-b2');
        const cardExt = document.getElementById('import-mode-external');
        if (panelB2) panelB2.style.display = 'flex';
        if (panelExt) panelExt.style.display = 'none';
        if (cardB2) {
          cardB2.style.border = '2px solid var(--color-primary)';
          cardB2.style.background = 'var(--color-primary-dim)';
        }
        if (cardExt) {
          cardExt.style.border = '2px solid var(--border-light)';
          cardExt.style.background = 'var(--bg-card)';
        }

        window.B2UIRenderer.closeModal('modal-account-manager');
        window.B2UIRenderer.openModal('modal-import-account');
      });
    }

    // Botão fechar do modal de importação
    const btnCloseImport = document.getElementById('btn-close-import-account');
    if (btnCloseImport) {
      btnCloseImport.addEventListener('click', () => {
        window.B2UIRenderer.closeModal('modal-import-account');
        window.B2UIRenderer.openModal('modal-account-manager');
      });
    }

    // Alternância dos cards de modo de importação
    ['import-mode-b2', 'import-mode-external'].forEach(cardId => {
      const card = document.getElementById(cardId);
      if (!card) return;
      card.addEventListener('click', () => {
        const mode = card.getAttribute('data-mode');
        const panelB2 = document.getElementById('import-panel-b2seed');
        const panelExt = document.getElementById('import-panel-external');
        const cardB2 = document.getElementById('import-mode-b2');
        const cardExt = document.getElementById('import-mode-external');

        if (mode === 'b2seed') {
          if (panelB2) panelB2.style.display = 'flex';
          if (panelExt) panelExt.style.display = 'none';
          if (cardB2) { cardB2.style.border = '2px solid var(--color-primary)'; cardB2.style.background = 'var(--color-primary-dim)'; }
          if (cardExt) { cardExt.style.border = '2px solid var(--border-light)'; cardExt.style.background = 'var(--bg-card)'; }
        } else {
          if (panelB2) panelB2.style.display = 'none';
          if (panelExt) panelExt.style.display = 'flex';
          if (cardB2) { cardB2.style.border = '2px solid var(--border-light)'; cardB2.style.background = 'var(--bg-card)'; }
          if (cardExt) { cardExt.style.border = '2px solid var(--color-primary)'; cardExt.style.background = 'var(--color-primary-dim)'; }
        }
      });
    });

    // Atualiza hint do campo de chave quando a chain muda
    const extChainSelect = document.getElementById('import-external-chain');
    if (extChainSelect) {
      extChainSelect.addEventListener('change', () => {
        const hint = document.getElementById('import-external-key-hint');
        const label = document.getElementById('import-external-key-label');
        const ph = document.getElementById('import-external-key');
        const chainHints = {
          EVM: { label: 'Chave Privada ou Seed Phrase', ph: '0x... ou palavra1 palavra2...', hint: 'Chave privada hex (0x + 64 chars) ou semente BIP-39 compatível com redes EVM padrão.' },
          Solana: { label: 'Chave Privada (base58) ou Seed', ph: 'Seed phrase ou chave base58...', hint: 'Frase semente (12/24 palavras) ou chave privada em base58 compatível com redes Solana padrão.' },
          Bitcoin: { label: 'Chave WIF ou Seed Phrase', ph: 'WIF K... ou L... ou seed BIP-39', hint: 'Chave WIF (começa com K, L ou 5) ou semente BIP-39 usada por carteiras Bitcoin padrão.' },
          Waves: { label: 'Seed Phrase Waves', ph: 'palavra1 palavra2 ... palavra15', hint: 'Seed phrase padrão Waves (15 palavras) usada pelo Waves.Exchange.' },
          Tron: { label: 'Chave Privada TRX ou Seed', ph: '0x... ou seed phrase...', hint: 'Chave privada hex ou seed BIP-39 compatível com TronLink.' },
          Other: { label: 'Chave Privada ou Seed Phrase', ph: 'Cole aqui a chave ou seed...', hint: 'Aceita chave privada ou seed phrase BIP-39 de qualquer carteira.' }
        };
        const val = extChainSelect.value;
        const info = chainHints[val] || chainHints['Other'];
        if (label) label.textContent = info.label;
        if (ph) ph.placeholder = info.ph;
        if (hint) hint.textContent = info.hint;
      });
    }

    // Botão confirmar importação
    const btnConfirmImport = document.getElementById('btn-confirm-import-account');
    if (btnConfirmImport) {
      btnConfirmImport.addEventListener('click', () => {
        const panelB2 = document.getElementById('import-panel-b2seed');
        const isB2Mode = panelB2 && panelB2.style.display !== 'none';
        const label = (document.getElementById('import-account-label')?.value || '').trim() || undefined;

        if (isB2Mode) {
          // Modo B2 Seed
          const seedVal = (document.getElementById('import-b2-seed')?.value || '').trim();
          if (!seedVal) { window.showToast('Cole a seed phrase da B2 Wallet.', 'warning'); return; }
          const wordCount = seedVal.split(/\s+/).filter(Boolean).length;
          if (wordCount !== 12 && wordCount !== 24) {
            window.showToast(`Seed inválida: ${wordCount} palavras. Esperado 12 ou 24.`, 'error');
            return;
          }
          const imported = this.importAccount(label, seedVal);
          if (imported) {
            window.B2UIRenderer.closeModal('modal-import-account');
            window.B2UIRenderer.openModal('modal-account-manager');
            this._renderAccountManager();
            window.showToast(`✅ Conta "${imported.label}" importada via seed B2 Wallet!`, 'success');
          }
        } else {
          // Modo externo
          const extKey = (document.getElementById('import-external-key')?.value || '').trim();
          const extChain = document.getElementById('import-external-chain')?.value || 'EVM';
          if (!extKey) { window.showToast('Cole a chave privada ou seed phrase.', 'warning'); return; }
          if (extKey.length < 16) { window.showToast('Chave muito curta. Verifique e tente novamente.', 'error'); return; }

          // Cria conta do tipo 'external-key' com metadado da chain de origem
          const newIdx = this.accounts.length;
          const account = {
            index: newIdx,
            label: label || `Importada (${extChain}) ${newIdx + 1}`,
            createdAt: Date.now(),
            type: 'external-key',
            sourceChain: extChain,
            keyHash: btoa(extKey.substring(0, 16)).substring(0, 8)
          };
          this.accounts.push(account);
          localStorage.setItem('b2_accounts', JSON.stringify(this.accounts));
          this._refreshAccountChipLabel();
          window.B2UIRenderer.closeModal('modal-import-account');
          window.B2UIRenderer.openModal('modal-account-manager');
          this._renderAccountManager();
          window.showToast(`✅ Conta "${account.label}" importada (${extChain}). Suporte completo em breve.`, 'success');
        }
      });
    }

    // Modal Add Network
    const btnOpenAddNetwork = document.getElementById('btn-open-add-network');
    if (btnOpenAddNetwork) btnOpenAddNetwork.addEventListener('click', () => window.B2UIRenderer.openModal('modal-add-network'));

    const btnCloseAddNetwork = document.getElementById('btn-close-add-network');
    if (btnCloseAddNetwork) btnCloseAddNetwork.addEventListener('click', () => window.B2UIRenderer.closeModal('modal-add-network'));

    // Engine options selection (Standard Grid Layout)
    const engineOptions = document.querySelectorAll('#add-net-engine-grid .engine-option');
    if (engineOptions) {
      engineOptions.forEach(opt => {
        opt.addEventListener('click', () => {
          engineOptions.forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');

          const coinType = opt.getAttribute('data-coin-type');
          const decimals = opt.getAttribute('data-decimals');

          const coinTypeInput = document.getElementById('add-net-coin-type');
          const decimalsInput = document.getElementById('add-net-decimals');

          if (coinTypeInput && coinType) coinTypeInput.value = coinType;
          if (decimalsInput && decimals) decimalsInput.value = decimals;
        });
      });
    }

    const btnSubmitAddNetwork = document.getElementById('btn-submit-add-network');
    if (btnSubmitAddNetwork) {
      btnSubmitAddNetwork.addEventListener('click', () => {
        const name = document.getElementById('add-net-name').value;
        const symbol = document.getElementById('add-net-symbol').value;
        const coinType = parseInt(document.getElementById('add-net-coin-type').value);
        const rpc = document.getElementById('add-net-rpc').value;

        if (!name || !symbol || isNaN(coinType) || !rpc) {
          window.showToast('Preencha todos os campos.', 'warning');
          return;
        }

        // Get selected engine from grid
        const selectedOpt = document.querySelector('#add-net-engine-grid .engine-option.selected');
        const engine = selectedOpt ? selectedOpt.getAttribute('data-engine') : 'Custom';
        const decimals = parseInt(document.getElementById('add-net-decimals').value) || 18;

        let supportsTokens = false;
        let supportsNFTs = false;
        let supportsStaking = false;
        let supportsSmartContracts = false;
        let color = '#64748b';

        if (engine === 'EVM') {
          supportsTokens = true;
          supportsNFTs = true;
          supportsSmartContracts = true;
          color = '#6366f1';
        } else if (engine === 'Waves') {
          supportsTokens = true;
          supportsNFTs = true;
          supportsStaking = true;
          color = '#0055ff';
        } else if (engine === 'Bitcoin') {
          color = '#f59e0b';
        } else if (engine === 'Solana') {
          supportsTokens = true;
          supportsNFTs = true;
          supportsStaking = true;
          color = '#14f195';
        } else if (engine === 'Tron') {
          supportsTokens = true;
          supportsSmartContracts = true;
          color = '#ec092c';
        }

        const newChain = {
          key: symbol.toUpperCase(),
          name,
          symbol: symbol.toUpperCase(),
          coinType,
          decimals,
          engine,
          nodeUrl: rpc,
          color,
          balanceCrypto: 0,
          balanceFiat: 0,
          supportsTokens,
          supportsNFTs,
          supportsStaking,
          supportsSmartContracts,
          autoDiscoverTokens: false,
          discoveredTokens: [],
          discoveredNFTs: []
        };

        this.blockchainData.push(newChain);
        if (this.decryptedSeed) {
          this.deriveAllAddresses();
          window.B2UIRenderer.renderBlockchainList(this.blockchainData);
        }

        ['add-net-name', 'add-net-symbol', 'add-net-coin-type', 'add-net-rpc', 'add-net-decimals', 'add-net-chain-id', 'add-net-explorer']
          .forEach(id => { const el = document.getElementById(id); if (el) el.value = el.defaultValue || ''; });

        // Reset grid selection to EVM
        if (engineOptions && engineOptions.length > 0) {
          engineOptions.forEach(o => o.classList.remove('selected'));
          engineOptions[0].classList.add('selected');
        }

        window.B2UIRenderer.closeModal('modal-add-network');
        window.showToast('Blockchain adicionada!', 'success');
      });
    }

    // Modal backdrop — fechar clicando fora
    document.querySelectorAll('.b2-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          window.B2UIRenderer.closeModal(modal.id);
        }
      });
    });
};
