import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrintersTable1736542800000 implements MigrationInterface {
  name = 'CreatePrintersTable1736542800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "printers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "ip" character varying(45) NOT NULL,
        "port" character varying(10) NOT NULL,
        "model" character varying(100) NOT NULL,
        "location" character varying(255),
        "usage" text,
        "status" character varying NOT NULL DEFAULT 'offline',
        "lastTestAt" TIMESTAMP WITH TIME ZONE,
        "lastTestResult" text,
        "createdById" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_printers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_printers_createdById" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Criar índices para melhor performance
    await queryRunner.query(`
      CREATE INDEX "IDX_PRINTERS_IP" ON "printers" ("ip")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_PRINTERS_STATUS" ON "printers" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_PRINTERS_CREATED_BY" ON "printers" ("createdById")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_PRINTERS_CREATED_BY"`);
    await queryRunner.query(`DROP INDEX "IDX_PRINTERS_STATUS"`);
    await queryRunner.query(`DROP INDEX "IDX_PRINTERS_IP"`);
    await queryRunner.query(`DROP TABLE "printers"`);
  }
}

