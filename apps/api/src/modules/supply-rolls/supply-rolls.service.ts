import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SupplyRoll, SupplyRollStatus, SupplyRollType } from './entities/supply-roll.entity';
import { CreateSupplyRollsBatchDto } from './dto/create-supply-rolls-batch.dto';
import { InstallSupplyRollDto } from './dto/install-supply-roll.dto';
import { AssignSupplyRollDto } from './dto/assign-supply-roll.dto';
import { ReceiveSupplyRollsDto } from './dto/receive-supply-rolls.dto';
import { AssignToOrderDto } from './dto/assign-to-order.dto';
import { QuerySupplyRollsDto } from './dto/query-supply-rolls.dto';
import { LabelSku } from '../label-orders/entities/label-sku.entity';
import { LabelOrder } from '../label-orders/entities/label-order.entity';
import { Printer } from '../printers/entities/printer.entity';
import { SupplyStock } from '../client-supply-kits/entities/supply-stock.entity';
import { ClientSupplyKitItem } from '../client-supply-kits/entities/client-supply-kit-item.entity';
import { generateLabelCode } from '../labels/utils/label-code.utils';

@Injectable()
export class SupplyRollsService {
  private readonly logger = new Logger(SupplyRollsService.name);

  constructor(
    @InjectRepository(SupplyRoll)
    private readonly rollRepository: Repository<SupplyRoll>,
    @InjectRepository(LabelSku)
    private readonly skuRepository: Repository<LabelSku>,
    @InjectRepository(Printer)
    private readonly printerRepository: Repository<Printer>,
    @InjectRepository(SupplyStock)
    private readonly supplyStockRepository: Repository<SupplyStock>,
    @InjectRepository(ClientSupplyKitItem)
    private readonly kitItemRepository: Repository<ClientSupplyKitItem>,
    @InjectRepository(LabelOrder)
    private readonly labelOrderRepository: Repository<LabelOrder>,
  ) {}

  // ─────────────────────────────────────────────────
  // Batch Create — gera N rolos para um SKU
  // ─────────────────────────────────────────────────

  async createBatch(dto: CreateSupplyRollsBatchDto): Promise<{
    rolls: Array<{ id: string; shortCode: string | null; type: string; skuId: string }>;
    batchCode: string;
    count: number;
  }> {
    // Validar SKU
    const sku = await this.skuRepository.findOne({ where: { id: dto.skuId } });
    if (!sku) {
      throw new NotFoundException(`SKU ${dto.skuId} não encontrado`);
    }

    const batchCode =
      dto.batchCode || this.generateBatchCode();

    // Gerar shortCodes unicos para o batch
    const shortCodes = await this.generateUniqueShortCodes(dto.quantity);

    const entities: SupplyRoll[] = [];
    for (let i = 0; i < dto.quantity; i++) {
      entities.push(
        this.rollRepository.create({
          skuId: dto.skuId,
          type: dto.type,
          status: SupplyRollStatus.IN_STOCK,
          batchCode,
          shortCode: shortCodes[i],
          notes: dto.notes || null,
        }),
      );
    }

    const saved = await this.rollRepository.save(entities);

    this.logger.log(
      `📦 Batch criado: ${saved.length} rolos (${dto.type}) para SKU ${sku.name} — lote ${batchCode}`,
    );

    return {
      rolls: saved.map((r) => ({ id: r.id, shortCode: r.shortCode, type: r.type, skuId: r.skuId })),
      batchCode,
      count: saved.length,
    };
  }

  // ─────────────────────────────────────────────────
  // Get — detalhes de um rolo (scan preview)
  // ─────────────────────────────────────────────────

  async findOne(id: string): Promise<SupplyRoll> {
    const roll = await this.rollRepository.findOne({
      where: { id },
      relations: ['sku', 'client', 'printer'],
    });
    if (!roll) {
      throw new NotFoundException(`Rolo ${id} não encontrado`);
    }
    return roll;
  }

  async findByShortCode(shortCode: string): Promise<SupplyRoll> {
    const roll = await this.rollRepository.findOne({
      where: { shortCode },
      relations: ['sku', 'client', 'printer'],
    });
    if (!roll) {
      throw new NotFoundException(`Rolo com codigo ${shortCode} não encontrado`);
    }
    return roll;
  }

  // ─────────────────────────────────────────────────
  // Assign — associa rolo a um cliente (separação de pedido)
  // ─────────────────────────────────────────────────

  async assign(id: string, dto: AssignSupplyRollDto): Promise<SupplyRoll> {
    const roll = await this.findOne(id);

    if (roll.status !== SupplyRollStatus.IN_STOCK) {
      throw new BadRequestException(
        `Rolo já está no status "${roll.status}". Só é possível associar rolos com status "in_stock".`,
      );
    }

    roll.status = SupplyRollStatus.ASSIGNED;
    roll.clientId = dto.clientId;
    roll.orderId = dto.orderId || null;
    roll.assignedAt = new Date();

    const saved = await this.rollRepository.save(roll);

    this.logger.log(
      `🏷️ Rolo ${id} associado ao cliente ${dto.clientId}`,
    );

    return saved;
  }

  // ─────────────────────────────────────────────────
  // Install — instala rolo na impressora + baixa estoque
  // ─────────────────────────────────────────────────

  async install(
    id: string,
    dto: InstallSupplyRollDto,
    clientId: string,
  ): Promise<{
    roll: SupplyRoll;
    previousRoll?: { id: string; printsSinceInstall: number; ribbonUsedMetersSinceInstall: number };
    stockRemaining?: number;
  }> {
    const roll = await this.findOne(id);

    // Validar status
    if (roll.status !== SupplyRollStatus.ASSIGNED) {
      throw new BadRequestException(
        `Rolo está no status "${roll.status}". Só é possível instalar rolos com status "assigned".`,
      );
    }

    // Validar que o rolo pertence a este cliente
    if (roll.clientId !== clientId) {
      throw new BadRequestException(
        'Este rolo não está associado à sua conta.',
      );
    }

    // Validar impressora
    const printer = await this.printerRepository.findOne({
      where: { id: dto.printerId, clientId },
    });
    if (!printer) {
      throw new NotFoundException(
        `Impressora ${dto.printerId} não encontrada.`,
      );
    }

    // Se já houver um rolo instalado nesta impressora, marcar como depleted
    let previousRoll: SupplyRoll | null = null;
    const currentInstalled = await this.rollRepository.findOne({
      where: {
        printerId: dto.printerId,
        status: SupplyRollStatus.INSTALLED,
        type: roll.type, // mesmo tipo (label ou ribbon)
      },
    });

    if (currentInstalled) {
      currentInstalled.status = SupplyRollStatus.DEPLETED;
      currentInstalled.depletedAt = new Date();
      await this.rollRepository.save(currentInstalled);
      previousRoll = currentInstalled;

      this.logger.log(
        `♻️ Rolo anterior ${currentInstalled.id} marcado como depleted ` +
        `(${currentInstalled.printsSinceInstall} prints, ${currentInstalled.ribbonUsedMetersSinceInstall.toFixed(1)}m ribbon)`,
      );
    }

    // Instalar o novo rolo
    roll.status = SupplyRollStatus.INSTALLED;
    roll.printerId = dto.printerId;
    roll.operationId = dto.operationId || null;
    roll.installedAt = new Date();
    roll.printsSinceInstall = 0;
    roll.ribbonUsedMetersSinceInstall = 0;

    const saved = await this.rollRepository.save(roll);

    // Se for ribbon, resetar contadores da impressora
    if (roll.type === SupplyRollType.RIBBON) {
      await this.printerRepository.update(dto.printerId, {
        ribbonUsedMeters: 0,
        ribbonLastResetAt: new Date(),
      });
    }

    // Decrementar estoque do cliente
    const stockRemaining = await this.decrementStock(
      clientId,
      roll.skuId,
      roll.type,
    );

    this.logger.log(
      `✅ Rolo ${id} instalado na impressora ${printer.name || dto.printerId} ` +
      `(estoque restante: ${stockRemaining ?? '?'} rolos)`,
    );

    return {
      roll: saved,
      previousRoll: previousRoll
        ? {
            id: previousRoll.id,
            printsSinceInstall: previousRoll.printsSinceInstall,
            ribbonUsedMetersSinceInstall: previousRoll.ribbonUsedMetersSinceInstall,
          }
        : undefined,
      stockRemaining,
    };
  }

  // ─────────────────────────────────────────────────
  // Deplete — marca rolo como esgotado
  // ─────────────────────────────────────────────────

  async deplete(id: string): Promise<SupplyRoll> {
    const roll = await this.findOne(id);

    if (roll.status !== SupplyRollStatus.INSTALLED) {
      throw new BadRequestException(
        `Rolo está no status "${roll.status}". Só é possível esgotar rolos com status "installed".`,
      );
    }

    roll.status = SupplyRollStatus.DEPLETED;
    roll.depletedAt = new Date();

    return this.rollRepository.save(roll);
  }

  // ─────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────

  /** Rolo(s) atualmente instalado(s) numa impressora */
  async findInstalledByPrinter(printerId: string): Promise<SupplyRoll[]> {
    return this.rollRepository.find({
      where: { printerId, status: SupplyRollStatus.INSTALLED },
      relations: ['sku'],
    });
  }

  /** Rolos de um cliente (assigned + installed) */
  async findByClient(
    clientId: string,
    status?: SupplyRollStatus,
  ): Promise<SupplyRoll[]> {
    const where: any = { clientId };
    if (status) {
      where.status = status;
    } else {
      // Por padrão, só retorna ativos (assigned + installed)
      where.status = undefined; // TypeORM In() não aceita undefined; buscar todos e filtrar
    }

    return this.rollRepository.find({
      where: status ? where : { clientId },
      relations: ['sku', 'printer'],
      order: { updatedAt: 'DESC' },
    });
  }

  // ─────────────────────────────────────────────────
  // Receive — registra NF de fornecedor nos rolos
  // ─────────────────────────────────────────────────

  async receiveBatch(
    dto: ReceiveSupplyRollsDto,
  ): Promise<{ updated: number }> {
    const rolls = await this.rollRepository.find({
      where: { id: In(dto.rollIds), status: SupplyRollStatus.IN_STOCK },
    });

    if (rolls.length === 0) {
      throw new BadRequestException(
        'Nenhum rolo IN_STOCK encontrado com os IDs informados.',
      );
    }

    const receivedAt = dto.receivedAt ? new Date(dto.receivedAt) : new Date();

    for (const roll of rolls) {
      roll.supplierInvoice = dto.supplierInvoice;
      roll.receivedAt = receivedAt;
    }

    await this.rollRepository.save(rolls);

    this.logger.log(
      `📋 Recebimento registrado: ${rolls.length} rolos com NF ${dto.supplierInvoice}`,
    );

    return { updated: rolls.length };
  }

  // ─────────────────────────────────────────────────
  // Assign to Order — vincula rolos a um pedido
  // ─────────────────────────────────────────────────

  async assignToOrder(
    dto: AssignToOrderDto,
  ): Promise<{ assigned: number }> {
    const order = await this.labelOrderRepository.findOne({
      where: { id: dto.orderId },
    });
    if (!order) {
      throw new NotFoundException(`Pedido ${dto.orderId} não encontrado.`);
    }

    const rolls = await this.rollRepository.find({
      where: { id: In(dto.rollIds), status: SupplyRollStatus.IN_STOCK },
    });

    if (rolls.length === 0) {
      throw new BadRequestException(
        'Nenhum rolo IN_STOCK encontrado com os IDs informados.',
      );
    }

    for (const roll of rolls) {
      roll.status = SupplyRollStatus.ASSIGNED;
      roll.clientId = order.clientId;
      roll.orderId = order.id;
      roll.assignedAt = new Date();
    }

    await this.rollRepository.save(rolls);

    this.logger.log(
      `📦 ${rolls.length} rolos vinculados ao pedido ${dto.orderId} (cliente ${order.clientId})`,
    );

    return { assigned: rolls.length };
  }

  // ─────────────────────────────────────────────────
  // Find All — listagem geral com filtros
  // ─────────────────────────────────────────────────

  async findAll(
    query: QuerySupplyRollsDto,
  ): Promise<{ data: SupplyRoll[]; total: number }> {
    const qb = this.rollRepository
      .createQueryBuilder('roll')
      .leftJoinAndSelect('roll.sku', 'sku')
      .leftJoinAndSelect('roll.client', 'client');

    if (query.status) {
      qb.andWhere('roll.status = :status', { status: query.status });
    }

    if (query.hasInvoice === 'true') {
      qb.andWhere('roll.supplierInvoice IS NOT NULL');
    } else if (query.hasInvoice === 'false') {
      qb.andWhere('roll.supplierInvoice IS NULL');
    }

    if (query.batchCode) {
      qb.andWhere('roll.batchCode = :batchCode', {
        batchCode: query.batchCode,
      });
    }

    if (query.skuId) {
      qb.andWhere('roll.skuId = :skuId', { skuId: query.skuId });
    }

    qb.orderBy('roll.createdAt', 'DESC');

    const limit = query.limit ? parseInt(query.limit, 10) : 100;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;
    qb.take(limit).skip(offset);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  // ─────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────

  /** Incrementa contadores de uso no rolo ativo da impressora */
  async incrementUsage(
    printerId: string,
    copies: number,
    ribbonUsedMeters: number,
  ): Promise<void> {
    // Incrementar rolo de etiqueta
    await this.rollRepository
      .createQueryBuilder()
      .update(SupplyRoll)
      .set({
        printsSinceInstall: () => `"printsSinceInstall" + ${copies}`,
      })
      .where('"printerId" = :printerId AND status = :status AND type = :type', {
        printerId,
        status: SupplyRollStatus.INSTALLED,
        type: SupplyRollType.LABEL,
      })
      .execute();

    // Incrementar rolo de ribbon (se houver consumo)
    if (ribbonUsedMeters > 0) {
      await this.rollRepository
        .createQueryBuilder()
        .update(SupplyRoll)
        .set({
          printsSinceInstall: () => `"printsSinceInstall" + ${copies}`,
          ribbonUsedMetersSinceInstall: () =>
            `"ribbonUsedMetersSinceInstall" + ${ribbonUsedMeters}`,
        })
        .where('"printerId" = :printerId AND status = :status AND type = :type', {
          printerId,
          status: SupplyRollStatus.INSTALLED,
          type: SupplyRollType.RIBBON,
        })
        .execute();
    }
  }

  private async decrementStock(
    clientId: string,
    skuId: string,
    type: SupplyRollType,
  ): Promise<number | undefined> {
    // Encontrar o kitItem correspondente a este SKU
    const kitItem = await this.kitItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.kit', 'kit')
      .where('item.skuId = :skuId', { skuId })
      .andWhere('kit.clientId = :clientId', { clientId })
      .andWhere('kit.isActive = true')
      .getOne();

    if (!kitItem) {
      this.logger.warn(
        `⚠️ Nenhum kit ativo encontrado para SKU ${skuId} do cliente ${clientId} — estoque não decrementado`,
      );
      return undefined;
    }

    // Decrementar rollsInStock no SupplyStock
    const stock = await this.supplyStockRepository.findOne({
      where: {
        clientId,
        kitId: kitItem.kitId,
        kitItemId: kitItem.id,
      },
    });

    if (stock && stock.rollsInStock > 0) {
      stock.rollsInStock = Math.max(0, stock.rollsInStock - 1);
      stock.lastUsageDate = new Date();
      await this.supplyStockRepository.save(stock);
      return stock.rollsInStock;
    }

    return stock?.rollsInStock ?? 0;
  }

  private generateBatchCode(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10); // 2026-02-12
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    return `${date}-${seq}`;
  }

  /** Gera um shortCode no formato GBR-A3K7M9 */
  private generateRollShortCode(): string {
    return `GBR-${generateLabelCode()}`;
  }

  /** Gera N shortCodes unicos, verificando colisoes no banco */
  private async generateUniqueShortCodes(count: number): Promise<string[]> {
    const codes: string[] = [];
    const maxAttempts = count * 10;
    let attempts = 0;

    while (codes.length < count && attempts < maxAttempts) {
      const code = this.generateRollShortCode();
      attempts++;

      // Verificar colisao no batch atual
      if (codes.includes(code)) continue;

      // Verificar colisao no banco
      const existing = await this.rollRepository.findOne({
        where: { shortCode: code },
        select: ['id'],
      });
      if (!existing) {
        codes.push(code);
      }
    }

    if (codes.length < count) {
      throw new BadRequestException(
        `Não foi possivel gerar ${count} codigos unicos apos ${maxAttempts} tentativas`,
      );
    }

    return codes;
  }
}
