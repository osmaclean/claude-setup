# Pipeline QA — Obrigatorio

Este pipeline e INEGOCIAVEL. Toda entrega de codigo passa por ele, sem excecao.

## Time

Voce faz parte de um time de especialistas, cada um dono do projeto tanto quanto o usuario. Nao somos consultores — somos socios tecnicos responsaveis pelo que vai pro ar. O pipeline existe para garantir que nenhuma entrega saia sem a validacao rigorosa de todos.

Agentes do pipeline e seus papeis:
- **@tester** — QA. Escreve testes, valida coverage, edge cases. Roda em paralelo com @security.
- **@security** — Auditor ofensivo. Pente fino em seguranca: OWASP, injection, validacao, headers, rate limit. Roda em paralelo com @tester.
- **@reviewer** — Revisor senior. Faz code review direto no codigo, recebe achados do @tester e @security como contexto, emite veredito final e posta no Trello.

Agentes do pipeline estendido (acionados por tipo de card):
- **@design-qa** — Auditor visual. Valida fidelidade da implementacao ao spec do @designer. Acionado em cards de UI.
- **@performance** — Auditor de performance. Bundle, runtime, Core Web Vitals. Acionado em cards de deps, features pesadas, pre-release.
- **@seo** — SEO tecnico. Meta tags, structured data, semantic HTML, indexacao. Acionado em cards de paginas publicas.
- **@copywriter** — Copy e microcopy. Tom de voz, qualidade multilingue, conversao. Acionado em cards com texto novo.

Agentes de suporte (fora do pipeline, chamados sob demanda):
- **@planner** — Arquiteto. Cria planos de implementacao, estrutura cards no Trello. Chamado para planejamento, nao para validacao.
- **@analyst** — Metricas. Le dados do pipeline, identifica padroes, mede saude do time. Chamado em fim de fase, sob demanda, ou pre-release.
- **@designer** — Design de produto/UX. Propoe specs visuais. Chamado para novas features de UI.
- **@docs** — Documentacao. Garante sincronia docs/codigo. Chamado sob demanda.
- **@refactor** — Refatoracao cirurgica em worktree isolada. Chamado sob demanda.

## Fluxo completo

```
Codigo pronto
  → @tester + @security (em paralelo)
  → @reviewer faz code review + consolida achados + emite veredito
  → Operador posta no Trello e move cards
  → Se reprovado por QUALQUER agente: corrigir → repetir o ciclo COMPLETO
  → Se todos aprovam: mover card para Done/Completed
```

## Diferenca do modelo anterior

O pipeline anterior era sequencial com 4 etapas (@tester → @security → @reviewer → @planner). O novo modelo e mais proximo do mercado real:

- **@tester e @security rodam em paralelo** — economiza tempo, ambos analisam independentemente
- **@reviewer faz code review real** — le o codigo diretamente, forma opiniao propria, usa relatorios dos outros como contexto (nao como unica fonte)
- **@planner sai do pipeline** — formatar para Trello e tarefa operacional, nao etapa de validacao. O operador (Claude principal) faz isso
- **CI futura substituira execucao manual de testes** — @tester escreve, CI roda

## Regras

1. **@tester e @security rodam em paralelo** — nao ha dependencia entre eles
2. **@reviewer e o veredito final** — analisa codigo + achados dos dois agentes
3. **Reprovacao de QUALQUER agente** aciona o fluxo completo de correcao — nao importa se os outros aprovaram
4. **1 comentario consolidado por card por execucao do pipeline** — contendo as 3 etapas (VALIDACAO, AUDITORIA, REVISAO) num unico bloco
5. **Correcoes vao no card existente** — adicionar comentario de reprovacao, corrigir, rodar o ciclo novamente, adicionar comentario de aprovacao
6. **Descobertas genuinamente novas** (algo que nao era escopo do card original) viram **card novo**
7. **Nenhum card vai para Done/Completed** sem passar pelos 3 agentes do pipeline
8. **O historico no Trello e sagrado** — reprovacoes ficam registradas ANTES de qualquer correcao. Nunca apagar, nunca pular.

## Formato dos comentarios no Trello

**1 comentario por card por execucao do pipeline.** As 3 etapas ficam num unico bloco:

```
PIPELINE QA — [DATA]

VALIDACAO @tester — [APROVADO/REPROVADO]
[resumo do que foi validado e resultado]

AUDITORIA @security — [APROVADO/REPROVADO]
[resumo da auditoria e vulnerabilidades]

REVISAO @reviewer — [APROVADO/REPROVADO]
[code review direto, veredito final consolidado]
```

Apos correcao de reprovacao, uma NOVA execucao do pipeline gera um NOVO comentario completo no mesmo card:

```
PIPELINE QA (re-validacao) — [DATA]

VALIDACAO @tester — APROVADO
[o que foi corrigido e resultado]

AUDITORIA @security — APROVADO
[re-auditoria confirmada]

REVISAO @reviewer — APROVADO
[code review final aprovado]
```

## Organizacao do Board Trello

Ordem das colunas (da esquerda para a direita):

```
History | Backlog | Decisoes Pendentes | Colunas das fases | Validation (@tester) | Done/Completed
```

- **History** — cards consolidados de fases concluidas (1 card por fase, com checklists e pipeline QA)
- **Backlog** — itens identificados mas nao priorizados
- **Decisoes Pendentes** — cards que dependem de decisao do usuario
- **Colunas das fases** — trabalho ativo, uma lista por fase
- **Validation (@tester)** — cards em validacao pelo pipeline QA
- **Done/Completed** — cards aprovados pelo pipeline completo

Ao criar novas listas de fase, posiciona-las entre "Decisoes Pendentes" e "Validation". Nunca alterar a ordem das colunas fixas.

## Pipeline estendido

Alem do pipeline core (tester + security → reviewer), existe o pipeline estendido que aciona agentes especialistas conforme o tipo de card:

```
Card de UI nova:        core + @design-qa + @copywriter
Card de landing page:   core + @seo + @copywriter + @performance
Card de refactor lib:   core (so)
Card de infra/deps:     core + @performance
Pre-release:            core + @performance + @seo (auditoria geral)
```

O operador (Claude principal) decide quais especialistas chamar com base no escopo do card. O usuario pode instruir especificamente ("roda SEO nesse").

Agentes estendidos rodam em paralelo com o core (ou apos, conforme disponibilidade). Seus relatorios alimentam o @reviewer para o veredito final consolidado.

Formato do comentario no Trello quando agentes estendidos participam:

```
PIPELINE QA — [DATA]

VALIDACAO @tester — [APROVADO/REPROVADO]
[resumo]

AUDITORIA @security — [APROVADO/REPROVADO]
[resumo]

DESIGN QA @design-qa — [APROVADO/REPROVADO]
[resumo — so se acionado]

COPY @copywriter — [APROVADO/REPROVADO]
[resumo — so se acionado]

SEO @seo — [APROVADO/REPROVADO]
[resumo — so se acionado]

PERFORMANCE @performance — [APROVADO/REPROVADO]
[resumo — so se acionado]

REVISAO @reviewer — [APROVADO/REPROVADO]
[code review + consolidacao de todos os achados]
```

## Metricas do pipeline

Toda execucao do pipeline gera uma entrada em `.claude/metrics/pipeline.jsonl`. Schema v1:

```json
{
  "v": 1,
  "date": "2026-04-01",
  "card_id": "trello-id-real",
  "card_title": "Titulo do card",
  "phase": "Fase X",
  "card_size": "P|M|G",
  "card_type": "feature|fix|refactor|security|ui|infra",
  "files_changed": 4,
  "core": { "tester": "approved|reproved", "security": "approved|reproved", "reviewer": "approved|reproved" },
  "extended": { "agent-name": "approved|reproved" },
  "cycles": 1,
  "findings": { "critical": 0, "high": 1, "medium": 2, "low": 0 },
  "reproval_reasons": { "agent-name": ["category-id"] },
  "coverage_delta": 2.3,
  "lead_time_hours": null,
  "notes": ""
}
```

Categorias de reproval_reasons estao padronizadas em `.claude/metrics/categories.json` — single source of truth. Agentes do pipeline DEVEM usar essas categorias ao classificar seus findings.

O @analyst consome esses dados para gerar relatorios de saude do time e recomendacoes de melhoria.

## Retroatividade

Este pipeline se aplica retroativamente a fases ja concluidas. Se uma fase foi entregue sem passar pelo pipeline completo, rodar o ciclo do zero sobre o estado atual do codigo.

Metricas anteriores a Fase 9 nao foram coletadas no formato JSONL. O @analyst deve considerar apenas dados a partir do ponto em que o sistema de metricas foi implementado.
