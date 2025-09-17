import { Module } from '@nestjs/common';
import { ConfigController, PrinterController, NotificationController } from './config.controller';
import { ConfigService } from './config.service';

@Module({
  controllers: [ConfigController, PrinterController, NotificationController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}




