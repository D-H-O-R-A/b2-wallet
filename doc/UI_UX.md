# Filosofia de Design e UI/UX - B2 Wallet

A **B2 Wallet** foi projetada para unificar a complexidade criptográfica e multichain em uma interface de usuário extremamente simples, fluida e luxuosa. Seguindo as diretrizes estruturadas de design de alto padrão (padrão **UI-UX-Pro**), a experiência visual do usuário transmite confiança, segurança e controle soberano.

Este documento explica os princípios de design, paletas de cores, tipografia e decisões de usabilidade adotadas pela equipe sênior, sob o direcionamento criativo do **Tech Lead Diego Oris (Better2Better)**.

---

## 1. Princípios de Experiência do Usuário (UX)

Nossa equipe sênior definiu quatro regras inquebráveis para a experiência do usuário na B2 Wallet:

### 1.1 Simplicidade na Auto-Custódia
O ecossistema cripto assusta muitos usuários devido à complexidade técnica. A B2 Wallet quebra essa barreira:
* **Semente Única, Múltiplas Contas**: Em vez de gerenciar uma chave para cada blockchain, o usuário utiliza um fluxo unificado onde uma única semente deriva automaticamente todas as 17+ carteiras.
* **Onboarding Educativo**: O fluxo de criação de carteira não é apenas um processo de cliques. Ele ensina ativamente sobre a importância do backup local e a ausência absoluta de custódia da Better2Better.

### 1.2 Estilo de Interface Visual: Glassmorphism V2 (OLED Ready)
Adotamos o visual **Glassmorphism V2**, que consiste em cartões semitransparentes que flutuam sobre um gradiente de fundo dinâmico e escuro.
* **Profundidade Visual**: Painéis com desfoque de fundo de alta densidade (`backdrop-filter: blur(20px)`) criam uma hierarquia tridimensional elegante.
* **Contornos Brilhantes**: Bordas finas de `1px` com opacidades muito baixas (`border: 1px solid rgba(255, 255, 255, 0.08)`) dão aos elementos a aparência de vidro lapidado.
* **Gradientes de Brilho Sutil**: Iluminação atrás dos painéis para destacar elementos críticos, mantendo as emissões de luz do display no nível ideal para economizar bateria em telas OLED.

---

## 2. Paletas de Cores e Temas Nativos

Para garantir uma interface premium que agrada tanto a investidores tradicionais quanto a entusiastas de tecnologia avançada, desenvolvemos dois temas impecáveis com tokens de cores consistentes:

### 2.1 Tema Escuro (Midnight Cyber - Padrão)
Inspirado na sofisticação tecnológica e no conforto visual para uso prolongado:
* **Fundo de Tela (Background)**: `#08090C` (Cinza Espacial Profundo) fundindo-se em `#111319` (Preto Noite).
* **Painéis e Cards (Glass)**: `rgba(18, 20, 28, 0.7)` com `backdrop-filter: blur(20px)`.
* **Destaques / Acento Primário**: `#F59E0B` (Ouro Premium, transmitindo confiança financeira, estabilidade e valor).
* **Acento Secundário / Tech**: `#8B5CF6` (Roxo Neon / Violeta Cibernético, remetendo a contratos inteligentes, inovação e modernidade).
* **Textos**: Principal em `#F8FAFC` (Branco Puro); Secundário/Muted em `#94A3B8` (Slate).

### 2.2 Tema Claro (Alabaster Glass)
Desenvolvido para máxima legibilidade sob luz solar, sem perder o visual luxuoso de vidro:
* **Fundo de Tela (Background)**: `#F5F7FA` (Branco Alabastro) mesclando-se em `#E2E8F0` (Platina Soft).
* **Painéis e Cards (Glass)**: `rgba(255, 255, 255, 0.8)` com `backdrop-filter: blur(20px)`.
* **Destaques / Acento Primário**: `#D97706` (Ouro Escuro / Âmbar).
* **Acento Secundário / Tech**: `#7C3AED` (Violeta Royal).
* **Textos**: Principal em `#0F172A` (Slate Escuro); Secundário/Muted em `#475569` (Slate Médio).

---

## 3. Tipografia Futurista e de Alta Leitura

A tipografia é um elemento definidor na B2 Wallet. Combinamos duas fontes do catálogo Google Fonts para alcançar o equilíbrio ideal:

```
  CABEÇALHOS E IDENTIFICADORES (Blockchain & Ativos)
  ┌────────────────────────────────────────────────────────┐
  │                   O R B I T R O N                      │
  │  Visual moderno, angular, focado em tecnologia e web3   │
  └────────────────────────────────────────────────────────┘

  TEXTOS DE CORPO E ENTRADAS DE DADOS (PIN, Formulários)
  ┌────────────────────────────────────────────────────────┐
  │                      E X O   2                         │
  │   Excelente legibilidade, formas limpas, espaçamento   │
  │   confortável para números e hashes criptográficos     │
  └────────────────────────────────────────────────────────┘
```

* **Orbitron**: Aplicada em títulos, números de saldo e logotipos de moedas para evocar um sentimento futurista e cibernético.
* **Exo 2 / Inter**: Utilizada para textos corridos, legendas, inputs e exibição de endereços de carteiras, garantindo que o usuário consiga diferenciar claramente caracteres semelhantes (como `O` e `0`, ou `l` e `1`) durante as transações.

---

## 4. Micro-interações e Feedbacks de Segurança

* **Feedback Tátil Visual**: Ao interagir com pins de acesso ou copiar chaves públicas, a interface dispara animações de escala suave e alteração de cor temporária para verde esmeralda, confirmando o sucesso da ação sem a necessidade de alertas intrusivos.
* **Estado de Carregamento Ativo (Shimmer)**: No carregamento de ativos ou saldos, o aplicativo utiliza esqueletos pulsantes em gradiente (*shimmer loaders*) em vez de ícones de carregamento genéricos, mantendo a sensação de fluidez e velocidade.
* **Anti-Screenshot Blur**: Quando o aplicativo é minimizado ou perde o foco, um painel com desfoque pesado de `30px` cobre instantaneamente a tela inteira, exibindo a marca Better2Better e ocultando as informações de valor ou sementes de recuperação.

---

## 5. Checklist de Acessibilidade (WCAG Compliance)

Nossa equipe sênior de design seguiu estritamente as regras de acessibilidade WCAG 2.1:
1. **Contraste de Texto**: Todos os textos principais possuem uma proporção de contraste de no mínimo `4.5:1` em relação aos fundos de vidro, tanto no tema claro quanto no escuro.
2. **Navegação por Teclado**: Todo botão interativo e input possui estados focais visíveis e segue uma ordem de tabulação lógica para usuários que utilizam navegadores com leitores de tela ou teclados físicos.
3. **Sem Uso Exclusivo de Cores**: Erros ou validações críticas de senha nunca são indicados apenas por cores (como vermelho); eles sempre vêm acompanhados de ícones informativos e descrições textuais claras.

O design da B2 Wallet é a união perfeita de arte, marca, sofisticação e precisão técnica.

**Better2Better - Tecnologia Confiável e Descentralizada**
*(c) 2026 better2better.com.br - Todos os direitos reservados.*
