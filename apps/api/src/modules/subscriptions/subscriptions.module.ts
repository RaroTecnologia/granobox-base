import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlansController } from './controllers/plans.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { OperationsController } from './controllers/operations.controller';
import { PlansService } from './services/plans.service';
import { SubscriptionsService } from './services/subscriptions.service';
import { OperationsService } from './services/operations.service';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { Operation } from './entities/operation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan, Subscription, Operation]),
  ],
  controllers: [
    PlansController,
    SubscriptionsController,
    OperationsController,
  ],
  providers: [
    PlansService,
    SubscriptionsService,
    OperationsService,
  ],
  exports: [
    PlansService,
    SubscriptionsService,
    OperationsService,
  ],
})
export class SubscriptionsModule {}