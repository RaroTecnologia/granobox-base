import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { CreateProductDto, UpdateProductDto } from '../dto';
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
  async findAll(@Request() req, @Query('categoryId') categoryId?: string) {
    if (categoryId) {
      return this.productsService.findByCategory(categoryId);
    }
    return this.productsService.findAll(req.user.clientId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiResponse({ status: 200, description: 'Products found' })
  async search(@Request() req, @Query('q') query: string) {
    return this.productsService.search(req.user.clientId, query);
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
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return { message: 'Product deleted successfully' };
  }
}






