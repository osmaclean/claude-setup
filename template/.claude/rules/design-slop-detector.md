# Design Slop Detector

> **Escopo:** lista de detecções **determinísticas** (regex/AST) que o `@design-qa` executa **antes** do review LLM. Inspirada na ideia das "rules deterministic" do Impeccable, mas internalizada como rule do projeto — sem dep externa, sem plugin.
>
> **Por que existe:** o LLM review do `@design-qa` é probabilístico. Anti-patterns conhecidos (gradient text, paleta AI, glassmorphism aleatório) escapam de tempos em tempos. Esta rule garante que essas detecções **sempre** rodem, independente do mood do modelo. Findings determinísticos viram primeira camada do relatório; LLM cobre o que sobrar.
>
> **Filosofia:** o detector é cético, não tirano. Cada regra tem **exceções válidas** explícitas. O agente reporta finding; a justificativa de exceção (quando legítima) entra como waiver com motivo registrado. Detector não bloqueia coisa boa — só obriga consciência.

## Como o `@design-qa` usa

**Antes** de qualquer LLM review:

1. Para cada regra abaixo, executar o `pattern` via Grep no diff (ou no projeto inteiro em modo `pre-release`).
2. Para cada match, abrir o arquivo no contexto e validar:
   - É um falso positivo? (regra `match` mas `exceções válidas` aplicam) → ignorar, registrar como `auto-dismissed` com motivo.
   - É um match real? → emitir finding com `severity default`, `fingerprint` determinístico, `hint` de fix.
3. **Só então** começar a passada LLM (fidelidade vs spec, hierarquia, tom).

**Fingerprint determinístico:** `sha1(rule_id + file + line_anchor)`. Mesmo finding em re-run dá mesmo fingerprint.

**Reporte** a passada determinística em seção própria do relatório, separada da LLM. Exemplo:
```
### Detecções automáticas (slop detector)
- [ALTO | rule:gradient-text] components/Hero.tsx:42 — gradient em headline. Anti-pattern AI. Fix: cor sólida do token --foreground ou --accent.

### Auditoria LLM (fidelidade vs spec)
- [MÉDIO | confidence: high] ...
```

## Como o `@designer` usa (opcional)

Antes de propor spec, conferir esta lista pra não sugerir algo que vai cair em detecção. Se for proposital, justificar na spec.

## Como rodar fora do agente (CI)

`scripts/design-detect.mjs` (se existir no projeto) implementa as mesmas regras como CLI. Roda em CI como gate. Sem agente, sem LLM.

---

## Regras

### `gradient-text`
- **Severity default:** ALTO
- **Pattern Grep** (TS/TSX): `bg-gradient-to-[a-z]+.*?(text-transparent|bg-clip-text)`
- **Justificativa:** gradiente em texto é AI-tell clássico. Lê ruim em dark, acessibilidade ruim (contrato AA falha em metade do texto), raramente é decisão consciente de marca.
- **Exceções válidas:**
  - Wordmark/logo se documentado em DESIGN.md
  - Splash/onboarding único com motivo registrado
- **Hint de fix:** cor sólida do token (`text-foreground`, `text-accent`).

### `ai-color-palette`
- **Severity default:** MÉDIO
- **Pattern Grep:** `from-(purple|pink|fuchsia|violet|indigo)-\d+\s+(via-\w+-\d+\s+)?to-(purple|pink|fuchsia|violet|indigo|blue)-\d+`
- **Justificativa:** gradiente purple→pink→blue é a paleta default que LLMs produzem por viés. Sem identidade própria.
- **Exceções válidas:**
  - Token explícito da marca (rara mas possível) documentado em DESIGN.md
- **Hint de fix:** usar tokens do projeto (`--accent`, `--accent-soft`).

### `glassmorphism-misplaced`
- **Severity default:** MÉDIO
- **Pattern Grep:** `backdrop-blur(?!-(none|0))` em arquivo que **não** contém `modal|drawer|nav|sheet|popover|overlay` no path nem como classe próxima
- **Justificativa:** vidro fosco em card comum lê ruim, custa GPU, e é decoração sem função. Aceitável em modal/drawer/nav onde sobrepõe conteúdo real.
- **Exceções válidas:**
  - `Navbar`, `MobileBottomNav`, qualquer `dialog`/`drawer`
  - Loading skeleton sobre conteúdo real
- **Hint de fix:** remover `backdrop-blur` ou trocar por background sólido com `bg-surface/95`.

### `hardcoded-color`
- **Severity default:** ALTO
- **Pattern Grep:** `(text|bg|border|ring|fill|stroke|from|to|via)-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+\b`
- **Justificativa:** cor de palette Tailwind direta no JSX bypassa o design system. Mudança de tema/marca exige caça nos arquivos.
- **Exceções válidas:**
  - QR code (`bg-white` + `text-black` exigido pelo scanner, documentado)
  - `text-white` num botão `bg-accent` onde a variant é controlada (caso a token `--on-accent` não exista)
  - SVG icon decorativo sem tema (raro)
- **Hint de fix:** trocar pelo token semântico (`text-foreground`, `bg-surface`, `border-border`, `text-accent`).

### `hex-color-literal`
- **Severity default:** ALTO
- **Pattern Grep:** `#[0-9a-fA-F]{3,8}\b` em `.tsx`/`.ts` fora de comentário (ignora `.css`/`globals.css` que definem tokens)
- **Justificativa:** hex literal num componente é fuga total do design system. Pode até parecer igual ao token, mas drift acontece em silêncio.
- **Exceções válidas:**
  - Comentário ilustrativo do token usado
  - Cor exigida por contrato externo (QR scanner, OG image)
- **Hint de fix:** mover pro CSS de tokens, expor como var, usar `text-[var(--name)]` ou criar token Tailwind.

### `inline-style-color`
- **Severity default:** MÉDIO
- **Pattern Grep:** `style=\{\{[^}]*?(color|backgroundColor|borderColor|fill|stroke)\s*:`
- **Justificativa:** inline style com cor bypassa Tailwind e tokens. Geralmente apareceu porque alguém quis "rápido" e ficou.
- **Exceções válidas:**
  - Cor dinâmica genuinamente computada (avatar gerado, animação)
- **Hint de fix:** usar classe Tailwind ou variável CSS via `style={{ '--var': value }}`.

### `arbitrary-typo-scale`
- **Severity default:** BAIXO
- **Pattern Grep:** `text-\[(\d+|0?\.\d+)(px|rem|em)\]`
- **Justificativa:** valor arbitrário fora da scale (`text-xs/sm/base/lg/xl/...`) sinaliza decisão fora do sistema. Às vezes legítimo (micro-typography 10-11px em chip/legend), mas digno de finding pra revisar.
- **Exceções válidas:**
  - Micro-typography documentada (chip, legenda, badge ≤ 11px)
  - Hero/display fora da escala padrão com decisão registrada
- **Hint de fix:** usar `text-xs/sm/base/...`; se o tamanho é fora da escala, documentar como variant.

### `focus-without-visible`
- **Severity default:** ALTO
- **Pattern Grep:** elemento interativo (`<button|<a|<Link|role="button"|role="link"`) com classe `hover:` **sem** classe `focus-visible:` próxima
- **Justificativa:** componente que reage a mouse mas não dá feedback de foco quebra navegação por teclado e screen reader. Acessibilidade obrigatória.
- **Exceções válidas:**
  - Elemento ENVOLTO em componente parent que já aplica focus-visible (raro, evitar)
- **Hint de fix:** adicionar `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background` (ou token equivalente do projeto).

### `transition-all-lazy`
- **Severity default:** BAIXO
- **Pattern Grep:** `\btransition-all\b`
- **Justificativa:** `transition-all` anima TUDO inclusive layout (width, height, position) — custa GPU, dá pulos visuais, e é preguiça. Quase sempre o autor quis `transition-colors` ou `transition-transform`.
- **Exceções válidas:**
  - Container que genuinamente anima múltiplas propriedades não-layout (raro)
- **Hint de fix:** trocar por `transition-colors`, `transition-transform`, ou `transition-opacity` conforme a intenção real.

### `important-abuse`
- **Severity default:** MÉDIO (escala ALTO se ≥3 ocorrências no mesmo arquivo)
- **Pattern Grep:** `!\w+(-\w+)*\b` em className (Tailwind `!` important prefix)
- **Justificativa:** `!important` resolve briga de specificity mas em quantidade indica problema arquitetural (variant mal definida, design system inconsistente).
- **Exceções válidas:**
  - Workaround documentado contra bug específico (link pro issue ou commit que explica)
  - Sobrescrever lib third-party (driver.js, sonner, framer-motion) com motivo
- **Hint de fix:** se padrão se repete, criar variant no componente base; se one-off, documentar o porquê.

### `shadow-stacking`
- **Severity default:** BAIXO
- **Pattern Grep:** múltiplos `shadow-(2xl|inner|drop-shadow)` no mesmo arquivo
- **Justificativa:** sombras empilhadas é decoração sem função. Profundidade na UI tem que ser sistêmica (1-2 níveis), não cada card escolhe a sua.
- **Exceções válidas:**
  - Modal/popover único com shadow elevada
  - Card de elevação especial documentado
- **Hint de fix:** usar 1-2 níveis canônicos do sistema (ex: `shadow` pra rest, `shadow-md` pra hover).

### `redundant-md-hidden-block`
- **Severity default:** BAIXO
- **Pattern Grep:** mesmo componente aparece como `md:hidden` e `hidden md:block` no mesmo arquivo (dois branches CSS-swap)
- **Justificativa:** CSS-swap mobile/desktop com componente quase idêntico é overhead de DOM e duplicação. Às vezes correto (hydration safety), às vezes preguiça.
- **Exceções válidas:**
  - Hydration safety crítica (já vimos no Heatmap dual-render — propositalmente)
  - Componente realmente diferente entre breakpoints, não só "menor"
- **Hint de fix:** considerar `useMediaQuery` SSR-safe, container query, ou componente único responsivo.

### `emoji-as-icon`
- **Severity default:** BAIXO
- **Pattern Grep:** caracteres unicode de emoji em JSX/className posicionados como ícone (não dentro de mensagem i18n)
- **Justificativa:** emoji renderiza diferente entre OS, não responde a tema, não escala. Ícone deveria ser SVG (Lucide).
- **Exceções válidas:**
  - Mensagem i18n com emoji de conteúdo (`🎉 Streak!`)
  - Avatar placeholder explícito
- **Hint de fix:** trocar por Lucide icon (`<Star />`, `<Flame />`, etc).

### `ring-outline-overlap`
- **Severity default:** MÉDIO
- **Pattern Grep:** elemento com `ring-` **e** `outline-` no mesmo className (ambos visíveis)
- **Justificativa:** dois focus indicators competindo dão visual confuso e bug de acessibilidade.
- **Exceções válidas:**
  - `outline-none` + `ring-2` (cancelando outline pra usar ring) — válido, não é match
- **Hint de fix:** escolher um. Convenção: `outline-none focus-visible:ring-2`.

### `border-decorative-arbitrary`
- **Severity default:** BAIXO
- **Pattern Grep:** `border-(l|r|t|b)-(\d+)` com `\d+ >= 4` (border-l-4 etc), sem ser parte de variant tipada
- **Justificativa:** stripe decorativo de 4-8px de borda lateral é estética de blog 2010. Em design moderno, indicação visual usa cor de fundo ou ícone.
- **Exceções válidas:**
  - Alert/callout com convenção estabelecida (warning, info, success)
- **Hint de fix:** usar `bg-warning-soft border-l-2 border-warning` consistentemente ou trocar por ícone + label.

---

## Resumo das severities default

| Rule | Severity | Tipo |
|---|---|---|
| `gradient-text` | ALTO | AI-tell |
| `ai-color-palette` | MÉDIO | AI-tell |
| `glassmorphism-misplaced` | MÉDIO | decoração |
| `hardcoded-color` | ALTO | system bypass |
| `hex-color-literal` | ALTO | system bypass |
| `inline-style-color` | MÉDIO | system bypass |
| `arbitrary-typo-scale` | BAIXO | system bypass |
| `focus-without-visible` | ALTO | a11y |
| `transition-all-lazy` | BAIXO | perf/preguiça |
| `important-abuse` | MÉDIO | arquitetura |
| `shadow-stacking` | BAIXO | decoração |
| `redundant-md-hidden-block` | BAIXO | overhead |
| `emoji-as-icon` | BAIXO | inconsistência |
| `ring-outline-overlap` | MÉDIO | a11y |
| `border-decorative-arbitrary` | BAIXO | datado |

15 regras. Adicione novas com `### nome-em-kebab` + os 5 campos (severity / pattern / justificativa / exceções / hint). Mantenha **as exceções listadas explicitamente** — regra sem exceção vira tirania.

## Manutenção

- Severities podem ser ajustadas por projeto via override no DESIGN.md do projeto (seção `slop-overrides`).
- Detectar falso positivo recorrente? Refine o pattern ou registre exceção explícita aqui.
- Detectar padrão novo que escapou? Adicione a regra. Severity default conservadora primeiro (BAIXO/MÉDIO), escala se reincidir.
