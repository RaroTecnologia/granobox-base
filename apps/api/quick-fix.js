// Script rápido para adicionar os campos necessários
// Execute: node quick-fix.js

console.log('🚀 Adicionando campos de configuração de impressoras Tagment...');

// SQL para executar diretamente no banco
const sql = `
ALTER TABLE "clients" 
ADD COLUMN IF NOT EXISTS "tagmentPrinterValidadeId" varchar(255),
ADD COLUMN IF NOT EXISTS "tagmentPrinterRotuloId" varchar(255);
`;

console.log('📝 SQL para executar no banco de dados:');
console.log('=' * 50);
console.log(sql);
console.log('=' * 50);
console.log('');
console.log('🔧 Instruções:');
console.log('1. Acesse o banco de dados de produção');
console.log('2. Execute o SQL acima');
console.log('3. Verifique se as colunas foram criadas com:');
console.log('');
console.log(`SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('tagmentPrinterValidadeId', 'tagmentPrinterRotuloId');`);
console.log('');
console.log('✅ Após executar, o login voltará a funcionar!');


