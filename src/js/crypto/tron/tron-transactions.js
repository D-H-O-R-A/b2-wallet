/**
 * B2 Wallet — Tron Transactions & Stake 2.0 Builder
 *
 * Implementa construtores de transações nativas TRX e interações TRC20 (triggersmartcontract),
 * assinatura local ECDSA via Ethers.js, transmissão e orquestração do ciclo de vida Stake 2.0.
 */

;(function(global) {
  'use strict';

  const B2TronTransactions = {
    // -------------------------------------------------------------------------
    // TRANSACTION BUILDERS, SIGNERS & BROADCAST
    // -------------------------------------------------------------------------

    /**
     * Constrói uma transação não assinada (TRX ou TRC20).
     */
    async buildTransaction(sender, recipient, amount, tokenAddress, memo = null, nodeUrl, fallbacks = []) {
      const senderHex = this.toHexAddress(sender);
      const recipientHex = this.toHexAddress(recipient);

      let extraDataHex = undefined;
      if (memo) {
        const bytes = new TextEncoder().encode(memo);
        extraDataHex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      }

      const contracts = global.B2TronContracts || (global.window && global.window.B2TronContracts) || {};
      const wellKnownTRC20 = contracts.wellKnownTRC20 || [];

      if (tokenAddress) {
        // TRC20 Token Transfer
        const contractHex = this.toHexAddress(tokenAddress);
        // Buscar decimais dinamicamente
        let decimals = 18;
        const wellKnown = wellKnownTRC20.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
        if (wellKnown) {
          decimals = wellKnown.decimals;
        } else {
          try {
            const decData = await this.fetchWithFailover("wallet/triggerconstantcontract", {
              owner_address: senderHex,
              contract_address: contractHex,
              function_selector: "decimals()",
              parameter: ""
            }, "POST", nodeUrl, fallbacks);
            if (decData && decData.constant_result && decData.constant_result.length > 0) {
              decimals = parseInt(decData.constant_result[0], 16);
            }
          } catch (e) {
            console.warn('[TRON Engine] Failed to fetch token decimals dynamically, using 18:', e.message);
          }
        }

        const rawAmount = BigInt(Math.round(amount * Math.pow(10, decimals)));
        const paramRecipient = "000000000000000000000000" + recipientHex.substring(2);
        const paramAmount = rawAmount.toString(16).padStart(64, '0');
        const parameter = paramRecipient + paramAmount;

        const data = await this.fetchWithFailover("wallet/triggersmartcontract", {
          owner_address: senderHex,
          contract_address: contractHex,
          function_selector: "transfer(address,uint256)",
          parameter: parameter,
          fee_limit: 150000000, // 150 TRX max cost
          call_value: 0
        }, "POST", nodeUrl, fallbacks);

        if (!data || !data.transaction) {
          throw new Error('Failed to build TRC20 transfer transaction: ' + JSON.stringify(data));
        }

        return data.transaction;
      } else {
        // Standard TRX Transfer
        const rawAmount = Math.round(amount * 1e6); // em Sun
        const requestBody = {
          owner_address: senderHex,
          to_address: recipientHex,
          amount: rawAmount
        };
        if (extraDataHex) {
          requestBody.extra_data = extraDataHex;
        }

        const data = await this.fetchWithFailover("wallet/createtransaction", requestBody, "POST", nodeUrl, fallbacks);

        if (!data || !data.txID) {
          throw new Error('Failed to build TRX transfer transaction: ' + JSON.stringify(data));
        }
        return data;
      }
    },

    /**
     * Assina localmente com a chave privada secp256k1.
     */
    signTransaction(transaction, privateKeyHex) {
      if (!global.ethers) {
        throw new Error('Ethers.js library is not loaded');
      }
      const txID = transaction.txID;
      if (!txID) {
        throw new Error('Transaction has no txID to sign');
      }

      const messageHashBytes = global.ethers.getBytes("0x" + txID);
      const signingKey = new global.ethers.SigningKey("0x" + privateKeyHex);
      const sig = signingKey.sign(messageHashBytes);

      const rHex = sig.r.substring(2);
      const sHex = sig.s.substring(2);
      const vHex = sig.yParity.toString(16).padStart(2, '0');
      const signatureHex = rHex + sHex + vHex;

      transaction.signature = [signatureHex];
      return transaction;
    },

    /**
     * Envia a transação assinada para a blockchain real com failover.
     */
    async broadcastTransaction(signedTransaction, nodeUrl, fallbacks = []) {
      try {
        const data = await this.fetchWithFailover("wallet/broadcasttransaction", signedTransaction, "POST", nodeUrl, fallbacks);
        if (data && data.result) {
          return {
            success: true,
            txId: signedTransaction.txID || data.txid
          };
        } else {
          const msg = data && data.message ? (typeof data.message === 'string' ? data.message : JSON.stringify(data.message)) : 'Broadcast rejected';
          throw new Error(msg);
        }
      } catch (e) {
        console.error('[TRON Engine] broadcastTransaction failed:', e.message);
        throw e;
      }
    },

    /**
     * Constrói e assina uma transferência (TRX ou TRC20) localmente (offline).
     */
    async signTransfer(mnemonic, nodeUrl, recipient, amount, tokenAddress = null, memo = null, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const tx = await this.buildTransaction(keyPair.address, recipient, amount, tokenAddress, memo, nodeUrl, fallbacks);
      const signed = this.signTransaction(tx, keyPair.privateKeyHex);
      return signed;
    },

    /**
     * Constrói, assina e transmite uma transferência (TRX ou TRC20) de forma unificada.
     */
    async sendTransfer(mnemonic, nodeUrl, recipient, amount, tokenAddress = null, memo = null, fallbacks = [], index = 0) {
      const signed = await this.signTransfer(mnemonic, nodeUrl, recipient, amount, tokenAddress, memo, fallbacks, index);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    // -------------------------------------------------------------------------
    // STAKE 2.0 IMPLEMENTATION & LOOKUPS
    // -------------------------------------------------------------------------

    async freezeBalanceV2(mnemonic, amount, resource, nodeUrl, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const data = await this.fetchWithFailover("wallet/freezebalancev2", {
        owner_address: keyPair.hexAddress,
        frozen_balance: Math.round(amount * 1e6),
        resource: resource // "BANDWIDTH" ou "ENERGY"
      }, "POST", nodeUrl, fallbacks);

      if (!data || !data.txID) {
        throw new Error('Failed to build freeze transaction: ' + JSON.stringify(data));
      }
      const signed = this.signTransaction(data, keyPair.privateKeyHex);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    async unfreezeBalanceV2(mnemonic, amount, resource, nodeUrl, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const data = await this.fetchWithFailover("wallet/unfreezebalancev2", {
        owner_address: keyPair.hexAddress,
        unfreeze_balance: Math.round(amount * 1e6),
        resource: resource // "BANDWIDTH" ou "ENERGY"
      }, "POST", nodeUrl, fallbacks);

      if (!data || !data.txID) {
        throw new Error('Failed to build unfreeze transaction: ' + JSON.stringify(data));
      }
      const signed = this.signTransaction(data, keyPair.privateKeyHex);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    async stake(mnemonic, amount, resource, nodeUrl, fallbacks = []) {
      return await this.freezeBalanceV2(mnemonic, amount, resource, nodeUrl, fallbacks);
    },

    async unstake(mnemonic, amount, resource, nodeUrl, fallbacks = []) {
      return await this.unfreezeBalanceV2(mnemonic, amount, resource, nodeUrl, fallbacks);
    },

    async delegateResource(mnemonic, receiver, amount, resource, lock, nodeUrl, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const receiverHex = this.toHexAddress(receiver);
      const data = await this.fetchWithFailover("wallet/delegateresource", {
        owner_address: keyPair.hexAddress,
        receiver_address: receiverHex,
        balance: Math.round(amount * 1e6),
        resource: resource, // "BANDWIDTH" ou "ENERGY"
        lock: !!lock
      }, "POST", nodeUrl, fallbacks);

      if (!data || !data.txID) {
        throw new Error('Failed to build delegate transaction: ' + JSON.stringify(data));
      }
      const signed = this.signTransaction(data, keyPair.privateKeyHex);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    async undelegateResource(mnemonic, receiver, amount, resource, nodeUrl, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const receiverHex = this.toHexAddress(receiver);
      const data = await this.fetchWithFailover("wallet/undelegateresource", {
        owner_address: keyPair.hexAddress,
        receiver_address: receiverHex,
        balance: Math.round(amount * 1e6),
        resource: resource // "BANDWIDTH" ou "ENERGY"
      }, "POST", nodeUrl, fallbacks);

      if (!data || !data.txID) {
        throw new Error('Failed to build undelegate transaction: ' + JSON.stringify(data));
      }
      const signed = this.signTransaction(data, keyPair.privateKeyHex);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    async cancelUnfreezeBalanceV2(mnemonic, nodeUrl, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const data = await this.fetchWithFailover("wallet/cancelallunfreezev2", {
        owner_address: keyPair.hexAddress
      }, "POST", nodeUrl, fallbacks);

      if (!data || !data.txID) {
        throw new Error('Failed to build cancel unfreeze transaction: ' + JSON.stringify(data));
      }
      const signed = this.signTransaction(data, keyPair.privateKeyHex);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    async withdrawExpireUnfreeze(mnemonic, nodeUrl, fallbacks = [], index = 0) {
      const keyPair = this.deriveTronKeyPair(mnemonic, index);
      const data = await this.fetchWithFailover("wallet/withdrawexpireunfreeze", {
        owner_address: keyPair.hexAddress
      }, "POST", nodeUrl, fallbacks);

      if (!data || !data.txID) {
        throw new Error('Failed to build withdraw expire unfreeze transaction: ' + JSON.stringify(data));
      }
      const signed = this.signTransaction(data, keyPair.privateKeyHex);
      return await this.broadcastTransaction(signed, nodeUrl, fallbacks);
    },

    async getDelegatedResources(address, nodeUrl, fallbacks = []) {
      const hexAddress = this.toHexAddress(address);
      try {
        const data = await this.fetchWithFailover("wallet/getdelegatedresourceaccountindexv2", { value: hexAddress }, "POST", nodeUrl, fallbacks);
        const delegated = [];
        if (data && Array.isArray(data.toAccounts)) {
          for (const toAcc of data.toAccounts) {
            const detail = await this.fetchWithFailover("wallet/getdelegatedresourcev2", {
              fromAddress: hexAddress,
              toAddress: toAcc
            }, "POST", nodeUrl, fallbacks);
            if (detail && Array.isArray(detail.delegatedResource)) {
              for (const res of detail.delegatedResource) {
                delegated.push({
                  to: this.toBase58Address(toAcc),
                  frozen_balance_for_bandwidth: (res.frozen_balance_for_bandwidth || 0) / 1e6,
                  frozen_balance_for_energy: (res.frozen_balance_for_energy || 0) / 1e6,
                  expire_time_for_bandwidth: res.expire_time_for_bandwidth || 0,
                  expire_time_for_energy: res.expire_time_for_energy || 0
                });
              }
            }
          }
        }
        return delegated;
      } catch (e) {
        console.warn('[TRON Engine] getDelegatedResources failed, returning empty list:', e.message);
        return [];
      }
    },

    async getAvailableUnfreezeCount(address, nodeUrl, fallbacks = []) {
      const hexAddress = this.toHexAddress(address);
      try {
        const data = await this.fetchWithFailover("wallet/getavailableunfreezecount", { ownerAddress: hexAddress }, "POST", nodeUrl, fallbacks);
        return data && typeof data.count !== 'undefined' ? data.count : 32;
      } catch (e) {
        console.warn('[TRON Engine] getAvailableUnfreezeCount failed, returning 32:', e.message);
        return 32;
      }
    },

    async getCanWithdrawUnfreeze(address, nodeUrl, fallbacks = []) {
      const hexAddress = this.toHexAddress(address);
      try {
        const data = await this.fetchWithFailover("wallet/getcanwithdrawunfreezeamount", {
          owner_address: hexAddress,
          timestamp: Date.now()
        }, "POST", nodeUrl, fallbacks);
        return data && typeof data.amount !== 'undefined' ? data.amount / 1e6 : 0.0;
      } catch (e) {
        console.warn('[TRON Engine] getCanWithdrawUnfreeze failed, returning 0.0:', e.message);
        return 0.0;
      }
    }
  };

  if (typeof window !== "undefined") { window.B2TronTransactions = B2TronTransactions; }
  if (typeof globalThis !== "undefined") { globalThis.B2TronTransactions = B2TronTransactions; }
  if (typeof module !== "undefined" && module.exports) { module.exports = B2TronTransactions; }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
