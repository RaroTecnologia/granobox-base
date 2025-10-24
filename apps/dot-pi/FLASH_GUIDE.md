# 💾 Guia Rápido - Gravar Armbian no MicroSD

## ✅ Você já tem tudo pronto!

Arquivo detectado: `Armbian_25.5.1_Orangepizero2w_bookworm_current_6.12.23_minimal.img.xz`

**Excelente escolha!** 🎉
- ✅ Versão 25.5.1 (mais recente)
- ✅ **MINIMAL** (perfeito para servidor!)
- ✅ Kernel 6.12.23 (estável)
- ✅ Debian Bookworm (Debian 12)

---

## 🚀 Passo a Passo (2 minutos)

### **1. Inserir MicroSD no Mac**

```bash
# Inserir cartão MicroSD no leitor USB
# Aguardar aparecer no Finder
```

⚠️ **ATENÇÃO:** Todos os dados do MicroSD serão apagados!

---

### **2. Executar o Script**

```bash
cd /Volumes/DadosTiago/Dev/granobox/apps/dot-pi

# Executar (auto-detecta a imagem)
./flash-armbian.sh
```

**Ou especificar manualmente:**
```bash
./flash-armbian.sh Armbian_25.5.1_Orangepizero2w_bookworm_current_6.12.23_minimal.img.xz
```

---

### **3. Seguir as Instruções**

O script vai:

```
╔════════════════════════════════════════╗
║   Gravador de Imagem Armbian - macOS   ║
╚════════════════════════════════════════╝

🔍 Buscando imagem Armbian na pasta atual...
✅ Imagem encontrada: Armbian_25.5.1_...minimal.img.xz

📂 Imagem: Armbian_25.5.1_Orangepizero2w_bookworm_current_6.12.23_minimal.img.xz
🎯 Tipo: MINIMAL (Ideal para servidor - sem pacotes extras)
📌 Versão: Armbian 25.5.1
🔧 Kernel: 6.12.23

💾 Discos disponíveis:
/dev/disk0 (internal):
   Macintosh HD - 500 GB
   
/dev/disk2 (external):  ← Seu MicroSD
   NO NAME - 32 GB

Digite o número do disco (ex: 2 para /dev/disk2): 2

⚠️  CONFIRMA gravar em /dev/disk2? (sim/não): sim

🔧 Desmontando /dev/disk2...
📦 Descomprimindo e gravando...
[████████████████████] 15% (~5 minutos restantes)
```

---

### **4. Aguardar Conclusão**

- ⏱️ Tempo estimado: **5-8 minutos**
- 💡 Dica: Deixe rodando, vá tomar um café ☕

Quando terminar:
```
✅ Concluído!
📤 Ejetando MicroSD...

╔════════════════════════════════════════╗
║        Gravação Finalizada! 🎉         ║
╚════════════════════════════════════════╝
```

---

## 🔌 Próximos Passos

### **1. Inserir MicroSD no Orange Pi**

```
1. Remover MicroSD do Mac
2. Inserir no slot do Orange Pi Zero 2W
3. Conectar fonte USB-C (5V 2A mínimo)
4. Aguardar ~2 minutos (primeiro boot demora)
```

---

### **2. Conectar via SSH**

#### **Opção A: Via mDNS (mais fácil)**
```bash
# Aguardar 2 minutos após ligar
ssh root@orangepi.local
# Senha: 1234
```

#### **Opção B: Via IP direto**
```bash
# Descobrir IP (se mDNS não funcionar)
# Opção 1: Ver no roteador
# Opção 2: Scan de rede
nmap -sn 192.168.1.0/24 | grep -B 2 "Orange"

# Conectar
ssh root@192.168.1.XXX
# Senha: 1234
```

---

### **3. Primeira Configuração**

Ao fazer login pela primeira vez, será solicitado:

```bash
# 1. Alterar senha root
New password: [digite nova senha]
Retype new password: [repita senha]

# 2. Criar novo usuário
Create a new user (recommended): y
New username: pi
Password: [digite senha]

# 3. Configurar shell (opcional)
Select shell: bash (padrão)

# 4. Configurar localidade
Select your location: America/Sao_Paulo
```

---

### **4. Habilitar UART1 (para GM861)**

```bash
# Editar configuração
sudo nano /boot/armbianEnv.txt

# Adicionar linha:
overlays=uart1

# Salvar: Ctrl+X, Y, Enter

# Reiniciar
sudo reboot
```

---

### **5. Verificar UART**

```bash
# Após reboot, fazer login novamente
ssh pi@orangepi.local

# Verificar se UART1 está ativo
ls -l /dev/ttyS*

# Deve aparecer:
# /dev/ttyS1 ✅
```

---

### **6. Conectar GM861**

```
GM861 VCC → Orange Pi Pin 1 (3.3V)
GM861 GND → Orange Pi Pin 6 (GND)
GM861 TXD → Orange Pi Pin 10 (UART1_RX)
GM861 RXD → Orange Pi Pin 8 (UART1_TX)
```

---

### **7. Deploy do Granobox Dot**

**No seu Mac:**
```bash
cd /Volumes/DadosTiago/Dev/granobox/apps/dot-pi

# Editar Makefile com IP/hostname do Orange Pi
nano Makefile
# Alterar: ORANGE_PI_HOST=pi@orangepi.local

# Deploy
make deploy
```

**No Orange Pi:**
```bash
cd /home/pi/granobox-dot
export GRANOBOX_API_KEY="sua_api_key_aqui"
./dot
```

---

## 🐛 Troubleshooting

### **Erro: No such file /dev/disk2**
```bash
# Verificar se MicroSD foi reconhecido
diskutil list

# Se não aparecer:
# 1. Remover e inserir novamente
# 2. Tentar outro leitor USB
# 3. Verificar se MicroSD não está travado (switch físico)
```

### **Erro: Permission denied**
```bash
# Script precisa de sudo para gravar
# Vai pedir senha quando executar dd
```

### **Orange Pi não liga**
```bash
✅ Verificar:
1. Fonte USB-C com mínimo 5V 2A
2. MicroSD inserido corretamente
3. Aguardar 2 minutos (primeiro boot é lento)
4. LED de power deve acender
```

### **Não consegue SSH (orangepi.local não funciona)**
```bash
# Opção 1: Descobrir IP no roteador
# Opção 2: Conectar monitor HDMI
# Opção 3: Scan de rede
nmap -sn 192.168.1.0/24
```

---

## 📊 Informações Técnicas

### **Armbian 25.5.1 MINIMAL**
- **OS:** Debian 12 (Bookworm)
- **Kernel:** 6.12.23 (current)
- **Tamanho:** ~150MB comprimido → ~1.5GB descomprimido
- **RAM usada no boot:** ~80-100MB
- **Pacotes instalados:** Mínimos (sem GUI, sem pacotes extras)
- **Ideal para:** Servidores, IoT, projetos embarcados

### **Orange Pi Zero 2W**
- **CPU:** Allwinner H618 (Quad-core Cortex-A53 @ 1.5GHz)
- **RAM:** 1GB / 1.5GB / 2GB / 4GB
- **Storage:** MicroSD (recomendado Class 10 ou UHS-I)
- **Network:** WiFi 5 AC + BLE 5.0 + Ethernet 100Mbps
- **GPIO:** 26 pinos compatíveis com Raspberry Pi

---

## ✅ Checklist Completo

- [ ] MicroSD inserido no Mac
- [ ] Script executado: `./flash-armbian.sh`
- [ ] Disco correto selecionado (verificar tamanho)
- [ ] Gravação concluída (100%)
- [ ] MicroSD ejetado do Mac
- [ ] MicroSD inserido no Orange Pi
- [ ] Fonte USB-C conectada (5V 2A)
- [ ] Aguardado 2 minutos para boot
- [ ] SSH conectado: `ssh root@orangepi.local`
- [ ] Senha root alterada
- [ ] Usuário `pi` criado
- [ ] UART1 habilitado em `/boot/armbianEnv.txt`
- [ ] Orange Pi reiniciado
- [ ] `/dev/ttyS1` existe
- [ ] GM861 conectado
- [ ] Granobox Dot deployado
- [ ] Teste de leitura OK

---

**Tudo pronto para começar! 🚀**

**Dúvidas?** Ver `README.md` ou `QUICKSTART.md`

