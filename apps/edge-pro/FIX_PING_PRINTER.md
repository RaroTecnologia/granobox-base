# 🐛 Fix: Handler para ping_printer no Edge-Pro

## ❌ Problema

A impressora estava sendo reportada como "offline" mesmo com o Edge-Pro conectado e registrado.

**Causa raiz:** O Edge-Pro não tinha handler para responder ao `ping_printer` da API. Quando a API enviava `ping_printer` para verificar o status da impressora antes de imprimir, o Edge-Pro não respondia, causando timeout e status "offline".

## ✅ Solução Implementada

### 1. Handler para `ping_printer`

Adicionado handler no `setupHandlers()`:

```go
c.handlers["ping_printer"] = func(data interface{}) {
    c.log.Info().Msg("📍 Ping da impressora recebido")
    c.handlePrinterPing(data)
}
```

### 2. Função `handlePrinterPing`

Implementada função que:
- Extrai `requestId` da mensagem
- Verifica status da impressora USB via `printerManager.CreateAutoUSBPrinters()`
- Determina status: `"ready"` se USB conectado e impressora online, `"offline"` caso contrário
- Responde no formato esperado pela API:

```json
{
  "type": "printer_status",
  "requestId": "...",
  "status": "ready" | "offline",
  "details": {
    "usbConnected": true/false,
    "paperStatus": "ok",
    "errorMessage": null | "mensagem de erro"
  },
  "timestamp": "..."
}
```

## 📝 Formato da Resposta

A API espera que os campos `requestId`, `status` e `details` estejam **na raiz da mensagem**, não dentro de `data`. Por isso, a mensagem é enviada diretamente via WebSocket, sem usar a função `sendMessage()` que colocaria tudo dentro de `data`.

## 🔄 Fluxo Completo

1. API recebe requisição de impressão
2. API chama `pingPrinter(deviceId)` 
3. API envia `ping_printer` via WebSocket com `requestId`
4. **Edge-Pro recebe e processa** (NOVO!)
5. Edge-Pro verifica impressora USB
6. Edge-Pro responde com `printer_status` 
7. API recebe resposta e verifica se `status === "ready"`
8. Se ready, API envia job de impressão

## ✅ Status

- [x] Handler `ping_printer` adicionado
- [x] Função `handlePrinterPing` implementada
- [x] Formato de resposta corrigido (campos na raiz)
- [x] Compilação sem erros
- [ ] Teste em produção

---

**Data:** 2025-12-01  
**Autor:** AI Assistant  
**Arquivos modificados:**
- `apps/edge-pro/internal/websocket/client.go`

