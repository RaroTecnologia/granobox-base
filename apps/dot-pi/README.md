# 🍊 Granobox Dot Pi - Leitor de QR Code para Orange Pi / Raspberry Pi

Versão do Granobox Dot para **Orange Pi Zero 2W** e **Raspberry Pi** escrita em **Go**.

---

## 🎯 **Características**

- ✅ **Compatível com Orange Pi e Raspberry Pi** (mesmo código!)
- ✅ Escrito em **Go** (rápido, confiável, fácil deploy)
- ✅ Lê QR Code e códigos de barras via **GM861**
- ✅ Integração com API Granobox
- ✅ Executável único (sem dependências)
- ✅ Suporte a display (opcional)
- ✅ Configuração via variáveis de ambiente

---

## 📋 **Hardware Suportado**

| Device | UART | Testado |
|--------|------|---------|
| Orange Pi Zero 2W | /dev/ttyS1 | ✅ Sim |
| Raspberry Pi 3/4 | /dev/ttyAMA0 | ✅ Compatível |
| Raspberry Pi Zero W | /dev/ttyAMA0 | ✅ Compatível |
| Banana Pi | /dev/ttyS1 | ⚠️ Não testado |

---

## 🔌 **Conexão Física GM861**

### **Orange Pi Zero 2W**

```
┌──────────────┐          ┌──────────────────┐
│    GM861     │          │  Orange Pi Zero  │
├──────────────┤          ├──────────────────┤
│ VCC          │─────────→│ 3.3V (Pin 1)     │
│ GND          │─────────→│ GND (Pin 6)      │
│ TXD          │─────────→│ UART1_RX (Pin 10)│
│ RXD          │←─────────│ UART1_TX (Pin 8) │
└──────────────┘          └──────────────────┘
```

### **Raspberry Pi**

```
┌──────────────┐          ┌──────────────────┐
│    GM861     │          │  Raspberry Pi    │
├──────────────┤          ├──────────────────┤
│ VCC          │─────────→│ 3.3V (Pin 1)     │
│ GND          │─────────→│ GND (Pin 6)      │
│ TXD          │─────────→│ UART_RX (Pin 10) │
│ RXD          │←─────────│ UART_TX (Pin 8)  │
└──────────────┘          └──────────────────┘
```

---

## 🚀 **Instalação**

### **1. Preparar Orange Pi Zero 2W**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Go
wget https://go.dev/dl/go1.21.5.linux-arm64.tar.gz
sudo tar -C /usr/local -xzf go1.21.5.linux-arm64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verificar instalação
go version
```

### **2. Habilitar UART**

#### **Orange Pi Zero 2W:**

```bash
# Editar /boot/armbianEnv.txt
sudo nano /boot/armbianEnv.txt

# Adicionar linha:
overlays=uart1

# Reiniciar
sudo reboot
```

#### **Raspberry Pi:**

```bash
# Editar /boot/config.txt
sudo nano /boot/config.txt

# Adicionar:
enable_uart=1
dtoverlay=disable-bt

# Reiniciar
sudo reboot
```

### **3. Configurar Permissões**

```bash
# Adicionar usuário ao grupo dialout
sudo usermod -a -G dialout $USER

# Relogar ou executar:
newgrp dialout
```

### **4. Clonar e Compilar**

```bash
# Clonar repositório
cd /home/pi
git clone https://github.com/granobox/granobox.git
cd granobox/apps/dot-pi

# Baixar dependências
go mod download

# Compilar
go build -o dot ./cmd/dot

# Executar
./dot
```

---

## ⚙️ **Configuração**

### **Variáveis de Ambiente**

```bash
# API Key do Granobox
export GRANOBOX_API_KEY="sua_api_key_aqui"

# URL da API (opcional, padrão: https://api.granobox.com.br)
export GRANOBOX_API_URL="https://api.granobox.com.br"

# Porta Serial (opcional)
export GRANOBOX_SERIAL_PORT="/dev/ttyS1"  # Orange Pi
# ou
export GRANOBOX_SERIAL_PORT="/dev/ttyAMA0"  # Raspberry Pi

# Baud Rate (opcional, padrão: 9600)
export GRANOBOX_BAUD_RATE="9600"
```

### **Arquivo de Configuração**

Crie `/etc/granobox-dot.conf`:

```ini
[api]
url = https://api.granobox.com.br
key = sua_api_key_aqui

[serial]
port = /dev/ttyS1
baud = 9600

[display]
enabled = false
type = none
```

---

## 🏃 **Execução**

### **Modo Desenvolvimento:**

```bash
# Executar diretamente
go run ./cmd/dot

# Ou compilado
./dot
```

### **Modo Produção (systemd):**

Crie `/etc/systemd/system/granobox-dot.service`:

```ini
[Unit]
Description=Granobox Dot Pi - Leitor de QR Code
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/granobox/apps/dot-pi
Environment="GRANOBOX_API_KEY=sua_api_key_aqui"
ExecStart=/home/pi/granobox/apps/dot-pi/dot
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Ativar serviço:

```bash
sudo systemctl daemon-reload
sudo systemctl enable granobox-dot
sudo systemctl start granobox-dot

# Ver logs
sudo journalctl -u granobox-dot -f
```

---

## 🧪 **Teste da Porta Serial**

### **Verificar se UART está ativo:**

```bash
# Orange Pi
ls -l /dev/ttyS*
# Deve aparecer: /dev/ttyS1

# Raspberry Pi
ls -l /dev/ttyAMA*
# Deve aparecer: /dev/ttyAMA0
```

### **Teste de Loopback:**

```bash
# Conectar TX no RX (pino 8 no pino 10)
# Instalar minicom
sudo apt install minicom -y

# Abrir porta
minicom -D /dev/ttyS1 -b 9600

# Digitar algo - deve aparecer de volta se loopback OK
```

---

## 📊 **Estrutura do Projeto**

```
dot-pi/
├── cmd/
│   └── dot/
│       └── main.go           # Ponto de entrada
├── internal/
│   ├── display/              # Suporte a displays (futuro)
│   │   ├── gc9a01.go        # Display redondo
│   │   └── ssd1306.go       # Display OLED
│   ├── scanner/              # Leitor de QR Code
│   │   └── gm861.go         # Driver GM861
│   ├── api/                  # Cliente API Granobox
│   │   └── client.go
│   └── config/               # Configuração
│       └── config.go
├── pkg/
│   └── qrcode/              # Utilitários QR Code
├── go.mod
├── go.sum
├── README.md
└── Makefile
```

---

## 🔧 **Diferenças Orange Pi vs Raspberry Pi**

| Característica | Orange Pi Zero 2W | Raspberry Pi |
|----------------|-------------------|--------------|
| **UART Path** | `/dev/ttyS1` | `/dev/ttyAMA0` ou `/dev/serial0` |
| **Enable UART** | `overlays=uart1` em armbianEnv.txt | `enable_uart=1` em config.txt |
| **GPIO Library** | Mesma (periph.io) | Mesma (periph.io) |
| **Código Go** | **Idêntico** ✅ | **Idêntico** ✅ |

**Conclusão:** O mesmo binário funciona em ambos! Só muda a porta serial.

---

## 🐛 **Troubleshooting**

### **Erro: "permission denied" ao abrir /dev/ttyS1**

```bash
# Adicionar usuário ao grupo dialout
sudo usermod -a -G dialout $USER

# Relogar ou:
newgrp dialout
```

### **Erro: "no such file or directory /dev/ttyS1"**

```bash
# Verificar se UART está habilitado
sudo nano /boot/armbianEnv.txt

# Deve ter:
overlays=uart1

# Reiniciar
sudo reboot
```

### **GM861 não lê QR Codes**

```bash
# Verificar se dados estão chegando
cat /dev/ttyS1

# Aproxime GM861 de QR Code
# Se nada aparecer = problema de hardware
```

### **Dados corrompidos (������)**

```bash
# Testar outros baud rates:
# Edite main.go e mude:
baudRate = 115200  // tentar 115200
# ou
baudRate = 57600   // tentar 57600
```

---

## 📱 **Cross-Compilation**

Compilar no Mac/Linux para Orange Pi:

```bash
# Para ARM64 (Orange Pi Zero 2W)
GOOS=linux GOARCH=arm64 go build -o dot-arm64 ./cmd/dot

# Para ARM32 (Raspberry Pi Zero)
GOOS=linux GOARCH=arm GOARM=6 go build -o dot-arm ./cmd/dot

# Transferir para Orange Pi
scp dot-arm64 pi@orangepi.local:/home/pi/dot

# Executar via SSH
ssh pi@orangepi.local
chmod +x dot
./dot
```

---

## 🚀 **Próximos Passos**

- [ ] Implementar cliente HTTP para API Granobox
- [ ] Suporte a display GC9A01 (redondo 240x240)
- [ ] Suporte a display OLED SSD1306
- [ ] Cache local de produtos
- [ ] Modo offline
- [ ] Interface web para configuração
- [ ] OTA updates

---

## 📦 **Deploy com Docker (Opcional)**

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o dot ./cmd/dot

FROM alpine:latest
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/dot /usr/local/bin/
CMD ["dot"]
```

---

## 💡 **Vantagens vs ESP32**

| Característica | ESP32 | Orange Pi Zero 2W |
|----------------|-------|-------------------|
| CPU | Single core 240MHz | Quad core 1.5GHz |
| RAM | 320KB | 1GB |
| Storage | Flash 4MB | MicroSD (ilimitado) |
| OS | FreeRTOS | Linux |
| Linguagem | C/C++ | Go, Python, etc |
| Deploy | Upload via USB | SSH, Git, Docker |
| Debug | Serial Monitor | SSH, logs |
| Updates | Reupload firmware | Git pull + restart |
| Display | SPI | HDMI + SPI |

---

**Versão:** 1.0.0  
**Data:** 19/10/2025  
**Licença:** MIT

