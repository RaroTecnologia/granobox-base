#!/bin/bash

# Script de deploy para API do Granobox
set -e

echo "🚀 Iniciando deploy da API do Granobox..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    print_error "Docker não está rodando. Inicie o Docker e tente novamente."
    exit 1
fi

# Parar containers existentes
print_status "Parando containers existentes..."
docker-compose down --remove-orphans

# Build da imagem
print_status "Fazendo build da imagem..."
docker-compose build --no-cache

# Iniciar serviços
print_status "Iniciando serviços..."
docker-compose up -d

# Aguardar API ficar pronta
print_status "Aguardando API ficar pronta..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        print_status "✅ API está rodando em http://localhost:3001"
        break
    fi
    
    attempt=$((attempt + 1))
    print_status "Tentativa $attempt/$max_attempts - aguardando API..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "API não ficou pronta em tempo hábil"
    print_status "Logs da API:"
    docker-compose logs granobox-api
    exit 1
fi

# Executar migrações se necessário
print_status "Verificando migrações do banco..."
docker-compose exec granobox-api npm run typeorm:migration:run || print_warning "Migrações não executadas (pode ser normal se não existirem)"

print_status "🎉 Deploy concluído com sucesso!"
print_status "API disponível em: http://localhost:3001"
print_status "Documentação em: http://localhost:3001/api/docs"
print_status "Health check em: http://localhost:3001/api/health"

# Mostrar status dos containers
print_status "Status dos containers:"
docker-compose ps
