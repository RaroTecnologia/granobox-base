# 🧪 Guia de Teste no Raspberry Pi

## 📋 Pré-requisitos

- Raspberry Pi 3/4/Zero 2W com Raspberry Pi OS
- Impressora USB conectada
- Impressora TCP/IP na rede (opcional)
- Acesso SSH ao Pi
- API Tagment rodando

---

## 🚀 Deploy no Raspberry Pi

### 1. Compilar para ARM64

```bash
cd /Volumes/DadosTiago/Dev/Tagment/apps/edge-v2

# Compilar
GOOS=linux GOARCH=arm64 go build -o bin/edge-arm64 ./cmd/edge/main.go

# Verificar tamanho
ls -lh bin/edge-arm64
```

### 2. Enviar para o Pi

```bash
# Criar diretório remoto
ssh pi@192.168.1.100 'mkdir -p ~/tagment'

# Enviar binário
scp bin/edge-arm64 pi@192.168.1.100:~/tagment/edge

# Dar permissão de execução
ssh pi@192.168.1.100 'chmod +x ~/tagment/edge'
```

### 3. Criar Configuração

```bash
# SSH no Pi
ssh pi@192.168.1.100

# Criar config.yaml
cd ~/tagment
cat > config.yaml << 'EOF'
device:
  id: "rpi-teste-001"
  name: "Raspberry Pi Teste"
  location: "Lab de Testes"
  version: "2.1.0"
  hostname: "rpi-teste"

socketio:
  server_url: "https://api.tagment.com.br"
  namespace: "/agents"
  agent_fingerprint: "rpi-teste-001"
  api_key: "tgm_SUA_API_KEY_AQUI"
  reconnect_delay: 5
  heartbeat_interval: 30

debug: true
EOF
```

---

## 🧪 Teste 1: Inicialização

### Executar o Agent

```bash
cd ~/tagment
./edge
```

### Logs Esperados

```
INF 🔌 Iniciando conexão Socket.IO... component=socketio-client
INF 🚀 Iniciando fila de impressão component=print-queue workers=2
INF 👷 Worker iniciado component=print-queue worker_id=0
INF 👷 Worker iniciado component=print-queue worker_id=1
INF 🔐 Conectando WebSocket... component=socketio-client
INF 🚀 WebSocket conectado, aguardando eventos... component=socketio-client
INF ✅ Socket.IO conectado component=socketio-client
INF 📝 Preparando registro do agent... component=socketio-client
INF ✨ Impressoras USB auto-detectadas (efêmero) component=socketio-client count=0
INF 📝 Enviando agent-register (USB efêmero)... component=socketio-client
INF ✅ Agent registrado com sucesso! component=socketio-client
```

✅ **Se viu esses logs, está funcionando!**

---

## 🧪 Teste 2: Detecção de Impressora USB

### 1. Conectar Impressora USB

```bash
# Em outro terminal SSH
lsusb | grep -i printer
# Ou verificar dispositivo
ls -l /dev/usb/lp0
```

### 2. Aguardar Heartbeat (30s)

### Logs Esperados

```
INF 🖨️ Impressora USB detectada component=printer-manager device=/dev/usb/lp0
INF 🖨️ Impressora USB detectada com informações component=printer-manager device=/dev/usb/lp0 vendor=Zebra model=GC420d
INF ✨ Impressora USB auto-registrada component=printer-manager id=auto-usb-lp0 name="Zebra GC420d"
INF 💓 Enviando heartbeat... component=socketio-client usb_printers=1
```

### 3. Verificar na API

```bash
curl -H "Authorization: Bearer tgm_..." \
  https://api.tagment.com.br/agents/rpi-teste-001
```

Deve retornar:
```json
{
  "fingerprint": "rpi-teste-001",
  "printers": [
    {
      "id": "auto-usb-lp0",
      "name": "Zebra GC420d",
      "connection": "usb",
      "devicePath": "/dev/usb/lp0",
      "status": "online",
      "type": "zebra"
    }
  ]
}
```

✅ **Impressora detectada e registrada!**

### 4. Desconectar Impressora

Aguardar próximo heartbeat (30s) e verificar que impressora sumiu da API.

---

## 🧪 Teste 3: Impressão USB

### 1. Enviar Job de Teste (via API)

```bash
curl -X POST https://api.tagment.com.br/print-jobs \
  -H "Authorization: Bearer tgm_..." \
  -H "Content-Type: application/json" \
  -d '{
    "printerId": "USE_FIRST_AVAILABLE",
    "zpl": "^XA^FO50,50^A0N,50,50^FDTeste USB^FS^XZ",
    "copies": 1,
    "priority": 1
  }'
```

### Logs Esperados (no Pi)

```
INF 📄 Job recebido, adicionando à fila component=socketio-client job_id=job-123
INF ➕ Job adicionado à fila component=print-queue job_id=job-123
INF 🔄 Processando job component=print-queue job_id=job-123 attempt=1
INF 📤 Enviando para impressora USB component=printer-manager device=/dev/usb/lp0 bytes=42
INF 📝 Enviando em chunks component=printer-manager total_chunks=1
INF ✍️ Escrita concluída component=printer-manager
INF ⏱️ Aguardando impressão component=printer-manager wait_time=2s
INF ✅ Impressão USB finalizada component=printer-manager
INF ✅ Job processado com sucesso component=print-queue job_id=job-123 copies=1
INF 📤 Enviando resultado de impressão component=socketio-client job_id=job-123 status=success
```

✅ **Impressão concluída!**

---

## 🧪 Teste 4: Retry em Caso de Erro

### 1. Desconectar Impressora

```bash
# Remover cabo USB
```

### 2. Enviar Job

```bash
curl -X POST https://api.tagment.com.br/print-jobs \
  -H "Authorization: Bearer tgm_..." \
  -H "Content-Type: application/json" \
  -d '{
    "printerId": "USE_FIRST_AVAILABLE",
    "zpl": "^XA^FO50,50^A0N,50,50^FDTeste Retry^FS^XZ",
    "copies": 1
  }'
```

### Logs Esperados

```
INF 📄 Job recebido, adicionando à fila
INF 🔄 Processando job attempt=1
ERR device /dev/usb/lp0 não existe (impressora desconectada)
WRN ⚠️ Job falhou, retentando... attempt=1 max_attempts=3
--- aguardar 5s ---
INF 🔄 Processando job attempt=2
ERR device /dev/usb/lp0 não existe (impressora desconectada)
WRN ⚠️ Job falhou, retentando... attempt=2 max_attempts=3
--- aguardar 5s ---
INF 🔄 Processando job attempt=3
ERR device /dev/usb/lp0 não existe (impressora desconectada)
ERR ❌ Job falhou definitivamente attempts=3
INF 📤 Enviando resultado de impressão status=error
```

✅ **Retry funcionando!**

### 3. Reconectar Durante Retry

Conectar impressora entre tentativas e verificar que impressão ocorre.

---

## 🧪 Teste 5: Impressora TCP com Hostname

### 1. Adicionar Impressora TCP (config.yaml)

```yaml
# Comentar para teste manual via print-job
# printers:
#   - name: "Zebra Balcão"
#     connection: "network"
#     network:
#       ip: "printer-balcao.local"  # ou IP: 192.168.1.100
#       port: 9100
```

### 2. Reiniciar Agent

```bash
# Ctrl+C para parar
./edge
```

### 3. Verificar Resolução de Hostname

```bash
# No Pi
ping -c 1 printer-balcao.local
# Deve resolver para IP
```

### 4. Enviar Job para Impressora TCP

```bash
curl -X POST https://api.tagment.com.br/print-jobs \
  -H "Authorization: Bearer tgm_..." \
  -H "Content-Type: application/json" \
  -d '{
    "printerId": "printer-balcao",
    "zpl": "^XA^FO50,50^A0N,50,50^FDTeste TCP^FS^XZ",
    "copies": 1
  }'
```

### Logs Esperados

```
INF 📄 Job recebido
INF 📤 Enviando para impressora de rede host=printer-balcao.local
INF 🔍 Hostname resolvido original=printer-balcao.local resolved=192.168.1.100:9100
INF ✅ Impressão via rede finalizada addr=192.168.1.100:9100
INF ✅ Job processado
```

✅ **Hostname funcionando!**

---

## 🧪 Teste 6: Múltiplas Cópias

```bash
curl -X POST https://api.tagment.com.br/print-jobs \
  -H "Authorization: Bearer tgm_..." \
  -H "Content-Type: application/json" \
  -d '{
    "printerId": "USE_FIRST_AVAILABLE",
    "zpl": "^XA^FO50,50^A0N,50,50^FDCopia #1^FS^XZ",
    "copies": 3
  }'
```

### Logs Esperados

```
INF 🖨️ Imprimindo cópia copy=1 total=3
INF ✅ Impressão USB finalizada
INF 🖨️ Imprimindo cópia copy=2 total=3
INF ✅ Impressão USB finalizada
INF 🖨️ Imprimindo cópia copy=3 total=3
INF ✅ Impressão USB finalizada
INF ✅ Job processado copies=3
```

✅ **3 etiquetas impressas!**

---

## 🧪 Teste 7: Estatísticas da Fila

### Acessar API HTTP Local

```bash
# No Pi
curl http://localhost:8080/info
```

Deve retornar:
```json
{
  "device_id": "rpi-teste-001",
  "version": "2.1.0",
  "uptime": 3600,
  "printers": [...],
  "queue_stats": {
    "total": 10,
    "pending": 0,
    "processing": 1,
    "completed": 8,
    "failed": 1,
    "retrying": 0
  }
}
```

✅ **Estatísticas funcionando!**

---

## 🐛 Troubleshooting

### Problema: Impressora USB não detectada

```bash
# Verificar dispositivo
ls -l /dev/usb/lp*
# Ou
ls -l /dev/lp*

# Verificar via lsusb
lsusb | grep -i printer

# Verificar permissões
sudo chmod 666 /dev/usb/lp0  # Se necessário
```

### Problema: Hostname não resolve

```bash
# Instalar avahi (mDNS)
sudo apt-get install avahi-daemon avahi-utils

# Testar resolução
avahi-resolve -n printer-balcao.local

# Adicionar ao /etc/hosts como fallback
echo "192.168.1.100 printer-balcao.local" | sudo tee -a /etc/hosts
```

### Problema: Não conecta na API

```bash
# Verificar conectividade
ping api.tagment.com.br

# Testar WebSocket
curl -v https://api.tagment.com.br/socket.io/?EIO=4&transport=polling

# Verificar API Key
curl -H "Authorization: Bearer tgm_..." https://api.tagment.com.br/agents
```

---

## 🎯 Checklist Final

- [ ] Agent inicializa sem erros
- [ ] Impressora USB detectada automaticamente
- [ ] Impressora aparece no heartbeat
- [ ] Job de impressão USB funciona
- [ ] Retry funciona (3 tentativas)
- [ ] Hostname resolve corretamente (TCP)
- [ ] Job de impressão TCP funciona
- [ ] Múltiplas cópias funcionam
- [ ] Estatísticas aparecem na API
- [ ] Desconectar USB remove da API

---

## 🎉 Sucesso!

Se todos os testes passaram, a migração está **100% funcional!** 

Próxima etapa: Deploy em produção! 🚀

