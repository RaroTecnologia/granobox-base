import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operator } from '../entities/operator.entity';
import { CreateOperatorDto, UpdateOperatorDto } from '../dto';

@Injectable()
export class OperatorsService {
  constructor(
    @InjectRepository(Operator)
    private operatorsRepository: Repository<Operator>,
  ) {}

  async create(createOperatorDto: CreateOperatorDto): Promise<Operator> {
    const operator = this.operatorsRepository.create(createOperatorDto);
    return this.operatorsRepository.save(operator);
  }

  async findAll(clientId: string): Promise<Operator[]> {
    return this.operatorsRepository.find({
      where: { clientId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Operator | null> {
    return this.operatorsRepository.findOne({
      where: { id },
      relations: ['client'],
    });
  }

  async update(id: string, updateOperatorDto: UpdateOperatorDto): Promise<Operator | null> {
    await this.operatorsRepository.update(id, updateOperatorDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.operatorsRepository.delete(id);
  }

  async validatePin(id: string, pin: string): Promise<boolean> {
    const operator = await this.operatorsRepository.findOne({
      where: { id, isActive: true },
      select: ['pin'],
    });
    return operator?.pin === pin;
  }

  async findByClientAndPin(clientId: string, pin: string): Promise<Operator | null> {
    return this.operatorsRepository.findOne({
      where: { clientId, pin, isActive: true },
    });
  }
}
