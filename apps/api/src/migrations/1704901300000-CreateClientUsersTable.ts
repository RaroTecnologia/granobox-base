import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClientUsersTable1704901300000 implements MigrationInterface {
  name = 'CreateClientUsersTable1704901300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "client_users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clientId" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password" character varying(255),
        "role" character varying NOT NULL DEFAULT 'admin',
        "status" character varying NOT NULL DEFAULT 'pending',
        "inviteToken" character varying(500),
        "inviteExpiresAt" TIMESTAMP WITH TIME ZONE,
        "lastLoginAt" TIMESTAMP WITH TIME ZONE,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_client_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_client_users_email" UNIQUE ("email"),
        CONSTRAINT "FK_client_users_clientId" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_client_users_clientId" ON "client_users" ("clientId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_client_users_email" ON "client_users" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_client_users_inviteToken" ON "client_users" ("inviteToken")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_client_users_inviteToken"`);
    await queryRunner.query(`DROP INDEX "IDX_client_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_client_users_clientId"`);
    await queryRunner.query(`DROP TABLE "client_users"`);
  }
}
