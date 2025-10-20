import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecebimentoController } from './controllers/recebimento.controller';
import { RecebimentoService } from './services/recebimento.service';
import { RastreabilidadeGuard } from './guards/rastreabilidade.guard';
import { ProductReceipt } from './entities/product-receipt.entity';
import { ProductReceiptItem } from './entities/product-receipt-item.entity';
import { Label } from '../labels/entities/label.entity';
import { LimitsModule } from '../limits/limits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductReceipt,
      ProductReceiptItem,
      Label,
    ]),
    LimitsModule,
  ],
  controllers: [RecebimentoController],
  providers: [RecebimentoService, RastreabilidadeGuard],
  exports: [RecebimentoService, RastreabilidadeGuard],
})
export class RastreabilidadeModule {}
