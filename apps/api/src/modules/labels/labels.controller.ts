import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, NotFoundException, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { QueryLabelsDto } from './dto/query-labels.dto';
import { LabelStatus } from './entities/label.entity';
import { JwtOrApiKeyAuthGuard } from '../auth/guards/jwt-or-apikey-auth.guard';

@ApiTags('Labels')
@ApiBearerAuth()
@UseGuards(JwtOrApiKeyAuthGuard)
@Controller('labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new label' })
  @ApiResponse({ status: 201, description: 'Label created successfully' })
  create(@Body() createLabelDto: CreateLabelDto) {
    return this.labelsService.create(createLabelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all labels (DEPRECATED - use /paginated)' })
  @ApiResponse({ status: 200, description: 'List of labels' })
  findAll(@Query('clientId') clientId?: string, @Query('type') type?: string) {
    return this.labelsService.findAll(clientId, type);
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Get labels with pagination and filters' })
  @ApiResponse({ 
    status: 200, 
    description: 'Paginated list of labels',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' }
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
          }
        }
      }
    }
  })
  findPaginated(@Query() queryDto: QueryLabelsDto) {
    return this.labelsService.findPaginated(queryDto);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending labels' })
  @ApiResponse({ status: 200, description: 'List of pending labels' })
  findPending(@Query('clientId') clientId?: string) {
    return this.labelsService.findPending(clientId);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get label by friendly code' })
  @ApiResponse({ status: 200, description: 'Label details' })
  findByCode(@Param('code') code: string) {
    return this.labelsService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get label by ID' })
  @ApiResponse({ status: 200, description: 'Label details' })
  findOne(@Param('id') id: string) {
    return this.labelsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update label status' })
  @ApiResponse({ status: 200, description: 'Label status updated successfully' })
  updateStatus(@Param('id') id: string, @Body('status') status: LabelStatus) {
    return this.labelsService.updateStatus(id, status);
  }

  @Post('mark-printed')
  @ApiOperation({ summary: 'Mark labels as printed' })
  @ApiResponse({ status: 200, description: 'Labels marked as printed' })
  markAsPrinted(@Body('ids') ids: string[]) {
    return this.labelsService.markAsPrinted(ids);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update label metadata' })
  @ApiResponse({ status: 200, description: 'Label metadata updated successfully' })
  updateMetadata(@Param('id') id: string, @Body('metadata') metadata: Record<string, any>) {
    return this.labelsService.updateMetadata(id, metadata);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete label' })
  @ApiResponse({ status: 200, description: 'Label deleted successfully' })
  remove(@Param('id') id: string) {
    return this.labelsService.remove(id);
  }

  @Post('dar-baixa/:codigo')
  @ApiOperation({ summary: 'Dar baixa em etiqueta por código (marcar como consumida)' })
  @ApiResponse({ status: 200, description: 'Baixa registrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Etiqueta não encontrada' })
  async darBaixaPorCodigo(@Param('codigo') codigo: string, @Request() req: any) {
    // Obter clientId do usuário autenticado (via JWT ou device.user)
    const clientId = req.user?.clientId || req.device?.user?.clientId;
    
    const label = await this.labelsService.darBaixaPorCodigo(codigo, clientId);
    
    if (!label) {
      throw new NotFoundException('Etiqueta não encontrada');
    }
    
    // ✅ Retornar apenas dados essenciais para economizar banda e processamento
    return {
      code: label.code,
      productName: label.product?.name || 'Produto',
      validityDate: label.validityDate,
      status: label.status,
      alreadyConsumed: (label as any).alreadyConsumed || false,
    };
  }

  // ✅ NOVO: Endpoints para histórico de eventos
  @Get(':id/history')
  @ApiOperation({ summary: 'Get label event history' })
  @ApiResponse({ status: 200, description: 'Label event history' })
  async getLabelHistory(@Param('id') id: string) {
    return this.labelsService.getLabelHistory(id);
  }

  @Post(':id/events')
  @ApiOperation({ summary: 'Add event to label history' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async addLabelEvent(
    @Param('id') id: string,
    @Body() body: { type: string; userId?: string; metadata?: any },
  ) {
    return this.labelsService.addLabelEvent(id, body.type as any, body.userId, body.metadata);
  }
}
