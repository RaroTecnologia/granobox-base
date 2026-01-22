# 📊 Status da Correção WebSocket Edge-Pro

## ✅ Progresso Atual (2025-12-01 16:59)

### 1. Problema Identificado ✅
- **Root Cause:** Edge-Pro estava enviando mensagem `register` no formato INCORRETO
- **Formato Errado:** `{ type: "register", data: { deviceId: "...", clientId: "..." } }`
- **Formato Correto:** `{ type: "register", deviceId: "...", clientId: "...", data: { ... } }`

### 2. Correção Implementada ✅
- ✅ Criada função `sendRegisterMessage()` com formato correto
- ✅ Modificado `sendRegister()` para usar a nova função
- ✅ Binário compilado e deployado em `/opt/edge-pro/edge-pro`
- ✅ Logs de debug funcionando

### 3. Problema Atual ❌
**A API está fechando a conexão WebSocket imediatamente após o Edge-Pro conectar.**

**Evidências nos logs:**
```
16:57:46 - "✅ Estado atualizado: connected=true, registered=false"
16:57:46 - "🔌 Conexão encerrada, reconectando..." ❌ (0ms depois!)
16:57:47 - "🔍 Estado antes de enviar registro" → connected:false
```

**Possíveis causas:**
1. ❓ A API tem um timeout de 30 segundos para registro (linha 140-146 do `edge-go-websocket.gateway.ts`)
2. ❓ A mensagem `register` não está chegando na API
3. ❓ A API está rejeitando a mensagem por algum motivo
4. ❓ Problema de autenticação/certificado

## 🔍 Diagnóstico Adicional Necessário

### Verificar logs da API
```bash
# Ver se a API está recebendo a conexão
ssh tagment@granobox.com.br "docker logs granobox-api -f | grep edge-pro"
```

### Verificar mensagem enviada
Adicionar log da mensagem JSON completa sendo enviada pelo Edge-Pro para confirmar o formato.

### Teste manual com wscat
```bash
wscat -c "wss://ws.granobox.com.br/edge-go-ws"
# Enviar manualmente:
{"type":"register","deviceId":"edge-pro-75cba45f","clientId":"edge-pro-75cba45f","data":{"authToken":"edg_75cba45f_...","name":"Test"}}
```

## 📝 Próximos Passos

1. **Verificar logs da API** para ver se está recebendo a conexão
2. **Adicionar log do JSON completo** sendo enviado no `sendRegisterMessage`
3. **Comparar com Edge-Go** - verificar se Edge-Go está registrando corretamente
4. **Verificar timeout** - talvez aumentar o delay de 1s para 2s

## 🧪 Como Testar

```bash
cd /Volumes/DadosTiago/Dev/granobox/apps/edge-pro

# Recompilar
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -o edge-pro-test cmd/edge-pro/main.go

# Deploy
scp edge-pro-test tagment@192.168.10.140:/tmp/edge-pro-latest
ssh tagment@192.168.10.140 "sudo systemctl stop edge-pro.service && \
  sudo cp /tmp/edge-pro-latest /opt/edge-pro/edge-pro && \
  sudo chown root:root /opt/edge-pro/edge-pro && \
  sudo chmod +x /opt/edge-pro/edge-pro && \
  sudo systemctl start edge-pro.service"

# Monitorar logs
ssh tagment@192.168.10.140 "journalctl -u edge-pro.service -f"
```

## 📚 Arquivos Modificados

1. `apps/edge-pro/internal/websocket/client.go`
   - Nova função `sendRegisterMessage()` (linha ~537)
   - Modificado `sendRegister()` (linha ~368)
   - Modificado goroutine de envio (linha ~280)

2. `apps/edge-pro/cmd/edge-pro/main.go`
   - Adicionado identificador único ao log de início (BUILD-FIX-WEBSOCKET-2025-12-01)

## ⚠️ Nota Importante

O serviço no Raspberry Pi usa o binário em `/opt/edge-pro/edge-pro`, **NÃO** em `/usr/local/bin/edge-pro`.

Arquivo do serviço: `/etc/systemd/system/edge-pro.service`
```
ExecStart=/opt/edge-pro/edge-pro -config /etc/edge-pro/config.yaml
```

---

**Última atualização:** 2025-12-01 16:59 BRT  
**Status:** 🟡 Em progresso - Aguardando verificação de logs da API

