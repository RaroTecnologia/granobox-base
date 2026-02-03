import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { InventoryCount } from '../entities/inventory-count.entity';
import { QueryContagensDto, PaginatedContagensResponse } from '../dto/query-contagens.dto';

@Injectable()
export class InventoryCountService {
  private readonly logger = new Logger(InventoryCountService.name);

  constructor(
    @InjectRepository(InventoryCount)
    private readonly inventoryCountRepository: Repository<InventoryCount>,
  ) {}

  async findAll(clientId: string): Promise<InventoryCount[]> {
    return this.inventoryCountRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findPaginatedContagens(
    clientId: string,
    queryDto: QueryContagensDto,
  ): Promise<PaginatedContagensResponse> {
    try {
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 20;
      const skip = (page - 1) * limit;

      // Usar query raw para buscar da tabela inventory_counts com joins
      let query = `
        SELECT 
          ic."id",
          ic."productId",
          ic."quantity",
          ic."unit",
          ic."countDate",
          ic."operatorId",
          ic."storageLocationId",
          ic."createdAt",
          ic."updatedAt",
          p."name" as "productName",
          p."code" as "productCode",
          op."name" as "operatorName",
          sl."nome" as "storageLocationName"
        FROM inventory_counts ic
        LEFT JOIN products p ON ic."productId" = p."id"
        LEFT JOIN operators op ON ic."operatorId" = op."id"
        LEFT JOIN storage_locations sl ON ic."storageLocationId" = sl."id"
        WHERE ic."clientId" = $1
      `;

      const params: any[] = [clientId];

      // Adicionar busca se fornecida
      if (queryDto.search && queryDto.search.trim()) {
        query += ` AND (
          p."name" ILIKE $2 OR 
          p."code" ILIKE $2 OR 
          op."name" ILIKE $2 OR 
          sl."nome" ILIKE $2
        )`;
        params.push(`%${queryDto.search.trim()}%`);
      }

      // Contar total (query separada para evitar problemas com JOINs)
      let countQuery = `
        SELECT COUNT(*) as total
        FROM inventory_counts ic
        WHERE ic."clientId" = $1
      `;
      const countParams: any[] = [clientId];
      
      if (queryDto.search && queryDto.search.trim()) {
        countQuery += ` AND (
          EXISTS (
            SELECT 1 FROM products p 
            WHERE p."id" = ic."productId" 
            AND (p."name" ILIKE $2 OR p."code" ILIKE $2)
          ) OR
          EXISTS (
            SELECT 1 FROM operators op 
            WHERE op."id" = ic."operatorId" 
            AND op."name" ILIKE $2
          ) OR
          EXISTS (
            SELECT 1 FROM storage_locations sl 
            WHERE sl."id" = ic."storageLocationId" 
            AND sl."nome" ILIKE $2
          )
        )`;
        countParams.push(`%${queryDto.search.trim()}%`);
      }
      
      const countResult = await this.inventoryCountRepository.manager.query(
        countQuery,
        countParams,
      );
      const total = parseInt(countResult[0]?.total || '0', 10);

      // Adicionar ordenação e paginação
      query += ` ORDER BY ic."countDate" DESC, ic."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, skip);

      // Executar query
      const results = await this.inventoryCountRepository.manager.query(
        query,
        params,
      );

      const totalPages = Math.ceil(total / limit);

      return {
        data: results.map((row: any) => ({
          id: row.id,
          productId: row.productId,
          productName: row.productName || 'Produto desconhecido',
          productCode: row.productCode,
          quantity: parseFloat(row.quantity || '0'),
          unit: row.unit || 'UN',
          countDate: row.countDate,
          operatorId: row.operatorId,
          operatorName: row.operatorName || 'Operador desconhecido',
          storageLocationId: row.storageLocationId,
          storageLocationName: row.storageLocationName || 'Local desconhecido',
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })),
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar contagens paginadas: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(id: string, clientId: string): Promise<InventoryCount> {
    const inventoryCount = await this.inventoryCountRepository.findOne({
      where: { id, clientId },
    });

    if (!inventoryCount) {
      throw new NotFoundException('Contagem de estoque não encontrada');
    }

    return inventoryCount;
  }

  async create(data: Partial<InventoryCount>): Promise<InventoryCount> {
    const inventoryCount = this.inventoryCountRepository.create(data);
    return this.inventoryCountRepository.save(inventoryCount);
  }

  /**
   * Criar múltiplas contagens de estoque (itens individuais)
   * Salva diretamente na tabela inventory_counts
   */
  async createCountItems(
    clientId: string,
    items: Array<{
      productId: string;
      quantity: number;
      unit?: string;
      countDate: Date | string;
      operatorId?: string;
      storageLocationId?: string;
    }>,
  ): Promise<any[]> {
    try {
      this.logger.log(`Iniciando criação de ${items.length} contagens para clientId: ${clientId}`);
      const results = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        this.logger.debug(`Processando item ${i + 1}/${items.length}:`, {
          productId: item.productId,
          quantity: item.quantity,
          operatorId: item.operatorId || 'null',
          storageLocationId: item.storageLocationId || 'null',
        });

        // Verificar quais campos opcionais estão presentes
        const hasOperator = item.operatorId != null && item.operatorId !== '';
        const hasStorageLocation = item.storageLocationId != null && item.storageLocationId !== '';
        
        // Tratar countDate (pode vir como string ou Date)
        let countDateStr: string;
        if (typeof item.countDate === 'string') {
          countDateStr = item.countDate.split('T')[0];
        } else {
          countDateStr = item.countDate.toISOString().split('T')[0];
        }
        
        // Construir parâmetros dinamicamente (sempre na mesma ordem)
        const params: any[] = [
          clientId,
          item.productId,
          item.quantity.toString(),
          item.unit || 'UN',
          countDateStr,
        ];
        
        // Adicionar operatorId se presente
        if (hasOperator) {
          params.push(item.operatorId);
        }
        
        // Adicionar storageLocationId se presente
        if (hasStorageLocation) {
          params.push(item.storageLocationId);
        }
        
        // Construir query com placeholders corretos
        let paramIndex = 6; // Começar do $6 (após os 5 obrigatórios)
        const operatorPlaceholder = hasOperator ? `$${paramIndex++}` : 'NULL';
        const storagePlaceholder = hasStorageLocation ? `$${paramIndex}` : 'NULL';
        
        const query = `
          INSERT INTO inventory_counts (
            "clientId",
            "productId",
            "quantity",
            "unit",
            "countDate",
            "operatorId",
            "storageLocationId",
            "createdAt",
            "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, ${operatorPlaceholder}, ${storagePlaceholder}, NOW(), NOW())
          RETURNING *
        `;

        this.logger.debug(`Executando query com ${params.length} parâmetros`);
        
        const result = await this.inventoryCountRepository.manager.query(
          query,
          params,
        );

        if (result && result.length > 0) {
          results.push(result[0]);
          this.logger.debug(`Item ${i + 1} criado com sucesso`);
        } else {
          this.logger.warn(`Item ${i + 1} não retornou resultado`);
        }
      }

      this.logger.log(`Contagens criadas com sucesso: ${results.length}/${items.length}`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao criar contagens: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async update(
    id: string,
    clientId: string,
    data: Partial<InventoryCount>,
  ): Promise<InventoryCount> {
    const inventoryCount = await this.findOne(id, clientId);
    Object.assign(inventoryCount, data);
    return this.inventoryCountRepository.save(inventoryCount);
  }

  async delete(id: string, clientId: string): Promise<void> {
    const inventoryCount = await this.findOne(id, clientId);
    await this.inventoryCountRepository.remove(inventoryCount);
  }
}
