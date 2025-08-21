# Configuração de Impressora Bluetooth

## Passo a Passo Completo

### 1. Preparação da Impressora
- Ligue a impressora térmica
- Ative o modo Bluetooth na impressora (consulte manual)
- Deixe a impressora em modo "pareável" (discoverable)

### 2. Pareamento no Sistema Operacional

#### Windows:
1. Vá em **Configurações > Dispositivos > Bluetooth**
2. Clique em "Adicionar Bluetooth ou outro dispositivo"
3. Selecione sua impressora na lista
4. Após pareamento, anote a porta COM criada (ex: COM3, COM4)

#### macOS:
1. Vá em **Preferências do Sistema > Bluetooth**
2. Clique em "Conectar" na sua impressora
3. Após pareamento, abra o Terminal e digite:
   ```bash
   ls /dev/tty.*
   ```
4. Procure por algo como `/dev/tty.SerialPort-1` ou similar

#### Linux:
1. Use o comando `bluetoothctl`:
   ```bash
   bluetoothctl
   scan on
   # Aguarde aparecer sua impressora
   pair XX:XX:XX:XX:XX:XX
   connect XX:XX:XX:XX:XX:XX
   exit
   ```
2. Verifique o dispositivo criado:
   ```bash
   ls /dev/rfcomm* ou ls /dev/tty*
   ```

### 3. Configuração no Granobox
- Selecione "Bluetooth" como tipo de conexão
- Digite o caminho do dispositivo serial:
  - **Windows**: `COM3`, `COM4`, etc.
  - **macOS**: `/dev/tty.SerialPort-1`
  - **Linux**: `/dev/rfcomm0`

### 4. Teste
- Use o botão "Testar" para verificar se a impressão funciona
- Se não funcionar, verifique se o dispositivo está conectado

## Problemas Comuns

### Impressora não aparece no pareamento
- Verifique se está em modo pareável
- Reinicie o Bluetooth do computador
- Aproxime a impressora do computador

### Erro "Device not found"
- Verifique se o caminho do dispositivo está correto
- Reconecte a impressora via Bluetooth
- Verifique se outro programa não está usando a impressora

### Impressão lenta ou com falhas
- Bluetooth pode ser mais lento que USB/TCP
- Mantenha a impressora próxima ao computador
- Evite interferências (outros dispositivos Bluetooth)

## Vantagens e Desvantagens

### Vantagens:
- ✅ Sem fios
- ✅ Mobilidade
- ✅ Fácil instalação após pareamento

### Desvantagens:
- ❌ Mais lento que USB/TCP
- ❌ Pode ter interferências
- ❌ Alcance limitado (10-30 metros)
- ❌ Consome mais bateria da impressora

## Recomendações
- Use Bluetooth apenas quando necessário mobilidade
- Para uso fixo, prefira TCP/IP ou USB
- Mantenha drivers Bluetooth atualizados
- Teste regularmente a conexão 