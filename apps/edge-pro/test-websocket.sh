#!/bin/bash

# Script de teste para o novo cliente WebSocket puro do Edge-Pro

set -e

echo "🧪 Testando Edge-Pro com WebSocket Puro..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "go.mod" ]; then
    echo -e "${RED}❌ Erro: Execute este script no diretório apps/edge-pro${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Compilando Edge-Pro...${NC}"
if go build -o /tmp/edge-pro-test cmd/edge-pro/main.go; then
    echo -e "${GREEN}✅ Compilação bem-sucedida!${NC}"
else
    echo -e "${RED}❌ Erro na compilação${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔍 Verificando dependências do WebSocket...${NC}"
if go list -m github.com/gorilla/websocket > /dev/null 2>&1; then
    echo -e "${GREEN}✅ gorilla/websocket encontrado${NC}"
else
    echo -e "${RED}❌ gorilla/websocket não encontrado${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Verificando estrutura do cliente WebSocket...${NC}"

if [ -f "internal/websocket/client.go" ]; then
    echo -e "${GREEN}✅ Cliente WebSocket encontrado (internal/websocket/client.go)${NC}"
else
    echo -e "${RED}❌ Cliente WebSocket não encontrado${NC}"
    exit 1
fi

# Verificar se há referências ao Socket.IO no novo cliente
if grep -q "socketio\|SocketIO\|Socket.IO" internal/websocket/client.go 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Aviso: Encontradas referências a Socket.IO no cliente WebSocket${NC}"
else
    echo -e "${GREEN}✅ Cliente WebSocket não contém referências a Socket.IO${NC}"
fi

echo ""
echo -e "${YELLOW}📡 Verificando protocolo de mensagens...${NC}"

# Verificar tipos de mensagem esperados
if grep -q '"type".*"register"' internal/websocket/client.go; then
    echo -e "${GREEN}✅ Mensagem 'register' encontrada${NC}"
fi

if grep -q '"type".*"heartbeat"' internal/websocket/client.go; then
    echo -e "${GREEN}✅ Mensagem 'heartbeat' encontrada${NC}"
fi

if grep -q '"type".*"print_job"' internal/websocket/client.go; then
    echo -e "${GREEN}✅ Mensagem 'print_job' encontrada${NC}"
fi

echo ""
echo -e "${YELLOW}🔗 Verificando URL de conexão...${NC}"

if grep -q "edge-go-ws" internal/websocket/client.go; then
    echo -e "${GREEN}✅ URL '/edge-go-ws' encontrada (compatível com Edge-Go)${NC}"
else
    echo -e "${YELLOW}⚠️  URL '/edge-go-ws' não encontrada${NC}"
fi

if grep -q "ws.granobox.com.br" internal/websocket/client.go; then
    echo -e "${GREEN}✅ URL de produção encontrada (ws.granobox.com.br)${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Testes de estrutura concluídos!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo "  1. Configurar o Edge-Pro com API Key válida"
echo "  2. Testar conexão WebSocket com a API"
echo "  3. Testar registro do dispositivo"
echo "  4. Testar heartbeat"
echo "  5. Testar impressão via WebSocket"
echo ""
echo -e "${YELLOW}💡 Para testar conexão real:${NC}"
echo "  EDGE_PRO_DEV=true /tmp/edge-pro-test -config configs/config.dev.yaml -debug"
echo ""

