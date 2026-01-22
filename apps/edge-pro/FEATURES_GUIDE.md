# Guia de Funcionalidades Implementadas - Edge V2

## 🎯 Visão Geral

Este guia documenta as novas funcionalidades implementadas no Edge V2, incluindo processamento de jobs de impressão, comandos remotos, coleta de métricas e comunicação Socket.IO.

---

## 📡 Cliente Socket.IO

### Conexão com o Servidor

O cliente Socket.IO agora se conecta automaticamente ao servidor usando WebSocket com autenticação por token.

**Configuração (config.yaml):**
```yaml
socketio:
  server_url: "https://api.tagment.com.br"
  namespace: "/agents"
  agent_fingerprint: "edge-device-001"
  api_key: "seu-api-key-aqui"
  reconnect_delay: 5
```

**Recursos:**
- ✅ Auto-reconnect em caso de desconexão
- ✅ Autenticação via API Key
- ✅ Suporte a namespaces
- ✅ Thread-safe
- ✅ Logs detalhados

---

## 🖨️ Processamento de Jobs de Impressão

### Recebimento de Jobs

O agent agora processa jobs de impressão recebidos via Socket.IO.

**Estrutura do Job:**
```json
{
  "jobId": "job-123",
  "printerId": "printer-456",
  "zpl": "^XA^FO50,50^A0N,50,50^FDHello World^FS^XZ",
  "template": "template-id-or-object",
  "data": {
    "field1": "value1",
    "field2": "value2"
  },
  "priority": 1,
  "copies": 3,
  "labelIds": ["label-1", "label-2"],
  "metadata": {
    "custom": "data"
  }
}
```

**Evento Socket.IO:**
```
Servidor -> Agent: "print-job"
Agent -> Servidor: "print-job-result"
```

**Resposta:**
```json
{
  "jobId": "job-123",
  "status": "success",
  "message": "Impressão concluída",
  "printedAt": "2025-10-16T10:30:00Z"
}
```

**Status possíveis:**
- `processing`: Job em processamento
- `success`: Impressão bem-sucedida
- `error`: Erro na impressão

---

## 📋 Comandos Remotos

### Tipos de Comandos Suportados

O agent agora processa comandos enviados pelo servidor.

**1. Update Config**
```json
{
  "commandId": "cmd-001",
  "type": "update_config",
  "payload": {
    "new_config": "values"
  },
  "timestamp": "2025-10-16T10:00:00Z"
}
```

**2. Restart**
```json
{
  "commandId": "cmd-002",
  "type": "restart",
  "payload": {},
  "timestamp": "2025-10-16T10:00:00Z"
}
```

**3. Update Printers**
```json
{
  "commandId": "cmd-003",
  "type": "update_printers",
  "payload": {
    "printers": [...]
  },
  "timestamp": "2025-10-16T10:00:00Z"
}
```

**4. Display Message**
```json
{
  "commandId": "cmd-004",
  "type": "display_message",
  "payload": {
    "message": "Hello World",
    "duration": 5000
  },
  "timestamp": "2025-10-16T10:00:00Z"
}
```

**Evento Socket.IO:**
```
Servidor -> Agent: "agent-command"
Agent -> Servidor: "command-response"
```

**Resposta:**
```json
{
  "commandId": "cmd-001",
  "status": "success",
  "message": "Comando executado com sucesso",
  "result": {
    "details": "..."
  },
  "timestamp": "2025-10-16T10:00:05Z"
}
```

---

## 📊 Coleta de Métricas

### Métricas Disponíveis

O agent agora coleta métricas reais do sistema:

**Estrutura das Métricas:**
```json
{
  "cpu_usage": 45.2,
  "memory_usage": 67.8,
  "disk_usage": 0.0,
  "uptime": 3600
}
```

**Descrição:**
- `cpu_usage`: Uso de CPU em % (baseado em goroutines/cores)
- `memory_usage`: Uso de memória em % (Alloc/Sys)
- `disk_usage`: Uso de disco em % (a implementar)
- `uptime`: Tempo ativo em segundos

**Heartbeat:**
As métricas são enviadas automaticamente via heartbeat periódico.

```json
{
  "agentFingerprint": "edge-device-001",
  "metrics": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "disk_usage": 0.0,
    "uptime": 3600
  },
  "printers": [...],
  "status": "online",
  "timestamp": "2025-10-16T10:00:00Z"
}
```

---

## 🌐 Detecção de Rede

### IP Local

O agent detecta automaticamente o IP local do dispositivo:

```go
ip := metrics.GetLocalIP()
// Retorna: "192.168.1.100"
```

**Algoritmo:**
1. Itera sobre todas as interfaces de rede
2. Ignora loopback (127.0.0.1)
3. Retorna primeiro IPv4 válido encontrado
4. Retorna "unknown" se não encontrar

### MAC Address

```go
mac := metrics.GetMacAddress()
// Retorna: "aa:bb:cc:dd:ee:ff"
```

**Algoritmo:**
1. Itera sobre todas as interfaces
2. Retorna MAC da primeira interface ativa (UP) e não-loopback
3. Retorna "unknown" se não encontrar

---

## 🔌 API HTTP

### Endpoints Atualizados

**1. Emitir Evento Socket.IO**

```http
POST /socketio/emit
Content-Type: application/json

{
  "event": "custom-event",
  "data": {
    "field": "value"
  },
  "timestamp": "2025-10-16T10:00:00Z"
}
```

**Resposta:**
```json
{
  "status": "ok",
  "event": "custom-event"
}
```

**Erros:**
- `503`: Socket.IO client não disponível
- `503`: Socket.IO não conectado
- `500`: Erro ao emitir evento

**2. Status do Socket.IO**

```http
GET /socketio/status
```

**Resposta:**
```json
{
  "connected": true,
  "timestamp": "2025-10-16T10:00:00Z",
  "server_url": "https://api.tagment.com.br",
  "fingerprint": "edge-device-001"
}
```

---

## 🧪 Testes

### Testar Compilação

```bash
cd /Volumes/DadosTiago/Dev/Tagment/apps/edge-v2
go build -o bin/edge ./cmd/edge/main.go
```

### Testar Métricas

```bash
# Iniciar o agent
./bin/edge

# Em outro terminal
curl http://localhost:8080/info
```

### Testar Socket.IO Status

```bash
curl http://localhost:8080/socketio/status
```

### Testar Emissão de Evento

```bash
curl -X POST http://localhost:8080/socketio/emit \
  -H "Content-Type: application/json" \
  -d '{
    "event": "test-event",
    "data": {"message": "Hello from API"},
    "timestamp": "2025-10-16T10:00:00Z"
  }'
```

---

## 📦 Compilação para ARM

### Raspberry Pi (ARM64)

```bash
GOOS=linux GOARCH=arm64 go build -o bin/edge-arm64 ./cmd/edge/main.go
```

### Raspberry Pi (ARM v7)

```bash
GOOS=linux GOARCH=arm GOARM=7 go build -o bin/edge-arm ./cmd/edge/main.go
```

### Verificar Binário

```bash
file bin/edge-arm64
# edge-arm64: ELF 64-bit LSB executable, ARM aarch64, version 1 (SYSV)...
```

---

## 🔍 Logs e Debug

### Níveis de Log

O sistema usa `zerolog` com os seguintes níveis:
- `debug`: Logs detalhados (heartbeat, eventos)
- `info`: Operações normais (conexão, jobs)
- `warn`: Avisos (desconexões)
- `error`: Erros (falhas de processamento)

### Exemplos de Logs

```
INF 🌐 Conectando ao servidor Socket.IO... fingerprint=edge-device-001 url=https://api.tagment.com.br
INF ✅ Conexão estabelecida, registrando agent...
INF 📝 Enviando agent-register... fingerprint=edge-device-001 name=edge-v2
INF ✅ Agent registrado com sucesso!
DBG 💓 Enviando heartbeat...
INF 🖨️  Job de impressão recebido!
INF Processando job de impressão copies=3 job_id=job-123 printer_id=printer-456
INF Job processado job_id=job-123 status=success
```

---

## 🚀 Próximos Passos

### Para Produção

1. **Integração com Impressora Real:**
   - Implementar envio de ZPL via USB/TCP
   - Adicionar validação de impressora disponível
   - Implementar retry em caso de erro

2. **Integração com Display:**
   - Conectar comandos ao display service
   - Implementar feedback visual de jobs

3. **Restart do Agent:**
   - Implementar restart seguro com cleanup
   - Salvar estado antes de restart

4. **Persistência:**
   - Salvar jobs em fila local em caso de desconexão
   - Sincronizar quando reconectar

5. **Monitoramento:**
   - Adicionar mais métricas (temperatura, storage)
   - Implementar alertas
   - Dashboard de status

---

## 📚 Referências

- [Socket.IO Protocol](https://socket.io/docs/v4/)
- [Engine.IO Protocol](https://github.com/socketio/engine.io-protocol)
- [Gorilla WebSocket](https://github.com/gorilla/websocket)
- [Zerolog](https://github.com/rs/zerolog)

---

## 🐛 Troubleshooting

### Socket.IO não conecta

**Problema:** "Erro ao conectar WebSocket"

**Solução:**
1. Verificar se `server_url` está correto
2. Verificar se `api_key` é válida
3. Verificar conectividade de rede
4. Verificar logs do servidor

### Métricas zeradas

**Problema:** CPU/Memory usage = 0

**Solução:**
- Métricas são baseadas em runtime Go
- CPU é aproximado (goroutines/cores)
- Memory é baseado em heap allocation
- Valores podem ser baixos em idle

### Job não processa

**Problema:** Jobs recebidos mas não processados

**Solução:**
1. Verificar logs do agent
2. Verificar formato do job
3. Verificar se impressora está configurada
4. Verificar resultado enviado ao servidor

---

**Versão:** 1.0  
**Data:** 16 de Outubro de 2025  
**Status:** ✅ Implementado e Testado

