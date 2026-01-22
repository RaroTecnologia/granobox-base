# 🔄 Edge-Go vs Edge-Pro - Diferenças e Similaridades

## 📊 Comparação Completa

| Aspecto | **Edge-Go (ESP32-S3)** | **Edge-Pro (Raspberry Pi)** |
|---------|------------------------|----------------------------|
| **Hardware** | ESP32-S3 (16MB Flash, 8MB RAM) | Raspberry Pi 3/4/5 (1GB+ RAM) |
| **Linguagem** | C (ESP-IDF) | Go |
| **Sistema Operacional** | FreeRTOS | Linux (Raspberry Pi OS) |
| **Custo** | ~R$ 50-80 | ~R$ 200-400 |
| **Consumo** | ~500mA (baixo) | ~1-2A (alto) |
| **Complexidade** | Média (firmware) | Baixa (aplicação) |

---

## 🔧 Processo de Adoção

### Edge-Go (BLE)
```
1. Boot não configurado → Ativa BLE
2. App Flutter → Escaneia BLE
3. App → Conecta "Edge-Go-XXXXXX"
4. App → Envia JSON via BLE characteristic
5. ESP32 → Salva em NVS
6. ESP32 → Desliga BLE
7. ESP32 → Conecta WiFi + Backend TCP
8. ✅ Pronto!
```

### Edge-Pro (WiFi AP)
```
1. Boot não configurado → Cria Hotspot WiFi
2. App Flutter → Escaneia QR Code OU busca WiFi
3. App → Conecta "Edge-Pro-XXXXXX" (senha: granobox123)
4. App → POST http://192.168.4.1/configure
5. Raspberry Pi → Salva em /etc/edge-pro/
6. Raspberry Pi → Desliga Hotspot
7. Raspberry Pi → Conecta WiFi + Backend WebSocket
8. ✅ Pronto!
```

---

## 📡 Comunicação com Backend

### Edge-Go (TCP Direto)
```
Protocolo: TCP Raw (porta 9100)
Uso: Impressão direta de ZPL
Fluxo:
  Flutter → TCP Socket → Edge-Go → USB Printer
```

### Edge-Pro (WebSocket)
```
Protocolo: WebSocket (Socket.IO)
Namespace: /agents
Uso: Receber jobs, comandos, enviar status
Fluxo:
  Backend → WebSocket → Edge-Pro → USB/TCP Printer
```

---

## 🎯 Casos de Uso

### Edge-Go (ESP32)
✅ **Melhor para:**
- Impressão dedicada 1:1
- Ambientes com WiFi estável
- Baixo consumo de energia
- Custo reduzido
- Instalação simples

❌ **Limitações:**
- Sem processamento de jobs complexos
- Sem fila de impressão gerenciada
- TCP direto apenas

### Edge-Pro (Raspberry Pi)
✅ **Melhor para:**
- Sistema completo de impressão
- Fila de jobs gerenciada
- Múltiplas impressoras (USB + TCP)
- Processamento local
- Comandos remotos
- Métricas do sistema

❌ **Limitações:**
- Maior consumo de energia
- Custo mais alto
- Requer mais manutenção

---

## 📱 Integração Flutter

### Campos Comuns (Ambos)
```json
{
  "wifi_ssid": "...",       // ✅ Ambos
  "wifi_password": "...",   // ✅ Ambos
  "api_key": "...",         // ✅ Ambos (agora)
  "backend_url": "..."      // ✅ Ambos (opcional)
}
```

### Campos Específicos Edge-Go
```json
{
  "use_static_ip": false,   // ⭐ Edge-Go
  "static_ip": "...",        // ⭐ Edge-Go (se use_static_ip=true)
  "gateway": "...",          // ⭐ Edge-Go
  "netmask": "..."           // ⭐ Edge-Go
}
```

### Campos Específicos Edge-Pro
```json
{
  "fingerprint": "edge-pro-xxxxx"  // ⭐ Edge-Pro
}
```

---

## 🔑 Autenticação

### Edge-Go
```
API Key formato: edg_MACADDR_timestamp
Exemplo: edg_A1B2C3_1730123456789abc
Gerado pelo backend usando MAC address do ESP32
```

### Edge-Pro
```
API Key formato: grx_...
Fingerprint: edge-pro-XXXXXX (gerado automaticamente)
API Key pode ser fornecida via POST ou obtida depois
```

---

## 🖨️ Impressão

### Edge-Go
```
Tipo: TCP direto (porta 9100)
ZPL: Pronto do Flutter
Processamento: Nenhum (passa direto)
Resposta: JSON simples { status, message, bytes }
```

### Edge-Pro
```
Tipo: WebSocket (jobs)
ZPL: Do backend via job
Processamento: Fila com workers
Resposta: Status via WebSocket (success/error)
Suporte: USB + TCP
```

---

## 🔄 Fluxo de Impressão Comparado

### Edge-Go
```
Flutter → TCP :9100 → Edge-Go → USB Printer
         (direto)
```

### Edge-Pro
```
Flutter → Backend → WebSocket → Edge-Pro → Printer
         (API)     (job)        (fila)
```

---

## 📊 Performance

### Edge-Go
- **Latência**: ~50-100ms (TCP direto)
- **Throughput**: Até 64KB por requisição
- **Concorrência**: 1 impressão por vez
- **Memória**: ~100KB RAM disponível

### Edge-Pro
- **Latência**: ~100-200ms (WebSocket + fila)
- **Throughput**: Ilimitado (depende do Pi)
- **Concorrência**: Múltiplas impressões (fila)
- **Memória**: ~1GB+ RAM disponível

---

## 🎨 UX no App Flutter

### Escolha do Dispositivo
```dart
// Tela de seleção
enum DeviceType {
  edgeGo,    // ESP32 via BLE
  edgePro,   // Raspberry Pi via WiFi
}

// Edge-Go
if (deviceType == DeviceType.edgeGo) {
  await scanBLE();
  await connectBLE("Edge-Go-XXXXXX");
  await sendConfigViaBLE(config);
}

// Edge-Pro
if (deviceType == DeviceType.edgePro) {
  final qrData = await scanQRCode();
  await connectWiFi(qrData.ssid, qrData.password);
  await sendConfigViaHTTP("192.168.4.1", config);
}
```

---

## 🔮 Roadmap

### Edge-Go
- [x] TCP direto funcional
- [x] BLE provisioning
- [ ] mDNS para descoberta
- [ ] OTA updates
- [ ] LED status

### Edge-Pro
- [x] WebSocket funcional
- [x] WiFi AP provisioning
- [x] QR Code
- [ ] Impressoras USB
- [ ] Display RGB
- [ ] OTA updates
- [ ] Dashboard web local

---

## 💡 Recomendação de Uso

### Use Edge-Go (ESP32) quando:
- Precisa de **impressão direta** e simples
- Custo é fator importante
- Baixo consumo de energia necessário
- Instalação plug-and-play
- 1 impressora dedicada

### Use Edge-Pro (Raspberry Pi) quando:
- Precisa de **sistema robusto** de impressão
- Múltiplas impressoras
- Processamento local importante
- Comandos remotos necessários
- Fila de jobs gerenciada
- Expansão futura (câmeras, sensores, etc)

---

## 🎯 Conclusão

Ambos são **complementares**, não concorrentes:
- **Edge-Go**: Solução rápida, barata e eficiente para impressão direta
- **Edge-Pro**: Solução completa e robusta para sistemas profissionais

A escolha depende do caso de uso específico! 🚀

