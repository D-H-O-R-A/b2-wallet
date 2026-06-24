# Engenharia de Segurança Criptográfica - B2 Wallet

A segurança é o pilar fundamental da **B2 Wallet**. O projeto foi concebido sob a premissa de que o usuário possui controle absoluto e exclusivo sobre seus dados e chaves criptográficas. A B2 Wallet foi projetada seguindo as melhores práticas de segurança disponíveis atualmente na indústria financeira e criptográfica.

Este documento detalha as abordagens matemáticas e os mecanismos de segurança implementados pelo time de desenvolvimento sob a supervisão do **Tech Lead Diego Oris (Better2Better)**.

---

## 1. Derivação de Chaves Baseada em Memória (Argon2id)

Para proteger a carteira contra ataques brute-force (força bruta) focados na decodificação do armazenamento local, a senha do usuário não é diretamente utilizada como chave de criptografia. Em vez disso, aplicamos um processo rigoroso de endurecimento (*Key Stretching*) usando a função **Argon2id**.

### 1.1 Por que Argon2id?
O Argon2id é o vencedor da *Password Hashing Competition* (PHC) e é altamente recomendado devido à sua resistência a ataques de canal lateral e hardware dedicado (ASIC/GPU). Como um algoritmo *memory-hard*, ele exige uma quantidade massiva de memória RAM física para processar cada tentativa, tornando financeiramente e tecnologicamente inviável o uso de fazendas de GPUs para quebrar senhas.

### 1.2 Parâmetros de Nível Militar Utilizados
Na B2 Wallet, para garantir que o processo rode de forma eficiente em dispositivos móveis modernos sem comprometer a usabilidade, os parâmetros de derivação são configurados da seguinte forma:
* **Tempo de Iteração ($t$)**: $3$ passos sobre a memória para garantir o endurecimento contra ASICs.
* **Memória de Trabalho ($m$)**: $65536 \text{ KB}$ (64 MB) de RAM por processo de derivação.
* **Grau de Paralelismo ($p$)**: $4$ threads dedicadas para o processamento.
* **Comprimento da Chave Resultante**: 256 bits (32 bytes), ideal para cifradores AES.

No ambiente web e extensões de navegador, quando o Argon2id nativo não está disponível por restrições de sandbox de API, a B2 Wallet utiliza um mecanismo alternativo baseado em **Scrypt** e **PBKDF2-HMAC-SHA256** com no mínimo $100.000$ iterações, oferecendo uma defesa extremamente robusta em navegadores convencionais.

---

## 2. Cifragem Simétrica de Alto Desempenho (AES-256-GCM)

A semente de recuperação (seed) gerada pelo gerador de entropia seguro da B2 Wallet é salva localmente sob cifragem **AES-256-GCM** (*Advanced Encryption Standard - Galois/Counter Mode*).

### 2.1 Visão Geral do AES-GCM
Diferente dos modos de operação clássicos (como CBC), o GCM fornece criptografia autenticada. Isso significa que, além de garantir a confidencialidade dos dados, ele fornece garantia matemática de que os dados cifrados não foram modificados por terceiros no armazenamento local (*Autenticação Integrada*).

```
+----------------------------------------------------------------------------------------+
|                                  FLUXO DE CIFRAGEM                                     |
+----------------------------------------------------------------------------------------+
 [Seed em Texto Limpo (12/24 palavras)] + [Chave Derivada de 256-bits (Argon2id)] + [IV (12 bytes)]
                                       |
                                       v
                             Cifragem AES-256-GCM
                                       |
                                       +--------------> [Texto Cifrado (Hex)]
                                       +--------------> [Tag de Autenticação (16 bytes)]
```

### 2.2 Estrutura de Dados Salva (Payload Criptografado)
O objeto salvo de forma estritamente local (`localStorage` no navegador, ou banco nativo criptografado nos celulares) segue a estrutura JSON abaixo:
```json
{
  "ciphertext": "a9f87cde...",
  "iv": "d3b07394c8e71a0293d482ff",
  "tag": "e93f8e72c846d0124817a0de38ff91ea",
  "salt": "f3b0c82de94751ab",
  "kdf": "argon2id"
}
```
* **iv (Vector de Inicialização)**: Gerado aleatoriamente usando entropia criptográfica nativa para cada operação de cifragem. *NUNCA* reutilizamos o mesmo IV.
* **tag (Tag de Autenticação GCM)**: Assinatura de 16 bytes que valida a integridade do payload durante a decifragem. Se um único bit do payload cifrado for adulterado, o processo de decifragem falhará instantaneamente, protegendo o usuário de ataques de injeção de falhas.

---

## 3. Integração com Hardware de Segurança Nativo

Quando empacotada para sistemas operacionais nativos, a B2 Wallet ativa integrações diretas de hardware físico:

### 3.1 Secure Enclave (iOS & macOS)
O **Secure Enclave** é um subsistema de hardware seguro isolado do processador principal. No iOS e macOS:
* A chave privada de criptografia gerada a partir da autenticação biométrica (Face ID / Touch ID) é criada e mantida estritamente dentro do Secure Enclave.
* O sistema de arquivos principal do celular nunca tem acesso à chave biométrica real. Ele apenas envia solicitações de decodificação para o Enclave, que retorna o resultado de forma isolada, impedindo que vulnerabilidades de nível de sistema de arquivos vazem segredos.

### 3.2 Android Keystore System
No ecossistema Android:
* A chave é gerada com o algoritmo AES de especificação Keystore e protegida com restrições de autenticação do usuário (`setUserAuthenticationRequired(true)`).
* O aplicativo exige a presença de um chip de segurança físico dedicado (StrongBox ou Trusted Execution Environment - TEE) para a custódia das chaves simétricas.

---

## 4. Táticas de Segurança Ativa e Defesa em Tempo Real

Para assegurar uma postura de segurança proativa contra roubo de chaves e espionagem física ou por software malicioso, a B2 Wallet implementa:

### 4.1 Bloqueio Automático (Auto-Lock)
* **Memória Volátil**: As chaves privadas decifradas e a semente limpa permanecem em variáveis na memória RAM pelo menor tempo possível. Após qualquer transação ou operação, a memória é imediatamente sobrescritas por zeros binários.
* **Inatividade**: Um temporizador em segundo plano monitora as interações do usuário. Caso o app fique inativo pelo tempo estipulado pelo usuário (padrão: 5 minutos, limite máximo de 30 minutos), todo o estado de sessão é deletado da RAM e a interface de login é reexibida.
* **Ciclo de Vida**: O app bloqueia automaticamente se a tela do dispositivo for apagada, se a aba do navegador for recarregada ou se o app móvel for minimizado.

### 4.2 Defesa Anti-Screenshot (Bloqueio de Captura de Tela)
* **Android**: Configuração da flag do sistema `WindowManager.LayoutParams.FLAG_SECURE` nas atividades principais, impedindo que o sistema operacional grave a tela ou que o usuário tire capturas acidentais de sementes e chaves privadas.
* **iOS**: Ocultação de subvisões sensíveis em buffers de renderização de vídeo nativos utilizando técnicas de campos de texto seguros (`isSecureTextEntry`).
* **Interface Web & Extensões**: Aplicação de um filtro de desfoque pesado (`filter: blur(25px);`) em toda a tela sensível de sementes imediatamente quando a janela do navegador perde o foco (`window.onblur`), além do bloqueio ativo dos eventos de teclado associados à tecla `PrintScreen`, cópias de menu contextual (`contextmenu`) e ferramentas de desenvolvimento de terceiros.

### 4.3 Exigência de Confirmação de Transação
* Cada solicitação de assinatura enviada pelo SDK ou dApp deve disparar um modal visual próprio da carteira.
* Se a sessão estiver aberta por menos de 30 minutos, o usuário poderá confirmar a ação digitando um PIN de acesso rápido de 6 dígitos.
* Se ultrapassar o tempo limite de 30 minutos ou para transações de altos valores, o aplicativo exige obrigatoriamente a redigitação da senha completa ou biometria nativa.

---

A B2 Wallet foi projetada seguindo as melhores práticas de segurança disponíveis atualmente, blindando cada vetor de ataque local e garantindo que o segredo de auto-custódia permaneça estritamente nas mãos do seu legítimo dono.

**Better2Better - Tecnologia Confiável e Descentralizada**
*(c) 2026 better2better.com.br - Todos os direitos reservados.*
