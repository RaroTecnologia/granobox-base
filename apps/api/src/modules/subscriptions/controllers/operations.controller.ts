import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OperationsService } from '../services/operations.service';
import { CreateOperationDto } from '../dto/create-operation.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new operation' })
  @ApiResponse({ status: 201, description: 'Operation created successfully' })
  create(@Body() createOperationDto: CreateOperationDto) {
    return this.operationsService.create(createOperationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all operations' })
  @ApiResponse({ status: 200, description: 'List of operations' })
  findAll(@Query('clientId') clientId?: string) {
    return this.operationsService.findAll(clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get operation by ID' })
  @ApiResponse({ status: 200, description: 'Operation details' })
  findOne(@Param('id') id: string) {
    return this.operationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update operation' })
  @ApiResponse({ status: 200, description: 'Operation updated successfully' })
  update(@Param('id') id: string, @Body() updateOperationDto: any) {
    return this.operationsService.update(id, updateOperationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete operation' })
  @ApiResponse({ status: 200, description: 'Operation deleted successfully' })
  remove(@Param('id') id: string) {
    return this.operationsService.remove(id);
  }
}