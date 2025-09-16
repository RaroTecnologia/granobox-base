import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionsTables1736542900000 implements MigrationInterface {
  name = 'CreateSubscriptionsTables1736542900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela de planos
    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" text,
        "type" character varying NOT NULL CHECK ("type" IN ('basic', 'professional', 'enterprise')),
        "price" numeric(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'BRL',
        "period" character varying NOT NULL DEFAULT 'monthly' CHECK ("period" IN ('monthly', 'annual')),
        "maxOperations" integer NOT NULL DEFAULT '1',
        "maxLabelsPerMonth" integer NOT NULL DEFAULT '1000',
        "maxUsers" integer NOT NULL DEFAULT '5',
        "hasSupport" boolean NOT NULL DEFAULT true,
        "hasAdvancedAnalytics" boolean NOT NULL DEFAULT false,
        "hasCustomBranding" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "features" json,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plans_id" PRIMARY KEY ("id")
      )
    `);

    // Criar tabela de assinaturas
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" character varying NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'inactive', 'cancelled', 'suspended', 'expired')),
        "startDate" date NOT NULL,
        "endDate" date,
        "cancellationDate" date,
        "price" numeric(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'BRL',
        "billingCycle" integer NOT NULL DEFAULT '30',
        "notes" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "client_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        CONSTRAINT "PK_subscriptions_id" PRIMARY KEY ("id")
      )
    `);

    // Criar tabela de operações
    await queryRunner.query(`
      CREATE TABLE "operations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "description" text,
        "status" character varying NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'inactive', 'suspended')),
        "zipCode" character varying(10) NOT NULL,
        "street" character varying(255) NOT NULL,
        "number" character varying(10) NOT NULL,
        "complement" character varying(100),
        "neighborhood" character varying(100) NOT NULL,
        "city" character varying(100) NOT NULL,
        "state" character varying(2) NOT NULL,
        "contactName" character varying(255) NOT NULL,
        "contactEmail" character varying(255) NOT NULL,
        "contactPhone" character varying(20),
        "contactWhatsapp" character varying(20),
        "settings" json,
        "notes" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "client_id" uuid NOT NULL,
        "subscription_id" uuid,
        CONSTRAINT "PK_operations_id" PRIMARY KEY ("id")
      )
    `);

    // Adicionar foreign keys
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD CONSTRAINT "FK_subscriptions_client_id" 
      FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD CONSTRAINT "FK_subscriptions_plan_id" 
      FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "operations" 
      ADD CONSTRAINT "FK_operations_client_id" 
      FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "operations" 
      ADD CONSTRAINT "FK_operations_subscription_id" 
      FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL
    `);

    // Inserir planos padrão
    await queryRunner.query(`
      INSERT INTO "plans" ("id", "name", "description", "type", "price", "currency", "period", "maxOperations", "maxLabelsPerMonth", "maxUsers", "hasSupport", "hasAdvancedAnalytics", "hasCustomBranding", "isActive") VALUES
      ('550e8400-e29b-41d4-a716-446655440001', 'Básico', 'Plano ideal para pequenos negócios', 'basic', 29.90, 'BRL', 'monthly', 1, 500, 2, true, false, false, true),
      ('550e8400-e29b-41d4-a716-446655440002', 'Profissional', 'Plano para empresas em crescimento', 'professional', 79.90, 'BRL', 'monthly', 3, 2000, 5, true, true, false, true),
      ('550e8400-e29b-41d4-a716-446655440003', 'Enterprise', 'Plano para grandes empresas', 'enterprise', 199.90, 'BRL', 'monthly', 10, 10000, 20, true, true, true, true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    await queryRunner.query(`ALTER TABLE "operations" DROP CONSTRAINT "FK_operations_subscription_id"`);
    await queryRunner.query(`ALTER TABLE "operations" DROP CONSTRAINT "FK_operations_client_id"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_plan_id"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_client_id"`);

    // Remover tabelas
    await queryRunner.query(`DROP TABLE "operations"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TABLE "plans"`);
  }
}



