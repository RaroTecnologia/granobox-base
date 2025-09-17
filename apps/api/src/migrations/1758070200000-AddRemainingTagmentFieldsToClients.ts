import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemainingTagmentFieldsToClients1758070200000 implements MigrationInterface {
  name = 'AddRemainingTagmentFieldsToClients1758070200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se as colunas já existem antes de adicionar
    const clientsTable = await queryRunner.getTable('clients');
    
    if (!clientsTable) {
      throw new Error('Table "clients" not found');
    }
    
    if (!clientsTable.findColumnByName('tagmentCustomerId')) {
      await queryRunner.query(`
        ALTER TABLE "clients" 
        ADD COLUMN "tagmentCustomerId" character varying(100)
      `);
    }

    if (!clientsTable.findColumnByName('tagmentSif')) {
      await queryRunner.query(`
        ALTER TABLE "clients" 
        ADD COLUMN "tagmentSif" character varying(50)
      `);
    }

    if (!clientsTable.findColumnByName('tagmentBrand')) {
      await queryRunner.query(`
        ALTER TABLE "clients" 
        ADD COLUMN "tagmentBrand" character varying(100)
      `);
    }

    // Criar índice para busca por customerId se não existir
    try {
      await queryRunner.query(`
        CREATE INDEX "IDX_clients_tagmentCustomerId" 
        ON "clients" ("tagmentCustomerId")
      `);
    } catch (error) {
      // Índice já existe, ignorar erro
      console.log('Índice tagmentCustomerId já existe');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índice
    try {
      await queryRunner.query(`DROP INDEX "public"."IDX_clients_tagmentCustomerId"`);
    } catch (error) {
      // Índice pode não existir
    }
    
    // Remover colunas
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "tagmentBrand"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "tagmentSif"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "tagmentCustomerId"`);
  }
}

