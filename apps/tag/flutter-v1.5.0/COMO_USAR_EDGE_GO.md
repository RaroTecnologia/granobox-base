# 🖨️ Como Usar Edge-Go no App Flutter

## O que é o Edge-Go?

O **Edge-Go** é um dispositivo IoT baseado em ESP32-S3 que permite **impressão de etiquetas via USB** usando impressoras Zebra e similares. Diferente do sistema Edge-ESP que usa WebSocket, o Edge-Go:

- ✅ Conecta impressoras USB diretamente ao ESP32
- ✅ Recebe ZPL via TCP (porta 9100)
- ✅ Processa templates Tagment localmente
- ✅ Comunica com backend para autenticação e heartbeat
- ✅ Configuração via BLE (WiFi, IP, API Key)

## 📋 Fluxo de Configuração

### 1. **Preparar o Edge-Go**
- Conecte o Edge-Go à fonte de energia
- Conecte a impressora USB ao Edge-Go
- O dispositivo entrará em modo BLE automaticamente se não estiver configurado
- Nome BLE: `Edge-Go XXXXXX` (onde XXXXXX são os últimos 6 dígitos do MAC)

### 2. **No App Flutter - Aba Ajustes**
1. Clique em **"Gerenciar Edge-Go"**
2. Vá para aba **"Adotar Novo Edge-Go"**
3. Clique em **"Escanear Edge-Go"**
4. Aguarde a lista de dispositivos aparecer

### 3. **Adotar o Edge-Go**
1. Clique em **"Adotar"** no dispositivo desejado
2. Preencha os dados:
   - **WiFi SSID**: Nome da rede WiFi
   - **Senha WiFi**: Senha da rede
3. Clique em **"Adotar"**

### 4. **O que acontece nos bastidores:**
1. ✅ App gera API Key no backend (formato: `edg_XXXXXXXXXXXXXXXXXXXX`)
2. ✅ App envia configuração via BLE para o Edge-Go:
   ```json
   {
     "wifi_ssid": "MeuWiFi",
     "wifi_password": "senha123",
     "use_static_ip": false,
     "api_key": "edg_abc123...",
     "api_url": "https://api.granobox.com.br"
   }
   ```
3. ✅ Edge-Go salva configuração e reinicia
4. ✅ Edge-Go conecta ao WiFi
5. ✅ Edge-Go autentica com backend usando API Key
6. ✅ Edge-Go envia heartbeat a cada 30 segundos
7. ✅ Dispositivo aparece em **"Meus Edge-Go"**

## 📊 Monitoramento

### Aba "Meus Edge-Go"
Mostra todos os Edge-Go adotados com:
- **Status Online/Offline** (baseado em heartbeat)
- **API Key** (prefixo `edg_`)
- **Último sinal** (timestamp do último heartbeat)
- **Botão Excluir** (remove do backend)

## 🖨️ Impressão de Etiquetas

### Via TCP (Flutter → Edge-Go)
```dart
import 'dart:io';

// Conectar ao Edge-Go via TCP
final socket = await Socket.connect('192.168.1.100', 9100);

// Enviar ZPL
final zpl = '^XA^FO50,50^ADN,36,20^FDTeste Edge-Go!^FS^XZ';
socket.write(zpl);

// Fechar conexão
await socket.close();
```

### Fluxo Completo
1. **Flutter** processa template Tagment → Gera ZPL
2. **Flutter** envia ZPL via TCP (porta 9100) para Edge-Go
3. **Edge-Go** recebe ZPL via WiFi
4. **Edge-Go** envia ZPL para impressora via USB
5. **Impressora** imprime etiqueta
6. **Edge-Go** retorna status (sucesso/erro) via TCP

## 🔧 Configurações Avançadas

### IP Estático (Futuro)
Atualmente o Edge-Go usa **DHCP** automaticamente. Para configurar IP estático, será necessário:
- Adicionar campos no dialog de configuração
- Enviar via BLE: `use_static_ip: true` + IP/Gateway/Netmask

### Múltiplos Edge-Go
- Você pode ter vários Edge-Go na mesma rede
- Cada um terá seu próprio IP e API Key
- O app lista todos automaticamente em "Meus Edge-Go"

## 🐛 Troubleshooting

### Edge-Go não aparece no scan
- ✅ Certifique-se que o Bluetooth está ligado
- ✅ Verifique se o Edge-Go está próximo (< 10m)
- ✅ Se já foi configurado, ele não entrará em modo BLE
- ✅ Reinicie o Edge-Go para forçar modo BLE

### Edge-Go offline em "Meus Edge-Go"
- ✅ Verifique se WiFi está funcionando
- ✅ Verifique se o Edge-Go está ligado
- ✅ Aguarde até 30s (intervalo de heartbeat)
- ✅ Verifique logs do backend

### Impressão não funciona
- ✅ Verifique se impressora está conectada via USB
- ✅ Verifique se Edge-Go está online
- ✅ Teste enviar ZPL simples via TCP
- ✅ Verifique logs seriais do ESP32

## 📡 Arquitetura Técnica

```
┌─────────────┐     WiFi/TCP      ┌──────────────┐
│   Flutter   │ ←─────────────→  │   Edge-Go    │
│     App     │   (Porta 9100)    │   (ESP32)    │
└─────────────┘                   └──────────────┘
      │                                  │
      │                                  │ USB
      │                                  ↓
      │                            ┌──────────────┐
      │                            │  Impressora  │
      │                            │   Zebra/USB  │
      │                            └──────────────┘
      │
      │ HTTPS
      ↓
┌─────────────┐
│   Backend   │
│   Granobox  │
└─────────────┘
```

## 🔐 Segurança

- **API Key**: Cada Edge-Go tem uma API Key única (formato: `edg_XXXX`)
- **JWT Token**: Edge-Go recebe JWT após autenticação
- **Heartbeat**: Backend monitora dispositivos ativos
- **Fingerprint**: MAC address do WiFi (formato: `80:B5:4E:XX:XX:XX`)

## 📝 Notas Importantes

1. **BLE é apenas para configuração inicial** - Após adotado, toda comunicação é via WiFi
2. **API Key não pode ser alterada** - Se precisar reconfigurar, exclua e adote novamente
3. **Edge-Go vs Dot**: 
   - **Dot** = Leitor de QR Code via BLE
   - **Edge-Go** = Impressora USB via WiFi/TCP
4. **Edge-Go vs Edge-ESP**:
   - **Edge-ESP** = Impressora via WebSocket + templates no backend
   - **Edge-Go** = Impressora via TCP direto + processamento local



