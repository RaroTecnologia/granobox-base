# 🎯 Configuração Completa: Edge-Pro (Mesmo Fluxo do Edge-Go)

## 📋 Fluxo Completo de Adoção

O Edge-Pro segue **exatamente o mesmo fluxo** do Edge-Go:

### 1️⃣ **Obter Device ID (Fingerprint)**

O Edge-Pro gera automaticamente um `deviceId` único baseado no MAC do Raspberry Pi:

**Formato:** `edge-pro-{últimos_8_chars_do_MAC}`

**Exemplo:**
- MAC: `DC:A6:32:C5:BA:45:F2:12` (ou similar)
- Device ID: `edge-pro-cba45f12` ou `edge-pro-75cba45f` (últimos 8 caracteres)

**Como obter no Pi:**
```bash
ssh tagment@192.168.10.140 "cat /sys/class/net/wlan0/address | tr -d ':' | tail -c 9"
```

Ou verificar no log do Edge-Pro quando iniciar:
```
📋 Fingerprint gerado: edge-pro-75cba45f
```

---

### 2️⃣ **Gerar API Key no Backend**

#### Opção A: Via Flutter App (Recomendado) ✅

O Flutter já tem a funcionalidade de adoção de dispositivos. Basta usar o app Flutter para adotar o Edge-Pro da mesma forma que adota um Edge-Go.

#### Opção B: Via cURL/HTTP

```bash
# 1. Fazer login (obter token do usuário)
TOKEN=$(curl -s -X POST https://api.granobox.com.br/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "suasenha"
  }' | jq -r '.access_token')

echo "Token: $TOKEN"

# 2. Gerar API Key para o Edge-Pro
# IMPORTANTE: Usar o deviceId completo (ex: edge-pro-75cba45f)
DEVICE_ID="edge-pro-75cba45f"  # Substitua pelo ID do seu Pi

RESPONSE=$(curl -s -X POST \
  "https://api.granobox.com.br/devices/$DEVICE_ID/generate-key" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceType": "edge-pro"
  }')

echo "$RESPONSE" | jq '.'

# A resposta será algo como:
# {
#   "apiKey": "edg_75cba45f_1730123456789_abcdef1234567890",
#   "deviceId": "edge-pro-75cba45f"
# }
```

**⚠️ IMPORTANTE:**
- O `deviceId` deve ser o **formato completo** (`edge-pro-75cba45f`), não apenas o MAC
- O backend pode aceitar MAC no formato `A1:B2:C3:D4:E5:F6` ou `A1B2C3D4E5F6`, mas o formato `edge-pro-xxx` é preferível

---

### 3️⃣ **Configurar API Key no Edge-Pro**

Edite o arquivo de configuração no Raspberry Pi:

```bash
ssh tagment@192.168.10.140
sudo nano /etc/edge-pro/config.yaml
```

**Configuração completa:**
```yaml
device:
  id: "edge-pro-75cba45f"  # Device ID (mesmo usado para gerar API Key)
  name: "Edge-Pro Expedição"  # Nome personalizado (opcional)
  version: "1.0.0"
  location: "Sala de Expedição"  # Localização (opcional)
  hostname: ""

socketio:
  server_url: "https://api.granobox.com.br"  # Produção
  # server_url: "http://localhost:3000"      # Dev (se necessário)
  
  agent_fingerprint: "edge-pro-75cba45f"  # ⚠️ IGUAL ao device.id acima
  api_key: "edg_75cba45f_1730123456789_abcdef1234567890"  # ⚠️ API Key gerada
  reconnect_delay: 5
  local_port: 3000

api:
  port: 8080
  host: "0.0.0.0"

display:
  enabled: false
  service_url: "localhost:3006"
  type: "rgb"

printer:
  auto_detect_usb: true
  tcp_printers: []

debug: false
```

**Campos críticos:**
- ✅ `device.id` = Device ID (ex: `edge-pro-75cba45f`)
- ✅ `socketio.agent_fingerprint` = **DEVE SER IGUAL** ao `device.id`
- ✅ `socketio.api_key` = API Key gerada pelo backend

---

### 4️⃣ **Iniciar Serviço**

```bash
ssh tagment@192.168.10.140

# Habilitar para iniciar no boot
sudo systemctl enable edge-pro.service

# Iniciar agora
sudo systemctl start edge-pro.service

# Ver logs em tempo real
sudo journalctl -u edge-pro.service -f
```

---

### 5️⃣ **Verificar Registro no WebSocket**

Logs esperados quando tudo estiver funcionando:

```
🚀 Iniciando Edge-Pro v1.0.0
🆔 Fingerprint gerado: edge-pro-75cba45f
✅ Device configurado - modo normal
🔌 Iniciando conexão WebSocket pura...
🔐 Conectando WebSocket puro ao Granobox...
   Modo PRODUÇÃO detectado - usando wss://ws.granobox.com.br/edge-go-ws
🚀 WebSocket conectado, aguardando eventos...
📝 Preparando registro do dispositivo...
📝 Enviando registro...
✅ Dispositivo registrado com sucesso!
💓 Enviando heartbeat...
```

---

## 🔄 Fluxo de Autenticação (Interno)

O Edge-Pro faz o seguinte internamente (igual ao Edge-Go):

### 1. **Autenticar com a API**

Antes de registrar no WebSocket, o Edge-Pro precisa autenticar:

```http
POST /auth/device
Content-Type: application/json

{
  "device_id": "edge-pro-75cba45f",
  "api_key": "edg_75cba45f_1730123456789_abcdef1234567890"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "device": {
    "id": "uuid-do-device",
    "deviceId": "edge-pro-75cba45f",
    "name": "Edge-Pro Expedição",
    "status": "active",
    "clientId": "uuid-do-cliente",
    "operationId": "uuid-da-operacao"
  }
}
```

### 2. **Registrar no WebSocket**

Depois da autenticação, o Edge-Pro registra no WebSocket:

```json
{
  "type": "register",
  "deviceId": "edge-pro-75cba45f",
  "clientId": "uuid-do-cliente",
  "data": {
    "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "version": "1.0.0",
    "platform": "linux-arm64",
    "ip": "192.168.10.140",
    "mac": "DC:A6:32:C5:BA:45:F2:12"
  },
  "timestamp": "1730123456789"
}
```

---

## 🆕 Implementação no Edge-Pro

**Status atual:** O Edge-Pro ainda não faz autenticação HTTP antes do WebSocket (diferente do Edge-Go).

**O que precisa ser implementado:**

1. ✅ **Cliente WebSocket puro** - Já feito
2. ⏳ **Autenticação HTTP** (`POST /auth/device`) - Precisa ser implementado
3. ⏳ **Extrair clientId/operationId** da resposta de autenticação - Precisa ser implementado
4. ✅ **Registro no WebSocket** - Já feito (mas precisa usar clientId da autenticação)

---

## 🔧 Implementação da Autenticação

O Edge-Pro precisa:

1. **Antes de conectar no WebSocket**, chamar `POST /auth/device`
2. **Salvar o JWT token** retornado
3. **Salvar o clientId e operationId** da resposta
4. **Usar o JWT token** no registro WebSocket (ao invés da API Key)
5. **Usar o clientId real** no registro (ao invés de um placeholder)

Quer que eu implemente essa autenticação HTTP no Edge-Pro agora?

---

## 📝 Checklist de Configuração

- [ ] Obter Device ID do Raspberry Pi
- [ ] Gerar API Key via Flutter ou cURL
- [ ] Editar `/etc/edge-pro/config.yaml` com:
  - [ ] `device.id` = Device ID
  - [ ] `socketio.agent_fingerprint` = Device ID (igual)
  - [ ] `socketio.api_key` = API Key gerada
- [ ] Iniciar serviço: `sudo systemctl start edge-pro.service`
- [ ] Verificar logs: `sudo journalctl -u edge-pro.service -f`
- [ ] Verificar registro no WebSocket nos logs
- [ ] Testar impressão via API

---

## 🆘 Troubleshooting

### "API Key não configurada"

Verifique se o `api_key` está no arquivo de config:
```bash
ssh tagment@192.168.10.140 'sudo cat /etc/edge-pro/config.yaml | grep api_key'
```

### "Device ID não encontrado"

Verifique se o `agent_fingerprint` está igual ao `device.id`:
```bash
ssh tagment@192.168.10.140 'sudo cat /etc/edge-pro/config.yaml | grep -E "(device:|agent_fingerprint)"'
```

### WebSocket não conecta

Verifique conectividade:
```bash
ssh tagment@192.168.10.140 'curl -I https://api.granobox.com.br'
```

### "Dispositivo não registrado"

1. Verifique se a API Key está correta
2. Verifique se o Device ID está correto
3. Verifique os logs do backend para ver se o registro chegou

---

## 📚 Referências

- [Edge-Go WebSocket Setup](../edge-go-ws/WEBSOCKET_SETUP.md)
- [Edge-Go ClientId Implementation](../edge-go-ws/CLIENTID_IMPLEMENTADO.md)
- [API Device Authentication](../../api/src/modules/auth/auth.service.ts)

