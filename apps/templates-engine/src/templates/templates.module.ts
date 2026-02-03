import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { ZplProcessorService } from '../processors/zpl-processor.service';
import { ImageProcessorService } from '../processors/image-processor.service';
import { StudioProcessorService } from '../processors/studio-processor.service';
import { ElementsProcessorService } from '../processors/elements-processor.service';

@Module({
  controllers: [TemplatesController],
  providers: [
    TemplatesService,
    ZplProcessorService,
    ImageProcessorService,
    StudioProcessorService,
    ElementsProcessorService,
  ],
  exports: [TemplatesService],
})
export class TemplatesModule {}
