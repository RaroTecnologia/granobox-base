import express from 'express'
import net from 'net'
import cors from 'cors'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { SerialPort } from 'serialport'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// ===== Config persistence =====
const CONFIG_DIR = path.join(os.homedir(), '.granobox-print-agent')
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json')

function ensureDirSync(dir) {
  try { fs.mkdirSync(dir, { recursive: true }) } catch {}
}

function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    const data = JSON.parse(raw)
    if (!Array.isArray(data.profiles)) data.profiles = []
    if (!Array.isArray(data.bluetoothDevices)) data.bluetoothDevices = []
    return data
  } catch {
    return { ip: '', port: 9100, dpi: 203, profiles: [], bluetoothDevices: [] }
  }
}

function saveConfig(cfg) {
  ensureDirSync(CONFIG_DIR)
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2))
}

// ===== Bluetooth Functions =====
async function listBluetoothDevices() {
  try {
    const ports = await SerialPort.list()
    // Filtrar apenas dispositivos Bluetooth (geralmente têm nomes específicos)
    const bluetoothPorts = ports.filter(port => 
      port.manufacturer?.toLowerCase().includes('bluetooth') ||
      port.vendorId === '0a5c' || // Broadcom Bluetooth
      port.vendorId === '0bda' || // Realtek Bluetooth
      port.vendorId === '8086' || // Intel Bluetooth
      port.vendorId === '10d4' || // Texas Instruments Bluetooth
      port.path?.toLowerCase().includes('bluetooth') ||
      port.path?.toLowerCase().includes('bluetooth') ||
      port.path?.toLowerCase().includes('cu.') // macOS Bluetooth ports
    )
    
    return bluetoothPorts.map(port => ({
      path: port.path,
      manufacturer: port.manufacturer || 'Desconhecido',
      serialNumber: port.serialNumber || 'N/A',
      pnpId: port.pnpId || 'N/A',
      locationId: port.locationId || 'N/A',
      productId: port.productId || 'N/A',
      vendorId: port.vendorId || 'N/A'
    }))
  } catch (error) {
    console.error('Erro ao listar dispositivos Bluetooth:', error)
    return []
  }
}

async function sendToBluetooth(portPath, data, encoding = 'latin1') {
  return new Promise((resolve, reject) => {
    const port = new SerialPort({
      path: portPath,
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      autoOpen: false
    })

    port.on('error', (err) => {
      reject(new Error(`Erro na porta Bluetooth: ${err.message}`))
    })

    port.on('open', () => {
      console.log(`Porta Bluetooth ${portPath} aberta`)
      
      const buffer = Buffer.from(data, encoding)
      port.write(buffer, (err) => {
        if (err) {
          port.close()
          reject(new Error(`Erro ao escrever: ${err.message}`))
          return
        }
        
        // Aguardar um pouco para garantir que os dados sejam enviados
        setTimeout(() => {
          port.close()
          console.log(`Dados enviados via Bluetooth: ${buffer.length} bytes`)
          resolve(true)
        }, 100)
      })
    })

    port.open((err) => {
      if (err) {
        reject(new Error(`Erro ao abrir porta: ${err.message}`))
      }
    })
  })
}

// ===== Network Functions =====
function sendRawTcp({ host, port, payload, encoding = 'latin1' }) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    socket.setTimeout(5000)
    socket.once('error', reject)
    socket.once('timeout', () => reject(new Error('TCP timeout')))
    socket.connect(port, host, () => {
      socket.write(Buffer.from(payload, encoding), (err) => {
        if (err) return reject(err)
        setTimeout(() => { try { socket.end() } catch {} ; resolve(true) }, 50)
      })
    })
  })
}

// ===== Health & Config Endpoints =====
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'granobox-print-agent', 
    time: new Date().toISOString(), 
    config: loadConfig(),
    platform: os.platform(),
    arch: os.arch()
  })
})

app.get('/config', (req, res) => {
  res.json(loadConfig())
})

app.post('/config', (req, res) => {
  try {
    const current = loadConfig()
    const next = { ...current, ...(req.body || {}) }
    if (typeof next.port !== 'number' || !next.port) next.port = 9100
    saveConfig(next)
    res.json({ ok: true, config: next })
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) })
  }
})

// ===== Bluetooth Endpoints =====
app.get('/bluetooth/devices', async (req, res) => {
  try {
    const devices = await listBluetoothDevices()
    res.json({ devices })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/bluetooth/print', async (req, res) => {
  try {
    const { portPath, data, encoding = 'latin1', type = 'ZPL' } = req.body
    
    if (!portPath || !data) {
      return res.status(400).json({ error: 'portPath e data são obrigatórios' })
    }

    console.log(`Enviando ${type} para Bluetooth: ${portPath}`)
    await sendToBluetooth(portPath, data, encoding)
    
    res.json({ ok: true, message: `${type} enviado via Bluetooth` })
  } catch (error) {
    console.error('Erro na impressão Bluetooth:', error)
    res.status(500).json({ error: error.message })
  }
})

// ===== Profiles Endpoints =====
app.get('/profiles', (req, res) => {
  const cfg = loadConfig()
  res.json({ profiles: cfg.profiles || [] })
})

app.post('/profiles', (req, res) => {
  try {
    const { name, ip, port = 9100, type = 'ZPL', dpi = 203, widthDots, widthChars } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name obrigatório' })
    const cfg = loadConfig()
    const profiles = Array.isArray(cfg.profiles) ? cfg.profiles : []
    const idx = profiles.findIndex(p => p.name === name)
    const next = { name, ip: ip || '', port, type, dpi, widthDots, widthChars }
    if (idx >= 0) profiles[idx] = next; else profiles.push(next)
    cfg.profiles = profiles
    saveConfig(cfg)
    res.json({ ok: true, profile: next })
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) })
  }
})

app.delete('/profiles/:name', (req, res) => {
  try {
    const cfg = loadConfig()
    const before = cfg.profiles?.length || 0
    cfg.profiles = (cfg.profiles || []).filter(p => p.name !== req.params.name)
    saveConfig(cfg)
    res.json({ ok: true, removed: before - (cfg.profiles?.length || 0) })
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) })
  }
})

// ===== Print Endpoints =====
app.post('/print/zpl', async (req, res) => {
  try {
    let { ip, port, zpl, profile, bluetoothPort } = req.body || {}
    const cfg = loadConfig()
    
    // Se for Bluetooth
    if (bluetoothPort) {
      console.log('Enviando ZPL via Bluetooth:', bluetoothPort)
      await sendToBluetooth(bluetoothPort, zpl, 'latin1')
      return res.json({ ok: true, method: 'bluetooth' })
    }
    
    // Se for rede
    if (profile) {
      const p = (cfg.profiles || []).find(x => x.name === profile)
      if (p) { ip = ip || p.ip; port = port || p.port }
    }
    if (!ip) { ip = cfg.ip; port = port || cfg.port }
    if (!port) port = 9100
    if (!ip || !zpl) return res.status(400).json({ error: 'Campos obrigatórios ausentes: ip/zpl ou bluetoothPort' })
    
    await sendRawTcp({ host: ip, port, payload: zpl, encoding: 'latin1' })
    res.json({ ok: true, method: 'tcp' })
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) })
  }
})

app.post('/print/escpos', async (req, res) => {
  try {
    let { ip, port = 9100, dataBase64, profile, bluetoothPort } = req.body || {}
    const cfg = loadConfig()
    
    // Se for Bluetooth
    if (bluetoothPort) {
      console.log('Enviando ESC/POS via Bluetooth:', bluetoothPort)
      const raw = Buffer.from(dataBase64, 'base64')
      await sendToBluetooth(bluetoothPort, raw, 'binary')
      return res.json({ ok: true, method: 'bluetooth' })
    }
    
    // Se for rede
    if (profile) {
      const p = (cfg.profiles || []).find(x => x.name === profile)
      if (p) { ip = ip || p.ip; port = port || p.port }
    }
    if (!ip) { ip = cfg.ip; port = port || cfg.port }
    if (!ip || !dataBase64) return res.status(400).json({ error: 'Campos obrigatórios: ip/dataBase64 ou bluetoothPort' })
    
    const raw = Buffer.from(dataBase64, 'base64')
    await sendRawTcp({ host: ip, port, payload: raw, encoding: 'binary' })
    res.json({ ok: true, method: 'tcp' })
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) })
  }
})

// Simple UI
app.get('/', (req, res) => {
  const cfg = loadConfig()
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(`<!doctype html>
  <html><head><meta charset="utf-8"/><title>Granobox Print Agent</title>
  <style>
    body{font-family:sans-serif;max-width:800px;margin:24px auto;padding:0 16px}
    input,button,select{padding:8px;margin:4px;border:1px solid #ccc;border-radius:4px}
    button{background:#007AFF;color:white;cursor:pointer}
    button:hover{background:#0056CC}
    .section{margin:20px 0;padding:20px;border:1px solid #eee;border-radius:8px}
    .device-item{background:#f9f9f9;padding:10px;margin:5px 0;border-radius:4px;cursor:pointer}
    .device-item:hover{background:#e9e9e9}
    .status{color:#059669;font-weight:bold}
    .error{color:#DC2626}
    pre{background:#f5f5f5;padding:10px;border-radius:4px;overflow-x:auto}
  </style>
  </head><body>
  <h2>Granobox Print Agent</h2>
  <p>Status: <span id="status" class="status">carregando...</span></p>
  
  <div class="section">
    <h3>🔌 Configurar impressora de rede</h3>
    <label>IP: <input id="ip" value="${cfg.ip || ''}"/></label>
    <label>Porta: <input id="port" type="number" value="${cfg.port || 9100}"/></label>
    <button onclick="saveCfg()">Salvar</button>
  </div>

  <div class="section">
    <h3>📱 Dispositivos Bluetooth</h3>
    <button onclick="refreshBluetooth()">🔄 Atualizar lista</button>
    <div id="bluetoothDevices">Clique em "Atualizar lista" para ver dispositivos</div>
  </div>

  <div class="section">
    <h3>🖨️ Testar ZPL</h3>
    <label>Método: 
      <select id="zplMethod">
        <option value="tcp">Rede TCP</option>
        <option value="bluetooth">Bluetooth</option>
      </select>
    </label>
    <div id="zplBluetoothOptions" style="display:none">
      <label>Porta Bluetooth: <select id="zplBluetoothPort"></select></label>
    </div>
    <button onclick="testZpl()">Imprimir teste ZPL</button>
  </div>

  <div class="section">
    <h3>🧾 Testar ESC/POS (cupom)</h3>
    <label>Método: 
      <select id="escposMethod">
        <option value="tcp">Rede TCP</option>
        <option value="bluetooth">Bluetooth</option>
      </select>
    </label>
    <div id="escposBluetoothOptions" style="display:none">
      <label>Porta Bluetooth: <select id="escposBluetoothPort"></select></label>
    </div>
    <button onclick="testEscpos()">Imprimir teste ESC/POS</button>
  </div>

  <pre id="out"></pre>

  <script>
  // Inicialização
  fetch('/health').then(r=>r.json()).then(j=>{
    document.getElementById('status').textContent = j.ok?'✅ OK':'❌ NOK'
    document.getElementById('status').className = j.ok?'status':'error'
  })

  // Configuração
  function saveCfg(){
    const ip = document.getElementById('ip').value; 
    const port = parseInt(document.getElementById('port').value)||9100;
    fetch('/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ip,port})})
      .then(r=>r.json()).then(j=>{document.getElementById('out').textContent=JSON.stringify(j,null,2)})
  }

  // Bluetooth
  function refreshBluetooth(){
    document.getElementById('bluetoothDevices').innerHTML = '🔍 Procurando dispositivos...'
    fetch('/bluetooth/devices').then(r=>r.json()).then(j=>{
      if(j.devices && j.devices.length > 0) {
        const html = j.devices.map(d => 
          \`<div class="device-item" onclick="selectBluetoothPort('\${d.path}')">
            <strong>\${d.path}</strong><br>
            Fabricante: \${d.manufacturer}<br>
            Vendor ID: \${d.vendorId}
          </div>\`
        ).join('')
        document.getElementById('bluetoothDevices').innerHTML = html
        updateBluetoothPorts()
      } else {
        document.getElementById('bluetoothDevices').innerHTML = '❌ Nenhum dispositivo Bluetooth encontrado'
      }
    }).catch(e=>{
      document.getElementById('bluetoothDevices').innerHTML = '❌ Erro: ' + e.message
    })
  }

  function selectBluetoothPort(path) {
    console.log('Porta selecionada:', path)
  }

  function updateBluetoothPorts() {
    fetch('/bluetooth/devices').then(r=>r.json()).then(j=>{
      if(j.devices && j.devices.length > 0) {
        const options = j.devices.map(d => 
          \`<option value="\${d.path}">\${d.path} (\${d.manufacturer})</option>\`
        ).join('')
        document.getElementById('zplBluetoothPort').innerHTML = options
        document.getElementById('escposBluetoothPort').innerHTML = options
      }
    })
  }

  // Métodos de impressão
  document.getElementById('zplMethod').onchange = function() {
    document.getElementById('zplBluetoothOptions').style.display = 
      this.value === 'bluetooth' ? 'block' : 'none'
  }

  document.getElementById('escposMethod').onchange = function() {
    document.getElementById('escposBluetoothOptions').style.display = 
      this.value === 'bluetooth' ? 'block' : 'none'
  }

  // Teste ZPL
  function testZpl(){
    const method = document.getElementById('zplMethod').value
    const zpl = '^XA^CI27^PW400^LL400^LH16,0^CF0,40^FO0,16^FB368,1,0,L,0^FDETIQUETA VIA AGENT^FS^CF0,28^FO0,64^FB368,2,30,L,0^FD5x5 cm @ 203 dpi^FS^FO260,240^BQN,2,4^FDLA,AGENT-OK^FS^XZ'
    
    if(method === 'bluetooth') {
      const bluetoothPort = document.getElementById('zplBluetoothPort').value
      if(!bluetoothPort) {
        document.getElementById('out').textContent = '❌ Selecione uma porta Bluetooth'
        return
      }
      fetch('/print/zpl',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bluetoothPort,zpl})})
        .then(r=>r.json()).then(j=>{document.getElementById('out').textContent=JSON.stringify(j,null,2)})
        .catch(e=>{document.getElementById('out').textContent='❌ Erro: ' + e.message})
    } else {
      const port = parseInt(document.getElementById('port').value)||9100;
      fetch('/print/zpl',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({port,zpl})})
        .then(r=>r.json()).then(j=>{document.getElementById('out').textContent=JSON.stringify(j,null,2)})
        .catch(e=>{document.getElementById('out').textContent='❌ Erro: ' + e.message})
    }
  }

  // Teste ESC/POS
  function bytesToBase64(arr){ 
    let bin=''; 
    for (let i=0;i<arr.length;i++){ 
      bin+=String.fromCharCode(arr[i]); 
    } 
    return btoa(bin); 
  }

  function testEscpos(){
    const method = document.getElementById('escposMethod').value
    const ESC=0x1B, GS=0x1D; 
    const data = [];
    data.push(ESC,0x40); // init
    data.push(ESC,0x61,0x01); // center
    data.push(ESC,0x45,0x01); // bold on
    const t='TESTE ESC/POS'; 
    for (let i=0;i<t.length;i++) data.push(t.charCodeAt(i)); 
    data.push(0x0A);
    data.push(ESC,0x45,0x00, ESC,0x61,0x00); // bold off, left
    const lines=['Impressora via Agent','Data: '+new Date().toLocaleString('pt-BR'),'Cupom funcionando!'];
    for (const l of lines){ 
      for(let i=0;i<l.length;i++) data.push(l.charCodeAt(i)); 
      data.push(0x0A);
    } 
    data.push(0x0A,0x0A); // espaços
    data.push(GS,0x56,0x01); // corte parcial
    const dataBase64 = bytesToBase64(Uint8Array.from(data));
    
    if(method === 'bluetooth') {
      const bluetoothPort = document.getElementById('escposBluetoothPort').value
      if(!bluetoothPort) {
        document.getElementById('out').textContent = '❌ Selecione uma porta Bluetooth'
        return
      }
      fetch('/print/escpos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bluetoothPort,dataBase64})})
        .then(r=>r.json()).then(j=>{document.getElementById('out').textContent=JSON.stringify(j,null,2)})
        .catch(e=>{document.getElementById('out').textContent='❌ Erro: ' + e.message})
    } else {
      const port = parseInt(document.getElementById('port').value)||9100;
      fetch('/print/escpos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({port,dataBase64})})
        .then(r=>r.json()).then(j=>{document.getElementById('out').textContent=JSON.stringify(j,null,2)})
        .catch(e=>{document.getElementById('out').textContent='❌ Erro: ' + e.message})
    }
  }

  // Carregar dispositivos Bluetooth ao iniciar
  refreshBluetooth()
  </script>
  </body></html>`)
})

const PORT = process.env.PRINT_AGENT_PORT || 9123
app.listen(PORT, () => {
  console.log(`Granobox Print Agent rodando em http://127.0.0.1:${PORT}`)
})


