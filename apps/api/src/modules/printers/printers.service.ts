import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Printer, PrinterUsage } from './entities/printer.entity';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';

@Injectable()
export class PrintersService {
  constructor(
    @InjectRepository(Printer)
    private printersRepository: Repository<Printer>,
  ) {}

  async create(createPrinterDto: CreatePrinterDto): Promise<Printer> {
    console.log('CreatePrinterDto recebido:', createPrinterDto);
    try {
      const printer = this.printersRepository.create(createPrinterDto);
      console.log('Printer criado:', printer);
      const savedPrinter = await this.printersRepository.save(printer);
      console.log('Printer salvo:', savedPrinter);
      return savedPrinter;
    } catch (error) {
      console.error('Erro ao criar impressora:', error);
      throw error;
    }
  }

  async findAll(clientId?: string): Promise<Printer[]> {
    const query = this.printersRepository.createQueryBuilder('printer')
      .leftJoinAndSelect('printer.client', 'client')
      .leftJoinAndSelect('printer.createdBy', 'createdBy')
      .orderBy('printer.createdAt', 'DESC');

    if (clientId) {
      query.where('printer.clientId = :clientId', { clientId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Printer | null> {
    return this.printersRepository.findOne({
      where: { id },
      relations: ['client', 'createdBy']
    });
  }

  async update(id: string, updatePrinterDto: UpdatePrinterDto): Promise<Printer | null> {
    await this.printersRepository.update(id, updatePrinterDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.printersRepository.delete(id);
  }

  async findByTagmentId(tagmentId: string, clientId: string): Promise<Printer | null> {
    return this.printersRepository.findOne({
      where: { tagmentId, clientId }
    });
  }

  async findByUsage(usage: string, clientId: string): Promise<Printer[]> {
    return this.printersRepository
      .createQueryBuilder('printer')
      .where('printer.clientId = :clientId', { clientId })
      .andWhere('printer.isActive = :isActive', { isActive: true })
      .andWhere(':usage = ANY(printer.usage)', { usage })
      .getMany();
  }

  async syncWithTagment(tagmentPrinters: any[], clientId: string, createdBy: string): Promise<Printer[]> {
    const syncedPrinters: Printer[] = [];

    for (const tagmentPrinter of tagmentPrinters) {
      // Verificar se já existe
      let printer = await this.findByTagmentId(tagmentPrinter.id, clientId);

      if (!printer) {
        // Criar nova impressora apenas com metadados Granobox
        const createDto: CreatePrinterDto = {
          tagmentId: tagmentPrinter.id,
          location: 'Não definida',
          usage: [PrinterUsage.VALIDITY],
          isActive: true,
          clientId,
          createdById: createdBy
        };
        printer = await this.create(createDto);
      }

      syncedPrinters.push(printer);
    }

    return syncedPrinters;
  }

  // Método para buscar dados completos da impressora (Granobox + Tagment)
  async getPrinterWithTagmentData(printerId: string): Promise<any> {
    const printer = await this.findOne(printerId);
    if (!printer) {
      return null;
    }

    // Aqui você faria uma chamada para a API do Tagment para buscar dados atualizados
    // Por enquanto, retornamos apenas os dados do Granobox
    return {
      id: printer.id,
      tagmentId: printer.tagmentId,
      location: printer.location,
      usage: printer.usage,
      isActive: printer.isActive,
      notes: printer.notes,
      clientId: printer.clientId,
      createdAt: printer.createdAt,
      updatedAt: printer.updatedAt,
      // Dados do Tagment seriam buscados em tempo real aqui
      tagmentData: {
        // name, ip, port, status, etc. - buscados via API do Tagment
        needsTagmentApiCall: true
      }
    };
  }
}
