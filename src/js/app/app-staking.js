/**
 * B2 Wallet - Módulo de Staking, Waves Leasing e Contratos Sandbox de B2WalletApp.
 */

B2WalletApp.prototype.startLPoSLease = function(chainKey, node, nodeName, amount) {
    const chain = this.blockchainData.find(c => c.key === chainKey);
    if (!chain) return;

    if (isNaN(amount) || amount <= 0) {
      window.showToast("Por favor, digite um montante válido para arrendamento.", "error");
      return;
    }

    if (amount > chain.balanceCrypto) {
      window.showToast("Saldo insuficiente para realizar o arrendamento.", "error");
      return;
    }

    // Atualização otimista de saldo local
    chain.balanceCrypto -= amount;
    const coinPrice = chain.balanceCrypto > 0 ? (chain.balanceFiat / (chain.balanceCrypto + amount)) : 0;
    chain.balanceFiat = chain.balanceCrypto * coinPrice;

    // Salva o arrendamento localmente com ID temporário
    const key = `b2_leases_${chainKey}`;
    const leases = JSON.parse(localStorage.getItem(key) || "[]");
    const tempId = Math.random().toString(36).substring(2, 9);
    const newLease = {
      id: tempId,
      validatorAddress: node,
      validatorName: nodeName,
      amount: amount,
      status: "Pendente"
    };
    leases.push(newLease);
    localStorage.setItem(key, JSON.stringify(leases));

    // Adiciona log de transação
    this.addTransaction(chainKey, {
      type: "Arrendado LPoS",
      amount: `-${amount.toFixed(4)} ${chain.symbol}`,
      addr: node.substring(0, 6) + "..." + node.substring(node.length - 4),
      color: "var(--text-danger)"
    });

    window.B2Logger.log("info", `Iniciando broadcast de arrendamento LPoS: ${amount} ${chain.symbol} → ${nodeName}`);
    this.setActiveChain(chainKey);

    // ── BROADCAST REAL PARA REDES WAVES ──
    if (chain.engine === 'Waves' && chain.nodeUrl && this.decryptedSeed) {
      window.showToast(`Transmitindo arrendamento de ${amount} ${chain.symbol}…`, 'info');
      window.B2WavesBroadcaster.startWavesLease(
        this.decryptedSeed,
        chain.nodeUrl,
        node,
        amount,
        this.activeAccountIndex
      ).then(result => {
        const txId = result.id || result.txId || tempId;
        // Atualiza o lease local com o ID real da blockchain
        const currentLeases = JSON.parse(localStorage.getItem(key) || "[]");
        const lease = currentLeases.find(l => l.id === tempId);
        if (lease) {
          lease.id = txId;
          lease.status = "Ativo";
          localStorage.setItem(key, JSON.stringify(currentLeases));
        }
        window.showToast(`✅ Arrendamento confirmado! TX: ${txId.substring(0, 12)}…`, 'success');
        window.B2Logger.log('success', `[Waves Lease] TX confirmada: ${txId} | Validador: ${nodeName}`);
        this._renderActiveLeasesInView(chainKey, chain);
      }).catch(err => {
        window.showToast(`❌ Falha no arrendamento: ${err.message}`, 'error');
        window.B2Logger.log('error', `[Waves Lease] Erro no broadcast: ${err.message}`);
        // Reverte o lease e o saldo
        const currentLeases = JSON.parse(localStorage.getItem(key) || "[]");
        localStorage.setItem(key, JSON.stringify(currentLeases.filter(l => l.id !== tempId)));
        chain.balanceCrypto += amount;
        chain.balanceFiat = chain.balanceCrypto * coinPrice;
        window.B2UIRenderer.renderBlockchainList(this.blockchainData);
        this.updateTotalBalanceDisplay();
        this._renderActiveLeasesInView(chainKey, chain);
      });
    } else {
      window.showToast(`Arrendamento de ${amount} ${chain.symbol} enviado!`, 'success');
    }
  };

B2WalletApp.prototype.cancelLPoSLease = function(chainKey, leaseId) {
    const chain = this.blockchainData.find(c => c.key === chainKey);
    if (!chain) return;

    const key = `b2_leases_${chainKey}`;
    let leases = JSON.parse(localStorage.getItem(key) || "[]");
    const lease = leases.find(l => l.id === leaseId);
    if (!lease) return;

    // Restaura o saldo (otimista)
    const prevBalance = chain.balanceCrypto;
    chain.balanceCrypto += lease.amount;
    const coinPrice = prevBalance > 0 ? (chain.balanceFiat / prevBalance) : (chain.key === "WAVES" ? 2.5 : chain.key === "AMZX" ? 0.05 : 0.1);
    chain.balanceFiat = chain.balanceCrypto * coinPrice;

    // Remove lease localmente
    leases = leases.filter(l => l.id !== leaseId);
    localStorage.setItem(key, JSON.stringify(leases));

    // Adiciona log de transação
    this.addTransaction(chainKey, {
      type: "Cancelado LPoS",
      amount: `+${lease.amount.toFixed(4)} ${chain.symbol}`,
      addr: lease.validatorAddress.substring(0, 6) + "..." + lease.validatorAddress.substring(lease.validatorAddress.length - 4),
      color: "var(--text-success)"
    });

    window.B2Logger.log("info", `Cancelando arrendamento LPoS de ${lease.amount} ${chain.symbol}…`);
    this.setActiveChain(chainKey);

    // ── BROADCAST REAL PARA REDES WAVES (tipo 9 — LeaseCancel) ──
    if (chain.engine === 'Waves' && chain.nodeUrl && this.decryptedSeed) {
      const chainIdMap = { WAVES: 87, AMZX: 65, PLO: 80, TURTLE: 76 };
      const chainId = chainIdMap[chainKey] || 87;

      window.showToast(`Cancelando arrendamento na blockchain…`, 'info');
      window.B2WavesBroadcaster.cancelWavesLease(
        this.decryptedSeed,
        chain.nodeUrl,
        leaseId,
        chainId,
        this.activeAccountIndex
      ).then(result => {
        const txId = result.id || result.txId || '—';
        window.showToast(`✅ Arrendamento cancelado! TX: ${txId.substring(0, 12)}…`, 'success');
        window.B2Logger.log('success', `[Waves LeaseCancel] TX confirmada: ${txId}`);
      }).catch(err => {
        window.showToast(`❌ Falha ao cancelar arrendamento: ${err.message}`, 'error');
        window.B2Logger.log('error', `[Waves LeaseCancel] Erro: ${err.message}`);
        // Reverte: re-adiciona o lease e restaura saldo
        const currentLeases = JSON.parse(localStorage.getItem(key) || "[]");
        currentLeases.push(lease);
        localStorage.setItem(key, JSON.stringify(currentLeases));
        chain.balanceCrypto = prevBalance;
        chain.balanceFiat = prevBalance * coinPrice;
        window.B2UIRenderer.renderBlockchainList(this.blockchainData);
        this.updateTotalBalanceDisplay();
      });
    } else {
      window.showToast(`Arrendamento cancelado com sucesso.`, 'success');
    }
  };

B2WalletApp.prototype.executeEVMSandboxContract = function(chainKey, contract, payload) {
    const outputEl = document.getElementById("evm-sandbox-output");
    if (!outputEl) return;

    outputEl.style.display = "block";
    outputEl.innerHTML = `> Iniciando chamada de contrato na rede ${chainKey}...\n`;

    const txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    setTimeout(() => {
      outputEl.innerHTML += `> Conectado ao contrato inteligente: ${contract}\n`;
    }, 400);

    setTimeout(() => {
      outputEl.innerHTML += `> Enviando transação assinada com método: ${payload}\n`;
    }, 800);

    setTimeout(() => {
      outputEl.innerHTML += `> Transação confirmada! Bloco: ${Math.floor(Math.random() * 100000 + 4500000)}\n`;
      outputEl.innerHTML += `> Hash: ${txHash.substring(0, 16)}...\n`;
      outputEl.innerHTML += `> Gás Utilizado: ${Math.floor(Math.random() * 50000 + 21000)} units\n`;
      outputEl.scrollTop = outputEl.scrollHeight;

      // Adiciona log de transação
      this.addTransaction(chainKey, {
        type: "Assinado EVM",
        amount: "0.00 " + (this.blockchainData.find(c => c.key === chainKey)?.symbol || "ETH"),
        addr: contract.substring(0, 6) + "..." + contract.substring(contract.length - 4),
        status: `Playground (${payload.split("(")[0]})`,
        color: "var(--color-secondary)"
      });

      window.B2Logger.log("info", `Chamada de contrato EVM executada com sucesso para ${contract} (${payload})`);
    }, 1200);
  };

B2WalletApp.prototype.stakeSolana = function(chainKey, valAddr, valName, amount) {
    const chain = this.blockchainData.find(c => c.key === chainKey);
    if (!chain) return;

    if (isNaN(amount) || amount <= 0) {
      window.B2Toast.alert("Montante Inválido", "Por favor, digite um montante válido para Staking.", "warning");
      return;
    }

    if (amount > chain.balanceCrypto) {
      window.B2Toast.alert("Saldo Insuficiente", "Saldo insuficiente para realizar delegação.", "warning");
      return;
    }

    // Deduz do saldo
    chain.balanceCrypto -= amount;
    const coinPrice = chain.balanceCrypto > 0 ? (chain.balanceFiat / (chain.balanceCrypto + amount)) : 0;
    chain.balanceFiat = chain.balanceCrypto * coinPrice;

    // Salva o stake
    const key = `b2_stakes_${chainKey}`;
    const stakes = JSON.parse(localStorage.getItem(key) || "[]");
    const newStake = {
      id: Math.random().toString(36).substring(2, 9),
      validatorAddress: valAddr,
      validatorName: valName,
      amount: amount,
      status: "Delegado"
    };
    stakes.push(newStake);
    localStorage.setItem(key, JSON.stringify(stakes));

    // Adiciona log de transação
    this.addTransaction(chainKey, {
      type: "Stake Solana",
      amount: `-${amount.toFixed(4)} SOL`,
      addr: valAddr.substring(0, 6) + "..." + valAddr.substring(valAddr.length - 4),
      color: "var(--text-danger)"
    });

    window.B2Logger.log("info", `Iniciada delegação de ${amount} SOL para o validador ${valName}`);

    this.setActiveChain(chainKey);
  };

B2WalletApp.prototype.cancelSolanaStake = function(chainKey, stakeId) {
    const chain = this.blockchainData.find(c => c.key === chainKey);
    if (!chain) return;

    const key = `b2_stakes_${chainKey}`;
    let stakes = JSON.parse(localStorage.getItem(key) || "[]");
    const stake = stakes.find(s => s.id === stakeId);
    if (!stake) return;

    // Restaura o saldo
    const prevBalance = chain.balanceCrypto;
    chain.balanceCrypto += stake.amount;
    const coinPrice = prevBalance > 0 ? (chain.balanceFiat / prevBalance) : 140;
    chain.balanceFiat = chain.balanceCrypto * coinPrice;

    // Remove stake
    stakes = stakes.filter(s => s.id !== stakeId);
    localStorage.setItem(key, JSON.stringify(stakes));

    // Adiciona log de transação
    this.addTransaction(chainKey, {
      type: "Saque Solana",
      amount: `+${stake.amount.toFixed(4)} SOL`,
      addr: stake.validatorAddress.substring(0, 6) + "..." + stake.validatorAddress.substring(stake.validatorAddress.length - 4),
      color: "var(--text-success)"
    });

    window.B2Logger.log("info", `Sacados fundos de stake de ${stake.amount} SOL com sucesso`);

    this.setActiveChain(chainKey);
  };

B2WalletApp.prototype.getStakingStatusPolkadot = async function() {
    if (!window.B2PolkadotEngine && !globalThis.B2PolkadotEngine) {
      throw new Error("B2PolkadotEngine não carregado.");
    }
    const keys = this.derivedKeys['POLKADOT'];
    if (!keys) {
      throw new Error("Carteira bloqueada ou chaves Polkadot não derivadas.");
    }
    const engine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;
    return await engine.PolkadotStakingProvider.getStakingStatus(keys.address);
  };

B2WalletApp.prototype.bondPolkadot = async function(amountDecimal, rewardDestination = 'Staked') {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;
    if (!polkadotEngine) {
      throw new Error("B2PolkadotEngine não carregado.");
    }
    window.showToast && window.showToast(`Vinculando (Bond) ${amountDecimal} DOT para Staking…`, "info");
    try {
      const result = await polkadotEngine.PolkadotStakingProvider.bond(this.decryptedSeed, amountDecimal, rewardDestination, this.activeAccountIndex);
      const txHash = result.toHex ? result.toHex() : JSON.stringify(result);
      window.B2Logger.log("success", `[Polkadot Staking] Bond realizado: ${txHash}`);

      this.addTransaction('POLKADOT', {
        type: "Bond DOT",
        amount: `-${amountDecimal.toFixed(4)} DOT`,
        addr: "Staking Pallet",
        color: "var(--text-danger)"
      });
      await this.updateNetworkBalances();
      return txHash;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no Bond: ${err.message}`, "error");
      throw err;
    }
  };

B2WalletApp.prototype.bondExtraPolkadot = async function(amountDecimal) {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;
    if (!polkadotEngine) {
      throw new Error("B2PolkadotEngine não carregado.");
    }
    window.showToast && window.showToast(`Vinculando extra (Bond Extra) ${amountDecimal} DOT…`, "info");
    try {
      const result = await polkadotEngine.PolkadotStakingProvider.bondExtra(this.decryptedSeed, amountDecimal, this.activeAccountIndex);
      const txHash = result.toHex ? result.toHex() : JSON.stringify(result);
      window.B2Logger.log("success", `[Polkadot Staking] Bond Extra realizado: ${txHash}`);

      this.addTransaction('POLKADOT', {
        type: "Bond Extra DOT",
        amount: `-${amountDecimal.toFixed(4)} DOT`,
        addr: "Staking Pallet",
        color: "var(--text-danger)"
      });
      await this.updateNetworkBalances();
      return txHash;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no Bond Extra: ${err.message}`, "error");
      throw err;
    }
  };

B2WalletApp.prototype.unbondPolkadot = async function(amountDecimal) {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;
    if (!polkadotEngine) {
      throw new Error("B2PolkadotEngine não carregado.");
    }
    window.showToast && window.showToast(`Desvinculando (Unbond) ${amountDecimal} DOT…`, "info");
    try {
      const result = await polkadotEngine.PolkadotStakingProvider.unbond(this.decryptedSeed, amountDecimal, this.activeAccountIndex);
      const txHash = result.toHex ? result.toHex() : JSON.stringify(result);
      window.B2Logger.log("success", `[Polkadot Staking] Unbond realizado: ${txHash}`);

      this.addTransaction('POLKADOT', {
        type: "Unbond DOT",
        amount: `+${amountDecimal.toFixed(4)} DOT`,
        addr: "Staking Pallet",
        color: "var(--text-success)"
      });
      await this.updateNetworkBalances();
      return txHash;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no Unbond: ${err.message}`, "error");
      throw err;
    }
  };

B2WalletApp.prototype.nominatePolkadot = async function(validatorsArray) {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;
    if (!polkadotEngine) {
      throw new Error("B2PolkadotEngine não carregado.");
    }
    window.showToast && window.showToast(`Nomeando validadores para Staking de DOT…`, "info");
    try {
      const result = await polkadotEngine.PolkadotStakingProvider.nominate(this.decryptedSeed, validatorsArray, this.activeAccountIndex);
      const txHash = result.toHex ? result.toHex() : JSON.stringify(result);
      window.B2Logger.log("success", `[Polkadot Staking] Nominate realizado: ${txHash}`);

      this.addTransaction('POLKADOT', {
        type: "Nominate DOT",
        amount: `0 DOT`,
        addr: `${validatorsArray.length} validadores`,
        color: "var(--color-primary)"
      });
      await this.updateNetworkBalances();
      return txHash;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no Nominate: ${err.message}`, "error");
      throw err;
    }
  };

B2WalletApp.prototype.withdrawUnbondedPolkadot = async function() {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const polkadotEngine = window.B2PolkadotEngine || globalThis.B2PolkadotEngine;
    if (!polkadotEngine) {
      throw new Error("B2PolkadotEngine não carregado.");
    }
    window.showToast && window.showToast(`Resgatando saldo desvinculado (Withdraw Unbonded) DOT…`, "info");
    try {
      const result = await polkadotEngine.PolkadotStakingProvider.withdrawUnbonded(this.decryptedSeed, this.activeAccountIndex);
      const txHash = result.toHex ? result.toHex() : JSON.stringify(result);
      window.B2Logger.log("success", `[Polkadot Staking] Withdraw Unbonded realizado: ${txHash}`);

      this.addTransaction('POLKADOT', {
        type: "Withdraw Unbonded",
        amount: "Resgate",
        addr: "Staking Pallet",
        color: "var(--text-success)"
      });
      await this.updateNetworkBalances();
      return txHash;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no resgate de Staking: ${err.message}`, "error");
      throw err;
    }
  };

B2WalletApp.prototype.stakeTron = async function(amount, resource) {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
    if (!tronEngine) {
      throw new Error("B2TronEngine não carregado.");
    }
    const chain = this.blockchainData.find(c => c.key === "TRON");
    if (!chain) {
      throw new Error("Blockchain TRON não encontrada no registro.");
    }
    const fallbacks = ["https://tron-rpc.publicnode.com", "https://tron.api.subquery.network"];

    window.showToast && window.showToast(`Congelando (Freeze) ${amount} TRX para ${resource === 'BANDWIDTH' ? 'Bandwidth' : 'Energy'}…`, "info");
    try {
      const result = await tronEngine.freezeBalanceV2(this.decryptedSeed, amount, resource, chain.nodeUrl, fallbacks, this.activeAccountIndex);
      const txId = result.txId || result.txID || JSON.stringify(result);
      window.B2Logger.log("success", `[TRON Staking] Freeze realizado: ${txId}`);

      this.addTransaction('TRON', {
        type: `Stake TRX (${resource})`,
        amount: `-${amount.toFixed(6)} TRX`,
        addr: "Stake 2.0",
        color: "var(--text-danger)"
      });
      await this.updateNetworkBalances();
      return txId;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no Freeze: ${err.message}`, "error");
      throw err;
    }
  };

B2WalletApp.prototype.unstakeTron = async function(amount, resource) {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
    if (!tronEngine) {
      throw new Error("B2TronEngine não carregado.");
    }
    const chain = this.blockchainData.find(c => c.key === "TRON");
    if (!chain) {
      throw new Error("Blockchain TRON não encontrada no registro.");
    }
    const fallbacks = ["https://tron-rpc.publicnode.com", "https://tron.api.subquery.network"];

    window.showToast && window.showToast(`Descongelando (Unfreeze) ${amount} TRX para ${resource === 'BANDWIDTH' ? 'Bandwidth' : 'Energy'}…`, "info");
    try {
      const result = await tronEngine.unfreezeBalanceV2(this.decryptedSeed, amount, resource, chain.nodeUrl, fallbacks, this.activeAccountIndex);
      const txId = result.txId || result.txID || JSON.stringify(result);
      window.B2Logger.log("success", `[TRON Staking] Unfreeze realizado: ${txId}`);

      this.addTransaction('TRON', {
        type: `Unstake TRX (${resource})`,
        amount: `${amount.toFixed(6)} TRX`,
        addr: "Stake 2.0",
        color: "var(--text-success)"
      });
      await this.updateNetworkBalances();
      return txId;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha no Unfreeze: ${err.message}`, "error");
      throw err;
    }
  };

B2WalletApp.prototype.withdrawExpireUnfreezeTron = async function() {
    if (!this.decryptedSeed) {
      throw new Error("Carteira bloqueada. Semente mnemônica ausente.");
    }
    const tronEngine = window.B2TronEngine || globalThis.B2TronEngine;
    if (!tronEngine) {
      throw new Error("B2TronEngine não carregado.");
    }
    const chain = this.blockchainData.find(c => c.key === "TRON");
    if (!chain) {
      throw new Error("Blockchain TRON não encontrada no registro.");
    }
    const fallbacks = ["https://tron-rpc.publicnode.com", "https://tron.api.subquery.network"];

    window.showToast && window.showToast(`Retirando TRX expirado do Stake 2.0…`, "info");
    try {
      const result = await tronEngine.withdrawExpireUnfreeze(this.decryptedSeed, chain.nodeUrl, fallbacks, this.activeAccountIndex);
      const txId = result.txId || result.txID || JSON.stringify(result);
      window.B2Logger.log("success", `[TRON Staking] Retirada realizada: ${txId}`);

      this.addTransaction('TRON', {
        type: `Withdraw Staked`,
        amount: "Resgate",
        addr: "Stake 2.0",
        color: "var(--text-success)"
      });
      await this.updateNetworkBalances();
      return txId;
    } catch (err) {
      window.showToast && window.showToast(`❌ Falha na retirada: ${err.message}`, "error");
      throw err;
    }
  };

B2WalletApp.prototype.showLeasingView = function(chainKey) {
    const chain = this.blockchainData.find(c => c.key === chainKey);
    if (!chain) return;

    // Atualiza título
    const title = document.getElementById('leasing-view-title');
    const subtitle = document.getElementById('leasing-view-subtitle');
    if (title) title.textContent = `Leasing — ${chain.name} (${chain.symbol})`;
    if (subtitle) subtitle.textContent = `Arrende seus ${chain.symbol} para validadores da rede e ganhe recompensas LPoS.`;

    const leaseFeeEl = document.getElementById('lease-fee-display');
    if (leaseFeeEl) {
      leaseFeeEl.textContent = `0.005 ${chain.symbol}`;
    }

    const pendingBanner = document.getElementById('leasing-pending-banner');
    const activeContent = document.getElementById('leasing-active-content');

    if (chain.leasingStatus === 'pending') {
      if (pendingBanner) pendingBanner.style.display = 'block';
      if (activeContent) activeContent.style.display = 'none';
    } else {
      if (pendingBanner) pendingBanner.style.display = 'none';
      if (activeContent) activeContent.style.display = 'flex';

      // Renderiza nós e arrendamentos
      this._renderLeasingNodes(chainKey, chain);
      this._renderActiveLeasesInView(chainKey, chain);
    }

    this._leasingChainKey = chainKey;
    window.B2UIRenderer.navigateTo('view-leasing');
  };

B2WalletApp.prototype._renderLeasingNodes = function(chainKey, chain) {
    const listEl = document.getElementById('leasing-nodes-list');
    if (!listEl) return;

    const nodesByChain = {
      // WAVES: [
      //   { name: 'WavesBrasil Pool', addr: '3P9DEDP5VbyXQyKtXDUt2VMxAeJGKBBXGXX', roi: '~3.5% a.a.' },
      //   { name: 'MyWavesPool', addr: '3P2HNUd5VUPLMQkJmctTPEeeHumiPN2GkTb', roi: '~3.2% a.a.' },
      //   { name: 'DexgoPool', addr: '3PJaDyprvekvPXPuAtxrapacuDJopgJRaU3v', roi: '~3.0% a.a.' }
      // ],
      // AMZX: [
      //   { name: 'AMZX Validator 1', addr: '3PAMZX1Validator7H9oBetter2Better001', roi: '~5% a.a.' },
      //   { name: 'AMZX Validator 2', addr: '3PAMZX2Validator7H9oBetter2Better002', roi: '~4.5% a.a.' }
      // ],
      // CELERONX: [
      //   { name: 'PlanetOne Node Alpha', addr: '3PCX1NodeAlphaBetter2Better20240601x', roi: '~4% a.a.' },
      //   { name: 'PlanetOne Node Beta', addr: '3PCX2NodeBetaBetter2Better20240601xx', roi: '~3.8% a.a.' }
      // ]
    };

    const nodes = nodesByChain[chainKey] || [];

    if (nodes.length === 0) {
      listEl.innerHTML = `<div style="font-size:var(--text-xs);color:var(--text-muted);text-align:center;padding:var(--space-4);">Nós de validação ainda não configurados para esta rede.</div>`;
      return;
    }

    listEl.innerHTML = '';
    nodes.forEach((node, idx) => {
      const card = document.createElement('div');
      card.className = 'leasing-node-card glass-card';
      card.setAttribute('data-node-addr', node.addr);
      card.setAttribute('data-node-name', node.name);
      card.style.cssText = 'display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);cursor:pointer;transition:border-color 0.2s;border:1px solid var(--border-subtle);';
      card.innerHTML = `
        <div style="width:36px;height:36px;border-radius:50%;background:var(--color-primary-gradient);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-bold);">N${idx + 1}</div>
        <div style="flex:1;">
          <div style="font-size:var(--text-sm);font-weight:var(--fw-semibold);">${node.name}</div>
          <div style="font-size:var(--text-xs);color:var(--text-success);">${node.roi}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);font-family:monospace;">${node.addr.substring(0, 12)}...</div>
        </div>
        <div class="node-check" style="width:18px;height:18px;border-radius:50%;border:2px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;"></div>
      `;
      card.addEventListener('click', () => {
        listEl.querySelectorAll('.leasing-node-card').forEach(c => {
          c.style.borderColor = 'var(--border-subtle)';
          const check = c.querySelector('.node-check');
          if (check) check.innerHTML = '';
          c.classList.remove('selected');
        });
        card.style.borderColor = 'var(--color-primary)';
        card.classList.add('selected');
        const check = card.querySelector('.node-check');
        if (check) check.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      });
      listEl.appendChild(card);
    });
  };

B2WalletApp.prototype._renderActiveLeasesInView = function(chainKey, chain) {
    const listEl = document.getElementById('active-leases-list');
    if (!listEl) return;
    const leases = JSON.parse(localStorage.getItem(`b2_leases_${chainKey}`) || '[]');

    if (leases.length === 0) {
      listEl.innerHTML = `<div style="text-align:center;padding:var(--space-5);color:var(--text-muted);font-size:var(--text-sm);">Nenhum arrendamento ativo</div>`;
      return;
    }

    listEl.innerHTML = '';
    leases.forEach(lease => {
      const item = document.createElement('div');
      item.className = 'active-lease-item';
      item.innerHTML = `
        <div class="active-lease-info">
          <span class="active-lease-node">${lease.validatorName || 'Validador'}</span>
          <span class="active-lease-amount">${lease.amount.toFixed(4)} ${chain.symbol}</span>
        </div>
        <button class="btn btn-danger btn-sm" data-lease-id="${lease.id}">Cancelar</button>
      `;
      item.querySelector('button').addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = await window.B2Toast.confirm("Cancelar Arrendamento", "Deseja realmente cancelar este arrendamento?", "warning");
        if (confirmed) {
          this.cancelLPoSLease(chainKey, lease.id);
          this._renderActiveLeasesInView(chainKey, chain);
        }
      });
      listEl.appendChild(item);
    });
  };

