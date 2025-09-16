import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixColumnNamesToCamelCase1736545200000 implements MigrationInterface {
  name = 'FixColumnNamesToCamelCase1736545200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns exist in snake_case and rename them to camelCase
    
    // Check and rename subscription columns
    const subscriptionColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      AND column_name IN ('plan_id', 'client_id')
    `);
    
    if (subscriptionColumns.some((col: any) => col.column_name === 'plan_id')) {
      await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "plan_id" TO "planId"`);
    }
    
    if (subscriptionColumns.some((col: any) => col.column_name === 'client_id')) {
      await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "client_id" TO "clientId"`);
    }
    
    // Check and rename operation columns
    const operationColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'operations' 
      AND column_name IN ('subscription_id', 'client_id')
    `);
    
    if (operationColumns.some((col: any) => col.column_name === 'subscription_id')) {
      await queryRunner.query(`ALTER TABLE "operations" RENAME COLUMN "subscription_id" TO "subscriptionId"`);
    }
    
    if (operationColumns.some((col: any) => col.column_name === 'client_id')) {
      await queryRunner.query(`ALTER TABLE "operations" RENAME COLUMN "client_id" TO "clientId"`);
    }
    
    // Add missing columns if they don't exist
    const operationMissingColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'operations' 
      AND column_name IN ('name', 'isActive')
    `);
    
    if (!operationMissingColumns.some((col: any) => col.column_name === 'name')) {
      await queryRunner.query(`ALTER TABLE "operations" ADD COLUMN "name" character varying NOT NULL DEFAULT 'Operation'`);
    }
    
    if (!operationMissingColumns.some((col: any) => col.column_name === 'isActive')) {
      await queryRunner.query(`ALTER TABLE "operations" ADD COLUMN "isActive" boolean NOT NULL DEFAULT true`);
    }
    
    // Update status enum values
    await queryRunner.query(`ALTER TABLE "operations" ALTER COLUMN "status" TYPE character varying`);
    await queryRunner.query(`UPDATE "operations" SET "status" = 'active' WHERE "status" = 'pending'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename back to snake_case
    await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "planId" TO "plan_id"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "clientId" TO "client_id"`);
    await queryRunner.query(`ALTER TABLE "operations" RENAME COLUMN "subscriptionId" TO "subscription_id"`);
    await queryRunner.query(`ALTER TABLE "operations" RENAME COLUMN "clientId" TO "client_id"`);
    
    // Remove added columns
    await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "name"`);
    await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "isActive"`);
  }
}
