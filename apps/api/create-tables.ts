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

async function createTables() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const queryRunner = AppDataSource.createQueryRunner();

    // Verificar se as tabelas existem
    const categoriesExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
      );
    `);

    const productsExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      );
    `);

    console.log('Categories table exists:', categoriesExists[0].exists);
    console.log('Products table exists:', productsExists[0].exists);

    if (!categoriesExists[0].exists) {
      console.log('🔨 Criando tabela categories...');
      await queryRunner.query(`
        CREATE TABLE "categories" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "name" character varying NOT NULL,
          "description" text,
          "color" character varying(7),
          "sortOrder" integer NOT NULL DEFAULT '0',
          "isActive" boolean NOT NULL DEFAULT true,
          "client_id" uuid NOT NULL,
          "parent_id" uuid,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_categories" PRIMARY KEY ("id")
        )
      `);
      console.log('✅ Tabela categories criada');
    }

    if (!productsExists[0].exists) {
      console.log('🔨 Criando tabela products...');
      await queryRunner.query(`
        CREATE TABLE "products" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "name" character varying NOT NULL,
          "description" text,
          "price" numeric(10,2),
          "sku" character varying(50),
          "barcode" character varying(50),
          "stock" integer NOT NULL DEFAULT '0',
          "minStock" integer NOT NULL DEFAULT '0',
          "unit" character varying(100),
          "brand" character varying(100),
          "model" character varying(100),
          "specifications" json,
          "images" json,
          "isActive" boolean NOT NULL DEFAULT true,
          "client_id" uuid NOT NULL,
          "category_id" uuid,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_products" PRIMARY KEY ("id")
        )
      `);
      console.log('✅ Tabela products criada');
    }

    // Verificar se as foreign keys existem
    const fkCategoriesClient = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_categories_client'
      );
    `);

    if (!fkCategoriesClient[0].exists) {
      console.log('🔗 Criando foreign key FK_categories_client...');
      await queryRunner.query(`
        ALTER TABLE "categories" 
        ADD CONSTRAINT "FK_categories_client" 
        FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE
      `);
    }

    const fkCategoriesParent = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_categories_parent'
      );
    `);

    if (!fkCategoriesParent[0].exists) {
      console.log('🔗 Criando foreign key FK_categories_parent...');
      await queryRunner.query(`
        ALTER TABLE "categories" 
        ADD CONSTRAINT "FK_categories_parent" 
        FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL
      `);
    }

    const fkProductsClient = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_products_client'
      );
    `);

    if (!fkProductsClient[0].exists) {
      console.log('🔗 Criando foreign key FK_products_client...');
      await queryRunner.query(`
        ALTER TABLE "products" 
        ADD CONSTRAINT "FK_products_client" 
        FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE
      `);
    }

    const fkProductsCategory = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_products_category'
      );
    `);

    if (!fkProductsCategory[0].exists) {
      console.log('🔗 Criando foreign key FK_products_category...');
      await queryRunner.query(`
        ALTER TABLE "products" 
        ADD CONSTRAINT "FK_products_category" 
        FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      `);
    }

    console.log('✅ Todas as tabelas e constraints criadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Conexão com o banco de dados encerrada.');
    }
  }
}

createTables()
  .then(() => console.log('🎉 Script executado com sucesso!'))
  .catch((error) => console.error('💥 Erro fatal:', error));



