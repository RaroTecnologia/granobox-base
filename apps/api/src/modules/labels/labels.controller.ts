import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { LabelStatus } from './entities/label.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Labels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
  @ApiOperation({ summary: 'Get all labels' })
  @ApiResponse({ status: 200, description: 'List of labels' })
  findAll(@Query('clientId') clientId?: string, @Query('type') type?: string) {
    return this.labelsService.findAll(clientId, type);
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
}
