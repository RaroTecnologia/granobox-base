import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import { EquipmentUploadController } from './equipment-upload.controller';
import { Equipment } from './entities/equipment.entity';
import { Client } from '../clients/entities/client.entity';
import { UploadModule } from '../../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipment, Client]),
    UploadModule,
  ],
  controllers: [EquipmentController, EquipmentUploadController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}
