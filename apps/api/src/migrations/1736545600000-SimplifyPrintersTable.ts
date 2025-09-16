import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyPrintersTable1736545600000 implements MigrationInterface {
  name = 'SimplifyPrintersTable1736545600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Primeiro, vamos limpar a tabela existente e recriar com a estrutura simplificada
    await queryRunner.query(`DROP TABLE IF EXISTS "printers" CASCADE`);

    // Criar a nova tabela simplificada
    await queryRunner.query(`
      CREATE TABLE "printers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tagmentId" character varying(255) NOT NULL,
        "location" character varying(255) NOT NULL,
        "usage" text array NOT NULL DEFAULT '{validity}',
        "isActive" boolean NOT NULL DEFAULT true,
        "notes" text,
        "clientId" uuid NOT NULL,
        "createdById" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_printers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_printers_tagmentId" UNIQUE ("tagmentId")
      )
    `);

    // Adicionar foreign keys
    await queryRunner.query(`
      ALTER TABLE "printers" 
      ADD CONSTRAINT "FK_printers_clientId" 
      FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "printers" 
      ADD CONSTRAINT "FK_printers_createdById" 
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices e constraints
    await queryRunner.query(`DROP INDEX "IDX_printers_usage"`);
    await queryRunner.query(`DROP INDEX "IDX_printers_tagmentId"`);
    await queryRunner.query(`DROP INDEX "IDX_printers_clientId"`);
    await queryRunner.query(`ALTER TABLE "printers" DROP CONSTRAINT "FK_printers_createdById"`);
    await queryRunner.query(`ALTER TABLE "printers" DROP CONSTRAINT "FK_printers_clientId"`);

    // Remover tabela
    await queryRunner.query(`DROP TABLE "printers"`);
  }
}
