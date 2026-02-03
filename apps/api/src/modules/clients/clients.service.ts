import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Client, ClientType } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AsaasService } from '../asaas/asaas.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private asaasService: AsaasService,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    // Verificar se CPF/CNPJ já existe
    if (
      createClientDto.clientType === ClientType.INDIVIDUAL &&
      createClientDto.cpf
    ) {
      const existingClient = await this.clientsRepository.findOne({
        where: { cpf: createClientDto.cpf },
      });
      if (existingClient) {
        throw new ConflictException('CPF já está cadastrado');
      }
    }

    if (
      createClientDto.clientType === ClientType.BUSINESS &&
      createClientDto.cnpj
    ) {
      const existingClient = await this.clientsRepository.findOne({
        where: { cnpj: createClientDto.cnpj },
      });
      if (existingClient) {
        throw new ConflictException('CNPJ já está cadastrado');
      }
    }

    const client = this.clientsRepository.create(createClientDto);
    const saved = await this.clientsRepository.save(client);
    await this.syncClientToAsaas(saved).catch(() => {});
    return this.clientsRepository.findOne({ where: { id: saved.id } }) || saved;
  }

  async findAll(): Promise<Client[]> {
    return this.clientsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, updateClientDto);
    const saved = await this.clientsRepository.save(client);
    await this.syncClientToAsaas(saved).catch(() => {});
    return this.clientsRepository.findOne({ where: { id } }) || saved;
  }

  private async syncClientToAsaas(client: Client): Promise<void> {
    const asaasId = await this.asaasService.createOrUpdateCustomer(client);
    if (asaasId && client.asaasCustomerId !== asaasId) {
      await this.clientsRepository.update(client.id, { asaasCustomerId: asaasId });
    }
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientsRepository.remove(client);
  }

  async activate(id: string): Promise<Client> {
    const client = await this.findOne(id);

    client.isActive = true;
    client.activatedAt = new Date();

    return this.clientsRepository.save(client);
  }

  async deactivate(id: string): Promise<Client> {
    const client = await this.findOne(id);

    client.isActive = false;
    client.activatedAt = undefined;

    return this.clientsRepository.save(client);
  }
}
