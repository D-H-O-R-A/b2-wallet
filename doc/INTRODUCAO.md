# Arquitetura e Engenharia de Software - B2 Wallet

A **B2 Wallet** é uma carteira de criptomoedas de auto-custódia (não-custodial) e multiplataforma de última geração. Sob a liderança técnica do **Tech Lead Diego Oris (Better2Better)** e desenvolvida por uma equipe de engenharia sênior altamente qualificada, o projeto foi concebido sob os mais rigorosos padrões de segurança, escalabilidade, portabilidade e eficiência.

Este documento introduz a arquitetura do ecossistema B2 Wallet e o mapeamento técnico para suportar execução em múltiplos ambientes (iOS, Android, macOS, Windows, Linux e Extensões de Navegador) com uma base de código unificada de alto desempenho.

---

## 1. Visão Geral do Sistema

A B2 Wallet foi projetada utilizando a filosofia de **"Core Isolado com Adaptadores de Ambiente"**. Toda a lógica criptográfica profunda, gestão de estado, internacionalização e o barramento do SDK residem em uma camada puramente independente escrita em **JavaScript/TypeScript ECMAScript Avançado**. 

```
                                  +------------------------------------+
                                  |         B2 WALLET RUNTIMES         |
                                  | (iOS, Android, Desktop, Extension) |
                                  +-----------------+------------------+
                                                    |
                                                    v
                                  +-----------------+------------------+
                                  |       INTERFACE DE RENDERIZAÇÃO    |
                                  |   HTML5 + CSS Glassmorphism V2     |
                                  +-----------------+------------------+
                                                    |
                                                    v
+---------------------------------------------------+---------------------------------------------------+
|                                       B2 WALLET CORE ENGINE                                           |
+--------------------------+---------------------------+-----------------------+------------------------+
|    CAMADA DE SEGURANÇA   |    DERIVAÇÃO DE CHAVES    |   SISTEMA DE ESTADO   |   SDK COMPATIBILIDADE  |
|  AES-256-GCM / Argon2id  |    BIP-39 / BIP-44 (17)   |   Auto-lock / Session |   window.b2wallet Web3 |
+--------------------------+---------------------------+-----------------------+------------------------+
                                                    |
                                                    v
                                  +-----------------+------------------+
                                  |       PONTES NATIVAS DE HARDWARE   |
                                  |    (Secure Enclave / KeyStore)     |
                                  +------------------------------------+
```

### 1.1 Objetivos de Engenharia
* **Código 100% Open Source**: Permitir a qualquer auditor de segurança validar que a semente (seed phrase) do usuário é gerada e armazenada estritamente de forma local, sem qualquer transmissão a servidores externos.
* **Segurança Militar**: Uso estruturado de cifragem AES-256-GCM combinada com a função de derivação de chaves resistente a ataques por força bruta (Argon2id).
* **Compatibilidade Multichain**: Derivação direta baseada em uma semente para chaves assimétricas em múltiplas curvas elípticas (Secp256k1, Ed25519, Sr25519) atendendo a 17+ blockchains nativamente.
* **Design Luxuoso & Acessível**: Interface glassmorphic baseada nas especificações exclusivas da engenharia UI-UX-Pro, com suporte a 7 idiomas integrados.

---

## 2. Abordagem Multiplataforma (Compilação Unificada)

Para atingir a compilação do ecossistema B2 Wallet para todos os sistemas operacionais mantendo segurança nativa máxima, a arquitetura utiliza a seguinte matriz tecnológica:

### 2.1 Aplicativo Mobile (iOS & Android)
A base de código HTML/JS/CSS é empacotada através do **Capacitor**. 
* **Pontes Nativas**: No iOS, as chaves de criptografia são armazenadas de forma segura dentro do **Secure Enclave** usando APIs Swift (`Security` e `LocalAuthentication`). No Android, o aplicativo delega a segurança da chave de decifragem para o **Android Keystore** e solicita autenticação biométrica via `BiometricPrompt`.
* **Proteção de Memória**: O ciclo de vida do aplicativo móvel escuta eventos de suspensão (`pause`) para apagar chaves decifradas da RAM imediatamente e restaurar o estado bloqueado (*Auto-Lock*).

### 2.2 Aplicativo Desktop (macOS, Windows, Linux)
A compilação desktop é gerenciada via **Tauri v2**.
* **Eficiência Extrema**: Tauri utiliza o motor Webview nativo de cada sistema operacional (WebKit no macOS, WebView2 no Windows e WebKitGTK no Linux), evitando a sobrecarga de memória característica do Electron.
* **Segurança Rust**: O backend escrito em Rust realiza a comunicação de baixo nível com o chaveiro nativo de credenciais (macOS Keychain, Windows Credential Vault e GNOME Keyring/KWallet no Linux).

### 2.3 Extensão de Navegador (Chrome, Firefox, Opera, Edge)
Empacotado nativamente como uma **Web Extension (Manifest V3)**.
* **Sandbox Isolado**: A extensão opera no popup da barra de ferramentas, onde o estado é isolado de scripts maliciosos de terceiros.
* **Páginas de Fundo (Service Workers)**: O gerenciamento de requisições de dApps externas é processado de forma assíncrona, exigindo confirmações visuais em janelas seguras e bloqueando cliques fantasmas.

---

## 3. Estrutura de Equipe e Responsabilidades

O projeto foi dividido entre quatro engenheiros seniores liderados pelo Tech Lead Diego Oris:

1. **Sênior 1 (Especialista em Segurança & Criptografia)**: Responsável pela implementação do gerador de entropia BIP-39, validações de chaves, criptografia AES-256-GCM e parametrização do Argon2id.
2. **Sênior 2 (Especialista em Integração de Blockchain & Redes)**: Responsável pelos cálculos matemáticos de curvas de chaves, derivações e formatos de endereçamento específicos de cada uma das 17 redes suportadas.
3. **Sênior 3 (Engenheiro de Front-end & UI/UX)**: Implementou o layout responsivo glassmorphic, micro-animações, suporte multilíngue (7 idiomas) e os temas claro/escuro.
4. **Sênior 4 (Especialista em SDK & Integração Web3)**: Concepção da ponte de comunicação RPC e da biblioteca `window.b2wallet` para injeção de dApps, permitindo a conexão de sites de forma idêntica à MetaMask.
5. **Tech Lead Diego Oris**: Arquitetura geral do sistema, garantia de conformidade com os guias de auditoria da Apple, estruturação de pontes nativas e validação de segurança de ponta a ponta.

---

Este projeto é desenvolvido com orgulho e focado em redefinir a soberania financeira digital dos usuários.

**Better2Better - Tecnologia Confiável e Descentralizada**
*(c) 2026 better2better.com.br - Todos os direitos reservados.*
