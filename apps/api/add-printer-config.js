const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/database_name',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addPrinterConfigFields() {
  console.log('🚀 Conectando ao banco de dados...');
  
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');
    
    console.log('📝 Adicionando campos de configuração de impressoras...');
    
    // Adicionar as colunas
    await client.query(`
      ALTER TABLE "clients" 
      ADD COLUMN IF NOT EXISTS "tagmentPrinterValidadeId" varchar(255),
      ADD COLUMN IF NOT EXISTS "tagmentPrinterRotuloId" varchar(255);
    `);
    
    console.log('✅ Campos adicionados com sucesso!');
    
    // Verificar se as colunas foram criadas
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      AND column_name IN ('tagmentPrinterValidadeId', 'tagmentPrinterRotuloId')
      ORDER BY column_name;
    `);
    
    console.log('📊 Verificação das colunas:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    if (result.rows.length === 2) {
      console.log('🎉 Migração concluída com sucesso!');
    } else {
      console.log('⚠️  Algumas colunas podem não ter sido criadas corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Conexão com banco de dados fechada');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addPrinterConfigFields()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no script:', error);
      process.exit(1);
    });
}

module.exports = { addPrinterConfigFields };


