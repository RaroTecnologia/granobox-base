import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagmentConfig } from './entities/tagment-config.entity';
import { TemplateAssociation } from './entities/template-association.entity';
import { TagmentService } from './services/tagment.service';
import { TagmentController } from './controllers/tagment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TagmentConfig, TemplateAssociation])
  ],
  providers: [TagmentService],
  controllers: [TagmentController],
  exports: [TagmentService]
})
export class TagmentModule {}

