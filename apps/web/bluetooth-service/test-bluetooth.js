const { exec } = require('child_process');
const os = require('os');

console.log('🔍 Testando descoberta Bluetooth...');
console.log(`Sistema: ${os.platform()}`);

// Comando para macOS
const command = 'system_profiler SPBluetoothDataType';

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }
  
  console.log('✅ Comando executado com sucesso!');
  console.log('\n📋 Saída do comando:');
  console.log(stdout);
  
  // Tentar parsear dispositivos
  const lines = stdout.split('\n');
  const devices = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes(':') && !trimmed.includes('Address') && !trimmed.includes('Services')) {
      const name = trimmed.replace(':', '').trim();
      if (name && name.length > 2) {
        console.log(`📱 Dispositivo encontrado: ${name}`);
        devices.push(name);
      }
    }
  }
  
  console.log(`\n🎉 Total de dispositivos: ${devices.length}`);
}); 