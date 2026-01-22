#!/bin/bash

# Script de instalação do Granobox Edge-Pro
set -e

echo "🚀 Instalando Granobox Edge-Pro..."

# Verificar se está rodando na Pi
if [ ! -f /proc/device-tree/model ] || ! grep -q "Raspberry Pi" /proc/device-tree/model; then
    echo "⚠️  Este script deve ser executado em um Raspberry Pi"
    exit 1
fi

# Verificar se o binário existe
if [ ! -f "./edge-pro" ]; then
    echo "❌ Binário 'edge-pro' não encontrado no diretório atual"
    echo "Execute 'make build-pi' primeiro no seu Mac"
    exit 1
fi

# Parar serviço se estiver rodando
echo "🛑 Parando serviço existente (se houver)..."
sudo systemctl stop edge-pro 2>/dev/null || true

# Copiar binário
echo "📦 Copiando binário..."
sudo cp edge-pro /usr/local/bin/edge-pro
sudo chmod +x /usr/local/bin/edge-pro

# Criar link simbólico
sudo ln -sf /usr/local/bin/edge-pro /home/granobox/edge-pro

# Copiar arquivo de serviço
echo "📝 Instalando serviço systemd..."
sudo cp scripts/edge-pro.service /etc/systemd/system/

# Criar diretório de configuração
echo "📁 Criando diretório de configuração..."
sudo mkdir -p /etc/edge-pro
sudo chown granobox:granobox /etc/edge-pro

# Copiar configuração de exemplo (se existir)
if [ -f "configs/config.granobox.yaml" ]; then
    sudo cp configs/config.granobox.yaml /etc/edge-pro/config.yaml
    echo "✅ Arquivo de configuração criado em /etc/edge-pro/config.yaml"
    echo "   Edite este arquivo para configurar o edge-pro"
fi

# Recarregar systemd
echo "🔄 Recarregando systemd..."
sudo systemctl daemon-reload

# Habilitar serviço
echo "✅ Habilitando serviço..."
sudo systemctl enable edge-pro

# Iniciar serviço
echo "▶️  Iniciando serviço..."
sudo systemctl start edge-pro

# Verificar status
echo ""
echo "📊 Status do serviço:"
sudo systemctl status edge-pro --no-pager

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "Comandos úteis:"
echo "  sudo systemctl status edge-pro   - Ver status"
echo "  sudo systemctl restart edge-pro  - Reiniciar"
echo "  sudo journalctl -u edge-pro -f   - Ver logs"
echo ""



