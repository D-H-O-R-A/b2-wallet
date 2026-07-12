/**
 * B2 Wallet — Waves Transactions and Account Derivation
 *
 * Oferece as funções de derivação de par de chaves e endereços do ecossistema Waves,
 * bem como a construção e serialização binária de transações (Transfer, Lease, Cancel Lease).
 */

;(function(global) {
  'use strict';

  // Obter as assinaturas e utilitários criptográficos
  const sigs = global.B2WavesSignatures || (typeof window !== 'undefined' ? window.B2WavesSignatures : {});
  const {
    axlsign,
    base58Encode,
    base58Decode,
    writeUint16BE,
    writeUint32BE,
    writeInt64BE,
    sha256,
    keccak256Bytes,
    blake2b256,
    wavesChecksum
  } = sigs;

  /**
   * Deriva o par de chaves Waves (ed25519) a partir do mnemônico BIP-39.
   * Compatível com Waves Keeper, WX Network e Surfboard.
   *
   * @param {string} mnemonic - Frase mnemônica de 12 palavras
   * @param {number} [nonce=0] - Nonce de conta (0 para conta principal)
   * @returns {{ privateKey: Uint8Array, publicKey: Uint8Array, publicKeyBase58: string }}
   */
  function deriveWavesKeyPair(mnemonic, nonce = 0) {
    const encoder = new TextEncoder();
    const mnemonicBytes = encoder.encode(mnemonic.trim());

    // Waves: accountSeed = sha256( nonce_4bytes_BE || mnemonic_bytes )
    const nonceBytes = new Uint8Array(4);
    const nonceView = new DataView(nonceBytes.buffer);
    nonceView.setUint32(0, nonce, false);

    const seedInput = new Uint8Array(nonceBytes.length + mnemonicBytes.length);
    seedInput.set(nonceBytes);
    seedInput.set(mnemonicBytes, nonceBytes.length);

    const accountSeed = sha256(keccak256Bytes(blake2b256(seedInput)));
    // axlsign.generateKeyPair faz internamente sha512(accountSeed) + clamp
    const { publicKey, privateKey } = axlsign.generateKeyPair(accountSeed);

    return {
      privateKey,
      publicKey,
      publicKeyBase58: base58Encode(publicKey)
    };
  }

  /**
   * Calcula o endereço Waves canônico a partir dos bytes da chave pública ed25519.
   * Spec: https://docs.waves.tech/en/blockchain/account/
   *   address = Base58( 0x01 || chainId || blake2b256(keccak256(pubKey))[0:20] || checksum )
   * onde checksum = keccak256(blake2b256(body))[0:4]
   *
   * @param {Uint8Array} publicKeyBytes - Chave pública ed25519 (32 bytes)
   * @param {number}     chainId        - 87 (WAVES), 65 (AMZX), 67 (PlanetOne), 76 (TURTLE)
   * @returns {string}                  - Endereço Waves em Base58 (35 chars)
   */
  function deriveWavesAddress(publicKeyBytes, chainId) {
    const blakePub   = blake2b256(publicKeyBytes);
    const keccakHash = keccak256Bytes(blakePub);
    const accountHash = keccakHash.subarray(0, 20);

    // Monta corpo: [0x01, chainId, accountHash(20 bytes)]
    const body = new Uint8Array(22);
    body[0] = 0x01;
    body[1] = chainId;
    body.set(accountHash, 2);

    const checksum = wavesChecksum(body);

    const addr = new Uint8Array(26);
    addr.set(body);
    addr.set(checksum, 22);
    return base58Encode(addr);
  }

  /**
   * Serializa e assina uma transação de TRANSFERÊNCIA (tipo 4, versão 2).
   */
  function buildTransferTransaction(params) {
    const { privateKey, publicKey, recipient, amount, fee, timestamp, attachment, assetId, feeAssetId } = params;

    const pubKeyB58 = base58Encode(publicKey);
    const attachBytes = attachment
      ? new TextEncoder().encode(attachment.substring(0, 140))
      : new Uint8Array(0);

    const recipientBytes = base58Decode(recipient);

    let bufLen = 1 + 1 + 32 + 1 + 1 + 8 + 8 + 8 + recipientBytes.length + 2 + attachBytes.length;
    if (assetId) bufLen += 32;
    if (feeAssetId) bufLen += 32;

    const buf = new Uint8Array(bufLen);
    let off = 0;

    buf[off++] = 4;     // type
    buf[off++] = 2;     // version

    buf.set(publicKey, off); off += 32;

    if (assetId) {
      buf[off++] = 1;
      buf.set(base58Decode(assetId), off); off += 32;
    } else {
      buf[off++] = 0;
    }

    if (feeAssetId) {
      buf[off++] = 1;
      buf.set(base58Decode(feeAssetId), off); off += 32;
    } else {
      buf[off++] = 0;
    }

    writeInt64BE(buf, timestamp, off); off += 8;
    writeInt64BE(buf, amount, off); off += 8;
    writeInt64BE(buf, fee, off); off += 8;
    buf.set(recipientBytes, off); off += recipientBytes.length;
    writeUint16BE(buf, attachBytes.length, off); off += 2;
    buf.set(attachBytes, off);

    const sig = axlsign.sign(buf, privateKey);
    const sigB58 = base58Encode(sig);

    const attachBase64 = btoa(String.fromCharCode(...attachBytes));

    return {
      id: base58Encode(blake2b256(buf)),
      type: 4,
      version: 2,
      senderPublicKey: pubKeyB58,
      assetId: assetId || null,
      feeAssetId: feeAssetId || null,
      timestamp: Number(timestamp),
      amount: Number(amount),
      fee: Number(fee),
      recipient: recipient,
      attachment: attachBase64,
      proofs: [sigB58]
    };
  }

  /**
   * Serializa e assina uma transação de LEASE (tipo 8, versão 2).
   */
  function buildLeaseTransaction(params) {
    const { privateKey, publicKey, recipient, amount, fee, timestamp } = params;
    const pubKeyB58 = base58Encode(publicKey);
    const recipientBytes = base58Decode(recipient);

    // Type(1)+Version(1)+Reserved(1)+pubKey(32)+recipient(26)+amount(8)+fee(8)+timestamp(8)
    const bufLen = 1 + 1 + 1 + 32 + recipientBytes.length + 8 + 8 + 8;
    const buf = new Uint8Array(bufLen);
    let off = 0;

    buf[off++] = 8;   // type
    buf[off++] = 2;   // version
    buf[off++] = 0;   // reserved
    buf.set(publicKey, off); off += 32;
    buf.set(recipientBytes, off); off += recipientBytes.length;
    writeInt64BE(buf, amount, off); off += 8;
    writeInt64BE(buf, fee, off); off += 8;
    writeInt64BE(buf, timestamp, off);

    const sig = axlsign.sign(buf, privateKey);
    const sigB58 = base58Encode(sig);

    return {
      id: base58Encode(blake2b256(buf)),
      type: 8,
      version: 2,
      senderPublicKey: pubKeyB58,
      fee: Number(fee),
      timestamp: Number(timestamp),
      amount: Number(amount),
      recipient: recipient,
      proofs: [sigB58]
    };
  }

  /**
   * Serializa e assina uma transação de CANCEL LEASE (tipo 9, versão 2).
   */
  function buildCancelLeaseTransaction(params) {
    const { privateKey, publicKey, leaseId, fee, timestamp, chainId } = params;
    const pubKeyB58 = base58Encode(publicKey);
    const leaseIdBytes = base58Decode(leaseId);

    // Type(1)+Version(1)+ChainId(1)+pubKey(32)+fee(8)+timestamp(8)+leaseId(32)
    const bufLen = 1 + 1 + 1 + 32 + 8 + 8 + leaseIdBytes.length;
    const buf = new Uint8Array(bufLen);
    let off = 0;

    buf[off++] = 9;       // type
    buf[off++] = 2;       // version
    buf[off++] = chainId; // chain ID byte
    buf.set(publicKey, off); off += 32;
    writeInt64BE(buf, fee, off); off += 8;
    writeInt64BE(buf, timestamp, off); off += 8;
    buf.set(leaseIdBytes, off);

    const sig = axlsign.sign(buf, privateKey);
    const sigB58 = base58Encode(sig);

    return {
      id: base58Encode(blake2b256(buf)),
      type: 9,
      version: 2,
      senderPublicKey: pubKeyB58,
      chainId: chainId,
      fee: Number(fee),
      timestamp: Number(timestamp),
      leaseId: leaseId,
      proofs: [sigB58]
    };
  }

  // Exportação global universal
  const B2WavesTransactions = {
    deriveWavesKeyPair,
    deriveWavesAddress,
    buildTransferTransaction,
    buildLeaseTransaction,
    buildCancelLeaseTransaction
  };

  if (typeof window !== "undefined") { window.B2WavesTransactions = B2WavesTransactions; }
  if (typeof globalThis !== "undefined") { globalThis.B2WavesTransactions = B2WavesTransactions; }
  if (typeof module !== "undefined" && module.exports) { module.exports = { B2WavesTransactions }; }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
