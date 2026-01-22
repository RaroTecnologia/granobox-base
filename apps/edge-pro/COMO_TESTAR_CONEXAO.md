# 🔍 Como Testar a Conexão do Edge-Pro

## 📋 Resumo do Status Atual

**Device ID:** `edge-pro-75cba45f`  
**URL WebSocket:** `wss://ws.granobox.com.br/edge-go-ws` ✅ (correto, igual ao Edge-Go)  
**Status:** ❌ Não conectado (problema ao enviar registro)

---

## 🧪 Formas de Testar a Conexão

### 1. **Teste Local (Raspberry Pi)**

```bash
# Verificar se o serviço está rodando
ssh tagment@192.168.10.140 "sudo systemctl status edge-pro.service"

# Verificar health do Edge-Pro
ssh tagment@192.168.10.140 "curl -s http://localhost:8080/health | python3 -m json.tool"

# Verificar status WebSocket local
ssh tagment@192.168.10.140 "curl -s http://localhost:8080/websocket/status | python3 -m json.tool"

# Ver logs em tempo real
ssh tagment@192.168.10.140 "sudo journalctl -u edge-pro.service -f"
```

**Resultado esperado:**
- `status: "ok"` no health check
- `connected: true` no status WebSocket (quando funcionar)
- Logs mostrando "✅ Dispositivo registrado com sucesso!"

---

### 2. **Teste na API (Backend)**

```bash
# 1. Fazer login e obter token
TOKEN=$(curl -s -X POST https://api.granobox.com.br/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tiagolevorato+pro@treslados.group","password":"Mudar@1234"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# 2. Verificar status do device específico
curl -s -X GET "https://api.granobox.com.br/edge-go-ws/device/edge-pro-75cba45f/status" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool

# 3. Verificar todos os dispositivos conectados
curl -s -X GET "https://api.granobox.com.br/edge-go-ws/stats" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool | grep -A 5 "edge-pro-75cba45f"
```

**Resultado esperado:**
- `connected: true`
- `deviceInfo` com dados do dispositivo
- Device aparecendo na lista de `devices` conectados

---

### 3. **Verificar Logs do Edge-Pro**

```bash
# Logs dos últimos 5 minutos
ssh tagment@192.168.10.140 "sudo journalctl -u edge-pro.service --since '5 minutes ago' --no-pager"

# Filtrar apenas erros e conexão
ssh tagment@192.168.10.140 "sudo journalctl -u edge-pro.service --since '5 minutes ago' --no-pager | grep -E '(error|erro|conectado|connected|register|registro|WebSocket)' -i"

# Ver logs em tempo real
ssh tagment@192.168.10.140 "sudo journalctl -u edge-pro.service -f"
```

---

### 4. **Script de Teste Completo**

Salve o script abaixo como `test-edge-pro-connection.sh`:

```bash
#!/bin/bash

echo "🔍 =========================================="
echo "🔍 TESTE DE CONEXÃO EDGE-PRO"
echo "🔍 =========================================="
echo ""

# 1. Verificar se o serviço está rodando
echo "1️⃣ Verificando se o serviço está rodando..."
ssh tagment@192.168.10.140 "sudo systemctl is-active edge-pro.service"
echo ""

# 2. Verificar health do Edge-Pro
echo "2️⃣ Verificando health do Edge-Pro (localhost:8080)..."
ssh tagment@192.168.10.140 "curl -s http://localhost:8080/health | python3 -m json.tool"
echo ""

# 3. Verificar status WebSocket local
echo "3️⃣ Verificando status WebSocket do Edge-Pro..."
ssh tagment@192.168.10.140 "curl -s http://localhost:8080/websocket/status | python3 -m json.tool"
echo ""

# 4. Verificar logs recentes
echo "4️⃣ Últimos logs do Edge-Pro (últimos 30 segundos)..."
ssh tagment@192.168.10.140 "sudo journalctl -u edge-pro.service --since '30 seconds ago' --no-pager | tail -20"
echo ""

# 5. Verificar se está conectado na API
echo "5️⃣ Verificando se está conectado na API..."
TOKEN=$(curl -s -X POST https://api.granobox.com.br/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tiagolevorato+pro@treslados.group","password":"Mudar@1234"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

echo "   Token obtido: ${TOKEN:0:30}..."
echo ""

echo "   Verificando status do device na API..."
curl -s -X GET "https://api.granobox.com.br/edge-go-ws/device/edge-pro-75cba45f/status" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool
echo ""

echo "   Verificando stats gerais (dispositivos conectados)..."
curl -s -X GET "https://api.granobox.com.br/edge-go-ws/stats" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool | grep -E "(edge-pro-75cba45f|connected|devices)" -A 5 -B 5
echo ""

echo "✅ Teste concluído!"
```

---

## ❌ Problema Atual

**Sintoma:** O Edge-Pro tenta se conectar ao WebSocket, mas falha ao enviar o registro com erro "não conectado".

**Causa:** O método `IsConnected()` verifica se está `connected && registered`, mas para enviar o registro ainda não está registrado, então falha.

**Status da Correção:**
- ✅ Código atualizado para permitir envio de `register` mesmo sem estar registrado
- ⚠️ Binário no Raspberry Pi pode não estar atualizado com a correção

---

## 🔧 Próximos Passos

1. **Verificar se o binário foi atualizado:**
   ```bash
   ssh tagment@192.168.10.140 "file /usr/local/bin/edge-pro && ls -lh /usr/local/bin/edge-pro"
   ```

2. **Recompilar e redeployar:**
   ```bash
   cd /Volumes/DadosTiago/Dev/granobox/apps/edge-pro
   GOOS=linux GOARCH=arm64 go build -o edge-pro cmd/edge-pro/main.go
   scp edge-pro tagment@192.168.10.140:/tmp/
   ssh tagment@192.168.10.140 "sudo mv /tmp/edge-pro /usr/local/bin/edge-pro && sudo chmod +x /usr/local/bin/edge-pro && sudo systemctl restart edge-pro.service"
   ```

3. **Aguardar alguns segundos e verificar logs:**
   ```bash
   ssh tagment@192.168.10.140 "sudo journalctl -u edge-pro.service --since '1 minute ago' --no-pager | grep -E '(registro|register|conectado|error)' -i"
   ```

---

## ✅ Indicadores de Sucesso

Quando a conexão estiver funcionando, você verá:

1. **No status local:**
   ```json
   {
     "connected": true,
     "fingerprint": "edge-pro-75cba45f",
     "protocol": "websocket-pure"
   }
   ```

2. **Nos logs:**
   ```
   ✅ Dispositivo registrado com sucesso!
   💓 Enviando heartbeat...
   ```

3. **Na API:**
   ```json
   {
     "deviceId": "edge-pro-75cba45f",
     "connected": true,
     "deviceInfo": {
       "clientId": "...",
       "connectedAt": "...",
       "registered": true
     }
   }
   ```

---

## 📝 Notas

- A URL WebSocket está correta: `wss://ws.granobox.com.br/edge-go-ws` (porta 443, WSS)
- O problema está no envio do registro, não na conexão WebSocket
- O Edge-Pro está tentando conectar, mas falha ao enviar o registro porque `IsConnected()` retorna `false` antes de estar registrado

