# 🚀 Deploy Edge-Pro no Raspberry Pi

## ✅ Deploy Realizado

**Host:** `tagment@192.168.10.140`  
**Data:** $(date)

### Arquivos Instalados

- ✅ Binário: `/opt/edge-pro/edge-pro` (12MB, ARM64)
- ✅ Config: `/etc/edge-pro/config.yaml`
- ✅ Serviço: `/etc/systemd/system/edge-pro.service`
- ✅ Logs: `journalctl -u edge-pro.service`

---

## 📋 Próximos Passos

### 1. Configurar API Key

```bash
ssh tagment@192.168.10.140
sudo nano /etc/edge-pro/config.yaml
```

Adicione:
```yaml
socketio:
  server_url: "https://api.granobox.com.br"
  agent_fingerprint: "edge-pro-cba45f"  # Único para este Pi
  api_key: "sua-api-key-aqui"           # Gerar via API ou Flutter
```

### 2. Habilitar e Iniciar Serviço

```bash
ssh tagment@192.168.10.140 'sudo systemctl enable edge-pro.service'
ssh tagment@192.168.10.140 'sudo systemctl start edge-pro.service'
```

### 3. Verificar Status

```bash
ssh tagment@192.168.10.140 'sudo systemctl status edge-pro.service'
```

### 4. Ver Logs em Tempo Real

```bash
ssh tagment@192.168.10.140 'sudo journalctl -u edge-pro.service -f'
```

---

## 🔍 Logs Esperados

Após iniciar, você deve ver:

```
🚀 Iniciando Edge-Pro v1.0.0
🔌 Iniciando conexão WebSocket pura...
🔐 Conectando WebSocket puro ao Granobox...
🚀 WebSocket conectado, aguardando eventos...
📝 Preparando registro do dispositivo...
✅ Dispositivo registrado com sucesso!
💓 Enviando heartbeat...
```

---

## 🛠️ Comandos Úteis

### Reiniciar Serviço
```bash
ssh tagment@192.168.10.140 'sudo systemctl restart edge-pro.service'
```

### Parar Serviço
```bash
ssh tagment@192.168.10.140 'sudo systemctl stop edge-pro.service'
```

### Ver Últimos Logs
```bash
ssh tagment@192.168.10.140 'sudo journalctl -u edge-pro.service -n 50'
```

### Testar Binário Manualmente
```bash
ssh tagment@192.168.10.140 '/opt/edge-pro/edge-pro -config /etc/edge-pro/config.yaml -debug'
```

---

## 🔄 Atualizar Deploy

Para atualizar o binário:

```bash
cd apps/edge-pro
./deploy-to-pi.sh
```

Isso irá:
1. Recompilar o binário
2. Enviar para o Pi
3. Recarregar o serviço

---

## ⚠️ Troubleshooting

### Serviço não inicia

```bash
# Verificar logs de erro
ssh tagment@192.168.10.140 'sudo journalctl -u edge-pro.service -n 100'

# Verificar permissões
ssh tagment@192.168.10.140 'ls -la /opt/edge-pro/'
```

### WebSocket não conecta

1. Verificar conectividade:
   ```bash
   ssh tagment@192.168.10.140 'curl -I https://api.granobox.com.br'
   ```

2. Verificar API Key:
   ```bash
   ssh tagment@192.168.10.140 'sudo cat /etc/edge-pro/config.yaml | grep api_key'
   ```

3. Testar WebSocket manualmente:
   ```bash
   ssh tagment@192.168.10.140 '/opt/edge-pro/edge-pro -config /etc/edge-pro/config.yaml -debug'
   ```

---

## 📊 Status Atual

| Item | Status |
|------|--------|
| Binário instalado | ✅ |
| Config criada | ✅ |
| Serviço configurado | ✅ |
| API Key configurada | ⏳ Pendente |
| Serviço rodando | ⏳ Pendente |
| WebSocket conectado | ⏳ Pendente |

---

**Próxima Ação:** Configurar API Key e iniciar o serviço

