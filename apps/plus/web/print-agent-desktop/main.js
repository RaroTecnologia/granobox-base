// Main Electron process with tray and background server
const { app, Menu, Tray, shell, nativeImage } = require('electron')
const path = require('path')
let serverLoaded = false

let tray = null
let serverPort = process.env.PRINT_AGENT_PORT || '9123'

function startServer() {
  if (serverLoaded) return
  process.env.PRINT_AGENT_PORT = serverPort
  // roda o servidor dentro do processo principal do Electron
  require(path.join(__dirname, 'server.cjs'))
  serverLoaded = true
}

function stopServer() {
  // servidor incorporado; sem parada explícita
}

function buildMenu() {
  const openAtLogin = app.getLoginItemSettings().openAtLogin
  return Menu.buildFromTemplate([
    { label: 'Abrir painel', click: () => shell.openExternal(`http://127.0.0.1:${serverPort}/`) },
    { type: 'separator' },
    { label: 'Iniciar com o sistema', type: 'checkbox', checked: openAtLogin, click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked })
        // rebuild to reflect current state immediately
        tray.setContextMenu(buildMenu())
      }
    },
    { label: 'Reiniciar serviço', click: () => { stopServer(); setTimeout(startServer, 800) } },
    { type: 'separator' },
    { label: 'Sair', click: () => { stopServer(); app.quit() } }
  ])
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'iconTemplate.png')
  const image = nativeImage.createFromPath(iconPath)
  tray = new Tray(image)
  const contextMenu = buildMenu()
  tray.setToolTip('Granobox Print Agent')
  tray.setContextMenu(contextMenu)
}

app.on('ready', () => {
  app.dock && app.dock.hide()
  startServer()
  createTray()
})

app.on('window-all-closed', (e) => {
  e.preventDefault()
})

app.on('before-quit', () => {
  stopServer()
})


