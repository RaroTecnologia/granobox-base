import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductReceipt } from '../entities/product-receipt.entity';
import { ProductReceiptItem } from '../entities/product-receipt-item.entity';
import {
  Label,
  LabelType,
  ConservationType,
} from '../../labels/entities/label.entity';
import { Product } from '../../products/entities/product.entity';
import { Client } from '../../clients/entities/client.entity';
import { Operator } from '../../operators/entities/operator.entity';
import { CreateRecebimentoDto } from '../dto/create-recebimento.dto';
import { CreatePorcionamentoDto } from '../dto/create-porcionamento.dto';
import { V15Service } from '../../v1-5/v1-5.service';
import { PrintersService } from '../../printers/printers.service';
import { TemplateProcessingService } from '../../template-processing/services/template-processing.service';
import { PrintLabelDto, LabelTypeEnum } from '../../v1-5/dto/print-label.dto';
import {
  generateLabelCode as generateFriendlyLabelCode,
  validateLabelCode,
  generateUniqueCode,
} from '../../labels/utils/label-code.utils';

@Injectable()
export class RecebimentoService {
  private readonly logger = new Logger(RecebimentoService.name);

  constructor(
    @InjectRepository(ProductReceipt)
    private receiptsRepository: Repository<ProductReceipt>,
    @InjectRepository(ProductReceiptItem)
    private itemsRepository: Repository<ProductReceiptItem>,
    @InjectRepository(Label)
    private labelsRepository: Repository<Label>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    @InjectRepository(Operator)
    private operatorsRepository: Repository<Operator>,
    private v15Service: V15Service,
    private printersService: PrintersService,
    private templateProcessingService: TemplateProcessingService,
  ) {}

  async createRecebimento(
    createDto: CreateRecebimentoDto,
    clientId: string,
    userId?: string,
  ): Promise<ProductReceipt> {
    // Se generateLabels for true e productId não foi fornecido, buscar pelo nome
    let productId = createDto.productId;
    if (createDto.generateLabels === true && !productId && createDto.productName) {
      const product = await this.productsRepository.findOne({
        where: {
          name: createDto.productName,
          clientId,
        },
      });
      if (product) {
        productId = product.id;
        this.logger.log(
          `🔍 Produto encontrado pelo nome "${createDto.productName}": ${productId}`,
        );
      } else {
        throw new BadRequestException(
          `Produto "${createDto.productName}" não encontrado. Selecione um produto cadastrado da lista para gerar etiquetas.`,
        );
      }
    }

    const receipt = this.receiptsRepository.create({
      ...createDto,
      productId,
      clientId,
      status: 'pending',
    });

    const savedReceipt = await this.receiptsRepository.save(receipt);

    // Criar itens baseados na quantidade de etiquetas
    // itemQuantity = número de etiquetas a criar (não quantidade por etiqueta)
    const items = [];
    const numberOfLabels = createDto.itemQuantity || createDto.quantity;

    for (let i = 0; i < numberOfLabels; i++) {
      const labelCode = this.generateLabelCode();
      
      // Garantir que unit não exceda 10 caracteres
      const unit = (createDto.unit || 'UN').substring(0, 10);

      // Quantidade por etiqueta = quantidade total dividida pelo número de etiquetas
      const quantityPerLabel = createDto.quantity / numberOfLabels;

      const item = this.itemsRepository.create({
        receiptId: savedReceipt.id,
        labelCode,
        quantity: quantityPerLabel,
        unit,
        status: 'created',
      });

      items.push(item);
    }

    await this.itemsRepository.save(items);

    const finalReceipt = await this.receiptsRepository.findOne({
      where: { id: savedReceipt.id },
      relations: ['items'],
    });

    // Se generateLabels for true, gerar labels e imprimir automaticamente
    this.logger.log(
      `🔍 Verificando generateLabels: ${createDto.generateLabels} (tipo: ${typeof createDto.generateLabels})`,
    );
    if (createDto.generateLabels === true && finalReceipt) {
      this.logger.log(
        `✅ generateLabels=true detectado, iniciando geração e impressão em lote...`,
      );
      try {
        // 1. Primeiro, gerar as labels no banco (cria os labelId nos items)
        const itemsWithLabels = await this.generateLabelsForReceipt(
          finalReceipt.id,
          clientId,
        );
        
        if (itemsWithLabels.length === 0) {
          this.logger.warn('Nenhuma label gerada para impressão');
          return finalReceipt;
        }

        // 2. Depois, imprimir todas em lote
        await this.printLabelsInBatch(
          finalReceipt.id,
          clientId,
          userId,
        );
      } catch (error) {
        this.logger.error(
          `❌ Erro ao gerar/imprimir etiquetas automaticamente: ${error.message}`,
        );
        this.logger.error(`Stack: ${error.stack}`);
        // Não falhar o recebimento se a impressão falhar
      }
    } else {
      this.logger.log(
        `⏭️  generateLabels não é true (valor: ${createDto.generateLabels}), pulando impressão automática`,
      );
    }

    return finalReceipt!;
  }

  async generateLabelsForReceipt(
    receiptId: string,
    clientId: string,
  ): Promise<ProductReceiptItem[]> {
    const receipt = await this.receiptsRepository.findOne({
      where: { id: receiptId, clientId },
      relations: ['items'],
    });

    if (!receipt) {
      throw new NotFoundException('Recebimento não encontrado');
    }

    if (receipt.status !== 'pending') {
      throw new BadRequestException(
        'Apenas recebimentos pendentes podem gerar etiquetas',
      );
    }

    const items = [];
    for (const item of receipt.items) {
      // Verificar se a Label já foi criada no banco (labelId existe)
      // Se não existe labelId, criar a Label mesmo que labelCode já exista
      if (!item.labelId && item.labelCode) {
        // Validar se o labelCode existente tem exatamente 6 caracteres e segue o padrão
        let labelCode = item.labelCode;
        if (!validateLabelCode(labelCode)) {
          // Se o código não é válido (não tem 6 caracteres ou não segue o padrão),
          // gerar um novo código de 6 caracteres
          this.logger.warn(
            `⚠️  labelCode "${labelCode}" não é válido (deve ter 6 caracteres no formato L-N-L-N-L-N), gerando novo código`,
          );
          // Buscar códigos existentes para garantir unicidade
          const existingCodes = await this.labelsRepository
            .find({ select: ['code'] })
            .then((labels) => labels.map((l) => l.code));
          labelCode = generateUniqueCode(existingCodes);
          // Atualizar o item com o novo código
          item.labelCode = labelCode;
        }
        // Usar productId do recebimento se disponível, senão lançar erro
        if (!receipt.productId) {
          throw new BadRequestException(
            'productId é obrigatório para gerar etiquetas. Selecione um produto cadastrado.',
          );
        }
        const label = this.labelsRepository.create({
          code: labelCode,
          type: LabelType.VALIDITY,
          conservationType: ConservationType.ORIGINAL_VALIDITY, // Etiqueta de validade original para entrada no estoque
          quantity: 1,
          productionDate: receipt.productionDate,
          validityDate: receipt.validityDate,
          clientId,
          productId: receipt.productId,
          receiptId: receipt.id,
          metadata: {
            produto: receipt.productName,
            fornecedor: receipt.supplierName,
            lote: receipt.batchNumber,
            temperatura: receipt.temperature,
            quantidade: item.quantity,
            unidade: item.unit,
          },
        });

        await this.labelsRepository.save(label);

        // Atualizar item com ID da etiqueta
        // Garantir que unit não exceda 10 caracteres antes de salvar
        if (item.unit && item.unit.length > 10) {
          this.logger.warn(
            `⚠️  Unit "${item.unit}" excede 10 caracteres, truncando para "${item.unit.substring(0, 10)}"`,
          );
          item.unit = item.unit.substring(0, 10);
        }
        item.labelId = label.id;
        item.status = 'labelled';
        items.push(await this.itemsRepository.save(item));
      } else if (!item.labelCode) {
        // Caso raro: item sem labelCode, gerar novo código
        const labelCode = this.generateLabelCode();

        // Usar productId do recebimento se disponível, senão lançar erro
        if (!receipt.productId) {
          throw new BadRequestException(
            'productId é obrigatório para gerar etiquetas. Selecione um produto cadastrado.',
          );
        }
        const label = this.labelsRepository.create({
          code: labelCode,
          type: LabelType.VALIDITY,
          conservationType: ConservationType.ORIGINAL_VALIDITY, // Etiqueta de validade original para entrada no estoque
          quantity: 1,
          productionDate: receipt.productionDate,
          validityDate: receipt.validityDate,
          clientId,
          productId: receipt.productId,
          receiptId: receipt.id,
          metadata: {
            produto: receipt.productName,
            fornecedor: receipt.supplierName,
            lote: receipt.batchNumber,
            temperatura: receipt.temperature,
            quantidade: item.quantity,
            unidade: item.unit,
          },
        });

        await this.labelsRepository.save(label);

        // Garantir que unit não exceda 10 caracteres antes de salvar
        if (item.unit && item.unit.length > 10) {
          this.logger.warn(
            `⚠️  Unit "${item.unit}" excede 10 caracteres, truncando para "${item.unit.substring(0, 10)}"`,
          );
          item.unit = item.unit.substring(0, 10);
        }
        item.labelCode = labelCode;
        item.labelId = label.id;
        item.status = 'labelled';
        items.push(await this.itemsRepository.save(item));
      }
    }

    // Atualizar status do recebimento
    receipt.status = 'received';
    await this.receiptsRepository.save(receipt);

    return items;
  }

  async createPorcionamento(
    createDto: CreatePorcionamentoDto,
    clientId: string,
  ): Promise<ProductReceiptItem[]> {
    const parentItem = await this.itemsRepository.findOne({
      where: { id: createDto.parentItemId },
      relations: ['receipt'],
    });

    if (!parentItem) {
      throw new NotFoundException('Item pai não encontrado');
    }

    if (parentItem.receipt.clientId !== clientId) {
      throw new BadRequestException('Item não pertence ao cliente');
    }

    if (parentItem.status !== 'labelled') {
      throw new BadRequestException(
        'Item deve estar etiquetado para ser porcionado',
      );
    }

    // Verificar se a quantidade total não excede o item pai
    const totalPortionQuantity = createDto.portions.reduce(
      (sum, portion) => sum + portion.quantity,
      0,
    );
    if (totalPortionQuantity > parentItem.quantity) {
      throw new BadRequestException(
        'Quantidade total das porções excede o item pai',
      );
    }

    const newItems = [];
    for (const portion of createDto.portions) {
      const labelCode = this.generateLabelCode();

      // Criar etiqueta para a porção
      // Usar productId do recebimento se disponível, senão lançar erro
      if (!parentItem.receipt.productId) {
        throw new BadRequestException(
          'productId é obrigatório para gerar etiquetas. Selecione um produto cadastrado.',
        );
      }
      const label = this.labelsRepository.create({
        code: labelCode,
        type: LabelType.VALIDITY,
        conservationType: ConservationType.ORIGINAL_VALIDITY, // Etiqueta de validade original para entrada no estoque
        quantity: 1,
        productionDate: parentItem.receipt.productionDate,
        validityDate: parentItem.receipt.validityDate,
        clientId,
        productId: parentItem.receipt.productId,
        receiptId: parentItem.receiptId,
        metadata: {
          produto: parentItem.receipt.productName,
          fornecedor: parentItem.receipt.supplierName,
          lote: parentItem.receipt.batchNumber,
          quantidade: portion.quantity,
          unidade: portion.unit || parentItem.unit,
          porcao_de: parentItem.labelCode,
        },
      });

      await this.labelsRepository.save(label);

      // Criar item filho
      const newItem = this.itemsRepository.create({
        receiptId: parentItem.receiptId,
        labelCode,
        labelId: label.id,
        quantity: portion.quantity,
        unit: portion.unit || parentItem.unit,
        status: 'created',
        parentItemId: parentItem.id,
        notes: portion.notes,
      });

      newItems.push(await this.itemsRepository.save(newItem));
    }

    // Atualizar status do item pai
    parentItem.status = 'used';
    await this.itemsRepository.save(parentItem);

    return newItems;
  }

  async getRastreabilidadeTree(itemId: string, clientId: string): Promise<any> {
    const item = await this.itemsRepository.findOne({
      where: { id: itemId },
      relations: ['receipt', 'label', 'parentItem'],
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado');
    }

    if (item.receipt.clientId !== clientId) {
      throw new BadRequestException('Item não pertence ao cliente');
    }

    const tree = await this.buildTree(item);
    return tree;
  }

  private async buildTree(item: ProductReceiptItem): Promise<any> {
    const children = await this.itemsRepository.find({
      where: { parentItemId: item.id },
      relations: ['receipt', 'label'],
    });

    const childrenTree = await Promise.all(
      children.map((child) => this.buildTree(child)),
    );

    return {
      id: item.id,
      labelCode: item.labelCode,
      quantity: item.quantity,
      unit: item.unit,
      status: item.status,
      productName: item.receipt.productName,
      supplierName: item.receipt.supplierName,
      productionDate: item.receipt.productionDate,
      validityDate: item.receipt.validityDate,
      children: childrenTree,
    };
  }

  private generateLabelCode(): string {
    // Usar o utilitário que gera códigos de exatamente 6 caracteres
    // Formato: L-N-L-N-L-N (Letra-Número-Letra-Número-Letra-Número)
    // Exemplos: A2B4C6, H3K7M9, D5F8J2
    return generateFriendlyLabelCode();
  }

  async findAllReceipts(clientId: string): Promise<ProductReceipt[]> {
    return this.receiptsRepository.find({
      where: { clientId },
      relations: ['items', 'items.label'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPaginatedReceipts(
    clientId: string,
    queryDto: { page?: number; limit?: number; search?: string },
  ): Promise<{
    data: ProductReceipt[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    try {
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 20;
      const skip = (page - 1) * limit;
      const search = queryDto.search?.toLowerCase().trim();

      const queryBuilder = this.receiptsRepository
        .createQueryBuilder('receipt')
        .leftJoinAndSelect('receipt.items', 'items')
        .leftJoinAndSelect('items.label', 'label')
        .where('receipt.clientId = :clientId', { clientId });

      // Aplicar busca se fornecida
      if (search) {
        queryBuilder.andWhere(
          '(LOWER(COALESCE(receipt.productName, \'\')) LIKE :search OR LOWER(COALESCE(receipt.supplierName, \'\')) LIKE :search OR LOWER(COALESCE(receipt.batchNumber, \'\')) LIKE :search OR LOWER(COALESCE(receipt.supplierCode, \'\')) LIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Contar total ANTES de aplicar skip/take
      const total = await queryBuilder.getCount();

      // Aplicar paginação e ordenação
      const data = await queryBuilder
        .orderBy('receipt.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      const totalPages = Math.ceil(total / limit);

      return {
        data,
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
      this.logger.error(`❌ Erro ao buscar recebimentos paginados: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Buscar dados de estoque processados
   * Retorna produtos com suas quantidades de etiquetas e recebimentos sem etiqueta
   */
  async getEstoque(
    clientId: string,
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: any[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    try {
      // Buscar todas as etiquetas ativas (pending ou printed) com produto
      const etiquetasAtivas = await this.labelsRepository.find({
        where: [
          { clientId, status: 'pending' as any },
          { clientId, status: 'printed' as any },
        ],
        relations: ['product'],
      });

      // Buscar todos os recebimentos do cliente
      const recebimentos = await this.receiptsRepository.find({
        where: { clientId },
        relations: ['items', 'items.label'],
      });

      // Buscar todas as contagens de estoque do cliente
      // Usar manager.query para executar query SQL raw
      const contagensRaw = await this.receiptsRepository.manager.query(
        `
        SELECT 
          "id",
          "productId",
          "quantity",
          "countDate",
          "createdAt"
        FROM inventory_counts
        WHERE "clientId" = $1
        ORDER BY "countDate" DESC, "createdAt" DESC
        `,
        [clientId],
      );

      // Criar mapa de contagens por produto (soma e lista)
      const contagensMap = new Map<string, { total: number; items: any[] }>();
      for (const row of contagensRaw) {
        if (row.productId) {
          if (!contagensMap.has(row.productId)) {
            contagensMap.set(row.productId, { total: 0, items: [] });
          }
          const contagem = contagensMap.get(row.productId);
          contagem.total += parseFloat(row.quantity || '0');
          contagem.items.push({
            id: row.id,
            quantity: parseFloat(row.quantity || '0'),
            countDate: row.countDate,
            createdAt: row.createdAt,
          });
        }
      }

      // Buscar todos os produtos do cliente (para normalizar nomes)
      const produtos = await this.productsRepository.find({
        where: { clientId, isActive: true },
      });

      // Criar mapa de produtos por ID
      const produtosMap = new Map(produtos.map((p) => [p.id, p]));

      // Criar mapa de estoque
      const estoqueMap = new Map<string, any>();

      // Processar etiquetas ativas
      for (const etiqueta of etiquetasAtivas) {
        const productId = etiqueta.productId;
        const produto = produtosMap.get(productId) || etiqueta.product;

        if (!estoqueMap.has(productId)) {
          const contagensData = contagensMap.get(productId) || { total: 0, items: [] };
          estoqueMap.set(productId, {
            productId,
            productName: produto?.name || 'Produto desconhecido',
            productCode: produto?.code,
            productType: produto?.type || 'raw_material',
            quantidadeEtiquetas: 0,
            quantidadeSemEtiqueta: 0,
            quantidadeContagem: Math.round(contagensData.total),
            quantidadeProximoVencimento: 0,
            etiquetas: [],
            recebimentosSemEtiqueta: [],
            contagens: contagensData.items,
          });
        } else {
          // Atualizar quantidade de contagem e lista se já existe
          const contagensData = contagensMap.get(productId) || { total: 0, items: [] };
          const item = estoqueMap.get(productId);
          item.quantidadeContagem = Math.round(contagensData.total);
          item.contagens = contagensData.items;
        }

        const item = estoqueMap.get(productId);
        item.quantidadeEtiquetas++;
        item.etiquetas.push({
          id: etiqueta.id,
          code: etiqueta.code,
          status: etiqueta.status,
          validityDate: etiqueta.validityDate,
          receiptId: etiqueta.receiptId || etiqueta.metadata?.receiptId,
        });

        // Verificar vencimento próximo (7 dias)
        if (etiqueta.validityDate) {
          const diasRestantes = Math.floor(
            (new Date(etiqueta.validityDate).getTime() -
              new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          );
          if (diasRestantes >= 0 && diasRestantes <= 7) {
            item.quantidadeProximoVencimento++;
          }
        }
      }

      // Identificar recebimentos que já têm etiquetas impressas
      const recebimentosComEtiquetasImpressas = new Set<string>();
      for (const etiqueta of etiquetasAtivas) {
        const receiptId =
          etiqueta.receiptId || (etiqueta.metadata as any)?.receiptId;
        if (receiptId && etiqueta.status === 'printed') {
          recebimentosComEtiquetasImpressas.add(receiptId);
        }
      }

      // Processar recebimentos sem etiqueta impressa
      for (const recebimento of recebimentos) {
        const receiptId = recebimento.id;

        // Pular recebimentos que já têm etiquetas impressas
        if (recebimentosComEtiquetasImpressas.has(receiptId)) {
          continue;
        }

        // Pular se gerou etiquetas automaticamente mas não tem impressas
        if (recebimento.labelsGenerated) {
          // Verificar se realmente tem etiquetas impressas vinculadas
          const temEtiquetasImpressas = recebimento.items.some(
            (item) => item.labelId && recebimentosComEtiquetasImpressas.has(receiptId),
          );
          if (temEtiquetasImpressas) {
            continue;
          }
        }

        const productId = recebimento.productId;
        const productName = recebimento.productName;

        if (!productName) continue;

        // Tentar encontrar produto
        let produto: Product | any = productId
          ? produtosMap.get(productId)
          : produtos.find(
              (p) => p.name.toLowerCase() === productName.toLowerCase(),
            );

        if (!produto && productId) {
          produto = {
            id: productId,
            name: productName,
            code: null,
            type: 'raw_material',
          } as any;
        } else if (!produto) {
          // Gerar hash simples do nome do produto para ID temporário
          let hash = 0;
          for (let i = 0; i < productName.length; i++) {
            const char = productName.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
          }
          produto = {
            id: `temp_${Math.abs(hash)}`,
            name: productName,
            code: null,
            type: 'raw_material',
          } as any;
        }

        const finalProductId = produto.id;

        if (!estoqueMap.has(finalProductId)) {
          const contagensData = contagensMap.get(finalProductId) || { total: 0, items: [] };
          estoqueMap.set(finalProductId, {
            productId: finalProductId,
            productName: produto.name,
            productCode: produto.code,
            productType: produto.type,
            quantidadeEtiquetas: 0,
            quantidadeSemEtiqueta: 0,
            quantidadeContagem: Math.round(contagensData.total),
            quantidadeProximoVencimento: 0,
            etiquetas: [],
            recebimentosSemEtiqueta: [],
            contagens: contagensData.items,
          });
        } else {
          // Atualizar quantidade de contagem e lista se já existe
          const contagensData = contagensMap.get(finalProductId) || { total: 0, items: [] };
          const item = estoqueMap.get(finalProductId);
          item.quantidadeContagem = Math.round(contagensData.total);
          item.contagens = contagensData.items;
        }

        const item = estoqueMap.get(finalProductId);
        const quantityValue = recebimento.quantity;
        const quantidade =
          typeof quantityValue === 'number'
            ? quantityValue
            : typeof quantityValue === 'string'
              ? parseInt(quantityValue, 10) || 0
              : 0;

        item.quantidadeSemEtiqueta += quantidade;
        item.recebimentosSemEtiqueta.push({
          id: recebimento.id,
          productName: recebimento.productName,
          quantity: quantidade,
          validityDate: recebimento.validityDate,
          batchNumber: recebimento.batchNumber,
          invoiceNumber: recebimento.invoiceNumber || (recebimento.metadata as any)?.invoiceNumber || null,
          createdAt: recebimento.createdAt,
        });
      }

      // Converter para array e filtrar apenas itens com etiquetas, recebimentos ou contagens
      let itensEstoque = Array.from(estoqueMap.values()).filter(
        (item) =>
          item.quantidadeEtiquetas > 0 ||
          item.recebimentosSemEtiqueta.length > 0 ||
          item.quantidadeContagem > 0,
      );

      // Aplicar busca se fornecida
      if (search) {
        const searchLower = search.toLowerCase();
        itensEstoque = itensEstoque.filter(
          (item) =>
            item.productName.toLowerCase().includes(searchLower) ||
            (item.productCode &&
              item.productCode.toLowerCase().includes(searchLower)),
        );
      }

      // Ordenar por nome do produto
      itensEstoque.sort((a, b) =>
        a.productName.localeCompare(b.productName),
      );

      // Aplicar paginação se fornecida
      const pageNum = page || 1;
      const limitNum = limit || 50;
      const skip = (pageNum - 1) * limitNum;
      const total = itensEstoque.length;
      const totalPages = Math.ceil(total / limitNum);

      const paginatedData = itensEstoque.slice(skip, skip + limitNum);

      return {
        data: paginatedData,
        meta: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        },
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar estoque: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findReceiptById(id: string, clientId: string): Promise<ProductReceipt> {
    const receipt = await this.receiptsRepository.findOne({
      where: { id, clientId },
      relations: ['items', 'items.label', 'items.parentItem'],
    });

    if (!receipt) {
      throw new NotFoundException('Recebimento não encontrado');
    }

    return receipt;
  }

  async updateItemStatus(
    itemId: string,
    status: string,
    notes?: string,
    clientId?: string,
  ): Promise<ProductReceiptItem> {
    const item = await this.itemsRepository.findOne({
      where: { id: itemId },
      relations: ['receipt'],
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado');
    }

    if (clientId && item.receipt.clientId !== clientId) {
      throw new BadRequestException('Item não pertence ao cliente');
    }

    item.status = status as any;
    if (notes) {
      item.notes = notes;
    }

    return this.itemsRepository.save(item);
  }

  async darBaixaPorCodigo(
    labelCode: string,
    notes?: string,
  ): Promise<ProductReceiptItem> {
    const item = await this.itemsRepository.findOne({
      where: { labelCode },
      relations: ['receipt', 'label'],
    });

    if (!item) {
      throw new NotFoundException(
        `Item com código ${labelCode} não encontrado`,
      );
    }

    // Marcar como usado
    item.status = 'used';
    if (notes) {
      item.notes = notes;
    }

    return this.itemsRepository.save(item);
  }

  /**
   * Imprime etiquetas já criadas em lote (método otimizado)
   */
  private async printLabelsInBatch(
    receiptId: string,
    clientId: string,
    userId?: string,
  ): Promise<void> {
    this.logger.log(
      `🖨️ Imprimindo etiquetas em lote para recebimento ${receiptId}`,
    );

    // 1. Buscar recebimento com items e labels
    const receipt = await this.receiptsRepository.findOne({
      where: { id: receiptId },
      relations: ['items'],
    });

    if (!receipt) {
      throw new NotFoundException('Recebimento não encontrado');
    }

    // 2. Buscar todas as labels dos items
    const labelIds = receipt.items
      .map((item) => item.labelId)
      .filter((id) => id != null) as string[];

    if (labelIds.length === 0) {
      this.logger.warn('Nenhuma label encontrada para impressão');
      return;
    }

    const labels = await this.labelsRepository.find({
      where: { id: In(labelIds) },
    });

    // 3. Buscar impressora padrão
    const printers = await this.printersService.findAll(clientId);
    const defaultPrinter = printers.find(
      (p) => p.isDefault && p.isActive && p.usage?.includes('validity'),
    ) || printers.find((p) => p.isActive && p.usage?.includes('validity'));

    if (!defaultPrinter) {
      this.logger.warn(
        `Nenhuma impressora ativa encontrada para cliente ${clientId}`,
      );
      return;
    }

    // 4. Buscar template padrão
    const defaultTemplate = await this.templateProcessingService.getDefaultTemplate(
      clientId,
      'validity',
    );

    if (!defaultTemplate) {
      this.logger.warn(
        `Nenhum template padrão encontrado para cliente ${clientId}`,
      );
      return;
    }

    // 5. Buscar produto e cliente
    let product: Product | null = null;
    if (receipt.productId) {
      product = await this.productsRepository.findOne({
        where: { id: receipt.productId },
      });
    }

    const client = await this.clientsRepository.findOne({
      where: { id: clientId },
    });

    // 6. Buscar operador
    let operatorName = '';
    if (userId) {
      const operator = await this.operatorsRepository.findOne({
        where: { id: userId, clientId },
      });
      if (operator) {
        operatorName = operator.name;
      }
    }

    // 7. Preparar dados base do template
    const baseLabelData: Record<string, any> = {
      nome_produto: receipt.productName,
      produto: receipt.productName,
      marca: product?.brand || '',
      sif: receipt.sif || product?.sif || '', // Prioriza SIF do recebimento, depois do produto
      emb_original: '',
      manipulacao: receipt.productionDate
        ? new Date(receipt.productionDate).toLocaleDateString('pt-BR')
        : '',
      label_validade: receipt.validityDate
        ? new Date(receipt.validityDate).toLocaleDateString('pt-BR')
        : '',
      responsavel: operatorName,
      armazenamento: '',
      lote_industria: receipt.batchNumber || '',
      logo: client?.tagmentLogoUuid || '',
    };

    // 8. Usar o método existente printLabel com copies para impressão em lote
    // O printLabel já processa múltiplas etiquetas em paralelo e concatena os ZPLs
    // ⚠️ IMPORTANTE: printLabel vai criar novas labels, mas as labels já foram criadas
    // As labels originais já estão vinculadas aos items, então isso não é um problema crítico
    const printDto: PrintLabelDto = {
      printerId: defaultPrinter.deviceId || defaultPrinter.id,
      labelType: LabelTypeEnum.VALIDITY,
      templateId: defaultTemplate.templateId,
      copies: labels.length, // Número de etiquetas a imprimir em lote
      labelData: baseLabelData, // Dados base (os códigos serão gerados pelo printLabel)
      metadata: {
        productId: receipt.productId!,
        validityDate: receipt.validityDate
          ? new Date(receipt.validityDate).toISOString()
          : undefined,
        productionDate: receipt.productionDate
          ? new Date(receipt.productionDate).toISOString()
          : undefined,
      },
      offsets: {
        x: defaultPrinter.offsetX || 0,
        y: defaultPrinter.offsetY || 0,
      },
    };

    try {
      // O printLabel vai:
      // 1. Criar N labels no banco (duplicadas das que já existem)
      // 2. Processar N templates em paralelo (cada um com seu código único)
      // 3. Concatenar todos os ZPLs
      // 4. Aplicar offsets
      // 5. Enviar tudo de uma vez para o Edge-Go (impressão em lote)
      await this.v15Service.printLabel(printDto, userId || '', clientId);
      this.logger.log(
        `✅ ${labels.length} etiquetas enviadas para impressão em lote na ${defaultPrinter.name}`,
      );
      this.logger.warn(
        `⚠️  Nota: printLabel criou ${labels.length} labels duplicadas para impressão. As labels originais (${labels.map(l => l.code).join(', ')}) já estavam vinculadas aos items do recebimento.`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro ao imprimir etiquetas em lote: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Gera etiquetas para um recebimento e imprime automaticamente (DEPRECATED - usar printLabelsInBatch)
   */
  private async generateAndPrintLabels(
    receiptId: string,
    clientId: string,
    userId?: string,
  ): Promise<void> {
    this.logger.log(
      `🖨️ Gerando e imprimindo etiquetas para recebimento ${receiptId}`,
    );

    // 1. Gerar etiquetas (cria Labels no banco se ainda não existirem)
    const items = await this.generateLabelsForReceipt(receiptId, clientId);
    if (items.length === 0) {
      this.logger.warn(`Nenhuma etiqueta gerada para recebimento ${receiptId}`);
      return;
    }

    // 2. Buscar impressora padrão do cliente
    const printers = await this.printersService.findAll(clientId);
    const defaultPrinter = printers.find(
      (p) => p.isDefault && p.isActive && p.usage?.includes('validity'),
    ) || printers.find((p) => p.isActive && p.usage?.includes('validity'));

    if (!defaultPrinter) {
      this.logger.warn(
        `Nenhuma impressora ativa encontrada para cliente ${clientId}`,
      );
      return;
    }

    // 3. Buscar template padrão do cliente
    const defaultTemplate = await this.templateProcessingService.getDefaultTemplate(
      clientId,
      'validity',
    );

    if (!defaultTemplate) {
      this.logger.warn(
        `Nenhum template padrão encontrado para cliente ${clientId}`,
      );
      return;
    }

    // 4. Buscar recebimento completo para obter dados
    const receipt = await this.receiptsRepository.findOne({
      where: { id: receiptId },
    });

    if (!receipt) {
      throw new NotFoundException('Recebimento não encontrado');
    }

    // 5. Buscar produto para obter marca e outros dados
    let product: Product | null = null;
    if (receipt.productId) {
      product = await this.productsRepository.findOne({
        where: { id: receipt.productId },
      });
    }

    // 6. Buscar cliente para obter logo
    const client = await this.clientsRepository.findOne({
      where: { id: clientId },
    });

    // 7. Buscar operador se userId for fornecido
    let operatorName = '';
    if (userId) {
      // Tentar buscar como Operator primeiro
      const operator = await this.operatorsRepository.findOne({
        where: { id: userId, clientId },
      });
      if (operator) {
        operatorName = operator.name;
      }
    }

    // 8. Buscar todas as labels de uma vez
    const labelIds = items
      .map((item) => item.labelId!)
      .filter((id) => id != null) as string[];
    
    if (labelIds.length === 0) {
      this.logger.warn('Nenhuma label encontrada para impressão');
      return;
    }

    const labels = await this.labelsRepository.find({
      where: { id: In(labelIds) },
    });

    if (labels.length === 0) {
      this.logger.warn('Nenhuma label encontrada para impressão');
      return;
    }

    // 9. Preparar dados base do template (comum para todas as etiquetas)
    const baseLabelData: Record<string, any> = {
      nome_produto: receipt.productName,
      produto: receipt.productName,
      marca: product?.brand || '', // Marca vem do produto cadastrado, não do fornecedor (só exibir se tiver)
      sif: receipt.sif || product?.sif || '', // Prioriza SIF do recebimento, depois do produto
      emb_original: '',
      manipulacao: receipt.productionDate
        ? new Date(receipt.productionDate).toLocaleDateString('pt-BR')
        : '',
      // A validade original vai APENAS em label_validade
      label_validade: receipt.validityDate
        ? new Date(receipt.validityDate).toLocaleDateString('pt-BR')
        : '',
      // NÃO enviar validade, data_vencimento ou data_vencimento_industria
      // NÃO enviar quantidade/peso (unidade é contagem de etiquetas, não peso)
      responsavel: operatorName,
      armazenamento: '',
      lote_industria: receipt.batchNumber || '',
      // Adicionar logo do cliente
      logo: client?.tagmentLogoUuid || '',
    };

    // 10. Preparar array de labelData (um para cada label com seu código único)
    const variablesArray = labels.map((label) => ({
      ...baseLabelData,
      codigo: label.code,
      qrcode: label.code,
      barcode: label.code,
    }));

    // 11. Processar todos os templates em paralelo (impressão em lote)
    this.logger.log(
      `🎨 Processando ${labels.length} templates em lote para impressão...`,
    );
    const zpls = await this.templateProcessingService.processTemplates(
      defaultTemplate.templateId,
      variablesArray,
      clientId,
    );

    // 12. Concatenar todos os ZPLs
    const finalZpl = zpls.join('\n');

    // 13. Aplicar offsets se configurados
    let zplWithOffsets = finalZpl;
    if (defaultPrinter.offsetX || defaultPrinter.offsetY) {
      // Aplicar offsets usando o método do v15Service (precisamos acessá-lo)
      // Por enquanto, vamos usar o printLabel que já aplica offsets
      // Mas vamos fazer uma única chamada com todas as labels
      const printDto: PrintLabelDto = {
        printerId: defaultPrinter.deviceId || defaultPrinter.id,
        labelType: LabelTypeEnum.VALIDITY,
        templateId: defaultTemplate.templateId,
        copies: labels.length,
        labelData: baseLabelData, // Será sobrescrito internamente, mas precisa estar aqui
        metadata: {
          productId: receipt.productId!,
          validityDate: receipt.validityDate
            ? new Date(receipt.validityDate).toISOString()
            : undefined,
          productionDate: receipt.productionDate
            ? new Date(receipt.productionDate).toISOString()
            : undefined,
        },
        offsets: {
          x: defaultPrinter.offsetX || 0,
          y: defaultPrinter.offsetY || 0,
        },
      };

      // ⚠️ PROBLEMA: printLabel vai criar novas labels, mas as labels já existem
      // Solução: Usar processTemplates + enviar ZPL diretamente
      // Mas precisamos do EdgeGoWebSocketGateway...

      // Por enquanto, vamos usar uma abordagem diferente:
      // Chamar printLabel mas ele vai criar labels duplicadas...
      // Melhor: Não criar labels no generateLabelsForReceipt quando generateLabels=true
    }

    this.logger.log(
      `✅ ${labels.length} etiquetas preparadas para impressão em lote (${finalZpl.length} bytes)`,
    );
    this.logger.warn(
      `⚠️  IMPLEMENTAÇÃO INCOMPLETA: Precisa enviar ZPL concatenado para Edge-Go`,
    );
  }
}
