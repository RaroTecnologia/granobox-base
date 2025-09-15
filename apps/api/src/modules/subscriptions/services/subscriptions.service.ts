import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
    const subscription = this.subscriptionsRepository.create(createSubscriptionDto);
    return this.subscriptionsRepository.save(subscription);
  }

  async findAll(clientId?: string): Promise<Subscription[]> {
    const query = this.subscriptionsRepository.createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('subscription.operations', 'operations')
      .orderBy('subscription.createdAt', 'DESC');

    if (clientId) {
      query.where('subscription.clientId = :clientId', { clientId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({
      where: { id },
      relations: ['plan', 'operations', 'client'],
    });
  }

  async update(id: string, updateSubscriptionDto: Partial<CreateSubscriptionDto>): Promise<Subscription | null> {
    await this.subscriptionsRepository.update(id, updateSubscriptionDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.subscriptionsRepository.delete(id);
  }
}
