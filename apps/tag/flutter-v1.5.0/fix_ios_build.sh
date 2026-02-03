#!/bin/bash

# Script para resolver problemas de compilação do iOS com flutter_blue_plus_darwin
# e outros plugins do Flutter

set -e

# Configurar encoding UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

echo "🧹 Iniciando limpeza completa do ambiente iOS..."

# Navegar para o diretório do projeto Flutter
cd "$(dirname "$0")"

echo "📍 Diretório atual: $(pwd)"

# 1. Limpar cache do Flutter
echo "🗑️  Limpando cache do Flutter..."
flutter clean

# 2. Remover Pods e arquivos relacionados
echo "🗑️  Removendo Pods antigos..."
cd ios
rm -rf Pods
rm -rf Podfile.lock
rm -rf .symlinks
rm -rf Flutter/Flutter.framework
rm -rf Flutter/Flutter.podspec

# 3. Limpar cache do CocoaPods
echo "🗑️  Limpando cache do CocoaPods..."
pod cache clean --all || true

# 4. Limpar DerivedData do Xcode
echo "🗑️  Limpando DerivedData do Xcode..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 5. Limpar build do projeto
echo "🗑️  Limpando pasta build..."
rm -rf build

# Voltar para o diretório raiz do Flutter
cd ..

# 6. Atualizar dependências do Flutter
echo "📦 Atualizando dependências do Flutter..."
flutter pub get

# 7. Voltar para ios e reinstalar pods
echo "📦 Reinstalando CocoaPods..."
cd ios

# Atualizar repositórios do CocoaPods
echo "🔄 Atualizando repositórios do CocoaPods..."
pod repo update || true

# Instalar pods com verbose
echo "📦 Instalando Pods (isso pode demorar alguns minutos)..."
pod install --repo-update --verbose

echo ""
echo "✅ Limpeza e reinstalação concluída!"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Abra o Xcode com o arquivo Runner.xcworkspace (não o .xcodeproj):"
echo "      open ios/Runner.xcworkspace"
echo ""
echo "   2. No Xcode:"
echo "      - Vá em Product > Clean Build Folder (Cmd+Shift+K)"
echo "      - Vá em Product > Build (Cmd+B)"
echo ""
echo "   Ou compile direto pelo Flutter:"
echo "      flutter build ios --debug"
echo "      ou"
echo "      flutter run"
echo ""

