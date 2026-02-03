#!/bin/bash

# Script para build com correção do loading infinito
set -e

echo "🔧 Build com correção de loading infinito no filtro de 7 dias"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}[INFO]${NC} Limpando build anterior..."
flutter clean

echo -e "${GREEN}[INFO]${NC} Obtendo dependências..."
flutter pub get

# Gerar timestamp para o nome do arquivo
TIMESTAMP=$(date +"%Y%m%d_%H%M")
VERSION="1.3.2"

echo -e "${GREEN}[INFO]${NC} Fazendo build do APK de produção..."
flutter build apk --release \
  --dart-define=ENVIRONMENT=production

# Copiar APK para raiz com nome descritivo
APK_SOURCE="build/app/outputs/flutter-apk/app-release.apk"
APK_DEST="../../../GranoboxTag_v${VERSION}_fix_loading_${TIMESTAMP}.apk"

if [ -f "$APK_SOURCE" ]; then
  cp "$APK_SOURCE" "$APK_DEST"
  echo ""
  echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
  echo ""
  echo "📦 APK copiado para:"
  echo "   $APK_DEST"
  echo ""
  echo "🧪 Para testar a correção:"
  echo "   1. Instalar o APK no dispositivo"
  echo "   2. Login: tiagolevorato@treslados.group / Mudar@1234"
  echo "   3. Ir em 'Controle de Etiquetas'"
  echo "   4. Abrir filtros e selecionar 'Vencem em até 7 dias'"
  echo "   5. Aplicar filtro"
  echo "   6. Verificar que não há loading infinito na lateral"
  echo ""
  echo "🔍 O que foi corrigido:"
  echo "   - Filtros de data agora são aplicados na API, não localmente"
  echo "   - hasNextPage agora reflete corretamente os dados filtrados"
  echo "   - Sem mais loading infinito ao usar filtros específicos"
  echo ""
else
  echo -e "${RED}❌ Erro: APK não encontrado em $APK_SOURCE${NC}"
  exit 1
fi

