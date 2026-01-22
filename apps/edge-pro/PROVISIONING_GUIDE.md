# 📱 Edge-Pro - Guia de Provisionamento

## 🎯 Sistema de Adoção via Hotspot WiFi + QR Code

### Visão Geral

O Edge-Pro utiliza um sistema inteligente de provisionamento que permite configurar o dispositivo via aplicativo Flutter sem necessidade de navegador web ou BLE.

---

## 🔄 Fluxo de Provisionamento

```
┌─────────────────────────────────────────┐
│  1. PRIMEIRO BOOT (Não Configurado)    │
│  → Verifica: /etc/edge-pro/configured  │
│  → Não existe? → Modo Provisioning     │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  2. MODO PROVISIONING                   │
│  → Cria hotspot: Edge-Pro-XXXXX         │
│  → Senha: granobox123                   │
│  → IP: 192.168.4.1                      │
│  → HTTP Server: :80                     │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  3. DISPLAY (se disponível)             │
│  → Gera QR code                         │
│  → Mostra no display RGB                │
│  → Dados: {ssid, password, fingerprint} │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  4. USUÁRIO (App Flutter)               │
│  → Opção A: Escaneia QR code           │
│  → Opção B: Busca rede "Edge-Pro-*"    │
│  → Conecta automaticamente              │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  5. CONFIGURAÇÃO                        │
│  → POST http://192.168.4.1/configure    │
│  → Body: {wifi_ssid, wifi_password,    │
│            fingerprint}                 │
│  → Device salva config                  │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  6. REINICIALIZAÇÃO                     │
│  → Para hotspot                         │
│  → Conecta no WiFi real                 │
│  → Conecta no backend                   │
│  → Registra no Granobox                 │
│  → PRONTO! ✅                           │
└─────────────────────────────────────────┘
```

---

## 📡 API HTTP de Configuração

### Endpoints Disponíveis

#### 1. **GET /** - Página Inicial
```http
GET http://192.168.4.1/
```
**Resposta:** HTML com instruções

#### 2. **GET /health** - Health Check
```http
GET http://192.168.4.1/health
```
**Resposta:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-02T00:00:00Z",
  "configured": false
}
```

#### 3. **POST /configure** - Configurar Device
```http
POST http://192.168.4.1/configure
Content-Type: application/json

{
  "wifi_ssid": "WiFi Casa",
  "wifi_password": "senha123",
  "fingerprint": "edge-pro-xxxxx"
}
```
**Resposta:**
```json
{
  "success": true,
  "message": "Configuração salva com sucesso! Reiniciando..."
}
```

#### 4. **GET /status** - Ver Status
```http
GET http://192.168.4.1/status
```
**Resposta:**
```json
{
  "configured": true,
  "wifi_ssid": "WiFi Casa",
  "fingerprint": "edge-pro-xxxxx",
  "backend_url": "https://api.granobox.com.br",
  "configured_at": "2025-11-02T00:00:00Z",
  "timestamp": "2025-11-02T00:05:00Z"
}
```

#### 5. **POST /reset** - Resetar Configuração
```http
POST http://192.168.4.1/reset
```
**Resposta:**
```json
{
  "success": true,
  "message": "Configuração resetada. Reinicie o dispositivo."
}
```

---

## 🔐 QR Code Format

O QR code contém um JSON com:

```json
{
  "ssid": "Edge-Pro-12345",
  "password": "granobox123",
  "fingerprint": "edge-pro-xxxxx",
  "ip": "192.168.4.1",
  "port": "80"
}
```

---

## 💾 Arquivos de Configuração

### Localização
- **Produção:** `/etc/edge-pro/`
- **Desenvolvimento:** `~/.edge-pro/`

### Arquivos

#### `/etc/edge-pro/config.json`
```json
{
  "wifi_ssid": "WiFi Casa",
  "wifi_password": "senha123",
  "fingerprint": "edge-pro-xxxxx",
  "api_key": "grx_...",
  "backend_url": "https://api.granobox.com.br",
  "configured": true,
  "configured_at": "2025-11-02T00:00:00Z"
}
```

#### `/etc/edge-pro/configured`
Flag simples que indica que o device foi configurado.

---

## 🚀 Modo Desenvolvimento

Para testar em desenvolvimento (Mac/Linux):

```bash
# Ativar modo dev
export EDGE_PRO_DEV=true

# Rodar
go run cmd/edge-pro/main.go

# Hotspot será simulado
# Config salva em ~/.edge-pro/
```

---

## 🔧 Componentes

### 1. ProvisioningManager
Gerencia estado de configuração:
- `IsConfigured()` - Verifica se foi configurado
- `LoadConfig()` - Carrega configuração
- `SaveConfig()` - Salva configuração
- `ResetConfig()` - Reseta para modo provisioning

### 2. HotspotManager
Gerencia hotspot WiFi:
- `Start()` - Inicia hotspot
- `Stop()` - Para hotspot
- `GetSSID()` - Retorna SSID
- `GetPassword()` - Retorna senha

### 3. QRCodeGenerator
Gera QR codes:
- `GenerateProvisioning()` - Gera QR com dados de config
- `GetASCIIArt()` - QR em ASCII para terminal
- `SaveToFile()` - Salva QR em arquivo

### 4. HTTPServer
Servidor de configuração:
- Roda em `:80` no hotspot
- Recebe configuração do app
- CORS habilitado
- Callback quando configurado

---

## 📱 Integração Flutter

### 1. Escanear QR Code

```dart
import 'package:mobile_scanner/mobile_scanner.dart';

final controller = MobileScannerController();
final qrData = await controller.scan();
final config = jsonDecode(qrData);

// config = {
//   "ssid": "Edge-Pro-12345",
//   "password": "granobox123",
//   "fingerprint": "edge-pro-xxxxx",
//   "ip": "192.168.4.1"
// }
```

### 2. Conectar no Hotspot

```dart
import 'package:wifi_iot/wifi_iot.dart';

// Conectar
await WiFiForIoTPlugin.connect(
  config['ssid'],
  password: config['password'],
  security: NetworkSecurity.WPA,
);

// Aguardar conexão
await Future.delayed(Duration(seconds: 3));
```

### 3. Enviar Configuração

```dart
import 'package:http/http.dart' as http;

final response = await http.post(
  Uri.parse('http://192.168.4.1/configure'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'wifi_ssid': homeWiFiSSID,
    'wifi_password': homeWiFiPassword,
    'fingerprint': config['fingerprint'],
  }),
);

if (response.statusCode == 200) {
  final result = jsonDecode(response.body);
  if (result['success']) {
    // Sucesso! Device vai reiniciar
    print('✅ Device configurado!');
  }
}
```

### 4. Reconectar ao WiFi Normal

```dart
// Desconectar do hotspot
await WiFiForIoTPlugin.disconnect();

// Reconectar ao WiFi normal
await WiFiForIoTPlugin.connect(
  homeWiFiSSID,
  password: homeWiFiPassword,
);
```

### 5. Aguardar Device Aparecer Online

```dart
// Aguardar 30 segundos
await Future.delayed(Duration(seconds: 30));

// Verificar se device está online
final devices = await api.getEdgeDevices();
final device = devices.firstWhere(
  (d) => d.fingerprint == config['fingerprint'],
  orElse: () => null,
);

if (device != null && device.isConnected) {
  print('✅ Device online!');
} else {
  print('⏳ Aguardando conexão...');
}
```

---

## 🧪 Testes

### Teste Local (Simulado)

```bash
# Terminal 1 - Rodar Edge-Pro
export EDGE_PRO_DEV=true
go run cmd/edge-pro/main.go

# Terminal 2 - Testar API
curl http://localhost/health
curl -X POST http://localhost/configure \
  -H "Content-Type: application/json" \
  -d '{
    "wifi_ssid": "Test WiFi",
    "wifi_password": "test123",
    "fingerprint": "edge-pro-test"
  }'

curl http://localhost/status
```

### Teste no Raspberry Pi

```bash
# 1. Deploy
make deploy-pi PI_IP=192.168.1.100

# 2. SSH no Pi
ssh pi@192.168.1.100

# 3. Verificar modo provisioning
journalctl -u edge-pro -f

# 4. Ver redes WiFi disponíveis
sudo iwlist wlan0 scan | grep "Edge-Pro"

# 5. Conectar do celular
# Procurar rede "Edge-Pro-XXXXX"
# Senha: granobox123
# Acessar: http://192.168.4.1
```

---

## 🔧 Troubleshooting

### Hotspot não inicia

**Problema:** `failed to start hotspot`

**Soluções:**
```bash
# Verificar se wlan0 existe
ip link show wlan0

# Verificar se hostapd está instalado
which hostapd
sudo apt install hostapd dnsmasq

# Verificar se NetworkManager está interferindo
sudo systemctl stop NetworkManager
```

### Não consigo conectar no hotspot

**Problema:** Rede aparece mas não conecta

**Soluções:**
- Verificar senha: `granobox123`
- Aguardar 30s após ligar o Pi
- Reiniciar WiFi do celular
- Tentar esquec

er a rede e reconectar

### Configuração não salva

**Problema:** `POST /configure` retorna erro

**Soluções:**
```bash
# Verificar permissões
ls -la /etc/edge-pro/
sudo chown -R edge-pro:edge-pro /etc/edge-pro/

# Verificar logs
journalctl -u edge-pro -n 50
```

---

## 📝 Checklist de Implementação

- [x] Módulo `provisioning` criado
- [x] Módulo `hotspot` criado
- [x] Módulo `qrcode` criado
- [x] HTTP Server implementado
- [x] Integração com display (próximo)
- [x] Documentação completa
- [ ] Atualizar main.go
- [ ] Testar em Raspberry Pi
- [ ] Implementar tela Flutter

---

**Próximo: Integrar tudo no main.go e testar! 🚀**


