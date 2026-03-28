#!/bin/bash

# Claude Code Setup Script
# Uso:
#   ./setup.sh --global          → Instala config global em ~/.claude/
#   ./setup.sh --project <path>  → Copia template para um projeto
#   ./setup.sh --all <path>      → Faz ambos

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

install_global() {
  echo "=== Instalando config global ==="

  local target="$HOME/.claude"

  if [ -f "$target/CLAUDE.md" ]; then
    echo "CLAUDE.md global já existe. Sobrescrever? (y/n)"
    read -r answer
    if [ "$answer" != "y" ]; then
      echo "Pulando CLAUDE.md global."
      return
    fi
  fi

  cp "$SCRIPT_DIR/global/CLAUDE.md" "$target/CLAUDE.md"
  echo "  ✓ CLAUDE.md global instalado"

  # Merge settings.json preservando configs existentes
  if [ -f "$target/settings.json" ]; then
    echo "  ⚠ settings.json já existe — verifique manualmente: $target/settings.json"
    echo "  → Referência: $SCRIPT_DIR/global/settings.json"
  else
    cp "$SCRIPT_DIR/global/settings.json" "$target/settings.json"
    echo "  ✓ settings.json global instalado"
  fi

  echo "=== Config global instalada ==="
}

install_project() {
  local project_path="$1"

  if [ -z "$project_path" ]; then
    echo "Erro: informe o caminho do projeto"
    echo "Uso: ./setup.sh --project /caminho/do/projeto"
    exit 1
  fi

  if [ ! -d "$project_path" ]; then
    echo "Erro: diretório não encontrado: $project_path"
    exit 1
  fi

  echo "=== Instalando template no projeto: $project_path ==="

  # Criar estrutura
  mkdir -p "$project_path/.claude/agents"
  mkdir -p "$project_path/.claude/commands"
  mkdir -p "$project_path/.claude/hooks"
  mkdir -p "$project_path/.claude/rules"

  # Copiar agentes
  cp "$SCRIPT_DIR/template/.claude/agents/"*.md "$project_path/.claude/agents/" 2>/dev/null
  echo "  ✓ Agentes copiados"

  # Copiar hooks
  cp "$SCRIPT_DIR/template/.claude/hooks/"*.js "$project_path/.claude/hooks/" 2>/dev/null
  echo "  ✓ Hooks copiados"

  # Copiar start.md
  cp "$SCRIPT_DIR/template/.claude/commands/start.md" "$project_path/.claude/commands/" 2>/dev/null
  echo "  ✓ start.md copiado"

  # Copiar settings.json (hooks config)
  if [ ! -f "$project_path/.claude/settings.json" ]; then
    cp "$SCRIPT_DIR/template/.claude/settings.json" "$project_path/.claude/" 2>/dev/null
    echo "  ✓ settings.json (hooks) copiado"
  else
    echo "  ⚠ .claude/settings.json já existe — preservado"
  fi

  # Copiar CLAUDE.md template
  if [ ! -f "$project_path/CLAUDE.md" ]; then
    cp "$SCRIPT_DIR/template/CLAUDE.md" "$project_path/CLAUDE.md"
    echo "  ✓ CLAUDE.md template copiado (edite com dados do projeto)"
  else
    echo "  ⚠ CLAUDE.md já existe — preservado"
  fi

  # Copiar configs de lint/format
  if [ ! -f "$project_path/.eslintrc.json" ]; then
    cp "$SCRIPT_DIR/template/.eslintrc.json" "$project_path/"
    echo "  ✓ .eslintrc.json copiado"
  else
    echo "  ⚠ .eslintrc.json já existe — preservado"
  fi

  if [ ! -f "$project_path/.prettierrc" ]; then
    cp "$SCRIPT_DIR/template/.prettierrc" "$project_path/"
    echo "  ✓ .prettierrc copiado"
  else
    echo "  ⚠ .prettierrc já existe — preservado"
  fi

  echo ""
  echo "=== Template instalado ==="
  echo ""
  echo "Próximos passos:"
  echo "  1. Edite CLAUDE.md com dados específicos do projeto"
  echo "  2. Rode /start para iniciar o onboarding"
  echo "  3. Instale dependências: npm i -D eslint @rocketseat/eslint-config prettier prettier-plugin-tailwindcss"
}

# Parse argumentos
case "$1" in
  --global)
    install_global
    ;;
  --project)
    install_project "$2"
    ;;
  --all)
    install_global
    echo ""
    install_project "$2"
    ;;
  *)
    echo "Claude Code Setup"
    echo ""
    echo "Uso:"
    echo "  ./setup.sh --global          Instala config global (~/.claude/)"
    echo "  ./setup.sh --project <path>  Copia template para um projeto"
    echo "  ./setup.sh --all <path>      Faz ambos"
    ;;
esac
