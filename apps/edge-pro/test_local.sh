#!/bin/bash

# Script de teste rápido local
set -e

echo "🧪 Testando Edge v2 localmente..."

cd "$(dirname "$0")"

# Baixar dependências
echo "📥 Baixando dependências..."
go mod download

# Verificar código
echo "🔍 Verificando sintaxe..."
go vet ./...

# Compilar
echo "🔨 Compilando..."
go build -o bin/edge-test cmd/edge/main.go

echo "✅ Build local bem-sucedido!"
echo ""
echo "Para testar localmente (sem hardware):"
echo "  ./bin/edge-test -debug"
echo ""
echo "Para deploy na Pi:"
echo "  make deploy"



