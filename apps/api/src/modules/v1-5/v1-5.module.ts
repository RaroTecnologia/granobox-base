import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { V15Controller } from './v1-5.controller';
import { V15Service } from './v1-5.service';
import { Label } from '../labels/entities/label.entity';
import { TemplateProcessingModule } from '../template-processing/template-processing.module';
import { EdgeGoWebSocketModule } from '../websocket/websocket.module';
import { PrintersModule } from '../printers/printers.module';
import { EdgeModule } from '../edge/edge.module';
import { LabelsModule } from '../labels/labels.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Label]),
    TemplateProcessingModule,
    EdgeGoWebSocketModule,
    PrintersModule,
    EdgeModule, // ⭐ Para PrintJobsService
    LabelsModule, // ⭐ Para LabelsService e criar eventos
  ],
  controllers: [V15Controller],
  providers: [V15Service],
  exports: [V15Service],
})
export class V15Module {}

