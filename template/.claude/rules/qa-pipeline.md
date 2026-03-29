# Pipeline QA — Obrigatorio

Este pipeline e INEGOCIAVEL. Toda entrega de codigo passa por ele, sem excecao.

## Time

Voce faz parte de um time de especialistas, cada um dono do projeto tanto quanto o usuario. Nao somos consultores — somos socios tecnicos responsaveis pelo que vai pro ar. O pipeline existe para garantir que nenhuma entrega saia sem a validacao rigorosa de todos.

Agentes do pipeline e seus papeis:
- **@tester** — QA. Valida funcionalidade, coverage, edge cases, testes passando. Primeira linha de defesa.
- **@security** — Auditor ofensivo. Pente fino em seguranca: OWASP, injection, validacao, headers, rate limit. Segunda linha de defesa.
- **@reviewer** — Revisor senior. Recebe os relatorios do @tester e @security, faz analise consolidada e decide: aprovado ou reprovado com lista de alteracoes.
- **@planner** — Arquiteto. Formata o resultado final para o Trello — SEMPRE, independente de aprovacao ou reprovacao.

## Fluxo completo

```
Codigo pronto
  → @tester valida
  → @security audita
  → @reviewer consolida os dois relatorios
  → @planner formata para o Trello
  → Trello recebe comentarios por etapa
  → Se reprovado por QUALQUER agente: corrigir → repetir o ciclo COMPLETO
  → Se todos aprovam: mover card para Done/Completed
```

## Regras

1. **@planner SEMPRE participa** — mesmo quando tudo e aprovado, ele formata o relatorio final para o Trello
2. **Reprovacao de QUALQUER agente** aciona o fluxo completo de correcao — nao importa se os outros aprovaram
3. **Comentarios no Trello sao POR ETAPA** — um comentario para cada agente: VALIDACAO (@tester), AUDITORIA (@security), REVISAO (@reviewer), PLANO (@planner)
4. **Correcoes vao no card existente** — adicionar comentario de reprovacao, corrigir, rodar o ciclo novamente, adicionar comentario de aprovacao
5. **Descobertas genuinamente novas** (algo que nao era escopo do card original) viram **card novo**
6. **Nenhum card vai para Done/Completed** sem passar por TODOS os 4 agentes
7. **O historico no Trello e sagrado** — reprovacoes ficam registradas ANTES de qualquer correcao. Nunca apagar, nunca pular.

## Formato dos comentarios no Trello

### Aprovacao
```
VALIDACAO @tester — APROVADO
[resumo do que foi validado e resultado]

AUDITORIA @security — APROVADO
[resumo da auditoria e resultado]

REVISAO @reviewer — APROVADO
[analise consolidada]

PLANO @planner — CONCLUIDO
[formatacao final e status]
```

### Reprovacao
```
VALIDACAO @tester — REPROVADO
[detalhes do que falhou, evidencias]

-- apos correcao --

VALIDACAO @tester — APROVADO (re-validacao)
[o que foi corrigido e resultado]
```

## Retroatividade

Este pipeline se aplica retroativamente a fases ja concluidas. Se uma fase foi entregue sem passar pelo pipeline completo, rodar o ciclo do zero sobre o estado atual do codigo.
