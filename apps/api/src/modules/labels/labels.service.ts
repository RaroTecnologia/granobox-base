import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label, LabelStatus } from './entities/label.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { generateUniqueCode } from './utils/label-code.utils';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label)
    private labelsRepository: Repository<Label>,
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
    return this.labelsRepository.findOne({
      where: { code },
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
}
