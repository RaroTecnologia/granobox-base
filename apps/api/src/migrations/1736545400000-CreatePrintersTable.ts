import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrintersTable1736545400000 implements MigrationInterface {
  name = 'CreatePrintersTable1736545400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "printers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tagmentId" character varying(255) NOT NULL,
        "tagmentName" character varying(255) NOT NULL,
        "tagmentIp" character varying(45) NOT NULL,
        "tagmentPort" integer NOT NULL,
        "tagmentProtocol" character varying(50) NOT NULL,
        "location" character varying(100) NOT NULL,
        "usage" text array NOT NULL DEFAULT '{validity}',
        "isActive" boolean NOT NULL DEFAULT true,
        "notes" text,
        "clientId" uuid NOT NULL,
        "createdBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_printers" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "printers" 
      ADD CONSTRAINT "FK_printers_clientId" 
      FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE
    `);

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
    await queryRunner.query(`DROP INDEX "IDX_printers_usage"`);
    await queryRunner.query(`DROP INDEX "IDX_printers_tagmentId"`);
    await queryRunner.query(`DROP INDEX "IDX_printers_clientId"`);
    await queryRunner.query(`ALTER TABLE "printers" DROP CONSTRAINT "FK_printers_clientId"`);
    await queryRunner.query(`DROP TABLE "printers"`);
  }
}
