import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LimitsController } from './limits.controller';
import { LimitsService } from './limits.service';
import { Client } from '../clients/entities/client.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';
import { Operation } from '../subscriptions/entities/operation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, Subscription, Plan, Operation]),
  ],
  controllers: [LimitsController],
  providers: [LimitsService],
  exports: [LimitsService],
})
export class LimitsModule {}
