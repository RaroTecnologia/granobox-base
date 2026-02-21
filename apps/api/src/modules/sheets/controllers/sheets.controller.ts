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
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SheetsService } from '../services/sheets.service';
import {
  CreateSheetDto,
  UpdateSheetDto,
  SubmitForApprovalDto,
  ApprovalActionDto,
  RejectActionDto,
  PreviewLabelDto,
} from '../dto';
import { SheetStatus } from '../entities/sheet.entity';

@Controller('sheets')
@UseGuards(JwtAuthGuard)
export class SheetsController {
  constructor(private readonly sheetsService: SheetsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: { clientId: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: SheetStatus,
    @Query('groupId') groupId?: string,
  ) {
    return this.sheetsService.findAll(user.clientId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
      groupId,
    });
  }

  @Get('stats')
  async getStats(@CurrentUser() user: { clientId: string }) {
    return this.sheetsService.getStats(user.clientId);
  }

  @Get('pending-approvals')
  async getPendingApprovals(@CurrentUser() user: { clientId: string; id: string }) {
    return this.sheetsService.findPendingApprovalsForUser(user.clientId, user.id);
  }

  /**
   * POST /sheets/preview-label — PNG do rótulo com variáveis a partir de um payload (sem criar ficha).
   * Usado no passo Finalizar do wizard para preview antes de criar.
   */
  @Post('preview-label')
  async postPreviewLabel(
    @Body() dto: PreviewLabelDto,
    @CurrentUser() user: { clientId: string },
    @Res({ passthrough: false }) res: Response,
  ) {
    if (!dto.templateId?.trim()) {
      throw new BadRequestException('templateId é obrigatório');
    }
    const buffer = await this.sheetsService.getLabelPreviewPngFromPayload(user.clientId, dto);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, no-cache');
    res.send(buffer);
  }

  @Get(':id/print-variables')
  async getPrintVariables(
    @Param('id') id: string,
    @CurrentUser() user: { clientId: string },
    @Query('templateId') templateId: string,
    @Query('skuId') skuId?: string,
  ) {
    this.assertSheetIdIsUuid(id);
    return this.sheetsService.getPrintVariables(id, user.clientId, templateId, skuId);
  }

  /**
   * GET /sheets/:id/label-preview — PNG do rótulo com variáveis da ficha e do SKU (valores reais, não placeholder).
   * Query: templateId (obrigatório), skuId (opcional).
   */
  @Get(':id/label-preview')
  async getLabelPreview(
    @Param('id') id: string,
    @CurrentUser() user: { clientId: string },
    @Query('templateId') templateId: string,
    @Query('skuId') skuId: string | undefined,
    @Res({ passthrough: false }) res: Response,
  ) {
    this.assertSheetIdIsUuid(id);
    if (!templateId?.trim()) {
      throw new BadRequestException('templateId é obrigatório');
    }
    const buffer = await this.sheetsService.getLabelPreviewPng(id, user.clientId, templateId, skuId);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, no-cache');
    res.send(buffer);
  }

  /** Rejeita IDs que não são UUID para evitar que rotas como /sheets/groups sejam tratadas como :id quando a ordem de rotas falhar. */
  private assertSheetIdIsUuid(id: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('ID da ficha inválido');
    }
  }

  /**
   * GET /sheets/:id — com ?published=true retorna data/skus da versão publicada (quando existir),
   * mesma fonte usada por getPrintVariables, para alinhar visualização e impressão no Label.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { clientId: string },
    @Query('published') published?: string,
  ) {
    this.assertSheetIdIsUuid(id);
    const sheet = await this.sheetsService.findOne(id, user.clientId);

    // 🔥 Warm-up Z64 cache em background (fire-and-forget).
    // Disparado apenas pelo HTTP request (controller), NUNCA pelo service interno,
    // para evitar loop recursivo (findOne → warmUp → ensureCache → getPrintVariables → findOne).
    this.sheetsService.warmUpZ64CacheForSheet(id, user.clientId);

    if (published === 'true') {
      const publishedData = await this.sheetsService.getPublishedData(id, user.clientId);
      if (publishedData) {
        return { ...sheet, data: publishedData.data, skus: publishedData.skus };
      }
    }
    return sheet;
  }

  @Get(':id/versions')
  async getVersions(
    @Param('id') id: string,
    @CurrentUser() user: { clientId: string },
  ) {
    this.assertSheetIdIsUuid(id);
    return this.sheetsService.getVersions(id, user.clientId);
  }

  @Post()
  async create(
    @Body() dto: CreateSheetDto,
    @CurrentUser() user: { id: string; clientId: string },
  ) {
    return this.sheetsService.create(user.clientId, user.id, dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSheetDto,
    @CurrentUser() user: { id: string; clientId: string },
  ) {
    this.assertSheetIdIsUuid(id);
    return this.sheetsService.update(id, user.clientId, user.id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { clientId: string },
  ) {
    this.assertSheetIdIsUuid(id);
    await this.sheetsService.remove(id, user.clientId);
    return { success: true };
  }

  // === Workflow de Aprovação ===

  @Post(':id/submit')
  async submitForApproval(
    @Param('id') id: string,
    @Body() dto: SubmitForApprovalDto,
    @CurrentUser() user: { id: string; clientId: string },
  ) {
    this.assertSheetIdIsUuid(id);
    return this.sheetsService.submitForApproval(id, user.clientId, user.id, dto);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @CurrentUser() user: { id: string; clientId: string },
  ) {
    this.assertSheetIdIsUuid(id);
    return this.sheetsService.approve(id, user.clientId, user.id, dto);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectActionDto,
    @CurrentUser() user: { id: string; clientId: string },
  ) {
    this.assertSheetIdIsUuid(id);
    return this.sheetsService.reject(id, user.clientId, user.id, dto);
  }

  @Post(':id/activate')
  async activate(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; clientId: string },
  ) {
    this.assertSheetIdIsUuid(id);
    return this.sheetsService.activate(id, user.clientId, user.id);
  }
}
