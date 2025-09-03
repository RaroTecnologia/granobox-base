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
app.use(express.static(path.join(__dirname, 'public')))

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

// Rota principal para servir o HTML moderno
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

const PORT = process.env.PRINT_AGENT_PORT || 9123
app.listen(PORT, () => { console.log(`Granobox Print Agent rodando em http://127.0.0.1:${PORT}`) })
