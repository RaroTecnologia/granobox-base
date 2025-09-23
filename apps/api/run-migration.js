const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Executando migração para adicionar campos de configuração de impressoras Tagment...');

try {
  // Executar a migração usando TypeORM CLI
  const command = 'npx typeorm migration:run -d src/config/database.config.js';
  
  console.log(`📝 Comando: ${command}`);
  console.log('⏳ Executando migração...');
  
  execSync(command, { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('✅ Migração executada com sucesso!');
  console.log('🎯 Campos adicionados:');
  console.log('   - tagmentPrinterValidadeId');
  console.log('   - tagmentPrinterRotuloId');
  
} catch (error) {
  console.error('❌ Erro ao executar migração:', error.message);
  process.exit(1);
}


