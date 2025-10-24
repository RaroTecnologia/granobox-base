#!/bin/bash

# Script para gravar Armbian no MicroSD
# Uso: ./flash-armbian.sh [arquivo.img.xz]
#      Se não especificar, busca automaticamente na pasta atual

set -e

echo "╔════════════════════════════════════════╗"
echo "║   Gravador de Imagem Armbian - macOS   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Se não passou parâmetro, tentar auto-detectar
if [ -z "$1" ]; then
    echo "🔍 Buscando imagem Armbian na pasta atual..."
    
    # Buscar arquivos .img.xz
    IMAGE_FILES=($(ls -1 Armbian*.img.xz 2>/dev/null))
    
    if [ ${#IMAGE_FILES[@]} -eq 0 ]; then
        # Buscar arquivos .img
        IMAGE_FILES=($(ls -1 Armbian*.img 2>/dev/null))
    fi
    
    if [ ${#IMAGE_FILES[@]} -eq 0 ]; then
        echo "❌ Erro: Nenhuma imagem Armbian encontrada"
        echo ""
        echo "Uso:"
        echo "  ./flash-armbian.sh [arquivo.img.xz]"
        echo ""
        echo "Ou baixe em: https://www.armbian.com/orange-pi-zero-2w/"
        exit 1
    elif [ ${#IMAGE_FILES[@]} -eq 1 ]; then
        IMAGE_FILE="${IMAGE_FILES[0]}"
        echo "✅ Imagem encontrada: $IMAGE_FILE"
    else
        echo "📂 Múltiplas imagens encontradas:"
        for i in "${!IMAGE_FILES[@]}"; do
            echo "  $((i+1)). ${IMAGE_FILES[$i]}"
        done
        echo ""
        read -p "Escolha o número da imagem (1-${#IMAGE_FILES[@]}): " IMG_NUM
        IMAGE_FILE="${IMAGE_FILES[$((IMG_NUM-1))]}"
    fi
else
    IMAGE_FILE="$1"
fi

# Verificar se arquivo existe
if [ ! -f "$IMAGE_FILE" ]; then
    echo "❌ Erro: Arquivo não encontrado: $IMAGE_FILE"
    exit 1
fi

echo ""
echo "📂 Imagem: $IMAGE_FILE"

# Detectar tipo de imagem
if [[ "$IMAGE_FILE" == *"minimal"* ]]; then
    echo "🎯 Tipo: MINIMAL (Ideal para servidor - sem pacotes extras)"
elif [[ "$IMAGE_FILE" == *"desktop"* ]]; then
    echo "🖥️  Tipo: DESKTOP (Com interface gráfica)"
else
    echo "📦 Tipo: STANDARD (Sistema padrão)"
fi

# Detectar versão
if [[ "$IMAGE_FILE" =~ Armbian_([0-9.]+)_ ]]; then
    VERSION="${BASH_REMATCH[1]}"
    echo "📌 Versão: Armbian $VERSION"
fi

# Detectar kernel
if [[ "$IMAGE_FILE" =~ _([0-9]+\.[0-9]+\.[0-9]+) ]]; then
    KERNEL="${BASH_REMATCH[1]}"
    echo "🔧 Kernel: $KERNEL"
fi

echo ""

# Listar discos disponíveis
echo "💾 Discos disponíveis:"
diskutil list
echo ""

# Pedir confirmação do disco
echo "⚠️  ATENÇÃO: Escolha o disco correto!"
echo "   Geralmente o MicroSD aparece como /dev/disk2 ou /dev/disk3"
echo ""
read -p "Digite o número do disco (ex: 2 para /dev/disk2): " DISK_NUM

DISK="/dev/disk${DISK_NUM}"
RAW_DISK="/dev/rdisk${DISK_NUM}"

# Verificar se disco existe
if [ ! -e "$DISK" ]; then
    echo "❌ Erro: Disco $DISK não existe"
    exit 1
fi

# Mostrar informações do disco
echo ""
echo "ℹ️  Informações do disco $DISK:"
diskutil info $DISK | grep -E "Device Node|Disk Size|Volume Name"
echo ""

# Confirmação final
read -p "⚠️  CONFIRMA gravar em $DISK? Todos os dados serão APAGADOS! (sim/não): " CONFIRM

if [ "$CONFIRM" != "sim" ]; then
    echo "❌ Cancelado pelo usuário"
    exit 1
fi

echo ""
echo "🔧 Desmontando $DISK..."
diskutil unmountDisk $DISK

echo ""
echo "📝 Gravando imagem..."
echo "   Isso pode demorar 5-10 minutos"
echo "   Aguarde até aparecer 'Concluído!'"
echo ""

# Extrair e gravar
if [[ "$IMAGE_FILE" == *.xz ]]; then
    # Arquivo comprimido .xz
    echo "📦 Descomprimindo e gravando..."
    xz -dc "$IMAGE_FILE" | sudo dd of=$RAW_DISK bs=4m status=progress
else
    # Arquivo .img direto
    echo "📝 Gravando diretamente..."
    sudo dd if="$IMAGE_FILE" of=$RAW_DISK bs=4m status=progress
fi

echo ""
echo "🔄 Sincronizando..."
sync

echo ""
echo "╔════════════════════════════════════════╗"
echo "║        Gravação Finalizada! 🎉         ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "⚠️  IMPORTANTE: Configurar WiFi e SSH!"
echo ""
echo "Sem WiFi configurado, você vai precisar de monitor e teclado."
echo ""
echo "🎯 RECOMENDADO: Execute o script de configuração AGORA:"
echo ""
echo "  ./setup-wifi-ssh.sh"
echo ""
echo "Isso vai configurar:"
echo "  ✅ WiFi (conexão automática no boot)"
echo "  ✅ SSH (acesso remoto sem monitor)"
echo "  ✅ UART1 (para o leitor GM861)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Configurar WiFi/SSH agora? (s/n): " SETUP_NOW

if [ "$SETUP_NOW" = "s" ] || [ "$SETUP_NOW" = "S" ]; then
    echo ""
    echo "🔄 Remontando partições do MicroSD..."
    sleep 2  # Aguardar sistema reconhecer partições
    diskutil list $DISK
    echo ""
    # Passar número do disco para o setup-wifi-ssh.sh
    DISK_NUM=$(echo $DISK | sed 's/\/dev\/disk//')
    ./setup-wifi-ssh.sh $DISK_NUM
else
    echo ""
    echo "⚠️  OK, mas lembre-se:"
    echo "   Sem WiFi configurado = precisa monitor + teclado"
    echo ""
    echo "💡 Para configurar depois, execute:"
    echo "   ./setup-wifi-ssh.sh"
    echo ""
    echo "📤 Ejetando MicroSD..."
    diskutil eject $DISK
    echo "✅ MicroSD ejetado!"
    echo ""
fi

