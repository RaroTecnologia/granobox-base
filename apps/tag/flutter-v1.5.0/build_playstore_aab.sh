#!/bin/bash

# Script para gerar AAB para publicação na Play Console
# Autor: Granobox Team
# Data: $(date +%Y-%m-%d)

set -e  # Exit on error

echo "🚀 Iniciando processo de build para Play Console..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Informações do keystore
KEYSTORE_FILE="android/upload-keystore.jks"
KEY_ALIAS="granobox-key"
KEY_PASSWORD="granobox2024"
STORE_PASSWORD="granobox2024"

# Criar keystore se não existir
if [ ! -f "$KEYSTORE_FILE" ]; then
    echo -e "${YELLOW}📦 Keystore não encontrado. Criando novo keystore...${NC}"
    keytool -genkey -v \
        -keystore "$KEYSTORE_FILE" \
        -alias "$KEY_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "$STORE_PASSWORD" \
        -keypass "$KEY_PASSWORD" \
        -dname "CN=Granobox, OU=Development, O=WDEZoito, L=Brasília, ST=DF, C=BR"
    echo -e "${GREEN}✅ Keystore criado com sucesso!${NC}"
else
    echo -e "${GREEN}✅ Keystore já existe.${NC}"
fi

# Verificar se o arquivo key.properties existe
if [ ! -f "android/key.properties" ]; then
    echo -e "${RED}❌ Erro: Arquivo key.properties não encontrado!${NC}"
    exit 1
fi

# Limpar build anterior
echo -e "${YELLOW}🧹 Limpando builds anteriores...${NC}"
flutter clean

# Obter dependências
echo -e "${YELLOW}📦 Obtendo dependências...${NC}"
flutter pub get

# Build do AAB
echo -e "${YELLOW}🔨 Construindo AAB para release...${NC}"
flutter build appbundle --release

# Verificar se o build foi bem-sucedido
AAB_PATH="build/app/outputs/bundle/release/app-release.aab"
if [ -f "$AAB_PATH" ]; then
    # Obter informações do app
    VERSION=$(grep "version:" pubspec.yaml | awk '{print $2}')
    DATE=$(date +%Y%m%d_%H%M)
    
    # Criar diretório de releases se não existir
    mkdir -p releases
    
    # Copiar AAB com nome versionado
    OUTPUT_FILE="releases/GranoboxTag_${VERSION}_${DATE}.aab"
    cp "$AAB_PATH" "$OUTPUT_FILE"
    
    echo ""
    echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
    echo ""
    echo "📦 Arquivo AAB gerado:"
    echo "   - Localização: $AAB_PATH"
    echo "   - Cópia salva: $OUTPUT_FILE"
    echo "   - Tamanho: $(du -h "$AAB_PATH" | cut -f1)"
    echo ""
    echo -e "${GREEN}🎉 Pronto para upload na Play Console!${NC}"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Acesse https://play.google.com/console"
    echo "   2. Selecione seu aplicativo"
    echo "   3. Vá em 'Testes internos' ou 'Produção'"
    echo "   4. Crie uma nova versão"
    echo "   5. Faça upload do arquivo: $OUTPUT_FILE"
    echo ""
else
    echo -e "${RED}❌ Erro: Arquivo AAB não foi gerado!${NC}"
    exit 1
fi


