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
    const operation = this.operationsRepository.create(createOperationDto);
    return this.operationsRepository.save(operation);
  }

  async findAll(clientId?: string): Promise<Operation[]> {
    const query = this.operationsRepository.createQueryBuilder('operation')
      .leftJoinAndSelect('operation.subscription', 'subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .orderBy('operation.createdAt', 'DESC');

    if (clientId) {
      query.where('operation.clientId = :clientId', { clientId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Operation | null> {
    return this.operationsRepository.findOne({
      where: { id },
      relations: ['subscription', 'subscription.plan', 'client'],
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
