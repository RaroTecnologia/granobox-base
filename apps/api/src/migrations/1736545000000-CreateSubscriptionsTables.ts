import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionsTables1736545000000 implements MigrationInterface {
  name = 'CreateSubscriptionsTables1736545000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create plans table
    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "type" character varying NOT NULL DEFAULT 'basic',
        "price" numeric(10,2) NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'BRL',
        "period" character varying NOT NULL DEFAULT 'monthly',
        "maxOperations" integer NOT NULL DEFAULT '1000',
        "maxLabelsPerMonth" integer NOT NULL DEFAULT '1000',
        "maxUsers" integer NOT NULL DEFAULT '5',
        "hasSupport" boolean NOT NULL DEFAULT false,
        "hasAdvancedAnalytics" boolean NOT NULL DEFAULT false,
        "hasCustomBranding" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "features" json,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plans_id" PRIMARY KEY ("id")
      )
    `);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" character varying NOT NULL DEFAULT 'active',
        "startDate" date NOT NULL,
        "endDate" date,
        "cancellationDate" date,
        "price" numeric(10,2) NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'BRL',
        "billingCycle" integer NOT NULL DEFAULT '1',
        "notes" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "clientId" uuid NOT NULL,
        "planId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_clientId" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subscriptions_planId" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE
      )
    `);

    // Create operations table
    await queryRunner.query(`
      CREATE TABLE "operations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "description" text,
        "metadata" json,
        "completedAt" TIMESTAMP,
        "failedAt" TIMESTAMP,
        "errorMessage" text,
        "clientId" uuid NOT NULL,
        "subscriptionId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_operations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_operations_clientId" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_operations_subscriptionId" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_clientId" ON "subscriptions" ("clientId")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_planId" ON "subscriptions" ("planId")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_status" ON "subscriptions" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_operations_clientId" ON "operations" ("clientId")`);
    await queryRunner.query(`CREATE INDEX "IDX_operations_subscriptionId" ON "operations" ("subscriptionId")`);
    await queryRunner.query(`CREATE INDEX "IDX_operations_status" ON "operations" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_operations_status"`);
    await queryRunner.query(`DROP INDEX "IDX_operations_subscriptionId"`);
    await queryRunner.query(`DROP INDEX "IDX_operations_clientId"`);
    await queryRunner.query(`DROP INDEX "IDX_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX "IDX_subscriptions_planId"`);
    await queryRunner.query(`DROP INDEX "IDX_subscriptions_clientId"`);
    
    await queryRunner.query(`DROP TABLE "operations"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TABLE "plans"`);
  }
}

