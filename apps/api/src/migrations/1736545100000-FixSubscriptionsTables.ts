import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSubscriptionsTables1736545100000 implements MigrationInterface {
  name = 'FixSubscriptionsTables1736545100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, clean up any existing problematic data
    await queryRunner.query(`DELETE FROM subscriptions WHERE "clientId" IS NULL;`);
    await queryRunner.query(`DELETE FROM operations WHERE "clientId" IS NULL;`);
    
    // Drop existing columns if they exist with wrong constraints
    try {
      await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "client_id";`);
      await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "plan_id";`);
      await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "client_id";`);
    } catch (error) {
      // Columns might not exist, continue
    }

    // Add clientId column to subscriptions (nullable first)
    await queryRunner.query(`ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "clientId" uuid;`);
    
    // Add clientId column to operations (nullable first)
    await queryRunner.query(`ALTER TABLE "operations" ADD COLUMN IF NOT EXISTS "clientId" uuid;`);
    
    // Add subscriptionId column to operations
    await queryRunner.query(`ALTER TABLE "operations" ADD COLUMN IF NOT EXISTS "subscriptionId" uuid;`);
    
    // Add other missing columns to operations
    await queryRunner.query(`ALTER TABLE "operations" ADD COLUMN IF NOT EXISTS "type" character varying;`);
    await queryRunner.query(`ALTER TABLE "operations" ADD COLUMN IF NOT EXISTS "metadata" json;`);
    await queryRunner.query(`ALTER TABLE "operations" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP;`);
    await queryRunner.query(`ALTER TABLE "operations" ADD COLUMN IF NOT EXISTS "failedAt" TIMESTAMP;`);
    await queryRunner.query(`ALTER TABLE "operations" ADD COLUMN IF NOT EXISTS "errorMessage" text;`);
    
    // Add planId column to subscriptions
    await queryRunner.query(`ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "planId" uuid;`);

    // Now make clientId NOT NULL after ensuring no null values
    await queryRunner.query(`UPDATE "subscriptions" SET "clientId" = (SELECT id FROM clients LIMIT 1) WHERE "clientId" IS NULL;`);
    await queryRunner.query(`UPDATE "operations" SET "clientId" = (SELECT id FROM clients LIMIT 1) WHERE "clientId" IS NULL;`);
    
    await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "clientId" SET NOT NULL;`);
    await queryRunner.query(`ALTER TABLE "operations" ALTER COLUMN "clientId" SET NOT NULL;`);
    await queryRunner.query(`ALTER TABLE "operations" ALTER COLUMN "type" SET NOT NULL;`);

    // Add foreign key constraints
    await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_client" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE;`);
    await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_plan" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL;`);
    await queryRunner.query(`ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_client" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE;`);
    await queryRunner.query(`ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_subscription" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "operations" DROP CONSTRAINT IF EXISTS "FK_operations_subscription";`);
    await queryRunner.query(`ALTER TABLE "operations" DROP CONSTRAINT IF EXISTS "FK_operations_client";`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK_subscriptions_plan";`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK_subscriptions_client";`);

    // Drop columns
    await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "errorMessage";`);
    await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "failedAt";`);
    await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "completedAt";`);
    await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "metadata";`);
    await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "type";`);
    await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "subscriptionId";`);
    await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "clientId";`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "planId";`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "clientId";`);
  }
}

