import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStorageLocationIdToLabelsSimple1758069600000 implements MigrationInterface {
  name = 'AddStorageLocationIdToLabelsSimple1758069600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna storageLocationId à tabela labels
    await queryRunner.query(`
      ALTER TABLE "labels" 
      ADD COLUMN "storageLocationId" uuid
    `);

    // Adicionar foreign key constraint (opcional, mas recomendado)
    await queryRunner.query(`
      ALTER TABLE "labels" 
      ADD CONSTRAINT "FK_labels_storageLocationId" 
      FOREIGN KEY ("storageLocationId") 
      REFERENCES "storage_locations"("id") 
      ON DELETE SET NULL 
      ON UPDATE NO ACTION
    `);

    // Adicionar índice para performance
    await queryRunner.query(`
      CREATE INDEX "IDX_labels_storageLocationId" 
      ON "labels" ("storageLocationId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índice
    await queryRunner.query(`DROP INDEX "public"."IDX_labels_storageLocationId"`);
    
    // Remover foreign key constraint
    await queryRunner.query(`ALTER TABLE "labels" DROP CONSTRAINT "FK_labels_storageLocationId"`);
    
    // Remover coluna
    await queryRunner.query(`ALTER TABLE "labels" DROP COLUMN "storageLocationId"`);
  }
}

