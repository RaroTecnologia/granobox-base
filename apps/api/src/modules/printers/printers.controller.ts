import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PrintersService } from './printers.service';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Printers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('printers')
export class PrintersController {
  constructor(private readonly printersService: PrintersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new printer' })
  @ApiResponse({ status: 201, description: 'Printer created successfully' })
  create(@Body() createPrinterDto: CreatePrinterDto) {
    return this.printersService.create(createPrinterDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all printers' })
  @ApiResponse({ status: 200, description: 'List of printers' })
  findAll(@Query('clientId') clientId?: string) {
    return this.printersService.findAll(clientId);
  }

  @Get('by-usage')
  @ApiOperation({ summary: 'Get printers by usage type' })
  @ApiResponse({ status: 200, description: 'List of printers filtered by usage' })
  findByUsage(@Query('usage') usage: string, @Query('clientId') clientId: string) {
    return this.printersService.findByUsage(usage, clientId);
  }

  @Get('sync-tagment')
  @ApiOperation({ summary: 'Sync printers with Tagment' })
  @ApiResponse({ status: 200, description: 'Printers synced with Tagment' })
  async syncWithTagment(@Query('clientId') clientId: string, @Query('createdBy') createdBy: string) {
    // Aqui você implementaria a chamada para a API do Tagment
    // Por enquanto, retornamos uma mensagem
    return { message: 'Sync with Tagment not implemented yet' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get printer by ID' })
  @ApiResponse({ status: 200, description: 'Printer details' })
  findOne(@Param('id') id: string) {
    return this.printersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update printer' })
  @ApiResponse({ status: 200, description: 'Printer updated successfully' })
  update(@Param('id') id: string, @Body() updatePrinterDto: UpdatePrinterDto) {
    return this.printersService.update(id, updatePrinterDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete printer' })
  @ApiResponse({ status: 200, description: 'Printer deleted successfully' })
  remove(@Param('id') id: string) {
    return this.printersService.remove(id);
  }
}
