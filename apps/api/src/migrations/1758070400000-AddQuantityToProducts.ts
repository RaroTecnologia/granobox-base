import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuantityToProducts1758070400000 implements MigrationInterface {
  name = 'AddQuantityToProducts1758070400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna quantity já existe
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'quantity'
      );
    `);

    if (!columnExists[0].exists) {
      // Adicionar coluna quantity
      await queryRunner.query(`
        ALTER TABLE "products" 
        ADD COLUMN "quantity" numeric(10,2)
      `);
    }

    // Verificar se a coluna weightUnit já existe (pode ter sido criada com nome diferente)
    const weightUnitExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'weightUnit'
      );
    `);

    if (!weightUnitExists[0].exists) {
      // Verificar se existe coluna 'unit' e renomear para 'weightUnit'
      const unitExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'products' 
          AND column_name = 'unit'
        );
      `);

      if (unitExists[0].exists) {
        // Renomear coluna 'unit' para 'weightUnit'
        await queryRunner.query(`
          ALTER TABLE "products" 
          RENAME COLUMN "unit" TO "weightUnit"
        `);
      } else {
        // Criar coluna weightUnit se não existir
        await queryRunner.query(`
          ALTER TABLE "products" 
          ADD COLUMN "weightUnit" character varying(10)
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover coluna quantity
    await queryRunner.query(`
      ALTER TABLE "products" 
      DROP COLUMN IF EXISTS "quantity"
    `);

    // Renomear weightUnit de volta para unit se necessário
    const weightUnitExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'weightUnit'
      );
    `);

    if (weightUnitExists[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "products" 
        RENAME COLUMN "weightUnit" TO "unit"
      `);
    }
  }
}
