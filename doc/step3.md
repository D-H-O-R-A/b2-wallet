# Passo 3: Semente Única BIP-39 e Derivação BIP-44 Multichain
---

Este documento técnico apresenta os padrões de engenharia adotados na **B2 Wallet** para resolver o maior desafio do usuário moderno de cripto: a gestão de múltiplas chaves e contas. Por meio da semente única BIP-39, o usuário gerencia endereços e saldos reais em **17+ blockchains e seus forks**, utilizando um único arquivo de backup criptografado ou frase mnemônica.

Liderado pelo **Tech Lead Diego Oris (Better2Better)**.

---

## 1. O Conceito de Semente Única Hierárquica Determinística

Em carteiras tradicionais, o usuário é frequentemente forçado a gerenciar chaves e frases de sementes diferentes para redes como Bitcoin, Waves, Cardano ou Solana devido a diferenças em suas curvas elípticas de assinatura e esquemas de endereçamento. 

A B2 Wallet resolve essa barreira ao adotar o padrão **Hierarchical Deterministic (HD) Wallet** baseado nas especificações **BIP-32**, **BIP-39** e **BIP-44**:

```
                              [ Semente Mestre BIP-39 (12 Palavras) ]
                                                |
                                                v
                               [ Semente Binária (512-bits / 64 Bytes) ]
                                                |
                                                v
                                [ Nó Mestre Hierárquico (BIP-32) ]
                                                |
          +-----------------------+-------------+-------------+-----------------------+
          |                       |                           |                       |
          v                       v                           v                       v
    Caminho m/44'/0'        Caminho m/44'/60'           Caminho m/44'/501'      Caminho m/44'/195'
        [ Bitcoin ]             [ Ethereum ]                [ Solana ]               [ Tron ]
```

A partir de uma única semente de entropia criptográfica de 12 ou 24 palavras em inglês (para interoperabilidade internacional), geramos um nó raiz que, por meio de caminhos de derivação matemáticos estritos, computa a chave privada exata e o endereço correspondente para cada uma das 17 redes.

---

## 2. Caminhos de Derivação BIP-44 Adotados

A B2 Wallet suporta o padrão oficial de Coin Types do SLIP-0044 para derivar as sementes de cada blockchain:

| Rede | Símbolo | Curva Elíptica | Caminho de Derivação BIP-44 Padrão |
| :--- | :---: | :---: | :--- |
| **Bitcoin** | BTC | Secp256k1 | `m/84'/0'/0'/0/0` (Native SegWit Bech32) |
| **Litecoin** (Fork BTC) | LTC | Secp256k1 | `m/44'/2'/0'/0/0` |
| **Bitcoin Cash** (Fork BTC) | BCH | Secp256k1 | `m/44'/145'/0'/0/0` |
| **Dogecoin** (Fork BTC) | DOGE | Secp256k1 | `m/44'/3'/0'/0/0` |
| **ZCash** (Fork BTC) | ZEC | Secp256k1 | `m/44'/133'/0'/0/0` |
| **Dash** (Fork BTC) | DASH | Secp256k1 | `m/44'/5'/0'/0/0` |
| **Waves** | WAVES | Ed25519 | `m/44'/5741564'` (Custom) |
| **AMZX Network** (Fork Waves)| AMZX | Ed25519 | `m/44'/360'/0'/0/0` |
| **Turtle Network** (Fork Waves)| TN | Ed25519 | `m/44'/360'/0'/0/0` |
| **Ethereum** (EVM) | ETH | Secp256k1 | `m/44'/60'/0'/0/0` |
| **Polygon** (Fork EVM) | POL | Secp256k1 | `m/44'/60'/0'/0/0` |
| **Avalanche** (Fork EVM) | AVAX | Secp256k1 | `m/44'/60'/0'/0/0` |
| **Arbitrum** (Fork EVM) | ARB | Secp256k1 | `m/44'/60'/0'/0/0` |
| **Binance Smart Chain** (EVM) | BNB | Secp256k1 | `m/44'/60'/0'/0/0` |
| **Optimism** (Fork EVM) | OP | Secp256k1 | `m/44'/60'/0'/0/0` |
| **Solana** | SOL | Ed25519 | `m/44'/501'/0'/0'` |
| **Cardano** | ADA | Ed25519 | `m/1852'/1815'` (Shelley Format) |
| **Tron** | TRX | Secp256k1 | `m/44'/195'/0'/0/0` |
| **Stellar** | XLM | Ed25519 | `m/44'/148'/0'` |
| **Monero** | XMR | Ed25519 | `m/44'/128'/0'/0/0` |
| **Electroneum** (Fork Monero) | ETN | Ed25519 | `m/44'/415'/0'/0/0` |
| **ICP** | ICP | Ed25519 | `m/44'/223'/0'/0/0` |
| **Polkadot** | DOT | Sr25519 | `m/44'/354'/0'/0/0` |
| **Filecoin** | FIL | Secp256k1 | `m/44'/461'/0'/0/0` |
| **NEO** | NEO | Secp256k1 | `m/44'/888'/0'/0/0` |

---

## 3. Lógica de Endereçamento por Família de Moedas

Após a derivação matemática da chave pública a partir da chave privada, o sistema aplica o pipeline de transformações específico de cada rede:

1. **EVM & Forks (Ethereum, Polygon, AVAX, Arbitrum, BSC, Optimism)**: Aplica hash Keccak-256 sobre a chave pública não-comprimida de 64 bytes. Toma os últimos 20 bytes e gera o endereço Mixed-case aplicando as regras de capitalização do checksum **EIP-55**.
2. **Bitcoin & Forks (Litecoin, Doge, BCH, ZCash, Dash)**: Aplica hash SHA-256 e, em seguida, RIPEMD-160 sobre a chave pública comprimida. Para Bitcoin Native Segwit, os bytes são codificados usando **Bech32** com o prefixo `bc1q`. Para os demais forks, codifica-se em **Base58Check** com os respectivos bytes de versão (Ex: `L` para Litecoin, `D` para Dogecoin).
3. **Solana, Tron, Stellar e Waves**: Utilizam a curva Ed25519. A codificação é feita diretamente sobre a chave pública binária utilizando codificação **Base58** (Solana, Tron, Waves) ou **Base32** (Stellar, prefixo `G`).

---

## 4. Estrutura do Arquivo de Configuração Exportável Seguro (`.json`)

Para fornecer uma alternativa de recuperação segura, a B2 Wallet permite ao usuário exportar um arquivo unificado contendo as informações da carteira. O arquivo é totalmente criptografado de forma simétrica baseada na senha do usuário, garantindo integridade e portabilidade.

### 4.1 Exemplo de Estrutura do Arquivo Exportável
```json
{
  "version": "0.1.5",
"version_name": "0.1.5 beta",
  "generator": "better2better.com.br",
  "engineer": "Diego Oris",
  "payload": {
    "ciphertext": "f9a8bcde1234a9bcf87cde...",
    "iv": "3f8e72c846d0124817a0de38",
    "tag": "a9f87cde28ea30c71a39f046b0de8e17",
    "salt": "f3b0c82de94751ab",
    "kdf": "argon2id"
  },
  "pinHash": "e2c39fa9...",
  "networks": [
    { "key": "BTC", "name": "Bitcoin", "symbol": "BTC" },
    { "key": "LTC", "name": "Litecoin", "symbol": "LTC" },
    { "key": "EVM", "name": "Ethereum Mainnet", "symbol": "ETH" }
  ]
}
```

O arquivo contém o payload criptografado (`payload`) que abriga a semente BIP-39 do usuário. Sem a senha mestre de desbloqueio, o arquivo de configuração é completamente inútil para atacantes externos, garantindo que a soberania financeira e a custódia das chaves residam unicamente com o proprietário legítimo da B2 Wallet.

---

**Better2Better - Tecnologia Confiável e Descentralizada**
*(c) 2026 better2better.com.br - Todos os direitos reservados.*
