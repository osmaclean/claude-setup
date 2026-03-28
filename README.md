# Claude Code Setup

Setup pessoal para Claude Code. Config global + template de projeto com equipe de agentes, hooks e regras.

## Uso rápido

```bash
# Instalar config global (qualquer máquina nova)
./setup.sh --global

# Configurar um projeto novo
./setup.sh --project /caminho/do/projeto

# Ambos de uma vez
./setup.sh --all /caminho/do/projeto
```

## Estrutura

```
claude-setup/
├── global/                    # Config pessoal (~/.claude/)
│   ├── CLAUDE.md              # Regras universais, equipe, postura
│   └── settings.json          # Modelo e idioma
├── template/                  # Template de projeto
│   ├── .claude/
│   │   ├── agents/            # 7 agentes especializados
│   │   ├── commands/          # start.md com onboarding inteligente
│   │   ├── hooks/             # Auto-format, protect files, lint check
│   │   └── settings.json      # Config de hooks
│   ├── CLAUDE.md              # Template de instruções do projeto
│   ├── .eslintrc.json         # ESLint Rocketseat
│   └── .prettierrc            # Prettier + Tailwind class sorting
└── setup.sh                   # Script de instalação
```

## Após instalar no projeto

1. Edite `CLAUDE.md` com dados específicos do projeto
2. Rode `/start` para onboarding (cria doc de contexto se não existir)
3. Instale dependências de lint:
   ```bash
   npm i -D eslint @rocketseat/eslint-config prettier prettier-plugin-tailwindcss
   ```
