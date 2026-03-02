import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReceivingFieldsToSupplyRolls1772100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE supply_rolls
        ADD COLUMN IF NOT EXISTS "supplierInvoice" varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS "receivedAt" timestamptz NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE supply_rolls
        DROP COLUMN IF EXISTS "supplierInvoice",
        DROP COLUMN IF EXISTS "receivedAt";
    `);
  }
}
