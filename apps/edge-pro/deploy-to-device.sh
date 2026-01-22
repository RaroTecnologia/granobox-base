#!/bin/bash

# Script de Deploy para Dispositivo Edge-Pro
# Granobox Edge-Pro

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo "  Edge-Pro - Deploy Script"
echo -e "======================================${NC}"
echo ""

# Verificar parâmetros
if [ $# -lt 2 ]; then
    echo -e "${RED}Uso: $0 <ip-do-dispositivo> <arch> [usuario]${NC}"
    echo ""
    echo "Arquiteturas disponíveis:"
    echo "  arm64  - Raspberry Pi 4, 5"
    echo "  armv7  - Raspberry Pi 3, Zero 2"
    echo "  armv6  - Raspberry Pi Zero, 1"
    echo "  amd64  - Servidores x86_64"
    echo ""
    echo "Exemplos:"
    echo "  $0 192.168.1.100 arm64"
    echo "  $0 192.168.1.100 arm64 pi"
    echo "  $0 usuario@192.168.1.100 arm64"
    exit 1
fi

DEVICE_ARG=$1
ARCH=$2
DEVICE_USER=${3:-"pi"}

# Detectar se o primeiro argumento contém usuario@ip
if [[ "$DEVICE_ARG" == *"@"* ]]; then
    DEVICE_USER=$(echo "$DEVICE_ARG" | cut -d'@' -f1)
    DEVICE_IP=$(echo "$DEVICE_ARG" | cut -d'@' -f2)
else
    DEVICE_IP=$DEVICE_ARG
fi

BINARY="bin/edge-pro-linux-$ARCH"

# Verificar se o binário existe
if [ ! -f "$BINARY" ]; then
    echo -e "${RED}✗ Binário não encontrado: $BINARY${NC}"
    echo -e "${YELLOW}Execute primeiro: ./build-all.sh${NC}"
    exit 1
fi

echo -e "${YELLOW}Configuração:${NC}"
echo "  Dispositivo: $DEVICE_USER@$DEVICE_IP"
echo "  Arquitetura: $ARCH"
echo "  Binário: $BINARY"
echo ""

# Testar conexão
echo -ne "${YELLOW}Testando conexão com dispositivo...${NC} "
if ssh -o ConnectTimeout=5 -o BatchMode=yes "$DEVICE_USER@$DEVICE_IP" exit 2>/dev/null; then
    echo -e "${GREEN}✓ OK${NC}"
elif ssh -o ConnectTimeout=5 "$DEVICE_USER@$DEVICE_IP" exit 2>/dev/null; then
    echo -e "${GREEN}✓ OK (com senha)${NC}"
    echo -e "${YELLOW}⚠️  Usando autenticação por senha. Para melhor experiência, configure chave SSH.${NC}"
else
    echo -e "${RED}✗ FALHOU${NC}"
    echo -e "${RED}Não foi possível conectar ao dispositivo.${NC}"
    echo "Verifique:"
    echo "  1. IP está correto: $DEVICE_IP"
    echo "  2. Usuário está correto: $DEVICE_USER"
    echo "  3. SSH está habilitado no dispositivo"
    echo "  4. A senha está correta"
    echo ""
    echo "Dica: Configure chave SSH para deploy automatizado:"
    echo "  ssh-copy-id $DEVICE_USER@$DEVICE_IP"
    exit 1
fi

# Parar serviço se estiver rodando
echo -ne "${YELLOW}Parando serviço edge-pro...${NC} "
ssh "$DEVICE_USER@$DEVICE_IP" "sudo systemctl stop edge-pro 2>/dev/null || true"
echo -e "${GREEN}✓ OK${NC}"

# Fazer backup do binário atual
echo -ne "${YELLOW}Fazendo backup do binário atual...${NC} "
ssh "$DEVICE_USER@$DEVICE_IP" "[ -f /usr/local/bin/edge-pro ] && sudo cp /usr/local/bin/edge-pro /usr/local/bin/edge-pro.backup || true"
echo -e "${GREEN}✓ OK${NC}"

# Copiar novo binário
echo -ne "${YELLOW}Copiando novo binário...${NC} "
scp -q "$BINARY" "$DEVICE_USER@$DEVICE_IP:/tmp/edge-pro"
echo -e "${GREEN}✓ OK${NC}"

# Instalar binário
echo -ne "${YELLOW}Instalando binário...${NC} "
ssh "$DEVICE_USER@$DEVICE_IP" "sudo mv /tmp/edge-pro /usr/local/bin/edge-pro && sudo chmod +x /usr/local/bin/edge-pro"
echo -e "${GREEN}✓ OK${NC}"

# Copiar arquivo de configuração se não existir
echo -ne "${YELLOW}Verificando configuração...${NC} "
if ! ssh "$DEVICE_USER@$DEVICE_IP" "[ -f /etc/edge-pro/config.yaml ]"; then
    echo ""
    echo -e "${YELLOW}  Copiando arquivo de configuração exemplo...${NC}"
    scp -q "configs/config.granobox.yaml" "$DEVICE_USER@$DEVICE_IP:/tmp/config.yaml"
    ssh "$DEVICE_USER@$DEVICE_IP" "sudo mkdir -p /etc/edge-pro && sudo mv /tmp/config.yaml /etc/edge-pro/config.yaml"
    echo -e "  ${GREEN}✓ Configuração copiada${NC}"
else
    echo -e "${GREEN}✓ OK${NC}"
fi

# Instalar/atualizar arquivo de serviço
echo -ne "${YELLOW}Instalando serviço systemd...${NC} "
scp -q "scripts/edge-pro.service" "$DEVICE_USER@$DEVICE_IP:/tmp/edge-pro.service"
ssh "$DEVICE_USER@$DEVICE_IP" "sudo mv /tmp/edge-pro.service /etc/systemd/system/edge-pro.service && sudo systemctl daemon-reload"
echo -e "${GREEN}✓ OK${NC}"

# Habilitar serviço
echo -ne "${YELLOW}Habilitando serviço...${NC} "
ssh "$DEVICE_USER@$DEVICE_IP" "sudo systemctl enable edge-pro"
echo -e "${GREEN}✓ OK${NC}"

# Iniciar serviço
echo -ne "${YELLOW}Iniciando serviço...${NC} "
ssh "$DEVICE_USER@$DEVICE_IP" "sudo systemctl start edge-pro"
sleep 2
echo -e "${GREEN}✓ OK${NC}"

# Verificar status
echo ""
echo -e "${BLUE}Status do Serviço:${NC}"
ssh "$DEVICE_USER@$DEVICE_IP" "sudo systemctl status edge-pro --no-pager" || true

echo ""
echo -e "${GREEN}======================================"
echo "  Deploy Completo!"
echo -e "======================================${NC}"
echo ""
echo -e "${BLUE}Comandos úteis:${NC}"
echo "  Ver logs:        ssh $DEVICE_USER@$DEVICE_IP 'sudo journalctl -u edge-pro -f'"
echo "  Parar serviço:   ssh $DEVICE_USER@$DEVICE_IP 'sudo systemctl stop edge-pro'"
echo "  Iniciar serviço: ssh $DEVICE_USER@$DEVICE_IP 'sudo systemctl start edge-pro'"
echo "  Status:          ssh $DEVICE_USER@$DEVICE_IP 'sudo systemctl status edge-pro'"
echo "  Configuração:    ssh $DEVICE_USER@$DEVICE_IP 'sudo nano /etc/edge-pro/config.yaml'"
echo ""

