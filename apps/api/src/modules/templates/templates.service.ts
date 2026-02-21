import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { StudioTemplateEntity } from './entities/studio-template.entity';
import { StudioTemplateVersionEntity } from './entities/studio-template-version.entity';
import { ClientPublicTemplateEntity } from './entities/client-public-template.entity';
import { SheetTemplate } from '../sheets/entities/sheet-template.entity';
import { Sheet } from '../sheets/entities/sheet.entity';
import { SheetSku } from '../sheets/entities/sheet-sku.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { UploadService } from '../../upload/upload.service';
import { StudioBaseZplCacheService } from './studio-base-zpl-cache.service';
import { TemplatesEngineProxyService } from './templates-engine-proxy.service';
import { ImageProcessorService } from '../images/services/image-processor.service';
import { CanvasRendererProxyService } from '../canvas-renderer/canvas-renderer-proxy.service';

export type TemplateWithPreviewUrl = StudioTemplateEntity & { previewImageUrl?: string };

const DPI = 203;

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    @InjectRepository(StudioTemplateEntity)
    private readonly repo: Repository<StudioTemplateEntity>,
    @InjectRepository(StudioTemplateVersionEntity)
    private readonly versionRepo: Repository<StudioTemplateVersionEntity>,
    @InjectRepository(ClientPublicTemplateEntity)
    private readonly clientPublicRepo: Repository<ClientPublicTemplateEntity>,
    @InjectRepository(SheetTemplate)
    private readonly sheetTemplateRepo: Repository<SheetTemplate>,
    @InjectRepository(Sheet)
    private readonly sheetRepo: Repository<Sheet>,
    @InjectRepository(SheetSku)
    private readonly sheetSkuRepo: Repository<SheetSku>,
    private readonly uploadService: UploadService,
    private readonly studioBaseZplCache: StudioBaseZplCacheService,
    private readonly templatesEngineProxy: TemplatesEngineProxyService,
    private readonly imageProcessorService: ImageProcessorService,
    private readonly canvasRendererProxy: CanvasRendererProxyService,
  ) {}

  /** Dimensões em mm a partir de template.size (w/h em mm ou polegadas). */
  private getDimensionsMm(size: StudioTemplateEntity['size']): { widthMm: number; heightMm: number } {
    if (!size?.w || !size?.h) return { widthMm: 50, heightMm: 30 };
    const toMm = size.unit === 'inches' ? (v: number) => v * 25.4 : (v: number) => v;
    return { widthMm: toMm(Number(size.w)), heightMm: toMm(Number(size.h)) };
  }

  /**
   * Gera a imagem do Canvas em Z64 (comprimido, como logo do cliente) e persiste no template.
   * Usa a API de processamento de imagem existente — evita GRF gigante e "request entity too large".
   */
  private async generateAndPersistStudioBaseZ64(
    templateId: string,
    imageBase64: string,
    size: StudioTemplateEntity['size'],
  ): Promise<{ z64: string; totalBytes: number; bytesPerRow: number } | null> {
    try {
      const { widthMm, heightMm } = this.getDimensionsMm(size);
      const widthDots = this.imageProcessorService.mmToDots(widthMm, DPI);
      const heightDots = this.imageProcessorService.mmToDots(heightMm, DPI);
      const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const result = await this.imageProcessorService.convertToZ64(
        buffer,
        widthDots,
        heightDots,
        true,
        'fill', // Canvas preenche a etiqueta
        100,
        0,
        0,
      );
      const data = { z64: result.z64, totalBytes: result.totalBytes, bytesPerRow: result.bytesPerRow };
      await this.repo.update(templateId, {
        studioBaseZ64Data: data,
        studioBaseZpl: null, // Não persistir GRF (muito grande)
      });
      this.logger.log(`Studio base Z64 persistido para template ${templateId} (${result.z64.length} chars)`);
      return data;
    } catch (err) {
      this.logger.warn(
        `Falha ao gerar Z64 para template ${templateId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return null;
  }

  private toMapWithPreviewUrl(t: StudioTemplateEntity): TemplateWithPreviewUrl {
    let url: string | undefined;
    if (t.previewImageR2Key) {
      try {
        const fullUrl = this.uploadService.getPublicUrl(t.previewImageR2Key);
        // Só retornar URL absoluta para evitar img quebrada no Studio (origem diferente da API)
        if (fullUrl && fullUrl.startsWith('http')) {
          const cacheBuster = t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now();
          url = `${fullUrl}?v=${cacheBuster}`;
        }
      } catch (err) {
        this.logger.warn(`Preview URL para template ${t.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return { ...t, previewImageUrl: url };
  }

  /**
   * Garante que o template tenha imagem de preview no R2.
   * Se não tiver, gera a partir do ZPL base (Z64 ou GRF) via Labelary e faz upload.
   * Usado pelo Label ao abrir a página do produto.
   */
  async ensurePreviewImage(
    id: string,
    clientId: string | null,
    isSystemUser: boolean,
  ): Promise<TemplateWithPreviewUrl> {
    await this.findOne(id, clientId, isSystemUser);

    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`Template ${id} não encontrado`);

    if (template.previewImageR2Key) {
      return this.toMapWithPreviewUrl(template);
    }

    if (template.templateType !== 'studio') {
      return this.toMapWithPreviewUrl(template);
    }

    let baseZpl: string | null = null;
    const z64 = template.studioBaseZ64Data;
    if (z64?.z64 != null && z64.totalBytes != null && z64.bytesPerRow != null) {
      baseZpl = `^XA^CI28^FO0,0^GFA,${z64.totalBytes},${z64.totalBytes},${z64.bytesPerRow},${z64.z64}^FS`;
    } else if (template.studioBaseZpl?.trim()) {
      baseZpl = template.studioBaseZpl.trim();
    }

    if (!baseZpl) {
      return this.toMapWithPreviewUrl(template);
    }

    try {
      const fullZpl = baseZpl + '\n^XZ';
      const { widthMm, heightMm } = this.getDimensionsMm(template.size);
      const pngBuffer = await this.templatesEngineProxy.zplToPng(fullZpl, widthMm, heightMm);
      const key = `templates/preview/${id}.png`;
      await this.uploadService.uploadBufferWithKey(pngBuffer, key, 'image/png');
      await this.repo.update(id, { previewImageR2Key: key });
      this.logger.log(`Preview PNG gerado e enviado ao R2 para template ${id}`);
      const updated = await this.repo.findOne({ where: { id } });
      return this.toMapWithPreviewUrl(updated!);
    } catch (err) {
      this.logger.warn(`Falha ao gerar preview para template ${id}: ${err instanceof Error ? err.message : String(err)}`);
      return this.toMapWithPreviewUrl(template);
    }
  }

  async create(
    clientId: string | null,
    dto: CreateTemplateDto,
    isSystemUser: boolean,
    rawElements?: Record<string, unknown>[],
    rawLabelLayout?: { columns?: number; columnGap?: number },
    previewImageBase64?: string,
  ): Promise<TemplateWithPreviewUrl> {
    const isPublic = dto.isPublic === true;
    if (isPublic && !isSystemUser) {
      throw new BadRequestException('Apenas administradores podem criar templates públicos');
    }
    if (isPublic) {
      clientId = null;
    } else if (dto.clientId && isSystemUser) {
      // Admin criando template na conta de um cliente
      clientId = dto.clientId;
    } else if (!clientId) {
      throw new BadRequestException('clientId obrigatório para template não público (ou envie clientId no body se for admin)');
    }

    // Preferir elements e labelLayout do body bruto para preservar todas as propriedades
    const elements = rawElements ?? dto.elements ?? null;
    const labelLayout = rawLabelLayout ?? null;

    const entity = this.repo.create({
      ...dto,
      clientId,
      isPublic: isPublic ?? false,
      templateType: dto.templateType ?? 'studio',
      studioData: dto.studioData ?? null,
      studioVariables: dto.studioVariables ?? null,
      studioPngData: dto.studioPngData ?? null,
      dynamicFields: dto.dynamicFields ?? null,
      elements,
      labelLayout,
    });
    const saved = await this.repo.save(entity);

    // Preview em base64 (Elements ou Canvas com preview separado do GRF base)
    if (previewImageBase64?.trim()) {
      try {
        const buffer = Buffer.from(previewImageBase64, 'base64');
        const key = `templates/preview/${saved.id}.png`;
        await this.uploadService.uploadBufferWithKey(buffer, key, 'image/png');
        saved.previewImageR2Key = key;
        await this.repo.update(saved.id, { previewImageR2Key: key });
      } catch (err) {
        this.logger.warn('Falha ao enviar preview para R2 (template criado): ' + (err instanceof Error ? err.message : String(err)));
      }
    }

    // Canvas (studio): gerar e persistir ZPL base (GRF) a partir do studioPngData
    const studioPngForVersion = saved.studioPngData; // Guardar para versão antes de limpar
    if (saved.templateType === 'studio' && saved.studioPngData?.trim()) {
      const z64Data = await this.generateAndPersistStudioBaseZ64(
        saved.id,
        saved.studioPngData,
        saved.size ?? undefined,
      );
      if (z64Data) saved.studioBaseZ64Data = z64Data;

      // Se previewImageBase64 já foi usado acima, não sobrescrever o preview no R2 com o GRF base
      if (!saved.previewImageR2Key) {
        try {
          const buffer = Buffer.from(saved.studioPngData, 'base64');
          const key = `templates/preview/${saved.id}.png`;
          await this.uploadService.uploadBufferWithKey(buffer, key, 'image/png');
          saved.previewImageR2Key = key;
        } catch (err) {
          this.logger.warn('Falha ao enviar preview Canvas para R2 (template criado): ' + (err instanceof Error ? err.message : String(err)));
        }
      }
      // Limpar studioPngData do template principal (fica só no R2 como preview)
      await this.repo.update(saved.id, { previewImageR2Key: saved.previewImageR2Key, studioPngData: null });
      saved.studioPngData = null;
    }

    // Canvas: criar versão inicial (1)
    if (saved.templateType === 'studio') {
      await this.versionRepo.save(
        this.versionRepo.create({
          templateId: saved.id,
          version: 1,
          studioData: saved.studioData,
          studioVariables: saved.studioVariables ?? null,
          studioPngData: studioPngForVersion, // Usa o valor antes de limpar
          size: saved.size ?? null,
        }),
      );
    }

    return this.toMapWithPreviewUrl({ ...saved, previewImageR2Key: saved.previewImageR2Key });
  }

  /** Lista templates do cliente: próprios + públicos aos quais ele tem acesso. Se system user sem clientId, retorna só públicos. */
  async findAll(
    clientId: string | null,
    templateType?: 'studio' | 'elements',
    isSystemUser = false,
  ): Promise<TemplateWithPreviewUrl[]> {
    if (isSystemUser && clientId === null) {
      return this.listPublicTemplates(templateType);
    }
    const subQuery = this.clientPublicRepo
      .createQueryBuilder('cpt')
      .select('cpt.templateId')
      .where('cpt.clientId = :clientId');
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.clientId = :clientId', { clientId })
      .orWhere(
        `t.isPublic = true AND t.id IN (${subQuery.getQuery()})`,
      )
      .setParameters(subQuery.getParameters())
      .orderBy('t.updatedAt', 'DESC');

    if (templateType) {
      qb.andWhere('t.templateType = :templateType', { templateType });
    }

    const list = await qb.getMany();
    return list.map((t) => this.toMapWithPreviewUrl(t));
  }

  /** Busca um template: deve ser do cliente ou público com acesso. System user pode ver qualquer um. */
  async findOne(
    id: string,
    clientId: string | null,
    isSystemUser = false,
  ): Promise<TemplateWithPreviewUrl> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template ${id} não encontrado`);
    }
    if (isSystemUser) return this.toMapWithPreviewUrl(template);
    if (template.clientId === clientId) return this.toMapWithPreviewUrl(template);
    if (template.isPublic && clientId) {
      const hasAccess = await this.clientPublicRepo.findOne({
        where: { clientId, templateId: id },
      });
      if (hasAccess) return this.toMapWithPreviewUrl(template);
    }
    throw new NotFoundException(`Template ${id} não encontrado`);
  }

  /**
   * Retorna o buffer da imagem de preview do template (R2), ou null se não houver.
   * Usado pelo endpoint GET /templates/:id/preview-image para o Studio exibir thumbnails com auth.
   */
  async getPreviewImageBuffer(
    id: string,
    clientId: string | null,
    isSystemUser: boolean,
  ): Promise<Buffer | null> {
    await this.findOne(id, clientId, isSystemUser);
    const template = await this.repo.findOne({ where: { id }, select: ['previewImageR2Key'] });
    if (!template?.previewImageR2Key?.trim()) return null;
    try {
      return await this.uploadService.getBuffer(template.previewImageR2Key);
    } catch (err) {
      this.logger.warn(
        `Falha ao obter preview do template ${id}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  async update(
    id: string,
    clientId: string | null,
    dto: UpdateTemplateDto,
    isSystemUser: boolean,
    rawElements?: Record<string, unknown>[],
    rawLabelLayout?: { columns?: number; columnGap?: number },
    rawSize?: { w?: number; h?: number; unit?: 'mm' | 'inches' },
    previewImageBase64?: string,
  ): Promise<TemplateWithPreviewUrl> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`Template ${id} não encontrado`);
    if (!isSystemUser) {
      if (template.clientId !== null) {
        if (template.clientId !== clientId) {
          throw new NotFoundException(`Template ${id} não encontrado`);
        }
      } else {
        if (!template.isPublic) {
          throw new NotFoundException(`Template ${id} não encontrado`);
        }
      }
    }

    // Canvas: salvar versão com o NOVO estado (o que está sendo salvo agora)
    // Guardar valores do DTO para versão antes de limpar
    const newStudioData = dto.studioData ?? template.studioData;
    const newStudioVariables = dto.studioVariables ?? template.studioVariables;
    const newStudioPngData = dto.studioPngData?.trim() ?? null; // PNG do novo estado
    if (template.templateType === 'studio') {
      const maxVersion = await this.versionRepo
        .createQueryBuilder('v')
        .select('MAX(v.version)', 'max')
        .where('v.templateId = :id', { id })
        .getRawOne<{ max: number | null }>();
      const nextVersion = (maxVersion?.max ?? 0) + 1;
      await this.versionRepo.save(
        this.versionRepo.create({
          templateId: id,
          version: nextVersion,
          studioData: newStudioData,
          studioVariables: newStudioVariables ?? null,
          studioPngData: newStudioPngData,
          size: template.size ?? null,
        }),
      );
    }

    // Nome e descrição do DTO
    if (dto.name !== undefined) template.name = dto.name;
    if (dto.description !== undefined) template.description = dto.description;
    if (dto.templateType !== undefined) template.templateType = dto.templateType;

    // Canvas (studio): studioData, studioVariables e dynamicFields (campos dinâmicos para ZPL com variáveis da ficha/SKU)
    if (dto.studioData !== undefined) template.studioData = dto.studioData;
    if (dto.studioVariables !== undefined) template.studioVariables = dto.studioVariables;
    if (dto.dynamicFields !== undefined) template.dynamicFields = dto.dynamicFields;

    // Size, elements e labelLayout do body bruto (garantir persistência dos campos do accordion Configurações)
    if (rawSize !== undefined) {
      template.size = {
        w: Number(rawSize.w) || template.size?.w || 50,
        h: Number(rawSize.h) || template.size?.h || 30,
        unit: (rawSize.unit === 'inches' ? 'inches' : 'mm') as 'mm' | 'inches',
      };
    }
    if (rawElements !== undefined) {
      template.elements = rawElements;
    }
    if (rawLabelLayout !== undefined) {
      template.labelLayout = {
        columns: Math.max(1, Math.min(10, Number(rawLabelLayout.columns) || 1)),
        columnGap: Math.max(0, Number(rawLabelLayout.columnGap) || 0),
      };
    }

    // Preview em base64 (Elements ou Canvas com preview separado do GRF base)
    if (previewImageBase64?.trim()) {
      try {
        const buffer = Buffer.from(previewImageBase64, 'base64');
        const key = `templates/preview/${id}.png`;
        await this.uploadService.uploadBufferWithKey(buffer, key, 'image/png');
        template.previewImageR2Key = key;
      } catch (err) {
        this.logger.warn('Falha ao enviar preview para R2 (template update): ' + (err instanceof Error ? err.message : String(err)));
      }
    }

    // Canvas (studio): se studioPngData veio no body, gerar e persistir ZPL base
    if (template.templateType === 'studio' && dto.studioPngData?.trim()) {
      const z64Data = await this.generateAndPersistStudioBaseZ64(id, dto.studioPngData, template.size ?? undefined);
      if (z64Data) template.studioBaseZ64Data = z64Data;

      // Se previewImageBase64 já foi usado acima, não sobrescrever o preview no R2 com o GRF base
      if (!previewImageBase64?.trim()) {
        try {
          const buffer = Buffer.from(dto.studioPngData, 'base64');
          const key = `templates/preview/${id}.png`;
          await this.uploadService.uploadBufferWithKey(buffer, key, 'image/png');
          template.previewImageR2Key = key;
        } catch (err) {
          this.logger.warn('Falha ao enviar preview Canvas para R2 (template update): ' + (err instanceof Error ? err.message : String(err)));
        }
      }
      template.studioPngData = null;
    }

    // Forçar updatedAt para invalidar cache do CDN (TypeORM @UpdateDateColumn pode não refletir no retorno)
    template.updatedAt = new Date();
    const saved = await this.repo.save(template);
    this.studioBaseZplCache.clearForTemplate(id);
    return this.toMapWithPreviewUrl(saved);
  }

  async remove(id: string, clientId: string | null, isSystemUser: boolean): Promise<void> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`Template ${id} não encontrado`);
    if (!isSystemUser) {
      if (template.clientId !== null) {
        if (template.clientId !== clientId) {
          throw new NotFoundException(`Template ${id} não encontrado`);
        }
      } else {
        if (!template.isPublic) {
          throw new NotFoundException(`Template ${id} não encontrado`);
        }
      }
    }
    await this.repo.remove(template);
  }

  /** Lista versões do template (Canvas). Verificação de acesso via findOne. */
  async findVersions(
    templateId: string,
    clientId: string | null,
    isSystemUser: boolean,
  ): Promise<StudioTemplateVersionEntity[]> {
    await this.findOne(templateId, clientId, isSystemUser);
    return this.versionRepo.find({
      where: { templateId },
      order: { version: 'DESC' },
    });
  }

  /** Restaura um template Canvas para uma versão anterior. Copia studioData, studioPngData, studioVariables, size da versão para o template. */
  async restoreVersion(
    templateId: string,
    version: number,
    clientId: string | null,
    isSystemUser: boolean,
  ): Promise<TemplateWithPreviewUrl> {
    const template = await this.repo.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException(`Template ${templateId} não encontrado`);
    if (template.templateType !== 'studio') {
      throw new BadRequestException('Só templates Canvas têm versionamento');
    }
    if (!isSystemUser) {
      if (template.clientId !== null && template.clientId !== clientId) {
        throw new NotFoundException(`Template ${templateId} não encontrado`);
      }
      if (template.isPublic && !clientId) {
        throw new NotFoundException(`Template ${templateId} não encontrado`);
      }
    }
    const versionRow = await this.versionRepo.findOne({
      where: { templateId, version },
    });
    if (!versionRow) {
      throw new NotFoundException(`Versão ${version} não encontrada`);
    }
    template.studioData = versionRow.studioData;
    template.studioPngData = versionRow.studioPngData;
    template.studioVariables = versionRow.studioVariables;
    if (versionRow.size) template.size = versionRow.size;
    // Regerar ZPL base se a versão restaurada tem PNG; senão limpar para o v2 usar fallback (R2 + engine)
    if (template.studioPngData?.trim()) {
      const z64Data = await this.generateAndPersistStudioBaseZ64(
        templateId,
        template.studioPngData,
        template.size ?? undefined,
      );
      template.studioBaseZ64Data = z64Data ?? null;
    } else {
      template.studioBaseZ64Data = null;
      template.studioBaseZpl = null;
    }
    const saved = await this.repo.save(template);
    this.studioBaseZplCache.clearForTemplate(templateId);
    return this.toMapWithPreviewUrl(saved);
  }

  /**
   * Retorna o template público "Solo - Etiqueta Validade" para o app Solo.
   * Usado por GET /templates/public/solo-default (público, sem auth).
   */
  async findSoloPublicTemplate(): Promise<{
    widthMm: number;
    heightMm: number;
    elements?: Record<string, unknown>[] | null;
  } | null> {
    const t = await this.repo.findOne({
      where: { name: 'Solo - Etiqueta Validade', isPublic: true },
      select: ['size', 'elements'],
    });
    if (!t) return null;
    const { widthMm, heightMm } = this.getDimensionsMm(t.size);
    return { widthMm, heightMm, elements: t.elements ?? null };
  }

  /** Lista todos os templates públicos (para admin no Control / Studio) */
  async listPublicTemplates(templateType?: 'studio' | 'elements'): Promise<TemplateWithPreviewUrl[]> {
    try {
      const qb = this.repo
        .createQueryBuilder('t')
        .where('t.isPublic = true')
        .orderBy('t.updatedAt', 'DESC');
      if (templateType) {
        qb.andWhere('t.templateType = :templateType', { templateType });
      }
      const list = await qb.getMany();
      return list.map((t) => this.toMapWithPreviewUrl(t));
    } catch (err) {
      this.logger.error(`listPublicTemplates failed: ${err instanceof Error ? err.message : String(err)}`, err instanceof Error ? err.stack : undefined);
      throw err;
    }
  }

  /** IDs dos templates públicos que o cliente pode acessar */
  async getPublicTemplateIdsForClient(clientId: string): Promise<string[]> {
    const rows = await this.clientPublicRepo.find({
      where: { clientId },
      select: ['templateId'],
    });
    return rows.map((r) => r.templateId);
  }

  /** Define quais templates públicos o cliente pode acessar (admin) */
  async setPublicTemplatesForClient(clientId: string, templateIds: string[]): Promise<void> {
    await this.clientPublicRepo.delete({ clientId });
    if (templateIds.length === 0) return;
    const templates = await this.repo.find({
      where: { id: In(templateIds), isPublic: true },
      select: ['id'],
    });
    const validIds = templates.map((t) => t.id);
    for (const templateId of validIds) {
      await this.clientPublicRepo.save(
        this.clientPublicRepo.create({ clientId, templateId }),
      );
    }
  }

  /**
   * Retorna dados reais de preview das fichas técnicas vinculadas a este template.
   * Gera um item por SKU (ou um item por ficha se não houver SKUs),
   * com variáveis já mapeadas para os nomes usados no Studio.
   */
  async getSheetPreviewData(studioTemplateId: string): Promise<{
    items: Array<{
      label: string;
      sheetName: string;
      sheetId: string;
      sku: string;
      skuName: string;
      variables: Record<string, string>;
    }>;
  }> {
    // Buscar SheetTemplates vinculados com seus fieldMappings
    const sheetTemplates = await this.sheetTemplateRepo.find({
      where: { studioTemplateId, active: true },
    });

    if (sheetTemplates.length === 0) {
      return { items: [] };
    }

    // Buscar sheets com schemas
    const sheetIds = [...new Set(sheetTemplates.map((st) => st.sheetId))];
    const sheets = await this.sheetRepo.find({
      where: sheetIds.map((id) => ({ id })),
      relations: ['schema'],
    });

    // Buscar todos os SKUs das sheets
    const allSkus = await this.sheetSkuRepo.find({
      where: sheetIds.map((id) => ({ sheetId: id, active: true })),
      order: { order: 'ASC', createdAt: 'ASC' },
    });

    const items: Array<{
      label: string;
      sheetName: string;
      sheetId: string;
      sku: string;
      skuName: string;
      variables: Record<string, string>;
    }> = [];

    for (const sheet of sheets) {
      // Encontrar o SheetTemplate correspondente para pegar os fieldMappings
      const st = sheetTemplates.find((t) => t.sheetId === sheet.id);
      const fieldMappings = st?.fieldMappings || {};
      const sheetData = (sheet.data as Record<string, unknown>) || {};

      // Construir variáveis base a partir do fieldMappings
      // fieldMappings: { studioVarName: sheetFieldKey }
      const buildVariables = (extraData?: Record<string, string>): Record<string, string> => {
        const vars: Record<string, string> = {};

        // Variáveis mapeadas via fieldMappings
        for (const [studioVar, sheetKey] of Object.entries(fieldMappings)) {
          const value = sheetData[sheetKey];
          if (value != null) {
            vars[studioVar] = String(value);
          }
        }

        // Se não há fieldMappings, usar chaves do schema diretamente como nomes de variável
        if (Object.keys(fieldMappings).length === 0) {
          for (const [key, value] of Object.entries(sheetData)) {
            if (value != null) {
              vars[key] = String(value);
            }
          }
        }

        // Merge extra data (SKU fields)
        if (extraData) {
          Object.assign(vars, extraData);
        }

        return vars;
      };

      const sheetSkus = allSkus.filter((s) => s.sheetId === sheet.id);

      if (sheetSkus.length > 0) {
        // Um item por SKU
        for (const sku of sheetSkus) {
          const skuExtra: Record<string, string> = {};
          if (sku.sku) skuExtra.sku = sku.sku;
          if (sku.name) skuExtra.sku_name = sku.name;
          if (sku.description) skuExtra.sku_description = sku.description;
          if (sku.weight != null) skuExtra.weight = String(sku.weight);
          if (sku.weightUnit) skuExtra.weight_unit = sku.weightUnit;
          if (sku.quantity != null) skuExtra.quantity = String(sku.quantity);

          items.push({
            label: `${sheet.name} - ${sku.name}`,
            sheetName: sheet.name,
            sheetId: sheet.id,
            sku: sku.sku,
            skuName: sku.name,
            variables: buildVariables(skuExtra),
          });
        }
      } else {
        // Sem SKUs: um item com dados da ficha
        items.push({
          label: sheet.name,
          sheetName: sheet.name,
          sheetId: sheet.id,
          sku: sheet.sku || '',
          skuName: sheet.name,
          variables: buildVariables(),
        });
      }
    }

    return { items };
  }

  /**
   * Regenera thumbnails de TODOS os templates Canvas (studio) que possuem studioData.
   * Usa o canvas-renderer server-side para renderizar o studioData e enviar o PNG ao R2.
   * Retorna relatório com sucesso/falha por template.
   */
  async regenerateThumbnails(templateId?: string): Promise<{
    total: number;
    success: number;
    failed: number;
    details: Array<{ id: string; name: string; status: 'ok' | 'error'; error?: string }>;
  }> {
    const qb = this.repo.createQueryBuilder('t')
      .where('t.templateType = :type', { type: 'studio' })
      .andWhere('t.studioData IS NOT NULL');

    if (templateId) {
      qb.andWhere('t.id = :id', { id: templateId });
    }

    const templates = await qb.getMany();
    this.logger.log(`Regenerando thumbnails para ${templates.length} templates Canvas`);

    const details: Array<{ id: string; name: string; status: 'ok' | 'error'; error?: string }> = [];
    let success = 0;
    let failed = 0;

    for (const template of templates) {
      try {
        const studioData = template.studioData;
        if (!studioData?.trim()) {
          details.push({ id: template.id, name: template.name, status: 'error', error: 'studioData vazio' });
          failed++;
          continue;
        }

        const size = template.size ?? { w: 50, h: 30, unit: 'mm' as const };

        // Renderizar via canvas-renderer COM todos os elementos visíveis (incluindo imagem de fundo)
        const pngBuffer = await this.canvasRendererProxy.renderWithVariables(
          studioData,
          {}, // variáveis vazias: mostra os placeholders originais
          size,
          { excludeBackgroundImage: false },
        );

        if (!pngBuffer || pngBuffer.length < 100) {
          details.push({ id: template.id, name: template.name, status: 'error', error: `PNG muito pequeno (${pngBuffer?.length ?? 0} bytes)` });
          failed++;
          continue;
        }

        // Upload ao R2 e atualizar updatedAt para invalidar cache do CDN
        const key = `templates/preview/${template.id}.png`;
        await this.uploadService.uploadBufferWithKey(pngBuffer, key, 'image/png');
        await this.repo.update(template.id, { previewImageR2Key: key, updatedAt: new Date() });

        this.logger.log(`Thumbnail regenerada: ${template.name} (${template.id}) → ${pngBuffer.length} bytes`);
        details.push({ id: template.id, name: template.name, status: 'ok' });
        success++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Falha ao regenerar thumbnail ${template.id}: ${msg}`);
        details.push({ id: template.id, name: template.name, status: 'error', error: msg });
        failed++;
      }
    }

    return { total: templates.length, success, failed, details };
  }
}
