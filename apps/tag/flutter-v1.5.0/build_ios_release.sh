#!/bin/bash

# Script para build de release para iOS/App Store
set -e

echo "🍎 Build de Release para Apple App Store"
echo "========================================"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Verificar se estamos no macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "Este script só pode ser executado no macOS"
    exit 1
fi

# Verificar Flutter
if ! command -v flutter &> /dev/null; then
    print_error "Flutter não encontrado no PATH"
    exit 1
fi

print_step "1. Limpeza de caches iOS"
flutter clean
rm -rf ios/Pods
rm -rf ios/Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*
print_success "Caches limpos!"
echo ""

print_step "2. Obtendo dependências"
flutter pub get
print_success "Dependências obtidas!"
echo ""

print_step "3. Instalando pods do iOS"
cd ios
pod install
cd ..
print_success "Pods instalados!"
echo ""

print_step "4. Gerando versão"
VERSION="1.3.2"
BUILD_NUMBER=$(date +"%Y%m%d%H%M")
echo "Versão: $VERSION"
echo "Build Number: $BUILD_NUMBER"
echo ""

print_step "5. Build para iOS"
flutter build ios \
  --release \
  --dart-define=ENVIRONMENT=production \
  --build-name="$VERSION" \
  --build-number="$BUILD_NUMBER"

print_success "Build iOS concluído!"
echo ""

print_step "6. Criando arquivo IPA para distribuição"
echo ""
print_warning "Para criar o IPA e enviar para App Store:"
echo ""
echo "1. Abra o Xcode:"
echo "   open ios/Runner.xcworkspace"
echo ""
echo "2. No Xcode:"
echo "   - Selecione 'Product > Archive'"
echo "   - Aguarde o processo de arquivamento"
echo "   - Na janela 'Organizer', clique em 'Distribute App'"
echo "   - Escolha 'App Store Connect'"
echo "   - Siga o assistente até fazer upload"
echo ""
echo "3. No App Store Connect:"
echo "   https://appstoreconnect.apple.com"
echo "   - Aguarde o processamento do build"
echo "   - Configure a versão para revisão"
echo "   - Envie para revisão da Apple"
echo ""
echo "✅ Versão: $VERSION ($BUILD_NUMBER)"
echo "✅ Correções incluídas:"
echo "  - Loading infinito corrigido"
echo "  - Contador de etiquetas"
echo "  - Filtros otimizados"
echo ""


