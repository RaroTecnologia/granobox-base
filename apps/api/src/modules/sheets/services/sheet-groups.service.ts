import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SheetGroup } from '../entities/sheet-group.entity';
import { CreateSheetGroupDto, UpdateSheetGroupDto } from '../dto/sheet-group.dto';

@Injectable()
export class SheetGroupsService {
  constructor(
    @InjectRepository(SheetGroup)
    private groupsRepository: Repository<SheetGroup>,
  ) {}

  async findAll(clientId: string): Promise<SheetGroup[]> {
    return this.groupsRepository.find({
      where: { clientId },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string, clientId: string): Promise<SheetGroup> {
    const group = await this.groupsRepository.findOne({
      where: { id, clientId },
    });
    if (!group) {
      throw new NotFoundException(`Grupo com ID ${id} não encontrado`);
    }
    return group;
  }

  async create(clientId: string, dto: CreateSheetGroupDto): Promise<SheetGroup> {
    const group = this.groupsRepository.create({
      ...dto,
      clientId,
      order: dto.order ?? 0,
    });
    return this.groupsRepository.save(group);
  }

  async update(id: string, clientId: string, dto: UpdateSheetGroupDto): Promise<SheetGroup> {
    const group = await this.findOne(id, clientId);
    Object.assign(group, dto);
    return this.groupsRepository.save(group);
  }

  async remove(id: string, clientId: string): Promise<void> {
    const group = await this.findOne(id, clientId);
    await this.groupsRepository.remove(group);
  }
}
