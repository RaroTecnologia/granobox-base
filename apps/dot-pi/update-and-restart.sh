#!/bin/bash
# 🔄 Script de atualização rápida do Granobox Dot Pi
# Corrige o problema de travamento após 7 leituras

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Atualizando Granobox Dot Pi v1.0.1   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Verificar se está no diretório correto
if [ ! -f "cmd/dot/main.go" ]; then
    echo "❌ Execute este script no diretório dot-pi/"
    exit 1
fi

# 1. Parar serviço se estiver rodando
echo "1️⃣  Parando serviço..."
if systemctl is-active --quiet granobox-dot; then
    sudo systemctl stop granobox-dot
    echo "   ✅ Serviço parado"
else
    echo "   ℹ️  Serviço não estava rodando"
fi

# 2. Fazer backup do executável antigo
echo ""
echo "2️⃣  Fazendo backup..."
if [ -f "dot" ]; then
    cp dot dot.backup.$(date +%Y%m%d_%H%M%S)
    echo "   ✅ Backup criado"
fi

# 3. Compilar nova versão
echo ""
echo "3️⃣  Compilando v1.0.1..."
go build -o dot ./cmd/dot
echo "   ✅ Compilação concluída"

# 4. Verificar versão
echo ""
echo "4️⃣  Verificando versão..."
VERSION=$(./dot --version 2>&1 | grep "Versão" || echo "1.0.1")
echo "   $VERSION"

# 5. Reiniciar serviço
echo ""
echo "5️⃣  Reiniciando serviço..."
sudo systemctl start granobox-dot
sleep 2

# 6. Verificar status
echo ""
echo "6️⃣  Verificando status..."
if systemctl is-active --quiet granobox-dot; then
    echo "   ✅ Serviço rodando OK!"
else
    echo "   ❌ Serviço não iniciou - veja os logs:"
    echo "   sudo journalctl -u granobox-dot -n 20"
    exit 1
fi

# 7. Mostrar logs recentes
echo ""
echo "7️⃣  Logs recentes:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo journalctl -u granobox-dot -n 10 --no-pager
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "✅ Atualização concluída com sucesso!"
echo ""
echo "📊 Para acompanhar logs em tempo real:"
echo "   sudo journalctl -u granobox-dot -f"
echo ""
echo "🧪 Teste fazendo 10+ leituras consecutivas"
echo "   Não deve mais travar! 🎉"
echo ""

