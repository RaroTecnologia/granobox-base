# 🚀 Setup Orange Pi SEM Monitor/Teclado

## ✅ **SIM! É possível configurar WiFi e SSH ANTES do primeiro boot!**

Diferente do Raspberry Pi (que usa `wpa_supplicant.conf`), o Orange Pi com Armbian usa outro método, mas **igualmente fácil**!

---

## 🎯 **Processo Completo (2 passos)**

### **Passo 1: Gravar Imagem**

```bash
cd /Volumes/DadosTiago/Dev/granobox/apps/dot-pi

# Gravar Armbian no MicroSD
./flash-armbian.sh
```

**O que acontece:**
1. ✅ Detecta imagem Armbian automaticamente
2. ✅ Lista discos disponíveis
3. ✅ Você escolhe o MicroSD (geralmente disk2)
4. ✅ Grava a imagem (~5-8 minutos)
5. ✅ **PERGUNTA se quer configurar WiFi/SSH**

---

### **Passo 2: Configurar WiFi/SSH**

Ao final da gravação, o script pergunta:

```
Configurar WiFi/SSH agora? (s/n): s
```

Digite **`s`** e ele executa automaticamente o `setup-wifi-ssh.sh`!

**O que o script configura:**
1. ✅ **SSH habilitado** (acesso remoto)
2. ✅ **WiFi configurado** (conecta automaticamente no boot)
3. ✅ **UART1 habilitado** (para GM861)
4. ✅ **Usuário no grupo dialout** (permissão serial)

---

## 📋 **Informações que Serão Solicitadas:**

```
Nome da rede WiFi (SSID): SuaRedeWiFi
Senha da rede WiFi: ****************
País (BR para Brasil): BR
```

---

## 🎉 **Resultado Final:**

Depois de configurar WiFi/SSH:

```
╔════════════════════════════════════════╗
║         Configuração Concluída! ✅     ║
╚════════════════════════════════════════╝

📋 Configurações aplicadas:
  ✅ SSH habilitado
  ✅ WiFi configurado: SuaRedeWiFi
  ✅ UART1 habilitado (para GM861)

🔄 Próximos passos:
  1. Ejetar MicroSD com segurança
  2. Inserir no Orange Pi Zero 2W
  3. Conectar fonte USB-C (5V 2A)
  4. Aguardar ~2 minutos (conectará ao WiFi)
  5. SSH: ssh root@orangepi.local (senha: 1234)
```

---

## 🔌 **Primeiro Boot (SEM monitor/teclado):**

1. ✅ **Inserir MicroSD** no Orange Pi
2. ✅ **Conectar fonte** USB-C (5V 2A mínimo)
3. ⏳ **Aguardar 2-3 minutos** (primeiro boot é lento)
4. 📶 **Orange Pi conecta no WiFi** automaticamente
5. 🔐 **SSH está habilitado**

---

## 💻 **Conectar via SSH:**

### **Opção 1: Via mDNS (hostname)**

```bash
ssh root@orangepi.local
# Senha: 1234
```

### **Opção 2: Via IP direto**

**Descobrir IP:**

```bash
# Método 1: Scan de rede
nmap -sn 192.168.1.0/24 | grep -B 2 "Orange"

# Método 2: Ver no roteador
# Buscar dispositivo "orangepizero2w"

# Método 3: Pelo hostname
ping orangepi.local
```

**Conectar:**

```bash
ssh root@192.168.1.XXX
# Senha: 1234
```

---

## 🔧 **Primeira Configuração (via SSH):**

Ao fazer login pela primeira vez:

```bash
# 1. Alterar senha root
Current password: 1234
New password: [sua nova senha]
Retype password: [sua nova senha]

# 2. Criar usuário
Create a new user: y
Username: pi
Password: [senha do usuário pi]

# 3. Configurar shell (opcional)
Select shell: 1 (bash)

# 4. Pronto!
```

---

## ✅ **Verificar UART1 (para GM861):**

```bash
# Deve aparecer /dev/ttyS1
ls -l /dev/ttyS*

# Saída esperada:
crw-rw---- 1 root dialout ... /dev/ttyS1
```

Se não aparecer, adicionar manualmente:

```bash
sudo nano /boot/armbianEnv.txt

# Adicionar linha:
overlays=uart1

# Salvar: Ctrl+X, Y, Enter
sudo reboot
```

---

## 🚀 **Deploy do Granobox Dot:**

```bash
# No seu Mac
cd /Volumes/DadosTiago/Dev/granobox/apps/dot-pi

# Compilar para Orange Pi
make build-arm64

# Copiar para Orange Pi
scp dot-arm64 pi@orangepi.local:/home/pi/dot

# No Orange Pi (via SSH)
ssh pi@orangepi.local
chmod +x /home/pi/dot
export GRANOBOX_API_KEY="sua_api_key_aqui"
./dot
```

---

## 🔄 **Se Configurou WiFi Errado:**

Não tem problema! Pode reconfigurar via SSH ou serial:

### **Via SSH (se conseguir conectar):**

```bash
ssh root@orangepi.local

# Reconfigurar WiFi
sudo nmtui

# Ou editar manualmente
sudo nano /etc/NetworkManager/system-connections/your-wifi-name.nmconnection
```

### **Via Serial Console (sem SSH):**

Conectar cabo USB-TTL:
- GND → Pin 6
- TX → Pin 8
- RX → Pin 10

```bash
# No Mac
screen /dev/cu.usbserial-XXXX 115200

# Login: root / senha: 1234
# Configurar WiFi: sudo nmtui
```

---

## 📊 **Comparação: Orange Pi vs Raspberry Pi**

| Característica | Raspberry Pi | Orange Pi (Armbian) |
|----------------|--------------|---------------------|
| **WiFi Config** | `wpa_supplicant.conf` | `armbian_first_run.txt` |
| **SSH Enable** | Arquivo `ssh` vazio | `.not_logged_in_yet` |
| **Local Config** | `/boot/` partition | `/boot/` partition |
| **Formato Config** | Manual | Script automático ✅ |

---

## 🎯 **Resumo Executivo:**

### **Com o Script (FÁCIL):** ✅

```bash
1. ./flash-armbian.sh
2. Digite "s" quando perguntar sobre WiFi/SSH
3. Informe SSID e senha do WiFi
4. Insira no Orange Pi
5. SSH: ssh root@orangepi.local
```

### **Sem o Script (DIFÍCIL):** ❌

```bash
1. Gravar imagem
2. Conectar monitor HDMI
3. Conectar teclado USB
4. Configurar manualmente
5. Depois pode usar SSH
```

---

## 💡 **Dicas Extras:**

### **WiFi 5GHz vs 2.4GHz:**

Orange Pi Zero 2W suporta ambos, mas:
- ✅ **2.4GHz:** Maior alcance, mais estável
- ⚠️ **5GHz:** Mais rápido, menor alcance

**Recomendação:** Use 2.4GHz para estabilidade

### **SSH Key (Segurança):**

Depois de conectar pela primeira vez:

```bash
# No seu Mac
ssh-copy-id pi@orangepi.local

# Testar
ssh pi@orangepi.local
# Deve entrar sem pedir senha!

# Desabilitar senha (opcional)
ssh pi@orangepi.local
sudo nano /etc/ssh/sshd_config
# Alterar: PasswordAuthentication no
sudo systemctl restart ssh
```

### **IP Estático (opcional):**

```bash
ssh pi@orangepi.local
sudo nmtui

# Selecionar:
# Edit a connection → WiFi → IPv4 Configuration
# Alterar: Automatic → Manual
# Configurar IP fixo
```

---

## 🐛 **Troubleshooting:**

### **Não consegue SSH via orangepi.local**

```bash
# Descobrir IP manualmente
nmap -sn 192.168.1.0/24

# Ou via roteador
# Conectar direto: ssh root@192.168.1.XXX
```

### **WiFi não conecta**

```bash
# Verificar se SSID/senha estão corretos
# Reconfigurar: ./setup-wifi-ssh.sh novamente
# Ou conectar monitor e configurar manualmente
```

### **UART1 não aparece**

```bash
# Adicionar manualmente
ssh pi@orangepi.local
sudo nano /boot/armbianEnv.txt
# Adicionar: overlays=uart1
sudo reboot
```

---

## ✅ **Checklist Completo:**

- [ ] Imagem gravada: `./flash-armbian.sh`
- [ ] WiFi/SSH configurado: `./setup-wifi-ssh.sh`
- [ ] MicroSD inserido no Orange Pi
- [ ] Fonte USB-C conectada (5V 2A)
- [ ] Aguardado 2-3 minutos
- [ ] SSH funcionando: `ssh root@orangepi.local`
- [ ] Senha root alterada
- [ ] Usuário `pi` criado
- [ ] UART1 verificado: `ls -l /dev/ttyS1`
- [ ] GM861 conectado nos pinos corretos
- [ ] Granobox Dot deployado
- [ ] Teste de leitura OK

---

**Pronto para começar! SEM MONITOR NECESSÁRIO! 🎉**

