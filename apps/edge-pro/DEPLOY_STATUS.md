# ✅ Status do Deploy - Edge-Pro no Raspberry Pi

## 🚀 Deploy Completo

**Host:** `tagment@192.168.10.140`  
**Binário:** `/opt/edge-pro/edge-pro` (8.1MB, ARM64, WebSocket Puro)  
**Config:** `/etc/edge-pro/config.yaml`  
**Serviço:** `edge-pro.service` (systemd)

---

## ✅ O Que Foi Feito

- ✅ Binário compilado para ARM64 (linux/arm64)
- ✅ Binário enviado para `/opt/edge-pro/edge-pro`
- ✅ Configuração criada em `/etc/edge-pro/config.yaml`
- ✅ Serviço systemd configurado
- ✅ Binário atualizado (WebSocket puro, não Socket.IO)
- ✅ Serviço parado (aguardando configuração)

---

## ⏳ Próximo Passo: Configurar API Key

Antes de iniciar, você precisa configurar a API Key:

```bash
ssh tagment@192.168.10.140
sudo nano /etc/edge-pro/config.yaml
```

Adicione:
```yaml
socketio:
  server_url: "https://api.granobox.com.br"
  agent_fingerprint: "edge-pro-cba45f"  # Único para este Pi (baseado no serial)
  api_key: "sua-api-key-gerada"         # Gerar via API ou Flutter
```

---

## 🚀 Iniciar o Serviço

Após configurar a API Key:

```bash
# Habilitar para iniciar no boot
ssh tagment@192.168.10.140 'sudo systemctl enable edge-pro.service'

# Iniciar agora
ssh tagment@192.168.10.140 'sudo systemctl start edge-pro.service'

# Verificar status
ssh tagment@192.168.10.140 'sudo systemctl status edge-pro.service'
```

---

## 📋 Logs Esperados

Quando iniciar corretamente, você deve ver:

```
🚀 Iniciando Edge-Pro v1.0.0
🔌 Iniciando conexão WebSocket pura...
🔐 Conectando WebSocket puro ao Granobox...
   Modo PRODUÇÃO detectado - usando wss://ws.granobox.com.br/edge-go-ws
🚀 WebSocket conectado, aguardando eventos...
📝 Preparando registro do dispositivo...
✅ Dispositivo registrado com sucesso!
💓 Enviando heartbeat...
```

---

## 🔍 Verificar Logs

```bash
# Logs em tempo real
ssh tagment@192.168.10.140 'sudo journalctl -u edge-pro.service -f'

# Últimas 50 linhas
ssh tagment@192.168.10.140 'sudo journalctl -u edge-pro.service -n 50'

# Logs desde hoje
ssh tagment@192.168.10.140 'sudo journalctl -u edge-pro.service --since today'
```

---

## 🔄 Atualizar Binário

Para atualizar o binário no futuro:

```bash
cd apps/edge-pro
./deploy-to-pi.sh
```

---

## ⚠️ Troubleshooting

### Serviço não inicia

```bash
# Verificar logs de erro
ssh tagment@192.168.10.140 'sudo journalctl -u edge-pro.service -n 100'

# Verificar permissões
ssh tagment@192.168.10.140 'ls -la /opt/edge-pro/'

# Testar binário manualmente
ssh tagment@192.168.10.140 '/opt/edge-pro/edge-pro -config /etc/edge-pro/config.yaml -debug'
```

### WebSocket não conecta

1. Verificar conectividade:
   ```bash
   ssh tagment@192.168.10.140 'curl -I https://api.granobox.com.br'
   ```

2. Verificar API Key:
   ```bash
   ssh tagment@192.168.10.140 'sudo cat /etc/edge-pro/config.yaml | grep -A 2 socketio'
   ```

3. Verificar logs específicos:
   ```bash
   ssh tagment@192.168.10.140 'sudo journalctl -u edge-pro.service | grep -E "(WebSocket|ERROR|conectar)"'
   ```

---

## 📊 Status Atual

| Item | Status |
|------|--------|
| Binário instalado | ✅ (8.1MB, WebSocket Puro) |
| Config criada | ✅ |
| Serviço configurado | ✅ |
| API Key configurada | ⏳ **PENDENTE** |
| Serviço rodando | ⏳ Aguardando API Key |

---

## 🎯 Ação Necessária

**AGORA:** Configure a API Key no arquivo `/etc/edge-pro/config.yaml` no Raspberry Pi e depois inicie o serviço.

---

**Deploy realizado com sucesso!** ✅

