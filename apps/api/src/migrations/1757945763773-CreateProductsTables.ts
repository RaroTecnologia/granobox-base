import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTables1757945763773 implements MigrationInterface {
  name = 'CreateProductsTables1757945763773';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create categories table
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

    // Create products table
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

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD CONSTRAINT "FK_categories_client" 
      FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD CONSTRAINT "FK_categories_parent" 
      FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD CONSTRAINT "FK_products_client" 
      FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD CONSTRAINT "FK_products_category" 
      FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_categories_client_id" ON "categories" ("client_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_categories_parent_id" ON "categories" ("parent_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_client_id" ON "products" ("client_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_category_id" ON "products" ("category_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_sku" ON "products" ("sku")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_barcode" ON "products" ("barcode")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_client"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_parent"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_client"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_products_barcode"`);
    await queryRunner.query(`DROP INDEX "IDX_products_sku"`);
    await queryRunner.query(`DROP INDEX "IDX_products_category_id"`);
    await queryRunner.query(`DROP INDEX "IDX_products_client_id"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_parent_id"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_client_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}