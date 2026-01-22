# 🖨️ Modelo de Registro de Impressoras - Tagment Edge v2

## 📋 **Visão Geral**

O Tagment Edge v2 implementa **dois modelos distintos** de registro de impressoras, otimizados para diferentes casos de uso:

### 1️⃣ **Registro PERMANENTE** (Impressoras TCP)
- Gerenciadas pelo **App Flutter (Granobox)**
- Endereçadas por **hostname** (ex: `printer-balcao.local`)
- Cadastro **persistente** na API Tagment
- Sempre disponíveis na rede local

### 2️⃣ **Registro EFÊMERO** (Impressoras USB)
- Gerenciadas pelo **Edge Agent (Raspberry Pi)**
- Detecção **automática** (plug & play)
- Enviadas apenas no **heartbeat** (não cadastradas permanentemente)
- Desaparecem automaticamente quando desconectadas

---

## 🔄 **Fluxo de Registro Efêmero (USB)**

```
┌─────────────────────────────────────────────────────────────────┐
│                    EDGE AGENT (Raspberry Pi)                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Boot / Heartbeat (a cada 30s)                               │
│     ↓                                                            │
│  2. DetectUSBPrintersWithInfo()                                 │
│     - Scan /dev/usb/lp*                                         │
│     - Usar udevadm/lsusb para obter vendor/model                │
│     - Gerar ID único: auto-usb-lp0, auto-usb-lp1, etc          │
│     ↓                                                            │
│  3. CreateAutoUSBPrinters()                                     │
│     - Criar PrinterInfo efêmero                                 │
│     - Nome: "Zebra GC420d" (do vendor + model)                 │
│     - Connection: "usb"                                          │
│     - DevicePath: "/dev/usb/lp0"                                │
│     - Status: "online"                                           │
│     ↓                                                            │
│  4. Enviar no Heartbeat                                         │
│     {                                                            │
│       "fingerprint": "agent-xyz",                               │
│       "printers": [                                              │
│         {                                                        │
│           "id": "auto-usb-lp0",                                 │
│           "name": "Zebra GC420d",                               │
│           "connection": "usb",                                   │
│           "devicePath": "/dev/usb/lp0",                         │
│           "status": "online"                                     │
│         }                                                        │
│       ]                                                          │
│     }                                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TAGMENT API                                │
├─────────────────────────────────────────────────────────────────┤
│  1. Recebe heartbeat com impressoras USB                        │
│  2. Atualiza lista de impressoras disponíveis (em memória)      │
│  3. Se impressora sumir do heartbeat → marca como offline       │
│  4. Jobs de impressão são roteados para o agent correto         │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ **Vantagens do Modelo Efêmero**

| Característica | Modelo Permanente (TCP) | Modelo Efêmero (USB) |
|---|---|---|
| **Cadastro** | Manual na API | Automático |
| **Plug & Play** | ❌ Precisa configurar IP | ✅ Conecta e funciona |
| **Desconexão** | ⚠️ Fica "morta" na API | ✅ Some automaticamente |
| **Manutenção** | ⚠️ Precisa deletar manualmente | ✅ Zero manutenção |
| **Mobilidade** | ❌ Fixa no IP | ✅ Pode trocar de Pi |
| **Identificação** | hostname estável | device path + vendor/model |

---

## 📦 **Estrutura de Dados**

### **agent-register** (Registro Inicial)
```json
{
  "fingerprint": "agent-rpi-001",
  "name": "Edge Agent - Loja Principal",
  "hostname": "rpi-balcao",
  "version": "2.0.0",
  "ip": "192.168.1.100",
  "mac": "b8:27:eb:xx:xx:xx",
  "printers": [],  // ⚠️ VAZIO para impressoras USB!
  "capabilities": [
    "print",
    "remote-command",
    "usb-auto-detect"  // Indica suporte a USB efêmero
  ]
}
```

### **heartbeat** (A cada 30s)
```json
{
  "fingerprint": "agent-rpi-001",
  "uptimeSeconds": 3600,
  "cpuUsage": 45.2,
  "memoryUsage": 67.8,
  "temperature": 52.3,
  "ip": "192.168.1.100",
  "mac": "b8:27:eb:xx:xx:xx",
  "printers": [  // ⭐ IMPRESSORAS USB EFÊMERAS ⭐
    {
      "id": "auto-usb-lp0",
      "name": "Zebra GC420d",
      "connection": "usb",
      "devicePath": "/dev/usb/lp0",
      "status": "online",
      "type": "zebra",
      "model": "GC420d"
    },
    {
      "id": "auto-usb-lp1",
      "name": "TSC TTP-244 Pro",
      "connection": "usb",
      "devicePath": "/dev/usb/lp1",
      "status": "online",
      "type": "tsc",
      "model": "TTP-244 Pro"
    }
  ],
  "queueStats": {
    "total": 156,
    "pending": 2,
    "processing": 1,
    "completed": 150,
    "failed": 3
  }
}
```

---

## 🎯 **Casos de Uso**

### **Caso 1: Nova Impressora Conectada**
1. Usuário conecta impressora USB no Raspberry Pi
2. Após **no máximo 30s** (próximo heartbeat):
   - Edge detecta `/dev/usb/lp0`
   - Envia no heartbeat para API
   - API registra impressora como disponível
3. ✅ Impressora **imediatamente disponível** para jobs

### **Caso 2: Impressora Desconectada**
1. Usuário desconecta impressora USB
2. Próximo heartbeat:
   - Edge **não detecta** mais `/dev/usb/lp0`
   - Heartbeat vai **sem** a impressora
3. API marca impressora como **offline**
4. ✅ Sem "lixo" de impressoras mortas na API

### **Caso 3: Múltiplos Agents (Failover)**
1. **Agent A** tem impressora USB conectada
2. **Agent B** tem a **mesma** impressora USB conectada
3. Ambos enviam no heartbeat:
   ```
   Agent A: printers: [{ id: "auto-usb-lp0", name: "Zebra GC420d" }]
   Agent B: printers: [{ id: "auto-usb-lp0", name: "Zebra GC420d" }]
   ```
4. API pode rotear job para **qualquer um** dos dois
5. ✅ **Failover automático** se um agent cair

---

## 🛠️ **Implementação no Código**

### **1. Detecção USB** (`printer.go`)
```go
// DetectUSBPrintersWithInfo detecta impressoras USB com informações detalhadas
func (m *Manager) DetectUSBPrintersWithInfo() ([]USBPrinterInfo, error) {
    // Scan /dev/usb/lp*
    entries, _ := os.ReadDir("/dev/usb")
    
    for _, entry := range entries {
        if strings.HasPrefix(entry.Name(), "lp") {
            devicePath := filepath.Join("/dev/usb", entry.Name())
            
            // Usar udevadm para obter vendor/model
            info := m.getUSBDeviceInfo(devicePath)
            printers = append(printers, info)
        }
    }
    
    return printers, nil
}
```

### **2. Criação Automática** (`printer.go`)
```go
// CreateAutoUSBPrinters cria registros automáticos para impressoras USB
func (m *Manager) CreateAutoUSBPrinters() []models.PrinterInfo {
    usbPrinters, _ := m.DetectUSBPrintersWithInfo()
    
    for _, usbInfo := range usbPrinters {
        id := fmt.Sprintf("auto-usb-lp%s", deviceNum)
        name := fmt.Sprintf("%s %s", usbInfo.Vendor, usbInfo.Model)
        
        printer := models.PrinterInfo{
            ID:         &id,
            Name:       name,
            Connection: "usb",
            DevicePath: &usbInfo.DevicePath,
            Status:     "online",
            Type:       detectPrinterType(usbInfo.Vendor),
        }
        
        printers = append(printers, printer)
    }
    
    return printers
}
```

### **3. Heartbeat** (`socketio/client.go`)
```go
func (c *Client) SendHeartbeat() error {
    // ⭐ DETECTAR IMPRESSORAS USB DINAMICAMENTE ⭐
    usbPrinters := c.printerManager.CreateAutoUSBPrinters()
    
    heartbeat := map[string]interface{}{
        "fingerprint": c.cfg.AgentFingerprint,
        "printers":    usbPrinters,  // Impressoras USB efêmeras
        // ... outras métricas
    }
    
    return c.Emit("heartbeat", heartbeat)
}
```

---

## 🔑 **Diferenças Chave vs Rust**

| Aspecto | Rust (edge-go) | Go (edge-v2) |
|---|---|---|
| **Bridge Node.js** | ✅ Necessário | ❌ Removido (WebSocket nativo) |
| **ESC/POS** | ✅ Suportado | ❌ Removido (só ZPL) |
| **TCP/Hostname** | ✅ Suportado | ❌ Delegado ao Flutter |
| **USB Efêmero** | ⚠️ Parcial | ✅ Completo |
| **Config JSON** | ✅ Rust struct | ✅ Go struct (similar) |

---

## 📊 **Métricas e Monitoramento**

### **Logs do Edge Agent:**
```
[INFO] 🔍 Detectando impressoras USB...
[INFO] 🖨️ Impressora USB detectada: /dev/usb/lp0
[INFO] ✨ Impressora USB auto-registrada: auto-usb-lp0 (Zebra GC420d)
[INFO] 💓 Enviando heartbeat (1 impressora USB)
[INFO] 📄 Job recebido: job-123 -> auto-usb-lp0
[INFO] 🔄 Processando job (tentativa 1/3)
[INFO] 📤 Enviando 1024 bytes para /dev/usb/lp0
[INFO] ✅ Job processado com sucesso (1 cópia)
```

### **API Tagment:**
```
[INFO] 💓 Heartbeat recebido: agent-rpi-001
[INFO] 🖨️ Impressoras USB: 1 online
[INFO] 📄 Roteando job-123 para agent-rpi-001 (auto-usb-lp0)
[INFO] ✅ Job-123 concluído com sucesso
```

---

## 🚀 **Próximos Passos**

- [x] Implementar detecção USB dinâmica
- [x] Implementar registro efêmero no heartbeat
- [x] Remover suporte TCP/hostname (delegado ao Flutter)
- [x] Remover bridge Node.js
- [x] Remover ESC/POS (só ZPL)
- [ ] Testar em Raspberry Pi real com impressora USB
- [ ] Documentar API changes no backend

---

## 📞 **Suporte**

Para dúvidas sobre este modelo:
- 📧 Email: suporte@tagment.com.br
- 📖 Docs: https://docs.tagment.com.br

---

**Made with ❤️ for Tagment Edge v2 (Go)**

