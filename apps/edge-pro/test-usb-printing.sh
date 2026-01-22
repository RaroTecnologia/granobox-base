#!/bin/bash

# 🧪 Script de Teste de Impressão USB - Tagment Edge v2
# Este script testa a detecção e impressão USB no Raspberry Pi

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🧪 TESTE DE IMPRESSÃO USB - TAGMENT EDGE V2             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 1. Verificar sistema operacional
info "Verificando sistema operacional..."
if [[ "$(uname -s)" != "Linux" ]]; then
    error "Este script só funciona no Linux (Raspberry Pi)"
    exit 1
fi
success "Sistema operacional: Linux"

# 2. Verificar arquitetura
info "Verificando arquitetura..."
ARCH=$(uname -m)
if [[ "$ARCH" != "aarch64" ]] && [[ "$ARCH" != "armv7l" ]]; then
    warning "Arquitetura não é ARM ($ARCH) - pode não ser Raspberry Pi"
else
    success "Arquitetura: $ARCH (Raspberry Pi)"
fi

# 3. Verificar se /dev/usb existe
info "Verificando diretório /dev/usb..."
if [[ ! -d "/dev/usb" ]]; then
    error "/dev/usb não existe"
    info "Criando /dev/usb (pode precisar de sudo)..."
    sudo mkdir -p /dev/usb
fi
success "/dev/usb existe"

# 4. Procurar impressoras USB
info "Procurando impressoras USB conectadas..."
USB_PRINTERS=$(ls /dev/usb/lp* 2>/dev/null || true)

if [[ -z "$USB_PRINTERS" ]]; then
    error "Nenhuma impressora USB encontrada em /dev/usb/lp*"
    
    # Tentar /dev/lp* como alternativa
    info "Tentando /dev/lp* como alternativa..."
    ALT_PRINTERS=$(ls /dev/lp* 2>/dev/null || true)
    
    if [[ -z "$ALT_PRINTERS" ]]; then
        error "Nenhuma impressora encontrada em /dev/lp* também"
        warning "Conecte uma impressora USB e tente novamente"
        exit 1
    else
        success "Impressoras encontradas em /dev/lp*:"
        echo "$ALT_PRINTERS"
        USB_PRINTERS="$ALT_PRINTERS"
    fi
else
    success "Impressoras USB encontradas:"
    echo "$USB_PRINTERS"
fi

# 5. Verificar permissões
info "Verificando permissões de escrita..."
FIRST_PRINTER=$(echo "$USB_PRINTERS" | head -n 1)
if [[ ! -w "$FIRST_PRINTER" ]]; then
    warning "Sem permissão de escrita em $FIRST_PRINTER"
    info "Tentando ajustar permissões (pode precisar de sudo)..."
    sudo chmod 666 "$FIRST_PRINTER"
    
    if [[ ! -w "$FIRST_PRINTER" ]]; then
        error "Ainda sem permissão de escrita após chmod"
        info "Tente: sudo usermod -a -G lp $USER"
        info "Depois: sudo chmod 666 $FIRST_PRINTER"
        exit 1
    fi
fi
success "Permissões OK para $FIRST_PRINTER"

# 6. Obter informações da impressora
info "Obtendo informações da impressora via lsusb..."
if command -v lsusb &> /dev/null; then
    lsusb | grep -i "printer\|zebra\|tsc\|elgin\|bematech" || true
    success "lsusb executado"
else
    warning "lsusb não instalado (sudo apt install usbutils)"
fi

# 7. Teste de escrita simples
info "Testando escrita simples na impressora..."
echo -e "\n\n\n" > "$FIRST_PRINTER" 2>/dev/null
if [[ $? -eq 0 ]]; then
    success "Teste de escrita simples OK"
else
    error "Falha no teste de escrita simples"
    exit 1
fi

# 8. Gerar ZPL de teste
info "Gerando etiqueta ZPL de teste..."
ZPL_TEST=$(cat << 'EOF'
^XA
^FO50,50^A0N,50,50^FDTeste Tagment^FS
^FO50,120^A0N,40,40^FDEdge v2 - Go^FS
^FO50,180^A0N,30,30^FDImpressora USB OK^FS
^FO50,230^BY3^BCN,100,Y,N,N^FD123456^FS
^XZ
EOF
)

echo "$ZPL_TEST" > /tmp/test-zpl.txt
success "ZPL de teste gerado em /tmp/test-zpl.txt"

# 9. Imprimir etiqueta de teste
info "Enviando ZPL para impressora..."
echo "$ZPL_TEST" > "$FIRST_PRINTER"

if [[ $? -eq 0 ]]; then
    success "Etiqueta enviada com sucesso!"
    info "Aguardando impressão..."
    sleep 3
    success "Teste de impressão concluído"
else
    error "Falha ao enviar etiqueta"
    exit 1
fi

# 10. Verificar se edge-v2 está compilado
info "Verificando binário edge-v2..."
if [[ -f "./edge" ]]; then
    success "Binário edge encontrado: ./edge"
elif [[ -f "./bin/edge" ]]; then
    success "Binário edge encontrado: ./bin/edge"
elif [[ -f "./bin/edge-arm64" ]]; then
    success "Binário edge encontrado: ./bin/edge-arm64"
else
    warning "Binário edge não encontrado"
    info "Compile com: make build-pi"
fi

# 11. Verificar config.json
info "Verificando config.json..."
if [[ -f "./config.json" ]]; then
    success "config.json encontrado"
    
    # Verificar API key
    if grep -q "tgm_your_api_key_here" ./config.json; then
        warning "API key ainda é o exemplo - substitua por uma real"
    else
        success "API key configurada"
    fi
else
    warning "config.json não encontrado"
    info "Copie de: cp configs/config.example.json config.json"
fi

# 12. Resumo
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    📊 RESUMO DOS TESTES                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
success "Sistema operacional: Linux"
success "Arquitetura: $ARCH"
success "Impressoras USB encontradas: $(echo "$USB_PRINTERS" | wc -l)"
success "Permissões de escrita: OK"
success "Teste de impressão: OK"
echo ""

info "Próximos passos:"
echo "  1. Verifique se a etiqueta foi impressa corretamente"
echo "  2. Configure o config.json com sua API key"
echo "  3. Inicie o edge-v2: ./edge --config config.json"
echo "  4. Monitore os logs: journalctl -u tagment-edge-v2 -f"
echo ""

success "Teste concluído com sucesso! 🎉"

