import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageLocationsService } from './storage-locations.service';
import { StorageLocationsController } from './storage-locations.controller';
import { StorageLocation } from './entities/storage-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StorageLocation])],
  controllers: [StorageLocationsController],
  providers: [StorageLocationsService],
  exports: [StorageLocationsService],
})
export class StorageLocationsModule {}




