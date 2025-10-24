.PHONY: build run clean deploy test install

# Variáveis
BINARY_NAME=dot
ORANGE_PI_HOST=pi@orangepi.local
ORANGE_PI_PATH=/home/pi/granobox-dot

# Build local
build:
	@echo "🔨 Compilando Granobox Dot Pi..."
	go build -o $(BINARY_NAME) ./cmd/dot
	@echo "✅ Compilação concluída: $(BINARY_NAME)"

# Build para ARM64 (Orange Pi Zero 2W)
build-arm64:
	@echo "🔨 Compilando para ARM64 (Orange Pi Zero 2W)..."
	GOOS=linux GOARCH=arm64 go build -o $(BINARY_NAME)-arm64 ./cmd/dot
	@echo "✅ Compilação concluída: $(BINARY_NAME)-arm64"

# Build para ARM32 (Raspberry Pi Zero)
build-arm:
	@echo "🔨 Compilando para ARM32 (Raspberry Pi)..."
	GOOS=linux GOARCH=arm GOARM=6 go build -o $(BINARY_NAME)-arm ./cmd/dot
	@echo "✅ Compilação concluída: $(BINARY_NAME)-arm"

# Executar localmente
run: build
	@echo "🚀 Executando Granobox Dot Pi..."
	./$(BINARY_NAME)

# Deploy para Orange Pi
deploy: build-arm64
	@echo "📦 Fazendo deploy para Orange Pi..."
	ssh $(ORANGE_PI_HOST) "mkdir -p $(ORANGE_PI_PATH)"
	scp $(BINARY_NAME)-arm64 $(ORANGE_PI_HOST):$(ORANGE_PI_PATH)/$(BINARY_NAME)
	scp granobox-dot.service $(ORANGE_PI_HOST):~/
	@echo "✅ Deploy concluído!"
	@echo "💡 Conecte via SSH e execute:"
	@echo "   cd $(ORANGE_PI_PATH)"
	@echo "   ./$(BINARY_NAME)"

# Instalar serviço systemd no Orange Pi
install-service:
	@echo "📝 Instalando serviço systemd..."
	ssh $(ORANGE_PI_HOST) "sudo mv ~/granobox-dot.service /etc/systemd/system/"
	ssh $(ORANGE_PI_HOST) "sudo systemctl daemon-reload"
	ssh $(ORANGE_PI_HOST) "sudo systemctl enable granobox-dot"
	ssh $(ORANGE_PI_HOST) "sudo systemctl start granobox-dot"
	@echo "✅ Serviço instalado e iniciado!"
	@echo "📊 Ver logs:"
	@echo "   ssh $(ORANGE_PI_HOST) 'sudo journalctl -u granobox-dot -f'"

# Logs do serviço
logs:
	ssh $(ORANGE_PI_HOST) "sudo journalctl -u granobox-dot -f"

# Restart serviço
restart:
	ssh $(ORANGE_PI_HOST) "sudo systemctl restart granobox-dot"
	@echo "✅ Serviço reiniciado"

# Status do serviço
status:
	ssh $(ORANGE_PI_HOST) "sudo systemctl status granobox-dot"

# Testes
test:
	@echo "🧪 Executando testes..."
	go test -v ./...

# Limpar binários
clean:
	@echo "🧹 Limpando..."
	rm -f $(BINARY_NAME) $(BINARY_NAME)-arm64 $(BINARY_NAME)-arm
	@echo "✅ Limpeza concluída"

# Download de dependências
deps:
	@echo "📦 Baixando dependências..."
	go mod download
	@echo "✅ Dependências baixadas"

# Formatar código
fmt:
	@echo "🎨 Formatando código..."
	go fmt ./...
	@echo "✅ Código formatado"

# Verificar código
lint:
	@echo "🔍 Verificando código..."
	go vet ./...
	@echo "✅ Verificação concluída"

# Build completo (todos os alvos)
all: fmt lint test build-arm64 build-arm
	@echo "✅ Build completo finalizado!"

# Help
help:
	@echo "📖 Comandos disponíveis:"
	@echo "  make build          - Compila localmente"
	@echo "  make build-arm64    - Compila para Orange Pi Zero 2W"
	@echo "  make build-arm      - Compila para Raspberry Pi"
	@echo "  make run            - Executa localmente"
	@echo "  make deploy         - Deploy para Orange Pi"
	@echo "  make install-service- Instala serviço systemd"
	@echo "  make logs           - Mostra logs do serviço"
	@echo "  make restart        - Reinicia serviço"
	@echo "  make status         - Status do serviço"
	@echo "  make test           - Executa testes"
	@echo "  make clean          - Remove binários"
	@echo "  make all            - Build completo"

