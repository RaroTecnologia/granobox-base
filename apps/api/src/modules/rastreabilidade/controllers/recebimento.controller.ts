import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { JwtOrApiKeyAuthGuard } from '../../auth/guards/jwt-or-apikey-auth.guard';
import { RastreabilidadeGuard } from '../guards/rastreabilidade.guard';
import { RequireRastreabilidadeFeature } from '../decorators/require-rastreabilidade-feature.decorator';
import { RecebimentoService } from '../services/recebimento.service';
import { CreateRecebimentoDto } from '../dto/create-recebimento.dto';
import { CreatePorcionamentoDto } from '../dto/create-porcionamento.dto';
import { QueryRecebimentosDto } from '../dto/query-recebimentos.dto';

@ApiTags('Rastreabilidade - Recebimento')
@ApiBearerAuth()
@UseGuards(JwtOrApiKeyAuthGuard)
@Controller('rastreabilidade/recebimento')
export class RecebimentoController {
  constructor(private readonly recebimentoService: RecebimentoService) {}

  @Post()
  @UseGuards(RastreabilidadeGuard)
  @RequireRastreabilidadeFeature('recebimentoQR')
  @ApiOperation({ summary: 'Criar novo recebimento de produto' })
  @ApiResponse({ status: 201, description: 'Recebimento criado com sucesso' })
  @ApiResponse({
    status: 403,
    description: 'Recurso não disponível no plano atual',
  })
  async createRecebimento(
    @Body() createDto: CreateRecebimentoDto,
    @Request() req: any,
  ) {
    const clientId = req.user.clientId;
    const userId = req.user.sub;
    return this.recebimentoService.createRecebimento(
      createDto,
      clientId,
      userId,
    );
  }

  @Post(':id/gerar-etiquetas')
  @UseGuards(RastreabilidadeGuard)
  @RequireRastreabilidadeFeature('recebimentoQR')
  @ApiOperation({ summary: 'Gerar etiquetas para um recebimento' })
  @ApiResponse({ status: 200, description: 'Etiquetas geradas com sucesso' })
  @ApiResponse({
    status: 403,
    description: 'Recurso não disponível no plano atual',
  })
  async generateLabels(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const clientId = req.user.clientId;
    return this.recebimentoService.generateLabelsForReceipt(id, clientId);
  }

  @Post('porcionamento')
  @UseGuards(RastreabilidadeGuard)
  @RequireRastreabilidadeFeature('porcionamento')
  @ApiOperation({ summary: 'Criar porcionamento de um item' })
  @ApiResponse({ status: 201, description: 'Porcionamento criado com sucesso' })
  @ApiResponse({
    status: 403,
    description: 'Recurso não disponível no plano atual',
  })
  async createPorcionamento(
    @Body() createDto: CreatePorcionamentoDto,
    @Request() req: any,
  ) {
    const clientId = req.user.clientId;
    return this.recebimentoService.createPorcionamento(createDto, clientId);
  }

  @Get('item/:id/rastreabilidade')
  @UseGuards(RastreabilidadeGuard)
  @RequireRastreabilidadeFeature('rastreabilidadeCompleta')
  @ApiOperation({ summary: 'Obter árvore de rastreabilidade de um item' })
  @ApiResponse({ status: 200, description: 'Árvore de rastreabilidade' })
  @ApiResponse({
    status: 403,
    description: 'Recurso não disponível no plano atual',
  })
  async getRastreabilidadeTree(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const clientId = req.user.clientId;
    return this.recebimentoService.getRastreabilidadeTree(id, clientId);
  }

  @Get('estoque')
  @ApiOperation({ summary: 'Buscar dados de estoque processados' })
  @ApiResponse({ status: 200, description: 'Lista paginada de itens de estoque' })
  async getEstoque(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    data: any[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const clientId = req.user.clientId;
    return this.recebimentoService.getEstoque(clientId, search, page, limit);
  }

  @Get()
  @ApiOperation({ summary: 'Listar recebimentos do cliente com paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de recebimentos' })
  async findAllReceipts(
    @Request() req: any,
    @Query() queryDto: QueryRecebimentosDto,
  ) {
    const clientId = req.user.clientId;
    return this.recebimentoService.findPaginatedReceipts(clientId, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um recebimento' })
  @ApiResponse({ status: 200, description: 'Detalhes do recebimento' })
  @ApiResponse({ status: 404, description: 'Recebimento não encontrado' })
  async findReceiptById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const clientId = req.user.clientId;
    return this.recebimentoService.findReceiptById(id, clientId);
  }

  @Patch('item/:id/status')
  @ApiOperation({ summary: 'Atualizar status de um item' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async updateItemStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; notes?: string },
    @Request() req: any,
  ) {
    const clientId = req.user.clientId;
    return this.recebimentoService.updateItemStatus(
      id,
      body.status,
      body.notes,
      clientId,
    );
  }

  @Post('dar-baixa/:codigo')
  @ApiOperation({
    summary: 'Dar baixa em item por código da etiqueta (marcar como usado)',
  })
  @ApiResponse({ status: 200, description: 'Baixa registrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async darBaixaPorCodigo(
    @Param('codigo') codigo: string,
    @Body() body?: { notes?: string },
  ) {
    return this.recebimentoService.darBaixaPorCodigo(codigo, body?.notes);
  }
}
