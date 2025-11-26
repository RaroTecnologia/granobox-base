import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MqttService } from './mqtt.service';
import { MqttController } from './mqtt.controller';
import { EdgeGoWebSocketGateway } from './edge-go-websocket.gateway';
import { EdgeGoWebSocketController } from './edge-go-websocket.controller';
import { PrintJob } from '../edge/entities/print-job.entity';
import { PrintJobsService } from '../edge/services/print-jobs.service';
import { DevicesModule } from '../devices/devices.module';
import { FirmwareModule } from '../firmware/firmware.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PrintJob]),
    DevicesModule, // Para acessar DevicesService
    FirmwareModule, // Para acessar FirmwareService
  ],
  providers: [MqttService, PrintJobsService, EdgeGoWebSocketGateway],
  controllers: [MqttController, EdgeGoWebSocketController],
  exports: [MqttService, EdgeGoWebSocketGateway], // Exporta para uso em outros módulos
})
export class MqttModule {}
