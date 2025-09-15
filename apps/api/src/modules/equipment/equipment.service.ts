import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment, EquipmentStatus } from './entities/equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { Client } from '../clients/entities/client.entity';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  async create(createEquipmentDto: CreateEquipmentDto): Promise<Equipment> {
    // Verificar se o cliente existe
    const client = await this.clientsRepository.findOne({
      where: { id: createEquipmentDto.clientId },
    });
    if (!client) {
      throw new NotFoundException(
        `Cliente com ID ${createEquipmentDto.clientId} não encontrado`,
      );
    }

    // Verificar se o número de série já existe
    const existingEquipment = await this.equipmentRepository.findOne({
      where: { serialNumber: createEquipmentDto.serialNumber },
    });
    if (existingEquipment) {
      throw new ConflictException(
        `Já existe um equipamento com o número de série ${createEquipmentDto.serialNumber}`,
      );
    }

    // Verificar se o número do patrimônio já existe (se fornecido)
    if (createEquipmentDto.patrimonyNumber) {
      const existingPatrimony = await this.equipmentRepository.findOne({
        where: { patrimonyNumber: createEquipmentDto.patrimonyNumber },
      });
      if (existingPatrimony) {
        throw new ConflictException(
          `Já existe um equipamento com o número do patrimônio ${createEquipmentDto.patrimonyNumber}`,
        );
      }
    }

    const equipment = this.equipmentRepository.create({
      ...createEquipmentDto,
      loanStartDate: new Date(createEquipmentDto.loanStartDate),
      loanEndDate: createEquipmentDto.loanEndDate ? new Date(createEquipmentDto.loanEndDate) : undefined,
      returnDate: createEquipmentDto.returnDate ? new Date(createEquipmentDto.returnDate) : undefined,
      purchaseDate: createEquipmentDto.purchaseDate ? new Date(createEquipmentDto.purchaseDate) : undefined,
    });

    return this.equipmentRepository.save(equipment);
  }

  async findAll(clientId?: string): Promise<Equipment[]> {
    const query = this.equipmentRepository
      .createQueryBuilder('equipment')
      .leftJoinAndSelect('equipment.client', 'client');

    if (clientId) {
      query.andWhere('equipment.clientId = :clientId', { clientId });
    }

    return query.orderBy('equipment.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Equipment> {
    const equipment = await this.equipmentRepository.findOne({
      where: { id },
      relations: ['client'],
    });
    if (!equipment) {
      throw new NotFoundException(`Equipamento com ID ${id} não encontrado`);
    }
    return equipment;
  }

  async update(id: string, updateEquipmentDto: UpdateEquipmentDto): Promise<Equipment> {
    const equipment = await this.findOne(id);

    // Verificar se o número de série já existe em outro equipamento
    if (updateEquipmentDto.serialNumber && updateEquipmentDto.serialNumber !== equipment.serialNumber) {
      const existingEquipment = await this.equipmentRepository.findOne({
        where: { serialNumber: updateEquipmentDto.serialNumber },
      });
      if (existingEquipment) {
        throw new ConflictException(
          `Já existe um equipamento com o número de série ${updateEquipmentDto.serialNumber}`,
        );
      }
    }

    // Verificar se o número do patrimônio já existe em outro equipamento
    if (updateEquipmentDto.patrimonyNumber && updateEquipmentDto.patrimonyNumber !== equipment.patrimonyNumber) {
      const existingPatrimony = await this.equipmentRepository.findOne({
        where: { patrimonyNumber: updateEquipmentDto.patrimonyNumber },
      });
      if (existingPatrimony) {
        throw new ConflictException(
          `Já existe um equipamento com o número do patrimônio ${updateEquipmentDto.patrimonyNumber}`,
        );
      }
    }

    // Converter datas se fornecidas
    const updateData = {
      ...updateEquipmentDto,
      loanStartDate: updateEquipmentDto.loanStartDate ? new Date(updateEquipmentDto.loanStartDate) : undefined,
      loanEndDate: updateEquipmentDto.loanEndDate ? new Date(updateEquipmentDto.loanEndDate) : undefined,
      returnDate: updateEquipmentDto.returnDate ? new Date(updateEquipmentDto.returnDate) : undefined,
      purchaseDate: updateEquipmentDto.purchaseDate ? new Date(updateEquipmentDto.purchaseDate) : undefined,
    };

    Object.assign(equipment, updateData);
    return this.equipmentRepository.save(equipment);
  }

  async remove(id: string): Promise<void> {
    const equipment = await this.findOne(id);
    await this.equipmentRepository.remove(equipment);
  }

  async updateStatus(id: string, status: EquipmentStatus): Promise<Equipment> {
    const equipment = await this.findOne(id);
    equipment.status = status;
    
    // Se o status for "returned", definir a data de devolução
    if (status === EquipmentStatus.RETURNED && !equipment.returnDate) {
      equipment.returnDate = new Date();
    }
    
    return this.equipmentRepository.save(equipment);
  }

  async toggleActive(id: string): Promise<Equipment> {
    const equipment = await this.findOne(id);
    equipment.isActive = !equipment.isActive;
    return this.equipmentRepository.save(equipment);
  }

  async getEquipmentStats(clientId?: string) {
    const query = this.equipmentRepository.createQueryBuilder('equipment');
    
    if (clientId) {
      query.andWhere('equipment.clientId = :clientId', { clientId });
    }

    const [
      total,
      active,
      inactive,
      maintenance,
      returned,
    ] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('equipment.status = :status', { status: EquipmentStatus.ACTIVE }).getCount(),
      query.clone().andWhere('equipment.status = :status', { status: EquipmentStatus.INACTIVE }).getCount(),
      query.clone().andWhere('equipment.status = :status', { status: EquipmentStatus.MAINTENANCE }).getCount(),
      query.clone().andWhere('equipment.status = :status', { status: EquipmentStatus.RETURNED }).getCount(),
    ]);

    return {
      total,
      active,
      inactive,
      maintenance,
      returned,
    };
  }
}
