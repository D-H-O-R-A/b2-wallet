# Passo 2: Segurança Física, Criptografia e Pontes Nativas
---

Este documento técnico detalha as implementações matemáticas e estruturais adotadas na **B2 Wallet** para garantir a segurança de nível militar da semente de auto-custódia do usuário. O projeto foi projetado seguindo as melhores práticas de segurança disponíveis atualmente, sob a supervisão do **Tech Lead Diego Oris (Better2Better)**.

---

## 1. Processo de Derivação de Chave Baseado em Memória (Argon2id)

A senha de entrada criada pelo usuário passa por um processo de endurecimento e estiramento de chaves para evitar ataques de dicionário acelerados por hardware (GPU/ASIC). 

```
[Senha do Usuário (Texto)] + [Sal Criptográfico (16 bytes)]
                      |
                      v
             Argon2id (KDF)
     (m: 64MB, t: 3 passagens, p: 4 threads)
                      |
                      v
         [Chave Simétrica AES-256 (32 bytes)]
```

### 1.1 Configuração Matemática do Argon2id
O Argon2id combina a resistência a ataques de canal lateral do Argon2i com a resistência a ataques baseados em GPU do Argon2d.
* **$m = 65536$**: A memória de trabalho de 64 megabytes força o hardware atacante a alocar recursos físicos extensivos de RAM para cada tentativa.
* **$t = 3$**: Três passagens completas de hashing de bloco na RAM garantem a proteção contra paralelização espúria em chips integrados.
* **$p = 4$**: Distribuição em 4 threads independentes para otimizar processadores multinúcleo de smartphones e desktops modernos.

No adaptador Javascript (como no navegador e extensão), implementamos a derivação híbrida utilizando **PBKDF2-HMAC-SHA256** com salt randômico e $100.000$ iterações como alternativa de sandbox de navegador de alto contraste.

---

## 2. Cifragem Autenticada de Payloads (AES-256-GCM)

Os dados confidenciais do usuário (incluindo a semente mnemônica e chaves privadas ativas) são armazenados em disco exclusivamente na forma de payloads criptografados simetricamente por **AES-256-GCM**.

### 2.1 Por que AES-GCM?
O AES-GCM (Galois/Counter Mode) é um cifrador simétrico com autenticação integrada (AEAD - *Authenticated Encryption with Associated Data*). Ele fornece confidencialidade dos dados e, simultaneamente, cria uma assinatura matemática digital (Tag de Autenticação) que impede adulterações em disco.

### 2.2 Estrutura do Payload Criptografado JSON
```json
{
  "ciphertext": "e2c39fa9...",
  "iv": "3f8e72c846d0124817a0de38",
  "tag": "a9f87cde28ea30c71a39f046b0de8e17",
  "salt": "f3b0c82de94751ab",
  "kdf": "argon2id"
}
```
* **Ciphertext**: String hexadecimal dos dados cifrados.
* **IV (Vetor de Inicialização - 12 bytes)**: Gerado aleatoriamente por gerador de entropia física a cada nova escrita. A reutilização de IV no modo GCM destrói a integridade criptográfica; logo, a B2 Wallet impõe unicidade estrita do IV.
* **Tag de Autenticação (16 bytes)**: Se um único bit do payload salvo em disco for modificado de forma maliciosa por vírus ou invasores locais, a decifragem falhará instantaneamente com um erro de autenticidade estrutural, protegendo o app de ataques de injeção de falhas ou manipulação de memória flash.

---

## 3. Pontes Nativas de Hardware (iOS Secure Enclave & Android Keystore)

Nos ambientes nativos, a chave gerada pelo KDF não é mantida exposta. O sistema de arquivos delega o controle para os chips de segurança dedicados do hardware móvel:

### 3.1 Secure Enclave (iOS & macOS)
No ecossistema Apple, as chaves simétricas de criptografia local de chaves são mantidas no chip **Secure Enclave**:
* A chave privada de descriptografia é criada no enclave utilizando controle de acesso `kSecAccessControlBiometryAny` ou `kSecAccessControlDevicePasscode`.
* O processador principal do iPhone nunca tem acesso à chave criptográfica. O aplicativo B2 Wallet envia uma solicitação de decifragem que exige o sucesso biométrico (Face ID ou Touch ID). O enclave processa o resultado e devolve a semente decifrada de forma isolada na RAM temporária.

### 3.2 Android Keystore StrongBox
No ecossistema Android:
* A chave é gerada utilizando o `KeyGenParameterSpec` com suporte ao StrongBox TEE (Trusted Execution Environment), garantindo que as operações de chaves ocorram em hardware seguro fisicamente blindado.
* Exige biometria ativa por meio do componente nativo `BiometricPrompt` integrado com nível de segurança criptográfica `BIOMETRIC_STRONG`.

---

## 4. Táticas de Segurança Ativa

### 4.1 Auto-Lock Reativo
* **Destruição na RAM**: A semente e chaves privadas residem em formato aberto na memória RAM estritamente durante transações. Imediatamente após a assinatura, as variáveis do buffer são preenchidas com bytes nulos (`Zeroize`).
* **Temporizador de Inatividade**: O aplicativo monitora cliques e toques. Se inativo por mais de 5 minutos, encerra a sessão na RAM e navega visualmente para a tela de bloqueio.
* **Ciclo de Vida**: O bloqueio automático ocorre instantaneamente ao fechar a janela, minimizar o app móvel, recarregar a página ou desligar a tela do smartphone.

### 4.2 Defesa Ativa Contra Captura de Tela (Anti-Screenshot)
* **Android**: Configuração de segurança de atividade nativa via `FLAG_SECURE` para escurecer capturas de tela do sistema.
* **iOS**: Implementação de visualizações com mascaramento de campo seguro (`isSecureTextEntry`) que bloqueia a renderização em gravação de vídeo do iOS e AirPlay.
* **Web/Extensão**: Ouvinte reativo do evento `window.blur` aplicando desfoque visual pesado (`filter: blur(25px);`) em todas as sementes assim que a janela perde o foco. Bloqueio ativo dos atalhos de teclado do botão `PrintScreen`.

---

**Better2Better - Tecnologia Confiável e Descentralizada**
*(c) 2026 better2better.com.br - Todos os direitos reservados.*
