#!/bin/bash

# Script de teste da API do Edge v2
# Uso: ./test_api.sh [IP_DA_PI]

PI_IP=${1:-192.168.10.103}
API_PORT=3000
BASE_URL="http://${PI_IP}:${API_PORT}"

echo "🧪 Testando API do Edge v2"
echo "URL: ${BASE_URL}"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4

    echo -e "${YELLOW}► ${description}${NC}"
    echo "  ${method} ${endpoint}"

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X ${method} "${BASE_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "${data}" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X ${method} "${BASE_URL}${endpoint}" 2>&1)
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✓ ${http_code}${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "  ${RED}✗ ${http_code}${NC}"
        echo "$body"
    fi
    echo ""
}

# Health Check
test_endpoint "GET" "/health" "Health Check"

# Device Info
test_endpoint "GET" "/info" "Device Info"

# MQTT Status
test_endpoint "GET" "/mqtt/status" "MQTT Status"

# Display - Status
test_endpoint "POST" "/display/status" "Display - Exibir Status" '{
  "icon": "✅",
  "message": "Test from API",
  "ip": "192.168.10.103",
  "device_id": "edge-001",
  "version": "2.0.0",
  "brightness": 80
}'

sleep 2

# Display - Text
test_endpoint "POST" "/display/text" "Display - Exibir Texto" '{
  "text": "Hello from Go!",
  "font_size": 16,
  "brightness": 80
}'

sleep 2

# Display - Brightness
test_endpoint "POST" "/display/brightness" "Display - Ajustar Brilho" '{
  "brightness": 50
}'

sleep 1

# Display - Clear
test_endpoint "POST" "/display/clear" "Display - Limpar"

echo -e "${GREEN}✅ Testes concluídos!${NC}"



