#!/bin/bash

# Script de desenvolvimento para Edge v2
# Facilita o workflow de dev -> build -> deploy -> test

set -e

PI_IP=${TAGMENT_PI_IP:-192.168.10.103}
PI_USER=${TAGMENT_PI_USER:-tagment}

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

show_help() {
    echo "🛠️  Edge v2 Development Tool"
    echo ""
    echo "Uso: ./dev.sh [comando]"
    echo ""
    echo "Comandos:"
    echo "  init          - Baixar dependências e setup inicial"
    echo "  build         - Build para Raspberry Pi"
    echo "  deploy        - Build + deploy completo"
    echo "  quick         - Build + deploy rápido (só binário)"
    echo "  test          - Testar API na Pi"
    echo "  logs          - Ver logs do serviço"
    echo "  status        - Ver status do serviço"
    echo "  restart       - Reiniciar serviço na Pi"
    echo "  ssh           - SSH na Pi"
    echo "  clean         - Limpar arquivos de build"
    echo ""
    echo "Variáveis de ambiente:"
    echo "  TAGMENT_PI_IP    - IP da Raspberry Pi (default: 192.168.10.103)"
    echo "  TAGMENT_PI_USER  - Usuário SSH (default: tagment)"
    echo ""
}

cmd_init() {
    echo -e "${BLUE}📥 Inicializando projeto...${NC}"
    go mod download
    go mod tidy
    mkdir -p bin
    echo -e "${GREEN}✅ Inicialização concluída!${NC}"
}

cmd_build() {
    echo -e "${BLUE}🔨 Compilando para Raspberry Pi...${NC}"
    GOOS=linux GOARCH=arm GOARM=7 go build -ldflags="-s -w" -o bin/edge-arm cmd/edge/main.go
    echo -e "${GREEN}✅ Build concluído: bin/edge-arm${NC}"
    ls -lh bin/edge-arm
}

cmd_deploy() {
    echo -e "${BLUE}🚀 Deploy completo...${NC}"
    cmd_build
    
    echo -e "${YELLOW}📦 Copiando arquivos...${NC}"
    scp bin/edge-arm ${PI_USER}@${PI_IP}:~/edge
    scp -r scripts ${PI_USER}@${PI_IP}:~/
    scp -r configs ${PI_USER}@${PI_IP}:~/
    
    echo -e "${YELLOW}🔧 Instalando serviço...${NC}"
    ssh ${PI_USER}@${PI_IP} "chmod +x scripts/install.sh && ./scripts/install.sh"
    
    echo -e "${GREEN}✅ Deploy concluído!${NC}"
}

cmd_quick() {
    echo -e "${BLUE}⚡ Deploy rápido...${NC}"
    cmd_build
    
    echo -e "${YELLOW}📦 Copiando binário...${NC}"
    scp bin/edge-arm ${PI_USER}@${PI_IP}:~/edge
    
    echo -e "${YELLOW}🔄 Reiniciando serviço...${NC}"
    ssh ${PI_USER}@${PI_IP} "sudo systemctl restart tagment-edge-v2"
    
    sleep 2
    cmd_status
    
    echo -e "${GREEN}✅ Deploy rápido concluído!${NC}"
}

cmd_test() {
    echo -e "${BLUE}🧪 Testando API...${NC}"
    ./scripts/test_api.sh ${PI_IP}
}

cmd_logs() {
    echo -e "${BLUE}📋 Logs do serviço (Ctrl+C para sair)...${NC}"
    ssh ${PI_USER}@${PI_IP} "sudo journalctl -u tagment-edge-v2 -f"
}

cmd_status() {
    echo -e "${BLUE}📊 Status do serviço...${NC}"
    ssh ${PI_USER}@${PI_IP} "sudo systemctl status tagment-edge-v2 --no-pager"
}

cmd_restart() {
    echo -e "${YELLOW}🔄 Reiniciando serviço...${NC}"
    ssh ${PI_USER}@${PI_IP} "sudo systemctl restart tagment-edge-v2"
    sleep 2
    cmd_status
    echo -e "${GREEN}✅ Serviço reiniciado!${NC}"
}

cmd_ssh() {
    echo -e "${BLUE}🔐 Conectando via SSH...${NC}"
    ssh ${PI_USER}@${PI_IP}
}

cmd_clean() {
    echo -e "${YELLOW}🧹 Limpando arquivos...${NC}"
    rm -rf bin/
    echo -e "${GREEN}✅ Limpeza concluída!${NC}"
}

# Main
case "${1}" in
    init)
        cmd_init
        ;;
    build)
        cmd_build
        ;;
    deploy)
        cmd_deploy
        ;;
    quick)
        cmd_quick
        ;;
    test)
        cmd_test
        ;;
    logs)
        cmd_logs
        ;;
    status)
        cmd_status
        ;;
    restart)
        cmd_restart
        ;;
    ssh)
        cmd_ssh
        ;;
    clean)
        cmd_clean
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando desconhecido: ${1}${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac



