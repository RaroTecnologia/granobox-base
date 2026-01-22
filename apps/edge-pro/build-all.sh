#!/bin/bash

# Script de build para todas as plataformas
# Granobox Edge-Pro

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo "  Edge-Pro - Build Script"
echo -e "======================================${NC}"
echo ""

# Versão
VERSION=${1:-"dev"}
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo -e "${YELLOW}Configuração:${NC}"
echo "  Versão: $VERSION"
echo "  Build Time: $BUILD_TIME"
echo "  Commit: $COMMIT_HASH"
echo ""

# Diretório de saída
OUTPUT_DIR="bin"
mkdir -p "$OUTPUT_DIR"

# Flags de build
LDFLAGS="-X main.Version=$VERSION -X main.BuildTime=$BUILD_TIME -X main.CommitHash=$COMMIT_HASH"

# Função para build
build_target() {
    local OS=$1
    local ARCH=$2
    local ARM=$3
    local OUTPUT=$4
    
    echo -ne "${YELLOW}Building $OUTPUT...${NC} "
    
    if [ -n "$ARM" ]; then
        GOOS=$OS GOARCH=$ARCH GOARM=$ARM go build -ldflags "$LDFLAGS" -o "$OUTPUT_DIR/$OUTPUT" ./cmd/edge-pro/main.go
    else
        GOOS=$OS GOARCH=$ARCH go build -ldflags "$LDFLAGS" -o "$OUTPUT_DIR/$OUTPUT" ./cmd/edge-pro/main.go
    fi
    
    if [ $? -eq 0 ]; then
        SIZE=$(ls -lh "$OUTPUT_DIR/$OUTPUT" | awk '{print $5}')
        echo -e "${GREEN}✓ OK${NC} ($SIZE)"
    else
        echo -e "${RED}✗ FALHOU${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}Compilando para múltiplas plataformas:${NC}"
echo ""

# Linux ARM64 (Raspberry Pi 4, 5)
build_target "linux" "arm64" "" "edge-pro-linux-arm64"

# Linux ARMv7 (Raspberry Pi 3, Zero 2)
build_target "linux" "arm" "7" "edge-pro-linux-armv7"

# Linux ARMv6 (Raspberry Pi Zero, 1)
build_target "linux" "arm" "6" "edge-pro-linux-armv6"

# Linux AMD64 (Servidores x86_64)
build_target "linux" "amd64" "" "edge-pro-linux-amd64"

# macOS (para desenvolvimento)
build_target "darwin" "amd64" "" "edge-pro-darwin-amd64"
build_target "darwin" "arm64" "" "edge-pro-darwin-arm64"

echo ""
echo -e "${GREEN}======================================"
echo "  Build Completo!"
echo -e "======================================${NC}"
echo ""

echo "Binários gerados:"
ls -lh "$OUTPUT_DIR"/edge-pro-* | awk '{printf "  %-30s %s\n", $9, $5}'

echo ""
echo -e "${BLUE}Para fazer deploy:${NC}"
echo "  1. Raspberry Pi 4/5:  ./deploy-to-device.sh <ip> arm64"
echo "  2. Raspberry Pi 3:    ./deploy-to-device.sh <ip> armv7"
echo "  3. Raspberry Pi Zero: ./deploy-to-device.sh <ip> armv6"
echo ""

