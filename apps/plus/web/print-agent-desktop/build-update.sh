#!/bin/bash

# Script para build e publicação de atualizações do Granobox Print Agent
# Uso: ./build-update.sh [patch|minor|major]

set -e

# Verificar se o argumento foi fornecido
if [ -z "$1" ]; then
    echo "Uso: $0 [patch|minor|major]"
    echo "  patch: 0.1.0 -> 0.1.1 (correções)"
    echo "  minor: 0.1.0 -> 0.2.0 (novas funcionalidades)"
    echo "  major: 0.1.0 -> 1.0.0 (mudanças quebram compatibilidade)"
    exit 1
fi

VERSION_TYPE=$1

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "Erro: Execute este script no diretório do projeto"
    exit 1
fi

# Verificar se o GitHub CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "Erro: GitHub CLI (gh) não está instalado"
    echo "Instale em: https://cli.github.com/"
    exit 1
fi

# Verificar se está logado no GitHub
if ! gh auth status &> /dev/null; then
    echo "Erro: Não está logado no GitHub CLI"
    echo "Execute: gh auth login"
    exit 1
fi

echo "🚀 Iniciando processo de atualização..."

# 1. Atualizar versão
echo "📦 Atualizando versão..."
npm version $VERSION_TYPE --no-git-tag-version

# 2. Ler nova versão
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✨ Nova versão: $NEW_VERSION"

# 3. Commit das mudanças
echo "💾 Fazendo commit das mudanças..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"

# 4. Criar tag
echo "🏷️ Criando tag..."
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"

# 5. Push das mudanças e tag
echo "📤 Enviando para o GitHub..."
git push origin main
git push origin "v$NEW_VERSION"

# 6. Build do aplicativo
echo "🔨 Fazendo build do aplicativo..."
npm run build

# 7. Publicar release no GitHub
echo "📤 Criando release no GitHub..."
gh release create "v$NEW_VERSION" \
    --title "Granobox Print Agent v$NEW_VERSION" \
    --notes "Release da versão $NEW_VERSION" \
    --draft=false \
    --prerelease=false \
    "dist/*"

echo "✅ Atualização concluída com sucesso!"
echo "🎉 Versão $NEW_VERSION foi publicada no GitHub"
echo "📱 Os usuários receberão a notificação de atualização automaticamente"
