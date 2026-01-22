#!/bin/bash

# Script para configurar Edge-Pro no Raspberry Pi

set -e

PI_HOST="tagment@192.168.10.140"
CONFIG_FILE="/etc/edge-pro/config.yaml"

echo "🎯 Configurando Edge-Pro no Raspberry Pi"
echo "📡 Host: $PI_HOST"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Descobrir Device ID do Pi
echo -e "${YELLOW}📋 Descobrindo Device ID do Raspberry Pi...${NC}"

# Tentar obter MAC e gerar Device ID (mesmo formato do Edge-Pro)
MAC=$(ssh "$PI_HOST" "cat /sys/class/net/wlan0/address 2>/dev/null || cat /sys/class/net/eth0/address 2>/dev/null | head -1")
if [ -z "$MAC" ]; then
    echo -e "${RED}❌ Erro: Não foi possível obter MAC address${NC}"
    exit 1
fi

echo -e "${GREEN}✅ MAC encontrado: $MAC${NC}"

# Remover dois-pontos e pegar últimos 8 caracteres (formato do Edge-Pro)
MAC_CLEAN=$(echo "$MAC" | tr -d ':' | tr '[:lower:]' '[:upper:]')
if [ ${#MAC_CLEAN} -ge 8 ]; then
    DEVICE_ID="edge-pro-${MAC_CLEAN: -8}"
else
    DEVICE_ID="edge-pro-${MAC_CLEAN}"
fi

echo -e "${GREEN}✅ Device ID calculado: $DEVICE_ID${NC}"
echo ""

# 2. Verificar Device ID atual no Pi
echo -e "${YELLOW}🔍 Verificando configuração atual...${NC}"
CURRENT_DEVICE_ID=$(ssh "$PI_HOST" "sudo cat $CONFIG_FILE 2>/dev/null | grep -E '^  id:|^  agent_fingerprint:' | head -1 | cut -d'\"' -f2" || echo "")

if [ -n "$CURRENT_DEVICE_ID" ]; then
    echo -e "${BLUE}ℹ️  Device ID atual no config: $CURRENT_DEVICE_ID${NC}"
    if [ "$CURRENT_DEVICE_ID" != "$DEVICE_ID" ]; then
        echo -e "${YELLOW}⚠️  Device ID diferente! Usando o calculado: $DEVICE_ID${NC}"
    else
        echo -e "${GREEN}✅ Device ID já configurado corretamente${NC}"
        DEVICE_ID="$CURRENT_DEVICE_ID"
    fi
fi
echo ""

# 3. Mostrar informações
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}📋 Informações do Device${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "   Device ID: ${BLUE}$DEVICE_ID${NC}"
echo -e "   MAC: ${BLUE}$MAC${NC}"
echo ""

# 4. Instruções para gerar API Key
echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}🔑 Próximo Passo: Gerar API Key${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo ""
echo -e "Escolha uma opção:"
echo ""
echo -e "${BLUE}Opção 1: Via Flutter App (Recomendado)${NC}"
echo "   1. Abra o app Flutter Tag"
echo "   2. Vá em 'Dispositivos'"
echo "   3. Procure pelo Edge-Pro ou adicione manualmente"
echo "   4. Use o Device ID: ${GREEN}$DEVICE_ID${NC}"
echo ""
echo -e "${BLUE}Opção 2: Via cURL (Manual)${NC}"
echo ""
echo "   # 1. Fazer login"
echo "   TOKEN=\$(curl -s -X POST https://api.granobox.com.br/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"seu@email.com\",\"password\":\"suasenha\"}' \\"
echo "     | jq -r '.access_token')"
echo ""
echo "   # 2. Gerar API Key"
echo "   curl -X POST \\"
echo "     \"https://api.granobox.com.br/devices/$DEVICE_ID/generate-key\" \\"
echo "     -H \"Authorization: Bearer \$TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"deviceType\":\"edge-pro\"}' \\"
echo "     | jq '.'"
echo ""
echo -e "${YELLOW}───────────────────────────────────────────${NC}"
echo ""
read -p "Você já tem a API Key? (s/n): " HAS_API_KEY

if [ "$HAS_API_KEY" = "s" ] || [ "$HAS_API_KEY" = "S" ]; then
    echo ""
    read -p "Cole a API Key aqui: " API_KEY
    
    if [ -z "$API_KEY" ]; then
        echo -e "${RED}❌ API Key não pode ser vazia${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}⚙️  Configurando Edge-Pro...${NC}"
    
    # Criar arquivo de config temporário
    ssh "$PI_HOST" "cat > /tmp/edge-pro-config.yaml << 'EOF'
device:
  id: \"$DEVICE_ID\"
  name: \"Edge-Pro Device\"
  version: \"1.0.0\"
  location: \"\"
  hostname: \"\"

socketio:
  server_url: \"https://api.granobox.com.br\"
  namespace: \"/agents\"
  agent_fingerprint: \"$DEVICE_ID\"
  api_key: \"$API_KEY\"
  reconnect_delay: 5
  local_port: 3000

api:
  port: 8080
  host: \"0.0.0.0\"

display:
  enabled: false
  service_url: \"localhost:3006\"
  type: \"rgb\"

printer:
  auto_detect_usb: true
  tcp_printers: []

debug: false
EOF
"
    
    # Copiar para o local correto
    ssh "$PI_HOST" "sudo mv /tmp/edge-pro-config.yaml $CONFIG_FILE && sudo chown tagment:tagment $CONFIG_FILE"
    
    echo -e "${GREEN}✅ Configuração salva em $CONFIG_FILE${NC}"
    echo ""
    
    # Perguntar se quer iniciar o serviço
    read -p "Deseja iniciar o serviço agora? (s/n): " START_SERVICE
    
    if [ "$START_SERVICE" = "s" ] || [ "$START_SERVICE" = "S" ]; then
        echo ""
        echo -e "${YELLOW}🚀 Iniciando serviço...${NC}"
        ssh "$PI_HOST" "sudo systemctl daemon-reload && sudo systemctl enable edge-pro.service && sudo systemctl restart edge-pro.service"
        echo -e "${GREEN}✅ Serviço iniciado!${NC}"
        echo ""
        echo -e "${YELLOW}📋 Ver logs:${NC}"
        echo "   ssh $PI_HOST 'sudo journalctl -u edge-pro.service -f'"
    fi
    
else
    echo ""
    echo -e "${YELLOW}ℹ️  Configure a API Key manualmente depois:${NC}"
    echo ""
    echo "   ssh $PI_HOST"
    echo "   sudo nano $CONFIG_FILE"
    echo ""
    echo "   Adicione:"
    echo "     socketio:"
    echo "       agent_fingerprint: \"$DEVICE_ID\""
    echo "       api_key: \"sua-api-key-aqui\""
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Configuração concluída!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Device ID:${NC} $DEVICE_ID"
echo -e "${BLUE}Config:${NC} $CONFIG_FILE"
echo ""

