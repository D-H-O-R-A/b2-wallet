/**
 * B2 Wallet — Stellar Transactions, Trustlines, & Accounts Managers
 *
 * Implementa o SequenceManager determinístico, construtores e assinadores
 * de transações nativas, Fee Bump, trustlines, e ativação de contas.
 */

;(function(global) {
  'use strict';

  const StellarSdk = global.StellarSdk || 
                     (global.window && global.window.StellarSdk) || 
                     (typeof window !== 'undefined' && window.StellarSdk);

  const SequenceManager = {
    sequences: new Map(),

    async getSequenceNumber(address, nodeUrl) {
      if (this.sequences.has(address)) {
        const current = this.sequences.get(address);
        const next = current + 1n;
        this.sequences.set(address, next);
        return next.toString();
      }

      // Fetch direct from on-chain
      const res = await fetch(`${nodeUrl}/accounts/${address}`);
      if (!res.ok) {
        if (res.status === 404) {
          // Unactivated account starts with sequence '0' until created
          return '0';
        }
        throw new Error(`Failed to load account sequence: ${res.statusText}`);
      }
      const data = await res.json();
      const onChainSeq = BigInt(data.sequence);
      this.sequences.set(address, onChainSeq);
      return onChainSeq.toString();
    },

    lockSequence(address) {
      if (this.sequences.has(address)) {
        const current = this.sequences.get(address);
        const next = current + 1n;
        this.sequences.set(address, next);
        return next.toString();
      }
      return null;
    },

    syncSequence(address, onChainSeqStr) {
      const onChainSeq = BigInt(onChainSeqStr);
      const cached = this.sequences.get(address);
      if (!cached || onChainSeq > cached) {
        this.sequences.set(address, onChainSeq);
      }
    },

    invalidate(address) {
      this.sequences.delete(address);
    }
  };

  const B2StellarTransactions = {
    SequenceManager,

    buildMemoObject(memo) {
      if (!memo) return StellarSdk.Memo.none();
      if (typeof memo === 'object' && memo.value) {
        if (memo.type === 'id') return StellarSdk.Memo.id(memo.value.toString());
        if (memo.type === 'hash') return StellarSdk.Memo.hash(memo.value);
        if (memo.type === 'return') return StellarSdk.Memo.return(memo.value);
        return StellarSdk.Memo.text(memo.value);
      }
      if (/^\d+$/.test(memo.toString())) {
        return StellarSdk.Memo.id(memo.toString());
      }
      return StellarSdk.Memo.text(memo.toString());
    },

    async buildPaymentTransaction(fromAddress, toAddress, amount, memo, fee, isTestnet = false, nodeUrl = 'https://horizon.stellar.org') {
      const sequence = await SequenceManager.getSequenceNumber(fromAddress, nodeUrl);
      const sourceAccount = new StellarSdk.Account(fromAddress, sequence);
      
      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: fee ? fee.toString() : StellarSdk.BASE_FEE,
        networkPassphrase: isTestnet ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC
      })
      .addOperation(StellarSdk.Operation.payment({
        destination: toAddress,
        asset: StellarSdk.Asset.native(),
        amount: amount.toString()
      }))
      .setTimeout(StellarSdk.TimeoutInfinite);

      if (memo) {
        tx.addMemo(this.buildMemoObject(memo));
      }

      const builtTx = tx.build();
      return builtTx.toEnvelope().toXDR('base64');
    },

    async buildAssetTransfer(fromAddress, toAddress, assetCode, assetIssuer, amount, memo, fee, isTestnet = false, nodeUrl = 'https://horizon.stellar.org') {
      const sequence = await SequenceManager.getSequenceNumber(fromAddress, nodeUrl);
      const sourceAccount = new StellarSdk.Account(fromAddress, sequence);
      const customAsset = new StellarSdk.Asset(assetCode, assetIssuer);

      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: fee ? fee.toString() : StellarSdk.BASE_FEE,
        networkPassphrase: isTestnet ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC
      })
      .addOperation(StellarSdk.Operation.payment({
        destination: toAddress,
        asset: customAsset,
        amount: amount.toString()
      }))
      .setTimeout(StellarSdk.TimeoutInfinite);

      if (memo) {
        tx.addMemo(this.buildMemoObject(memo));
      }

      const builtTx = tx.build();
      return builtTx.toEnvelope().toXDR('base64');
    },

    buildFeeBumpTransaction(innerTxEnvelopeXdr, feeSourceSecretSeed, fee, isTestnet = false) {
      const network = isTestnet ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC;
      const innerTx = StellarSdk.TransactionBuilder.fromXDR(innerTxEnvelopeXdr, network);
      const feeSourceKeypair = StellarSdk.Keypair.fromSecret(feeSourceSecretSeed);

      const feeBumpTx = StellarSdk.TransactionBuilder.buildFeeBumpTransaction(
        feeSourceKeypair,
        fee.toString(),
        innerTx,
        network
      );

      return feeBumpTx.toEnvelope().toXDR('base64');
    },

    signTransaction(txEnvelopeXdr, secretSeed, isTestnet = false) {
      const network = isTestnet ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC;
      const tx = StellarSdk.TransactionBuilder.fromXDR(txEnvelopeXdr, network);
      const keypair = StellarSdk.Keypair.fromSecret(secretSeed);
      tx.sign(keypair);
      return tx.toEnvelope().toXDR('base64');
    },

    async broadcastTransaction(signedTxEnvelopeXdr, isTestnet = false, nodeUrl = 'https://horizon.stellar.org', fallbacks = []) {
      const endpoints = [nodeUrl, ...fallbacks];
      const network = isTestnet ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC;
      const tx = StellarSdk.TransactionBuilder.fromXDR(signedTxEnvelopeXdr, network);
      
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          const horizonUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
          const server = new StellarSdk.Horizon.Server(horizonUrl);
          const result = await server.submitTransaction(tx);
          return {
            success: true,
            txhash: result.hash,
            ledger: result.ledger,
            node: endpoint
          };
        } catch (e) {
          lastError = e;
          console.warn(`[B2StellarEngine] Broadcast transaction failed on ${endpoint}:`, e.message);
        }
      }

      throw new Error('Failed to broadcast transaction on all available endpoints. Last error: ' + (lastError ? lastError.message : 'Unknown'));
    },

    async isAccountActivated(address, nodeUrl = 'https://horizon.stellar.org') {
      try {
        const res = await fetch(`${nodeUrl}/accounts/${address}`);
        if (res.status === 404) return 'UNACTIVATED';
        if (res.ok) return 'ACTIVATED';
      } catch (e) {
        console.warn('[B2StellarEngine] Failed to verify account activation:', e.message);
      }
      return 'UNKNOWN';
    },

    async activateAccount(fundingSecretSeed, destinationAddress, amount = '1.6', isTestnet = false, nodeUrl = 'https://horizon.stellar.org') {
      const funderKeypair = StellarSdk.Keypair.fromSecret(fundingSecretSeed);
      const funderAddress = funderKeypair.publicKey();
      
      const sequence = await SequenceManager.getSequenceNumber(funderAddress, nodeUrl);
      const sourceAccount = new StellarSdk.Account(funderAddress, sequence);

      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: isTestnet ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC
      })
      .addOperation(StellarSdk.Operation.createAccount({
        destination: destinationAddress,
        startingBalance: amount.toString()
      }))
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();

      tx.sign(funderKeypair);
      const signedXdr = tx.toEnvelope().toXDR('base64');
      return await this.broadcastTransaction(signedXdr, isTestnet, nodeUrl);
    },

    async getSigners(address, nodeUrl = 'https://horizon.stellar.org') {
      try {
        const res = await fetch(`${nodeUrl}/accounts/${address}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.signers.map(s => ({
          key: s.key,
          weight: s.weight,
          type: s.type
        }));
      } catch (e) {
        return [];
      }
    },

    async getThresholds(address, nodeUrl = 'https://horizon.stellar.org') {
      try {
        const res = await fetch(`${nodeUrl}/accounts/${address}`);
        if (!res.ok) return null;
        const data = await res.json();
        return {
          low: data.thresholds.low_threshold,
          med: data.thresholds.med_threshold,
          high: data.thresholds.high_threshold
        };
      } catch (e) {
        return null;
      }
    },

    async createTrustline(secretSeed, assetCode, assetIssuer, limit, isTestnet = false, nodeUrl = 'https://horizon.stellar.org') {
      const keypair = StellarSdk.Keypair.fromSecret(secretSeed);
      const address = keypair.publicKey();
      
      const sequence = await SequenceManager.getSequenceNumber(address, nodeUrl);
      const sourceAccount = new StellarSdk.Account(address, sequence);
      const customAsset = new StellarSdk.Asset(assetCode, assetIssuer);

      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: isTestnet ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC
      })
      .addOperation(StellarSdk.Operation.changeTrust({
        asset: customAsset,
        limit: limit ? limit.toString() : undefined
      }))
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();

      tx.sign(keypair);
      const signedXdr = tx.toEnvelope().toXDR('base64');
      return await this.broadcastTransaction(signedXdr, isTestnet, nodeUrl);
    },

    async removeTrustline(secretSeed, assetCode, assetIssuer, isTestnet = false, nodeUrl = 'https://horizon.stellar.org') {
      return await this.createTrustline(secretSeed, assetCode, assetIssuer, '0', isTestnet, nodeUrl);
    },

    async checkTrustline(address, assetCode, assetIssuer, nodeUrl = 'https://horizon.stellar.org') {
      const engine = global.B2StellarEngine || (global.window && global.window.B2StellarEngine);
      if (!engine) throw new Error("B2StellarEngine not loaded yet");

      const balances = await engine.HorizonProvider.getBalances(address, nodeUrl);
      const trustline = balances.find(b => b.asset_code === assetCode && b.asset_issuer === assetIssuer);
      return {
        hasTrustline: !!trustline,
        balance: trustline ? trustline.balance : '0',
        limit: trustline ? trustline.limit : '0'
      };
    },

    async claimClaimableBalance(secretSeed, balanceId, isTestnet = false, nodeUrl = 'https://horizon.stellar.org') {
      const keypair = StellarSdk.Keypair.fromSecret(secretSeed);
      const address = keypair.publicKey();

      const sequence = await SequenceManager.getSequenceNumber(address, nodeUrl);
      const sourceAccount = new StellarSdk.Account(address, sequence);

      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: isTestnet ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC
      })
      .addOperation(StellarSdk.Operation.claimClaimableBalance({
        balanceId: balanceId
      }))
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();

      tx.sign(keypair);
      const signedXdr = tx.toEnvelope().toXDR('base64');
      return await this.broadcastTransaction(signedXdr, isTestnet, nodeUrl);
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2StellarTransactions;
  }
  if (global.window) {
    global.window.B2StellarTransactions = B2StellarTransactions;
  } else {
    global.B2StellarTransactions = B2StellarTransactions;
  }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
