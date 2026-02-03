import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InventoryCountService } from '../services/inventory-count.service';
import { QueryContagensDto } from '../dto/query-contagens.dto';

@ApiTags('Inventory Count')
@Controller('inventory-counts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryCountController {
  private readonly logger = new Logger(InventoryCountController.name);

  constructor(
    private readonly inventoryCountService: InventoryCountService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar contagens de estoque (com paginação)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de contagens' })
  async findAll(
    @Request() req,
    @Query() queryDto: QueryContagensDto,
  ) {
    // Se não tiver parâmetros de paginação, retornar lista simples
    if (!queryDto.page && !queryDto.limit && !queryDto.search) {
      return this.inventoryCountService.findAll(req.user.clientId);
    }
    // Caso contrário, retornar paginado
    return this.inventoryCountService.findPaginatedContagens(
      req.user.clientId,
      queryDto,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar contagem de estoque por ID' })
  @ApiResponse({ status: 200, description: 'Contagem encontrada' })
  @ApiResponse({ status: 404, description: 'Contagem não encontrada' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.inventoryCountService.findOne(id, req.user.clientId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova contagem de estoque' })
  @ApiResponse({ status: 201, description: 'Contagem criada' })
  async create(@Body() data: any, @Request() req) {
    return this.inventoryCountService.create({
      ...data,
      clientId: req.user.clientId,
    });
  }

  @Post('items')
  @ApiOperation({ summary: 'Criar múltiplas contagens de estoque (itens individuais)' })
  @ApiResponse({ status: 201, description: 'Contagens criadas' })
  async createCountItems(@Body() body: { items: any[] }, @Request() req) {
    try {
      this.logger.log(`Criando ${body.items?.length || 0} contagens para clientId: ${req.user.clientId}`);
      this.logger.debug('Items recebidos:', JSON.stringify(body.items, null, 2));
      
      const result = await this.inventoryCountService.createCountItems(
        req.user.clientId,
        body.items,
      );
      
      this.logger.log(`Contagens criadas com sucesso: ${result.length}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao criar contagens: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar contagem de estoque' })
  @ApiResponse({ status: 200, description: 'Contagem atualizada' })
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req,
  ) {
    return this.inventoryCountService.update(id, req.user.clientId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir contagem de estoque' })
  @ApiResponse({ status: 200, description: 'Contagem excluída' })
  async delete(@Param('id') id: string, @Request() req) {
    await this.inventoryCountService.delete(id, req.user.clientId);
    return { message: 'Contagem excluída com sucesso' };
  }
}
