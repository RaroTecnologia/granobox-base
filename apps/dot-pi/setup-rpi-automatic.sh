#!/bin/bash

# 🚀 Setup Automático 100% - Granobox Dot Pi
# Cria device e configura API Key automaticamente via API

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}"
echo "╔════════════════════════════════════════╗"
echo "║   Granobox Dot Pi - Setup Automático   ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}\n"

# Configurações
API_URL="${API_URL:-https://api.granobox.com.br}"
RPI_HOST="$1"
RPI_USER="${2:-tagment}"

if [ -z "$RPI_HOST" ]; then
  echo -e "${RED}❌ Uso: $0 <ip_raspberry_pi> [usuario]${NC}"
  echo -e "   Exemplo: $0 192.168.10.111 tagment"
  exit 1
fi

echo -e "${BLUE}📋 Configurações:${NC}"
echo "   API URL: $API_URL"
echo "   Raspberry Pi: $RPI_USER@$RPI_HOST"
echo ""

# 1. Obter informações do Raspberry Pi
echo -e "${YELLOW}1️⃣  Obtendo informações do Raspberry Pi...${NC}"
echo -n "   Conectando via SSH..."

# Obter serial number do hardware (permanente e único)
SERIAL=$(ssh $RPI_USER@$RPI_HOST "cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2" 2>/dev/null || echo "unknown")
HOSTNAME=$(ssh $RPI_USER@$RPI_HOST "hostname")
MAC_ADDRESS=$(ssh $RPI_USER@$RPI_HOST "cat /sys/class/net/eth0/address 2>/dev/null || cat /sys/class/net/wlan0/address 2>/dev/null || echo 'unknown'")

# Gerar device ID único usando serial number (max 20 chars)
# Formato: rpi-SERIAL_LAST_8_CHARS
if [ "$SERIAL" != "unknown" ] && [ ! -z "$SERIAL" ]; then
  SERIAL_SHORT=${SERIAL: -8}
  DEVICE_ID="rpi-${SERIAL_SHORT}"
else
  # Fallback: usar MAC se serial não disponível
  MAC_SHORT=${MAC_ADDRESS//:/}
  MAC_SHORT=${MAC_SHORT: -8}
  DEVICE_ID="rpi-${MAC_SHORT}"
fi
DEVICE_ID=$(echo "$DEVICE_ID" | tr '[:upper:]' '[:lower:]')

echo -e " ${GREEN}✓${NC}"
echo "   Device ID: ${GREEN}$DEVICE_ID${NC}"
echo "   Serial: $SERIAL"
echo "   MAC: $MAC_ADDRESS"
echo "   Hostname: $HOSTNAME"
echo ""

# 2. Gerar API Key via endpoint público
echo -e "${YELLOW}2️⃣  Gerando API Key via API...${NC}"
echo -n "   Chamando POST /devices/$DEVICE_ID/generate-key..."

API_RESPONSE=$(curl -s -X POST "$API_URL/devices/$DEVICE_ID/generate-key" \
  -H "Content-Type: application/json")

API_KEY=$(echo "$API_RESPONSE" | grep -o '"apiKey":"[^"]*' | sed 's/"apiKey":"//')

if [ -z "$API_KEY" ]; then
  echo -e " ${RED}✗${NC}"
  echo -e "${RED}❌ Falha ao gerar API Key${NC}"
  echo "Resposta da API: $API_RESPONSE"
  exit 1
fi

echo -e " ${GREEN}✓${NC}"
echo "   API Key: ${GREEN}${API_KEY:0:20}...${NC} (${#API_KEY} chars)"
echo ""

# 3. Configurar API Key no Raspberry Pi
echo -e "${YELLOW}3️⃣  Configurando API Key no Raspberry Pi...${NC}"

# Parar serviço
echo -n "   Parando serviço..."
ssh $RPI_USER@$RPI_HOST "sudo systemctl stop granobox-dot" 2>/dev/null || true
echo -e " ${GREEN}✓${NC}"

# Atualizar API Key no arquivo de serviço
echo -n "   Atualizando arquivo de serviço..."
ssh $RPI_USER@$RPI_HOST "sudo sed -i 's|GRANOBOX_API_KEY=.*\"|GRANOBOX_API_KEY=$API_KEY\"|' /etc/systemd/system/granobox-dot.service"
echo -e " ${GREEN}✓${NC}"

# Recarregar systemd
echo -n "   Recarregando systemd..."
ssh $RPI_USER@$RPI_HOST "sudo systemctl daemon-reload"
echo -e " ${GREEN}✓${NC}"

echo ""

# 4. Iniciar serviço
echo -e "${YELLOW}4️⃣  Iniciando serviço...${NC}"
echo -n "   Iniciando granobox-dot..."
ssh $RPI_USER@$RPI_HOST "sudo systemctl start granobox-dot"
echo -e " ${GREEN}✓${NC}"

sleep 2

# 5. Verificar status
echo ""
echo -e "${YELLOW}5️⃣  Verificando status...${NC}"
STATUS=$(ssh $RPI_USER@$RPI_HOST "sudo systemctl is-active granobox-dot" 2>/dev/null || echo "failed")

if [ "$STATUS" = "active" ]; then
  echo -e "   Status: ${GREEN}● active (running)${NC}"
else
  echo -e "   Status: ${RED}● $STATUS${NC}"
fi

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════╗"
echo "║        ✅ Setup Concluído!              ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}\n"

echo -e "${BLUE}📝 Resumo:${NC}"
echo "┌─────────────────────────────────────────────────────────┐"
echo "│ Device ID:  $DEVICE_ID"
echo "│ API Key:    ${API_KEY:0:30}..."
echo "│ Host:       $RPI_USER@$RPI_HOST"
echo "│ Status:     $STATUS"
echo "└─────────────────────────────────────────────────────────┘"
echo ""

echo -e "${BLUE}📊 Comandos úteis:${NC}"
echo ""
echo "  ${YELLOW}Ver logs em tempo real:${NC}"
echo "  ssh $RPI_USER@$RPI_HOST \"sudo journalctl -u granobox-dot -f\""
echo ""
echo "  ${YELLOW}Status do serviço:${NC}"
echo "  ssh $RPI_USER@$RPI_HOST \"sudo systemctl status granobox-dot\""
echo ""
echo "  ${YELLOW}Reiniciar serviço:${NC}"
echo "  ssh $RPI_USER@$RPI_HOST \"sudo systemctl restart granobox-dot\""
echo ""

# Mostrar últimas linhas do log
echo -e "${BLUE}📋 Últimas linhas do log:${NC}"
echo "─────────────────────────────────────────────────────────"
ssh $RPI_USER@$RPI_HOST "sudo journalctl -u granobox-dot -n 10 --no-pager" | tail -10
echo "─────────────────────────────────────────────────────────"
echo ""

echo -e "${GREEN}🎉 Pronto para usar! Aproxime o scanner de um QR Code.${NC}"
echo ""

