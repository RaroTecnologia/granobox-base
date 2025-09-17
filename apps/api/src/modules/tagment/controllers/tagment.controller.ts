import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TagmentService } from '../services/tagment.service';
import { CreateTagmentConfigDto } from '../dto/create-tagment-config.dto';
import { UpdateTagmentConfigDto } from '../dto/update-tagment-config.dto';
import { CreateTemplateAssociationDto } from '../dto/create-template-association.dto';
import { UpdateTemplateAssociationDto } from '../dto/update-template-association.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('tagment')
@Controller('tagment')
@UseGuards(JwtAuthGuard)
export class TagmentController {
  constructor(private readonly tagmentService: TagmentService) {}

  // Configuração Tagment
  @Post('config')
  @ApiOperation({ summary: 'Create Tagment configuration' })
  @ApiResponse({ status: 201, description: 'Configuration created successfully' })
  createConfig(@Body() createConfigDto: CreateTagmentConfigDto) {
    return this.tagmentService.createConfig(createConfigDto);
  }

  @Get('config/:clientId')
  @ApiOperation({ summary: 'Get Tagment configuration by client' })
  @ApiResponse({ status: 200, description: 'Configuration details' })
  getConfig(@Param('clientId') clientId: string) {
    return this.tagmentService.getConfigByClient(clientId);
  }

  @Put('config/:clientId')
  @ApiOperation({ summary: 'Update Tagment configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  updateConfig(
    @Param('clientId') clientId: string,
    @Body() updateConfigDto: UpdateTagmentConfigDto
  ) {
    return this.tagmentService.updateConfig(clientId, updateConfigDto);
  }

  @Delete('config/:clientId')
  @ApiOperation({ summary: 'Delete Tagment configuration' })
  @ApiResponse({ status: 200, description: 'Configuration deleted successfully' })
  deleteConfig(@Param('clientId') clientId: string) {
    return this.tagmentService.deleteConfig(clientId);
  }

  // Template Associations
  @Post('template-associations')
  @ApiOperation({ summary: 'Create template association' })
  @ApiResponse({ status: 201, description: 'Association created successfully' })
  createTemplateAssociation(@Body() createAssociationDto: CreateTemplateAssociationDto) {
    return this.tagmentService.createTemplateAssociation(createAssociationDto);
  }

  @Get('template-associations')
  @ApiOperation({ summary: 'Get template associations by client' })
  @ApiResponse({ status: 200, description: 'List of associations' })
  getTemplateAssociations(@Query('clientId') clientId: string) {
    return this.tagmentService.getTemplateAssociations(clientId);
  }

  @Get('template-associations/:id')
  @ApiOperation({ summary: 'Get template association by ID' })
  @ApiResponse({ status: 200, description: 'Association details' })
  getTemplateAssociation(
    @Param('id') id: string,
    @Query('clientId') clientId: string
  ) {
    return this.tagmentService.getTemplateAssociation(id, clientId);
  }

  @Put('template-associations/:id')
  @ApiOperation({ summary: 'Update template association' })
  @ApiResponse({ status: 200, description: 'Association updated successfully' })
  updateTemplateAssociation(
    @Param('id') id: string,
    @Query('clientId') clientId: string,
    @Body() updateAssociationDto: UpdateTemplateAssociationDto
  ) {
    return this.tagmentService.updateTemplateAssociation(id, clientId, updateAssociationDto);
  }

  @Delete('template-associations/:id')
  @ApiOperation({ summary: 'Delete template association' })
  @ApiResponse({ status: 200, description: 'Association deleted successfully' })
  deleteTemplateAssociation(
    @Param('id') id: string,
    @Query('clientId') clientId: string
  ) {
    return this.tagmentService.deleteTemplateAssociation(id, clientId);
  }

  // Templates do Tagment
  @Get('templates')
  @ApiOperation({ summary: 'Get templates from Tagment API' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  getTemplates(@Query('clientId') clientId: string) {
    return this.tagmentService.syncTemplatesFromTagment(clientId);
  }

  @Post('sync-templates/:clientId')
  @ApiOperation({ summary: 'Sync templates from Tagment API' })
  @ApiResponse({ status: 200, description: 'Templates synchronized' })
  syncTemplates(@Param('clientId') clientId: string) {
    return this.tagmentService.syncTemplatesFromTagment(clientId);
  }

  @Post('validate-api-key')
  @ApiOperation({ summary: 'Validate Tagment API key' })
  @ApiResponse({ status: 200, description: 'API key validation result' })
  validateApiKey(@Body() body: { apiKey: string }) {
    return this.tagmentService.validateApiKey(body.apiKey);
  }
}
