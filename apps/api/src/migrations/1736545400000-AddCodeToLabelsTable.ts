import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCodeToLabelsTable1736545400000 implements MigrationInterface {
  name = 'AddCodeToLabelsTable1736545400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna code
    await queryRunner.query(`
      ALTER TABLE "labels" 
      ADD COLUMN "code" character varying(10)
    `);

    // Gerar códigos amigáveis para registros existentes
    await queryRunner.query(`
      UPDATE "labels" 
      SET "code" = CONCAT(
        CHR(65 + FLOOR(RANDOM() * 25)::int),
        FLOOR(RANDOM() * 8 + 2)::text,
        CHR(65 + FLOOR(RANDOM() * 25)::int),
        FLOOR(RANDOM() * 8 + 2)::text,
        CHR(65 + FLOOR(RANDOM() * 25)::int),
        FLOOR(RANDOM() * 8 + 2)::text
      )
      WHERE "code" IS NULL
    `);

    // Tornar a coluna NOT NULL e UNIQUE
    await queryRunner.query(`
      ALTER TABLE "labels" 
      ALTER COLUMN "code" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "labels" 
      ADD CONSTRAINT "UQ_labels_code" UNIQUE ("code")
    `);

    // Criar índice para performance
    await queryRunner.query(`
      CREATE INDEX "IDX_labels_code" ON "labels" ("code")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_labels_code"`);
    await queryRunner.query(`ALTER TABLE "labels" DROP CONSTRAINT "UQ_labels_code"`);
    await queryRunner.query(`ALTER TABLE "labels" DROP COLUMN "code"`);
  }
}




