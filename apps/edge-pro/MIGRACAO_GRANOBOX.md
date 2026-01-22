# 🔄 Migração Edge-Pro - Tagment para Granobox

## Resumo da Migração

O **edge-pro** é o edge device para Raspberry Pi do Granobox, migrado do projeto **edge-pi** do Tagment.

### Data da Migração
Novembro de 2025

---

## ✅ Alterações Realizadas

### 1. Arquivos de Configuração

#### ✅ Removidos
- `configs/config.tagment.yaml` - Removido (específico do Tagment)
- `scripts/tagment-edge-v2.service` - Removido (serviço antigo)

#### ✅ Criados
- `scripts/edge-pro.service` - Novo arquivo de serviço systemd para Granobox

#### ✅ Atualizados
- `configs/config.granobox.yaml` - Configuração padrão do Granobox
- `configs/config.example.json` - URLs atualizadas para api.granobox.com.br

---

### 2. Scripts de Build e Deploy

#### ✅ `Makefile`
```makefile
# Antes
BINARY_NAME=edge
PI_USER=tagment
SERVICE_NAME=tagment-edge-v2

# Depois
BINARY_NAME=edge-pro
PI_USER=granobox
SERVICE_NAME=edge-pro
```

#### ✅ `build-all.sh`
- Atualizado para compilar `edge-pro` (em vez de `edge`)
- Binários gerados: `edge-pro-linux-arm64`, `edge-pro-linux-armv7`, etc.
- Referências ao Tagment removidas

#### ✅ `deploy-to-device.sh`
- Nome do binário: `edge-pro`
- Usuário padrão: `granobox`
- Diretório de config: `/etc/edge-pro/`
- Nome do serviço: `edge-pro`

#### ✅ `scripts/install.sh`
- Instalação atualizada para Granobox
- Diretórios: `/etc/edge-pro/`, `/home/granobox/`
- Arquivo de configuração: `config.granobox.yaml`

#### ✅ `update-config.sh`
- URL atualizada para `https://api.granobox.com.br`

---

### 3. Código Go

#### ✅ Módulo Go
```go
// go.mod
module github.com/granobox/edge-pro
```

#### ✅ Arquivos Atualizados

**`cmd/edge-pro/main.go`**
- Mensagem inicial: "🚀 Iniciando Edge-Pro v1.0.0"
- Modo provisioning: "Edge-Pro-XXXXXX" (SSID do hotspot)
- Senha padrão: "granobox123"
- Logs de conexão ao backend Granobox

**`internal/socketio/server.go`**
```go
// Antes
conn.Emit("welcome", "Conectado ao Tagment Edge v2")

// Depois
conn.Emit("welcome", "Conectado ao Granobox Edge-Pro")
```

**`internal/api/server.go`**
```go
// Antes
// handleDisplayRefresh força refresh do dashboard do Tagment

// Depois
// handleDisplayRefresh força refresh do dashboard do Granobox
```

---

### 4. Documentação

#### ✅ `README.md`
- Título: "🚀 Granobox Edge-Pro (Go)"
- Versão: v1.0.0 (Novembro 2025)
- URLs de API: `https://api.granobox.com.br`
- Estrutura de projeto atualizada
- Exemplos de código atualizados
- Comandos de deploy atualizados

#### ✅ Variáveis de Ambiente
```bash
# Antes
export TAGMENT_DEBUG=false
export TAGMENT_DEVICE_ID="..."

# Depois
export EDGE_PRO_DEBUG=false
export EDGE_PRO_DEVICE_ID="..."
```

---

### 5. Serviço Systemd

#### ✅ `scripts/edge-pro.service`

```ini
[Unit]
Description=Granobox Edge-Pro Service
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=granobox
Group=granobox
WorkingDirectory=/home/granobox
ExecStart=/home/granobox/edge-pro -config /etc/edge-pro/config.yaml
Restart=always
RestartSec=10

# Environment
Environment="EDGE_PRO_DEBUG=false"

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=edge-pro

[Install]
WantedBy=multi-user.target
```

---

## 🎯 Diferenças Edge-Go vs Edge-Pro

| Característica | Edge-Go | Edge-Pro |
|----------------|---------|----------|
| **Hardware** | ESP32-S3 | Raspberry Pi |
| **Linguagem** | C (ESP-IDF) | Go |
| **Comunicação** | TCP direto (porta 9100) | Socket.IO + HTTP API |
| **Configuração** | BLE | WiFi Hotspot + QR Code |
| **Impressão** | USB direto | USB + TCP |
| **Recursos** | 512KB RAM | 1GB+ RAM |
| **Complexidade** | Baixa | Média |
| **Uso** | Impressão dedicada | Edge completo com jobs |

---

## 📦 Estrutura Final

```
edge-pro/
├── cmd/
│   └── edge-pro/
│       └── main.go
├── internal/
│   ├── api/              # API HTTP
│   ├── config/           # Configuração
│   ├── display/          # Display RGB
│   ├── hardware/         # GPIO
│   ├── hotspot/          # WiFi Hotspot
│   ├── metrics/          # Métricas do sistema
│   ├── models/           # Models
│   ├── printer/          # Impressoras
│   ├── provisioning/     # Provisionamento
│   ├── qrcode/           # QR Code
│   └── socketio/         # Socket.IO Client/Server
├── pkg/
│   └── logger/           # Logger
├── configs/
│   ├── config.granobox.yaml
│   ├── config.example.yaml
│   └── config.example.json
├── scripts/
│   ├── edge-pro.service
│   ├── install.sh
│   └── test_api.sh
├── build-all.sh
├── deploy-to-device.sh
├── update-config.sh
├── Makefile
├── go.mod
├── go.sum
└── README.md
```

---

## 🚀 Como Usar

### 1. Build
```bash
# Build para todas as plataformas
./build-all.sh v1.0.0

# Build específico para Raspberry Pi 4/5
make build-pi
```

### 2. Deploy
```bash
# Deploy completo
./deploy-to-device.sh granobox@192.168.1.100 arm64

# Deploy rápido (apenas binário)
make deploy-quick
```

### 3. Monitoramento
```bash
# Ver logs
make logs

# Ver status
make status
```

---

## ✅ Checklist de Migração

- [x] Remover referências ao "Tagment" em todos os arquivos
- [x] Atualizar URLs para `api.granobox.com.br`
- [x] Renomear binário para `edge-pro`
- [x] Atualizar scripts de build e deploy
- [x] Criar novo arquivo de serviço systemd
- [x] Atualizar documentação (README, guias)
- [x] Atualizar código Go (imports, comentários)
- [x] Atualizar variáveis de ambiente
- [x] Atualizar arquivos de configuração

---

## 📝 Notas Importantes

1. **Configuração**: O edge-pro usa provisionamento via WiFi hotspot e QR Code
2. **Backend**: Conecta-se ao backend Granobox em `https://api.granobox.com.br`
3. **Usuário**: Usa usuário `granobox` no sistema (não mais `tagment`)
4. **Diretórios**: Configuração em `/etc/edge-pro/` (não mais `/etc/tagment-edge/`)
5. **Serviço**: Nome do serviço é `edge-pro` (não mais `tagment-edge-v2`)

---

## 🎓 Status da Implementação

### ✅ Concluído
- [x] Migração completa do código Tagment → Granobox
- [x] Scripts de build e deploy atualizados
- [x] Serviço systemd configurado (`edge-pro`)
- [x] Sistema de provisionamento WiFi AP
- [x] HTTP API para configuração
- [x] Suporte a API Key no POST /configure
- [x] QR Code em ASCII no terminal
- [x] WebSocket client para backend Granobox
- [x] Display desabilitado (foco no essencial)

### ⏳ Próximos Passos
1. Testar build em Raspberry Pi real
2. Testar provisionamento via hotspot WiFi
3. Testar conexão WebSocket com backend
4. Implementar integração com impressoras USB
5. Integração Flutter para adoção via WiFi AP

### 🔮 Futuro
- [ ] Ativar display RGB (quando necessário)
- [ ] OTA updates
- [ ] Dashboard web local

---

## 📚 Documentação

- [`QUICKSTART_SIMPLES.md`](QUICKSTART_SIMPLES.md) - Guia rápido sem display
- [`PROVISIONING_GUIDE.md`](PROVISIONING_GUIDE.md) - Guia completo de provisionamento
- [`README.md`](README.md) - Documentação principal

---

**Migração Completa! Pronto para testes! 🎉**

