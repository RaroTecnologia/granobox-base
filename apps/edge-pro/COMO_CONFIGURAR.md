# 🎯 Como Configurar o Edge-Pro no Raspberry Pi

## 📋 Passo a Passo Completo

### 1️⃣ **Obter Device ID do Raspberry Pi**

O Edge-Pro gera automaticamente um Device ID baseado no MAC. Vamos descobrir qual é:

```bash
ssh tagment@192.168.10.140

# Ver MAC address
cat /sys/class/net/wlan0/address
# ou
cat /sys/class/net/eth0/address

# O Device ID será gerado automaticamente pelo Edge-Pro
# Formato: edge-pro-{últimos_8_chars_do_MAC}
```

**Exemplo:**
- MAC: `DC:A6:32:C5:BA:45:F2:12` → Device ID: `edge-pro-cba45f12`
- Ou se o Pi já gerou: `edge-pro-75cba45f` (verificar nos logs)

**Ou verificar nos logs do Edge-Pro:**
```bash
ssh tagment@192.168.10.140 'sudo journalctl -u edge-pro.service | grep "Fingerprint\|Device ID" | tail -1'
```

---

### 2️⃣ **Opção A: Via Flutter App (Recomendado)** ✅

O Flutter já suporta adoção de Edge-Pro! Basta:

1. **Abrir o app Flutter Tag**
2. **Ir em "Dispositivos"** ou "Configurações"
3. **Procurar por Edge-Pro** (se aparecer via BLE ou rede)
4. **Seguir o fluxo de adoção** (igual ao Edge-Go)
5. O app vai:
   - Gerar API Key no backend
   - Configurar WiFi
   - Configurar API Key via HTTP

**Endpoint usado pelo Flutter:**
```
POST /devices/{fingerprint}/generate-key
Authorization: Bearer {user_token}
Body: { "deviceType": "edge-pro" }
```

---

### 3️⃣ **Opção B: Via cURL (Manual)**

Se preferir fazer manualmente:

```bash
# 1. Fazer login no backend
TOKEN=$(curl -s -X POST https://api.granobox.com.br/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "suasenha"
  }' | jq -r '.access_token')

echo "Token obtido: ${TOKEN:0:20}..."

# 2. Gerar API Key
# IMPORTANTE: Usar o deviceId completo (ex: edge-pro-75cba45f)
DEVICE_ID="edge-pro-75cba45f"  # ⚠️ SUBSTITUA pelo ID do seu Pi

RESPONSE=$(curl -s -X POST \
  "https://api.granobox.com.br/devices/$DEVICE_ID/generate-key" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceType": "edge-pro"
  }')

echo "$RESPONSE" | jq '.'

# A resposta será:
# {
#   "apiKey": "edg_75cba45f_1730123456789_abcdef1234567890",
#   "deviceId": "edge-pro-75cba45f"
# }
```

**Copie o `apiKey` retornado!**

---

### 4️⃣ **Configurar Edge-Pro no Pi**

Edite o arquivo de configuração:

```bash
ssh tagment@192.168.10.140
sudo nano /etc/edge-pro/config.yaml
```

**Configuração completa:**
```yaml
device:
  id: "edge-pro-75cba45f"  # ⚠️ Device ID (obtido no passo 1)
  name: "Edge-Pro Expedição"  # Nome personalizado
  version: "1.0.0"
  location: "Sala de Expedição"
  hostname: ""

socketio:
  server_url: "https://api.granobox.com.br"  # Produção
  
  agent_fingerprint: "edge-pro-75cba45f"  # ⚠️ DEVE SER IGUAL ao device.id
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

**⚠️ CAMPOS CRÍTICOS:**
- ✅ `device.id` = Device ID (ex: `edge-pro-75cba45f`)
- ✅ `socketio.agent_fingerprint` = **DEVE SER IGUAL** ao `device.id`
- ✅ `socketio.api_key` = API Key gerada no passo 2 ou 3

---

### 5️⃣ **Iniciar Serviço**

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

### 6️⃣ **Verificar Registro**

Logs esperados quando funcionar:

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

## 🔍 Como Descobrir o Device ID

O Edge-Pro gera automaticamente. Para descobrir:

### Método 1: Verificar logs (se já iniciou)

```bash
ssh tagment@192.168.10.140 'sudo journalctl -u edge-pro.service | grep -E "Fingerprint|Device ID|agent_fingerprint" | head -5'
```

### Método 2: Verificar MAC e calcular

```bash
ssh tagment@192.168.10.140 "MAC=\$(cat /sys/class/net/wlan0/address 2>/dev/null || cat /sys/class/net/eth0/address | head -1); MAC_CLEAN=\$(echo \$MAC | tr -d ':'); echo \"edge-pro-\${MAC_CLEAN: -8}\""
```

### Método 3: Verificar arquivo de config

```bash
ssh tagment@192.168.10.140 'sudo cat /etc/edge-pro/config.yaml | grep -E "id:|agent_fingerprint"'
```

---

## 🚨 Problema: Edge-Pro não faz autenticação HTTP

**Status atual:** O Edge-Pro ainda **não implementa** a autenticação HTTP (`POST /auth/device`) que o Edge-Go faz antes do WebSocket.

**O que isso significa:**
- O Edge-Pro precisa da API Key configurada manualmente
- Não há autenticação automática para obter JWT token
- O registro no WebSocket usa a API Key diretamente

**Solução temporária:**
1. Configurar a API Key manualmente no arquivo YAML
2. O Edge-Pro vai usar a API Key diretamente no registro WebSocket
3. Funciona, mas não é o fluxo ideal

**Solução ideal (a implementar):**
- Fazer autenticação HTTP antes do WebSocket
- Obter JWT token e clientId/operationId
- Usar JWT no registro WebSocket

---

## 📝 Resumo Rápido

1. **Descobrir Device ID:** `edge-pro-{MAC}`
2. **Gerar API Key:** Via Flutter ou cURL (`POST /devices/{deviceId}/generate-key`)
3. **Editar config:** `/etc/edge-pro/config.yaml`
4. **Iniciar serviço:** `sudo systemctl start edge-pro.service`
5. **Ver logs:** `sudo journalctl -u edge-pro.service -f`

---

## 🔧 Script de Configuração Rápida

Quer que eu crie um script que:
- Descobre o Device ID automaticamente
- Gera a API Key via API
- Configura o arquivo YAML
- Inicia o serviço?

Posso criar isso agora! 😊

