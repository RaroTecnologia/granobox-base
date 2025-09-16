import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '69.62.93.36',
  port: parseInt(process.env.DB_PORT || '5482', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '37b981ba868ace4338cf',
  database: process.env.DB_NAME || 'granoboxtag',
  synchronize: false,
  logging: true,
});

async function checkTables() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const queryRunner = AppDataSource.createQueryRunner();

    // Verificar estrutura da tabela categories
    console.log('🔍 Verificando estrutura da tabela categories...');
    const categoriesColumns = await queryRunner.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'categories' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in categories table:');
    categoriesColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Verificar estrutura da tabela products
    console.log('\n🔍 Verificando estrutura da tabela products...');
    const productsColumns = await queryRunner.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in products table:');
    productsColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Conexão com o banco de dados encerrada.');
    }
  }
}

checkTables()
  .then(() => console.log('🎉 Verificação concluída!'))
  .catch((error) => console.error('💥 Erro fatal:', error));

