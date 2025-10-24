#!/bin/bash

# Script para configurar WiFi e SSH no Armbian ANTES do primeiro boot
# Executar DEPOIS de gravar a imagem, ANTES de ejetar o MicroSD
# Uso: ./setup-wifi-ssh.sh [número_do_disco]

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Configuração WiFi/SSH - Armbian      ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Se passou parâmetro, usar. Senão, perguntar
if [ -n "$1" ]; then
    DISK_NUM="$1"
    echo "📝 Usando disco especificado: /dev/disk${DISK_NUM}"
    echo ""
else
    # Listar discos disponíveis
    echo "💾 Discos/partições disponíveis:"
    diskutil list
    echo ""
    
    # Pedir número do disco
    read -p "Digite o número do disco do MicroSD (ex: 2 para /dev/disk2): " DISK_NUM
fi

DISK="/dev/disk${DISK_NUM}"

# Verificar se disco existe
if [ ! -e "$DISK" ]; then
    echo "❌ Erro: Disco $DISK não existe"
    exit 1
fi

# Detectar partição boot (normalmente disk2s1)
BOOT_PARTITION="${DISK}s1"

echo ""
echo "🔍 Buscando partição boot..."

# Montar partição boot se não estiver montada
MOUNT_POINT=$(diskutil info $BOOT_PARTITION | grep "Mount Point" | awk '{print $3}')

if [ -z "$MOUNT_POINT" ] || [ "$MOUNT_POINT" == "" ]; then
    echo "🔧 Montando partição boot..."
    diskutil mount $BOOT_PARTITION
    sleep 2
    MOUNT_POINT=$(diskutil info $BOOT_PARTITION | grep "Mount Point" | awk '{print $3}')
fi

if [ -z "$MOUNT_POINT" ] || [ "$MOUNT_POINT" == "" ]; then
    echo "❌ Erro: Não foi possível montar partição boot"
    echo "💡 Tente remover e inserir o MicroSD novamente"
    exit 1
fi

echo "✅ Partição boot montada em: $MOUNT_POINT"
echo ""

# ==========================================
# CONFIGURAR SSH
# ==========================================
echo "🔐 Habilitando SSH..."

# Criar arquivo .not_logged_in_yet para forçar setup inicial via SSH
touch "${MOUNT_POINT}/.not_logged_in_yet"

echo "✅ SSH habilitado"
echo ""

# ==========================================
# CONFIGURAR WIFI
# ==========================================
echo "📶 Configurando WiFi..."
echo ""

read -p "Nome da rede WiFi (SSID): " WIFI_SSID
read -sp "Senha da rede WiFi: " WIFI_PASSWORD
echo ""
read -p "País (BR para Brasil): " COUNTRY
COUNTRY=${COUNTRY:-BR}

echo ""
echo "Configurando WiFi:"
echo "  SSID: $WIFI_SSID"
echo "  País: $COUNTRY"
echo ""

# Criar arquivo de configuração WiFi para Armbian
# Armbian usa NetworkManager por padrão
cat > "${MOUNT_POINT}/armbian_first_run.txt" << EOF
# Armbian First Run Configuration
# Este arquivo é lido no primeiro boot

# Configuração WiFi
PRESET_NET_WIFI_ENABLED=1
PRESET_NET_WIFI_SSID="$WIFI_SSID"
PRESET_NET_WIFI_KEY="$WIFI_PASSWORD"
PRESET_NET_WIFI_COUNTRYCODE="$COUNTRY"

# Habilitar SSH
PRESET_NET_CHANGE_DEFAULTS=1
EOF

echo "✅ WiFi configurado"
echo ""

# ==========================================
# HABILITAR UART1 (para GM861)
# ==========================================
echo "🔧 Habilitando UART1 (para GM861)..."

# Verificar se armbianEnv.txt existe
if [ -f "${MOUNT_POINT}/armbianEnv.txt" ]; then
    # Verificar se uart1 já está configurado
    if grep -q "overlays=uart1" "${MOUNT_POINT}/armbianEnv.txt"; then
        echo "ℹ️  UART1 já está habilitado"
    else
        # Adicionar uart1 aos overlays
        if grep -q "overlays=" "${MOUNT_POINT}/armbianEnv.txt"; then
            # Já tem overlays, adicionar uart1
            sed -i '' 's/overlays=/overlays=uart1 /' "${MOUNT_POINT}/armbianEnv.txt"
        else
            # Não tem overlays, adicionar linha
            echo "overlays=uart1" >> "${MOUNT_POINT}/armbianEnv.txt"
        fi
        echo "✅ UART1 habilitado"
    fi
else
    echo "⚠️  armbianEnv.txt não encontrado (será criado no primeiro boot)"
fi

echo ""

# ==========================================
# CRIAR SCRIPT DE PRIMEIRA INICIALIZAÇÃO
# ==========================================
echo "📝 Criando script de setup automático..."

# Detectar partição root (normalmente disk2s2)
ROOT_PARTITION="${DISK}s2"

# Tentar montar partição root
ROOT_MOUNT=$(diskutil info $ROOT_PARTITION 2>/dev/null | grep "Mount Point" | awk '{print $3}')

if [ -z "$ROOT_MOUNT" ] || [ "$ROOT_MOUNT" == "" ]; then
    echo "🔧 Tentando montar partição root..."
    diskutil mount $ROOT_PARTITION 2>/dev/null || true
    sleep 1
    ROOT_MOUNT=$(diskutil info $ROOT_PARTITION 2>/dev/null | grep "Mount Point" | awk '{print $3}')
fi

if [ ! -z "$ROOT_MOUNT" ] && [ "$ROOT_MOUNT" != "" ]; then
    echo "✅ Partição root montada em: $ROOT_MOUNT"
    
    # Criar script de primeira inicialização
    cat > "${ROOT_MOUNT}/root/.first_boot_setup.sh" << 'SCRIPT_EOF'
#!/bin/bash
# Script executado no primeiro boot

# Adicionar usuário ao grupo dialout (para serial)
if id "pi" &>/dev/null; then
    usermod -a -G dialout pi
fi

# Deletar este script após executar
rm -f /root/.first_boot_setup.sh
SCRIPT_EOF

    chmod +x "${ROOT_MOUNT}/root/.first_boot_setup.sh"
    
    # Adicionar ao rc.local se existir
    if [ -f "${ROOT_MOUNT}/etc/rc.local" ]; then
        # Verificar se já não está lá
        if ! grep -q ".first_boot_setup.sh" "${ROOT_MOUNT}/etc/rc.local"; then
            sed -i '' '/exit 0/i\
/root/.first_boot_setup.sh
' "${ROOT_MOUNT}/etc/rc.local"
        fi
    fi
    
    echo "✅ Script de setup criado"
else
    echo "ℹ️  Não foi possível montar partição root (filesystem ext4)"
    echo "   Setup manual será necessário no primeiro boot"
fi

echo ""

# ==========================================
# RESUMO
# ==========================================
echo "╔════════════════════════════════════════╗"
echo "║         Configuração Concluída! ✅     ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "📋 Configurações aplicadas:"
echo "  ✅ SSH habilitado"
echo "  ✅ WiFi configurado: $WIFI_SSID"
echo "  ✅ UART1 habilitado (para GM861)"
echo ""
echo "🔄 Próximos passos:"
echo "  1. Ejetar MicroSD com segurança"
echo "  2. Inserir no Orange Pi Zero 2W"
echo "  3. Conectar fonte USB-C (5V 2A)"
echo "  4. Aguardar ~2 minutos (conectará ao WiFi)"
echo "  5. SSH: ssh root@orangepi.local (senha: 1234)"
echo ""
echo "💡 Descobrir IP do Orange Pi:"
echo "   - Via mDNS: orangepi.local"
echo "   - Via roteador: buscar 'orangepizero2w'"
echo "   - Via nmap: nmap -sn 192.168.1.0/24"
echo ""

read -p "Pressione ENTER para ejetar MicroSD com segurança..."

# Desmontar partições
echo ""
echo "📤 Ejetando MicroSD..."
diskutil unmountDisk $DISK
diskutil eject $DISK

echo "✅ MicroSD ejetado com segurança!"
echo ""
echo "👉 Agora pode remover o MicroSD do Mac"
echo ""

