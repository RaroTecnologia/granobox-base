import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecebimentoController } from './controllers/recebimento.controller';
import { RecebimentoService } from './services/recebimento.service';
import { InventoryCountController } from './controllers/inventory-count.controller';
import { InventoryCountService } from './services/inventory-count.service';
import { RastreabilidadeGuard } from './guards/rastreabilidade.guard';
import { ProductReceipt } from './entities/product-receipt.entity';
import { ProductReceiptItem } from './entities/product-receipt-item.entity';
import { InventoryCount } from './entities/inventory-count.entity';
import { Label } from '../labels/entities/label.entity';
import { StorageLocation } from '../storage-locations/entities/storage-location.entity';
import { Product } from '../products/entities/product.entity';
import { Operator } from '../operators/entities/operator.entity';
import { Client } from '../clients/entities/client.entity';
import { LimitsModule } from '../limits/limits.module';
import { V15Module } from '../v1-5/v1-5.module';
import { PrintersModule } from '../printers/printers.module';
import { TemplateProcessingModule } from '../template-processing/template-processing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductReceipt,
      ProductReceiptItem,
      InventoryCount,
      Label,
      StorageLocation,
      Product,
      Operator,
      Client,
    ]),
    LimitsModule,
    V15Module,
    PrintersModule,
    TemplateProcessingModule,
  ],
  controllers: [RecebimentoController, InventoryCountController],
  providers: [
    RecebimentoService,
    InventoryCountService,
    RastreabilidadeGuard,
  ],
  exports: [RecebimentoService, InventoryCountService, RastreabilidadeGuard],
})
export class RastreabilidadeModule {}