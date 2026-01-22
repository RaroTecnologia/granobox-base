#!/bin/bash
# Script para testar display service remotamente

PI_IP="192.168.10.103"
DISPLAY_PORT="3006"

echo "🎨 Testando Display Service em $PI_IP:$DISPLAY_PORT"
echo ""

# Teste 1: Clear (preto)
echo "1️⃣  Limpando display (preto)..."
echo '{"type":"clear","content":{}}' | nc $PI_IP $DISPLAY_PORT
sleep 2

# Teste 2: Texto simples
echo "2️⃣  Mostrando texto 'HELLO'..."
echo '{"type":"text","content":{"text":"HELLO","font_size":14,"brightness":80}}' | nc $PI_IP $DISPLAY_PORT
sleep 3

# Teste 3: Status
echo "3️⃣  Mostrando status..."
echo '{"type":"status","content":{"icon":"✅","message":"Teste OK","ip":"192.168.10.103","device_id":"edge-001","version":"v2.0","brightness":80}}' | nc $PI_IP $DISPLAY_PORT
sleep 3

# Teste 4: Clear novamente
echo "4️⃣  Limpando novamente..."
echo '{"type":"clear","content":{}}' | nc $PI_IP $DISPLAY_PORT

echo ""
echo "✅ Teste concluído!"
echo ""
echo "O que você viu no display?"
echo "  - Se ficou amarelo = PIL não está funcionando"
echo "  - Se mudou cores = Display está OK!"
echo "  - Se nada mudou = Serviço não está escutando"


