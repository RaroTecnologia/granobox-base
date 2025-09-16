import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTagmentApiKeyToClients1736545700000 implements MigrationInterface {
    name = 'AddTagmentApiKeyToClients1736545700000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" ADD "tagmentApiKey" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "tagmentApiKey"`);
    }
}
