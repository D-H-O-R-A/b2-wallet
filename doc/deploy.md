# 🚀 Guia de Distribuição e Implantação da B2 Wallet

Este guia fornece instruções detalhadas para o empacotamento, publicação e deploy multiplataforma da **B2 Wallet**, cobrindo o SDK Web3, extensões de navegadores, aplicativos móveis (iOS e Android) e desktop (Linux, macOS, Windows).

Desenvolvido sob a liderança do **Tech Lead Diego Oris (Better2Better)**.

---

## 🗂️ Visão Geral do Pipeline de Builds

A automação do monorepo é estruturada no `Makefile` raiz e mapeada para scripts do `package.json`. O fluxo de compilação gera um build estático unificado (`/dist`) que serve de base para as plataformas mobile e desktop, otimizando o tamanho do pacote e consistência visual.

| Comando Makefile | Comando NPM | Saída / Destino |
|:---|:---|:---|
| `make build` | `npm run build` | Compilação web unificada na pasta `/dist` |
| `make deploy-extension` | `npm run deploy:extension` | Compacta extensão em `b2-wallet-extension.zip` |
| `make deploy-sdk` | `npm run deploy:sdk` | Publica o pacote SDK no NPM Registry |
| `make deploy-mobile-android` | `npm run deploy:mobile:android` | Sincroniza e abre projeto Android no Android Studio |
| `make deploy-mobile-ios` | `npm run deploy:mobile:ios` | Sincroniza e abre projeto iOS no Xcode |
| `make deploy-desktop` | `npm run deploy:desktop` | Compila executáveis nativos via Tauri v2 |

---

## 📦 1. SDK de Conexão Web3 (`b2-wallet-sdk-web3`)

O SDK permite que DApps se conectem de forma segura à B2 Wallet injetada no escopo global do navegador.

### Pré-requisitos
- Uma conta ativa no [npmjs.com](https://www.npmjs.com) com autenticação de dois fatores (2FA) configurada.
- Permissão de publicação na organização Better2Better (se aplicável).

### Passo a Passo de Publicação
1. Autentique-se via terminal:
   ```bash
   npm login
   ```
2. Realize a auditoria local e rode os testes:
   ```bash
   npm run test
   ```
3. Incremente a versão do SDK (conforme SemVer):
   ```bash
   npm version patch -w packages/sdk-web3
   ```
4. Execute o deploy automatizado:
   ```bash
   npm run deploy:sdk
   ```
   *Nota: Caso queira apenas empacotar e validar localmente antes de enviar, execute `npm pack --workspace=packages/sdk-web3` para gerar um arquivo `.tgz` para testes locais.*

---

## 🧩 2. Extensão do Navegador (Manifest V3)

A extensão injeta o SDK e fornece uma janela popup em Glassmorphism responsiva.

### Passo a Passo de Empacotamento
1. Execute o comando de compilação da extensão:
   ```bash
   npm run deploy:extension
   ```
2. Este comando irá:
   - Compilar a aplicação.
   - Criar a pasta temporária de empacotamento.
   - Gerar o arquivo compactado `b2-wallet-extension.zip` na raiz do projeto.

### Instalação em Modo de Desenvolvimento (Chrome/Edge/Brave/Opera)
1. Abra o navegador e navegue até `chrome://extensions/`.
2. Ative o modo de desenvolvedor (**Developer mode**) no canto superior direito.
3. Clique em **Load unpacked** (Carregar sem pacote).
4. Selecione a pasta `/apps/extension/` do seu workspace.

### Envio para a Chrome Web Store
1. Acesse o [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole).
2. Registre-se como desenvolvedor (taxa única de $5 USD paga ao Google).
3. Clique em **New Item** (Novo Item).
4. Faça o upload do arquivo `b2-wallet-extension.zip` gerado na raiz do projeto.
5. Preencha os metadados (descrição, capturas de tela e política de privacidade que se encontra em `/privacy-policy.html`).
6. Submeta para revisão (geralmente leva de 24h a 72h).

---

## 📱 3. Aplicativo Móvel (Capacitor - iOS & Android)

A versão móvel encapsula a interface web e oferece pontes com o Secure Enclave e Keystore nativos de tablets e smartwatches.

### 🤖 Android Deployment

#### Pré-requisitos
- Android Studio instalado e configurado com SDK 34+.
- Chave de assinatura keystore criada para produção.

#### Passo a Passo
1. Sincronize os arquivos da carteira e abra o Android Studio:
   ```bash
   npm run deploy:mobile:android
   ```
2. No Android Studio, aguarde o Gradle sincronizar completamente.
3. Configure sua assinatura de release em `File > Project Structure > Build Variants` ou via arquivo `build.gradle` em `/apps/mobile/android/app/build.gradle`.
4. Gere o Bundle de Produção:
   - No menu superior, selecione `Build > Generate Signed Bundle / APK...`.
   - Escolha **Android App Bundle (.aab)** (necessário para o Google Play).
   - Insira os caminhos e senhas da sua chave de produção.
5. Envie o `.aab` gerado para o console de desenvolvedores do [Google Play Console](https://play.google.com/console/).

### 🍎 iOS Deployment (incluindo watchOS para Smartwatch e iPadOS para Tablets)

#### Pré-requisitos
- macOS rodando a versão estável mais recente.
- Xcode instalado com CocoaPods configurados.
- Conta ativa no Apple Developer Program ($99 USD/ano).

#### Passo a Passo
1. Sincronize os arquivos e abra o Xcode:
   ```bash
   npm run deploy:mobile:ios
   ```
2. No Xcode, selecione o target principal do aplicativo.
3. Na aba **Signing & Capabilities**:
   - Ative o **Automatically manage signing**.
   - Selecione a sua equipe de desenvolvedor da Apple (**Developer Team**).
   - Configure os Bundle Identifiers necessários.
4. Para **iPad (Tablets)** e **Apple Watch (Smartwatch)**:
   - Certifique-se de que os targets adicionais de suporte estão marcados como compatíveis na seção de implantação de dispositivos (*Deployment Info*).
   - A interface responsiva estática da B2 Wallet se adapta nativamente a ambos usando os arquivos CSS customizados em `/src/css`.
5. Prepare o build para envio:
   - No menu superior do Xcode, mude o destino de compilação para **Any iOS Device (arm64)**.
   - Selecione `Product > Archive`.
6. Após a conclusão do Archive, clique em **Distribute App** no Organizer do Xcode para fazer o upload diretamente para o **App Store Connect / TestFlight**.

---

## 🖥️ 4. Aplicativo Desktop (Tauri v2)

O Tauri v2 compila o core ultra-seguro em Rust e encapsula o frontend em um webview leve de alta performance de nível nativo.

### Pré-requisitos de Compilação
As dependências do Tauri variam por sistema operacional de compilação:
- **macOS**: Xcode Command Line Tools instalados (`xcode-select --install`).
- **Windows**: C++ Build Tools instaladas via Visual Studio Installer.
- **Linux**: Dependências do sistema (como `libsoup`, `webkit2gtk`, `libssl-dev` etc.).

### Passo a Passo de Compilação
1. Certifique-se de que o compilador Rust está atualizado:
   ```bash
   rustup update
   ```
2. Execute a compilação multiplataforma:
   ```bash
   npm run deploy:desktop
   ```
3. O Tauri compilará o projeto e gerará os pacotes nativos em:
   - **Linux**: `apps/desktop/src-tauri/target/release/bundle/deb/` (.deb) e `appimage/` (.AppImage)
   - **macOS**: `apps/desktop/src-tauri/target/release/bundle/dmg/` (.dmg) e `macos/` (.app)
   - **Windows**: `apps/desktop/src-tauri/target/release/bundle/msi/` (.msi)

### Assinatura de Código (Recomendado para Produção)
Para evitar alertas do sistema operacional (como SmartScreen no Windows e Gatekeeper no macOS):
- **macOS**: Configure as variáveis de ambiente `APPLE_SIGNING_IDENTITY` e `APPLE_ID` antes de executar `tauri build` para assinar digitalmente e autenticar (Notarize) o aplicativo junto à Apple.
- **Windows**: Utilize o utilitário `SignTool` com um certificado de assinatura de código EV válido após a geração do instalador.

---

## 🛡️ Lista de Verificação de Segurança de Produção

Antes de submeter os aplicativos para suas respectivas lojas:
1. [ ] **Chaves Privadas**: Certifique-se de que nenhuma chave de teste ou mnemônico mestre foi hardcoded em arquivos de configuração ou scripts de testes.
2. [ ] **Semente (Seed Phrase)**: Valide se as frases de semente geradas pela carteira continuam sendo salvas exclusivamente na memória RAM protegida por `Zeroize` e criptografadas localmente via AES-256-GCM antes de persistidas.
3. [ ] **HTTPS e RPCs**: Certifique-se de que todas as comunicações com blockchains estão apontadas para endpoints principais e seguros (Mainnet HTTPS/WSS), eliminando endpoints locais de desenvolvimento (localhost/Ganache).
4. [ ] **Anti-screenshot**: Verifique se a proteção ativa contra captura de tela por CSS Blur (`.anti-screenshot-overlay`) continua funcionando perfeitamente sempre que a janela perde o foco.
