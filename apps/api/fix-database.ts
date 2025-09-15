import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '69.62.93.36',
  port: parseInt(process.env.DB_PORT || '5482', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '37b981ba868ace4338cf',
  database: process.env.DB_NAME || 'granoboxtag',
  entities: [join(__dirname, 'src/**/*.entity{.ts,.js}')],
  synchronize: false,
  logging: true,
});

async function fixDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const queryRunner = AppDataSource.createQueryRunner();

    // 1. Limpar dados problemáticos
    console.log('🧹 Limpando dados problemáticos...');
    await queryRunner.query(`DELETE FROM subscriptions WHERE "client_id" IS NULL;`);
    await queryRunner.query(`DELETE FROM operations WHERE "client_id" IS NULL;`);
    
    // 2. Verificar se existe pelo menos um cliente
    const clientCount = await queryRunner.query(`SELECT COUNT(*) FROM clients;`);
    if (clientCount[0].count === '0') {
      console.log('⚠️  Nenhum cliente encontrado. Criando cliente padrão...');
      await queryRunner.query(`
        INSERT INTO clients (id, name, email, phone, "isActive", "createdAt", "updatedAt") 
        VALUES (uuid_generate_v4(), 'Cliente Padrão', 'cliente@padrao.com', '(11) 99999-9999', true, NOW(), NOW())
      `);
    }

    // 3. Atualizar registros órfãos com o primeiro cliente disponível
    const firstClient = await queryRunner.query(`SELECT id FROM clients LIMIT 1;`);
    if (firstClient.length > 0) {
      const clientId = firstClient[0].id;
      console.log(`🔄 Atualizando registros órfãos com cliente ID: ${clientId}`);
      
      await queryRunner.query(`UPDATE subscriptions SET "client_id" = $1 WHERE "client_id" IS NULL;`, [clientId]);
      await queryRunner.query(`UPDATE operations SET "client_id" = $1 WHERE "client_id" IS NULL;`, [clientId]);
    }

    // 4. Adicionar colunas que podem estar faltando (sem NOT NULL primeiro)
    console.log('🔧 Adicionando colunas necessárias...');
    
    try {
      await queryRunner.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS "client_id" uuid;`);
      await queryRunner.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS "plan_id" uuid;`);
      await queryRunner.query(`ALTER TABLE operations ADD COLUMN IF NOT EXISTS "client_id" uuid;`);
      await queryRunner.query(`ALTER TABLE operations ADD COLUMN IF NOT EXISTS "subscription_id" uuid;`);
      await queryRunner.query(`ALTER TABLE operations ADD COLUMN IF NOT EXISTS "type" character varying;`);
      await queryRunner.query(`ALTER TABLE operations ADD COLUMN IF NOT EXISTS "metadata" json;`);
      await queryRunner.query(`ALTER TABLE operations ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP;`);
      await queryRunner.query(`ALTER TABLE operations ADD COLUMN IF NOT EXISTS "failedAt" TIMESTAMP;`);
      await queryRunner.query(`ALTER TABLE operations ADD COLUMN IF NOT EXISTS "errorMessage" text;`);
    } catch (error) {
      console.log('ℹ️  Algumas colunas já existem, continuando...');
    }

    // 5. Garantir que todos os registros tenham clientId válido
    const firstClientId = await queryRunner.query(`SELECT id FROM clients LIMIT 1;`);
    if (firstClientId.length > 0) {
      await queryRunner.query(`UPDATE subscriptions SET "client_id" = $1 WHERE "client_id" IS NULL;`, [firstClientId[0].id]);
      await queryRunner.query(`UPDATE operations SET "client_id" = $1 WHERE "client_id" IS NULL;`, [firstClientId[0].id]);
    }

    // 6. Agora fazer as colunas NOT NULL
    console.log('🔒 Aplicando restrições NOT NULL...');
    await queryRunner.query(`ALTER TABLE subscriptions ALTER COLUMN "client_id" SET NOT NULL;`);
    await queryRunner.query(`ALTER TABLE operations ALTER COLUMN "client_id" SET NOT NULL;`);
    await queryRunner.query(`ALTER TABLE operations ALTER COLUMN "type" SET NOT NULL;`);

    // 7. Adicionar valores padrão para type se necessário
    await queryRunner.query(`UPDATE operations SET "type" = 'operation' WHERE "type" IS NULL OR "type" = '';`);

    // 8. Adicionar constraints de foreign key
    console.log('🔗 Adicionando foreign keys...');
    try {
      await queryRunner.query(`ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS "FK_subscriptions_client";`);
      await queryRunner.query(`ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS "FK_subscriptions_plan";`);
      await queryRunner.query(`ALTER TABLE operations DROP CONSTRAINT IF EXISTS "FK_operations_client";`);
      await queryRunner.query(`ALTER TABLE operations DROP CONSTRAINT IF EXISTS "FK_operations_subscription";`);
      
      await queryRunner.query(`ALTER TABLE subscriptions ADD CONSTRAINT "FK_subscriptions_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE;`);
      await queryRunner.query(`ALTER TABLE subscriptions ADD CONSTRAINT "FK_subscriptions_plan" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL;`);
      await queryRunner.query(`ALTER TABLE operations ADD CONSTRAINT "FK_operations_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE;`);
      await queryRunner.query(`ALTER TABLE operations ADD CONSTRAINT "FK_operations_subscription" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL;`);
    } catch (error) {
      console.log('ℹ️  Algumas foreign keys já existem, continuando...');
    }

    console.log('✅ Banco de dados corrigido com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir banco de dados:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

// Executar o script
fixDatabase()
  .then(() => {
    console.log('🎉 Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
