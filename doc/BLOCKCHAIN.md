# Integração e Derivação de Blockchains - B2 Wallet

A **B2 Wallet** é uma carteira criptográfica multichain de auto-custódia. O núcleo da inovação está na capacidade de utilizar uma **única semente (Seed Phrase/Mnemonic) BIP-39** para derivar chaves privadas e endereços públicos seguros em **17+ diferentes ecossistemas e suas ramificações (forks)**.

Este documento detalha o padrão matemático de derivação de chaves e os caminhos (derivation paths) adotados sob a arquitetura desenhada pelo **Tech Lead Diego Oris (Better2Better)**.

---

## 1. Padrão de Semente Única (BIP-39, BIP-32 e BIP-44)

Para fornecer ao usuário uma experiência simples de backup mantendo compatibilidade técnica massiva, a B2 Wallet utiliza os seguintes padrões industriais estabelecidos:

* **BIP-39**: Utilizado para gerar sementes mnemônicas legíveis por humanos (12 ou 24 palavras) a partir de entropia criptográfica segura (`crypto.getRandomValues`). A semente BIP-39 é então transformada em um binário de 512 bits através da função de hashing iterativo `PBKDF2` (usando `HMAC-SHA512` com salt `"mnemonic" + senha`).
* **BIP-32 / BIP-44**: Padrão de carteira determinística hierárquica (HD Wallet). O caminho padrão de derivação segue a estrutura:
  $$\text{m / purpose' / coin\_type' / account' / change / address\_index}$$
  * `purpose'`: Fixado em `44'` (para carteiras legadas/padrão) ou `84'` (para Native SegWit no Bitcoin).
  * `coin_type'`: Identificador numérico exclusivo de cada blockchain de acordo com o padrão SLIP-0044.

---

## 2. Matriz de Derivação das 17 Blockchains

A tabela abaixo exibe os caminhos de derivação exatos e as curvas criptográficas associadas que a B2 Wallet utiliza para derivar os endereços de cada rede a partir da mesma semente:

| Blockchain | Coin Type | Caminho de Derivação | Curva Elíptica | Formato de Endereço Padrão |
| :--- | :---: | :--- | :--- | :--- |
| **Bitcoin (BTC)** | `0'` | `m/84'/0'/0'/0/0` | Secp256k1 (SegWit) | Native SegWit Bech32 (`bc1...`) |
| **Litecoin (LTC)** | `2'` | `m/44'/2'/0'/0/0` | Secp256k1 | Base58 Check (`L...` ou `M...`) |
| **Doge (DOGE)** | `3'` | `m/44'/3'/0'/0/0` | Secp256k1 | Base58 Check (`D...`) |
| **Dash (DASH)** | `5'` | `m/44'/5'/0'/0/0` | Secp256k1 | Base58 Check (`X...`) |
| **ZCash (ZEC)** | `133'` | `m/44'/133'/0'/0/0` | Secp256k1 | Endereço Transparente (`t1...`) |
| **Bitcoin Cash (BCH)**| `145'` | `m/44'/145'/0'/0/0` | Secp256k1 | CashAddr (`bitcoincash:q...`) |
| **Waves & Forks** | `360'` | `m/44'/360'/0'/0/0` | Curve25519 | Base58 Waves (`3P...`) |
| **EVM & Forks** | `60'` | `m/44'/60'/0'/0/0` | Secp256k1 | Hexadecimal com Checksum (`0x...`) |
| **Solana (SOL)** | `501'` | `m/44'/501'/0'/0'` | Ed25519 | Base58 Base (`3...` ou `6...`) |
| **Cardano (ADA)** | `1815'`| `m/1852'/1815'/0'/0/0`| Ed25519 (Icarus) | Bech32 Shelley (`addr1...`) |
| **Tron (TRX)** | `195'` | `m/44'/195'/0'/0/0` | Secp256k1 | Base58 Check (`T...`) |
| **Stellar (XLM)** | `148'` | `m/44'/148'/0'` | Ed25519 | Base32 StrKey (`G...`) |
| **BNB Chain (EVM)** | `60'` | `m/44'/60'/0'/0/0` | Secp256k1 | Hexadecimal com Checksum (`0x...`) |
| **Monero (XMR)** | `128'` | `m/44'/128'/0'/0/0` | Ed25519 | Base58 Monero (95 caracteres, `4...`) |
| **Electroneum (ETN)** | `415'` | `m/44'/415'/0'/0/0` | Ed25519 | Base58 Check (`etn1...`) |
| **ICP (Internet Computer)**| `223'` | `m/44'/223'/0'/0/0` | Ed25519 | Principal ID Hexadecimal / Account |
| **Polkadot (DOT)** | `354'` | `m/44'/354'/0'/0/0` | Sr25519 | SS58 Substrate Format (`1...`) |
| **Filecoin (FIL)** | `461'` | `m/44'/461'/0'/0/0` | Secp256k1 | Filecoin Format (`f1...`) |
| **NEO** | `888'` | `m/44'/888'/0'/0/0` | Secp256k1 | Base58 Neo (`A...`) |

*Nota: Redes EVM como Polygon, Avalanche (C-Chain), Arbitrum, Optimism, zkSync e Binance Smart Chain (BSC) compartilham o coin_type padrão `60'` e caminhos padrão de derivação Ethereum, permitindo que o usuário acesse todas as suas contas EVM sob o mesmo endereço.*

---

## 3. Especificidades de Codificação de Endereços por Grupo

A equipe sênior implementou conversores nativos em TypeScript/JavaScript para modelar perfeitamente a lógica de codificação de endereços de cada grupo de blockchains:

### 3.1 Grupo Secp256k1 - Bitcoin e Forks
* **Entrada**: Chave privada de 32 bytes gerada via derivação hierárquica.
* **Processamento**:
  1. Multiplicação da chave privada pelo ponto gerador $G$ da curva Secp256k1 para gerar a chave pública comprimida (33 bytes: prefixo `02` ou `03` seguido pela coordenada X).
  2. Hashing duplo da chave pública comprimida: `SHA256` seguido de `RIPEMD160` para gerar o hash de chave de 20 bytes (PubKeyHash).
  3. Para **Bitcoin SegWit**: Codificação em Bech32 com o prefixo `"bc1q"`.
  4. Para **Litecoin, Doge, Dash e ZCash**: Adição do byte de versão correspondente à rede, cálculo de checksum de 4 bytes (`SHA256` duplo) e codificação em Base58Check.

### 3.2 Grupo EVM (Curva Secp256k1)
* **Processamento**:
  1. Geração da chave pública não-comprimida de 64 bytes (excluindo o prefixo `04`).
  2. Hashing Keccak-256 dos 64 bytes da chave pública.
  3. Obtenção dos últimos 20 bytes do hash resultante como o endereço.
  4. Conversão para Mixed-Case (EIP-55) para incorporar uma soma de verificação de maiúsculas e minúsculas baseada nos hashes das letras do endereço.

### 3.3 Grupo Ed25519 - Solana, Stellar, Cardano
* A curva **Ed25519** utiliza assinaturas de Schnorr sobre curvas torcidas de Edwards.
* No caso da **Solana**, o endereço público de 32 bytes gerado diretamente pela derivação do caminho Ed25519 é codificado usando a base Base58 direta, sem a necessidade de checksums adicionais de RIPEMD.
* No caso da **Stellar**, a chave pública de 32 bytes é prefixada com o byte de versão `0x30` (letra 'G'), seguida pelo cálculo de um checksum CRC-16 de 2 bytes e codificada em Base32.

### 3.4 Ecossistemas Exóticos e Derivados (Waves, Polkadot, Monero)
* **Waves**: Derivação a partir do Curve25519, onde o endereço é gerado concatenando a versão da rede, o ID da blockchain e o hash da chave pública com Keccak-256 e Blake2b.
* **Polkadot (DOT)**: Codificação no formato SS58, que aplica o algoritmo Blake2b sobre a chave pública e adiciona os bytes de controle correspondentes da rede antes de encadear em Base58.

---

O sistema de derivação multichain foi otimizado para que a conversão de sementes para endereços ocorra em menos de 15ms em dispositivos móveis, operando inteiramente em threads locais (Web Workers) para não travar a linha de renderização da interface principal.

**Better2Better - Tecnologia Confiável e Descentralizada**
*(c) 2026 better2better.com.br - Todos os direitos reservados.*
