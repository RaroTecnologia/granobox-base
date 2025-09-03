// Main Electron process with tray and background server
const { app, Menu, Tray, shell, nativeImage, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
let serverLoaded = false

let tray = null
let serverPort = process.env.PRINT_AGENT_PORT || '9123'

// Configurações do Auto-Update
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// Eventos do Auto-Update
autoUpdater.on('checking-for-update', () => {
  console.log('Verificando atualizações...')
})

autoUpdater.on('update-available', (info) => {
  console.log('Atualização disponível:', info)
  dialog.showMessageBox({
    type: 'info',
    title: 'Atualização Disponível',
    message: 'Uma nova versão do Granobox Print Agent está disponível!',
    detail: `Versão ${info.version} está pronta para download.`,
    buttons: ['Baixar Agora', 'Mais Tarde'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate()
    }
  })
})

autoUpdater.on('update-not-available', () => {
  console.log('Nenhuma atualização disponível')
})

autoUpdater.on('error', (err) => {
  console.log('Erro no auto-update:', err)
  dialog.showErrorBox('Erro de Atualização', 
    'Ocorreu um erro ao verificar atualizações:\n' + err.message)
})

autoUpdater.on('download-progress', (progressObj) => {
  console.log('Download progresso:', progressObj.percent + '%')
})

autoUpdater.on('update-downloaded', (info) => {
  console.log('Atualização baixada:', info)
  dialog.showMessageBox({
    type: 'info',
    title: 'Atualização Pronta',
    message: 'A atualização foi baixada e será instalada na próxima inicialização.',
    detail: `Versão ${info.version} está pronta para instalação.`,
    buttons: ['Reiniciar Agora', 'Mais Tarde'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall()
    }
  })
})

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

function checkForUpdates() {
  autoUpdater.checkForUpdates()
}

function buildMenu() {
  const openAtLogin = app.getLoginItemSettings().openAtLogin
  return Menu.buildFromTemplate([
    { label: 'Abrir painel', click: () => shell.openExternal(`http://127.0.0.1:${serverPort}/`) },
    { type: 'separator' },
    { label: 'Verificar atualizações', click: checkForUpdates },
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
  
  // Verificar atualizações automaticamente na inicialização
  setTimeout(() => {
    checkForUpdates()
  }, 3000) // Aguarda 3 segundos para o app inicializar
})

app.on('window-all-closed', (e) => {
  e.preventDefault()
})

app.on('before-quit', () => {
  stopServer()
})


