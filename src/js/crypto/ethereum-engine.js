/**
 * B2 Wallet — Motor Unificado de Execução EVM (B2EthereumEngine)
 *
 * Provê suporte criptográfico robusto e unificado para as 26 redes EVM,
 * incluindo assinaturas de transações (Legacy e EIP-1559), assinaturas
 * de mensagens (personal_sign, eth_sign) e dados estruturados EIP-712.
 *
 * Desenvolvido por Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  const B2EthereumEngine = {
    /**
     * Obtém o objeto global do Ethers.js
     */
    getEthers() {
      const eth = global.ethers || (global.window && global.window.ethers);
      if (!eth) {
        throw new Error('Ethers.js library is not loaded in global context');
      }
      return eth;
    },

    /**
     * Deriva o endereço público EIP-55 mixed-case a partir de uma chave privada hex.
     *
     * @param {string} privateKeyHex - Chave privada de 32 bytes em formato hex.
     * @returns {string} - Endereço Ethereum checksum EIP-55.
     */
    deriveEVMAddress(privateKeyHex) {
      const ethers = this.getEthers();
      const cleanKey = privateKeyHex.startsWith('0x') ? privateKeyHex : '0x' + privateKeyHex;
      const wallet = new ethers.Wallet(cleanKey);
      return wallet.address;
    },

    /**
     * Constrói e assina uma transação EVM (Legacy ou EIP-1559).
     *
     * @param {string} privateKeyHex - Chave privada do remetente.
     * @param {object} txData - Parâmetros da transação.
     * @returns {Promise<string>} - Retorna a transação assinada em hex (0x...).
     */
    async signTransaction(privateKeyHex, txData) {
      const ethers = this.getEthers();
      const cleanKey = privateKeyHex.startsWith('0x') ? privateKeyHex : '0x' + privateKeyHex;
      const wallet = new ethers.Wallet(cleanKey);

      // Normalização dos tipos numéricos para BigInt / Number requeridos pelo ethers v6
      const tx = {
        to: txData.to,
        nonce: Number(txData.nonce),
        gasLimit: txData.gasLimit ? BigInt(txData.gasLimit) : 21000n,
        chainId: Number(txData.chainId)
      };

      if (txData.value) {
        tx.value = typeof txData.value === 'bigint' ? txData.value : ethers.parseEther(txData.value.toString());
      } else {
        tx.value = 0n;
      }

      if (txData.data) {
        tx.data = txData.data;
      }

      // EIP-1559 vs Legacy Gas
      if (txData.maxFeePerGas && txData.maxPriorityFeePerGas) {
        tx.maxFeePerGas = BigInt(txData.maxFeePerGas);
        tx.maxPriorityFeePerGas = BigInt(txData.maxPriorityFeePerGas);
        tx.type = 2; // EIP-1559
      } else if (txData.gasPrice) {
        tx.gasPrice = BigInt(txData.gasPrice);
        tx.type = 0; // Legacy
      }

      return await wallet.signTransaction(tx);
    },

    /**
     * Assina uma mensagem no formato personal_sign.
     * Prepara com o cabeçalho \x19Ethereum Signed Message:\n antes de assinar.
     *
     * @param {string} privateKeyHex - Chave privada.
     * @param {string|Uint8Array} message - Mensagem em formato legível ou bytes.
     * @returns {Promise<string>} - Assinatura hexadecimal.
     */
    async personal_sign(privateKeyHex, message) {
      const ethers = this.getEthers();
      const cleanKey = privateKeyHex.startsWith('0x') ? privateKeyHex : '0x' + privateKeyHex;
      const wallet = new ethers.Wallet(cleanKey);
      return await wallet.signMessage(message);
    },

    /**
     * Assina dados usando a assinatura eth_sign padrão.
     *
     * @param {string} privateKeyHex - Chave privada.
     * @param {string} dataHex - Dados em formato hexadecimal.
     * @returns {Promise<string>} - Assinatura hexadecimal.
     */
    async eth_sign(privateKeyHex, dataHex) {
      const ethers = this.getEthers();
      const cleanKey = privateKeyHex.startsWith('0x') ? privateKeyHex : '0x' + privateKeyHex;
      const wallet = new ethers.Wallet(cleanKey);
      // Se for hex limpo, transforma em bytes para assinar sem hash redundante de texto plano
      const bytes = ethers.isHexString(dataHex) ? ethers.getBytes(dataHex) : dataHex;
      return await wallet.signMessage(bytes);
    },

    /**
     * Assina dados estruturados EIP-712 (eth_signTypedData / eth_signTypedData_v4).
     *
     * @param {string} privateKeyHex - Chave privada.
     * @param {object|string} typedData - Objeto ou JSON string contendo { domain, types, primaryType, message }
     * @returns {Promise<string>} - Assinatura estruturada.
     */
    async eth_signTypedData_v4(privateKeyHex, typedData) {
      const ethers = this.getEthers();
      const cleanKey = privateKeyHex.startsWith('0x') ? privateKeyHex : '0x' + privateKeyHex;
      const wallet = new ethers.Wallet(cleanKey);

      let data = typeof typedData === 'string' ? JSON.parse(typedData) : typedData;

      // Sanitiza types para o ethers v6 (remove o EIP712Domain dos tipos customizados, o ethers infere implicitamente)
      const sanitizedTypes = {};
      for (const k in data.types) {
        if (k !== 'EIP712Domain') {
          sanitizedTypes[k] = data.types[k];
        }
      }

      return await wallet.signTypedData(
        data.domain,
        sanitizedTypes,
        data.message
      );
    },

    /**
     * Alias de compatibilidade para assinatura de dados estruturados
     */
    async eth_signTypedData(privateKeyHex, typedData) {
      return await this.eth_signTypedData_v4(privateKeyHex, typedData);
    },

    /**
     * Verifica se uma assinatura de mensagem personal_sign é válida para um determinado endereço.
     *
     * @param {string} address - Endereço público esperado.
     * @param {string} message - Mensagem original.
     * @param {string} signature - Assinatura hexadecimal.
     * @returns {boolean} - True se coincidir.
     */
    verifyPersonalSignature(address, message, signature) {
      const ethers = this.getEthers();
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    },

    /**
     * Verifica se uma assinatura EIP-712 é válida para um determinado endereço.
     */
    verifyTypedDataSignature(address, typedData, signature) {
      const ethers = this.getEthers();
      let data = typeof typedData === 'string' ? JSON.parse(typedData) : typedData;
      const sanitizedTypes = {};
      for (const k in data.types) {
        if (k !== 'EIP712Domain') {
          sanitizedTypes[k] = data.types[k];
        }
      }
      const recoveredAddress = ethers.verifyTypedData(
        data.domain,
        sanitizedTypes,
        data.message,
        signature
      );
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    }
  };

  // Exportação no escopo global
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2EthereumEngine;
  }
  if (global.window) {
    global.window.B2EthereumEngine = B2EthereumEngine;
  } else {
    global.B2EthereumEngine = B2EthereumEngine;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
