import { Module } from '@nestjs/common';
import { ConfigController, PrinterController, NotificationController, TagmentPrinterController } from './config.controller';
import { ConfigService } from './config.service';

@Module({
  controllers: [ConfigController, PrinterController, NotificationController, TagmentPrinterController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}






