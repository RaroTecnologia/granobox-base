#!/bin/bash
# Build e deploy do Edge v2 para Raspberry Pi

PI_IP="192.168.10.103"
PI_USER="tagment"
PROJECT_DIR="edge-v2"

echo "🚀 Build e Deploy Edge v2"
echo ""

# 1. Criar estrutura na Pi se não existir
echo "📁 Preparando diretório na Pi..."
ssh $PI_USER@$PI_IP "mkdir -p ~/$PROJECT_DIR/{cmd/edge,internal/{api,config,display,hardware,mqtt,socketio,models},pkg/logger,configs}"

# 2. Copiar código fonte
echo "📦 Copiando código fonte..."
rsync -avz --exclude 'bin/' --exclude '.git/' ./ $PI_USER@$PI_IP:~/$PROJECT_DIR/

# 3. Compilar na Pi
echo "🔨 Compilando na Pi..."
ssh $PI_USER@$PI_IP << 'EOF'
cd edge-v2
echo "Baixando dependências..."
go mod download
echo "Compilando..."
go build -o bin/edge-arm cmd/edge/main.go
echo "✅ Compilação concluída!"
ls -lh bin/edge-arm
EOF

# 4. Criar arquivo de config se não existir
echo "⚙️  Verificando configuração..."
ssh $PI_USER@$PI_IP << 'EOF'
if [ ! -f ~/edge-v2/config.yaml ]; then
    echo "Criando config.yaml a partir do exemplo..."
    cp ~/edge-v2/configs/config.example.yaml ~/edge-v2/config.yaml
    echo "⚠️  ATENÇÃO: Configure a API Key em ~/edge-v2/config.yaml"
fi
EOF

echo ""
echo "✅ Build e deploy concluídos!"
echo ""
echo "Para executar:"
echo "  ssh $PI_USER@$PI_IP"
echo "  cd edge-v2"
echo "  ./bin/edge-arm -debug"

