#!/bin/bash

# Configuração WiFi para Armbian SEM montar partição ext4
# Cria arquivo de configuração que será lido no primeiro boot

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Setup WiFi - Método Alternativo       ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "⚠️  ATENÇÃO: Este é o método alternativo"
echo "   Use quando não conseguir montar a partição ext4"
echo ""

# Pedir informações WiFi
read -p "Nome da rede WiFi (SSID): " WIFI_SSID
read -sp "Senha da rede WiFi: " WIFI_PASSWORD
echo ""
read -p "País (BR para Brasil): " COUNTRY
COUNTRY=${COUNTRY:-BR}

echo ""
echo "📝 Gerando arquivo de configuração..."
echo ""

# Criar arquivo temporário
TMP_FILE="/tmp/armbian_wifi_config.txt"

cat > "$TMP_FILE" << EOF
# Armbian First Run Configuration

PRESET_NET_WIFI_ENABLED=1
PRESET_NET_WIFI_SSID="$WIFI_SSID"
PRESET_NET_WIFI_KEY="$WIFI_PASSWORD"
PRESET_NET_WIFI_COUNTRYCODE="$COUNTRY"
PRESET_NET_CHANGE_DEFAULTS=1

# Habilitar UART1 para GM861
overlays=uart1
EOF

echo "✅ Arquivo de configuração criado"
echo ""
echo "📋 Conteúdo:"
cat "$TMP_FILE"
echo ""
echo "════════════════════════════════════════"
echo ""
echo "⚠️  PRÓXIMOS PASSOS MANUAIS:"
echo ""
echo "Como o macOS não monta ext4, você tem 2 opções:"
echo ""
echo "OPÇÃO A - Primeiro Boot com Monitor (Mais Simples):"
echo "  1. Insira o MicroSD no Orange Pi"
echo "  2. Conecte monitor HDMI e teclado USB"
echo "  3. Ligue o Orange Pi"
echo "  4. Login: root / senha: 1234"
echo "  5. Configure manualmente:"
echo "     sudo nmtui  # Configurar WiFi"
echo "  6. Depois pode usar SSH normalmente"
echo ""
echo "OPÇÃO B - Usar Cabo Ethernet (Sem Monitor):"
echo "  1. Insira o MicroSD no Orange Pi"
echo "  2. Conecte cabo ethernet no roteador"
echo "  3. Ligue o Orange Pi"
echo "  4. Descubra IP no roteador (buscar 'orangepi')"
echo "  5. SSH: ssh root@IP_DO_ORANGE_PI"
echo "  6. Senha: 1234"
echo "  7. Configure WiFi: sudo nmtui"
echo "  8. Depois pode desconectar ethernet"
echo ""
echo "OPÇÃO C - Instalar driver ext4 no macOS:"
echo "  1. brew install --cask osxfuse"
echo "  2. brew install ext4fuse"
echo "  3. Reiniciar Mac"
echo "  4. Executar: ./setup-wifi-ssh.sh 10"
echo ""

rm -f "$TMP_FILE"

echo "═══════════════════════════════════════════"
echo ""
read -p "Entendeu? Pressione ENTER para continuar..."

