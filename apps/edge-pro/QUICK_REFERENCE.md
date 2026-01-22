# 🚀 Referência Rápida - Edge V2

## ⚡ Comandos Mais Usados

### Build e Deploy

```bash
# Build para todas as plataformas
./build-all.sh v2.0.0

# Deploy para Raspberry Pi
./deploy-to-device.sh 192.168.1.100 arm64

# Build individual
GOOS=linux GOARCH=arm64 go build -o bin/edge ./cmd/edge/main.go
```

### Testes

```bash
# Suite completa de testes
./test-implementation.sh

# Testes Go
go test ./...

# Verificar erros
go vet ./...
```

### Monitoramento

```bash
# Logs em tempo real
ssh pi@<IP> 'sudo journalctl -u tagment-edge-v2 -f'

# Status do serviço
ssh pi@<IP> 'sudo systemctl status tagment-edge-v2'

# Reiniciar serviço
ssh pi@<IP> 'sudo systemctl restart tagment-edge-v2'
```

---

## 📡 Endpoints HTTP

### Health & Info

```bash
# Health check
curl http://localhost:8080/health

# Device info
curl http://localhost:8080/info
```

### Socket.IO

```bash
# Emitir evento
curl -X POST http://localhost:8080/socketio/emit \
  -H "Content-Type: application/json" \
  -d '{
    "event": "custom-event",
    "data": {"key": "value"},
    "timestamp": "2025-10-16T10:00:00Z"
  }'

# Status da conexão
curl http://localhost:8080/socketio/status
```

### Display

```bash
# Exibir status
curl -X POST http://localhost:8080/display/status \
  -H "Content-Type: application/json" \
  -d '{
    "icon": "✅",
    "message": "Online",
    "ip": "192.168.1.100",
    "brightness": 80
  }'

# Exibir QR Code
curl -X POST http://localhost:8080/display/qrcode \
  -H "Content-Type: application/json" \
  -d '{
    "data": "https://tagment.com.br",
    "size": 50
  }'

# Limpar display
curl -X POST http://localhost:8080/display/clear
```

---

## 📋 Eventos Socket.IO

### Enviados pelo Edge

| Evento | Descrição | Frequência |
|--------|-----------|------------|
| `agent-register` | Registro inicial do agent | Uma vez na conexão |
| `heartbeat` | Heartbeat com métricas | A cada 30s |
| `print-job-result` | Resultado de impressão | Sob demanda |
| `command-response` | Resposta de comando | Sob demanda |

### Recebidos pelo Edge

| Evento | Descrição | Ação |
|--------|-----------|------|
| `connection-established` | Confirmação de conexão | Registra agent |
| `agent-registered` | Confirmação de registro | Log |
| `print-job` | Job de impressão | Processa job |
| `agent-command` | Comando do servidor | Executa comando |
| `heartbeat-response` | Resposta do heartbeat | Log |

---

## 🔧 Configuração Rápida

### config.yaml Mínimo

```yaml
device:
  id: "edge-001"
  version: "2.0.0"

socketio:
  server_url: "https://api.tagment.com.br"
  namespace: "/agents"
  agent_fingerprint: "edge-device-001"
  api_key: "seu-api-key-aqui"
  reconnect_delay: 5
  heartbeat_interval: 30

api:
  host: "0.0.0.0"
  port: 8080

display:
  enabled: true
  service_url: "localhost:3006"
  type: "rgb"
```

---

## 🐛 Troubleshooting

### Socket.IO não conecta

```bash
# Verificar configuração
cat /etc/tagment-edge/config.yaml

# Verificar logs
sudo journalctl -u tagment-edge-v2 -n 100

# Testar conectividade
curl -v https://api.tagment.com.br/health
```

### Serviço não inicia

```bash
# Ver status
sudo systemctl status tagment-edge-v2

# Ver logs de erro
sudo journalctl -xe -u tagment-edge-v2

# Recarregar configuração
sudo systemctl daemon-reload
sudo systemctl restart tagment-edge-v2
```

### Jobs não processam

```bash
# Verificar se está conectado
curl http://localhost:8080/socketio/status

# Ver logs em tempo real
sudo journalctl -u tagment-edge-v2 -f

# Verificar métricas
curl http://localhost:8080/info
```

---

## 📊 Estrutura de Dados

### PrintJob (recebido)

```json
{
  "jobId": "job-123",
  "printerId": "printer-456",
  "zpl": "^XA^FO50,50^A0N,50,50^FDHello^FS^XZ",
  "template": "template-id",
  "data": {"field": "value"},
  "copies": 3,
  "priority": 1,
  "labelIds": ["label-1"]
}
```

### Heartbeat (enviado)

```json
{
  "agentFingerprint": "edge-device-001",
  "metrics": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "disk_usage": 0.0,
    "uptime": 3600
  },
  "printers": [],
  "status": "online",
  "timestamp": "2025-10-16T10:00:00Z"
}
```

### AgentCommand (recebido)

```json
{
  "commandId": "cmd-001",
  "type": "update_config",
  "payload": {"config": "value"},
  "timestamp": "2025-10-16T10:00:00Z"
}
```

**Tipos de comando:** `update_config`, `restart`, `update_printers`, `display_message`

---

## 🔐 Segurança

### Autenticação

- Socket.IO usa API Key no header `auth.token`
- API HTTP pode usar Bearer token (configurável)
- Sempre use HTTPS em produção

### Firewall

```bash
# Abrir porta API (8080)
sudo ufw allow 8080/tcp

# Abrir porta Display (3006) apenas local
sudo ufw allow from 127.0.0.1 to any port 3006
```

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `/usr/local/bin/edge` | Binário principal |
| `/etc/tagment-edge/config.yaml` | Configuração |
| `/etc/systemd/system/tagment-edge-v2.service` | Serviço systemd |
| `/var/log/tagment-edge/` | Logs (se configurado) |

---

## 🚨 Comandos de Emergência

```bash
# Parar tudo
sudo systemctl stop tagment-edge-v2

# Backup de configuração
sudo cp /etc/tagment-edge/config.yaml ~/config.yaml.backup

# Restaurar binário anterior
sudo cp /usr/local/bin/edge.backup /usr/local/bin/edge

# Ver últimos erros
sudo journalctl -u tagment-edge-v2 -p err -n 50

# Resetar serviço
sudo systemctl reset-failed tagment-edge-v2
sudo systemctl restart tagment-edge-v2
```

---

## 📚 Documentação Completa

- **README.md** - Visão geral e quick start
- **FEATURES_GUIDE.md** - Guia detalhado de funcionalidades
- **IMPLEMENTATION_SUMMARY.md** - Resumo das implementações v2.0
- **CHANGELOG.md** - Histórico de mudanças
- **ARCHITECTURE.md** - Arquitetura do sistema

---

## 🆘 Suporte

**Logs:** Sempre anexe os logs ao reportar problemas
```bash
sudo journalctl -u tagment-edge-v2 -n 500 > edge-logs.txt
```

**Versão:** Verifique a versão rodando
```bash
/usr/local/bin/edge --version
```

---

**Última atualização:** 16 de Outubro de 2025  
**Versão:** 2.0.0

