# 🚀 Como Usar Edge-Pro no App Flutter

## O que é o Edge-Pro?

O **Edge-Pro** é um dispositivo IoT baseado em **Raspberry Pi** que permite gerenciamento avançado de impressão via WebSocket. Diferente do Edge-Go (ESP32), o Edge-Pro:

- ✅ Roda em Raspberry Pi (3/4/5)
- ✅ Comunicação via WebSocket (Socket.IO)
- ✅ Recebe jobs de impressão do backend
- ✅ Suporta múltiplas impressoras (USB + TCP)
- ✅ Fila de impressão gerenciada
- ✅ Configuração via WiFi AP + QR Code

---

## 📋 Fluxo de Configuração

### 1. **Preparar o Edge-Pro**

- Conecte o Raspberry Pi à fonte de energia
- Conecte via Ethernet OU aguarde modo provisioning
- O dispositivo entrará em **modo provisioning** automaticamente se não configurado
- Um **QR Code** aparecerá no terminal/logs do Pi

**Nome WiFi Hotspot:** `EdgeProXXXXXXXX` (8 dígitos do serial do Pi)  
**Senha:** `granobox123`  
**IP Local:** `192.168.4.1`

---

### 2. **No App Flutter - Aba Ajustes**

1. Clique em **"Gerenciar Edge-Pro (Raspberry Pi)"** (botão roxo)
2. Vá para aba **"Adotar Novo Edge-Pro"**
3. Clique em **"Escanear QR Code do Edge-Pro"**
4. Aponte a câmera para o QR Code no terminal do Pi
5. Preencha os dados do WiFi da sua casa

---

### 3. **Adotar o Edge-Pro**

**Passo a Passo Detalhado:**

1. **Escanear QR Code** 📱
   - QR Code contém: `{ssid, password, fingerprint, ip}`
   - Exemplo: `{"ssid":"EdgePro75cba45f","password":"granobox123","fingerprint":"edge-pro-75cba45f","ip":"192.168.4.1"}`

2. **Conectar no WiFi do Edge-Pro** 📶
   - **IMPORTANTE:** Conecte-se manualmente ao WiFi antes de clicar em "Adotar"
   - SSID: Mostrado no QR Code (ex: `EdgePro75cba45f`)
   - Senha: `granobox123`

3. **Configurar WiFi da Casa** 🏠
   - Preencha o SSID do seu WiFi
   - Preencha a senha do seu WiFi

4. **Clicar em "Adotar"** ✅

---

### 4. **O que acontece nos bastidores:**

1. ✅ App gera **API Key** no backend Granobox (formato: `grx_...`)
2. ✅ App registra device no backend
3. ✅ App envia configuração via **HTTP POST** para `http://192.168.4.1/configure`:
   ```json
   {
     "wifi_ssid": "WiFi_Casa",
     "wifi_password": "senha123",
     "fingerprint": "edge-pro-75cba45f",
     "api_key": "grx_abc123...",
     "backend_url": "https://api.granobox.com.br"
   }
   ```
4. ✅ Edge-Pro salva configuração e **reinicia**
5. ✅ Edge-Pro **desliga hotspot WiFi**
6. ✅ Edge-Pro conecta ao **WiFi da casa**
7. ✅ Edge-Pro conecta ao backend via **WebSocket**
8. ✅ Edge-Pro registra como **agent** no namespace `/agents`
9. ✅ Edge-Pro envia **heartbeat** a cada 30 segundos
10. ✅ Dispositivo aparece em **"Meus Edge-Pro"** com status **Online** ✅

---

## 📊 Monitoramento

### Aba "Meus Edge-Pro"

Mostra todos os Edge-Pro adotados com:
- **Status Online/Offline** (baseado em heartbeat WebSocket)
- **Fingerprint** (baseado no serial do Pi)
- **Último sinal** (timestamp do último heartbeat)
- **Botão Excluir** (remove do backend)

---

## 🖨️ Impressão de Etiquetas

### Via WebSocket (Backend → Edge-Pro)

```
1. Flutter envia job para backend
2. Backend envia job via WebSocket para Edge-Pro
3. Edge-Pro adiciona job na fila
4. Workers processam fila (2 workers simultâneos)
5. Edge-Pro envia ZPL para impressora USB
6. Edge-Pro reporta status via WebSocket
7. Backend atualiza status do job
```

### Arquitetura

```
┌─────────────┐   HTTPS      ┌──────────────┐   WebSocket   ┌──────────────┐
│   Flutter   │ ───────────→ │   Backend    │ ←───────────→ │   Edge-Pro   │
│     App     │   (API)       │   Granobox   │  (Socket.IO)  │ (Raspberry)  │
└─────────────┘               └──────────────┘               └───────┬──────┘
                                                                     │ USB
                                                                     ↓
                                                               ┌──────────────┐
                                                               │  Impressora  │
                                                               │   Zebra/USB  │
                                                               └──────────────┘
```

---

## 🔧 Configurações do QR Code

### Formato do QR Code (JSON)

```json
{
  "ssid": "EdgeProXXXXXXXX",      // WiFi do Edge-Pro
  "password": "granobox123",        // Senha padrão
  "fingerprint": "edge-pro-XXXXXXXX", // Serial do Pi
  "ip": "192.168.4.1",              // IP local do hotspot
  "port": "80"                       // Porta HTTP
}
```

---

## 🔄 Comparação: Edge-Go vs Edge-Pro

| Aspecto | **Edge-Go (ESP32)** | **Edge-Pro (Raspberry Pi)** |
|---------|---------------------|----------------------------|
| **Hardware** | ESP32-S3 | Raspberry Pi 3/4/5 |
| **Adoção** | BLE | WiFi AP + QR Code |
| **Comunicação** | TCP (porta 9100) | WebSocket (Socket.IO) |
| **Processamento** | Local (ZPL direto) | Backend (jobs) |
| **Fila** | Não | Sim (2 workers) |
| **Múltiplas impressoras** | Não (1 USB) | Sim (USB + TCP) |
| **Comandos remotos** | Não | Sim (futuro) |
| **Custo** | ~R$ 80 | ~R$ 300 |
| **Complexidade** | Baixa | Média |

---

## 🐛 Troubleshooting

### Edge-Pro não aparece WiFi hotspot

**Soluções:**
- ✅ Aguardar 30 segundos após boot
- ✅ Verificar logs: `ssh tagment@<ip> 'sudo journalctl -u edge-pro -f'`
- ✅ Resetar device: `ssh tagment@<ip> 'sudo rm /etc/edge-pro/configured && sudo systemctl restart edge-pro'`

### QR Code não aparece

**Soluções:**
- ✅ Ver logs do Pi via SSH
- ✅ Verificar se está em modo provisioning
- ✅ QR Code aparece em ASCII art no terminal

### Não consigo conectar no WiFi do Edge-Pro

**Soluções:**
- ✅ SSID correto: `EdgeProXXXXXXXX` (8 dígitos sem ":")
- ✅ Senha: `granobox123`
- ✅ Aguardar hotspot iniciar (30s)
- ✅ Verificar se Pi tem WiFi habilitado

### Edge-Pro offline após configuração

**Soluções:**
- ✅ Verificar se WiFi da casa está correto
- ✅ Aguardar até 1 minuto para conectar
- ✅ Ver logs: `sudo journalctl -u edge-pro -f`
- ✅ Verificar se backend está acessível

### Configuração via HTTP falha

**Soluções:**
- ✅ Conecte-se manualmente ao WiFi do Edge-Pro primeiro
- ✅ Teste: `curl http://192.168.4.1/health`
- ✅ Verifique se está na rede `192.168.4.x`

---

## 📡 Endpoints HTTP (Modo Provisioning)

Quando Edge-Pro está em modo provisioning:

### GET /health
```bash
curl http://192.168.4.1/health

# Resposta:
{
  "status": "ok",
  "configured": false,
  "timestamp": "2025-11-06T14:00:00-03:00"
}
```

### POST /configure
```bash
curl -X POST http://192.168.4.1/configure \
  -H "Content-Type: application/json" \
  -d '{
    "wifi_ssid": "WiFi_Casa",
    "wifi_password": "senha123",
    "fingerprint": "edge-pro-75cba45f",
    "api_key": "grx_...",
    "backend_url": "https://api.granobox.com.br"
  }'

# Resposta:
{
  "success": true,
  "message": "Configuração salva com sucesso! Reiniciando..."
}
```

### GET /status
```bash
curl http://192.168.4.1/status

# Resposta:
{
  "configured": true,
  "wifi_ssid": "WiFi_Casa",
  "fingerprint": "edge-pro-75cba45f",
  "backend_url": "https://api.granobox.com.br",
  "configured_at": "2025-11-06T14:00:00-03:00"
}
```

---

## 🔐 Segurança

- **API Key**: Cada Edge-Pro tem uma API Key única (formato: `grx_...`)
- **WebSocket Auth**: Usa API Key para autenticar na conexão
- **Fingerprint**: Baseado no Serial Number do Raspberry Pi
- **Heartbeat**: Backend monitora dispositivos ativos via WebSocket

---

## 📝 Notas Importantes

1. **WiFi AP é apenas para configuração inicial** - Após adotado, usa WiFi da casa
2. **Conexão manual necessária** - Por enquanto, usuário precisa conectar manualmente ao WiFi do Edge-Pro
3. **QR Code facilita muito** - Escanear QR Code é mais rápido que digitar SSID/senha
4. **Serial Number como ID** - Mais confiável que MAC address
5. **Rodando como root** - Necessário para operações de rede

---

## 🎯 Próximos Passos (Futuro)

- [ ] Conectar WiFi automaticamente (sem manual)
- [ ] Descoberta de Edge-Pro via mDNS
- [ ] Suporte a IP estático
- [ ] Dashboard local do Edge-Pro
- [ ] OTA updates via app

---

## 🔗 Arquivos Criados

- `lib/screens/edge_pro_config_screen.dart` - Tela de adoção via QR Code
- `lib/screens/config_screen.dart` - Atualizado com botões Edge-Go e Edge-Pro

---

**Pronto para usar! 🚀**

