import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTagmentTables1704901400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela tagment_config
    await queryRunner.createTable(
      new Table({
        name: 'tagment_config',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'apiKey',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'baseUrl',
            type: 'varchar',
            default: "'https://api.tagment.com.br'",
          },
          {
            name: 'timeout',
            type: 'int',
            default: 10000,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Criar tabela tagment_templates
    await queryRunner.createTable(
      new Table({
        name: 'tagment_templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'template',
            type: 'jsonb',
          },
          {
            name: 'type',
            type: 'varchar',
            default: "'produto_manipulado'",
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'clientId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Criar tabela tagment_logs
    await queryRunner.createTable(
      new Table({
        name: 'tagment_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'templateId',
            type: 'uuid',
          },
          {
            name: 'inputData',
            type: 'jsonb',
          },
          {
            name: 'zplOutput',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'success',
            type: 'boolean',
            default: false,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'clientId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'tagment_templates',
      new TableForeignKey({
        columnNames: ['clientId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clients',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'tagment_logs',
      new TableForeignKey({
        columnNames: ['clientId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clients',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'tagment_logs',
      new TableForeignKey({
        columnNames: ['templateId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tagment_templates',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    const tagmentTemplatesTable = await queryRunner.getTable('tagment_templates');
    const tagmentLogsTable = await queryRunner.getTable('tagment_logs');

    if (tagmentTemplatesTable) {
      const clientForeignKey = tagmentTemplatesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('clientId') !== -1,
      );
      if (clientForeignKey) {
        await queryRunner.dropForeignKey('tagment_templates', clientForeignKey);
      }
    }

    if (tagmentLogsTable) {
      const clientForeignKey = tagmentLogsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('clientId') !== -1,
      );
      if (clientForeignKey) {
        await queryRunner.dropForeignKey('tagment_logs', clientForeignKey);
      }

      const templateForeignKey = tagmentLogsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('templateId') !== -1,
      );
      if (templateForeignKey) {
        await queryRunner.dropForeignKey('tagment_logs', templateForeignKey);
      }
    }

    // Remover tabelas
    await queryRunner.dropTable('tagment_logs');
    await queryRunner.dropTable('tagment_templates');
    await queryRunner.dropTable('tagment_config');
  }
}











