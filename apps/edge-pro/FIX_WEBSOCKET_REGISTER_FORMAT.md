# 🐛 Fix: Formato da Mensagem WebSocket Register

## ❌ Problema Identificado

O Edge-Pro estava enviando a mensagem `register` no formato INCORRETO:

```json
{
  "type": "register",
  "data": {
    "deviceId": "edge-pro-75cba45f",
    "clientId": "edge-pro-75cba45f",
    "authToken": "...",
    ...
  },
  "timestamp": "..."
}
```

O gateway WebSocket da API espera o formato do Edge-Go, onde `deviceId` e `clientId` devem estar **NA RAIZ da mensagem**, não dentro de `data`.

## ✅ Formato Correto

```json
{
  "type": "register",
  "deviceId": "edge-pro-75cba45f",
  "clientId": "edge-pro-75cba45f",
  "data": {
    "authToken": "...",
    "name": "Edge-Pro Device",
    "hostname": "...",
    "version": "1.0.0",
    "platform": "linux-arm64",
    "ip": "192.168.10.140",
    "mac": "...",
    "capabilities": {
      "usb": true,
      "display": false,
      "maxPrinters": 1,
      "protocols": ["ZPL", "TSPL"]
    },
    "cpuUsage": 0.0,
    "memoryUsage": 0.0,
    "uptime": 123
  },
  "timestamp": "1733080000000"
}
```

## 🔧 Correção Implementada

### 1. Nova Função `sendRegisterMessage()`

Criada função específica para enviar a mensagem de registro com o formato correto:

```go
func (c *Client) sendRegisterMessage(deviceId, clientId string, data interface{}) error {
	c.mu.RLock()
	connected := c.connected
	conn := c.conn
	c.mu.RUnlock()
	
	c.log.Info().
		Bool("connected", connected).
		Bool("conn_not_nil", conn != nil).
		Str("deviceId", deviceId).
		Msg("🔍 sendRegisterMessage - verificando estado")
	
	if !connected {
		c.log.Warn().Msg("⚠️  Tentativa de enviar register mas não está conectado")
		return fmt.Errorf("não conectado")
	}
	
	if conn == nil {
		c.log.Warn().Msg("⚠️  Tentativa de enviar register mas conexão é nil")
		return fmt.Errorf("conexão não inicializada")
	}
	
	// ⭐ Formato especial para register: deviceId e clientId na RAIZ, não em data
	msg := map[string]interface{}{
		"type":      "register",
		"deviceId":  deviceId,
		"clientId":  clientId,
		"data":      data,
		"timestamp": fmt.Sprintf("%d", time.Now().UnixMilli()),
	}

	msgJSON, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("erro ao serializar mensagem: %w", err)
	}

	c.log.Info().
		Str("deviceId", deviceId).
		Str("clientId", clientId).
		Str("json", string(msgJSON)).
		Msg("📤 Enviando mensagem register com formato correto...")
	
	if err := conn.WriteMessage(websocket.TextMessage, msgJSON); err != nil {
		c.log.Error().Err(err).Msg("❌ Erro ao enviar mensagem register")
		return fmt.Errorf("erro ao enviar mensagem: %w", err)
	}

	c.log.Info().Msg("✅ Mensagem register enviada com sucesso")
	return nil
}
```

### 2. Modificado `sendRegister()`

Atualizado para usar `sendRegisterMessage()` e colocar apenas os dados auxiliares dentro de `data`:

```go
func (c *Client) sendRegister() error {
	c.log.Info().Msg("📝 Preparando registro do dispositivo...")

	// ... (obter informações do sistema) ...

	// ⭐ FORMATO CORRETO: deviceId e clientId na RAIZ da mensagem, outros dados em "data"
	registerData := map[string]interface{}{
		"authToken": c.cfg.APIKey,
		"name":      deviceName,
		"hostname":  hostname,
		"version":   c.deviceCfg.Version,
		"platform":  "linux-arm64",
		"ip":        localIP,
		"mac":       macAddr,
		"freeHeap":  0,
		"cpuUsage":  systemMetrics.CPUUsage,
		"memoryUsage": systemMetrics.MemoryUsage,
		"uptime":    systemMetrics.Uptime,
		"capabilities": map[string]interface{}{
			"usb":         true,
			"display":     false,
			"maxPrinters": 1,
			"protocols":   []string{"ZPL", "TSPL"},
		},
	}

	// ⭐ Enviar com deviceId e clientId separados
	return c.sendRegisterMessage(c.cfg.AgentFingerprint, c.cfg.AgentFingerprint, registerData)
}
```

### 3. Aumentado Delay e Melhorada Validação

Aumentado o delay de 500ms para 1 segundo e adicionada validação explícita antes de enviar o registro:

```go
// Enviar registro imediatamente após conectar
go func() {
	time.Sleep(1 * time.Second) // Aumentar delay para garantir estabilização
	
	// Verificar estado antes de enviar
	c.mu.RLock()
	connected := c.connected
	connCheck := c.conn
	c.mu.RUnlock()
	
	c.log.Info().
		Bool("connected", connected).
		Bool("conn_not_nil", connCheck != nil).
		Msg("🔍 Estado antes de enviar registro")
	
	if !connected || connCheck == nil {
		c.log.Error().Msg("❌ Não foi possível enviar registro: conexão não estabelecida")
		return
	}
	
	if err := c.sendRegister(); err != nil {
		c.log.Error().Err(err).Msg("Erro ao enviar registro")
	}
}()
```

## 🧪 Como Testar

### 1. Recompilar e Fazer Deploy

```bash
cd /Volumes/DadosTiago/Dev/granobox/apps/edge-pro

# Limpar build anterior
go clean -cache

# Compilar para ARM64 (Raspberry Pi)
GOOS=linux GOARCH=arm64 go build -a -o edge-pro cmd/edge-pro/main.go

# Verificar tamanho do binário
ls -lh edge-pro

# Copiar para o Raspberry Pi
scp edge-pro tagment@192.168.10.140:/tmp/edge-pro-new

# Aplicar no Pi
ssh tagment@192.168.10.140 "sudo systemctl stop edge-pro.service && \
  sudo mv /tmp/edge-pro-new /usr/local/bin/edge-pro && \
  sudo chmod +x /usr/local/bin/edge-pro && \
  sudo systemctl start edge-pro.service"
```

### 2. Verificar Logs

```bash
# Ver logs em tempo real
ssh tagment@192.168.10.140 "journalctl -u edge-pro.service -f"

# Procurar por mensagens de registro
ssh tagment@192.168.10.140 "journalctl -u edge-pro.service --since '1 minute ago' | grep -E 'register|Estado|verificando|Preparando'"
```

### 3. Testar Conexão com a API

```bash
# Executar script de teste
/tmp/test-edge-pro.sh
```

**Resultado Esperado:**
- `"connected": true` no status local
- `"connected": true, "deviceInfo": {...}` no status da API
- Logs mostrando `✅ Mensagem register enviada com sucesso`
- Logs mostrando `✅ Dispositivo registrado com sucesso!` (do handler `register_ack`)

## 📚 Referências

- **API Gateway:** `apps/api/src/modules/mqtt/edge-go-websocket.gateway.ts` (linha 227-242)
- **Edge-Pro Client:** `apps/edge-pro/internal/websocket/client.go`
- **Edge-Go Firmware:** `apps/edge-go-ws/components/granobox_websocket/granobox_websocket.c`

## ✅ Verificação Final

Para confirmar que o Edge-Pro está registrado corretamente:

```bash
# 1. Verificar se aparece nos dispositivos conectados na API
curl -X GET "https://api.granobox.com.br/edge-go-ws/stats" \
  -H "Authorization: Bearer <JWT_TOKEN>" | jq '.devices[] | select(.deviceId == "edge-pro-75cba45f")'

# 2. Verificar status específico do dispositivo
curl -X GET "https://api.granobox.com.br/edge-go-ws/device/edge-pro-75cba45f/status" \
  -H "Authorization: Bearer <JWT_TOKEN>" | jq .

# 3. Enviar um heartbeat manualmente (se necessário)
ssh tagment@192.168.10.140 "curl -X POST http://localhost:8080/websocket/emit \
  -H 'Content-Type: application/json' \
  -d '{\"event\": \"heartbeat\", \"data\": {\"status\": \"online\"}}'"
```

---

**Data da correção:** 2025-12-01  
**Status:** Implementado, aguardando teste completo

