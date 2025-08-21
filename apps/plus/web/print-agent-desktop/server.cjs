// Server code (CJS) embedding the existing Express agent
const express = require('express')
const net = require('net')
const cors = require('cors')
const os = require('os')
const path = require('path')
const fs = require('fs')

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const CONFIG_DIR = path.join(os.homedir(), '.granobox-print-agent')
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json')

function ensureDirSync(dir) { try { fs.mkdirSync(dir, { recursive: true }) } catch {} }
function loadConfig() {
  try { const raw = fs.readFileSync(CONFIG_PATH, 'utf-8'); const data = JSON.parse(raw); if (!Array.isArray(data.profiles)) data.profiles = []; return data } catch { return { ip: '', port: 9100, dpi: 203, profiles: [] } }
}
function saveConfig(cfg) { ensureDirSync(CONFIG_DIR); fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2)) }

function sendRawTcp({ host, port, payload, encoding = 'latin1' }) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket(); socket.setTimeout(5000)
    socket.once('error', reject); socket.once('timeout', () => reject(new Error('TCP timeout')))
    socket.connect(port, host, () => {
      const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, encoding)
      socket.write(buf, (err) => { if (err) return reject(err); setTimeout(() => { try { socket.end() } catch {} ; resolve(true) }, 50) })
    })
  })
}

app.get('/health', (req, res) => { res.json({ ok: true, service: 'granobox-print-agent', time: new Date().toISOString(), config: loadConfig() }) })
app.get('/config', (req, res) => { res.json(loadConfig()) })
app.post('/config', (req, res) => { try { const current = loadConfig(); const next = { ...current, ...(req.body || {}) }; if (typeof next.port !== 'number' || !next.port) next.port = 9100; saveConfig(next); res.json({ ok: true, config: next }) } catch (e) { res.status(500).json({ error: e?.message || String(e) }) } })
app.get('/profiles', (req, res) => { const cfg = loadConfig(); res.json({ profiles: cfg.profiles || [] }) })
app.post('/profiles', (req, res) => { try { const { name, ip, port = 9100, type = 'ZPL', dpi = 203, widthDots, widthChars } = req.body || {}; if (!name) return res.status(400).json({ error: 'name obrigatório' }); const cfg = loadConfig(); const profiles = Array.isArray(cfg.profiles) ? cfg.profiles : []; const idx = profiles.findIndex(p => p.name === name); const next = { name, ip: ip || '', port, type, dpi, widthDots, widthChars }; if (idx >= 0) profiles[idx] = next; else profiles.push(next); cfg.profiles = profiles; saveConfig(cfg); res.json({ ok: true, profile: next }) } catch (e) { res.status(500).json({ error: e?.message || String(e) }) } })
app.delete('/profiles/:name', (req, res) => { try { const cfg = loadConfig(); const before = cfg.profiles?.length || 0; cfg.profiles = (cfg.profiles || []).filter(p => p.name !== req.params.name); saveConfig(cfg); res.json({ ok: true, removed: before - (cfg.profiles?.length || 0) }) } catch (e) { res.status(500).json({ error: e?.message || String(e) }) } })
app.post('/print/zpl', async (req, res) => { try { let { ip, port, zpl, profile } = req.body || {}; const cfg = loadConfig(); if (profile) { const p = (cfg.profiles || []).find(x => x.name === profile); if (p) { ip = ip || p.ip; port = port || p.port } } if (!ip) { ip = cfg.ip; port = port || cfg.port } if (!port) port = 9100; if (!ip || !zpl) return res.status(400).json({ error: 'Campos obrigatórios ausentes: ip/zpl' }); await sendRawTcp({ host: ip, port, payload: zpl, encoding: 'latin1' }); res.json({ ok: true }) } catch (e) { res.status(500).json({ error: e?.message || String(e) }) } })
app.post('/print/escpos', async (req, res) => { try { let { ip, port = 9100, dataBase64, profile } = req.body || {}; const cfg = loadConfig(); if (profile) { const p = (cfg.profiles || []).find(x => x.name === profile); if (p) { ip = ip || p.ip; port = port || p.port } } if (!ip) { ip = cfg.ip; port = port || cfg.port } if (!ip || !dataBase64) return res.status(400).json({ error: 'Campos obrigatórios: ip/dataBase64' }); const raw = Buffer.from(dataBase64, 'base64'); await sendRawTcp({ host: ip, port, payload: raw, encoding: 'binary' }); res.json({ ok: true }) } catch (e) { res.status(500).json({ error: e?.message || String(e) }) } })
app.get('/', (req, res) => { const cfg = loadConfig(); res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(`<!doctype html><html><head><meta charset="utf-8"/><title>Granobox Print Agent</title><style>body{font-family:sans-serif;max-width:720px;margin:24px auto;padding:0 16px}input,button{padding:8px;margin:4px}</style></head><body><h2>Granobox Print Agent</h2><p>Status: <span id="status">carregando...</span></p><h3>Configurar impressora</h3><label>IP: <input id="ip" value="${cfg.ip || ''}"/></label><label>Porta: <input id="port" type="number" value="${cfg.port || 9100}"/></label><button onclick="saveCfg()">Salvar</button><h3>Testar ZPL</h3><button onclick="testZpl()">Imprimir teste</button><h3>Testar ESC/POS (cupom)</h3><button onclick="testEscpos()">Imprimir teste ESC/POS</button><pre id="out"></pre><script>fetch('/health').then(r=>r.json()).then(j=>{document.getElementById('status').textContent=j.ok?'OK':'NOK'});function saveCfg(){const ip=document.getElementById('ip').value;const port=parseInt(document.getElementById('port').value)||9100;fetch('/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ip,port})}).then(r=>r.json()).then(j=>{document.getElementById('out').textContent=JSON.stringify(j,null,2)})}function bytesToBase64(arr){let bin='';for(let i=0;i<arr.length;i++){bin+=String.fromCharCode(arr[i]);}return btoa(bin);}function testZpl(){const port=parseInt(document.getElementById('port').value)||9100;const zpl='^XA^CI27^PW400^LL400^LH16,0^CF0,40^FO0,16^FB368,1,0,L,0^FDETIQUETA VIA AGENT^FS^CF0,28^FO0,64^FB368,2,30,L,0^FD5x5 cm @ 203 dpi^FS^FO260,240^BQN,2,4^FDLA,AGENT-OK^FS^XZ';fetch('/print/zpl',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({port,zpl})}).then(r=>r.json()).then(j=>{document.getElementById('out').textContent=JSON.stringify(j,null,2)}).catch(e=>{document.getElementById('out').textContent=String(e)})}function testEscpos(){const port=parseInt(document.getElementById('port').value)||9100;const ESC=0x1B,GS=0x1D;const data=[];data.push(ESC,0x40);data.push(ESC,0x61,0x01);data.push(ESC,0x45,0x01);const t='TESTE ESC/POS';for(let i=0;i<t.length;i++)data.push(t.charCodeAt(i));data.push(0x0A);data.push(ESC,0x45,0x00,ESC,0x61,0x00);const lines=['Impressora via Agent','Data: '+new Date().toLocaleString('pt-BR'),'Cupom funcionando!'];for(const l of lines){for(let i=0;i<l.length;i++)data.push(l.charCodeAt(i));data.push(0x0A);}data.push(0x0A,0x0A);data.push(GS,0x56,0x01);const dataBase64=bytesToBase64(Uint8Array.from(data));fetch('/print/escpos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({port,dataBase64})}).then(r=>r.json()).then(j=>{document.getElementById('out').textContent=JSON.stringify(j,null,2)}).catch(e=>{document.getElementById('out').textContent=String(e)})}</script></body></html>`) })

const PORT = process.env.PRINT_AGENT_PORT || 9123
app.listen(PORT, () => { console.log(`Granobox Print Agent rodando em http://127.0.0.1:${PORT}`) })



