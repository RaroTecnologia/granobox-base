#!/bin/bash

# Script de deploy do Edge-Pro para Raspberry Pi

set -e

PI_HOST="tagment@192.168.10.140"
PI_USER="tagment"
INSTALL_DIR="/opt/edge-pro"
BINARY_NAME="edge-pro"
SERVICE_NAME="edge-pro.service"

echo "🚀 Deploy do Edge-Pro para Raspberry Pi"
echo "📡 Host: $PI_HOST"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Compilar binário para ARM64
echo -e "${YELLOW}📦 Compilando binário para ARM64...${NC}"
cd "$(dirname "$0")"
GOOS=linux GOARCH=arm64 go build -o /tmp/edge-pro-linux-arm64 cmd/edge-pro/main.go

if [ ! -f /tmp/edge-pro-linux-arm64 ]; then
    echo -e "${RED}❌ Erro: Binário não foi compilado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Binário compilado: $(ls -lh /tmp/edge-pro-linux-arm64 | awk '{print $5}')${NC}"
echo ""

# 2. Testar conexão SSH
echo -e "${YELLOW}🔌 Testando conexão SSH...${NC}"
if ! ssh -o ConnectTimeout=5 "$PI_HOST" "echo 'SSH OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Erro: Não foi possível conectar via SSH${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Conexão SSH OK${NC}"
echo ""

# 3. Criar estrutura de diretórios no Pi
echo -e "${YELLOW}📁 Criando estrutura de diretórios...${NC}"
ssh "$PI_HOST" "sudo mkdir -p $INSTALL_DIR/configs $INSTALL_DIR/logs /etc/edge-pro && sudo chown -R $PI_USER:$PI_USER $INSTALL_DIR"
echo -e "${GREEN}✅ Diretórios criados${NC}"
echo ""

# 4. Enviar binário
echo -e "${YELLOW}📤 Enviando binário...${NC}"
scp /tmp/edge-pro-linux-arm64 "$PI_HOST:/tmp/$BINARY_NAME"
ssh "$PI_HOST" "sudo mv /tmp/$BINARY_NAME $INSTALL_DIR/$BINARY_NAME && sudo chmod +x $INSTALL_DIR/$BINARY_NAME && sudo chown $PI_USER:$PI_USER $INSTALL_DIR/$BINARY_NAME"
echo -e "${GREEN}✅ Binário enviado${NC}"
echo ""

# 5. Enviar arquivos de configuração
echo -e "${YELLOW}📤 Enviando arquivos de configuração...${NC}"
scp configs/config.granobox.yaml "$PI_HOST:/tmp/config.yaml"
ssh "$PI_HOST" "sudo mv /tmp/config.yaml /etc/edge-pro/config.yaml && sudo chown $PI_USER:$PI_USER /etc/edge-pro/config.yaml"
echo -e "${GREEN}✅ Configuração enviada${NC}"
echo ""

# 6. Criar serviço systemd
echo -e "${YELLOW}⚙️  Configurando serviço systemd...${NC}"
cat > /tmp/$SERVICE_NAME << 'EOF'
[Unit]
Description=Granobox Edge-Pro Service (WebSocket)
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=tagment
Group=tagment
WorkingDirectory=/opt/edge-pro
ExecStart=/opt/edge-pro/edge-pro -config /etc/edge-pro/config.yaml
Restart=always
RestartSec=10

# Environment
Environment="EDGE_PRO_DEBUG=false"

# Security
NoNewPrivileges=true
PrivateTmp=true

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=edge-pro

[Install]
WantedBy=multi-user.target
EOF

scp /tmp/$SERVICE_NAME "$PI_HOST:/tmp/$SERVICE_NAME"
ssh "$PI_HOST" "sudo mv /tmp/$SERVICE_NAME /etc/systemd/system/$SERVICE_NAME && sudo systemctl daemon-reload"
echo -e "${GREEN}✅ Serviço configurado${NC}"
echo ""

# 7. Verificar status do serviço (se já existe)
echo -e "${YELLOW}🔍 Verificando serviço...${NC}"
if ssh "$PI_HOST" "sudo systemctl is-enabled $SERVICE_NAME" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Serviço já existe, recarregando...${NC}"
    ssh "$PI_HOST" "sudo systemctl stop $SERVICE_NAME || true"
    ssh "$PI_HOST" "sudo systemctl daemon-reload"
else
    echo -e "${GREEN}✅ Novo serviço criado${NC}"
fi
echo ""

# 8. Mostrar informações finais
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo ""
echo "1. Configurar API Key no Pi:"
echo "   ssh $PI_HOST"
echo "   sudo nano /etc/edge-pro/config.yaml"
echo "   # Adicione a api_key e agent_fingerprint"
echo ""
echo "2. Habilitar e iniciar o serviço:"
echo "   ssh $PI_HOST 'sudo systemctl enable $SERVICE_NAME'"
echo "   ssh $PI_HOST 'sudo systemctl start $SERVICE_NAME'"
echo ""
echo "3. Verificar logs:"
echo "   ssh $PI_HOST 'sudo journalctl -u $SERVICE_NAME -f'"
echo ""
echo "4. Verificar status:"
echo "   ssh $PI_HOST 'sudo systemctl status $SERVICE_NAME'"
echo ""

