import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';

@ApiTags('Contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo contato' })
  @ApiResponse({
    status: 201,
    description: 'Contato criado com sucesso',
    type: Contact,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  create(@Body() createContactDto: CreateContactDto): Promise<Contact> {
    return this.contactsService.create(createContactDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os contatos' })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'Filtrar contatos por cliente',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de contatos',
    type: [Contact],
  })
  findAll(@Query('clientId') clientId?: string): Promise<Contact[]> {
    if (clientId) {
      return this.contactsService.findByClient(clientId);
    }
    return this.contactsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar contato por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID do contato',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Contato encontrado',
    type: Contact,
  })
  @ApiResponse({
    status: 404,
    description: 'Contato não encontrado',
  })
  findOne(@Param('id') id: string): Promise<Contact> {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar contato' })
  @ApiParam({
    name: 'id',
    description: 'ID do contato',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Contato atualizado com sucesso',
    type: Contact,
  })
  @ApiResponse({
    status: 404,
    description: 'Contato não encontrado',
  })
  update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    return this.contactsService.update(id, updateContactDto);
  }

  @Patch(':id/set-primary')
  @ApiOperation({ summary: 'Definir contato como principal' })
  @ApiParam({
    name: 'id',
    description: 'ID do contato',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Contato definido como principal',
    type: Contact,
  })
  @ApiResponse({
    status: 404,
    description: 'Contato não encontrado',
  })
  setPrimary(@Param('id') id: string): Promise<Contact> {
    return this.contactsService.setPrimary(id);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Ativar/desativar contato' })
  @ApiParam({
    name: 'id',
    description: 'ID do contato',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do contato alterado',
    type: Contact,
  })
  @ApiResponse({
    status: 404,
    description: 'Contato não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível desativar o único contato ativo',
  })
  toggleActive(@Param('id') id: string): Promise<Contact> {
    return this.contactsService.toggleActive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir contato' })
  @ApiParam({
    name: 'id',
    description: 'ID do contato',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Contato excluído com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Contato não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível excluir o único contato do cliente',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.contactsService.remove(id);
  }
}
