# Passo 7: Pipeline de Compilação e Distribuição Multiplataforma
---

Este documento técnico descreve o processo de empacotamento, compilação cruzada (Cross-Compilation) e geração de executáveis oficiais para todos os canais de distribuição da **B2 Wallet** (iOS, Android, macOS, Windows, Linux e Extensões de Navegador).

Supervisão técnica do **Tech Lead Diego Oris (Better2Better)**.

---

## 1. Visão Geral da Geração de Build Unificada

Através da arquitetura monorepo Turborepo compartilhada e do encapsulamento de rádio de ambiente, o ecossistema B2 Wallet é compilado para as diferentes plataformas por meio de comandos simples no terminal:

```
                                [ B2 WALLET REPOS ]
                                         |
           +-----------------------------+-----------------------------+
           |                             |                             |
           v                             v                             v
   [ Capacitor CLI ]                [ Tauri CLI ]              [ Webpack / Vite ]
           |                             |                             |
           v                             v                             v
     iOS / Android                macOS / Win / Linux             Extensions
```

---

## 2. Processo de Compilação por Canal Operacional

### 2.1 Aplicativo Mobile (iOS & Android)
O empacotamento móvel é gerenciado via **Capacitor** em conjunto com as chaves biométricas de hardware do celular:
1. **Compilação do Frontend**:
   ```bash
   npm run build --workspace=mobile
   ```
2. **Sincronização com as Pastas Nativas**:
   ```bash
   npx cap sync
   ```
3. **Plataforma iOS (Xcode)**:
   * Abre o projeto nativo no Xcode: `npx cap open ios`.
   * Vincula a biblioteca estática compilada pelo compilador Rust contendo as primitivas seguras (`libb2_wallet_core.a`).
   * Configura os cabeçalhos das permissões de privacidade no arquivo `Info.plist` para uso do Face ID:
     ```xml
     <key>NSFaceIDUsageDescription</key>
     <string>B2 Wallet requer acesso ao Face ID para decifrar suas chaves e assinar transações de auto-custódia.</string>
     ```
4. **Plataforma Android (Android Studio / Gradle)**:
   * Compila o APK ou App Bundle assinado utilizando o Gradle do Android: `cd android && ./gradlew assembleRelease`.
   * Inclui as bibliotecas dinâmicas do Rust compiladas para o target do Android NDK dentro da pasta `jniLibs/`.

### 2.2 Aplicativo Desktop (macOS, Windows, Linux)
A compilação para computadores utiliza o ecossistema de alto desempenho **Tauri v2**:
1. **Requisitos de Compilação**:
   * **macOS**: Exige Xcode Command Line Tools e o SDK do Cocoa.
   * **Windows**: Exige o Microsoft Visual Studio C++ Build Tools e o WebView2 Runtime.
   * **Linux**: Exige pacotes adicionais do compilador C e do motor WebKitGTK (Ex: `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`).
2. **Execução de Build**:
   ```bash
   npm run tauri build --workspace=desktop
   ```
O compilador do Tauri executa a build paralela, otimiza o código do backend escrito em Rust, e gera empacotadores nativos leves e auto-contidos:
* **macOS**: Gera arquivos de imagem `.dmg` e bundles de aplicativo `.app`.
* **Windows**: Gera instaladores seguros `.msi` de tamanho ultra-reduzido (menores que 8 MB).
* **Linux**: Gera pacotes debian `.deb` e executáveis portáveis `.AppImage`.

### 2.3 Extensão de Navegador (Chrome, Firefox, Opera, Edge)
O empacotamento de extensões do navegador segue a especificação rigorosa do **Manifest V3**:
1. **Execução de Build**:
   ```bash
   npm run build --workspace=extension
   ```
2. **Resultados Gerados (Pasta `dist/`)**:
   * Contém o arquivo `manifest.json` com políticas estritas de sandbox e declaração de CSP (Content Security Policy).
   * Contém os scripts injetáveis de background (`background.js`) que processam requisições de sites de forma assíncrona.
   * Contém o pop-up interativo React para interação direta do usuário.
3. **Distribuição**:
   * A pasta de saída compilada é zipada de forma a atender os formulários de submissão do Chrome Web Store Developer Console, Firefox Add-on Developer Hub e do Microsoft Partner Center.

---

## 3. Conformidade com as Diretrizes da Apple Store (iOS)

Como parte dos preceitos de conformidade e aprovação rápida do aplicativo móvel nas auditorias rigorosas da Apple, a B2 Wallet foi programada para atender diretamente aos 5 principais vetores de rejeição clássicos da App Store:

1. **Armazenamento Estritamente Local**: Toda semente ou chave privada gerada permanece exclusivamente armazenada no chaveiro seguro local do celular (Keychain/Secure Enclave), sem qualquer sincronização com servidores externos ou envio via API.
2. **Fluxos Transparentes de Recuperação**: Interface clara e objetiva para backup e exibição da semente BIP-39, impedindo que usuários percam acesso às contas.
3. **Declaração Clara de Não-Custódia**: O app fornece informações de aviso visuais e avisos em todos os onboarding de que a B2 Wallet é de auto-custódia completa. A perda da senha ou semente impossibilita a recuperação de fundos pelo suporte técnico.
4. **Links de Política de Privacidade**: Arquivo dedicado `privacy-policy.html` integrado no rodapé de configuração do app para cumprir as regras de auditoria jurídica da App Store.

---

**Better2Better - Tecnologia Confiável e Descentralizada**
*(c) 2026 better2better.com.br - Todos os direitos reservados.*
