import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStorageLocationsTableOnly1758066400000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Criar enum para tipos de locais
        await queryRunner.query(`
            CREATE TYPE "public"."storage_locations_tipo_enum" AS ENUM(
                'geladeira', 
                'freezer', 
                'prateleira', 
                'estoque', 
                'balcao', 
                'outro'
            )
        `);

        // Criar tabela storage_locations
        await queryRunner.query(`
            CREATE TABLE "storage_locations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nome" character varying(100) NOT NULL,
                "tipo" "public"."storage_locations_tipo_enum" NOT NULL DEFAULT 'prateleira',
                "descricao" text,
                "temperatura" numeric(5,2),
                "capacidade" integer,
                "setor" character varying(100),
                "ativo" boolean NOT NULL DEFAULT true,
                "clientId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_storage_locations" PRIMARY KEY ("id")
            )
        `);

        // Adicionar foreign key para clients
        await queryRunner.query(`
            ALTER TABLE "storage_locations" 
            ADD CONSTRAINT "FK_storage_locations_client" 
            FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Criar índices
        await queryRunner.query(`
            CREATE INDEX "IDX_storage_locations_clientId" ON "storage_locations" ("clientId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_storage_locations_tipo" ON "storage_locations" ("tipo")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_storage_locations_ativo" ON "storage_locations" ("ativo")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_storage_locations_setor" ON "storage_locations" ("setor")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover índices
        await queryRunner.query(`DROP INDEX "public"."IDX_storage_locations_setor"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_storage_locations_ativo"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_storage_locations_tipo"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_storage_locations_clientId"`);

        // Remover foreign key
        await queryRunner.query(`ALTER TABLE "storage_locations" DROP CONSTRAINT "FK_storage_locations_client"`);

        // Remover tabela
        await queryRunner.query(`DROP TABLE "storage_locations"`);

        // Remover enum
        await queryRunner.query(`DROP TYPE "public"."storage_locations_tipo_enum"`);
    }
}

