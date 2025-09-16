import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOperatorsTable1758040000000 implements MigrationInterface {
  name = 'CreateOperatorsTable1758040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela operators
    await queryRunner.query(`
      CREATE TABLE "operators" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "pin" character varying(4) NOT NULL,
        "phone" character varying(20),
        "email" character varying(100),
        "department" character varying(100),
        "isActive" boolean NOT NULL DEFAULT true,
        "clientId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_operators_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_operators_pin_client" UNIQUE ("pin", "clientId")
      )
    `);

    // Adicionar foreign key
    await queryRunner.query(`
      ALTER TABLE "operators" 
      ADD CONSTRAINT "FK_operators_client" 
      FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Criar índices
    await queryRunner.query(`
      CREATE INDEX "IDX_operators_client" ON "operators" ("clientId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_operators_active" ON "operators" ("isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX "IDX_operators_active"`);
    await queryRunner.query(`DROP INDEX "IDX_operators_client"`);
    
    // Remover foreign key
    await queryRunner.query(`ALTER TABLE "operators" DROP CONSTRAINT "FK_operators_client"`);
    
    // Remover tabela
    await queryRunner.query(`DROP TABLE "operators"`);
  }
}
