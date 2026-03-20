import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { OperationProduct } from '../entities/operation-product.entity';
import { CreateProductDto, UpdateProductDto } from '../dto';
import { ImportBatchItemDto } from '../dto/import-batch.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(OperationProduct)
    private operationProductsRepository: Repository<OperationProduct>,
    private dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    console.log('🔄 ProductsService.create - Iniciando criação de produto');
    console.log(
      '📋 Dados recebidos:',
      JSON.stringify(createProductDto, null, 2),
    );
    console.log('📏 weightUnit length:', createProductDto.weightUnit?.length);
    console.log('📏 weightUnit value:', createProductDto.weightUnit);

    // Normalizar UUIDs opcionais vazios (segurança extra além do DTO)
    if (createProductDto.customTemplateId === '')
      createProductDto.customTemplateId = undefined as any;
    if (createProductDto.defaultStorageLocationId === '')
      createProductDto.defaultStorageLocationId = undefined as any;
    if (createProductDto.categoryId === '')
      createProductDto.categoryId = undefined as any;
    if ((createProductDto as any).defaultPrinterId === '')
      createProductDto.defaultPrinterId = undefined as any;

    // Validar categoria pertence ao mesmo cliente (se informada)
    if (createProductDto.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: { id: createProductDto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Categoria não encontrada');
      }
      if (category.clientId !== createProductDto.clientId) {
        throw new BadRequestException(
          'Categoria não pertence ao cliente autenticado',
        );
      }
    }

    // Gerar código automaticamente se não fornecido
    if (!createProductDto.code) {
      createProductDto.code = await this.generateNextCode(
        createProductDto.clientId,
        createProductDto.type ?? 'finished',
      );
    }

    console.log('🏗️ Criando entidade Product...');
    const product = this.productsRepository.create(createProductDto);
    // Garantir que validade indeterminada seja persistida (campo opcional no DTO)
    if (createProductDto.validityIndeterminate !== undefined) {
      product.validityIndeterminate = !!createProductDto.validityIndeterminate;
    }
    console.log('💾 Salvando produto no banco de dados...');

    try {
      const savedProduct = await this.productsRepository.save(product);
      console.log('✅ Produto salvo com sucesso:', savedProduct.id);
      return savedProduct;
    } catch (error: any) {
      // Mapear erros comuns de banco para 400
      if (error && error.code === '23505') {
        // Violação de unicidade (ex.: código já usado no cliente)
        throw new BadRequestException(
          'Já existe um produto com este código para este cliente',
        );
      }
      if (error && error.code === '23503') {
        // Violação de chave estrangeira
        throw new BadRequestException(
          'Dados inválidos: referência inexistente',
        );
      }
      throw error;
    }
  }

  // ===== NOVO PADRÃO DE CÓDIGO: 8 caracteres alfanuméricos (semambíguos) =====
  private readonly CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem O, I, 0, 1

  private generateRandomCode(length: number = 8): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * this.CODE_CHARS.length);
      code += this.CODE_CHARS[idx];
    }
    return code;
  }

  private async generateUniqueAlphanumericCode(
    clientId: string,
    length: number = 8,
  ): Promise<string> {
    // Buscar todos os códigos do cliente para checar unicidade
    const products = await this.productsRepository.find({
      where: { clientId },
      select: ['code'],
    });
    const existing = new Set(
      (products || []).map((p) => (p.code || '').toUpperCase()),
    );

    let attempts = 0;
    while (attempts < 1000) {
      const code = this.generateRandomCode(length);
      if (!existing.has(code)) {
        return code;
      }
      attempts++;
    }
    // Fallback improvável
    return `${Date.now().toString(36).toUpperCase()}`
      .slice(-length)
      .padStart(length, 'X');
  }

  // Mantemos o nome do método para compatibilidade, mas agora gera 8 chars alfanuméricos únicos por cliente
  async generateNextCode(
    clientId: string,
    _productType: string = 'finished',
  ): Promise<string> {
    return await this.generateUniqueAlphanumericCode(clientId, 8);
  }

  /**
   * ⚡ Listagem de produtos — select leve (sem campos TEXT pesados).
   * Campos excluídos do listing: ingredients, allergens, nutritionalInfo, notes, observations.
   * Eles continuam disponíveis no GET /products/:id (findOne).
   */
  // Campos leves para listagem (exclui TEXT fields pesados)
  private static readonly LISTING_SELECT: (keyof Product)[] = [
    'id', 'name', 'description', 'code', 'type', 'brand', 'sif',
    'weight', 'weightUnit', 'quantity', 'salePrice', 'costPrice', 'currency',
    'shelfLifeAmbient', 'shelfLifeRefrigerated', 'shelfLifeFrozen',
    'barcode', 'isActive', 'showBrandOnLabel', 'showSifOnLabel',
    'showManufacturingBatchOnLabel', 'showExpiryDateOnLabel',
    'clientId', 'operationId', 'categoryId',
    'defaultStorageLocationId', 'customTemplateId', 'defaultPrinterId',
    'isLabelOnly', 'showTimeOnLabel', 'validityIndeterminate', 'rastreabilidade',
    'createdAt', 'updatedAt',
  ];

  async findAll(clientId: string, operationId?: string): Promise<Product[]> {
    if (operationId) {
      // Check if operation_products has entries for this operation
      const opProductCount = await this.operationProductsRepository.count({
        where: { operationId, isActive: true },
      });

      if (opProductCount > 0) {
        // ⭐ Strict: JOIN with operation_products to get only products linked to this operation
        const selectFields = ProductsService.LISTING_SELECT.map(f => `product.${f}`);
        return this.productsRepository
          .createQueryBuilder('product')
          .select(selectFields)
          .innerJoin(
            'operation_products',
            'op',
            'op."productId" = product.id AND op."operationId" = :operationId AND op."isActive" = true',
            { operationId },
          )
          .leftJoinAndSelect('product.category', 'category')
          .where('product.clientId = :clientId', { clientId })
          .orderBy('product.createdAt', 'DESC')
          .getMany();
      }

      // Fallback: no operation_products entries yet — return all client products (backward compat)
      return this.productsRepository.find({
        select: ProductsService.LISTING_SELECT,
        where: { clientId },
        relations: ['category'],
        order: { createdAt: 'DESC' },
      });
    }

    return this.productsRepository.find({
      select: ProductsService.LISTING_SELECT,
      where: { clientId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'client'],
    });
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product | null> {
    // Normalizar UUIDs opcionais vazios
    if ((updateProductDto as any).customTemplateId === '')
      (updateProductDto as any).customTemplateId = undefined as any;
    if ((updateProductDto as any).defaultStorageLocationId === '')
      (updateProductDto as any).defaultStorageLocationId = undefined as any;
    if ((updateProductDto as any).categoryId === '')
      (updateProductDto as any).categoryId = undefined as any;
    if ((updateProductDto as any).defaultPrinterId === '')
      (updateProductDto as any).defaultPrinterId = undefined as any;

    // Se veio categoryId, validar que pertence ao mesmo cliente do produto
    if (updateProductDto.categoryId) {
      const product = await this.productsRepository.findOne({ where: { id } });
      if (!product) {
        throw new BadRequestException('Produto não encontrado');
      }
      const category = await this.categoriesRepository.findOne({
        where: { id: updateProductDto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Categoria não encontrada');
      }
      if (category.clientId !== product.clientId) {
        throw new BadRequestException(
          'Categoria não pertence ao cliente do produto',
        );
      }
    }

    // Garantir que validade indeterminada seja persistida quando enviada no PATCH
    const payload = { ...updateProductDto } as any;
    if (updateProductDto.validityIndeterminate !== undefined) {
      payload.validityIndeterminate = !!updateProductDto.validityIndeterminate;
    }

    try {
      await this.productsRepository.update(id, payload);
      return this.findOne(id);
    } catch (error: any) {
      if (error && error.code === '23505') {
        throw new BadRequestException(
          'Já existe um produto com este código para este cliente',
        );
      }
      if (error && error.code === '23503') {
        throw new BadRequestException(
          'Dados inválidos: referência inexistente',
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.productsRepository.delete(id);
  }

  // Sobrecargas para compatibilidade: aceitar 1 arg (categoryId) ou 2 args (clientId, categoryId)
  async findByCategory(categoryId: string): Promise<Product[]>;
  async findByCategory(
    clientId: string,
    categoryId: string,
  ): Promise<Product[]>;
  async findByCategory(arg1: string, arg2?: string): Promise<Product[]> {
    const hasClientId = typeof arg2 === 'string';
    const clientId = hasClientId ? arg1 : undefined;
    const categoryId = hasClientId ? arg2 : arg1;

    return this.productsRepository.find({
      where: hasClientId ? { clientId, categoryId } : { categoryId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async search(clientId: string, query: string): Promise<Product[]> {
    return this.productsRepository
      .createQueryBuilder('product')
      .select(ProductsService.LISTING_SELECT.map(f => `product.${f}`))
      .where('product.clientId = :clientId', { clientId })
      .andWhere(
        '(product.name ILIKE :query OR product.description ILIKE :query OR product.barcode ILIKE :query)',
        { query: `%${query}%` },
      )
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.createdAt', 'DESC')
      .take(100) // ⚡ Limitar resultados de busca
      .getMany();
  }

  /* ────────────────── Import Batch ────────────────── */

  async importBatch(
    clientId: string,
    operationId: string | undefined,
    items: ImportBatchItemDto[],
  ): Promise<{
    batchId: string;
    productsCreated: number;
    categoriesCreated: number;
  }> {
    const batchId = uuidv4();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ── Phase A: Create new categories (dedup case-insensitive) ──
      const newCategoryMap = new Map<string, string>(); // lowercase name -> created id

      // Collect unique new parent categories
      const parentCategoryNames = new Set<string>();
      for (const item of items) {
        if (item.newCategoryName && !item.categoryId) {
          parentCategoryNames.add(item.newCategoryName.trim());
        }
      }

      // Check existing categories for dedup
      const existingCategories = await queryRunner.manager.find(Category, {
        where: { clientId },
        select: ['id', 'name', 'parentId'],
      });
      const existingCatMap = new Map<string, string>(); // lowercase name -> id
      for (const cat of existingCategories) {
        existingCatMap.set(cat.name.toLowerCase(), cat.id);
      }

      // Create parent categories
      let categoriesCreated = 0;
      for (const catName of parentCategoryNames) {
        const key = catName.toLowerCase();
        if (existingCatMap.has(key)) {
          newCategoryMap.set(key, existingCatMap.get(key)!);
          continue;
        }
        const cat = queryRunner.manager.create(Category, {
          name: catName,
          clientId,
          operationId: operationId || undefined,
          importBatchId: batchId,
        });
        const saved = await queryRunner.manager.save(cat);
        newCategoryMap.set(key, saved.id);
        existingCatMap.set(key, saved.id);
        categoriesCreated++;
      }

      // Create subcategories
      for (const item of items) {
        if (item.newSubcategoryName) {
          const subKey = item.newSubcategoryName.trim().toLowerCase();
          if (existingCatMap.has(subKey) || newCategoryMap.has(subKey)) {
            continue;
          }
          // Determine parent
          let parentId = item.parentCategoryId;
          if (!parentId && item.newCategoryName) {
            parentId = newCategoryMap.get(
              item.newCategoryName.trim().toLowerCase(),
            );
          }
          const sub = queryRunner.manager.create(Category, {
            name: item.newSubcategoryName.trim(),
            clientId,
            operationId: operationId || undefined,
            parentId: parentId || undefined,
            importBatchId: batchId,
          });
          const saved = await queryRunner.manager.save(sub);
          newCategoryMap.set(subKey, saved.id);
          existingCatMap.set(subKey, saved.id);
          categoriesCreated++;
        }
      }

      // ── Phase B: Create products ──
      let productsCreated = 0;
      for (const item of items) {
        // Resolve category ID
        let categoryId = item.categoryId;
        if (!categoryId && item.newSubcategoryName) {
          categoryId = newCategoryMap.get(
            item.newSubcategoryName.trim().toLowerCase(),
          );
        }
        if (!categoryId && item.newCategoryName) {
          categoryId = newCategoryMap.get(
            item.newCategoryName.trim().toLowerCase(),
          );
        }

        const code = await this.generateNextCode(clientId, item.type || 'finished');

        const product = queryRunner.manager.create(Product, {
          name: item.name,
          clientId,
          operationId: operationId || undefined,
          categoryId: categoryId || undefined,
          type: item.type || 'finished',
          brand: item.brand || undefined,
          shelfLifeAmbient: item.shelfLifeAmbient,
          shelfLifeRefrigerated: item.shelfLifeRefrigerated,
          shelfLifeFrozen: item.shelfLifeFrozen,
          ingredients: item.ingredients || undefined,
          allergens: item.allergens || undefined,
          currency: 'BRL',
          code,
          importBatchId: batchId,
        });
        await queryRunner.manager.save(product);
        productsCreated++;
      }

      await queryRunner.commitTransaction();
      this.logger.log(
        `Import batch ${batchId}: ${productsCreated} products, ${categoriesCreated} categories created`,
      );

      return { batchId, productsCreated, categoriesCreated };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Import batch failed: ${err}`);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async rollbackBatch(
    clientId: string,
    batchId: string,
  ): Promise<{ deletedProducts: number; deletedCategories: number }> {
    // Delete products from this batch
    const productResult = await this.productsRepository.delete({
      importBatchId: batchId,
      clientId,
    });

    // Delete categories that were created in this batch and have no products from outside the batch
    // (products from the batch are already deleted above)
    const batchCategories = await this.categoriesRepository.find({
      where: { importBatchId: batchId, clientId },
      select: ['id'],
    });

    let deletedCategories = 0;
    for (const cat of batchCategories) {
      // Check if any products reference this category (from outside the batch)
      const productCount = await this.productsRepository.count({
        where: { categoryId: cat.id, clientId },
      });
      if (productCount === 0) {
        await this.categoriesRepository.delete(cat.id);
        deletedCategories++;
      }
    }

    return {
      deletedProducts: productResult.affected || 0,
      deletedCategories,
    };
  }
}
