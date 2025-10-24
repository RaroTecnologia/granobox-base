# 🚀 Quick Start - Granobox Dot Pi

Guia rápido para colocar o Granobox Dot Pi funcionando em **5 minutos**.

---

## ⚡ **Setup Rápido Orange Pi Zero 2W**

### **1. Preparar Orange Pi** (3 minutos)

```bash
# SSH no Orange Pi
ssh pi@orangepi.local  # senha padrão: orangepi

# Habilitar UART1
sudo nano /boot/armbianEnv.txt
# Adicionar linha: overlays=uart1
# Salvar: Ctrl+X, Y, Enter

# Adicionar usuário ao grupo dialout
sudo usermod -a -G dialout $USER

# Reiniciar
sudo reboot
```

---

### **2. Conectar Hardware** (1 minuto)

```
GM861 VCC → Orange Pi Pin 1 (3.3V)
GM861 GND → Orange Pi Pin 6 (GND)
GM861 TXD → Orange Pi Pin 10 (UART1_RX)
GM861 RXD → Orange Pi Pin 8 (UART1_TX)
```

---

### **3. Deploy e Executar** (1 minuto)

**No seu Mac:**

```bash
cd /Volumes/DadosTiago/Dev/granobox/apps/dot-pi

# Compilar para Orange Pi
make build-arm64

# Copiar para Orange Pi
scp dot-arm64 pi@orangepi.local:/home/pi/dot

# Configurar API Key
ssh pi@orangepi.local
export GRANOBOX_API_KEY="sua_api_key_aqui"
chmod +x /home/pi/dot
./dot
```

---

## ✅ **Pronto! Deve Aparecer:**

```
╔════════════════════════════════════════╗
║   Granobox Dot Pi - Leitor de QR Code  ║
║   Versão: 1.0.0                        ║
╚════════════════════════════════════════╝

📡 Abrindo porta serial: /dev/ttyS1 @ 9600 baud
✅ Porta serial aberta com sucesso

🎯 Aguardando leituras do GM861...
   Aproxime o leitor de um QR Code ou código de barras
```

---

## 🧪 **Testar**

Aproxime o GM861 de um QR Code. Deve aparecer:

```
┌────────────────────────────────────────┐
│ LEITURA #1                             │
├────────────────────────────────────────┤
│ Código: TESTE123                       │
│ Tamanho: 8                             │
│ Hora: 15:30:45                         │
└────────────────────────────────────────┘
```

---

## 🔧 **Troubleshooting Rápido**

### **Erro: no such file /dev/ttyS1**
```bash
# Verificar se UART está habilitado
cat /boot/armbianEnv.txt | grep uart1

# Se não tiver, adicionar:
echo "overlays=uart1" | sudo tee -a /boot/armbianEnv.txt
sudo reboot
```

### **Erro: permission denied**
```bash
# Adicionar ao grupo dialout
sudo usermod -a -G dialout $USER
newgrp dialout
```

### **GM861 não lê**
```bash
# Testar porta serial manualmente
cat /dev/ttyS1
# Aproxime GM861 de QR Code
# Se nada aparecer = problema de hardware
```

---

## 🏃 **Modo Produção (Systemd)**

```bash
# Copiar binário e serviço
scp dot-arm64 pi@orangepi.local:/home/pi/granobox-dot/dot
scp granobox-dot.service pi@orangepi.local:~/

# No Orange Pi
ssh pi@orangepi.local

# Editar API Key no service
nano ~/granobox-dot.service
# Alterar: Environment="GRANOBOX_API_KEY=sua_key_aqui"

# Instalar serviço
sudo mv ~/granobox-dot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable granobox-dot
sudo systemctl start granobox-dot

# Ver logs
sudo journalctl -u granobox-dot -f
```

---

## 📊 **Comandos Úteis**

```bash
# Status do serviço
sudo systemctl status granobox-dot

# Reiniciar
sudo systemctl restart granobox-dot

# Parar
sudo systemctl stop granobox-dot

# Logs (tempo real)
sudo journalctl -u granobox-dot -f

# Logs (últimas 100 linhas)
sudo journalctl -u granobox-dot -n 100
```

---

## 🎯 **Próximos Passos**

1. ✅ Testar leitura de QR Code
2. ✅ Configurar API Key
3. ✅ Testar consulta à API
4. 🔜 Adicionar display (se tiver)
5. 🔜 Configurar auto-start no boot
6. 🔜 Configurar WiFi estático

---

**Dúvidas?** Ver documentação completa em `README.md`

