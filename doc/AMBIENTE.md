# 🛠️ Guia do Ambiente de Desenvolvimento da B2 Wallet

Este documento descreve detalhadamente o ambiente de desenvolvimento multiplataforma da **B2 Wallet**, cobrindo comandos de inicialização, mecanismos de *Hot-Reload*, leitura de logs, técnicas de depuração, gerenciamento de avisos/erros e solução de problemas para todos os ambientes suportados (Windows, Linux, macOS, Android, iOS e Extensão Web).

---

## 🚀 Comandos de Inicialização Rápida

Os comandos abaixo foram padronizados no arquivo raiz `package.json` para facilitar a inicialização dedicada do ecossistema de cada plataforma:

| Plataforma | Comando de Inicialização | Descrição / Fluxo Interno |
| :--- | :--- | :--- |
| **Geral** | `npm run dev` | Executa concorrentemente o modo dev em todas as workspaces usando Turborepo. |
| **Windows** | `npm run dev:desktop:windows` | Compila o frontend web, entra em `apps/desktop` e inicia o **Tauri v2** para Windows. |
| **Linux** | `npm run dev:desktop:linux` | Compila o frontend web, entra em `apps/desktop` e inicia o **Tauri v2** para Linux. |
| **macOS** | `npm run dev:desktop:macos` | Compila o frontend web, entra em `apps/desktop` e inicia o **Tauri v2** para macOS. |
| **Android** | `npm run dev:mobile:android` | Compila o frontend, executa o `cap sync` e roda o app diretamente em um dispositivo/emulador Android conectado via **Capacitor**. |
| **iOS** | `npm run dev:mobile:ios` | Compila o frontend, executa o `cap sync` e roda o app diretamente no simulador iOS ou dispositivo via **Capacitor**. |
| **Extensão Web** | `npm run dev:extension` | Executa o watcher multiplataforma personalizado que re-compila a extensão descompactada na pasta `/b2-wallet-extension` em tempo real a cada modificação nos arquivos fontes. |

---

## 🔄 Mecanismos de Recarregamento (*Reload*) e Hot-Reload

### 1. Extensão de Navegador (Chrome, Brave, Edge, Firefox, Opera)

> [!IMPORTANT]
> **Qual pasta carregar no Navegador?**
> Ao carregar a extensão descompactada (*Load unpacked*) no seu navegador de internet, selecione **obrigatoriamente** a pasta:
> **`/home/diegooris/Documentos/b2-wallet/b2-wallet-extension`**
> 
> *Nota: Nunca selecione a pasta `apps/extension` ou a pasta `src` raiz, pois elas não contêm o `manifest.json` mesclado com a aplicação unificada compilada. A pasta correta e sincronizada gerada pelo ambiente é a `b2-wallet-extension`.*

* **Como funciona**: O script `scratch/watch_extension.js` monitora de forma recursiva a pasta `/src` e os arquivos principais como `/index.html`. Qualquer alteração detectada aciona instantaneamente o script de deploy que atualiza a pasta local `/b2-wallet-extension`.
* **Como recarregar no navegador**:
  1. Abra `chrome://extensions/` no seu navegador baseado no Chromium.
  2. Ative o **Modo de Desenvolvedor** no canto superior direito.
  3. Clique em **"Carregar descompactada"** (*Load unpacked*) e selecione a pasta `b2-wallet-extension/` conforme destacado acima.
  4. Ao fazer alterações no código, as atualizações serão refletidas automaticamente no diretório descompactado. Clique no ícone de **Circular (Recarregar)** no card da B2 Wallet para aplicar instantaneamente na extensão ativa.
  5. Para o script de segundo plano (*Service Worker*), a extensão se atualiza de forma autônoma após o recarregamento.

### 2. Desktop (Tauri v2)
* **Como funciona**: O Tauri v2 oferece suporte nativo a HMR (Hot Module Replacement) e recarregamento automático da janela de visualização baseada em WebView.
* **Como recarregar**: No ambiente de desenvolvimento desktop, você pode usar o atalho padrão `F5` ou `Ctrl + R` (`Cmd + R` no macOS) com o cursor focado na janela do app para forçar a atualização imediata do frontend sem reiniciar o processo Rust em segundo plano.

### 3. Mobile (Capacitor)
* **Como funciona**: O Capacitor sincroniza os arquivos compilados do diretório web principal com as pastas de ativos nativos (`android/app/src/main/assets/public` ou `ios/App/App/public`).
* **Como recarregar**: 
  - Sempre que alterar o código web, você pode sincronizar usando `npx cap sync --project apps/mobile`.
  - Se estiver rodando o aplicativo em modo live-reload, use a flag `--live-reload` (ex: `npx cap run android --live-reload --external`). Isso fará com que o WebView nativo aponte diretamente para o IP do seu servidor de desenvolvimento local, permitindo atualizações automáticas e em tempo real na tela do celular.

---

## 📋 Inspeção de Logs e Depuração Avançada

### 1. Extensão de Navegador
Como as extensões dividem-se em múltiplos contextos de execução, os logs também são visualizados em locais separados:
* **Popup (Interface da Carteira)**: Clique com o botão direito sobre a interface da extensão aberta e selecione **Inspecionar**. O console exibirá todas as mensagens e erros relacionados à renderização da interface e manipulação de estado do DOM.
* **Service Worker / Background Script**: Vá em `chrome://extensions/` e clique no link azul **"service worker"** no card da B2 Wallet. Uma janela dedicada do Chrome DevTools se abrirá para monitorar as mensagens de ciclo de vida, decodificação de criptografia profunda, transações e comunicação em background.

### 2. Desktop (Tauri v2)
* **Rust Backend Logs**: Todos os logs do processo nativo (Rust, criptografia de núcleo, geração de chaves via Rust Core) são mostrados diretamente no **terminal** onde o comando `npm run dev:desktop:*` foi disparado. Use macros como `println!` ou a biblioteca `log` do Rust.
* **Frontend WebView Logs**: Com o app desktop aberto em modo de desenvolvimento, clique com o botão direito em qualquer área da carteira e selecione **Inspecionar elemento** (ou use `F12` / `Cmd + Option + I`). Isso abrirá as ferramentas de desenvolvedor padrão do sistema operacional (Safari Web Inspector no macOS, Edge DevTools no Windows, Chrome DevTools no Linux) com console de erros de rede e renderização.

### 3. Mobile (Capacitor)
* **Android**:
  - **WebView (Console do JS)**: Conecte o dispositivo ou emulador, abra o Google Chrome e navegue até `chrome://inspect`. Seu aplicativo B2 Wallet aparecerá sob a lista de alvos de depuração. Clique em **inspect** para depurar o console do celular em tempo real pelo PC.
  - **Logs Nativos (Java/Kotlin)**: Visualize o painel **Logcat** dentro do Android Studio para depurar plugins do Capacitor, erros de armazenamento local seguro e chamadas de ciclo de vida nativo.
* **iOS**:
  - **WebView (Console do JS)**: Conecte seu iPhone ou Simulator, abra o **Safari** no Mac, vá no menu **Desenvolvimento** -> **[Nome do Aparelho]** -> **B2 Wallet**. Isso abrirá o Web Inspector dedicado para JavaScript do iOS.
  - **Logs Nativos (Swift/Obj-C)**: Acompanhe a janela de console do **Xcode** durante a execução do app para verificar erros de memória e chamadas do sistema Apple.

---

## ⚠️ Avisos, Erros Comuns e Resolução de Problemas

### 1. Erro de CSP (Content Security Policy) na Extensão
* **Sintoma**: O console exibe a mensagem `Refused to execute inline script because it violates the following Content Security Policy directive...`.
* **Causa**: O Google Chrome proíbe estritamente a execução de JavaScript embutido em tags HTML (ex: `<button onclick="alert('bug')">`) nas extensões baseadas no Manifest V3.
* **Resolução**: Remova o atributo `onclick` do HTML e adicione o ouvinte via script JS na inicialização:
  ```javascript
  document.getElementById('id-do-botao').addEventListener('click', handler);
  ```

### 2. Falha de Compilação do Tauri (Rust / Cargo não encontrado)
* **Sintoma**: `tauri: command not found` ou erro ao tentar compilar com Cargo.
* **Causa**: O ambiente de desenvolvimento local não possui o compilador Rust ou as ferramentas de compilação C++ necessárias para a sua plataforma.
* **Resolução**:
  - **macOS / Linux**: Instale o Rust via terminal rodando:
    ```bash
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    ```
  - **Windows**: Baixe o instalador do Rust em [rustup.rs](https://rustup.rs) e certifique-se de instalar o pacote Build Tools para Visual Studio com suporte a C++.

### 3. Desalinhamento de Chaves de Tradução (I18n)
* **Sintoma**: Textos exibindo chaves brutas como `{{selectValidator}}` ou `tabFeatures` em vez do texto traduzido.
* **Causa**: Nova propriedade inserida na interface, mas ausente no dicionário global de traduções de algum idioma.
* **Resolução**: Rode o script de análise integrado para rastrear inconsistências automaticamente:
  ```bash
  node scratch/check_missing_keys.js
  ```
  Ele apontará instantaneamente qual idioma está incompleto e quais chaves precisam ser preenchidas em `src/js/i18n/translations.js`.

---

## 🔍 Ferramentas de Auditoria e Verificação Integradas

Antes de enviar qualquer código para o repositório principal ou gerar versões de distribuição pública, execute as auditorias padrão do sistema de automação para mitigar riscos de segurança e quebra de código:

```bash
# 1. Executa a suíte de 422 testes integrados (Rust Core + JS/Node Engines)
make test

# 2. Executa a auditoria de estilo de código e erros sintáticos
make lint

# 3. Limpa todas as compilações e gera as distribuições multiplataformas zeradas
make clean && make deploy-all
```
