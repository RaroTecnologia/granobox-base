import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTables1736544000000 implements MigrationInterface {
  name = 'CreateProductsTables1736544000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela categories
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" character varying(500),
        "icon" character varying(50),
        "color" character varying(7),
        "clientId" uuid NOT NULL,
        "parentId" uuid,
        "level" integer NOT NULL DEFAULT 0,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")
      )
    `);

    // Criar tabela products
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" character varying(500),
        "code" character varying(50) NOT NULL,
        "type" character varying NOT NULL DEFAULT 'finished',
        "brand" character varying(100),
        "weight" numeric(10,3),
        "weightUnit" character varying(10),
        "salePrice" numeric(10,2),
        "costPrice" numeric(10,2),
        "currency" character varying(3) NOT NULL DEFAULT 'BRL',
        "shelfLifeAmbient" integer,
        "shelfLifeRefrigerated" integer,
        "shelfLifeFrozen" integer,
        "ingredients" text,
        "allergens" text,
        "nutritionalInfo" text,
        "notes" text,
        "clientId" uuid NOT NULL,
        "categoryId" uuid NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_code_client" UNIQUE ("code", "clientId")
      )
    `);

    // Criar enum para product type
    await queryRunner.query(`
      CREATE TYPE "products_type_enum" AS ENUM('raw_material', 'semi_finished', 'finished', 'manipulated')
    `);
    
    await queryRunner.query(`
      ALTER TABLE "products" ALTER COLUMN "type" TYPE "products_type_enum" USING "type"::"products_type_enum"
    `);

    // Adicionar foreign keys
    await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD CONSTRAINT "FK_categories_client" 
      FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD CONSTRAINT "FK_categories_parent" 
      FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD CONSTRAINT "FK_products_client" 
      FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD CONSTRAINT "FK_products_category" 
      FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Criar índices
    await queryRunner.query(`CREATE INDEX "IDX_categories_client" ON "categories" ("clientId")`);
    await queryRunner.query(`CREATE INDEX "IDX_categories_parent" ON "categories" ("parentId")`);
    await queryRunner.query(`CREATE INDEX "IDX_categories_active" ON "categories" ("isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_client" ON "products" ("clientId")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_category" ON "products" ("categoryId")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_code" ON "products" ("code")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_type" ON "products" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_active" ON "products" ("isActive")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_client"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_parent"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_client"`);

    // Remover tabelas
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "categories"`);

    // Remover enum
    await queryRunner.query(`DROP TYPE "products_type_enum"`);
  }
}











