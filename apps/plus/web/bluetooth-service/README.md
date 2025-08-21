# Granobox Printer Service

Serviço offline completo para impressoras térmicas com fila de impressão, descoberta Bluetooth e interface web.

## 🚀 Instalação

### 1. Pré-requisitos

#### Windows:
```bash
# Instalar Node.js (https://nodejs.org)
# Instalar Python e Visual Studio Build Tools
npm install -g windows-build-tools
```

#### macOS:
```bash
# Instalar Xcode Command Line Tools
xcode-select --install

# Instalar Node.js via Homebrew
brew install node
```

#### Linux (Ubuntu/Debian):
```bash
# Instalar dependências
sudo apt-get update
sudo apt-get install nodejs npm bluetooth bluez libbluetooth-dev
```

### 2. Instalar Dependências

```bash
cd bluetooth-service
npm install
```

### 3. Executar Serviço

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Instalar como serviço do sistema
npm run install-service
```

O serviço rodará nas portas:
- **3001**: API REST
- **3002**: WebSocket
- Interface web: http://localhost:3001

## 🔧 Como Usar

### 1. Iniciar o Serviço
```bash
cd bluetooth-service
npm start
```

### 2. Verificar Status
Acesse: http://localhost:3001/api/status

### 3. No Granobox
1. Vá em **Configurações > Impressora**
2. Clique em **Nova Configuração**
3. Selecione **Bluetooth** como tipo de conexão
4. Se o serviço estiver rodando, aparecerá o botão **"Escanear Dispositivos"**
5. Clique para encontrar impressoras automaticamente

## 📡 API Endpoints

### Serviço
- **GET /api/status** - Status do serviço
- **GET /** - Interface web de monitoramento

### Bluetooth
- **GET /api/bluetooth/scan** - Escanear impressoras Bluetooth
- **POST /api/bluetooth/test** - Testar conexão Bluetooth

### Fila de Impressão
- **POST /api/print/queue** - Adicionar à fila
- **GET /api/print/queue/status** - Status da fila
- **GET /api/print/queue/items** - Listar itens
- **DELETE /api/print/queue/clear** - Limpar fila

## 🔍 Descoberta Automática

O serviço procura por dispositivos com nomes que contenham:
- `printer`
- `pos`
- `thermal`
- `receipt`
- `epson`
- `star`
- `bixolon`

## ⚠️ Problemas Comuns

### "Erro ao escanear dispositivos"
- Verifique se o Bluetooth está ativo
- Execute como administrador (Windows) ou sudo (Linux)
- Verifique se não há outros programas usando Bluetooth

### "Serviço não disponível"
- Certifique-se que o serviço está rodando na porta 3001
- Verifique firewall/antivírus
- Tente reiniciar o serviço

### Dependências não instalam
- **Windows**: Instale Visual Studio Build Tools
- **Linux**: Instale `libbluetooth-dev`
- **macOS**: Instale Xcode Command Line Tools

## 🔒 Segurança

- O serviço roda apenas localmente (localhost:3001)
- Não aceita conexões externas
- Não armazena dados sensíveis
- Apenas escaneia dispositivos Bluetooth públicos

## 🚀 Executar como Serviço

### Windows (usando PM2):
```bash
npm install -g pm2
pm2 start server.js --name granobox-bluetooth
pm2 startup
pm2 save
```

### Linux (systemd):
```bash
# Criar arquivo de serviço
sudo nano /etc/systemd/system/granobox-bluetooth.service

# Conteúdo:
[Unit]
Description=Granobox Bluetooth Service
After=network.target

[Service]
Type=simple
User=granobox
WorkingDirectory=/path/to/bluetooth-service
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target

# Ativar serviço
sudo systemctl enable granobox-bluetooth
sudo systemctl start granobox-bluetooth
```

## 📝 Logs

```bash
# Ver logs em tempo real
npm run dev

# Logs do PM2
pm2 logs granobox-bluetooth

# Logs do systemd
sudo journalctl -u granobox-bluetooth -f
``` 