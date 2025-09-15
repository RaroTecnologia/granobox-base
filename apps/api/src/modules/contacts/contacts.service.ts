import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Contact } from './entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<Contact> {
    // Se for definido como contato principal, remover isPrimary de outros contatos do mesmo cliente
    if (createContactDto.isPrimary) {
      await this.contactsRepository.update(
        { clientId: createContactDto.clientId, isPrimary: true },
        { isPrimary: false }
      );
    }

    const contact = this.contactsRepository.create(createContactDto);
    return this.contactsRepository.save(contact);
  }

  async findAll(): Promise<Contact[]> {
    return this.contactsRepository.find({
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByClient(clientId: string): Promise<Contact[]> {
    return this.contactsRepository.find({
      where: { clientId, isActive: true },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Contact> {
    const contact = await this.contactsRepository.findOne({
      where: { id },
      relations: ['client'],
    });

    if (!contact) {
      throw new NotFoundException('Contato não encontrado');
    }

    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto): Promise<Contact> {
    const contact = await this.findOne(id);

    // Se for definido como contato principal, remover isPrimary de outros contatos do mesmo cliente
    if (updateContactDto.isPrimary && !contact.isPrimary) {
      await this.contactsRepository.update(
        { clientId: contact.clientId, isPrimary: true },
        { isPrimary: false }
      );
    }

    Object.assign(contact, updateContactDto);
    return this.contactsRepository.save(contact);
  }

  async remove(id: string): Promise<void> {
    const contact = await this.findOne(id);
    
    // Não permitir excluir contato principal se for o único contato
    if (contact.isPrimary) {
      const otherContacts = await this.contactsRepository.count({
        where: { clientId: contact.clientId, isActive: true, id: { $ne: id } as any },
      });
      
      if (otherContacts === 0) {
        throw new BadRequestException('Não é possível excluir o único contato do cliente');
      }
    }

    await this.contactsRepository.remove(contact);
  }

  async setPrimary(id: string): Promise<Contact> {
    const contact = await this.findOne(id);

    // Remover isPrimary de outros contatos do mesmo cliente
    await this.contactsRepository.update(
      { clientId: contact.clientId, isPrimary: true },
      { isPrimary: false }
    );

    // Definir este contato como principal
    contact.isPrimary = true;
    return this.contactsRepository.save(contact);
  }

  async toggleActive(id: string): Promise<Contact> {
    const contact = await this.findOne(id);
    
    // Não permitir desativar contato principal se for o único ativo
    if (contact.isPrimary && contact.isActive) {
      const otherActiveContacts = await this.contactsRepository.count({
        where: { clientId: contact.clientId, isActive: true, id: { $ne: id } as any },
      });
      
      if (otherActiveContacts === 0) {
        throw new BadRequestException('Não é possível desativar o único contato ativo do cliente');
      }
    }

    contact.isActive = !contact.isActive;
    return this.contactsRepository.save(contact);
  }
}
