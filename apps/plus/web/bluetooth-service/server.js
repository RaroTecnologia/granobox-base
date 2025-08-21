const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');
const WebSocket = require('ws');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const WS_PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configurar banco de dados local
const dbPath = path.join(__dirname, 'printer-queue.db');
const db = new sqlite3.Database(dbPath);

// Criar tabelas se não existirem
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS print_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    printer_config TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    printed_at DATETIME,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS printer_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    interface TEXT NOT NULL,
    config TEXT NOT NULL,
    active BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// WebSocket Server para comunicação em tempo real
const wss = new WebSocket.Server({ port: WS_PORT });

function broadcastToClients(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('🔗 Cliente WebSocket conectado');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Mensagem recebida:', data);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem WebSocket:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Cliente WebSocket desconectado');
  });
});

// Função para detectar sistema operacional e comando apropriado
function getBluetoothCommand() {
  const platform = os.platform();
  
  switch (platform) {
    case 'darwin': // macOS
      return 'system_profiler SPBluetoothDataType';
    case 'linux':
      return 'bluetoothctl devices';
    case 'win32': // Windows
      return 'powershell "Get-PnpDevice -Class Bluetooth"';
    default:
      return null;
  }
}

// Função para parsear dispositivos por plataforma
function parseBluetoothDevices(output, platform) {
  const devices = [];
  
  try {
    if (platform === 'darwin') {
      const lines = output.split('\n');
      let currentDevice = null;
      let collectingAddress = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Detectar dispositivos que terminam com ":"
        if (trimmed.endsWith(':') && !trimmed.includes('Bluetooth') && !trimmed.includes('Controller')) {
          const deviceName = trimmed.replace(':', '').trim();
          
          if (deviceName && isLikelyPrinter(deviceName)) {
            console.log(`🔍 Dispositivo candidato encontrado: ${deviceName}`);
            currentDevice = { 
              name: deviceName, 
              address: '', 
              type: 'printer'
            };
            collectingAddress = true;
          }
        }
        
        // Coletar endereço se estamos rastreando um dispositivo
        if (collectingAddress && currentDevice && trimmed.startsWith('Address:')) {
          currentDevice.address = trimmed.replace('Address:', '').trim();
          console.log(`📍 Endereço encontrado: ${currentDevice.address}`);
        }
        
        // Verificar se é realmente uma impressora
        if (collectingAddress && trimmed.includes('Minor Type: Printer')) {
          console.log(`✅ Confirmado como impressora: ${currentDevice?.name}`);
          if (currentDevice) {
            currentDevice.confirmed = true;
          }
        }
        
        // Fim da seção do dispositivo
        if (collectingAddress && (trimmed === '' || (i + 1 < lines.length && lines[i + 1].trim().endsWith(':')))) {
          if (currentDevice && currentDevice.address) {
            devices.push(currentDevice);
            console.log(`✅ Dispositivo adicionado: ${currentDevice.name} (${currentDevice.address})`);
          }
          currentDevice = null;
          collectingAddress = false;
        }
      }
      
      // Adicionar último dispositivo
      if (currentDevice && currentDevice.address) {
        devices.push(currentDevice);
        console.log(`✅ Último dispositivo adicionado: ${currentDevice.name} (${currentDevice.address})`);
      }
      
    } else if (platform === 'linux') {
      // Parsear saída do bluetoothctl
      const lines = output.split('\n');
      
      for (const line of lines) {
        const match = line.match(/Device\s+([A-F0-9:]{17})\s+(.+)/i);
        if (match) {
          const address = match[1];
          const name = match[2].trim();
          
          if (isLikelyPrinter(name)) {
            devices.push({
              address,
              name,
              type: 'printer'
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao parsear dispositivos:', error);
  }
  
  return devices;
}

// Função para verificar se um dispositivo parece ser uma impressora
function isLikelyPrinter(name) {
  if (!name) return false;
  
  const lowerName = name.toLowerCase();
  return (
    lowerName.includes('printer') ||
    lowerName.includes('pos') ||
    lowerName.includes('thermal') ||
    lowerName.includes('receipt') ||
    lowerName.includes('epson') ||
    lowerName.includes('star') ||
    lowerName.includes('bixolon') ||
    lowerName.includes('citizen') ||
    lowerName.includes('zebra') ||
    lowerName.includes('tm-') || // Epson TM series
    lowerName.includes('rp-') || // Star RP series
    lowerName.includes('tsp') || // Star TSP series
    lowerName.includes('jp80') || // JP80H-UWB encontrada
    lowerName.includes('jp-') // Outras impressoras JP series
  );
}

// Rota para escanear dispositivos Bluetooth
app.get('/api/bluetooth/scan', (req, res) => {
  console.log('🔍 Iniciando escaneamento Bluetooth...');
  
  const platform = os.platform();
  const command = getBluetoothCommand();
  
  if (!command) {
    return res.status(500).json({
      success: false,
      error: `Sistema operacional não suportado: ${platform}`
    });
  }
  
  exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Erro ao executar comando:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao escanear dispositivos Bluetooth',
        details: error.message,
        suggestion: 'Verifique se o Bluetooth está ativo e você tem permissões adequadas'
      });
    }
    
    const devices = parseBluetoothDevices(stdout, platform);
    
    console.log(`✅ Escaneamento concluído: ${devices.length} impressora(s) encontrada(s)`);
    
    res.json({
      success: true,
      devices: devices,
      message: `${devices.length} impressora(s) encontrada(s)`,
      platform: platform
    });
  });
});

// Rota para testar conexão com dispositivo específico
app.post('/api/bluetooth/test', (req, res) => {
  const { address, name } = req.body;
  
  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Endereço Bluetooth é obrigatório'
    });
  }

  console.log(`🔗 Testando impressão com ${name || address}...`);

  // Tentar encontrar o dispositivo serial correspondente
  const platform = os.platform();
  
  if (platform === 'darwin') {
    // No macOS, verificar se existe dispositivo serial
    const deviceName = name ? name.replace(/[^a-zA-Z0-9]/g, '') : null;
    const possiblePaths = [
      `/dev/tty.${deviceName}`,
      `/dev/tty.${name}`,
      '/dev/tty.Bluetooth-Incoming-Port'
    ].filter(Boolean);
    
    // Verificar qual dispositivo existe
    let devicePath = null;
    for (const path of possiblePaths) {
      try {
        const fs = require('fs');
        if (fs.existsSync(path)) {
          devicePath = path;
          break;
        }
      } catch (e) {
        // Continuar tentando
      }
    }
    
    if (!devicePath) {
      return res.status(404).json({
        success: false,
        error: 'Dispositivo serial não encontrado',
        suggestion: 'Verifique se a impressora está conectada e pareada',
        possiblePaths: possiblePaths
      });
    }
    
    console.log(`📱 Usando dispositivo: ${devicePath}`);
    
    // Tentar enviar comando de teste simples
    const testCommand = `echo "\\n\\n=== TESTE GRANOBOX ===\\nImpressora: ${name}\\nData: $(date)\\n\\n\\n" > "${devicePath}"`;
    
    exec(testCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erro no teste de impressão:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao enviar dados para impressora',
          details: error.message,
          devicePath: devicePath
        });
      }
      
      console.log('✅ Comando de teste enviado');
      res.json({
        success: true,
        message: 'Teste de impressão enviado com sucesso!',
        devicePath: devicePath,
        details: 'Verifique se a impressora imprimiu a página de teste'
      });
    });
    
  } else {
    return res.status(500).json({
      success: false,
      error: 'Teste de impressão não suportado nesta plataforma'
    });
  }
});

// Rota para obter dispositivos pareados do sistema
app.get('/api/bluetooth/paired', (req, res) => {
  console.log('🔍 Buscando dispositivos pareados...');
  
  const platform = os.platform();
  let command;
  
  if (platform === 'darwin') {
    command = 'system_profiler SPBluetoothDataType';
  } else if (platform === 'linux') {
    command = 'bluetoothctl paired-devices';
  } else {
    return res.status(500).json({
      success: false,
      error: 'Plataforma não suportada para listar dispositivos pareados'
    });
  }
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Erro ao buscar dispositivos pareados:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar dispositivos pareados',
        details: error.message
      });
    }
    
    const devices = parseBluetoothDevices(stdout, platform);
    
    res.json({
      success: true,
      devices: devices,
      message: `${devices.length} impressora(s) pareada(s) encontrada(s)`
    });
  });
});

// Função para adicionar item à fila de impressão
function addToQueue(content, printerConfig) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT INTO print_queue (content, printer_config) VALUES (?, ?)`);
    stmt.run(content, JSON.stringify(printerConfig), function(err) {
      if (err) {
        reject(err);
      } else {
        console.log(`📝 Item adicionado à fila: ID ${this.lastID}`);
        broadcastToClients({
          type: 'queue_updated',
          message: 'Novo item adicionado à fila'
        });
        resolve(this.lastID);
      }
    });
    stmt.finalize();
  });
}

// Função para processar fila de impressão
async function processQueue() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM print_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 5`, async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      for (const item of rows) {
        try {
          console.log(`🖨️ Processando item da fila: ID ${item.id}`);
          
          const printerConfig = JSON.parse(item.printer_config);
          const success = await printContent(item.content, printerConfig);
          
          if (success) {
            // Marcar como impresso
            db.run(`UPDATE print_queue SET status = 'printed', printed_at = CURRENT_TIMESTAMP WHERE id = ?`, [item.id]);
            console.log(`✅ Item ${item.id} impresso com sucesso`);
            
            broadcastToClients({
              type: 'print_success',
              itemId: item.id,
              message: 'Item impresso com sucesso'
            });
          } else {
            // Incrementar contador de tentativas
            const newRetryCount = item.retry_count + 1;
            if (newRetryCount >= 3) {
              db.run(`UPDATE print_queue SET status = 'failed', error_message = 'Máximo de tentativas excedido' WHERE id = ?`, [item.id]);
              console.log(`❌ Item ${item.id} falhou após 3 tentativas`);
            } else {
              db.run(`UPDATE print_queue SET retry_count = ? WHERE id = ?`, [newRetryCount, item.id]);
              console.log(`🔄 Item ${item.id} será tentado novamente (tentativa ${newRetryCount})`);
            }
            
            broadcastToClients({
              type: 'print_error',
              itemId: item.id,
              message: 'Erro na impressão'
            });
          }
        } catch (error) {
          console.error(`❌ Erro ao processar item ${item.id}:`, error);
          db.run(`UPDATE print_queue SET status = 'error', error_message = ? WHERE id = ?`, [error.message, item.id]);
        }
      }
      
      resolve();
    });
  });
}

// Função para imprimir conteúdo
async function printContent(content, printerConfig) {
  try {
    let printerType;
    switch (printerConfig.type) {
      case 'EPSON':
        printerType = PrinterTypes.EPSON;
        break;
      case 'STAR':
        printerType = PrinterTypes.STAR;
        break;
      default:
        printerType = PrinterTypes.EPSON;
    }

    const printer = new ThermalPrinter({
      type: printerType,
      interface: printerConfig.interface,
      characterSet: CharacterSet.PC860_PORTUGUESE,
      width: printerConfig.width || 48,
      removeSpecialCharacters: false,
    });

    // Processar conteúdo (assumindo que é JSON com comandos de impressão)
    const printData = JSON.parse(content);
    
    // Cabeçalho padrão
    printer.alignCenter();
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println('========== GRANOBOX ==========');
    printer.bold(false);
    printer.newLine();

    // Processar comandos do conteúdo
    for (const command of printData.commands) {
      switch (command.type) {
        case 'text':
          printer.println(command.text);
          break;
        case 'bold':
          printer.bold(command.value);
          break;
        case 'align':
          if (command.value === 'center') printer.alignCenter();
          else if (command.value === 'left') printer.alignLeft();
          else if (command.value === 'right') printer.alignRight();
          break;
        case 'newline':
          printer.newLine();
          break;
        case 'cut':
          printer.cut();
          break;
      }
    }

    // Rodapé padrão
    printer.newLine();
    printer.alignCenter();
    printer.setTextSize(0, 0);
    printer.println(`Impresso em: ${new Date().toLocaleString('pt-BR')}`);
    printer.newLine();
    printer.cut();

    await printer.execute();
    return true;
  } catch (error) {
    console.error('❌ Erro na impressão:', error);
    return false;
  }
}

// Processar fila a cada 10 segundos
cron.schedule('*/10 * * * * *', async () => {
  try {
    await processQueue();
  } catch (error) {
    console.error('❌ Erro ao processar fila:', error);
  }
});

// Rotas da API

// Status do serviço
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Serviço de impressão offline funcionando',
    timestamp: new Date().toISOString(),
    queue_status: 'active'
  });
});

// Adicionar à fila de impressão
app.post('/api/print/queue', async (req, res) => {
  try {
    const { content, printerConfig } = req.body;
    
    if (!content || !printerConfig) {
      return res.status(400).json({
        success: false,
        error: 'Conteúdo e configuração da impressora são obrigatórios'
      });
    }

    const queueId = await addToQueue(content, printerConfig);
    
    res.json({
      success: true,
      message: 'Item adicionado à fila de impressão',
      queueId: queueId
    });
  } catch (error) {
    console.error('❌ Erro ao adicionar à fila:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao adicionar à fila de impressão'
    });
  }
});

// Obter status da fila
app.get('/api/print/queue/status', (req, res) => {
  db.all(`SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'printed' THEN 1 ELSE 0 END) as printed,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM print_queue`, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao consultar fila'
      });
    }

    res.json({
      success: true,
      queue: rows[0]
    });
  });
});

// Obter itens da fila
app.get('/api/print/queue/items', (req, res) => {
  const limit = req.query.limit || 50;
  
  db.all(`SELECT id, status, created_at, printed_at, error_message, retry_count 
          FROM print_queue 
          ORDER BY created_at DESC 
          LIMIT ?`, [limit], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao consultar itens da fila'
      });
    }

    res.json({
      success: true,
      items: rows
    });
  });
});

// Limpar fila (itens impressos e com falha)
app.delete('/api/print/queue/clear', (req, res) => {
  db.run(`DELETE FROM print_queue WHERE status IN ('printed', 'failed')`, function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao limpar fila'
      });
    }

    res.json({
      success: true,
      message: `${this.changes} itens removidos da fila`
    });
  });
});

console.log(`🚀 Serviço de impressão offline iniciado:`);
console.log(`   - API: http://localhost:${PORT}`);
console.log(`   - WebSocket: ws://localhost:${WS_PORT}`);
console.log(`   - Banco de dados: ${dbPath}`);

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
}); 