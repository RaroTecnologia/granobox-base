import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SystemOnlyGuard } from '../auth/guards/system-only.guard';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@ApiTags('templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  private getClientId(req: Request): string {
    const clientId =
      (req.user as { clientId?: string })?.clientId ??
      (req.headers['x-tenant-id'] as string);
    if (!clientId) {
      throw new BadRequestException(
        'clientId não encontrado (faça login com usuário de cliente ou envie X-Tenant-ID)',
      );
    }
    return clientId;
  }

  private getClientIdOrNull(req: Request): string | null {
    return (
      (req.user as { clientId?: string })?.clientId ??
      (req.headers['x-tenant-id'] as string) ??
      null
    );
  }

  private isSystemUser(req: Request): boolean {
    return !(req.user as { clientId?: string })?.clientId;
  }

  @Post()
  @ApiOperation({ summary: 'Criar template (Studio/Elements ou público se admin)' })
  @ApiResponse({ status: 201, description: 'Template criado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Req() req: Request, @Body() dto: CreateTemplateDto) {
    const isSystemUser = this.isSystemUser(req);
    const clientId =
      isSystemUser
        ? (dto.isPublic ? null : (dto.clientId ?? this.getClientIdOrNull(req)))
        : this.getClientId(req);
    // Usar elements e labelLayout do body bruto para evitar perda de propriedades aninhadas (ValidationPipe/transform)
    const body = req.body as Record<string, unknown>;
    const bodyElements = body?.elements;
    const rawElements: Record<string, unknown>[] | undefined = Array.isArray(bodyElements)
      ? (bodyElements as Record<string, unknown>[])
      : undefined;
    const rawLabelLayout =
      body?.labelLayout && typeof body.labelLayout === 'object' && body.labelLayout !== null
        ? (body.labelLayout as { columns?: number; columnGap?: number })
        : undefined;
    const previewImageBase64 =
      typeof body?.previewImageBase64 === 'string' ? body.previewImageBase64 : undefined;
    return this.templatesService.create(clientId, dto, isSystemUser, rawElements, rawLabelLayout, previewImageBase64);
  }

  @Get()
  @ApiOperation({ summary: 'Listar templates (próprios + públicos). Admin: ?list=public para templates públicos; ?clientId= para ver de um cliente.' })
  @ApiResponse({ status: 200, description: 'Lista de templates' })
  findAll(
    @Req() req: Request,
    @Query('templateType') templateType?: 'studio' | 'elements',
    @Query('clientId') queryClientId?: string,
    @Query('list') list?: string,
  ) {
    const isSystemUser = this.isSystemUser(req);
    // Admin pode forçar listagem de templates públicos com ?list=public
    const forcePublic = isSystemUser && list === 'public';
    const clientId = forcePublic
      ? null
      : isSystemUser
        ? (queryClientId ?? (req.headers['x-tenant-id'] as string) ?? null)
        : this.getClientId(req);
    if (!clientId && !isSystemUser) {
      throw new BadRequestException(
        'clientId não encontrado (faça login com usuário de cliente ou envie X-Tenant-ID)',
      );
    }
    return this.templatesService.findAll(clientId, templateType, isSystemUser);
  }

  @Get('public/solo-default')
  @Public()
  @ApiOperation({ summary: '[Público] Template Solo - Etiqueta Validade (para app Solo)' })
  @ApiResponse({ status: 200, description: 'Template com widthMm, heightMm, elements' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async getSoloDefault() {
    const t = await this.templatesService.findSoloPublicTemplate();
    if (!t) {
      throw new NotFoundException('Template Solo - Etiqueta Validade não encontrado');
    }
    return t;
  }

  @Get('public')
  @UseGuards(SystemOnlyGuard)
  @ApiOperation({ summary: '[Admin] Listar todos os templates públicos' })
  @ApiResponse({ status: 200, description: 'Lista de templates públicos' })
  listPublic(
    @Query('templateType') templateType?: 'studio' | 'elements',
  ) {
    return this.templatesService.listPublicTemplates(templateType);
  }

  @Post('admin/regenerate-thumbnails')
  @UseGuards(SystemOnlyGuard)
  @ApiOperation({ summary: '[Admin] Regenera thumbnails de todos os templates Canvas via canvas-renderer server-side' })
  @ApiResponse({ status: 200, description: 'Relatório da regeneração' })
  regenerateThumbnails(@Query('templateId') templateId?: string) {
    return this.templatesService.regenerateThumbnails(templateId || undefined);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Listar versões do template (Canvas)' })
  @ApiResponse({ status: 200, description: 'Lista de versões' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  findVersions(@Req() req: Request, @Param('id') id: string) {
    const isSystemUser = this.isSystemUser(req);
    const clientId = this.getClientIdOrNull(req);
    return this.templatesService.findVersions(id, clientId, isSystemUser);
  }

  @Post(':id/versions/restore')
  @ApiOperation({ summary: 'Restaurar template Canvas para uma versão anterior' })
  @ApiResponse({ status: 200, description: 'Template restaurado' })
  @ApiResponse({ status: 404, description: 'Template ou versão não encontrado' })
  restoreVersion(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { version: number },
  ) {
    const isSystemUser = this.isSystemUser(req);
    const clientId = this.getClientIdOrNull(req);
    const version = Number(body?.version);
    if (!Number.isInteger(version) || version < 1) {
      throw new BadRequestException('version deve ser um número inteiro >= 1');
    }
    return this.templatesService.restoreVersion(id, version, clientId, isSystemUser);
  }

  @Get(':id/sheet-preview-data')
  @ApiOperation({ summary: 'Retorna dados reais das fichas/SKUs para preview no editor' })
  @ApiResponse({ status: 200, description: 'Dados de preview' })
  getSheetPreviewData(@Param('id') id: string) {
    return this.templatesService.getSheetPreviewData(id);
  }

  @Get(':id/ensure-preview')
  @ApiOperation({ summary: 'Garante preview no R2; gera PNG a partir do ZPL se não existir' })
  @ApiResponse({ status: 200, description: 'Template com previewImageUrl' })
  ensurePreview(@Req() req: Request, @Param('id') id: string) {
    const isSystemUser = this.isSystemUser(req);
    const clientId = this.getClientIdOrNull(req);
    return this.templatesService.ensurePreviewImage(id, clientId, isSystemUser);
  }

  @Get(':id/preview-image')
  @ApiOperation({ summary: 'Imagem de preview do template (PNG do R2). Para thumbnails no Studio.' })
  @ApiResponse({ status: 200, description: 'Imagem PNG' })
  @ApiResponse({ status: 404, description: 'Template ou preview não encontrado' })
  async getPreviewImage(
    @Req() req: Request,
    @Param('id') id: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const isSystemUser = this.isSystemUser(req);
    const clientId = this.getClientIdOrNull(req);
    const buffer = await this.templatesService.getPreviewImageBuffer(id, clientId, isSystemUser);
    if (!buffer || buffer.length === 0) {
      return res.status(404).json({ message: 'Preview não disponível' });
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar template por ID' })
  @ApiResponse({ status: 200, description: 'Template encontrado' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    const isSystemUser = this.isSystemUser(req);
    const clientId = this.getClientIdOrNull(req);
    return this.templatesService.findOne(id, clientId, isSystemUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar template' })
  @ApiResponse({ status: 200, description: 'Template atualizado' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    const isSystemUser = this.isSystemUser(req);
    const clientId = this.getClientIdOrNull(req);
    const body = req.body as Record<string, unknown>;
    const bodyElements = body?.elements;
    const rawElements: Record<string, unknown>[] | undefined = Array.isArray(bodyElements)
      ? (bodyElements as Record<string, unknown>[])
      : undefined;
    const rawLabelLayout =
      body?.labelLayout && typeof body.labelLayout === 'object' && body.labelLayout !== null
        ? (body.labelLayout as { columns?: number; columnGap?: number })
        : undefined;
    const rawSize =
      body?.size && typeof body.size === 'object' && body.size !== null
        ? (body.size as { w?: number; h?: number; unit?: 'mm' | 'inches' })
        : undefined;
    const previewImageBase64 =
      typeof body?.previewImageBase64 === 'string' ? body.previewImageBase64 : undefined;
    return this.templatesService.update(id, clientId, dto, isSystemUser, rawElements, rawLabelLayout, rawSize, previewImageBase64);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover template' })
  @ApiResponse({ status: 200, description: 'Template removido' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const isSystemUser = this.isSystemUser(req);
    const clientId = this.getClientIdOrNull(req);
    await this.templatesService.remove(id, clientId, isSystemUser);
    return { message: 'Template removido' };
  }
}
