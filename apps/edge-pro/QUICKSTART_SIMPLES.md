# 🚀 Edge-Pro - Guia Rápido (Sem Display)

## 📋 Pré-requisitos

- Raspberry Pi 3/4/5
- Cartão SD com Raspberry Pi OS
- Go 1.21+ instalado

---

## ⚡ Quick Start

### 1️⃣ Build

```bash
# Compilar para Raspberry Pi
./build-all.sh v1.0.0

# Ou usar Makefile
make build-pi
```

### 2️⃣ Deploy

```bash
# Deploy completo para Raspberry Pi
./deploy-to-device.sh granobox@192.168.1.100 arm64

# Ou manual
scp bin/edge-pro-linux-arm64 granobox@192.168.1.100:~/edge-pro
ssh granobox@192.168.1.100 'sudo mv edge-pro /usr/local/bin/ && sudo systemctl restart edge-pro'
```

### 3️⃣ Primeiro Boot (Modo Provisioning)

Ao ligar pela primeira vez:

```
🔥 ═══ MODO PROVISIONING ═══
✅ Hotspot iniciado
   SSID: Edge-Pro-XXXXXX
   Senha: granobox123
   IP: 192.168.4.1

📱 QR Code gerado (ASCII no terminal):
[QR Code ASCII Art aqui]

═══════════════════════════════════════════
📱 CONFIGURE VIA APP GRANOBOX:
   1. Abra o app Granobox
   2. Vá em 'Adicionar Dispositivo'
   3. Escaneie o QR code acima
   4. Configure o WiFi da sua casa
   5. Aguarde o dispositivo conectar
═══════════════════════════════════════════
```

### 4️⃣ Configurar via HTTP

**Opção A: Via App Flutter** (recomendado)
- Escaneia QR Code
- Conecta automaticamente no hotspot
- Envia configuração

**Opção B: Manualmente**

```bash
# 1. Conectar no WiFi "Edge-Pro-XXXXXX" (senha: granobox123)

# 2. Enviar configuração
curl -X POST http://192.168.4.1/configure \
  -H "Content-Type: application/json" \
  -d '{
    "wifi_ssid": "WiFi_Casa",
    "wifi_password": "senha123",
    "fingerprint": "edge-pro-xxxxx",
    "api_key": "grx_sua_api_key_aqui",
    "backend_url": "https://api.granobox.com.br"
  }'

# Resposta:
# {
#   "success": true,
#   "message": "Configuração salva com sucesso! Reiniciando..."
# }
```

### 5️⃣ Após Configuração

O device vai:
1. ❌ Parar hotspot
2. ❌ Desligar servidor HTTP
3. ✅ Conectar no WiFi configurado
4. ✅ Conectar no backend via WebSocket
5. ✅ Registrar como agent
6. ✅ Ficar online aguardando jobs

---

## 📡 Estrutura de Configuração

### JSON Mínimo (Obrigatório)
```json
{
  "wifi_ssid": "WiFi_Casa",
  "wifi_password": "senha123",
  "fingerprint": "edge-pro-xxxxx"
}
```

### JSON Completo (Recomendado)
```json
{
  "wifi_ssid": "WiFi_Casa",
  "wifi_password": "senha123",
  "fingerprint": "edge-pro-xxxxx",
  "api_key": "grx_...",                    // ⭐ API Key do backend
  "backend_url": "https://api.granobox.com.br"
}
```

**Notas:**
- `api_key`: Se não fornecida, o device precisa obtê-la depois
- `backend_url`: Se não fornecida, usa `https://api.granobox.com.br` por padrão

---

## 🔍 Verificar Status

### Logs em Tempo Real
```bash
# Via SSH
ssh granobox@192.168.1.100
sudo journalctl -u edge-pro -f
```

### Status via HTTP (quando em provisioning)
```bash
curl http://192.168.4.1/status

# Resposta:
{
  "configured": false,
  "timestamp": "2025-11-06T10:00:00Z"
}
```

### Health Check
```bash
curl http://192.168.4.1/health

# Resposta:
{
  "status": "ok",
  "timestamp": "2025-11-06T10:00:00Z",
  "configured": false
}
```

---

## 🔄 Resetar Configuração

### Via HTTP (quando em provisioning)
```bash
curl -X POST http://192.168.4.1/reset

# Resposta:
{
  "success": true,
  "message": "Configuração resetada. Reinicie o dispositivo."
}
```

### Via SSH
```bash
ssh granobox@192.168.1.100
sudo systemctl stop edge-pro
sudo rm /etc/edge-pro/config.json
sudo rm /etc/edge-pro/configured
sudo systemctl start edge-pro
```

### Via Flag
```bash
# No Raspberry Pi
/usr/local/bin/edge-pro --reset
```

---

## 🐛 Troubleshooting

### Hotspot não inicia
```bash
# Verificar serviço
sudo systemctl status edge-pro

# Verificar logs
sudo journalctl -u edge-pro -n 50

# Verificar wlan0
ip link show wlan0

# Instalar dependências
sudo apt install hostapd dnsmasq
```

### Não consigo conectar no hotspot
- Aguardar 30 segundos após boot
- Verificar senha: `granobox123`
- Procurar rede: `Edge-Pro-XXXXXX`
- Reiniciar WiFi do celular

### Device não conecta no WiFi após configuração
```bash
# Ver logs
sudo journalctl -u edge-pro -n 100

# Verificar configuração salva
sudo cat /etc/edge-pro/config.json

# Testar conexão WiFi manualmente
sudo nmcli dev wifi connect "WiFi_Casa" password "senha123"
```

### WebSocket não conecta
```bash
# Verificar se API está respondendo
curl -v https://api.granobox.com.br/health

# Verificar logs do edge-pro
sudo journalctl -u edge-pro | grep -i websocket

# Verificar se firewall está bloqueando
sudo iptables -L
```

---

## 📁 Arquivos Importantes

```
/usr/local/bin/edge-pro           # Binário
/etc/edge-pro/config.json         # Configuração persistente
/etc/edge-pro/configured          # Flag de configuração
/etc/systemd/system/edge-pro.service  # Serviço systemd
```

---

## 🎯 Próximos Passos

Após configuração bem-sucedida:

1. ✅ Device aparece online no backend
2. ✅ Envia heartbeats a cada 30s
3. ✅ Aguarda jobs de impressão
4. ⏳ Implementar integração com impressoras USB
5. ⏳ Adicionar display RGB (futuro)

---

## 🔗 Links Úteis

- Backend API: `https://api.granobox.com.br`
- WebSocket: `wss://api.granobox.com.br/socket.io/?EIO=4&transport=websocket`
- Namespace: `/agents`

---

**✅ Pronto para usar! Sem display, sem complicações.** 🚀

