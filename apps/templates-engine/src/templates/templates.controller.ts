import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { ProcessTemplateDto } from './dto/process-template.dto';
import { StudioRenderDto } from './dto/studio-render.dto';
import { ComposeMultiColumnDto } from './dto/compose-multi-column.dto';
import { ElementsProcessDto } from './dto/elements-process.dto';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Processar template e retornar ZPL' })
  @ApiResponse({ status: 200, description: 'ZPL processado' })
  @ApiResponse({ status: 400, description: 'Template não encontrado ou dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro ao processar template' })
  async process(@Body() dto: ProcessTemplateDto) {
    const type = dto.type || 'etiqueta_validade';
    const { zpl, processedAt } = await this.templatesService.process(
      dto.templateId,
      dto.data,
      type,
      dto.zpl,
    );
    return {
      zpl,
      success: true,
      processedAt,
    };
  }

  @Post('studio/render')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renderizar template Studio (PNG → ZPL)' })
  @ApiResponse({ status: 200, description: 'ZPL gerado' })
  async studioRender(@Body() dto: StudioRenderDto) {
    const result = await this.templatesService.renderStudio(
      dto.templateId,
      dto.data,
      dto.imageBase64,
      dto.labelLayout,
    );
    return result;
  }

  @Post('elements/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Processar template tipo elements e retornar ZPL',
    description:
      'Recebe template com size (w, h, unit) e lista de elementos (text, qr, barcode, line, image, shape) e data para variáveis. Retorna ZPL para preview ou impressão.',
  })
  @ApiResponse({ status: 200, description: 'ZPL gerado' })
  @ApiResponse({ status: 400, description: 'Template ou data inválidos' })
  async elementsProcess(@Body() dto: ElementsProcessDto) {
    const zpl = await this.templatesService.processElements(dto.template, dto.data);
    return { zpl, success: true };
  }

  @Post('compose-multi-column')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compor ZPL multi-coluna (bobina com N etiquetas na mesma linha)',
    description:
      'Recebe N ZPLs (um por coluna), aplica offset em X e monta um único ^XA...^XZ com ^PW (largura total) e ^LL (altura). Usado para elements e studio.',
  })
  @ApiResponse({ status: 200, description: 'ZPL composto para uma linha da bobina' })
  @ApiResponse({ status: 400, description: 'zpls.length deve ser igual a labelLayout.columns' })
  async composeMultiColumn(@Body() dto: ComposeMultiColumnDto) {
    const zpl = this.templatesService.composeMultiColumn(
      dto.zpls,
      dto.labelLayout,
      dto.unit || 'mm',
    );
    return { zpl, success: true };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter informações de um template' })
  @ApiResponse({ status: 200, description: 'Informações do template' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  getTemplate(@Param('id') id: string) {
    const info = this.templatesService.getTemplateInfo(id);
    if (!info) {
      throw new NotFoundException({ code: 'TEMPLATE_NOT_FOUND', message: `Template ${id} não encontrado` });
    }
    return info;
  }
}
