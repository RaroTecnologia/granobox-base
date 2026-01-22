# 🎯 Fix: ClientID do Edge-Pro para Métricas

## ❌ Problema

A API retorna erro ao tentar salvar métricas detalhadas do Edge-Pro:
```
❌ Erro ao salvar métricas detalhadas do device edge-pro-75cba45f: 
invalid input syntax for type uuid: "edge-pro-75cba45f"
```

## 🔍 Causa Raiz

O Edge-Pro estava enviando `clientId: "edge-pro-75cba45f"` (o próprio deviceId) nos heartbeats, mas a tabela `device_heartbeats` espera um **UUID** de cliente.

## ✅ Solução Implementada

### 1. Adicionar Campos ao `DeviceConfig`

**Arquivo:** `apps/edge-pro/internal/config/config.go`

```go
type DeviceConfig struct {
    ID          string `mapstructure:"id"`
    Version     string `mapstructure:"version"`
    Name        string `mapstructure:"name"`
    Location    string `mapstructure:"location"`
    Hostname    string `mapstructure:"hostname"`
    ClientID    string `mapstructure:"client_id"`   // ⭐ NOVO
    OperationID string `mapstructure:"operation_id"` // ⭐ NOVO
}
```

### 2. Buscar ClientID do Backend

**Arquivo:** `apps/edge-pro/internal/websocket/client.go`

Criada função `fetchDeviceInfo()` que busca o clientId real via `/auth/device`:

```go
func (c *Client) fetchDeviceInfo() error {
    // POST /auth/device com { deviceId, apiKey }
    // Retorna { device: { clientId, operationId } }
    // Salva em c.deviceCfg.ClientID e c.deviceCfg.OperationID
}
```

### 3. Usar ClientID Real no Registro

Modificado `sendRegister()` para:
1. Tentar buscar clientId do backend se não estiver configurado
2. Usar clientId real se disponível
3. Fallback para fingerprint se não conseguir obter

```go
// Buscar clientId do backend
if c.deviceCfg.ClientID == "" {
    if err := c.fetchDeviceInfo(); err != nil {
        c.log.Warn().Err(err).Msg("Usando placeholder")
    }
}

// Usar clientId REAL
clientId := c.deviceCfg.ClientID
if clientId == "" {
    clientId = c.cfg.AgentFingerprint // Fallback
}

// Enviar com clientId correto
return c.sendRegisterMessage(c.cfg.AgentFingerprint, clientId, registerData)
```

## 🐛 Problema Remanescente

O `/auth/device` retorna **status 400** para dispositivos já adotados.

**Logs:**
```
🔍 Buscando clientId do backend via /auth/device...
⚠️ Não foi possível buscar clientId do backend, usando placeholder
⚠️ Usando fingerprint como clientId (aguardando autenticação)
```

## 💡 Solução Final Necessária

O Edge-Pro precisa buscar o device do banco via **outro endpoint** que retorne o clientId para dispositivos já adotados.

### Opções:

1. **Criar endpoint `/devices/:deviceId/info`** na API que retorna:
   ```json
   {
     "id": "uuid-do-device",
     "deviceId": "edge-pro-75cba45f",
     "clientId": "uuid-do-cliente",
     "operationId": "uuid-da-operacao",
     "name": "Edge-Pro Device"
   }
   ```

2. **Modificar `/auth/device`** para aceitar devices já adotados

3. **Salvar clientId no config.yaml** durante a adoção (via provisioning)

## 📊 Status Atual

- ✅ Edge-Pro conectado via WebSocket
- ✅ Heartbeats funcionando
- ✅ Impressora registrada
- ⚠️ Métricas detalhadas NÃO estão sendo salvas (erro de UUID)
- ✅ `lastSeenAt` do device sendo atualizado normalmente

## 🧪 Como Testar

Aguardar próximo heartbeat (30s) e verificar logs da API:

```bash
# Se der erro UUID = ainda usando fingerprint
# Se NÃO der erro = clientId real foi obtido
```

## 📝 Arquivos Modificados

1. `apps/edge-pro/internal/config/config.go` - Adicionado `ClientID` e `OperationID`
2. `apps/edge-pro/internal/websocket/client.go` - Adicionado `fetchDeviceInfo()` e modificado `sendRegister()`

---

**Data:** 2025-12-01 17:26 BRT  
**Status:** 🟡 Parcialmente resolvido - precisa endpoint adicional na API

