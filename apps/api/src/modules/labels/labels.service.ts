import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Label, LabelStatus } from './entities/label.entity';
import { LabelEvent, LabelEventType } from './entities/label-event.entity'; // ✅ NOVO
import { CreateLabelDto } from './dto/create-label.dto';
import { QueryLabelsDto, PaginatedLabelsResponse } from './dto/query-labels.dto';
import { generateUniqueCode } from './utils/label-code.utils';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label)
    private labelsRepository: Repository<Label>,
    @InjectRepository(LabelEvent) // ✅ NOVO
    private labelEventsRepository: Repository<LabelEvent>,
  ) {}

  async create(createLabelDto: CreateLabelDto): Promise<Label> {
    // Gerar código amigável único se não foi fornecido
    let code = createLabelDto.code;
    if (!code) {
      const existingCodes = await this.getExistingCodes();
      code = generateUniqueCode(existingCodes);
    }

    const label = this.labelsRepository.create({
      ...createLabelDto,
      code,
      productionDate: new Date(createLabelDto.productionDate),
      validityDate: new Date(createLabelDto.validityDate),
    });
    return this.labelsRepository.save(label);
  }

  private async getExistingCodes(): Promise<string[]> {
    const labels = await this.labelsRepository.find({
      select: ['code'],
    });
    return labels.map(label => label.code);
  }

  async findAll(clientId?: string, type?: string): Promise<Label[]> {
    const query = this.labelsRepository.createQueryBuilder('label')
      .leftJoinAndSelect('label.product', 'product')
      .leftJoinAndSelect('label.client', 'client')
      .orderBy('label.createdAt', 'DESC');

    if (clientId) {
      query.where('label.clientId = :clientId', { clientId });
    }

    if (type) {
      query.andWhere('label.type = :type', { type });
    }

    return query.getMany();
  }

  async findPaginated(queryDto: QueryLabelsDto): Promise<PaginatedLabelsResponse> {
    const {
      clientId,
      type,
      status,
      conservationType,
      search,
      validityDateFrom,
      validityDateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const query = this.labelsRepository
      .createQueryBuilder('label')
      .leftJoinAndSelect('label.product', 'product')
      .leftJoinAndSelect('label.client', 'client');

    // Filtros obrigatórios
    if (clientId) {
      query.andWhere('label.clientId = :clientId', { clientId });
    }

    if (type) {
      query.andWhere('label.type = :type', { type });
    }

    if (status) {
      query.andWhere('label.status = :status', { status });
    }

    if (conservationType) {
      query.andWhere('label.conservationType = :conservationType', { conservationType });
    }

    // Busca por texto (nome do produto ou código)
    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(product.name) LIKE LOWER(:search)', { search: `%${search}%` })
            .orWhere('LOWER(label.code) LIKE LOWER(:search)', { search: `%${search}%` });
        }),
      );
    }

    // Filtro por data de validade
    if (validityDateFrom) {
      query.andWhere('label.validityDate >= :validityDateFrom', { validityDateFrom });
    }

    if (validityDateTo) {
      query.andWhere('label.validityDate <= :validityDateTo', { validityDateTo });
    }

    // Ordenação
    const orderField = sortBy === 'productName' ? 'product.name' : `label.${sortBy}`;
    query.orderBy(orderField, sortOrder);

    // Contar total antes da paginação
    const total = await query.getCount();

    // Aplicar paginação
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    // Executar query
    const data = await query.getMany();

    // Calcular metadados
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async findPending(clientId?: string): Promise<Label[]> {
    const query = this.labelsRepository.createQueryBuilder('label')
      .leftJoinAndSelect('label.product', 'product')
      .leftJoinAndSelect('label.client', 'client')
      .where('label.status = :status', { status: LabelStatus.PENDING })
      .orderBy('label.createdAt', 'DESC');

    if (clientId) {
      query.andWhere('label.clientId = :clientId', { clientId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Label | null> {
    return this.labelsRepository.findOne({
      where: { id },
      relations: ['product', 'client'],
    });
  }

  async findByCode(code: string): Promise<Label | null> {
    // Buscar case-insensitive (converter para maiúsculo)
    const codeUpper = code.toUpperCase();
    return this.labelsRepository.findOne({
      where: { code: codeUpper },
      relations: ['product', 'client'],
    });
  }

  async updateStatus(id: string, status: LabelStatus): Promise<Label | null> {
    await this.labelsRepository.update(id, { status });
    return this.findOne(id);
  }

  async markAsPrinted(ids: string[]): Promise<void> {
    await this.labelsRepository
      .createQueryBuilder()
      .update(Label)
      .set({ status: LabelStatus.PRINTED })
      .where('id IN (:...ids)', { ids })
      .execute();
  }

  async remove(id: string): Promise<void> {
    await this.labelsRepository.delete(id);
  }

  async updateMetadata(id: string, metadata: Record<string, any>): Promise<Label | null> {
    await this.labelsRepository.update(id, { metadata });
    return this.findOne(id);
  }

  async darBaixaPorCodigo(code: string, clientId?: string): Promise<Label | null> {
    const label = await this.findByCode(code);
    
    if (!label) {
      return null;
    }

    // Validar segurança: device só pode dar baixa em etiquetas do seu cliente
    if (clientId && label.clientId !== clientId) {
      throw new UnauthorizedException('Esta etiqueta pertence a outro cliente');
    }

    // Verificar se já está consumida
    if (label.status === LabelStatus.CONSUMED) {
      // Retornar a label sem alterar, mas com flag indicando que já estava consumida
      return { ...label, alreadyConsumed: true } as any;
    }

    // Marcar como consumida (baixada)
    await this.labelsRepository.update(label.id, { status: LabelStatus.CONSUMED });
    return this.findOne(label.id);
  }

  async getLabelsCountThisMonth(clientId: string): Promise<number> {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    return this.labelsRepository.count({
      where: {
        clientId,
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        } as any,
      },
    });
  }

  // ✅ NOVO: Métodos para eventos/histórico
  async getLabelHistory(labelId: string): Promise<LabelEvent[]> {
    return this.labelEventsRepository.find({
      where: { labelId },
      order: { createdAt: 'DESC' },
    });
  }

  async addLabelEvent(
    labelId: string,
    type: LabelEventType,
    userId?: string,
    metadata?: Record<string, any>,
  ): Promise<LabelEvent> {
    const event = this.labelEventsRepository.create({
      labelId,
      type,
      userId,
      metadata,
    });
    return this.labelEventsRepository.save(event);
  }
}
