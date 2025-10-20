import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductReceipt } from '../entities/product-receipt.entity';
import { ProductReceiptItem } from '../entities/product-receipt-item.entity';
import { Label, LabelType } from '../../labels/entities/label.entity';
import { CreateRecebimentoDto } from '../dto/create-recebimento.dto';
import { CreatePorcionamentoDto } from '../dto/create-porcionamento.dto';

@Injectable()
export class RecebimentoService {
  constructor(
    @InjectRepository(ProductReceipt)
    private receiptsRepository: Repository<ProductReceipt>,
    @InjectRepository(ProductReceiptItem)
    private itemsRepository: Repository<ProductReceiptItem>,
    @InjectRepository(Label)
    private labelsRepository: Repository<Label>,
  ) {}

  async createRecebimento(createDto: CreateRecebimentoDto, clientId: string): Promise<ProductReceipt> {
    const receipt = this.receiptsRepository.create({
      ...createDto,
      clientId,
      status: 'pending',
    });

    const savedReceipt = await this.receiptsRepository.save(receipt);

    // Criar itens baseados na quantidade
    const items = [];
    const itemQuantity = createDto.itemQuantity || createDto.quantity;
    const numberOfItems = Math.ceil(createDto.quantity / itemQuantity);

    for (let i = 0; i < numberOfItems; i++) {
      const labelCode = this.generateLabelCode();
      
      const item = this.itemsRepository.create({
        receiptId: savedReceipt.id,
        labelCode,
        quantity: Math.min(itemQuantity, createDto.quantity - (i * itemQuantity)),
        unit: createDto.unit,
        status: 'created',
      });

      items.push(item);
    }

    await this.itemsRepository.save(items);

    return this.receiptsRepository.findOne({
      where: { id: savedReceipt.id },
      relations: ['items'],
    });
  }

  async generateLabelsForReceipt(receiptId: string, clientId: string): Promise<ProductReceiptItem[]> {
    const receipt = await this.receiptsRepository.findOne({
      where: { id: receiptId, clientId },
      relations: ['items'],
    });

    if (!receipt) {
      throw new NotFoundException('Recebimento não encontrado');
    }

    if (receipt.status !== 'pending') {
      throw new BadRequestException('Apenas recebimentos pendentes podem gerar etiquetas');
    }

    const items = [];
    for (const item of receipt.items) {
      if (!item.labelCode) {
        // Gerar código único para a etiqueta
        const labelCode = this.generateLabelCode();
        
        // Criar etiqueta no sistema
        // TODO: Criar produto genérico ou buscar produto existente
        const label = this.labelsRepository.create({
          code: labelCode,
          type: LabelType.VALIDITY,
          quantity: 1,
          productionDate: receipt.productionDate,
          validityDate: receipt.validityDate,
          clientId,
          productId: '00000000-0000-0000-0000-000000000000', // Produto genérico - TODO: implementar
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

        // Atualizar item com código da etiqueta
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

  async createPorcionamento(createDto: CreatePorcionamentoDto, clientId: string): Promise<ProductReceiptItem[]> {
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
      throw new BadRequestException('Item deve estar etiquetado para ser porcionado');
    }

    // Verificar se a quantidade total não excede o item pai
    const totalPortionQuantity = createDto.portions.reduce((sum, portion) => sum + portion.quantity, 0);
    if (totalPortionQuantity > parentItem.quantity) {
      throw new BadRequestException('Quantidade total das porções excede o item pai');
    }

    const newItems = [];
    for (const portion of createDto.portions) {
      const labelCode = this.generateLabelCode();
      
      // Criar etiqueta para a porção
      const label = this.labelsRepository.create({
        code: labelCode,
        type: LabelType.VALIDITY,
        quantity: 1,
        productionDate: parentItem.receipt.productionDate,
        validityDate: parentItem.receipt.validityDate,
        clientId,
        productId: '00000000-0000-0000-0000-000000000000', // Produto genérico - TODO: implementar
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
      children.map(child => this.buildTree(child))
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
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `RC${timestamp}${random}`.toUpperCase();
  }

  async findAllReceipts(clientId: string): Promise<ProductReceipt[]> {
    return this.receiptsRepository.find({
      where: { clientId },
      relations: ['items', 'items.label'],
      order: { createdAt: 'DESC' },
    });
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

  async updateItemStatus(itemId: string, status: string, notes?: string, clientId?: string): Promise<ProductReceiptItem> {
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

  async darBaixaPorCodigo(labelCode: string, notes?: string): Promise<ProductReceiptItem> {
    const item = await this.itemsRepository.findOne({
      where: { labelCode },
      relations: ['receipt', 'label'],
    });

    if (!item) {
      throw new NotFoundException(`Item com código ${labelCode} não encontrado`);
    }

    // Marcar como usado
    item.status = 'used';
    if (notes) {
      item.notes = notes;
    }

    return this.itemsRepository.save(item);
  }
}
