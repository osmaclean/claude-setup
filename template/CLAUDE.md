# [Nome do Projeto]

## Comandos

- Dev: `npm run dev`
- Build: `npm run lint && npm run build`
- Lint: `npx eslint .`
- Test (específico): `npm test -- --testPathPattern=<pattern>`
- Test coverage: `npm run test:coverage`

## Regras de código

- Todo texto visível ao usuário DEVE usar sistema de i18n (se aplicável)
- Validação de input externo via Zod ou equivalente
- Componentes: máximo 500 linhas
- Conventional commits: feat:, fix:, chore:, refactor:, test:, docs:
- Não commitar sem instrução explícita do usuário
- Não criar arquivos novos sem necessidade comprovada
- Não refatorar código fora do escopo solicitado

## Segurança (inegociável)

- Toda entrada de usuário DEVE ser validada e sanitizada
- Toda validação client-side é UX, não segurança — o server é a única barreira real
- Rate limiting em toda API route
- Nunca logar dados sensíveis
- Nunca expor stack traces ao cliente
- Avaliar OWASP Top 10 em toda mudança
- Cookies sensíveis: httpOnly, Secure, SameSite=Strict

## Arquitetura

<!-- Preencher com a arquitetura específica do projeto -->

## Proibições

- NÃO usar `any` em TypeScript
- NÃO adicionar dependências sem discutir justificativa
- NÃO gerar documentação sem instrução explícita
- NÃO fazer push sem instrução explícita
- NÃO ignorar erros de lint ou TypeScript
- NÃO rodar a suíte de testes inteira — sempre segmentado

## Pipeline QA (obrigatorio)

Toda entrega de codigo passa pelo pipeline completo, sem excecao:

```
@tester → @security → @reviewer → @planner → Trello
```

- **@tester** valida funcionalidade, coverage, edge cases, testes passando
- **@security** audita seguranca: OWASP, injection, headers, rate limit
- **@reviewer** consolida os dois relatorios e decide: aprovado ou reprovado
- **@planner** formata o resultado para o Trello — SEMPRE, aprovado ou reprovado
- Comentarios no Trello sao POR ETAPA (VALIDACAO, AUDITORIA, REVISAO, PLANO)
- Reprovacao de QUALQUER agente reinicia o ciclo completo apos correcao
- Correcoes vao no card existente; descobertas novas viram card novo
- Historico de reprovacoes no Trello e sagrado — nunca apagar, nunca pular

Regra detalhada em `.claude/rules/qa-pipeline.md`

## Documentação e qualidade

- Toda feature nova precisa de testes (mínimo 90% coverage)
- Se documentação contradiz código: PARAR e perguntar qual está correto
