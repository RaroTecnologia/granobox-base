import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageLocation } from './entities/storage-location.entity';
import { CreateStorageLocationDto } from './dto/create-storage-location.dto';
import { UpdateStorageLocationDto } from './dto/update-storage-location.dto';

@Injectable()
export class StorageLocationsService {
  constructor(
    @InjectRepository(StorageLocation)
    private storageLocationsRepository: Repository<StorageLocation>,
  ) {}

  async create(clientId: string, createStorageLocationDto: CreateStorageLocationDto): Promise<StorageLocation> {
    // Verificar se já existe um local com o mesmo nome para este cliente
    const existingLocation = await this.storageLocationsRepository.findOne({
      where: { 
        nome: createStorageLocationDto.nome, 
        clientId 
      }
    });

    if (existingLocation) {
      throw new BadRequestException('Já existe um local com este nome');
    }

    const storageLocation = this.storageLocationsRepository.create({
      ...createStorageLocationDto,
      clientId,
    });

    return this.storageLocationsRepository.save(storageLocation);
  }

  async findAll(clientId: string): Promise<StorageLocation[]> {
    return this.storageLocationsRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllActive(clientId: string): Promise<StorageLocation[]> {
    return this.storageLocationsRepository.find({
      where: { clientId, ativo: true },
      order: { nome: 'ASC' },
    });
  }

  async findOne(id: string, clientId: string): Promise<StorageLocation> {
    const storageLocation = await this.storageLocationsRepository.findOne({
      where: { id, clientId },
    });

    if (!storageLocation) {
      throw new NotFoundException('Local de armazenamento não encontrado');
    }

    return storageLocation;
  }

  async update(id: string, clientId: string, updateStorageLocationDto: UpdateStorageLocationDto): Promise<StorageLocation> {
    const storageLocation = await this.findOne(id, clientId);

    // Se está alterando o nome, verificar se não existe outro com o mesmo nome
    if (updateStorageLocationDto.nome && updateStorageLocationDto.nome !== storageLocation.nome) {
      const existingLocation = await this.storageLocationsRepository.findOne({
        where: { 
          nome: updateStorageLocationDto.nome, 
          clientId
        }
      });

      if (existingLocation && existingLocation.id !== id) {
        throw new BadRequestException('Já existe um local com este nome');
      }
    }

    Object.assign(storageLocation, updateStorageLocationDto);
    return this.storageLocationsRepository.save(storageLocation);
  }

  async remove(id: string, clientId: string): Promise<void> {
    const storageLocation = await this.findOne(id, clientId);
    
    // TODO: Verificar se o local está sendo usado em alguma etiqueta
    // Se estiver, não permitir exclusão ou marcar como inativo
    
    await this.storageLocationsRepository.remove(storageLocation);
  }

  async toggleStatus(id: string, clientId: string): Promise<StorageLocation> {
    const storageLocation = await this.findOne(id, clientId);
    storageLocation.ativo = !storageLocation.ativo;
    return this.storageLocationsRepository.save(storageLocation);
  }

  async findByType(clientId: string, tipo: string): Promise<StorageLocation[]> {
    return this.storageLocationsRepository.find({
      where: { clientId, tipo: tipo as any, ativo: true },
      order: { nome: 'ASC' },
    });
  }

  async findBySetor(clientId: string, setor: string): Promise<StorageLocation[]> {
    return this.storageLocationsRepository.find({
      where: { clientId, setor, ativo: true },
      order: { nome: 'ASC' },
    });
  }
}
