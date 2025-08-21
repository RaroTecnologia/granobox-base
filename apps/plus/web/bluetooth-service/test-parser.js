const { exec } = require('child_process');

// Função copiada do server.js
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
    lowerName.includes('jp80') // Impressora encontrada
  );
}

// Função copiada e corrigida do server.js
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
    }
  } catch (error) {
    console.error('Erro ao parsear:', error);
  }
  
  return devices;
}

// Testar
console.log('🧪 Testando parser de dispositivos Bluetooth...');

exec('system_profiler SPBluetoothDataType', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }
  
  console.log('📋 Parseando dispositivos...\n');
  
  const devices = parseBluetoothDevices(stdout, 'darwin');
  
  console.log('\n🎉 Resultado final:');
  console.log(`Total de impressoras encontradas: ${devices.length}`);
  
  devices.forEach((device, index) => {
    console.log(`${index + 1}. ${device.name}`);
    console.log(`   Endereço: ${device.address}`);
    console.log(`   Tipo: ${device.type}`);
    console.log('');
  });
}); 