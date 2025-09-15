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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiResponse({
    status: 201,
    description: 'Cliente criado com sucesso',
    type: Client,
  })
  @ApiResponse({
    status: 409,
    description: 'CPF/CNPJ já está cadastrado',
  })
  create(@Body() createClientDto: CreateClientDto): Promise<Client> {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os clientes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes',
    type: [Client],
  })
  findAll(): Promise<Client[]> {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado',
    type: Client,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
  })
  findOne(@Param('id') id: string): Promise<Client> {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiParam({
    name: 'id',
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente atualizado com sucesso',
    type: Client,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
  })
  update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    return this.clientsService.update(id, updateClientDto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Ativar cliente' })
  @ApiParam({
    name: 'id',
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente ativado com sucesso',
    type: Client,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
  })
  activate(@Param('id') id: string): Promise<Client> {
    return this.clientsService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desativar cliente' })
  @ApiParam({
    name: 'id',
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente desativado com sucesso',
    type: Client,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
  })
  deactivate(@Param('id') id: string): Promise<Client> {
    return this.clientsService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir cliente' })
  @ApiParam({
    name: 'id',
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Cliente excluído com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.clientsService.remove(id);
  }
}
