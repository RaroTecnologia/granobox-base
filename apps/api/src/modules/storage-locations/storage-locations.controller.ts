import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StorageLocationsService } from './storage-locations.service';
import { CreateStorageLocationDto } from './dto/create-storage-location.dto';
import { UpdateStorageLocationDto } from './dto/update-storage-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageLocation } from './entities/storage-location.entity';

@ApiTags('storage-locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage-locations')
export class StorageLocationsController {
  constructor(private readonly storageLocationsService: StorageLocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo local de armazenamento' })
  @ApiResponse({ status: 201, description: 'Local criado com sucesso', type: StorageLocation })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Request() req, @Body() createStorageLocationDto: CreateStorageLocationDto) {
    return this.storageLocationsService.create(req.user.clientId, createStorageLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os locais de armazenamento' })
  @ApiResponse({ status: 200, description: 'Lista de locais', type: [StorageLocation] })
  findAll(@Request() req, @Query('active') active?: string) {
    if (active === 'true') {
      return this.storageLocationsService.findAllActive(req.user.clientId);
    }
    return this.storageLocationsService.findAll(req.user.clientId);
  }

  @Get('by-type/:type')
  @ApiOperation({ summary: 'Listar locais por tipo' })
  @ApiResponse({ status: 200, description: 'Lista de locais por tipo', type: [StorageLocation] })
  findByType(@Request() req, @Param('type') type: string) {
    return this.storageLocationsService.findByType(req.user.clientId, type);
  }

  @Get('by-setor/:setor')
  @ApiOperation({ summary: 'Listar locais por setor' })
  @ApiResponse({ status: 200, description: 'Lista de locais por setor', type: [StorageLocation] })
  findBySetor(@Request() req, @Param('setor') setor: string) {
    return this.storageLocationsService.findBySetor(req.user.clientId, setor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar local por ID' })
  @ApiResponse({ status: 200, description: 'Local encontrado', type: StorageLocation })
  @ApiResponse({ status: 404, description: 'Local não encontrado' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.storageLocationsService.findOne(id, req.user.clientId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar local de armazenamento' })
  @ApiResponse({ status: 200, description: 'Local atualizado com sucesso', type: StorageLocation })
  @ApiResponse({ status: 404, description: 'Local não encontrado' })
  update(@Request() req, @Param('id') id: string, @Body() updateStorageLocationDto: UpdateStorageLocationDto) {
    return this.storageLocationsService.update(id, req.user.clientId, updateStorageLocationDto);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Alternar status ativo/inativo do local' })
  @ApiResponse({ status: 200, description: 'Status alterado com sucesso', type: StorageLocation })
  @ApiResponse({ status: 404, description: 'Local não encontrado' })
  toggleStatus(@Request() req, @Param('id') id: string) {
    return this.storageLocationsService.toggleStatus(id, req.user.clientId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir local de armazenamento' })
  @ApiResponse({ status: 200, description: 'Local excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Local não encontrado' })
  remove(@Request() req, @Param('id') id: string) {
    return this.storageLocationsService.remove(id, req.user.clientId);
  }
}
