#!/bin/bash

# Script para rebuild limpo do iOS com configuração correta dos Pods

set -e

# Configurar encoding UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

echo "🧹 Iniciando rebuild limpo do iOS..."

# Navegar para o diretório do projeto Flutter
cd "$(dirname "$0")"

echo "📍 Diretório atual: $(pwd)"

# 1. Parar qualquer processo do Flutter
echo "⏹️  Parando processos do Flutter..."
pkill -f "flutter" || true

# 2. Limpar cache do Flutter
echo "🗑️  Limpando cache do Flutter..."
flutter clean

# 3. Limpar DerivedData do Xcode
echo "🗑️  Limpando DerivedData do Xcode..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 4. Remover Pods e arquivos relacionados
echo "🗑️  Removendo Pods antigos..."
cd ios
rm -rf Pods Podfile.lock .symlinks

# 5. Obter dependências do Flutter
echo "📦 Obtendo dependências do Flutter..."
cd ..
flutter pub get

# 6. Reinstalar Pods
echo "📦 Reinstalando Pods..."
cd ios
pod install --repo-update

cd ..

echo ""
echo "✅ Rebuild limpo concluído!"
echo ""
echo "🎯 Agora você pode:"
echo "   1. Rodar o app:"
echo "      flutter run"
echo ""
echo "   2. Ou compilar:"
echo "      flutter build ios --debug"
echo ""


