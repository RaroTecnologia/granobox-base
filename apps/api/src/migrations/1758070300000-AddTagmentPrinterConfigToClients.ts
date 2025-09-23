import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTagmentPrinterConfigToClients1758070300000 implements MigrationInterface {
  name = 'AddTagmentPrinterConfigToClients1758070300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clients" 
      ADD COLUMN "tagmentPrinterValidadeId" varchar(255),
      ADD COLUMN "tagmentPrinterRotuloId" varchar(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clients" 
      DROP COLUMN "tagmentPrinterValidadeId",
      DROP COLUMN "tagmentPrinterRotuloId"
    `);
  }
}


