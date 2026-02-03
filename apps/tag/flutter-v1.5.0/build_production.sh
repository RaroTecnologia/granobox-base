#!/bin/bash

# Script para build de produção do Flutter
set -e

echo "🚀 Iniciando build de produção do Flutter..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Flutter está instalado
if ! command -v flutter &> /dev/null; then
    print_error "Flutter não está instalado ou não está no PATH"
    exit 1
fi

print_status "Limpando build anterior..."
flutter clean

print_status "Obtendo dependências..."
flutter pub get

print_status "Fazendo build de produção para Android..."
flutter build apk --release \
  --dart-define=ENVIRONMENT=production \
  --target-platform android-arm64 \
  --split-per-abi

print_status "✅ Build concluído com sucesso!"
print_status "APK gerado em: build/app/outputs/flutter-apk/"

# Listar arquivos gerados
print_status "Arquivos gerados:"
ls -la build/app/outputs/flutter-apk/

print_status "🎉 Build de produção finalizado!"
print_status "O app está configurado para usar a API de produção: https://api.granobox.com.br"
