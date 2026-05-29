# {PROJECT_NAME} — Design System

> **Template:** preencha os blocos abaixo a partir do estado real do projeto. Este arquivo é a **source of truth** dos tokens, componentes e padrões visuais — lido pelo `@designer` e `@design-qa` antes de cada operação. Manter sincronizado com o código é responsabilidade do PR que muda UI.
>
> **Convenção:** este arquivo é **descritivo do estado real, não aspiracional**. Cada token/componente listado precisa existir e funcionar como descrito. Se a realidade mudou, este arquivo muda junto no mesmo PR.
>
> Para gerar o primeiro `DESIGN.md` a partir do código existente, peça ao `@designer`: "varra o projeto e proponha o DESIGN.md inicial". Depois revise.

## Identidade

- **Marca:** {NOME DO PRODUTO}
- **Tom visual:** {dark/light/dark-first, cor de marca, estilo (minimal/maximal/etc), grau de ornamento}
- **Tom de copy:** {técnico-amistoso, formal, próximo, etc; idioma primário}
- **Princípio:** {o que rege decisões — "token > literal", "variant > hack", "consistência > criatividade pontual", etc}

## Tokens

> Liste TODOS os tokens reais do projeto. Cada linha = `nome` + `valor default` + `uso canônico` (onde aplicar).

### Cores

| Token | Valor | Uso canônico |
|---|---|---|
| `--background` | | |
| `--foreground` | | |
| `--surface` | | |
| `--accent` | | |
| `--danger` | | |
| ... | | |

**Classes Tailwind equivalentes** (se aplicável): listar como os tokens são expostos via `@theme` ou config.

**Proibido** (regras do `design-slop-detector` aplicáveis):
- Classes de palette literal (`text-blue-500`, `bg-purple-700`) — rule `hardcoded-color`
- Hex em JSX/componente — rule `hex-color-literal`
- Cor via `style={{}}` inline — rule `inline-style-color`

### Tipografia

- **Família:** {nome da font + fallbacks}
- **Scale:** Tailwind default ou custom?
- **Tamanhos arbitrários permitidos:** {liste com motivo registrado, ex: `text-[10px]` para microtype específica — caso contrário, rule `arbitrary-typo-scale` flagra}
- **Pesos:** {liste pesos disponíveis}
- **Hierarquia padrão:**
  - h1: ...
  - h2: ...
  - body: ...

### Spacing & layout

- **Scale:** Tailwind default (4px base) ou custom?
- **Container principal:** {max-width}
- **Padding card / gap padrão:** {valores}

### Bordas, raios, sombras

- **Radius:** {convenção: small=md, default=lg, card=xl, modal=2xl, ou outra}
- **Border:** {convenção do projeto}
- **Shadow:** {níveis usados; empilhar múltiplos = rule `shadow-stacking`}

### Motion

- **Lib:** {framer-motion / motion-one / CSS keyframes / outra}
- **Durations:** {micro/padrão/longa, exemplos: 150/200/300ms}
- **Easing:** {spring config / cubic-bezier / ease-out}
- **`prefers-reduced-motion`:** obrigatório respeitar
- **`transition-all` é proibido** (rule `transition-all-lazy`) — usar transição específica (`transition-colors`, `transition-transform`)

### Acessibilidade

- **Focus ring canônico:** {classe ou padrão usado no projeto}
  - Toda interativa precisa de `focus-visible:` quando tem `hover:` (rule `focus-without-visible`)
- **Touch target:** mínimo 44×44 em mobile (WCAG); desktop pode reduzir se mouse-primário
- **Contraste:** AA mínimo (4.5:1 texto normal, 3:1 texto grande); medir os pares críticos

## Componentes

> Liste componentes REUTILIZÁVEIS do projeto. Para cada um: variants, props chave, classes de tokens, armadilhas conhecidas.

### `components/Button.tsx` (exemplo)

Variants:

| Variant | Uso | Classes principais |
|---|---|---|
| `primary` | | |
| `secondary` | | |
| `ghost` | | |
| ... | | |

Armadilhas conhecidas / patterns:
- (ex: SVG dentro de Button precisa de `inline-flex items-center justify-center !p-0` no className do consumer pra ficar centrado; padding default vence specificity)

### Outros componentes reutilizáveis

- `<NomeDoComponente>`: descrição do uso, variants, padrão de composição

## Padrões responsivos

- **Mobile-first** ou desktop-first?
- **Breakpoints canônicos:** {sm/md/lg/xl com valores}
- **Bottom nav / sticky header:** descrição do pattern e como o layout reserva espaço
- **PWA / safe-area:** se aplicável
- **CSS-swap mobile/desktop:** quando aceitável (hydration safety vs duplicação — rule `redundant-md-hidden-block`)

## Animações catalogadas

| Evento | Componente | Animação | Duração | Easing |
|---|---|---|---|---|
| | | | | |

Toda animação respeita `prefers-reduced-motion`.

## Exceções documentadas ao `design-slop-detector`

Ver `.claude/rules/design-slop-detector.md`. Aqui ficam **exceções específicas deste projeto** (com motivo registrado):

- `regra-X`: caso/arquivo/motivo
- ...

Exceção sem motivo registrado = finding na próxima auditoria.

## Anti-patterns (recap)

Detector roda automaticamente no `@design-qa` passada 1 — `.claude/rules/design-slop-detector.md` tem a lista completa. Highlights:

- Gradient em texto → ALTO
- Paleta AI (purple/pink/violet) → MÉDIO
- Glassmorphism em card comum → MÉDIO
- Cor de palette Tailwind literal → ALTO
- Hex literal em componente → ALTO
- `style={{ color }}` inline → MÉDIO
- Elemento interativo com `hover:` sem `focus-visible:` → ALTO
- `transition-all` → BAIXO
- `!important` repetido → MÉDIO
- Emoji como ícone fora de copy → BAIXO

## Manutenção deste documento

- Mudou token? Atualize a tabela.
- Adicionou variant? Liste aqui.
- Adicionou componente reutilizável? Documente pattern.
- Adicionou exceção válida ao detector? Registre aqui + na regra correspondente.

PR que mexe em UI sem atualizar este arquivo é candidato a finding do `@design-qa`.
