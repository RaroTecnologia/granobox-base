import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImportBatchIdToProducts1774500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "importBatchId" uuid NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_products_importBatchId" ON "products"("importBatchId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "importBatchId" uuid NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_categories_importBatchId" ON "categories"("importBatchId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_categories_importBatchId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "importBatchId"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_products_importBatchId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "importBatchId"`,
    );
  }
}
