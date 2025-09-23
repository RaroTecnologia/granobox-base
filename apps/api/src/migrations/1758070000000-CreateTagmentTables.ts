import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTagmentTables1758070000000 implements MigrationInterface {
  name = 'CreateTagmentTables1758070000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para tipos de etiqueta
    await queryRunner.query(`
      CREATE TYPE "public"."template_associations_labeltype_enum" AS ENUM(
        'produto_manipulado', 
        'produto_pronto', 
        'recebimento', 
        'etiqueta_validade'
      )
    `);

    // Criar tabela de configurações Tagment
    await queryRunner.query(`
      CREATE TABLE "tagment_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customerId" character varying(100) NOT NULL,
        "apiKey" character varying(200),
        "isActive" boolean NOT NULL DEFAULT true,
        "settings" json,
        "clientId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tagment_configs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tagment_configs_clientId" UNIQUE ("clientId")
      )
    `);

    // Criar tabela de associações de templates
    await queryRunner.query(`
      CREATE TABLE "template_associations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "templateId" character varying(100) NOT NULL,
        "templateName" character varying(100) NOT NULL,
        "labelType" "public"."template_associations_labeltype_enum" NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "templateData" json,
        "clientId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_template_associations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_template_associations_client_labelType" UNIQUE ("clientId", "labelType")
      )
    `);

    // Adicionar foreign keys
    await queryRunner.query(`
      ALTER TABLE "tagment_configs" 
      ADD CONSTRAINT "FK_tagment_configs_clientId" 
      FOREIGN KEY ("clientId") 
      REFERENCES "clients"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "template_associations" 
      ADD CONSTRAINT "FK_template_associations_clientId" 
      FOREIGN KEY ("clientId") 
      REFERENCES "clients"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    // Criar índices
    await queryRunner.query(`
      CREATE INDEX "IDX_tagment_configs_clientId" 
      ON "tagment_configs" ("clientId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_template_associations_clientId" 
      ON "template_associations" ("clientId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_template_associations_labelType" 
      ON "template_associations" ("labelType")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX "public"."IDX_template_associations_labelType"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_template_associations_clientId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tagment_configs_clientId"`);

    // Remover foreign keys
    await queryRunner.query(`ALTER TABLE "template_associations" DROP CONSTRAINT "FK_template_associations_clientId"`);
    await queryRunner.query(`ALTER TABLE "tagment_configs" DROP CONSTRAINT "FK_tagment_configs_clientId"`);

    // Remover tabelas
    await queryRunner.query(`DROP TABLE "template_associations"`);
    await queryRunner.query(`DROP TABLE "tagment_configs"`);

    // Remover enum
    await queryRunner.query(`DROP TYPE "public"."template_associations_labeltype_enum"`);
  }
}




