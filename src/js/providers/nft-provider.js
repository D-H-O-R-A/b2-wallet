/**
 * B2 Wallet — Provedor de NFTs EVM (B2NftProvider)
 *
 * Gerencia a consulta de coleções ERC-721 e ERC-1155, decodificação de metadados
 * e tradução de imagens hospedadas em IPFS ou Arweave para visualização na galeria.
 *
 * Desenvolvido por Diego Oris / Better2Better — B2 Wallet v2.
 */

;(function(global) {
  'use strict';

  let erc721Interface = null;
  let erc1155Interface = null;

  function getERC721Interface() {
    if (!erc721Interface) {
      const ethers = global.B2EthereumEngine.getEthers();
      erc721Interface = new ethers.Interface([
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function balanceOf(address owner) view returns (uint256)",
        "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
        "function tokenURI(uint256 tokenId) view returns (string)"
      ]);
    }
    return erc721Interface;
  }

  function getERC1155Interface() {
    if (!erc1155Interface) {
      const ethers = global.B2EthereumEngine.getEthers();
      erc1155Interface = new ethers.Interface([
        "function balanceOf(address account, uint256 id) view returns (uint256)",
        "function uri(uint256 id) view returns (string)"
      ]);
    }
    return erc1155Interface;
  }

  // Coleções populares/conhecidas para escaneamento rápido por rede (Exemplo em Mainnet)
  const POPULAR_COLLECTIONS = {
    "ETH": [
      { address: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", type: "ERC721", name: "Bored Ape Yacht Club" },
      { address: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB", type: "ERC721", name: "CryptoPunks" },
      { address: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6", type: "ERC721", name: "Mutant Ape Yacht Club" }
    ],
    "POLYGON": [
      { address: "0xA9a6A1cdA3416F83e06cf05E8578E56B690A9851", type: "ERC721", name: "Polygon NFT" }
    ]
  };

  const B2NftProvider = {
    /**
     * Traduz URIs IPFS ou Arweave para gateways públicos HTTP de alta velocidade.
     *
     * @param {string} uri - A URI original do metadado ou imagem (ex: ipfs://..., ar://...).
     * @returns {string} - URL HTTP pronta para consumo pelo navegador.
     */
    getNFTImage(uri) {
      if (!uri) return '';
      
      const uriStr = String(uri).trim();
      
      if (uriStr.startsWith('ipfs://')) {
        const cidPath = uriStr.replace('ipfs://', '');
        // Retorna gateway público de alta velocidade
        return `https://ipfs.io/ipfs/${cidPath}`;
      }
      
      if (uriStr.startsWith('ar://')) {
        const arPath = uriStr.replace('ar://', '');
        return `https://arweave.net/${arPath}`;
      }

      // Se já for HTTP/HTTPS ou outra URL, retorna ela mesma
      return uriStr;
    },

    /**
     * Busca os metadados de um NFT (ERC721 ou ERC1155) a partir do seu contrato e Token ID.
     */
    async getNFTMetadata(contractAddress, tokenId, networkKey, type = "ERC721") {
      const ethers = global.B2EthereumEngine.getEthers();
      let tokenUri = '';
      let is1155 = type.toUpperCase() === "ERC1155";

      try {
        if (is1155) {
          const intr = getERC1155Interface();
          const data = intr.encodeFunctionData("uri", [tokenId]);
          const resHex = await global.B2RpcProvider.fetchRpcWithFailover(networkKey, "eth_call", [
            { to: contractAddress, data: data },
            "latest"
          ]);
          if (resHex && resHex !== "0x") {
            tokenUri = intr.decodeFunctionResult("uri", resHex)[0];
            // ERC-1155 costuma substituir {id} por ID em hexadecimal de 64 caracteres
            if (tokenUri.includes("{id}")) {
              const hexId = BigInt(tokenId).toString(16).padStart(64, '0');
              tokenUri = tokenUri.replace("{id}", hexId);
            }
          }
        } else {
          // Padrão ERC-721
          const intr = getERC721Interface();
          const data = intr.encodeFunctionData("tokenURI", [tokenId]);
          const resHex = await global.B2RpcProvider.fetchRpcWithFailover(networkKey, "eth_call", [
            { to: contractAddress, data: data },
            "latest"
          ]);
          if (resHex && resHex !== "0x") {
            tokenUri = intr.decodeFunctionResult("tokenURI", resHex)[0];
          }
        }
      } catch (err) {
        console.warn(`[B2NftProvider] Erro ao buscar URI do Token ${tokenId} no contrato ${contractAddress}:`, err.message || err);
      }

      if (!tokenUri) {
        return {
          tokenId: tokenId.toString(),
          contractAddress,
          type,
          name: `${type} #${tokenId}`,
          description: "Nenhum metadado disponível.",
          image: ""
        };
      }

      // Resolve a URI (pode ser IPFS, Arweave ou HTTP)
      const resolvedUri = this.getNFTImage(tokenUri);

      // Se for Data URI em base64, decodifica diretamente
      if (resolvedUri.startsWith('data:application/json;base64,')) {
        try {
          const base64Content = resolvedUri.split(';base64,')[1];
          // Use Buffer ou atob conforme ambiente
          const jsonStr = typeof Buffer !== 'undefined' ? 
            Buffer.from(base64Content, 'base64').toString('utf8') : 
            atob(base64Content);
          const meta = JSON.parse(jsonStr);
          return {
            tokenId: tokenId.toString(),
            contractAddress,
            type,
            name: meta.name || `${type} #${tokenId}`,
            description: meta.description || '',
            image: this.getNFTImage(meta.image || meta.image_url || ''),
            attributes: meta.attributes || meta.properties || []
          };
        } catch (e) {
          console.warn('[B2NftProvider] Erro ao decodificar Data URI:', e);
        }
      }

      // Se for URL HTTP ou IPFS, faz o fetch dos metadados
      try {
        const response = await fetch(resolvedUri, { method: 'GET', timeout: 5000 }).catch(() => null);
        if (response && response.ok) {
          const meta = await response.json();
          return {
            tokenId: tokenId.toString(),
            contractAddress,
            type,
            name: meta.name || `${type} #${tokenId}`,
            description: meta.description || '',
            image: this.getNFTImage(meta.image || meta.image_url || ''),
            attributes: meta.attributes || meta.properties || []
          };
        }
      } catch (err) {
        console.warn(`[B2NftProvider] Erro ao baixar metadados de ${resolvedUri}:`, err.message || err);
      }

      // Fallback amigável se o download do JSON falhar
      return {
        tokenId: tokenId.toString(),
        contractAddress,
        type,
        name: `${type} #${tokenId}`,
        description: `URI de metadados: ${resolvedUri}`,
        image: ""
      };
    },

    /**
     * Varre coleções conhecidas e/ou contratos customizados para buscar NFTs pertencentes ao usuário.
     *
     * @param {string} address - Endereço público do usuário.
     * @param {string} networkKey - Rede ativa.
     * @param {Array<object>} [customCollections] - Lista de contratos importados pelo usuário.
     * @returns {Promise<Array<object>>} - Lista de metadados de NFTs localizados.
     */
    async getNFTs(address, networkKey, customCollections = []) {
      const collections = [
        ...(POPULAR_COLLECTIONS[networkKey.toUpperCase()] || []),
        ...customCollections
      ];

      const foundNfts = [];

      for (const coll of collections) {
        try {
          if (coll.type === "ERC721") {
            const intr = getERC721Interface();
            const dataBal = intr.encodeFunctionData("balanceOf", [address]);
            const balHex = await global.B2RpcProvider.fetchRpcWithFailover(networkKey, "eth_call", [
              { to: coll.address, data: dataBal },
              "latest"
            ]);

            if (balHex && balHex !== "0x") {
              const balance = Number(intr.decodeFunctionResult("balanceOf", balHex)[0]);
              
              // Se possuir saldo, tenta buscar os Token IDs
              for (let i = 0; i < Math.min(balance, 10); i++) { // Limitador preventivo para performance na UI
                try {
                  const dataIndex = intr.encodeFunctionData("tokenOfOwnerByIndex", [address, i]);
                  const tokenHex = await global.B2RpcProvider.fetchRpcWithFailover(networkKey, "eth_call", [
                    { to: coll.address, data: dataIndex },
                    "latest"
                  ]);
                  
                  if (tokenHex && tokenHex !== "0x") {
                    const tokenId = intr.decodeFunctionResult("tokenOfOwnerByIndex", tokenHex)[0];
                    const meta = await this.getNFTMetadata(coll.address, tokenId, networkKey, "ERC721");
                    foundNfts.push(meta);
                  }
                } catch (e) {
                  // Fallback: se o contrato não herda ERC721Enumerable, o método tokenOfOwnerByIndex falhará.
                  // Nesse caso, o usuário pode importar diretamente o ID se souber.
                  console.warn(`[B2NftProvider] Contrato ${coll.address} não suporta ERC721Enumerable.`);
                  break;
                }
              }
            }
          } else if (coll.type === "ERC1155") {
            // No ERC-1155 não há "balanceOf(owner)" global, as consultas dependem de ID conhecido.
            if (coll.knownTokenIds) {
              const intr = getERC1155Interface();
              for (const id of coll.knownTokenIds) {
                const dataBal = intr.encodeFunctionData("balanceOf", [address, id]);
                const balHex = await global.B2RpcProvider.fetchRpcWithFailover(networkKey, "eth_call", [
                  { to: coll.address, data: dataBal },
                  "latest"
                ]);
                if (balHex && balHex !== "0x") {
                  const balance = BigInt(intr.decodeFunctionResult("balanceOf", balHex)[0]);
                  if (balance > 0n) {
                    const meta = await this.getNFTMetadata(coll.address, id, networkKey, "ERC1155");
                    foundNfts.push({ ...meta, balance: balance.toString() });
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn(`[B2NftProvider] Falha ao escanear coleção ${coll.address} na rede ${networkKey}:`, err.message || err);
        }
      }

      return foundNfts;
    }
  };

  // Exportação no escopo global
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = B2NftProvider;
  }
  if (global.window) {
    global.window.B2NftProvider = B2NftProvider;
  } else {
    global.B2NftProvider = B2NftProvider;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
