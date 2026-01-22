# 🚀 Quick Start - Edge v2

## 🎯 Do Zero ao Deploy em 5 minutos!

### 1️⃣ **Preparar o ambiente (Mac)**

```bash
cd /Volumes/DadosTiago/Dev/Tagment/apps/edge-v2

# Baixar dependências
go mod download

# Testar localmente (opcional)
./test_local.sh
```

### 2️⃣ **Compilar para Raspberry Pi**

```bash
make build-pi
```

Isso cria o binário ARM em `bin/edge-arm`

### 3️⃣ **Deploy na Raspberry Pi**

#### Opção A: Deploy automático (recomendado)

```bash
make deploy
```

Isso vai:
- Compilar o binário
- Copiar para a Pi
- Instalar como serviço systemd
- Iniciar automaticamente

#### Opção B: Deploy manual

```bash
# 1. Copiar arquivos
scp bin/edge-arm tagment@192.168.10.103:~/edge
scp -r scripts tagment@192.168.10.103:~/
scp -r configs tagment@192.168.10.103:~/

# 2. Na Pi, instalar
ssh tagment@192.168.10.103
cd ~
chmod +x scripts/install.sh
./scripts/install.sh
```

### 4️⃣ **Configurar (se necessário)**

Na Raspberry Pi:

```bash
# Editar configuração
sudo nano /etc/tagment/edge.yaml

# Ou usar variáveis de ambiente
sudo nano /etc/systemd/system/tagment-edge-v2.service

# Reiniciar após mudanças
sudo systemctl restart tagment-edge-v2
```

### 5️⃣ **Verificar funcionamento**

```bash
# Ver logs
make logs

# Ou na Pi
sudo journalctl -u tagment-edge-v2 -f

# Ver status
make status

# Testar API
curl http://192.168.10.103:3000/health
```

---

## 🎨 **Testar Display**

### Via API HTTP:

```bash
# Exibir status
curl -X POST http://192.168.10.103:3000/display/status \
  -H "Content-Type: application/json" \
  -d '{
    "icon": "✅",
    "message": "Hello from Go!",
    "ip": "192.168.10.103",
    "device_id": "edge-001",
    "version": "2.0.0",
    "brightness": 80
  }'

# Exibir texto
curl -X POST http://192.168.10.103:3000/display/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello World!",
    "font_size": 16,
    "brightness": 80
  }'

# Limpar display
curl -X POST http://192.168.10.103:3000/display/clear
```

---

## 🔧 **Comandos Úteis**

### Deploy e Build:

```bash
make build          # Build local (Mac)
make build-pi       # Build para Pi
make deploy         # Deploy completo
make deploy-quick   # Deploy rápido (só binário)
```

### Monitoramento:

```bash
make logs           # Ver logs em tempo real
make status         # Ver status do serviço
```

### Controle do Serviço:

```bash
make start          # Iniciar
make stop           # Parar
```

### Na Raspberry Pi:

```bash
# Status
sudo systemctl status tagment-edge-v2

# Iniciar
sudo systemctl start tagment-edge-v2

# Parar
sudo systemctl stop tagment-edge-v2

# Reiniciar
sudo systemctl restart tagment-edge-v2

# Ver logs
sudo journalctl -u tagment-edge-v2 -f

# Ver últimas 100 linhas
sudo journalctl -u tagment-edge-v2 -n 100
```

---

## 📡 **Endpoints da API**

### Health Check:
```bash
GET http://192.168.10.103:3000/health
```

### Device Info:
```bash
GET http://192.168.10.103:3000/info
```

### Display:
```bash
POST /display/status      # Exibir status
POST /display/qrcode      # Exibir QR code
POST /display/text        # Exibir texto
POST /display/clear       # Limpar
POST /display/brightness  # Ajustar brilho
```

### MQTT:
```bash
POST /mqtt/publish        # Publicar mensagem
GET  /mqtt/status         # Status da conexão
```

---

## 🐛 **Troubleshooting**

### Display não funciona?

```bash
# 1. Verificar se o display service Python está rodando
sudo systemctl status tagment-display

# 2. Testar conexão
telnet localhost 3006

# 3. Verificar logs
sudo journalctl -u tagment-display -f
```

### MQTT não conecta?

```bash
# 1. Verificar configuração
cat /etc/tagment/edge.yaml

# 2. Testar conexão com broker
mosquitto_sub -h mqtt.example.com -t test

# 3. Ver logs do edge
sudo journalctl -u tagment-edge-v2 -f
```

### API não responde?

```bash
# 1. Verificar se está rodando
sudo systemctl status tagment-edge-v2

# 2. Verificar porta
sudo netstat -tulpn | grep 3000

# 3. Testar localmente na Pi
curl http://localhost:3000/health
```

---

## 🎯 **Próximos Passos**

1. ✅ Configurar broker MQTT
2. ✅ Testar display service Python
3. ✅ Integrar sensores (se houver)
4. ✅ Configurar monitoramento
5. ✅ Setup de logs centralizados (opcional)

---

## 📚 **Documentação Completa**

Ver `README.md` para documentação detalhada.

---

**🎉 Pronto! Seu Edge v2 em Go está funcionando!** 🐹



