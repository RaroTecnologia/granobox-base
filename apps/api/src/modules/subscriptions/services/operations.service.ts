import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operation } from '../entities/operation.entity';
import { CreateOperationDto } from '../dto/create-operation.dto';

@Injectable()
export class OperationsService {
  constructor(
    @InjectRepository(Operation)
    private operationsRepository: Repository<Operation>,
  ) {}

  async create(createOperationDto: CreateOperationDto): Promise<Operation> {
    // Extrair dados de endereço do metadata se existir
    const { metadata, ...operationData } = createOperationDto;
    
    const operation = this.operationsRepository.create({
      ...operationData,
      // Mapear campos de endereço do metadata para colunas individuais
      zipCode: createOperationDto.zipCode || metadata?.address?.zipCode,
      street: createOperationDto.street || metadata?.address?.street,
      number: createOperationDto.number || metadata?.address?.number,
      complement: createOperationDto.complement || metadata?.address?.complement,
      neighborhood: createOperationDto.neighborhood || metadata?.address?.neighborhood,
      city: createOperationDto.city || metadata?.address?.city,
      state: createOperationDto.state || metadata?.address?.state,
      notes: createOperationDto.notes || metadata?.notes,
      // Campos de contato
      contactName: createOperationDto.contactName || metadata?.contact?.name || 'N/A',
      contactEmail: createOperationDto.contactEmail || metadata?.contact?.email || '',
      contactPhone: createOperationDto.contactPhone || metadata?.contact?.phone || '',
      metadata: metadata, // Manter o metadata original
    });
    
    return this.operationsRepository.save(operation);
  }

  async findAll(clientId?: string): Promise<Operation[]> {
    const query = this.operationsRepository.createQueryBuilder('operation')
      .orderBy('operation.createdAt', 'DESC');

    if (clientId) {
      query.where('operation.clientId = :clientId', { clientId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Operation | null> {
    return this.operationsRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateOperationDto: Partial<CreateOperationDto>): Promise<Operation | null> {
    await this.operationsRepository.update(id, updateOperationDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.operationsRepository.delete(id);
  }
}

