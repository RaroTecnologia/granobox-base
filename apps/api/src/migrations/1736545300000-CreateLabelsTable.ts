import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLabelsTable1736545300000 implements MigrationInterface {
  name = 'CreateLabelsTable1736545300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "labels" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying NOT NULL DEFAULT 'validity',
        "conservationType" character varying,
        "status" character varying NOT NULL DEFAULT 'pending',
        "quantity" integer NOT NULL DEFAULT '1',
        "weight" character varying(50),
        "unit" character varying(10),
        "price" character varying(20),
        "productionDate" date NOT NULL,
        "validityDate" date NOT NULL,
        "clientId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "notes" text,
        "metadata" json,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_labels_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "labels" 
      ADD CONSTRAINT "FK_labels_clientId" 
      FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "labels" 
      ADD CONSTRAINT "FK_labels_productId" 
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_labels_clientId" ON "labels" ("clientId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_labels_productId" ON "labels" ("productId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_labels_status" ON "labels" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_labels_type" ON "labels" ("type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_labels_type"`);
    await queryRunner.query(`DROP INDEX "IDX_labels_status"`);
    await queryRunner.query(`DROP INDEX "IDX_labels_productId"`);
    await queryRunner.query(`DROP INDEX "IDX_labels_clientId"`);
    await queryRunner.query(`ALTER TABLE "labels" DROP CONSTRAINT "FK_labels_productId"`);
    await queryRunner.query(`ALTER TABLE "labels" DROP CONSTRAINT "FK_labels_clientId"`);
    await queryRunner.query(`DROP TABLE "labels"`);
  }
}
