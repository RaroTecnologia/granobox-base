const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const platform = os.platform();
const serviceName = 'granobox-printer';
const serviceDisplayName = 'Granobox Printer Service';
const serviceDescription = 'Serviço offline para impressoras térmicas do Granobox';
const currentDir = __dirname;
const nodeExecutable = process.execPath;
const scriptPath = path.join(currentDir, 'server.js');

console.log('🔧 Instalando Granobox Printer Service...');
console.log(`📍 Plataforma: ${platform}`);
console.log(`📂 Diretório: ${currentDir}`);

async function installWindows() {
  console.log('🪟 Instalando serviço no Windows...');
  
  // Criar arquivo batch para iniciar o serviço
  const batchContent = `@echo off
cd /d "${currentDir}"
"${nodeExecutable}" server.js
pause`;

  fs.writeFileSync(path.join(currentDir, 'start-service.bat'), batchContent);

  // Criar arquivo VBS para executar sem janela
  const vbsContent = `Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "${path.join(currentDir, 'start-service.bat')}" & Chr(34), 0
Set WshShell = Nothing`;

  fs.writeFileSync(path.join(currentDir, 'start-service.vbs'), vbsContent);

  console.log('✅ Arquivos de inicialização criados:');
  console.log(`   - ${path.join(currentDir, 'start-service.bat')}`);
  console.log(`   - ${path.join(currentDir, 'start-service.vbs')}`);
  console.log('');
  console.log('📋 Para iniciar automaticamente no Windows:');
  console.log('1. Pressione Win+R, digite "shell:startup" e pressione Enter');
  console.log('2. Copie o arquivo "start-service.vbs" para a pasta que abriu');
  console.log('3. O serviço iniciará automaticamente no próximo login');
}

async function installMacOS() {
  console.log('🍎 Instalando serviço no macOS...');
  
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.granobox.printer</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodeExecutable}</string>
        <string>${scriptPath}</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${currentDir}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${path.join(currentDir, 'service.log')}</string>
    <key>StandardErrorPath</key>
    <string>${path.join(currentDir, 'service.error.log')}</string>
</dict>
</plist>`;

  const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', 'com.granobox.printer.plist');
  
  try {
    // Criar diretório se não existir
    const launchAgentsDir = path.dirname(plistPath);
    if (!fs.existsSync(launchAgentsDir)) {
      fs.mkdirSync(launchAgentsDir, { recursive: true });
    }
    
    fs.writeFileSync(plistPath, plistContent);
    console.log(`✅ Arquivo plist criado: ${plistPath}`);
    
    // Carregar o serviço
    exec(`launchctl load ${plistPath}`, (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️ Erro ao carregar serviço (pode ser normal se já estiver carregado)');
        console.log('Execute manualmente: launchctl load ' + plistPath);
      } else {
        console.log('✅ Serviço carregado com sucesso!');
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar arquivo plist:', error);
  }
}

async function installLinux() {
  console.log('🐧 Instalando serviço no Linux...');
  
  const serviceContent = `[Unit]
Description=${serviceDescription}
After=network.target

[Service]
Type=simple
User=${os.userInfo().username}
WorkingDirectory=${currentDir}
ExecStart=${nodeExecutable} ${scriptPath}
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target`;

  const servicePath = `/etc/systemd/system/${serviceName}.service`;
  
  try {
    fs.writeFileSync(servicePath, serviceContent);
    console.log(`✅ Arquivo de serviço criado: ${servicePath}`);
    
    // Recarregar systemd e habilitar serviço
    exec('sudo systemctl daemon-reload', (error) => {
      if (error) {
        console.log('⚠️ Execute manualmente: sudo systemctl daemon-reload');
      }
      
      exec(`sudo systemctl enable ${serviceName}`, (error) => {
        if (error) {
          console.log(`⚠️ Execute manualmente: sudo systemctl enable ${serviceName}`);
        } else {
          console.log('✅ Serviço habilitado para inicialização automática!');
        }
        
        exec(`sudo systemctl start ${serviceName}`, (error) => {
          if (error) {
            console.log(`⚠️ Execute manualmente: sudo systemctl start ${serviceName}`);
          } else {
            console.log('✅ Serviço iniciado com sucesso!');
          }
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar arquivo de serviço:', error);
    console.log('💡 Execute como root: sudo node install-service.js');
  }
}

// Executar instalação baseada na plataforma
switch (platform) {
  case 'win32':
    installWindows();
    break;
  case 'darwin':
    installMacOS();
    break;
  case 'linux':
    installLinux();
    break;
  default:
    console.log(`❌ Plataforma não suportada: ${platform}`);
    process.exit(1);
}

console.log('');
console.log('🎉 Instalação concluída!');
console.log('');
console.log('📋 Comandos úteis:');
console.log('');

if (platform === 'win32') {
  console.log('• Iniciar manualmente: node server.js');
  console.log('• Iniciar em background: start-service.vbs');
} else if (platform === 'darwin') {
  console.log('• Iniciar manualmente: node server.js');
  console.log('• Parar serviço: launchctl unload ~/Library/LaunchAgents/com.granobox.printer.plist');
  console.log('• Iniciar serviço: launchctl load ~/Library/LaunchAgents/com.granobox.printer.plist');
  console.log('• Ver logs: tail -f service.log');
} else if (platform === 'linux') {
  console.log('• Iniciar manualmente: node server.js');
  console.log(`• Status: sudo systemctl status ${serviceName}`);
  console.log(`• Parar: sudo systemctl stop ${serviceName}`);
  console.log(`• Iniciar: sudo systemctl start ${serviceName}`);
  console.log(`• Ver logs: sudo journalctl -u ${serviceName} -f`);
}

console.log('');
console.log('🌐 Acesso:');
console.log('• API: http://localhost:3001');
console.log('• WebSocket: ws://localhost:3002');
console.log('• Status: http://localhost:3001/api/status'); 