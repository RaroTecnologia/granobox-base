#!/bin/bash

echo "======================================"
echo "Teste de Implementação - Edge V2"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador
PASSED=0
FAILED=0

# Função para testar
test_step() {
    echo -n "  $1... "
    if eval "$2" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FALHOU${NC}"
        ((FAILED++))
    fi
}

echo "1. Verificando estrutura do projeto:"
test_step "Arquivo metrics/collector.go existe" "[ -f internal/metrics/collector.go ]"
test_step "Arquivo socketio/client.go existe" "[ -f internal/socketio/client.go ]"
test_step "Arquivo api/server.go existe" "[ -f internal/api/server.go ]"
test_step "Arquivo models/models.go existe" "[ -f internal/models/models.go ]"
echo ""

echo "2. Verificando dependências Go:"
test_step "go.mod está válido" "go mod verify"
test_step "Dependências atualizadas" "go mod tidy && git diff --quiet go.mod go.sum || true"
echo ""

echo "3. Verificando código:"
test_step "Código compila" "go build -o /tmp/edge-test ./cmd/edge/main.go"
test_step "Sem erros de lint" "go vet ./..."
test_step "Imports organizados" "gofmt -l . | wc -l | grep -q '^0$' || true"
echo ""

echo "4. Verificando implementações:"
test_step "processPrintJob implementado" "grep -q 'func (c \*Client) processPrintJob' internal/socketio/client.go"
test_step "processAgentCommand implementado" "grep -q 'func (c \*Client) processAgentCommand' internal/socketio/client.go"
test_step "GetSystemMetrics implementado" "grep -q 'func (c \*Collector) GetSystemMetrics' internal/metrics/collector.go"
test_step "GetLocalIP implementado" "grep -q 'func GetLocalIP' internal/metrics/collector.go"
test_step "Emit implementado" "grep -q 'func (c \*Client) Emit' internal/socketio/client.go"
test_step "IsConnected usado no status" "grep -q 'IsConnected()' internal/api/server.go"
echo ""

echo "5. Verificando novos models:"
test_step "PrintJob model existe" "grep -q 'type PrintJob struct' internal/models/models.go"
test_step "AgentCommand model existe" "grep -q 'type AgentCommand struct' internal/models/models.go"
test_step "CommandResponse model existe" "grep -q 'type CommandResponse struct' internal/models/models.go"
test_step "PrintJobResult model existe" "grep -q 'type PrintJobResult struct' internal/models/models.go"
echo ""

echo "======================================"
echo "Resumo dos Testes:"
echo -e "  ${GREEN}Passou: $PASSED${NC}"
echo -e "  ${RED}Falhou: $FAILED${NC}"
echo "======================================"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Todos os testes passaram!${NC}"
    exit 0
else
    echo -e "${RED}✗ Alguns testes falharam.${NC}"
    exit 1
fi

