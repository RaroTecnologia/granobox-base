#!/bin/bash

# Script para atualizar configuração do edge agent
# Uso: ./update-config.sh <user@ip>

if [ $# -eq 0 ]; then
    echo "Uso: $0 <user@ip>"
    echo "Exemplo: $0 tagment@192.168.10.103"
    exit 1
fi

DEVICE="$1"
echo "🔄 Atualizando configuração no dispositivo: $DEVICE"

# Atualizar configuração via SSH
ssh "$DEVICE" << 'EOF'
# Parar o serviço
sudo systemctl stop tagment-edge-v2

# Atualizar configuração
sudo tee /etc/tagment-edge/config.yaml > /dev/null << 'CONFIG_EOF'
device:
  id: "edge-tagment-001"
  version: "2.0.0"
  name: "Edge Tagment Principal"
  location: "Unimed Presidente Prudente"
  hostname: "tgm-edge-359b98"

socketio:
  # URL do servidor Socket.IO do Tagment
  server_url: "https://api.granobox.com.br"
  
  # Namespace para agents
  namespace: "/agents"
  
  # Fingerprint único do dispositivo (modificar para cada device)
  agent_fingerprint: "edge-7308b26a-ec6f-40ab-a5b3-83fb979ffeae"
  
  # API Key do Tagment (OBRIGATÓRIO - obter do painel)
  api_key: "tgm_54b73aa3d87956c47ef40e313160c785679f996e40b0054f824fbdafd5dc672f"
  
  # Delay de reconexão em segundos
  reconnect_delay: 5
  
  # Intervalo de heartbeat em segundos
  heartbeat_interval: 30

api:
  host: "0.0.0.0"
  port: 8080

display:
  enabled: true
  service_url: "localhost:3006"
  type: "rgb"

mqtt:
  enabled: false
  broker: ""
  port: 1883
  username: ""
  password: ""
  qos: 1

debug: true
CONFIG_EOF

# Reiniciar o serviço
sudo systemctl start tagment-edge-v2

echo "✅ Configuração atualizada e serviço reiniciado!"
EOF

echo "✅ Configuração atualizada com sucesso!"
