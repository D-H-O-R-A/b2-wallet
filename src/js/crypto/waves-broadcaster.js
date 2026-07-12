/**
 * B2 Wallet — Waves Broadcaster
 *
 * Coordena a assinatura e o broadcast de transações (Transfer, Lease, Cancel Lease)
 * para redes baseadas no protocolo Waves (Waves, AMZX, PlanetOne).
 *
 * Depende de:
 *   - B2WavesSignatures (para axlsign e criptografia básica)
 *   - B2WavesTransactions (para montagem de blocos e derivação de contas)
 */

;(function(global) {
  'use strict';

  // Obter referências aos submódulos
  const sigs = global.B2WavesSignatures || (typeof window !== 'undefined' ? window.B2WavesSignatures : {});
  const txs  = global.B2WavesTransactions || (typeof window !== 'undefined' ? window.B2WavesTransactions : {});

  const { axlsign } = sigs;
  const {
    deriveWavesKeyPair,
    deriveWavesAddress,
    buildTransferTransaction,
    buildLeaseTransaction,
    buildCancelLeaseTransaction
  } = txs;

  // ─────────────────────────────────────────────────────────────────────────────
  // BROADCAST REST API
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Transmite uma transação assinada para um nó Waves via REST API.
   *
   * @param {string} nodeUrl   - URL base do nó (ex: https://nodes.wavesnodes.com)
   * @param {Object} txPayload - Objeto de transação assinado
   * @returns {Promise<Object>} - Resposta do nó com o hash da transação
   */
  async function broadcastTransaction(nodeUrl, txPayload) {
    const cleanUrl = nodeUrl.replace(/\/+$/, '');
    const endpoint = `${cleanUrl}/transactions/broadcast`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(txPayload)
    });

    const responseText = await response.text();
    let responseJson;
    try { responseJson = JSON.parse(responseText); } catch(e) { responseJson = { error: responseText }; }

    if (!response.ok) {
      const errMsg = responseJson?.message || responseJson?.error || `HTTP ${response.status}`;
      throw new Error(`Broadcast falhou (${response.status}): ${errMsg}`);
    }

    return responseJson;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // API PÚBLICA DE ASSINATURA E ENVIO
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Assina uma transação de TRANSFERÊNCIA na rede Waves/AMZX/PlanetOne localmente (offline).
   */
  function signWavesTransfer(mnemonic, recipient, amountWaves, assetId = null, memo = null, feeAssetId = null, feeAmount = null, nonce = 0) {
    const { privateKey, publicKey } = deriveWavesKeyPair(mnemonic, nonce);
    const amountWavelets = BigInt(Math.round(amountWaves * 1e8));
    const feeWavelets    = feeAmount !== null ? BigInt(feeAmount) : 100000n; // 0.001 WAVES por padrão
    const timestamp      = BigInt(Date.now());

    return buildTransferTransaction({
      privateKey, publicKey, recipient,
      amount: amountWavelets,
      fee: feeWavelets,
      timestamp,
      attachment: memo,
      assetId: assetId || null,
      feeAssetId: feeAssetId || null
    });
  }

  /**
   * Envia uma transação de TRANSFERÊNCIA na rede Waves/AMZX/PlanetOne.
   *
   * @param {string} mnemonic   - Frase mnemônica do usuário
   * @param {string} nodeUrl    - URL do nó da rede
   * @param {string} recipient  - Endereço Base58 do destinatário
   * @param {number} amountWaves - Valor em WAVES (ex: 1.5)
   * @param {string|null} assetId - ID de ativo customizado (null para nativo)
   * @param {string|null} memo  - Mensagem anexa (opcional)
   * @param {string|null} feeAssetId  - ID do ativo para a taxa (null para nativo)
   * @param {number|null} feeAmount   - Valor da taxa nas unidades atômicas do ativo (null para 100000)
   * @returns {Promise<Object>} - Resposta do nó { id: "txhash", ... }
   */
  async function sendWavesTransfer(mnemonic, nodeUrl, recipient, amountWaves, assetId = null, memo = null, feeAssetId = null, feeAmount = null, nonce = 0) {
    const txPayload = signWavesTransfer(mnemonic, recipient, amountWaves, assetId, memo, feeAssetId, feeAmount, nonce);
    return broadcastTransaction(nodeUrl, txPayload);
  }

  /**
   * Cria um arrendamento LPoS na rede Waves/AMZX/PlanetOne.
   *
   * @param {string} mnemonic     - Frase mnemônica
   * @param {string} nodeUrl      - URL do nó
   * @param {string} recipient    - Endereço do validador
   * @param {number} amountWaves  - Valor em WAVES
   * @returns {Promise<Object>}
   */
  async function startWavesLease(mnemonic, nodeUrl, recipient, amountWaves, nonce = 0) {
    const { privateKey, publicKey } = deriveWavesKeyPair(mnemonic, nonce);
    const amountWavelets = BigInt(Math.round(amountWaves * 1e8));
    const feeWavelets    = 100000n;
    const timestamp      = BigInt(Date.now());

    const txPayload = buildLeaseTransaction({
      privateKey, publicKey, recipient,
      amount: amountWavelets,
      fee: feeWavelets,
      timestamp
    });

    return broadcastTransaction(nodeUrl, txPayload);
  }

  /**
   * Cancela um arrendamento LPoS na rede Waves/AMZX/PlanetOne.
   *
   * @param {string} mnemonic   - Frase mnemônica
   * @param {string} nodeUrl    - URL do nó
   * @param {string} leaseId    - ID do lease a cancelar (Base58)
   * @param {number} chainId    - Chain ID (87=WAVES, 65=AMZX, 67=PlanetOne)
   * @returns {Promise<Object>}
   */
  async function cancelWavesLease(mnemonic, nodeUrl, leaseId, chainId, nonce = 0) {
    const { privateKey, publicKey } = deriveWavesKeyPair(mnemonic, nonce);
    const feeWavelets = 100000n;
    const timestamp   = BigInt(Date.now());

    const txPayload = buildCancelLeaseTransaction({
      privateKey, publicKey, leaseId,
      fee: feeWavelets,
      timestamp,
      chainId
    });

    return broadcastTransaction(nodeUrl, txPayload);
  }

  // Exportação global universal
  const B2WavesBroadcaster = {
    // Derivação de chaves
    deriveWavesKeyPair,
    deriveWavesAddress,
    // Transações
    signWavesTransfer,
    sendWavesTransfer,
    startWavesLease,
    cancelWavesLease,
    broadcastTransaction,
    axlsign
  };

  if (typeof window !== "undefined") { window.B2WavesBroadcaster = B2WavesBroadcaster; }
  if (typeof globalThis !== "undefined") { globalThis.B2WavesBroadcaster = B2WavesBroadcaster; }
  if (typeof module !== "undefined" && module.exports) { module.exports = { B2WavesBroadcaster }; }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
