import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplyRoll } from './entities/supply-roll.entity';
import { SupplyRollsService } from './supply-rolls.service';
import { SupplyRollsController } from './supply-rolls.controller';
import { LabelSku } from '../label-orders/entities/label-sku.entity';
import { LabelOrder } from '../label-orders/entities/label-order.entity';
import { Printer } from '../printers/entities/printer.entity';
import { SupplyStock } from '../client-supply-kits/entities/supply-stock.entity';
import { ClientSupplyKitItem } from '../client-supply-kits/entities/client-supply-kit-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupplyRoll,
      LabelSku,
      LabelOrder,
      Printer,
      SupplyStock,
      ClientSupplyKitItem,
    ]),
  ],
  controllers: [SupplyRollsController],
  providers: [SupplyRollsService],
  exports: [SupplyRollsService],
})
export class SupplyRollsModule {}
