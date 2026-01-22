.PHONY: build clean test run deploy

# Variáveis
BINARY_NAME=edge-pro
PI_USER=granobox
PI_HOST=192.168.10.103
PI_PATH=/home/granobox
SERVICE_NAME=edge-pro

# Build para desenvolvimento (local)
build:
	@echo "🔨 Compilando para desenvolvimento..."
	go build -o bin/$(BINARY_NAME) cmd/edge-pro/main.go

# Build para Raspberry Pi (ARM)
build-pi:
	@echo "🔨 Compilando para Raspberry Pi (ARM)..."
	GOOS=linux GOARCH=arm GOARM=7 go build -o bin/$(BINARY_NAME)-arm cmd/edge-pro/main.go

# Build otimizado para produção
build-prod:
	@echo "🔨 Compilando para produção (otimizado)..."
	GOOS=linux GOARCH=arm GOARM=7 go build -ldflags="-s -w" -o bin/$(BINARY_NAME)-arm cmd/edge-pro/main.go
	@echo "📦 Comprimindo binário..."
	upx --best --lzma bin/$(BINARY_NAME)-arm || echo "⚠️  upx não instalado (opcional)"

# Executar localmente
run:
	@echo "🚀 Executando localmente..."
	go run cmd/edge-pro/main.go -debug

# Testes
test:
	@echo "🧪 Executando testes..."
	go test -v ./...

# Limpar arquivos compilados
clean:
	@echo "🧹 Limpando arquivos compilados..."
	rm -rf bin/

# Deploy para Raspberry Pi
deploy: build-pi
	@echo "📦 Copiando binário para Raspberry Pi..."
	scp bin/$(BINARY_NAME)-arm $(PI_USER)@$(PI_HOST):$(PI_PATH)/$(BINARY_NAME)
	@echo "📝 Copiando arquivo de serviço..."
	scp scripts/$(SERVICE_NAME).service $(PI_USER)@$(PI_HOST):$(PI_PATH)/
	@echo "🔧 Instalando serviço..."
	ssh $(PI_USER)@$(PI_HOST) "sudo mv $(PI_PATH)/$(SERVICE_NAME).service /etc/systemd/system/ && \
		sudo systemctl daemon-reload && \
		sudo systemctl enable $(SERVICE_NAME) && \
		sudo systemctl restart $(SERVICE_NAME)"
	@echo "✅ Deploy concluído!"

# Deploy rápido (sem reinstalar serviço)
deploy-quick: build-pi
	@echo "⚡ Deploy rápido..."
	scp bin/$(BINARY_NAME)-arm $(PI_USER)@$(PI_HOST):$(PI_PATH)/$(BINARY_NAME)
	ssh $(PI_USER)@$(PI_HOST) "sudo systemctl restart $(SERVICE_NAME)"
	@echo "✅ Deploy rápido concluído!"

# Ver logs do serviço na Pi
logs:
	@echo "📋 Logs do serviço..."
	ssh $(PI_USER)@$(PI_HOST) "sudo journalctl -u $(SERVICE_NAME) -f"

# Ver status do serviço
status:
	@echo "📊 Status do serviço..."
	ssh $(PI_USER)@$(PI_HOST) "sudo systemctl status $(SERVICE_NAME)"

# Parar serviço
stop:
	@echo "🛑 Parando serviço..."
	ssh $(PI_USER)@$(PI_HOST) "sudo systemctl stop $(SERVICE_NAME)"

# Iniciar serviço
start:
	@echo "▶️  Iniciando serviço..."
	ssh $(PI_USER)@$(PI_HOST) "sudo systemctl start $(SERVICE_NAME)"

# Baixar dependências
deps:
	@echo "📥 Baixando dependências..."
	go mod download
	go mod tidy

# Verificar código
lint:
	@echo "🔍 Verificando código..."
	golangci-lint run || echo "⚠️  golangci-lint não instalado"

# Ajuda
help:
	@echo "Comandos disponíveis:"
	@echo "  make build        - Compilar para desenvolvimento"
	@echo "  make build-pi     - Compilar para Raspberry Pi"
	@echo "  make build-prod   - Compilar otimizado para produção"
	@echo "  make run          - Executar localmente"
	@echo "  make test         - Executar testes"
	@echo "  make deploy       - Deploy completo para Pi"
	@echo "  make deploy-quick - Deploy rápido (só binário)"
	@echo "  make logs         - Ver logs do serviço"
	@echo "  make status       - Ver status do serviço"
	@echo "  make clean        - Limpar arquivos compilados"



