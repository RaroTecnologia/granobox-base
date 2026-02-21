import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Sheet, SheetStatus } from '../entities/sheet.entity';
import { SheetVersion, VersionChange } from '../entities/sheet-version.entity';
import { SheetApproval, ApprovalStage } from '../entities/sheet-approval.entity';
import { SheetSku } from '../entities/sheet-sku.entity';
import { CreateSheetDto } from '../dto/create-sheet.dto';
import { UpdateSheetDto } from '../dto/update-sheet.dto';
import { SubmitForApprovalDto, ApprovalActionDto, RejectActionDto } from '../dto/approval-action.dto';
import { SchemasService } from './schemas.service';
import { WorkflowsService } from './workflows.service';
import { SheetTemplatesService } from './sheet-templates.service';
import { TemplatesService } from '../../templates/templates.service';
import { TemplatesEngineProxyService } from '../../templates/templates-engine-proxy.service';
import { UploadService } from '../../../upload/upload.service';
import { CanvasRendererProxyService } from '../../canvas-renderer/canvas-renderer-proxy.service';
import { ImageProcessorService } from '../../images/services/image-processor.service';
import { BasesService } from '../../bases/services/bases.service';

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SheetStatus;
  groupId?: string;
}

@Injectable()
export class SheetsService {
  constructor(
    @InjectRepository(Sheet)
    private sheetsRepository: Repository<Sheet>,
    @InjectRepository(SheetVersion)
    private versionsRepository: Repository<SheetVersion>,
    @InjectRepository(SheetApproval)
    private approvalsRepository: Repository<SheetApproval>,
    @InjectRepository(SheetSku)
    private skusRepository: Repository<SheetSku>,
    private schemasService: SchemasService,
    @Inject(forwardRef(() => WorkflowsService))
    private workflowsService: WorkflowsService,
    private sheetTemplatesService: SheetTemplatesService,
    private templatesService: TemplatesService,
    private templatesEngineProxy: TemplatesEngineProxyService,
    private uploadService: UploadService,
    private canvasRenderer: CanvasRendererProxyService,
    private imageProcessor: ImageProcessorService,
    private basesService: BasesService,
  ) {}

  /** Controle de concorrência: evita rendering simultâneo do mesmo SKU. */
  private readonly z64RenderingInProgress = new Set<string>();

  async findAll(clientId: string, params: ListParams = {}) {
    const { page = 1, limit = 20, search, status, groupId } = params;

    const where: Record<string, unknown> = { clientId };

    if (status) {
      where.status = status;
    }

    if (groupId) {
      where.groupId = groupId;
    }

    if (search) {
      where.name = Like(`%${search}%`);
    }

    const [items, total] = await this.sheetsRepository.findAndCount({
      where,
      relations: ['schema', 'createdByUser', 'skus', 'group'],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, clientId: string): Promise<Sheet> {
    const sheet = await this.sheetsRepository.findOne({
      where: { id, clientId },
      relations: ['schema', 'createdByUser', 'updatedByUser', 'approvals', 'approvals.assignedUser', 'skus', 'group'],
    });

    if (!sheet) {
      throw new NotFoundException(`Ficha com ID ${id} não encontrada`);
    }

    this.enrichSkusWithMockupUrl(sheet.skus);

    return sheet;
  }

  private enrichSkusWithMockupUrl(skus?: SheetSku[]): void {
    if (!skus?.length) return;
    for (const sku of skus) {
      if (sku.mockupR2Key) {
        (sku as SheetSku & { mockupPreviewUrl?: string }).mockupPreviewUrl = this.uploadService.getPublicUrl(
          sku.mockupR2Key,
        );
      }
    }
  }

  async create(clientId: string, userId: string, dto: CreateSheetDto): Promise<Sheet> {
    // Validar schema
    await this.schemasService.findOne(dto.schemaId, clientId);

    const { skus: skuDtos, ...sheetData } = dto;

    const sheet = this.sheetsRepository.create({
      ...sheetData,
      clientId,
      createdBy: userId,
      status: 'draft',
      version: 1,
    });

    const savedSheet = await this.sheetsRepository.save(sheet);

    // Criar SKUs se fornecidos
    if (skuDtos?.length) {
      const skuEntities = skuDtos.map((skuDto, index) =>
        this.skusRepository.create({
          ...skuDto,
          sheetId: savedSheet.id,
          order: skuDto.order ?? index,
        }),
      );
      await this.skusRepository.save(skuEntities);
    }

    // Criar versão inicial
    await this.createVersion(savedSheet, userId, []);

    // Mockups serão gerados quando o template for vinculado (via SheetTemplatesService.add)

    return this.findOne(savedSheet.id, clientId);
  }

  async update(id: string, clientId: string, userId: string, dto: UpdateSheetDto): Promise<Sheet> {
    const sheet = await this.findOne(id, clientId);

    // Permitir editar em rascunho, alterações solicitadas, aprovado ou ativo (edição vira rascunho sem quebrar a versão publicada)
    if (!['draft', 'changes_requested', 'approved', 'active'].includes(sheet.status)) {
      throw new BadRequestException('Ficha não pode ser editada no status atual');
    }

    const isEditingFromActiveOrApproved = ['active', 'approved'].includes(sheet.status);

    // Se está ativo e ainda não tem versão publicada (legado), criar snapshot agora para não perder o "ao vivo"
    if (sheet.status === 'active' && !sheet.publishedVersionId) {
      const publishedVersion = await this.createVersion(
        sheet,
        userId,
        [],
        sheet.skus?.map((s) => this.skuToPlain(s)) ?? [],
      );
      await this.sheetsRepository.update(id, { publishedVersionId: publishedVersion.id });
      sheet.publishedVersionId = publishedVersion.id;
    }

    // Calcular mudanças nos dados da ficha (impactam impressão do rótulo)
    const changes = this.calculateChanges(sheet.data, dto.data || sheet.data);
    const { skus: skuDtos, ...sheetData } = dto;

    // Atualização só de metadados que não impactam o rótulo (ex.: grupo): não cria versão nem altera status
    const hasPrintingChanges = (dto.data && changes.length > 0) || skuDtos !== undefined;

    if (hasPrintingChanges) {
      if (dto.data && changes.length > 0) {
        sheet.version += 1;
      }
      if (isEditingFromActiveOrApproved) {
        sheet.status = 'draft';
      }
    }

    Object.assign(sheet, sheetData);
    sheet.updatedBy = userId;

    const savedSheet = await this.sheetsRepository.save(sheet);

    if (skuDtos !== undefined) {
      await this.syncSkus(id, skuDtos || []);
    }

    if (hasPrintingChanges && changes.length > 0) {
      await this.createVersion(savedSheet, userId, changes);
    }

    // Gerar e salvar mockups no R2 (antecipado no Ops para já ter cache para o Label)
    if (skuDtos !== undefined) {
      await this.generateAndSaveMockupsForSheet(id, clientId);
    }

    return this.findOne(id, clientId);
  }

  private async syncSkus(sheetId: string, skuDtos: UpdateSheetDto['skus']) {
    // Buscar SKUs existentes
    const existingSkus = await this.skusRepository.find({ where: { sheetId } });
    const existingIds = existingSkus.map((s) => s.id);
    const dtoIds = (skuDtos || []).filter((s) => s.id).map((s) => s.id!);

    // Remover SKUs que não estão mais na lista
    const toRemove = existingIds.filter((id) => !dtoIds.includes(id));
    if (toRemove.length) {
      await this.skusRepository.delete(toRemove);
    }

    // Criar ou atualizar
    for (let i = 0; i < (skuDtos || []).length; i++) {
      const skuDto = skuDtos![i];
      if (skuDto.id) {
        // Atualizar existente
        await this.skusRepository.update(skuDto.id, {
          ...skuDto,
          order: skuDto.order ?? i,
        });
      } else {
        // Criar novo
        const newSku = this.skusRepository.create({
          ...skuDto,
          sheetId,
          order: skuDto.order ?? i,
        });
        await this.skusRepository.save(newSku);
      }
    }
  }

  async remove(id: string, clientId: string): Promise<void> {
    const sheet = await this.findOne(id, clientId);

    if (sheet.status !== 'draft') {
      throw new BadRequestException('Apenas fichas em rascunho podem ser excluídas');
    }

    await this.sheetsRepository.remove(sheet);
  }

  // === Workflow de Aprovação ===

  async submitForApproval(id: string, clientId: string, userId: string, dto: SubmitForApprovalDto = {}): Promise<Sheet> {
    // Buscar sheet sem relações para evitar problemas de sincronização
    const sheet = await this.sheetsRepository.findOne({
      where: { id, clientId },
    });

    if (!sheet) {
      throw new NotFoundException(`Ficha com ID ${id} não encontrada`);
    }

    if (!['draft', 'changes_requested'].includes(sheet.status)) {
      throw new BadRequestException('Ficha não pode ser enviada para aprovação no status atual');
    }

    // Buscar workflow configurado (por schema ou padrão)
    const workflow = await this.workflowsService.findBySchemaId(sheet.schemaId, clientId);

    let stages: ApprovalStage[];
    let stagesFromWorkflow = false;

    if (workflow?.stages?.length) {
      // Usar estágios do workflow configurado
      stagesFromWorkflow = true;
      stages = workflow.stages.map((s) => s.stageType as ApprovalStage);
    } else if (dto.stages?.length) {
      // Usar estágios especificados no DTO
      stages = dto.stages;
    } else {
      // Estágios padrão fixos (fallback)
      stages = ['technical_review', 'quality_review', 'final_approval'];
    }

    // Calcular deadlines
    const now = new Date();
    let totalDeadlineDays = 0;
    let cumulativeDeadlineDays = 0;

    // Criar registros de aprovação com deadlines
    for (let i = 0; i < stages.length; i++) {
      const workflowStage = stagesFromWorkflow ? workflow!.stages[i] : null;
      const stageDays = workflowStage?.deadlineDays || dto.defaultDeadlineDays || 3; // 3 dias padrão por etapa
      cumulativeDeadlineDays += stageDays;
      
      const stageDeadline = new Date(now);
      stageDeadline.setDate(stageDeadline.getDate() + cumulativeDeadlineDays);
      
      const approval = this.approvalsRepository.create({
        sheetId: id,
        stage: stages[i],
        order: i + 1,
        status: 'pending',
        assignedTo: workflowStage?.assignedToUserId || null,
        deadline: stageDeadline,
        startedAt: i === 0 ? now : null, // Primeira etapa já começa
      });
      await this.approvalsRepository.save(approval);
      
      totalDeadlineDays = cumulativeDeadlineDays;
    }

    // Calcular deadline geral
    const overallDeadline = new Date(now);
    overallDeadline.setDate(overallDeadline.getDate() + totalDeadlineDays);

    // Atualizar status com submittedAt e deadline
    await this.sheetsRepository.update(id, {
      status: 'pending_review',
      updatedBy: userId,
      submittedAt: now,
      deadline: dto.deadline || overallDeadline,
    });

    // Retornar sheet atualizada com relações
    return this.findOne(id, clientId);
  }

  async approve(id: string, clientId: string, userId: string, dto: ApprovalActionDto = {}): Promise<Sheet> {
    const sheet = await this.findOne(id, clientId);

    // Encontrar aprovação pendente
    const pendingApproval = sheet.approvals
      ?.sort((a, b) => a.order - b.order)
      .find((a) => a.status === 'pending' || a.status === 'in_progress');

    if (!pendingApproval) {
      throw new BadRequestException('Não há aprovação pendente');
    }

    // Aprovar usando update para evitar problemas de sincronização
    await this.approvalsRepository.update(pendingApproval.id, {
      status: 'approved',
      completedAt: new Date(),
      completedBy: userId,
      comment: dto.comment || null,
    });

    // Verificar se há próxima etapa
    const nextApproval = sheet.approvals
      ?.sort((a, b) => a.order - b.order)
      .find((a) => a.status === 'pending' && a.order > pendingApproval.order);

    // Se há próxima etapa, iniciar contagem de tempo
    if (nextApproval) {
      await this.approvalsRepository.update(nextApproval.id, {
        startedAt: new Date(),
      });
    }

    const newStatus = nextApproval ? 'in_review' : 'approved';

    // Atualizar status usando update
    await this.sheetsRepository.update(id, {
      status: newStatus,
      updatedBy: userId,
    });

    return this.findOne(id, clientId);
  }

  async reject(id: string, clientId: string, userId: string, dto: RejectActionDto): Promise<Sheet> {
    const sheet = await this.findOne(id, clientId);

    // Encontrar aprovação pendente
    const pendingApproval = sheet.approvals
      ?.sort((a, b) => a.order - b.order)
      .find((a) => a.status === 'pending' || a.status === 'in_progress');

    if (!pendingApproval) {
      throw new BadRequestException('Não há aprovação pendente');
    }

    // Rejeitar usando update
    await this.approvalsRepository.update(pendingApproval.id, {
      status: 'rejected',
      completedAt: new Date(),
      completedBy: userId,
      comment: dto.comment,
    });

    // Atualizar status usando update
    await this.sheetsRepository.update(id, {
      status: 'changes_requested',
      updatedBy: userId,
    });

    return this.findOne(id, clientId);
  }

  async activate(id: string, clientId: string, userId: string): Promise<Sheet> {
    const sheet = await this.findOne(id, clientId);

    if (sheet.status !== 'approved') {
      throw new BadRequestException('Apenas fichas aprovadas podem ser ativadas');
    }

    // Snapshot da versão que fica "publicada" (mantida ao editar em rascunho depois)
    const publishedVersion = await this.createVersion(
      sheet,
      userId,
      [],
      sheet.skus?.map((s) => this.skuToPlain(s)) ?? [],
    );

    await this.sheetsRepository.update(id, {
      status: 'active',
      publishedVersionId: publishedVersion.id,
      updatedBy: userId,
    });

    // Gerar mockups (versão publicada pode ter dados diferentes)
    await this.generateAndSaveMockupsForSheet(id, clientId);

    return this.findOne(id, clientId);
  }

  // === Versões ===

  async getVersions(id: string, clientId: string): Promise<SheetVersion[]> {
    await this.findOne(id, clientId); // Validar acesso

    return this.versionsRepository.find({
      where: { sheetId: id },
      relations: ['createdByUser'],
      order: { version: 'DESC' },
    });
  }

  private async createVersion(
    sheet: Sheet,
    userId: string,
    changes: VersionChange[],
    skusSnapshot?: Record<string, unknown>[],
  ): Promise<SheetVersion> {
    const lastVersion = await this.versionsRepository
      .createQueryBuilder('v')
      .select('MAX(v.version)', 'maxVersion')
      .where('v.sheetId = :sheetId', { sheetId: sheet.id })
      .getRawOne<{ maxVersion: string | null }>();

    const nextVersion =
      lastVersion?.maxVersion != null ? Number(lastVersion.maxVersion) + 1 : 1;

    const version = this.versionsRepository.create({
      sheetId: sheet.id,
      version: nextVersion,
      data: sheet.data,
      skus: skusSnapshot ?? undefined,
      changes,
      createdBy: userId,
    });

    return this.versionsRepository.save(version);
  }

  private skuToPlain(s: SheetSku): Record<string, unknown> {
    return {
      id: s.id,
      sku: s.sku,
      name: s.name,
      barcode: s.barcode,
      description: s.description,
      weight: s.weight != null ? Number(s.weight) : null,
      weightUnit: s.weightUnit,
      quantity: s.quantity,
      baseId: s.baseId,
      baseName: s.baseName,
      basePreviewUrl: s.basePreviewUrl,
      mockupR2Key: s.mockupR2Key,
      order: s.order,
      active: s.active,
    };
  }

  /**
   * Gera e salva mockup PNG no R2 para todos os SKUs da ficha.
   * Mockup = preview com variáveis preenchidas, INCLUINDO background (isBackgroundImage).
   * Não inclui background no ZPL na impressão.
   */
  /** Gera e salva mockup PNG no R2 para todos os SKUs da ficha. Chamado internamente após create/update/addTemplate. */
  async generateAndSaveMockupsForSheet(sheetId: string, clientId: string): Promise<void> {
    const sheet = await this.sheetsRepository.findOne({
      where: { id: sheetId, clientId },
      relations: ['skus', 'schema'],
    });
    if (!sheet?.skus?.length) return;

    const sheetTemplates = await this.sheetTemplatesService.findBySheet(sheetId, clientId);
    const preferredTemplate = sheetTemplates.find((t) => t.type === 'rotulo' || t.type === 'contra_rotulo') || sheetTemplates[0];

    for (const sku of sheet.skus) {
      let templateId: string | null = null;
      if (sku.baseId) {
        try {
          const base = await this.basesService.findOne(sku.baseId, clientId);
          templateId = base.studioTemplateId ?? null;
        } catch {
          // Base não encontrada
        }
      }
      if (!templateId && preferredTemplate) {
        templateId = preferredTemplate.studioTemplateId;
      }
      if (!templateId?.trim()) continue;

      try {
        const pngBuffer = await this.getLabelPreviewPng(sheetId, clientId, templateId, sku.id);
        const key = `sheets/${clientId}/${sheetId}/skus/${sku.id}/mockup.png`;
        await this.uploadService.uploadBufferWithKey(pngBuffer, key, 'image/png');
        await this.skusRepository.update(sku.id, { mockupR2Key: key });
      } catch (err) {
        console.warn(`[SheetsService] Falha ao gerar mockup para SKU ${sku.id}:`, err?.message);
      }

      // Gerar Z64 cache para impressão instantânea (fire-and-forget)
      try {
        await this.ensureSkuZ64Cache(sheetId, sku.id, clientId, templateId);
      } catch (err) {
        console.warn(`[SheetsService] Falha ao gerar Z64 cache para SKU ${sku.id}:`, err?.message);
      }
    }
  }

  /**
   * Retorna dados e SKUs da versão publicada (quando há rascunho em cima da ficha ativa).
   * Usado por share e por consumidores que precisam do conteúdo "ao vivo".
   *
   * Regra única para página do produto e impressão: se a ficha tiver versão publicada,
   * GET /sheets/:id?published=true e getPrintVariables usam sempre estes dados;
   * senão, usam sheet.data e sheet.skus atuais. Assim o que o usuário vê e o que vai
   * para a impressão ficam alinhados.
   */
  async getPublishedData(
    id: string,
    clientId: string,
  ): Promise<{ data: Record<string, unknown>; skus: Record<string, unknown>[] } | null> {
    const sheet = await this.sheetsRepository.findOne({
      where: { id, clientId },
      select: ['id', 'data', 'publishedVersionId'],
    });
    if (!sheet?.publishedVersionId) return null;

    const version = await this.versionsRepository.findOne({
      where: { id: sheet.publishedVersionId, sheetId: id },
    });
    if (!version) return null;

    return {
      data: version.data,
      skus: (version.skus as Record<string, unknown>[]) ?? [],
    };
  }

  /**
   * Variáveis para impressão do template: dados da ficha + fieldMappings + SKU.
   * Usa metadados das variáveis do studioData (variableName + text placeholder)
   * para garantir substituição mesmo quando variableName é field_* (ID auto-gerado).
   * Fonte de dados: versão publicada se existir; senão sheet.data e sheet.skus atuais.
   */
  async getPrintVariables(
    sheetId: string,
    clientId: string,
    templateId: string,
    skuId?: string,
  ): Promise<{ variables: Record<string, string | number | boolean> }> {
    const sheet = await this.findOne(sheetId, clientId);
    let data: Record<string, unknown> = (sheet.data as Record<string, unknown>) || {};
    let skus: Record<string, unknown>[] = (sheet.skus as unknown as Record<string, unknown>[]) || [];

    const publishedData = await this.getPublishedData(sheetId, clientId);
    if (publishedData) {
      data = publishedData.data || data;
      skus = publishedData.skus || skus;
    }

    const template = await this.templatesService.findOne(templateId, clientId, false);
    const studioData = (template as { studioData?: string }).studioData;
    if (!studioData?.trim()) {
      return { variables: {} };
    }

    // Extrair metadados das variáveis (variableName + text placeholder)
    const varMetas = this.extractVariableMetadataFromStudioData(studioData);
    const isAutoId = (name: string) => /^field_\d+$/.test(name);

    // Match key: para field_* usar o text placeholder; senão usar variableName
    const varMatchKey = new Map<string, string>();
    for (const vm of varMetas) {
      varMatchKey.set(vm.variableName, isAutoId(vm.variableName) && vm.text?.trim() ? vm.text.trim() : vm.variableName);
    }

    // fieldMappings salvos no sheet_templates (se existirem)
    let fieldMappings = await this.sheetTemplatesService.getFieldMappingsForPrint(
      sheetId,
      clientId,
      templateId,
    );

    // Se fieldMappings estiver vazio e temos field_*, recalcular usando text placeholders
    if (Object.keys(fieldMappings).length === 0 && varMetas.some((vm) => isAutoId(vm.variableName))) {
      const schemaRelation = await this.sheetsRepository.findOne({
        where: { id: sheetId, clientId },
        relations: ['schema'],
      });
      const schemaFields = (schemaRelation?.schema?.fields || []) as Array<{ key: string; label?: string; type?: string; required?: boolean }>;
      if (schemaFields.length > 0) {
        const varsForMapping = varMetas.map((vm) => ({
          name: varMatchKey.get(vm.variableName) ?? vm.variableName,
          type: vm.elementType || 'text',
        }));
        const rawMappings = this.sheetTemplatesService.autoMapFields(
          schemaFields as any,
          varsForMapping,
        );
        // Converter de volta para variableName → schema field key
        fieldMappings = {};
        for (const vm of varMetas) {
          const matchKey = varMatchKey.get(vm.variableName) ?? vm.variableName;
          if (rawMappings[matchKey]) {
            fieldMappings[vm.variableName] = rawMappings[matchKey];
          }
        }
      }
    }

    const sku = (skuId && Array.isArray(skus)
      ? skus.find((s) => (s as { id?: string }).id === skuId) as Record<string, unknown> | undefined
      : undefined);

    // Aliases normalizados para campos especiais
    const nameAliases = new Set(['nomeproduto', 'nomedoproduto', 'name', 'produto', 'nomeprod']);
    const skuAliases = new Set(['sku', 'codigosku']);
    const skuNameAliases = new Set(['skuname', 'nomesku', 'nomedosku']);
    const weightAliases = new Set(['peso', 'weight', 'pesoliquido']);
    const weightUnitAliases = new Set(['weightunit', 'unidadepeso']);
    const quantityAliases = new Set(['quantity', 'quantidade', 'porcoesembalagem', 'porcoes']);

    const variables: Record<string, string | number | boolean> = {};
    const resolve = (varName: string): string | number | boolean | undefined => {
      const matchKey = varMatchKey.get(varName) ?? varName;
      const norm = this.normalizeVarName(matchKey);

      // 1. Campos especiais por aliases normalizados
      if (nameAliases.has(norm)) return (sheet.name as string) ?? '';
      if (skuAliases.has(norm) && sku?.sku != null) return String(sku.sku);
      if (skuNameAliases.has(norm) && sku?.name != null) return String(sku.name);
      if (norm === 'skudescription' && sku?.description != null) return String(sku.description);
      if (weightAliases.has(norm) && sku?.weight != null) return Number(sku.weight);
      if (weightUnitAliases.has(norm) && sku?.weightUnit != null) return String(sku.weightUnit);
      if (quantityAliases.has(norm) && sku?.quantity != null) return Number(sku.quantity);

      // 1b. Campos extras do SKU (sku.data definidos via schema.skuFields)
      if (sku && (sku as { data?: Record<string, unknown> }).data) {
        const skuData = (sku as { data?: Record<string, unknown> }).data!;
        // Acesso direto
        for (const key of [varName, matchKey]) {
          const val = skuData[key];
          if (val !== undefined && val !== null) return typeof val === 'object' ? String(JSON.stringify(val)) : (val as string | number | boolean);
        }
        // Fallback normalizado
        for (const [k, v] of Object.entries(skuData)) {
          if (this.normalizeVarName(k) === norm && v !== undefined && v !== null && v !== '') {
            return typeof v === 'object' ? String(JSON.stringify(v)) : (v as string | number | boolean);
          }
        }
      }

      // 2. fieldMappings
      const sheetField = fieldMappings[varName];
      if (sheetField != null) {
        const val = data[sheetField];
        if (val !== undefined && val !== null) return typeof val === 'object' ? String(JSON.stringify(val)) : (val as string | number | boolean);
      }

      // 3. Acesso direto no data (variableName ou matchKey)
      for (const key of [varName, matchKey]) {
        const direct = data[key];
        if (direct !== undefined && direct !== null) return typeof direct === 'object' ? String(JSON.stringify(direct)) : (direct as string | number | boolean);
      }

      // 4. Fallback normalizado contra keys de data
      for (const [k, v] of Object.entries(data)) {
        if (this.normalizeVarName(k) === norm && v !== undefined && v !== null && v !== '') {
          return typeof v === 'object' ? String(JSON.stringify(v)) : (v as string | number | boolean);
        }
      }

      return undefined;
    };

    for (const vm of varMetas) {
      if (!vm.variableName) continue;
      const value = resolve(vm.variableName);
      if (value !== undefined && value !== '') variables[vm.variableName] = value;
    }

    console.log(
      `[getPrintVariables] sheet=${sheetId}, resolvidas ${Object.keys(variables).length}/${varMetas.length} variáveis: ${JSON.stringify(variables)}`,
    );

    return { variables };
  }

  /**
   * Extrai os nomes das variáveis que o template espera (do studioData).
   * Percorre o JSON do Fabric e coleta variableName de todos os objetos com isVariable.
   */
  private extractVariableNamesFromStudioData(studioData: string): Set<string> {
    return new Set(this.extractVariableMetadataFromStudioData(studioData).map((v) => v.variableName));
  }

  /**
   * Extrai metadados completos das variáveis do studioData:
   * - variableName: ID da variável (ex.: "field_1770399225254" ou "Nome do Produto")
   * - text: texto placeholder exibido no canvas (ex.: "NOME DO PRODUTO")
   * - elementType: tipo do elemento (ex.: "text", "barcode")
   *
   * O `text` é a ponte: quando variableName é um ID auto-gerado (field_*),
   * usamos o texto para fazer matching com schema fields.
   */
  private extractVariableMetadataFromStudioData(studioData: string): Array<{
    variableName: string;
    text?: string;
    elementType?: string;
  }> {
    const vars: Array<{ variableName: string; text?: string; elementType?: string }> = [];
    try {
      const parsed = JSON.parse(studioData);
      const canvas = parsed?.canvas ?? parsed;
      const seen = new Set<string>();
      const walk = (obj: unknown) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
          obj.forEach(walk);
          return;
        }
        const o = obj as Record<string, unknown>;
        if (o.isVariable === true && o.variableName && typeof o.variableName === 'string') {
          const vn = o.variableName.trim();
          if (!seen.has(vn)) {
            seen.add(vn);
            vars.push({
              variableName: vn,
              text: typeof o.text === 'string' ? o.text.trim() : undefined,
              elementType: typeof o.elementType === 'string' ? o.elementType : undefined,
            });
          }
        }
        if (Array.isArray(o.objects)) walk(o.objects);
        for (const v of Object.values(o)) walk(v);
      };
      walk(canvas);
    } catch {
      // ignore parse errors
    }
    return vars;
  }

  /** Normaliza nome para comparação: minúsculo, sem espaços/traços/underscores. */
  private normalizeVarName(s: string): string {
    return s.toLowerCase().trim().replace(/[\s_\-\/]+/g, '');
  }

  /**
   * Resolve variáveis para o preview a partir do payload do wizard.
   * Mesmo approach do getPrintVariables (que funciona na impressão do Label):
   *   1. Extrai variableNames do studioData (fonte real)
   *   2. Constrói fieldMappings via autoMapFields (variável do template → campo do schema)
   *   3. Resolve cada variável: hardcoded → fieldMappings → data direto → normalizado
   */
  private resolveVariablesForPayload(
    dto: {
      name: string;
      data: Record<string, unknown>;
      skus?: Array<{ sku?: string; name?: string; description?: string; weight?: number; weightUnit?: string; quantity?: number }>;
      schemaFields?: Array<{ key: string; label?: string; type?: string }>;
      skuIndex?: number;
    },
    data: Record<string, unknown>,
    studioVariables: Array<{ name: string; type?: string }> | undefined,
    studioData: string,
  ): Record<string, string | number | boolean> {
    const variables: Record<string, string | number | boolean> = {};
    const varMetas = this.extractVariableMetadataFromStudioData(studioData);
    const schemaFields = (dto.schemaFields || []).map((f) => ({
      key: f.key,
      label: f.label ?? f.key,
      type: (f.type as 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'image' | 'nutrient') ?? 'text',
      required: false,
    }));

    // Para cada variável do template, determinar a melhor "chave de matching":
    // - Se variableName é legível (ex.: "Nome do Produto"), usar direto
    // - Se variableName é field_* (ID auto-gerado), usar o text placeholder (ex.: "NOME DO PRODUTO")
    // Isso permite que autoMapFields funcione mesmo com IDs auto-gerados.
    const isAutoId = (name: string) => /^field_\d+$/.test(name);

    // Construir mapa: variableName → chave para matching (variableName legível ou text)
    const varMatchKey = new Map<string, string>();
    for (const vm of varMetas) {
      if (isAutoId(vm.variableName) && vm.text?.trim()) {
        varMatchKey.set(vm.variableName, vm.text.trim());
      } else {
        varMatchKey.set(vm.variableName, vm.variableName);
      }
    }

    // Fonte de variáveis do template para autoMapFields: usar a chave de matching (text ou name).
    const studioVars = studioVariables || [];
    let varsForMapping: Array<{ name: string; type: string }> = studioVars.map((v) => ({
      name: isAutoId(v.name) ? (varMatchKey.get(v.name) ?? v.name) : v.name,
      type: v.type || 'text',
    }));
    if (varsForMapping.length === 0 && varMetas.length > 0) {
      varsForMapping = varMetas.map((vm) => ({
        name: varMatchKey.get(vm.variableName) ?? vm.variableName,
        type: vm.elementType || 'text',
      }));
    }

    // autoMapFields: matching key → schema field key (ex.: "NOME DO PRODUTO" → "nome_produto")
    // Resultado: { "NOME DO PRODUTO": "nome_produto" }
    const rawMappings =
      schemaFields.length > 0 && varsForMapping.length > 0
        ? this.sheetTemplatesService.autoMapFields(schemaFields, varsForMapping)
        : {};

    // Converter de volta para variableName → schema field key
    // (ex.: "field_1770399225254" → "nome_produto")
    const mappings: Record<string, string> = {};
    for (const vm of varMetas) {
      const matchKey = varMatchKey.get(vm.variableName) ?? vm.variableName;
      if (rawMappings[matchKey]) {
        mappings[vm.variableName] = rawMappings[matchKey];
      }
    }

    console.debug(
      `[resolveVariablesForPayload] vars=${JSON.stringify(varMetas.map((v) => ({ name: v.variableName, text: v.text })))}, ` +
      `mappings=${JSON.stringify(mappings)}, dataKeys=${JSON.stringify(Object.keys(data))}`,
    );

    const skuIndex = dto.skuIndex ?? 0;
    const skus = dto.skus || [];
    const sku = skuIndex >= 0 && skuIndex < skus.length ? skus[skuIndex] : null;

    // Aliases normalizados para campos especiais (nome do produto, etc.)
    const nameAliases = new Set(['nomeproduto', 'nomedoproduto', 'name', 'produto', 'nomeprod']);
    const skuAliases = new Set(['sku', 'codigosku']);
    const skuNameAliases = new Set(['skuname', 'nomesku', 'nomedosku']);
    const weightAliases = new Set(['peso', 'weight', 'pesoliquido']);
    const weightUnitAliases = new Set(['weightunit', 'unidadepeso']);
    const quantityAliases = new Set(['quantity', 'quantidade', 'porcoesembalagem', 'porcoes']);

    const resolve = (varName: string): string | number | boolean | undefined => {
      // Usar matchKey (text placeholder) para aliases e fallbacks
      const matchKey = varMatchKey.get(varName) ?? varName;
      const norm = this.normalizeVarName(matchKey);

      // 1. Campos especiais (nome, sku, peso) — por aliases normalizados
      if (nameAliases.has(norm)) return dto.name;
      if (skuAliases.has(norm) && sku?.sku != null) return String(sku.sku);
      if (skuNameAliases.has(norm) && sku?.name != null) return String(sku.name);
      if (norm === 'skudescription' && sku?.description != null) return String(sku.description);
      if (weightAliases.has(norm) && sku?.weight != null) return Number(sku.weight);
      if (weightUnitAliases.has(norm) && sku?.weightUnit != null) return String(sku.weightUnit);
      if (quantityAliases.has(norm) && sku?.quantity != null) return Number(sku.quantity);

      // 1b. Campos extras do SKU (sku.data definidos via schema.skuFields)
      if (sku && (sku as { data?: Record<string, unknown> }).data) {
        const skuData = (sku as { data?: Record<string, unknown> }).data!;
        for (const key of [varName, matchKey]) {
          const val = skuData[key];
          if (val !== undefined && val !== null) return typeof val === 'object' ? String(JSON.stringify(val)) : (val as string | number | boolean);
        }
        for (const [k, v] of Object.entries(skuData)) {
          if (this.normalizeVarName(k) === norm && v !== undefined && v !== null && v !== '') {
            return typeof v === 'object' ? String(JSON.stringify(v)) : (v as string | number | boolean);
          }
        }
      }

      // 2. fieldMappings: variableName → schema field key (via autoMapFields)
      const sheetField = mappings[varName];
      if (sheetField != null) {
        const val = data[sheetField];
        if (val !== undefined && val !== null) return typeof val === 'object' ? String(JSON.stringify(val)) : (val as string | number | boolean);
      }

      // 3. Acesso direto no data (key exata — variableName ou matchKey)
      for (const key of [varName, matchKey]) {
        const direct = data[key];
        if (direct !== undefined && direct !== null) return typeof direct === 'object' ? String(JSON.stringify(direct)) : (direct as string | number | boolean);
      }

      // 4. Fallback normalizado: comparar contra todas as keys de data
      for (const [k, v] of Object.entries(data)) {
        if (this.normalizeVarName(k) === norm && v !== undefined && v !== null && v !== '') {
          return typeof v === 'object' ? String(JSON.stringify(v)) : (v as string | number | boolean);
        }
      }

      // 5. Fallback normalizado: comparar contra labels dos schemaFields
      for (const f of schemaFields) {
        if (this.normalizeVarName(f.label) === norm) {
          const val = data[f.key];
          if (val !== undefined && val !== null) return typeof val === 'object' ? String(JSON.stringify(val)) : (val as string | number | boolean);
        }
      }

      return undefined;
    };

    for (const vm of varMetas) {
      if (!vm.variableName) continue;
      const value = resolve(vm.variableName);
      if (value !== undefined && value !== '') variables[vm.variableName] = value;
    }

    console.log(
      `[resolveVariablesForPayload] Resolvidas ${Object.keys(variables).length}/${varMetas.length} variáveis: ${JSON.stringify(variables)}`,
    );

    return variables;
  }

  /**
   * Gera PNG do rótulo a partir de um payload (sem persistir ficha).
   * Usado no passo Finalizar do wizard de criação para preview com variáveis.
   */
  async getLabelPreviewPngFromPayload(
    clientId: string,
    dto: {
      name: string;
      data: Record<string, unknown>;
      skus?: Array<{ sku?: string; name?: string; description?: string; weight?: number; weightUnit?: string; quantity?: number }>;
      schemaFields?: Array<{ key: string; label?: string; type?: string }>;
      templateId: string;
      skuIndex?: number;
    },
  ): Promise<Buffer> {
    const template = await this.templatesService.findOne(dto.templateId, clientId, false);
    const entity = template as unknown as {
      templateType?: string;
      studioData?: string | null;
      size?: { w: number; h: number; unit?: string } | null;
      studioVariables?: Array<{ name: string; type?: string }>;
    };

    if (entity.templateType !== 'studio') {
      throw new BadRequestException('Preview com variáveis só para templates Studio/Canvas');
    }
    if (!entity.studioData?.trim()) {
      throw new BadRequestException(
        'Template sem studioData (JSON do Fabric.js). Salve o template no Studio primeiro.',
      );
    }

    const data = dto.data || {};
    const variables = this.resolveVariablesForPayload(
      dto,
      data,
      entity.studioVariables as Array<{ name: string; type?: string }> | undefined,
      entity.studioData,
    );

    const size = entity.size ?? { w: 50, h: 30, unit: 'mm' };
    return this.canvasRenderer.renderWithVariables(entity.studioData, variables, size);
  }

  /**
   * Gera PNG do rótulo com variáveis da ficha e do SKU (valores reais, não placeholder).
   *
   * Fluxo (Canvas/Fabric.js):
   *  1. Busca studioData (JSON do Fabric.js) do template
   *  2. Busca variáveis da ficha/SKU via getPrintVariables
   *  3. Renderiza o Canvas server-side com as variáveis substituídas → PNG
   *  4. Retorna o buffer PNG para preview
   *
   * O Canvas preserva fontes especiais, posições, estilos — tudo em uma imagem única.
   */
  async getLabelPreviewPng(
    sheetId: string,
    clientId: string,
    templateId: string,
    skuId?: string,
  ): Promise<Buffer> {
    await this.findOne(sheetId, clientId);
    const { variables } = await this.getPrintVariables(sheetId, clientId, templateId, skuId);

    const template = await this.templatesService.findOne(templateId, clientId, false);
    const entity = template as unknown as {
      templateType?: string;
      studioData?: string | null;
      size?: { w: number; h: number; unit?: string } | null;
    };

    if (entity.templateType !== 'studio') {
      throw new BadRequestException('Preview com variáveis só para templates Studio/Canvas');
    }
    if (!entity.studioData?.trim()) {
      throw new BadRequestException(
        'Template sem studioData (JSON do Fabric.js). Salve o template no Studio primeiro.',
      );
    }

    const size = entity.size ?? { w: 50, h: 30, unit: 'mm' };

    // Renderizar Canvas com Fabric.js server-side, variáveis substituídas
    return this.canvasRenderer.renderWithVariables(entity.studioData, variables, size);
  }

  /**
   * Gera ZPL pronto para impressão de um template Canvas com variáveis.
   * Canvas (Fabric.js JSON) + variáveis → PNG → Z64 → ZPL (imagem única).
   */
  async getCanvasZplForPrint(
    studioData: string,
    variables: Record<string, string | number | boolean>,
    size: { w: number; h: number; unit?: string },
  ): Promise<{ zpl: string; z64Data: { z64: string; totalBytes: number; bytesPerRow: number } }> {
    // 1. Renderizar o Canvas com variáveis → PNG (sem imagem de gabarito para impressão)
    const pngBuffer = await this.canvasRenderer.renderWithVariables(studioData, variables, size, { excludeBackgroundImage: true });

    // 2. Converter PNG → Z64 (imagem em formato de impressora)
    const DPI = 203;
    const widthMm = size.unit === 'inches' ? Number(size.w) * 25.4 : Number(size.w);
    const heightMm = size.unit === 'inches' ? Number(size.h) * 25.4 : Number(size.h);
    const targetWidthDots = Math.round(widthMm * (DPI / 25.4));
    const targetHeightDots = Math.round(heightMm * (DPI / 25.4));

    const z64Result = await this.imageProcessor.convertToZ64(
      pngBuffer,
      targetWidthDots,
      targetHeightDots,
      true, // dither
      'contain',
    );

    // 3. Montar ZPL com a imagem Z64
    const zpl = [
      '^XA',
      '^CI28',
      `^FO0,0^GFA,${z64Result.totalBytes},${z64Result.totalBytes},${z64Result.bytesPerRow},${z64Result.z64}^FS`,
      '^XZ',
    ].join('\n');

    return {
      zpl,
      z64Data: {
        z64: z64Result.z64,
        totalBytes: z64Result.totalBytes,
        bytesPerRow: z64Result.bytesPerRow,
      },
    };
  }

  // ════════════════════════════════════════════════════════════════════
  //  Z64 Cache — impressão instantânea por SKU
  // ════════════════════════════════════════════════════════════════════

  /**
   * Garante que o SKU tem Z64 cacheado e válido.
   * Compara cachedZ64At com template.updatedAt, sheet.updatedAt e sku.updatedAt.
   * Se stale ou ausente → renderiza Canvas + variáveis → Z64 → salva no SKU.
   *
   * Retorna o Z64 cacheado (novo ou existente) ou null se não for possível gerar.
   */
  async ensureSkuZ64Cache(
    sheetId: string,
    skuId: string,
    clientId: string,
    templateId?: string,
  ): Promise<{ z64: string; totalBytes: number; bytesPerRow: number } | null> {
    // 1. Buscar SKU
    const sku = await this.skusRepository.findOne({ where: { id: skuId, sheetId } });
    if (!sku) return null;

    // 2. Resolver template: SKU.baseId → Base.studioTemplateId ou templateId fornecido
    let resolvedTemplateId = templateId ?? null;
    if (!resolvedTemplateId && sku.baseId) {
      try {
        const base = await this.basesService.findOne(sku.baseId, clientId);
        resolvedTemplateId = base.studioTemplateId ?? null;
      } catch { /* base não encontrada */ }
    }
    if (!resolvedTemplateId) {
      // Fallback: sheet templates
      const sheetTemplates = await this.sheetTemplatesService.findBySheet(sheetId, clientId);
      const preferred = sheetTemplates.find((t) => t.type === 'rotulo' || t.type === 'contra_rotulo') || sheetTemplates[0];
      resolvedTemplateId = preferred?.studioTemplateId ?? null;
    }
    if (!resolvedTemplateId) return null;

    // 3. Buscar template para verificar updatedAt e studioData
    const template = await this.templatesService.findOne(resolvedTemplateId, clientId, false) as any;
    if (!template?.studioData?.trim()) return null;

    // 4. Buscar sheet para updatedAt
    const sheet = await this.sheetsRepository.findOne({
      where: { id: sheetId, clientId },
      select: ['id', 'updatedAt', 'data', 'name', 'publishedVersionId'],
    });
    if (!sheet) return null;

    // 5. Verificar se o cache é válido
    // NOTA: Não comparar sku.updatedAt porque o próprio save do cache altera updatedAt
    // (TypeORM @UpdateDateColumn). Comparar apenas template e sheet.
    const cacheTime = sku.cachedZ64At ? new Date(sku.cachedZ64At).getTime() : 0;
    const templateTime = template.updatedAt ? new Date(template.updatedAt).getTime() : 0;
    const sheetTime = sheet.updatedAt ? new Date(sheet.updatedAt).getTime() : 0;
    const latestChange = Math.max(templateTime, sheetTime);

    if (
      sku.cachedZ64Data?.z64 &&
      sku.cachedZ64TemplateId === resolvedTemplateId &&
      cacheTime > 0 &&
      cacheTime >= latestChange
    ) {
      // Cache válido
      return sku.cachedZ64Data;
    }

    // Evitar rendering concorrente do mesmo SKU
    if (this.z64RenderingInProgress.has(skuId)) {
      return sku.cachedZ64Data ?? null;
    }
    this.z64RenderingInProgress.add(skuId);

    // 6. Cache stale ou ausente → renderizar
    console.log(
      `[Z64Cache] Rendering SKU ${skuId} (sheet=${sheetId}, template=${resolvedTemplateId})`,
    );

    try {
      // Resolver variáveis
      const { variables } = await this.getPrintVariables(sheetId, clientId, resolvedTemplateId, skuId);

      const size = template.size ?? { w: 50, h: 30, unit: 'mm' };
      const { z64Data } = await this.getCanvasZplForPrint(template.studioData, variables, size);

      // 7. Salvar no SKU usando query raw para NÃO alterar updatedAt
      // (TypeORM @UpdateDateColumn atualizaria updatedAt, invalidando o cache imediatamente)
      await this.skusRepository
        .createQueryBuilder()
        .update(SheetSku)
        .set({
          cachedZ64Data: z64Data,
          cachedZ64At: new Date(),
          cachedZ64TemplateId: resolvedTemplateId,
        })
        .where('id = :id', { id: skuId })
        .execute();

      console.log(
        `[Z64Cache] ✅ Cached SKU ${skuId} (${z64Data.z64.length} chars, ${z64Data.totalBytes} bytes)`,
      );

      return z64Data;
    } catch (err) {
      console.warn(`[Z64Cache] ⚠️ Failed to cache Z64 for SKU ${skuId}: ${err?.message}`);
      return null;
    } finally {
      this.z64RenderingInProgress.delete(skuId);
    }
  }

  /**
   * Warm-up em background: garante Z64 cache para todos os SKUs ativos de uma ficha.
   * Fire-and-forget — não bloqueia a resposta.
   */
  warmUpZ64CacheForSheet(sheetId: string, clientId: string): void {
    // Executa em background, sem await
    (async () => {
      try {
        const sheet = await this.sheetsRepository.findOne({
          where: { id: sheetId, clientId },
          relations: ['skus'],
          select: ['id'],
        });
        if (!sheet?.skus?.length) return;

        const activeSkus = sheet.skus.filter((s) => s.active);
        for (const sku of activeSkus) {
          // Processar sequencialmente para não sobrecarregar
          await this.ensureSkuZ64Cache(sheetId, sku.id, clientId);
        }
      } catch (err) {
        console.warn(`[Z64Cache] Warm-up failed for sheet ${sheetId}: ${err?.message}`);
      }
    })();
  }

  private calculateChanges(oldData: Record<string, unknown>, newData: Record<string, unknown>): VersionChange[] {
    const changes: VersionChange[] = [];
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

    for (const key of allKeys) {
      const oldValue = oldData?.[key];
      const newValue = newData?.[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field: key, oldValue, newValue });
      }
    }

    return changes;
  }

  // === Stats ===

  async getStats(clientId: string) {
    const [total, draft, pendingReview, approved, active] = await Promise.all([
      this.sheetsRepository.count({ where: { clientId } }),
      this.sheetsRepository.count({ where: { clientId, status: 'draft' } }),
      this.sheetsRepository.count({ where: { clientId, status: 'pending_review' } }),
      this.sheetsRepository.count({ where: { clientId, status: 'approved' } }),
      this.sheetsRepository.count({ where: { clientId, status: 'active' } }),
    ]);

    return { total, draft, pendingReview, approved, active };
  }

  /**
   * Lista fichas com aprovação pendente para o usuário (assignedTo = userId ou null).
   * Retorna a etapa atual por ficha (menor order entre pending/in_progress) e ordena por deadline.
   */
  async findPendingApprovalsForUser(
    clientId: string,
    userId: string,
  ): Promise<{ items: Array<{ sheet: Sheet; currentApproval: SheetApproval }>; total: number }> {
    const approvals = await this.approvalsRepository
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.sheet', 'sheet')
      .innerJoinAndSelect('sheet.schema', 'schema')
      .leftJoinAndSelect('sheet.createdByUser', 'createdByUser')
      .where('sheet.clientId = :clientId', { clientId })
      .andWhere('a.status IN (:...statuses)', { statuses: ['pending', 'in_progress'] })
      .andWhere('(a.assignedTo = :userId OR a.assignedTo IS NULL)', { userId })
      .getMany();

    const bySheet = new Map<string, SheetApproval>();
    for (const a of approvals) {
      const existing = bySheet.get(a.sheetId);
      if (!existing || a.order < existing.order) bySheet.set(a.sheetId, a);
    }

    const items = Array.from(bySheet.entries()).map(([, approval]) => ({
      sheet: approval.sheet,
      currentApproval: approval,
    }));

    items.sort((a, b) => {
      const dA = a.currentApproval.deadline
        ? new Date(a.currentApproval.deadline).getTime()
        : Number.MAX_SAFE_INTEGER;
      const dB = b.currentApproval.deadline
        ? new Date(b.currentApproval.deadline).getTime()
        : Number.MAX_SAFE_INTEGER;
      return dA - dB;
    });

    return { items, total: items.length };
  }
}
