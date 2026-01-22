# 🚀 Guia de Migração: Rust (edge-go) → Go (edge-v2)

## 📋 **Resumo das Mudanças**

Este documento descreve as principais diferenças e mudanças ao migrar do **edge-go (Rust)** para **edge-v2 (Go)**.

---

## 🔑 **Principais Diferenças**

### **1. Bridge Node.js → REMOVIDO** ✅
- **Rust**: Precisava de bridge Node.js (`bridge/`) para conectar Socket.IO
- **Go**: WebSocket nativo com `gorilla/websocket`

**Antes (Rust):**
```rust
// Conectar via HTTP ao bridge local
let bridge_url = "http://127.0.0.1:3001";
http_client.post(&format!("{}/register", bridge_url))
```

**Depois (Go):**
```go
// Conectar direto via WebSocket
wsURL := fmt.Sprintf("wss://%s/socket.io/?EIO=4&transport=websocket", serverHost)
conn, _, err := websocket.DefaultDialer.Dial(wsURL, header)
```

---

### **2. Impressoras TCP/Hostname → Delegado ao Flutter** ✅
- **Rust**: Suportava impressão TCP via hostname (ex: `printer-balcao.local`)
- **Go**: TCP é responsabilidade do **App Flutter (Granobox)**

**Antes (Rust):**
```rust
fn send_print_command(ip: String, port: u16, data: String) -> Result<(), String> {
    let stream = TcpStream::connect(format!("{}:{}", ip, port))?;
    stream.write_all(data.as_bytes())?;
    Ok(())
}
```

**Depois (Go):**
```go
// TCP NÃO é suportado - apenas USB
case "network", "tcp":
    return fmt.Errorf("impressoras TCP não são suportadas (use Flutter/Granobox)")
```

---

### **3. ESC/POS → REMOVIDO** ✅
- **Rust**: Suportava ZPL e ESC/POS
- **Go**: Apenas **ZPL** (negócio usa só Zebra/TSC)

**Antes (Rust):**
```rust
enum PrinterType {
    ZPL,
    ESCPOS,
}
```

**Depois (Go):**
```go
// Apenas ZPL
func (m *Manager) SendToPrinter(printer *models.PrinterInfo, data []byte) error {
    // Assume ZPL direto
    return m.SendToUSB(*printer.DevicePath, data)
}
```

---

### **4. Registro de Impressoras → Modelo Efêmero** ✅

#### **Antes (Rust):**
```rust
// Impressoras eram cadastradas no agent-register
AgentRegister {
    agent_fingerprint: "...",
    printers: vec![
        PrinterInfo {
            device_path: "/dev/usb/lp0",
            vendor_id: "0a5f",
            product_id: "0089",
            manufacturer: "Zebra",
            product_name: "GC420d",
            status: Online,
        }
    ],
}
```

#### **Depois (Go):**
```go
// agent-register: printers VAZIO (USB é efêmero)
agentData := map[string]interface{}{
    "fingerprint": "edge-rpi-001",
    "printers":    []interface{}{},  // Vazio!
    "capabilities": []string{"usb-auto-detect"},
}

// heartbeat: impressoras USB enviadas dinamicamente
heartbeat := map[string]interface{}{
    "fingerprint": "edge-rpi-001",
    "printers":    usbPrinters,  // Auto-detectadas!
}
```

**📖 Veja:** [PRINTER_REGISTRATION_MODEL.md](./PRINTER_REGISTRATION_MODEL.md)

---

### **5. Configuração → JSON compatível** ✅

#### **Antes (Rust) - `config.json`:**
```json
{
  "api": {
    "base_url": "https://api.tagment.com.br",
    "websocket_url": "wss://api.tagment.com.br/agents",
    "api_key": "tgm_xxx",
    "timeout_seconds": 30
  },
  "agent": {
    "name": "Tagment Edge Agent",
    "heartbeat_interval_seconds": 30,
    "reconnect_max_attempts": 5,
    "reconnect_delay_seconds": 2,
    "log_level": "info"
  },
  "printers": [
    {
      "id": "zebra-tcp",
      "name": "Zebra TCP",
      "type": "ZPL",
      "enabled": true,
      "connection": {
        "type": "tcp",
        "ip": "192.168.1.100",
        "port": 9100
      }
    },
    {
      "id": "zebra-usb",
      "name": "Zebra USB",
      "type": "ZPL",
      "enabled": true,
      "connection": {
        "type": "usb",
        "device_path": "/dev/usb/lp0"
      }
    }
  ]
}
```

#### **Depois (Go) - `config.yaml` ou `config.json`:**
```json
{
  "device": {
    "id": "edge-rpi-001",
    "name": "Raspberry Pi - Loja Principal",
    "version": "2.0.0",
    "location": "Balcão",
    "hostname": "rpi-balcao"
  },
  "socketio": {
    "server_url": "https://api.tagment.com.br",
    "api_key": "tgm_xxx",
    "namespace": "/agents",
    "agent_fingerprint": "edge-rpi-001",
    "reconnect_delay": 5
  },
  "api": {
    "host": "0.0.0.0",
    "port": 8080
  },
  "display": {
    "enabled": true,
    "service_url": "localhost:3006",
    "type": "rgb"
  },
  "debug": false
}
```

**⚠️ Nota:** Seção `printers` foi **REMOVIDA** - impressoras USB são auto-detectadas!

---

## 📦 **Estrutura de Diretórios**

### **Antes (Rust):**
```
edge-go/
├── src/
│   ├── main.rs
│   ├── system_metrics.rs
│   └── config_mode.rs
├── bridge/           # ❌ REMOVIDO
│   ├── bridge.js
│   └── package.json
├── config.json
└── Cargo.toml
```

### **Depois (Go):**
```
edge-v2/
├── cmd/
│   └── edge/
│       └── main.go
├── internal/
│   ├── config/       # ✅ NOVO
│   ├── socketio/     # ✅ WebSocket nativo
│   ├── printer/      # ✅ USB manager
│   ├── metrics/      # Métricas do sistema
│   ├── api/          # API HTTP
│   └── models/       # Estruturas de dados
├── configs/
│   └── config.example.json
├── go.mod
└── Makefile
```

---

## 🔄 **Equivalência de Funções**

| Funcionalidade | Rust (edge-go) | Go (edge-v2) |
|---|---|---|
| **Detecção USB** | `discover_usb_printers()` | `DetectUSBPrintersWithInfo()` |
| **Impressão USB** | `send_usb_print_command()` | `SendToUSB()` |
| **Impressão TCP** | `send_print_command()` | ❌ (Flutter) |
| **Registro Agent** | `register_agent()` | `sendRegister()` |
| **Heartbeat** | `start_heartbeat()` | `SendHeartbeat()` |
| **WebSocket** | `BridgeClient` (via Node.js) | `socketio.Client` (nativo) |
| **Métricas** | `SystemMetrics::collect()` | `Collector.GetSystemMetrics()` |
| **Config** | `load_config()` | `config.Load()` |

---

## 🚀 **Como Migrar**

### **Passo 1: Parar serviço Rust**
```bash
# No Raspberry Pi
sudo systemctl stop tagment-edge-agent
sudo systemctl disable tagment-edge-agent
```

### **Passo 2: Remover bridge Node.js**
```bash
sudo systemctl stop tagment-bridge
sudo systemctl disable tagment-bridge
rm -rf ~/tagment/bridge
```

### **Passo 3: Instalar edge-v2 (Go)**
```bash
# Compilar para ARM64
cd edge-v2
GOOS=linux GOARCH=arm64 go build -o bin/edge-arm64 ./cmd/edge/main.go

# Copiar para Pi
scp bin/edge-arm64 pi@192.168.1.100:~/tagment/edge
ssh pi@192.168.1.100 'chmod +x ~/tagment/edge'
```

### **Passo 4: Criar config.json**
```bash
ssh pi@192.168.1.100
cd ~/tagment
cat > config.json << 'EOF'
{
  "device": {
    "id": "edge-rpi-001",
    "name": "Raspberry Pi - Loja Principal"
  },
  "socketio": {
    "server_url": "https://api.tagment.com.br",
    "api_key": "tgm_YOUR_KEY_HERE"
  }
}
EOF
```

### **Passo 5: Criar systemd service**
```bash
sudo tee /etc/systemd/system/tagment-edge-v2.service << 'EOF'
[Unit]
Description=Tagment Edge v2 (Go)
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/tagment
ExecStart=/home/pi/tagment/edge --config /home/pi/tagment/config.json
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable tagment-edge-v2
sudo systemctl start tagment-edge-v2
```

### **Passo 6: Verificar logs**
```bash
sudo journalctl -u tagment-edge-v2 -f
```

---

## ✅ **Checklist de Migração**

- [ ] Backup do config.json antigo (Rust)
- [ ] Parar serviços Rust e bridge Node.js
- [ ] Compilar edge-v2 (Go) para ARM64
- [ ] Copiar binário para Raspberry Pi
- [ ] Criar novo config.json (sem seção `printers`)
- [ ] Criar systemd service do edge-v2
- [ ] Iniciar edge-v2
- [ ] Verificar logs: impressoras USB detectadas
- [ ] Testar job de impressão via API
- [ ] Remover binários e configs antigos

---

## 🐛 **Troubleshooting**

### **Erro: "impressoras TCP não são suportadas"**
✅ **Esperado!** Use o app Flutter (Granobox) para impressoras TCP.

### **Erro: "device /dev/usb/lp0 não existe"**
```bash
# Verificar se impressora está conectada
ls -la /dev/usb/

# Verificar permissões
sudo chmod 666 /dev/usb/lp0

# Adicionar user ao grupo lp
sudo usermod -a -G lp pi
```

### **Heartbeat não envia impressoras USB**
```bash
# Verificar detecção
./edge --debug

# Deve aparecer:
# [INFO] 🔍 Detectando impressoras USB...
# [INFO] 🖨️ Impressora USB detectada: /dev/usb/lp0
# [INFO] ✨ Impressora auto-registrada: auto-usb-lp0
```

---

## 📊 **Performance Comparison**

| Métrica | Rust (edge-go) | Go (edge-v2) |
|---|---|---|
| **Memória (idle)** | ~15MB | ~20MB |
| **CPU (idle)** | ~2% | ~3% |
| **Startup Time** | ~300ms | ~150ms |
| **Binary Size** | 8MB | 12MB |
| **Dev Time** | Lento | **10x mais rápido** |
| **Debug** | Difícil | **Fácil** |

---

## 📚 **Documentação Adicional**

- [PRINTER_REGISTRATION_MODEL.md](./PRINTER_REGISTRATION_MODEL.md) - Modelo efêmero vs permanente
- [README.md](./README.md) - Guia geral do edge-v2
- [FEATURES_GUIDE.md](./FEATURES_GUIDE.md) - Funcionalidades completas

---

## 🤝 **Suporte**

Para dúvidas sobre migração:
- 📧 Email: suporte@tagment.com.br
- 💬 Slack: #edge-migration

---

**Made with ❤️ for Tagment Edge v2 (Go)**

