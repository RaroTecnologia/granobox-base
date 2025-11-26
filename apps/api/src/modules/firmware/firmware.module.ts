import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirmwareService } from './firmware.service';
import { FirmwareController } from './firmware.controller';
import { FirmwareVersion } from './entities/firmware-version.entity';
import { DeviceVersion } from './entities/device-version.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FirmwareVersion, DeviceVersion])
  ],
  providers: [FirmwareService],
  controllers: [FirmwareController],
  exports: [FirmwareService],
})
export class FirmwareModule {}
