const { DataSource } = require('typeorm');
const path = require('path');

// Configuração do banco de dados
const config = {
  type: 'postgres',
  host: process.env.DB_HOST || '69.62.93.36',
  port: parseInt(process.env.DB_PORT || '5482', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '37b981ba868ace4338cf',
  database: process.env.DB_NAME || 'granoboxtag',
  entities: [path.join(__dirname, 'dist/modules/**/*.entity.js')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

const dataSource = new DataSource(config);

async function runMigration() {
  try {
    console.log('🚀 Conectando ao banco de dados...');
    await dataSource.initialize();
    
    console.log('📝 Executando migração para adicionar campo quantity...');
    
    // Verificar se a coluna quantity já existe
    const columnExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'quantity'
      );
    `);

    if (!columnExists[0].exists) {
      console.log('➕ Adicionando coluna quantity...');
      await dataSource.query(`
        ALTER TABLE "products" 
        ADD COLUMN "quantity" numeric(10,2)
      `);
      console.log('✅ Coluna quantity adicionada com sucesso!');
    } else {
      console.log('ℹ️  Coluna quantity já existe');
    }

    // Verificar se a coluna weightUnit já existe
    const weightUnitExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'weightUnit'
      );
    `);

    if (!weightUnitExists[0].exists) {
      // Verificar se existe coluna 'unit' e renomear para 'weightUnit'
      const unitExists = await dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'products' 
          AND column_name = 'unit'
        );
      `);

      if (unitExists[0].exists) {
        console.log('🔄 Renomeando coluna unit para weightUnit...');
        await dataSource.query(`
          ALTER TABLE "products" 
          RENAME COLUMN "unit" TO "weightUnit"
        `);
        console.log('✅ Coluna renomeada com sucesso!');
      } else {
        console.log('➕ Adicionando coluna weightUnit...');
        await dataSource.query(`
          ALTER TABLE "products" 
          ADD COLUMN "weightUnit" character varying(10)
        `);
        console.log('✅ Coluna weightUnit adicionada com sucesso!');
      }
    } else {
      console.log('ℹ️  Coluna weightUnit já existe');
    }

    // Verificar estrutura final da tabela
    console.log('🔍 Verificando estrutura da tabela products...');
    const result = await dataSource.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('quantity', 'weightUnit', 'unit', 'weight')
      ORDER BY column_name;
    `);
    
    console.log('📊 Colunas relacionadas a peso e quantidade:');
    console.table(result);
    
    console.log('✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runMigration();
