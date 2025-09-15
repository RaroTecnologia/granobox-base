import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhotosAndInvoiceToEquipment1704901200000 implements MigrationInterface {
  name = 'AddPhotosAndInvoiceToEquipment1704901200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "equipment" 
      ADD COLUMN "photos" json,
      ADD COLUMN "invoiceUrl" varchar(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "equipment" 
      DROP COLUMN "photos",
      DROP COLUMN "invoiceUrl"
    `);
  }
}
