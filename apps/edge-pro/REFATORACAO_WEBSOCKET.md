# ✅ Refatoração: Edge-Pro migrado para WebSocket Puro

## 📋 Resumo

O **Edge-Pro** foi completamente refatorado para usar **WebSocket puro** ao invés de Socket.IO, seguindo o mesmo protocolo do Edge-Go. Isso permite usar o mesmo gateway na API (`EdgeGoWebSocketGateway`).

---

## ✅ Mudanças Realizadas

### 1. Novo Cliente WebSocket Puro

**Arquivo:** `internal/websocket/client.go`

- ✅ Cliente WebSocket puro usando `gorilla/websocket`
- ✅ Protocolo JSON simples (mesmo formato do Edge-Go)
- ✅ Auto-reconnect com backoff exponencial (5s → 60s)
- ✅ Heartbeat automático (30 segundos)
- ✅ Suporte a formato v1.5 de impressão (`zpl`, `copies`, `labelIds`)
- ✅ Handlers para comandos remotos (`reboot`, `update_config`, etc)

### 2. Arquivos Modificados

- ✅ `internal/websocket/client.go` - Novo cliente WebSocket puro
- ✅ `cmd/edge-pro/main.go` - Atualizado para usar `websocket.Client`
- ✅ `internal/api/server.go` - Atualizado para usar `websocket.Client`
- ✅ `internal/websocket/interface.go` - Interface comum

### 3. Protocolo de Mensagens

**Formato (igual ao Edge-Go):**

```json
{
  "type": "register|heartbeat|print_job|print_ack|reboot|...",
  "data": { ... },
  "timestamp": "1640995200000"
}
```

### 4. URL de Conexão

**Antes (Socket.IO):**
```
wss://api.granobox.com.br/socket.io/?EIO=4&transport=websocket
```

**Agora (WebSocket puro):**
```
wss://ws.granobox.com.br/edge-go-ws  (produção)
ws://localhost:8081/edge-go-ws        (desenvolvimento)
```

---

## 🚀 Próximos Passos

1. **Compilar e testar** localmente
2. **Testar conexão** com a API
3. **Testar impressão** via WebSocket
4. **Testar comandos remotos** (reboot, etc)

---

## 📝 Notas

- O cliente mantém compatibilidade com o formato legado de jobs
- O servidor API mantém rotas antigas (`/socketio/*`) para backwards compatibility
- O protocolo é idêntico ao Edge-Go, permitindo usar o mesmo gateway na API

---

**Status:** ✅ Refatoração completa, pronto para testes

