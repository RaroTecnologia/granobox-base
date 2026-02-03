import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateAssociation } from './entities/template-association.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../products/entities/category.entity';
import { Client } from '../clients/entities/client.entity';
import { TemplateProcessingService } from './services/template-processing.service';
import { TemplateProcessingController } from './controllers/template-processing.controller';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TemplateAssociation,
      Product,
      Category,
      Client,
    ]),
    TemplatesModule, // Para buscar templates locais e usar templates-engine
  ],
  providers: [TemplateProcessingService],
  controllers: [TemplateProcessingController],
  exports: [TemplateProcessingService],
})
export class TemplateProcessingModule {}
