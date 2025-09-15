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

import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { Equipment, EquipmentStatus } from './entities/equipment.entity';

@ApiTags('Equipment')
@ApiBearerAuth()
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo equipamento' })
  @ApiResponse({
    status: 201,
    description: 'Equipamento criado com sucesso',
    type: Equipment,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Número de série ou patrimônio já existe',
  })
  create(@Body() createEquipmentDto: CreateEquipmentDto): Promise<Equipment> {
    return this.equipmentService.create(createEquipmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os equipamentos ou filtrar por cliente' })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'ID do cliente para filtrar equipamentos',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de equipamentos',
    type: [Equipment],
  })
  findAll(@Query('clientId') clientId?: string): Promise<Equipment[]> {
    return this.equipmentService.findAll(clientId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas dos equipamentos' })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'ID do cliente para filtrar estatísticas',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas dos equipamentos',
  })
  getStats(@Query('clientId') clientId?: string) {
    return this.equipmentService.getEquipmentStats(clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar equipamento por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID do equipamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Equipamento encontrado',
    type: Equipment,
  })
  @ApiResponse({
    status: 404,
    description: 'Equipamento não encontrado',
  })
  findOne(@Param('id') id: string): Promise<Equipment> {
    return this.equipmentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar equipamento' })
  @ApiParam({
    name: 'id',
    description: 'ID do equipamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Equipamento atualizado com sucesso',
    type: Equipment,
  })
  @ApiResponse({
    status: 404,
    description: 'Equipamento não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Número de série ou patrimônio já existe',
  })
  update(
    @Param('id') id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
  ): Promise<Equipment> {
    return this.equipmentService.update(id, updateEquipmentDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do equipamento' })
  @ApiParam({
    name: 'id',
    description: 'ID do equipamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do equipamento atualizado com sucesso',
    type: Equipment,
  })
  @ApiResponse({
    status: 404,
    description: 'Equipamento não encontrado',
  })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: EquipmentStatus,
  ): Promise<Equipment> {
    return this.equipmentService.updateStatus(id, status);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Ativar/desativar equipamento' })
  @ApiParam({
    name: 'id',
    description: 'ID do equipamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Status ativo do equipamento alterado com sucesso',
    type: Equipment,
  })
  @ApiResponse({
    status: 404,
    description: 'Equipamento não encontrado',
  })
  toggleActive(@Param('id') id: string): Promise<Equipment> {
    return this.equipmentService.toggleActive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir equipamento' })
  @ApiParam({
    name: 'id',
    description: 'ID do equipamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Equipamento excluído com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Equipamento não encontrado',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.equipmentService.remove(id);
  }
}
