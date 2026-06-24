# B2 Wallet - Carteira Digital Criptográfica

A **B2 Wallet** é uma carteira de criptomoedas descentralizada de auto-custódia (não-custodial) e multiplataforma de última geração. O projeto foi projetado seguindo as melhores práticas de segurança disponíveis atualmente na indústria financeira e criptográfica.

Desenvolvido pela equipe sênior sob a coordenação e liderança técnica do **Tech Lead Diego Oris (Better2Better)**.

---

## 🚀 Diferencial Revolucionário: Semente Única BIP-39 / BIP-44

Diferente das carteiras digitais tradicionais, nas quais o usuário precisa gerenciar sementes e chaves separadas para blockchains que utilizam curvas elípticas distintas, a **B2 Wallet** permite que o usuário acesse, gerencie e receba fundos reais em **17+ blockchains e seus forks** usando **uma única semente de 12 palavras** (ou um arquivo de backup unificado altamente criptografado), preservando a soberania e simplicidade da custódia.

---

## 🛡️ Arquitetura de Segurança de Grau Militar

* **Derivação de Chaves Baseada em Memória (Argon2id)**: A senha do usuário passa pelo algoritmo de endurecimento e estiramento de chave Argon2id (KDF), impossibilitando tentativas de força bruta via fazendas de GPUs/ASICs.
* **Cifragem Autenticada (AES-256-GCM)**: A semente e dados confidenciais são gravados em disco cifrados sob o padrão AES-GCM. Qualquer modificação de bit invalida o payload imediatamente com falha de autenticidade (Tag de Autenticação).
* **Custódia por Hardware Nativo**: Quando executado em celulares e computadores nativos, o app delega as chaves de descriptografia para o chip físico integrado (**Secure Enclave** no iOS/macOS e **StrongBox Android Keystore** no Android) associados a autenticação biométrica (Face ID / Touch ID / Impressão Digital).
* **Táticas Reativas de Defesa**: Auto-Lock após 5 minutos de inatividade, deleção física de variáveis da RAM pós-transação (`Zeroize`) e bloqueio ativo de capturas de tela (Anti-Screenshot).

---

## 🌐 Compatibilidade Multichain Ativa (Sem Mock Data)

A B2 Wallet possui conexões diretas via HTTP REST e JSON-RPC com nós públicos e customizados reais das redes suportadas para resolução de saldos e transações em tempo real:

1. **Bitcoin (BTC)** (Native Segwit Bech32)
2. **Litecoin (LTC)** (Fork Bitcoin)
3. **Bitcoin Cash (BCH)** (Fork Bitcoin)
4. **Dogecoin (DOGE)** (Fork Bitcoin)
5. **Dash (DASH)** (Fork Bitcoin)
6. **ZCash (ZEC)** (Fork Bitcoin)
7. **Waves (WAVES)**
8. **AMZX Network** (Fork Waves)
9. **Turtle Network (TN)** (Fork Waves)
10. **Ethereum Mainnet (ETH)** (EVM)
11. **Polygon (POL)** (EVM)
12. **Avalanche C-Chain (AVAX)** (EVM)
13. **Arbitrum One (ARB)** (EVM)
14. **Binance Smart Chain (BNB)** (EVM)
15. **Optimism Network (OP)** (EVM)
16. **Solana Mainnet (SOL)**
17. **Cardano Shelley (ADA)**
18. **Tron Network (TRX)**
19. **Stellar Lumen (XLM)**
20. **Monero Privacy (XMR)**
21. **Electroneum (ETN)** (Fork Monero)
22. **Internet Computer (ICP)**
23. **Polkadot Mainnet (DOT)**
24. **Filecoin Network (FIL)**
25. **NEO Blockchain (NEO)**

---

## 🎨 Layout e Interface UI-UX-Pro

O aplicativo apresenta um acabamento de luxo com interface **Glassmorphism V2** (desfoques profundos com bordas brilhantes sutis), suporte a **Modo Escuro (OLED Black)** e **Modo Claro (Premium Light)**, micro-animações físicas e **tradução nativa automática para 7 idiomas**:
* Português (PT)
* Inglês (EN)
* Espanhol (ES)
* Francês (FR)
* Chinês Simplificado (ZH)
* Japonês (JA)
* Coreano (KO)

---

## 📦 Estrutura do Repositório e Compilação Multiplataforma

O projeto utiliza uma estrutura unificada para manter e compartilhar tipos, esquemas de RPC, o SDK Web3 injetável (`window.b2wallet`) e o core de criptografia escrito em **Rust**:

```
b2-wallet/
├── apps/
│   ├── extension/          # Extensão de Navegador (Vite + React + TS)
│   ├── desktop/            # Aplicativo Desktop (Tauri v2 + React)
│   └── mobile/             # Aplicativo Mobile (Capacitor/React Native)
├── packages/
│   ├── core-rust/          # Regras e Criptografia em Rust (Wasm / C-bindings)
│   └── sdk-web3/           # window.b2wallet Injetável
```

### 1. Preparação do Ambiente
Instale os compiladores e gerenciadores de pacotes necessários:
```bash
# Instala compilador Rust e targets móveis/wasm
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add aarch64-apple-ios aarch64-linux-android
cargo install wasm-pack

# Instala dependências
npm install
```

### 2. Compilar Core em Rust para WebAssembly (Extension & Desktop)
```bash
cd packages/core-rust
wasm-pack build --target web --out-dir ../sdk-web3/pkg
```

### 3. Gerar Builds Multiplataforma

* **iOS & Android**:
  ```bash
  # Compila e sincroniza bundles nativos
  npm run build --workspace=mobile
  npx cap sync
  
  # Abre IDE de desenvolvimento nativo correspondente
  npx cap open ios
  npx cap open android
  ```
* **Desktop (macOS, Windows, Linux)**:
  ```bash
  npm run tauri build --workspace=desktop
  ```
* **Extensão de Navegador (Chrome, Firefox, Opera, Edge)**:
  ```bash
  npm run build --workspace=extension
  ```
  A pasta compactada gerada na saída `dist/` estará pronta para ser instalada localmente no navegador em modo desenvolvedor ou enviada para aprovação nas respectivas lojas.

---

## 📄 Licença e Termos de Uso

O ecossistema B2 Wallet é disponibilizado sob a licença proprietária **B2 Wallet Source Available License (B2-SAL-1.0)**. Isso assegura que todo o código-fonte está disponível publicamente para verificação, auditorias de segurança independentes e estudo acadêmico, comprovando cientificamente que todas as gerações de chaves privadas ocorrem de forma local e matematicamente limpa nos dispositivos do usuário, blindada contra qualquer forma de custódia centralizada ou espionagem por servidores de terceiros.

O uso comercial, revenda, negociação, intermediação financeira ou redistribuição pública de modificações/forks sem autorização expressa por escrito são estritamente proibidos. Consulte os arquivos [LICENSE](file:///home/diegooris/Documentos/b2-wallet/LICENSE) e [LICENSE-PT](file:///home/diegooris/Documentos/b2-wallet/LICENSE-PT) para ler os termos de uso na íntegra.

**Better2Better - Tecnologia Confiável e Descentralizada**
*(c) 2026 better2better.com.br - Todos os direitos reservados.*
