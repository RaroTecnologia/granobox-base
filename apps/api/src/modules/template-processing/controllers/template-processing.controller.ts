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
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TemplateProcessingService } from '../services/template-processing.service';
import { CreateTemplateAssociationDto } from '../dto/create-template-association.dto';
import { UpdateTemplateAssociationDto } from '../dto/update-template-association.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Controller para gerenciamento de templates e associações
 * 
 * NOTA: Mantém rota /tagment para compatibilidade com clientes existentes
 * Em versão futura, migrar para /template-processing
 */
@ApiTags('templates')
@Controller('tagment') // Manter rota para compatibilidade
@UseGuards(JwtAuthGuard)
export class TemplateProcessingController {
  constructor(private readonly templateProcessingService: TemplateProcessingService) {}

  // ==================== Template Associations ====================

  @Post('template-associations')
  @ApiOperation({ summary: 'Criar associação de template padrão' })
  @ApiResponse({ status: 201, description: 'Associação criada' })
  createTemplateAssociation(
    @Body() createAssociationDto: CreateTemplateAssociationDto,
  ) {
    return this.templateProcessingService.createTemplateAssociation(createAssociationDto);
  }

  @Get('template-associations')
  @ApiOperation({ summary: 'Listar associações de template do cliente' })
  @ApiResponse({ status: 200, description: 'Lista de associações' })
  getTemplateAssociations(@Query('clientId') clientId: string) {
    return this.templateProcessingService.getTemplateAssociations(clientId);
  }

  @Get('template-associations/:id')
  @ApiOperation({ summary: 'Obter associação de template por ID' })
  @ApiResponse({ status: 200, description: 'Detalhes da associação' })
  getTemplateAssociation(
    @Param('id') id: string,
    @Query('clientId') clientId: string,
  ) {
    return this.templateProcessingService.getTemplateAssociation(id, clientId);
  }

  @Put('template-associations/:id')
  @ApiOperation({ summary: 'Atualizar associação de template' })
  @ApiResponse({ status: 200, description: 'Associação atualizada' })
  updateTemplateAssociation(
    @Param('id') id: string,
    @Query('clientId') clientId: string,
    @Body() updateAssociationDto: UpdateTemplateAssociationDto,
  ) {
    return this.templateProcessingService.updateTemplateAssociation(
      id,
      clientId,
      updateAssociationDto,
    );
  }

  @Delete('template-associations/:id')
  @ApiOperation({ summary: 'Remover associação de template' })
  @ApiResponse({ status: 200, description: 'Associação removida' })
  deleteTemplateAssociation(
    @Param('id') id: string,
    @Query('clientId') clientId: string,
  ) {
    return this.templateProcessingService.deleteTemplateAssociation(id, clientId);
  }

  // ==================== Default Templates ====================

  @Get('default-template')
  @ApiOperation({ summary: 'Obter template padrão para tipo de etiqueta' })
  @ApiResponse({ status: 200, description: 'Template padrão encontrado' })
  @ApiResponse({ status: 404, description: 'Template padrão não encontrado' })
  async getDefaultTemplate(
    @Query('clientId') clientId: string,
    @Query('labelType') labelType: string,
  ) {
    const association = await this.templateProcessingService.getDefaultTemplate(clientId, labelType);
    if (!association) {
      throw new NotFoundException('Template padrão não encontrado');
    }
    return association;
  }

  @Post('default-template')
  @ApiOperation({ summary: 'Definir template padrão para tipo de etiqueta' })
  @ApiResponse({ status: 200, description: 'Template padrão definido' })
  setDefaultTemplate(
    @Body() body: { clientId: string; labelType: string; templateId: string },
  ) {
    return this.templateProcessingService.setDefaultTemplate(
      body.clientId,
      body.labelType,
      body.templateId,
    );
  }

  // ==================== Template Resolution ====================

  @Get('templates/resolve')
  @ApiOperation({
    summary: 'Resolver template efetivo (produto > categoria > cliente > fallback)',
  })
  @ApiResponse({ status: 200, description: 'templateId resolvido ou null' })
  async resolveTemplate(@Query('productId') productId: string) {
    return this.templateProcessingService.resolveValidityTemplateId(productId);
  }
}
