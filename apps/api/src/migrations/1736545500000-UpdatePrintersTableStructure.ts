import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePrintersTableStructure1736545500000 implements MigrationInterface {
  name = 'UpdatePrintersTableStructure1736545500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Primeiro, vamos adicionar as novas colunas
    await queryRunner.query(`
      ALTER TABLE "printers" 
      ADD COLUMN "tagmentId" character varying(255),
      ADD COLUMN "tagmentName" character varying(255),
      ADD COLUMN "tagmentIp" character varying(45),
      ADD COLUMN "tagmentPort" integer,
      ADD COLUMN "tagmentProtocol" character varying(50),
      ADD COLUMN "clientId" uuid,
      ADD COLUMN "isActive" boolean DEFAULT true,
      ADD COLUMN "notes" text
    `);

    // Criar o enum para PrinterUsage
    await queryRunner.query(`
      CREATE TYPE "printers_usage_enum" AS ENUM('validity', 'label')
    `);

    // Alterar a coluna usage para usar o novo enum e ser array
    await queryRunner.query(`
      ALTER TABLE "printers" 
      ALTER COLUMN "usage" TYPE text[] USING CASE 
        WHEN "usage" IS NULL THEN ARRAY[]::text[]
        ELSE ARRAY["usage"]::text[]
      END
    `);

    // Adicionar constraint para o array de usage
    await queryRunner.query(`
      ALTER TABLE "printers" 
      ADD CONSTRAINT "CHK_printers_usage" 
      CHECK (array_length("usage", 1) IS NULL OR "usage" <@ ARRAY['validity', 'label']::text[])
    `);

    // Adicionar foreign key para clientId
    await queryRunner.query(`
      ALTER TABLE "printers" 
      ADD CONSTRAINT "FK_printers_clientId" 
      FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE
    `);

    // Criar índices
    await queryRunner.query(`
      CREATE INDEX "IDX_printers_clientId" ON "printers" ("clientId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_printers_tagmentId" ON "printers" ("tagmentId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_printers_usage" ON "printers" USING GIN ("usage")
    `);

    // Migrar dados existentes (se houver)
    await queryRunner.query(`
      UPDATE "printers" 
      SET 
        "tagmentName" = "name",
        "tagmentIp" = "ip",
        "tagmentPort" = "port"::integer,
        "tagmentProtocol" = 'zpl',
        "usage" = ARRAY['validity']::text[],
        "isActive" = CASE WHEN "status" = 'online' THEN true ELSE false END
      WHERE "tagmentId" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign key e índices
    await queryRunner.query(`DROP INDEX "IDX_printers_usage"`);
    await queryRunner.query(`DROP INDEX "IDX_printers_tagmentId"`);
    await queryRunner.query(`DROP INDEX "IDX_printers_clientId"`);
    await queryRunner.query(`ALTER TABLE "printers" DROP CONSTRAINT "FK_printers_clientId"`);
    await queryRunner.query(`ALTER TABLE "printers" DROP CONSTRAINT "CHK_printers_usage"`);

    // Remover colunas adicionadas
    await queryRunner.query(`
      ALTER TABLE "printers" 
      DROP COLUMN "tagmentId",
      DROP COLUMN "tagmentName", 
      DROP COLUMN "tagmentIp",
      DROP COLUMN "tagmentPort",
      DROP COLUMN "tagmentProtocol",
      DROP COLUMN "clientId",
      DROP COLUMN "isActive",
      DROP COLUMN "notes"
    `);

    // Reverter usage para text simples
    await queryRunner.query(`
      ALTER TABLE "printers" 
      ALTER COLUMN "usage" TYPE text USING "usage"[1]
    `);

    // Remover enum
    await queryRunner.query(`DROP TYPE "printers_usage_enum"`);
  }
}
