# Passo 1: Configuração do Monorepo, Turborepo e Core em Rust
---

Este documento detalha o processo de especificação de engenharia, criação do repositório monorepo unificado utilizando **Turborepo** e a infraestrutura do **Core de Regras Criptográficas em Rust** para o ecossistema multiplataforma da **B2 Wallet**.

Desenvolvido sob a coordenação do **Tech Lead Diego Oris (Better2Better)**.

---

## 1. Visão Geral da Arquitetura do Monorepo

Para manter a integridade, compatibilidade de tipos TypeScript e facilitar a compilação do aplicativo para múltiplos canais (iOS, Android, Desktop e Extensão de Navegador), optamos por uma arquitetura de **Monorepo** gerenciada através do **Turborepo**.

O repositório é segmentado em workspaces isolados de alto nível:

```
b2-wallet/
├── apps/
│   ├── extension/          # Extensão de Navegador (Chrome, Firefox, Opera, Edge - React)
│   ├── desktop/            # Aplicativo Desktop (Tauri v2 + React)
│   └── mobile/             # Aplicativo Mobile (Capacitor/React Native)
├── packages/
│   ├── core-rust/          # Módulo Rust Principal (Compilável para WebAssembly e C-bindings)
│   ├── database/           # Lógica local de cache e dados de nós customizados
│   ├── sdk-web3/           # SDK e Provedor Injetado B2 Wallet (`window.b2wallet`)
│   └── ts-config/          # Configuração compartilhada de TypeScript, ESLint e Prettier
├── package.json
└── turbo.json
```

### 1.1 Configuração do `turbo.json`

O arquivo `turbo.json` orquestra o pipeline de compilação inteligente e o cache das tarefas entre o core em Rust e os aplicativos de interface:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**", "pkg/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## 2. Estruturação do Core de Regras Criptográficas em Rust (`packages/core-rust`)

O Core da carteira é escrito em **Rust** para garantir velocidade, imunidade a vulnerabilidades de concorrência de memória (Memory Safety) e blindagem contra vazamento de buffers. O módulo realiza as tarefas de:

1. Derivação de entropia e validação linguística BIP-39.
2. Derivação de chaves privadas hierárquicas determinísticas (BIP-32/BIP-44) para as curvas elípticas `secp256k1`, `ed25519` e `sr25519`.
3. Algoritmo KDF robusto utilizando `Argon2id` para endurecimento e derivação simétrica de chaves.
4. Cifragem simétrica autenticada via `AES-256-GCM` de payloads.

### 2.1 Configuração do `Cargo.toml` (`packages/core-rust/Cargo.toml`)

```toml
[package]
name = "b2-wallet-core"
version = "0.1.5"
edition = "2021"
authors = ["Diego Oris <better2better.com.br>"]

[lib]
crate-type = ["cdylib", "staticlib"]

[dependencies]
wasm-bindgen = "0.2.89"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
aes-gcm = "0.10.3"
argon2 = { version = "0.5.2", features = ["std"] }
bip39 = { version = "2.0.0", features = ["rand"] }
secp256k1 = { version = "0.28.0", features = ["rand"] }
ed25519-dalek = "2.1.0"
rand = "0.8.5"
getrandom = { version = "0.2", features = ["js"] } # Necessário para rodar getrandom em WebAssembly

[profile.release]
opt-level = "s" # Otimizado para tamanho de pacote
lto = true
codegen-units = 1
```

---

## 3. Estratégia de Cross-Compilation Multiplataforma

A flexibilidade do código Rust permite compilá-lo em dois formatos cruciais para o ecossistema:

### 3.1 Compilação para WebAssembly (`wasm-pack`)
Utilizada na **Extensão de Navegador** e no renderizador de visualização do **Tauri Desktop**:
```bash
# Executado dentro de packages/core-rust
wasm-pack build --target web --out-dir ../../packages/sdk-web3/pkg
```
A compilação resulta em um arquivo binário `.wasm` otimizado e arquivos JS glue-code de alta eficiência que importam diretamente as funções de criptografia no frontend do React.

### 3.2 Compilação de Bibliotecas Estáticas (`C-Bindings`)
Utilizada pelos aplicativos móveis nativos (**iOS e Android**) para interagir diretamente com o motor nativo Swift ou Kotlin através do **FFI (Foreign Function Interface)**:
* **iOS**: Rust compila para a arquitetura `aarch64-apple-ios` gerando um arquivo estático `.a`. Usando a ferramenta `cbindgen`, geramos os headers C (`.h`) e criamos um pacote Swift em Xcode que encapsula a lógica.
* **Android**: Rust compila utilizando o NDK do Android para os targets `aarch64-linux-android` e `armv7-linux-androideabi`, gerando arquivos de biblioteca dinâmica `.so` que são chamados via JNI (Java Native Interface).

---

## 4. Auditoria de Autoria e Código Limpo

Este módulo foi projetado em conformidade com as regras de desenvolvimento estrito do time Better2Better:
* **Zero Código IA/Mock**: Nenhuma biblioteca ou implementação faz referência a assistentes virtuais ou utiliza saldos fixos ("mock balance"). Todo o fluxo de geração e derivação é 100% testável localmente.
* **Proteção de RAM**: Toda chave privada ou seed alocada em Rust utiliza o trait `Zeroize` para limpar fisicamente o conteúdo da memória RAM assim que o objeto sai do escopo, mitigando vazamento por inspeção de core dumps ou ataques de dump de memória.

---

**Better2Better - Tecnologia Confiável e Descentralizada**
*(c) 2026 better2better.com.br - Todos os direitos reservados.*
