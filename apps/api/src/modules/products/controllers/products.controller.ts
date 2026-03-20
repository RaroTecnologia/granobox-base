import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { CreateProductDto, UpdateProductDto } from '../dto';
import { ImportBatchDto } from '../dto/import-batch.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async create(@Body() createProductDto: CreateProductDto, @Request() req) {
    createProductDto.clientId = req.user.clientId;
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products for the authenticated client' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('categoryId') categoryId?: string,
    @Query('operationId') operationId?: string, // ⭐ NOVO
  ) {
    if (categoryId) {
      return this.productsService.findByCategory(req.user.clientId, categoryId);
    }
    return this.productsService.findAll(req.user.clientId, operationId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiResponse({ status: 200, description: 'Products found' })
  async search(@Request() req, @Query('q') query: string) {
    return this.productsService.search(req.user.clientId, query);
  }

  @Get('generate-code')
  @ApiOperation({ summary: 'Generate next product code' })
  @ApiResponse({
    status: 200,
    description: 'Next product code generated',
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          example: 'PRD001',
          description: 'Generated product code',
        },
      },
    },
  })
  async generateCode(@Request() req, @Query('type') type?: string) {
    const code = await this.productsService.generateNextCode(
      req.user.clientId,
      type,
    );
    return { code };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace a product' })
  @ApiResponse({ status: 200, description: 'Product replaced successfully' })
  async replace(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Post('import-batch')
  @ApiOperation({ summary: 'Import products in batch with optional new categories' })
  @ApiResponse({ status: 201, description: 'Batch imported successfully' })
  async importBatch(@Body() dto: ImportBatchDto, @Request() req) {
    return this.productsService.importBatch(
      req.user.clientId,
      dto.operationId,
      dto.items,
    );
  }

  @Delete('import-batch/:batchId')
  @ApiOperation({ summary: 'Rollback an import batch (delete all products and categories created)' })
  @ApiResponse({ status: 200, description: 'Batch rolled back successfully' })
  async rollbackBatch(@Param('batchId') batchId: string, @Request() req) {
    return this.productsService.rollbackBatch(req.user.clientId, batchId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return { message: 'Product deleted successfully' };
  }
}
