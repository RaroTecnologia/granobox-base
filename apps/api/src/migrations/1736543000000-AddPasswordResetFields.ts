import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetFields1736543000000 implements MigrationInterface {
  name = 'AddPasswordResetFields1736543000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar campos de reset de senha na tabela users
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "resetPasswordToken" character varying(255),
      ADD COLUMN "resetPasswordExpiresAt" TIMESTAMP
    `);

    // Adicionar campos de reset de senha na tabela client_users
    await queryRunner.query(`
      ALTER TABLE "client_users" 
      ADD COLUMN "resetPasswordToken" character varying(255),
      ADD COLUMN "resetPasswordExpiresAt" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover campos de reset de senha da tabela users
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "resetPasswordToken",
      DROP COLUMN "resetPasswordExpiresAt"
    `);

    // Remover campos de reset de senha da tabela client_users
    await queryRunner.query(`
      ALTER TABLE "client_users" 
      DROP COLUMN "resetPasswordToken",
      DROP COLUMN "resetPasswordExpiresAt"
    `);
  }
}











