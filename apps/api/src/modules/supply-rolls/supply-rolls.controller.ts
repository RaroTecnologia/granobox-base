import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SupplyRollsService } from './supply-rolls.service';
import { CreateSupplyRollsBatchDto } from './dto/create-supply-rolls-batch.dto';
import { InstallSupplyRollDto } from './dto/install-supply-roll.dto';
import { AssignSupplyRollDto } from './dto/assign-supply-roll.dto';
import { ReceiveSupplyRollsDto } from './dto/receive-supply-rolls.dto';
import { AssignToOrderDto } from './dto/assign-to-order.dto';
import { QuerySupplyRollsDto } from './dto/query-supply-rolls.dto';
import { SupplyRollStatus } from './entities/supply-roll.entity';

@ApiTags('Supply Rolls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('supply-rolls')
export class SupplyRollsController {
  constructor(private readonly service: SupplyRollsService) {}

  /**
   * Cria N rolos em batch para um SKU.
   * Retorna os UUIDs (conteúdo dos QR codes).
   * Usado pelo Control (Granobox) para gerar etiquetas QR.
   */
  @Post('batch')
  @ApiOperation({ summary: 'Criar rolos em batch (gerar QR codes)' })
  createBatch(@Body() dto: CreateSupplyRollsBatchDto) {
    return this.service.createBatch(dto);
  }

  /**
   * Listagem geral de rolos com filtros.
   * Deve ficar ANTES das rotas parametrizadas.
   */
  @Get()
  @ApiOperation({ summary: 'Listar rolos com filtros' })
  findAll(@Query() query: QuerySupplyRollsDto) {
    return this.service.findAll(query);
  }

  /**
   * Registra NF de fornecedor em batch de rolos.
   */
  @Post('receive')
  @ApiOperation({ summary: 'Registrar recebimento (NF fornecedor)' })
  receiveBatch(@Body() dto: ReceiveSupplyRollsDto) {
    return this.service.receiveBatch(dto);
  }

  /**
   * Vincula rolos a um pedido (label order) em batch.
   */
  @Post('assign-to-order')
  @ApiOperation({ summary: 'Vincular rolos a um pedido' })
  assignToOrder(@Body() dto: AssignToOrderDto) {
    return this.service.assignToOrder(dto);
  }

  /**
   * Busca rolo pelo shortCode (GBR-XXXXXX).
   * Deve ficar ANTES da rota :id para não conflitar.
   */
  @Get('by-code/:shortCode')
  @ApiOperation({ summary: 'Buscar rolo por shortCode (QR compacto)' })
  findByShortCode(@Param('shortCode') shortCode: string) {
    return this.service.findByShortCode(shortCode);
  }

  /**
   * Detalhes de um rolo — usado para preview ao escanear QR.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um rolo (scan preview)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * Associa rolo a um cliente (separação de pedido no Granobox).
   * Control (TODO): colaborador escaneia QR e informa o cliente.
   */
  @Post(':id/assign')
  @ApiOperation({ summary: 'Associar rolo a um cliente' })
  assign(@Param('id') id: string, @Body() dto: AssignSupplyRollDto) {
    return this.service.assign(id, dto);
  }

  /**
   * Instala rolo na impressora do cliente.
   * Usado pelo Tag (Flutter/web-vite): operador escaneia QR.
   * Efeitos: muda status → installed, decrementa estoque, reseta ribbon.
   */
  @Post(':id/install')
  @ApiOperation({ summary: 'Instalar rolo na impressora (scan no Tag)' })
  install(
    @Param('id') id: string,
    @Body() dto: InstallSupplyRollDto,
    @CurrentUser() user: any,
  ) {
    return this.service.install(id, dto, user.clientId);
  }

  /**
   * Marca rolo como esgotado.
   */
  @Post(':id/deplete')
  @ApiOperation({ summary: 'Marcar rolo como esgotado' })
  deplete(@Param('id') id: string) {
    return this.service.deplete(id);
  }

  /**
   * Rolos instalados em uma impressora.
   */
  @Get('printer/:printerId')
  @ApiOperation({ summary: 'Rolos instalados na impressora' })
  findByPrinter(@Param('printerId') printerId: string) {
    return this.service.findInstalledByPrinter(printerId);
  }

  /**
   * Rolos do cliente (assigned + installed).
   */
  @Get('client/:clientId')
  @ApiOperation({ summary: 'Rolos do cliente' })
  findByClient(
    @Param('clientId') clientId: string,
    @Query('status') status?: SupplyRollStatus,
  ) {
    return this.service.findByClient(clientId, status);
  }
}
