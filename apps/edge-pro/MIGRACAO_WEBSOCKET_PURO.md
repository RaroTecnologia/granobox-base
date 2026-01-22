# 🔄 Migração: Socket.IO → WebSocket Puro

## 📋 Resumo

O **Edge-Pro** foi refatorado para usar **WebSocket puro** ao invés de **Socket.IO**, seguindo o mesmo protocolo usado pelo **Edge-Go**. Isso simplifica a comunicação e permite usar o mesmo gateway na API.

---

## ✅ O Que Foi Feito

### 1. Novo Cliente WebSocket Puro

**Arquivo:** `internal/websocket/client.go`

- ✅ Cliente WebSocket puro usando `gorilla/websocket`
- ✅ Protocolo JSON simples (mesmo formato do Edge-Go)
- ✅ Auto-reconnect com backoff exponencial
- ✅ Heartbeat automático (30 segundos)
- ✅ Suporte a formato v1.5 de impressão (zpl, copies, labelIds)
- ✅ Handlers para comandos remotos (reboot, update_config, etc)

### 2. Protocolo de Mensagens

**Formato das mensagens (igual ao Edge-Go):**

```json
{
  "type": "register|heartbeat|print_job|print_ack|reboot|...",
  "data": { ... },
  "timestamp": "1640995200000"
}
```

**Mensagens do Cliente → Servidor:**
- `register` - Registro do dispositivo
- `heartbeat` - Status e métricas do sistema
- `print_ack` - Resposta de impressão

**Mensagens do Servidor → Cliente:**
- `register_ack` - Confirmação de registro
- `print_job` - Job de impressão (formato v1.5)
- `reboot` - Comando de reboot remoto
- `agent_command` - Comandos do agente

### 3. URL de Conexão

**Antes (Socket.IO):**
```
wss://api.granobox.com.br/socket.io/?EIO=4&transport=websocket
```

**Agora (WebSocket puro):**
```
wss://ws.granobox.com.br/edge-go-ws  (produção)
ws://localhost:8081/edge-go-ws        (desenvolvimento)
```

### 4. Arquivos Atualizados

- ✅ `internal/websocket/client.go` - Novo cliente WebSocket puro
- ✅ `cmd/edge-pro/main.go` - Atualizado para usar `websocket.Client`
- ✅ `internal/api/server.go` - Atualizado para usar `websocket.Client`
- ✅ `internal/websocket/interface.go` - Interface comum (se necessário)

---

## 🔄 Diferenças Principais

| Aspecto | Socket.IO (Antigo) | WebSocket Puro (Novo) |
|---------|-------------------|----------------------|
| **Protocolo** | Socket.IO + Engine.IO | WebSocket puro + JSON |
| **URL** | `/socket.io/?EIO=4&transport=websocket` | `/edge-go-ws` |
| **Mensagens** | Formato Socket.IO (`40["event",{data}]`) | JSON simples (`{"type":"event","data":{}}`) |
| **Complexidade** | Alta (handshake Engine.IO) | Baixa (conexão direta) |
| **Compatibilidade** | Gateway Socket.IO separado | Mesmo gateway do Edge-Go |

---

## 🚀 Como Usar

### Desenvolvimento

```bash
cd apps/edge-pro
go run cmd/edge-pro/main.go -config configs/config.dev.yaml
```

### Produção

O Edge-Pro conecta automaticamente em:
- **Produção:** `wss://ws.granobox.com.br/edge-go-ws`
- **Dev:** `ws://localhost:8081/edge-go-ws` (baseado na URL da API configurada)

---

## 📝 Compatibilidade

### Backwards Compatibility

O servidor API HTTP mantém rotas antigas para compatibilidade:
- `POST /socketio/emit` → `POST /websocket/emit`
- `GET /socketio/status` → `GET /websocket/status`

### Formato de Jobs

O cliente suporta **dois formatos** de jobs:

1. **Formato v1.5 (Edge-Go)** - Recomendado:
```json
{
  "type": "print_job",
  "data": {
    "jobId": "job-123",
    "zpl": "^XA^FO50,50^A0N,30,30^FDTeste^FS^XZ",
    "copies": 1,
    "labelIds": ["label-1", "label-2"]
  }
}
```

2. **Formato legado** - Mantido para compatibilidade:
```json
{
  "type": "print_job",
  "data": {
    "jobId": "job-123",
    "printerId": "printer-1",
    "zpl": "^XA...",
    "copies": 1
  }
}
```

---

## ✅ Checklist de Migração

- [x] Criar novo cliente WebSocket puro
- [x] Implementar protocolo de registro
- [x] Implementar heartbeat automático
- [x] Implementar handler de print-job
- [x] Implementar auto-reconnect
- [x] Atualizar main.go
- [x] Atualizar server.go
- [ ] Testar conexão com API
- [ ] Testar impressão
- [ ] Testar comandos remotos

---

## 🔍 Troubleshooting

### WebSocket não conecta

1. Verificar se a API está rodando na porta 8081 (dev) ou 443 (prod)
2. Verificar logs do Edge-Pro
3. Verificar conectividade de rede
4. Verificar certificados SSL (em produção)

### Dispositivo não registra

1. Verificar se a API Key está correta
2. Verificar se o deviceId (fingerprint) está correto
3. Verificar logs do backend

### Impressão não funciona

1. Verificar se a impressora USB está conectada
2. Verificar logs de impressão
3. Testar ZPL manualmente

---

## 📚 Referências

- [Edge-Go WebSocket Protocol](../edge-go-ws/WEBSOCKET_SETUP.md)
- [Edge-Go WebSocket Gateway](../../api/src/modules/mqtt/edge-go-websocket.gateway.ts)

