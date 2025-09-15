import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../entities/plan.entity';
import { CreatePlanDto } from '../dto/create-plan.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private plansRepository: Repository<Plan>,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const plan = this.plansRepository.create(createPlanDto);
    return this.plansRepository.save(plan);
  }

  async findAll(): Promise<Plan[]> {
    return this.plansRepository.find({
      relations: ['subscriptions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Plan[]> {
    return this.plansRepository.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Plan | null> {
    return this.plansRepository.findOne({
      where: { id },
      relations: ['subscriptions'],
    });
  }

  async update(id: string, updatePlanDto: Partial<CreatePlanDto>): Promise<Plan | null> {
    await this.plansRepository.update(id, updatePlanDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.plansRepository.delete(id);
  }
}
