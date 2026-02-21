import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SheetTemplate, TemplateType } from '../entities/sheet-template.entity';
import { Sheet } from '../entities/sheet.entity';
import { AddSheetTemplateDto, UpdateSheetTemplateDto } from '../dto/sheet-template.dto';
import { TemplatesService } from '../../templates/templates.service';
import { SchemaField } from '../entities/schema.entity';

@Injectable()
export class SheetTemplatesService {
  constructor(
    @InjectRepository(SheetTemplate)
    private templatesRepository: Repository<SheetTemplate>,
    @InjectRepository(Sheet)
    private sheetsRepository: Repository<Sheet>,
    private readonly studioTemplatesService: TemplatesService,
    @Inject(forwardRef(() => require('./sheets.service').SheetsService))
    private readonly sheetsService: any,
  ) {}

  async findBySheet(sheetId: string, clientId: string): Promise<SheetTemplate[]> {
    // Verificar acesso à sheet
    const sheet = await this.sheetsRepository.findOne({
      where: { id: sheetId, clientId },
    });

    if (!sheet) {
      throw new NotFoundException(`Ficha com ID ${sheetId} não encontrada`);
    }

    return this.templatesRepository.find({
      where: { sheetId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string, sheetId: string, clientId: string): Promise<SheetTemplate> {
    // Verificar acesso à sheet
    const sheet = await this.sheetsRepository.findOne({
      where: { id: sheetId, clientId },
    });

    if (!sheet) {
      throw new NotFoundException(`Ficha com ID ${sheetId} não encontrada`);
    }

    const template = await this.templatesRepository.findOne({
      where: { id, sheetId },
    });

    if (!template) {
      throw new NotFoundException(`Template com ID ${id} não encontrado`);
    }

    return template;
  }

  /**
   * Retorna fieldMappings para impressão: do SheetTemplate vinculado à ficha ou, se o template
   * for usado só pelo SKU (baseId) e não estiver vinculado, aplica auto-mapeamento entre
   * studioVariables do template e campos do schema da ficha.
   */
  async getFieldMappingsForPrint(
    sheetId: string,
    clientId: string,
    templateId: string,
  ): Promise<Record<string, string>> {
    const sheetTemplates = await this.findBySheet(sheetId, clientId);
    const st = sheetTemplates.find((t) => t.studioTemplateId === templateId);
    if (st?.fieldMappings && Object.keys(st.fieldMappings).length > 0) {
      return st.fieldMappings;
    }

    const sheet = await this.sheetsRepository.findOne({
      where: { id: sheetId, clientId },
      relations: ['schema'],
    });
    const schemaFields: SchemaField[] = sheet?.schema?.fields || [];
    if (schemaFields.length === 0) return {};

    let studioVariables: Array<{ name: string; type: string }> = [];
    try {
      const studioTemplate = await this.studioTemplatesService.findOne(templateId, null, true);
      const raw = (studioTemplate.studioVariables as Array<Record<string, unknown>>) || [];
      studioVariables = raw.map((v) => ({
        name: (v.name as string) ?? '',
        type: (v.type as string) || 'text',
      }));
    } catch {
      return {};
    }
    if (studioVariables.length === 0) return {};

    return this.autoMapFields(schemaFields, studioVariables);
  }

  async add(sheetId: string, clientId: string, dto: AddSheetTemplateDto): Promise<SheetTemplate> {
    // Verificar acesso à sheet
    const sheet = await this.sheetsRepository.findOne({
      where: { id: sheetId, clientId },
      relations: ['schema'],
    });

    if (!sheet) {
      throw new NotFoundException(`Ficha com ID ${sheetId} não encontrada`);
    }

    // Calcular próxima ordem
    const maxOrder = await this.templatesRepository
      .createQueryBuilder('t')
      .select('MAX(t.order)', 'max')
      .where('t.sheetId = :sheetId', { sheetId })
      .getRawOne();

    const order = dto.order ?? ((maxOrder?.max ?? -1) + 1);

    // Auto-mapear campos por similaridade de nomes se não houver fieldMappings explícito
    let fieldMappings = dto.fieldMappings;
    if (!fieldMappings || Object.keys(fieldMappings).length === 0) {
      try {
        const studioTemplate = await this.studioTemplatesService.findOne(
          dto.studioTemplateId,
          null,
          true,
        );
        const studioVariables = (studioTemplate.studioVariables as Array<Record<string, unknown>>) || [];
        const schemaFields: SchemaField[] = sheet.schema?.fields || [];

        if (studioVariables.length > 0 && schemaFields.length > 0) {
          fieldMappings = this.autoMapFields(
            schemaFields,
            studioVariables.map((v) => ({
              name: v.name as string,
              type: (v.type as string) || 'text',
            })),
          );
        }
      } catch {
        // Se não encontrar o template no Studio, seguir sem auto-mapeamento
      }
    }

    const template = this.templatesRepository.create({
      sheetId,
      studioTemplateId: dto.studioTemplateId,
      studioTemplateName: dto.studioTemplateName,
      studioTemplatePreview: dto.studioTemplatePreview,
      type: dto.type as TemplateType,
      label: dto.label || this.getDefaultLabel(dto.type),
      order,
      fieldMappings: fieldMappings && Object.keys(fieldMappings).length > 0 ? fieldMappings : null,
      customData: dto.customData,
    });

    const saved = await this.templatesRepository.save(template);

    // Gerar mockups no R2 agora que o template está vinculado
    this.sheetsService
      .generateAndSaveMockupsForSheet(sheetId, clientId)
      .catch((err: any) => console.warn(`[SheetTemplatesService] Falha ao gerar mockups após vincular template: ${err?.message}`));

    return saved;
  }

  async update(id: string, sheetId: string, clientId: string, dto: UpdateSheetTemplateDto): Promise<SheetTemplate> {
    const template = await this.findOne(id, sheetId, clientId);

    Object.assign(template, dto);
    template.updatedAt = new Date();

    return this.templatesRepository.save(template);
  }

  async remove(id: string, sheetId: string, clientId: string): Promise<void> {
    const template = await this.findOne(id, sheetId, clientId);
    await this.templatesRepository.remove(template);
  }

  async reorder(sheetId: string, clientId: string, templateIds: string[]): Promise<SheetTemplate[]> {
    // Verificar acesso à sheet
    const sheet = await this.sheetsRepository.findOne({
      where: { id: sheetId, clientId },
    });

    if (!sheet) {
      throw new NotFoundException(`Ficha com ID ${sheetId} não encontrada`);
    }

    // Atualizar ordem
    for (let i = 0; i < templateIds.length; i++) {
      await this.templatesRepository.update(
        { id: templateIds[i], sheetId },
        { order: i },
      );
    }

    return this.findBySheet(sheetId, clientId);
  }

  // ── Variable mapping methods ──

  /**
   * Retorna variáveis do Studio template, campos do schema da ficha,
   * dados atuais da ficha e mapeamentos salvos.
   */
  async getVariables(
    sheetTemplateId: string,
    sheetId: string,
    clientId: string,
  ) {
    // Buscar sheet com schema e data
    const sheet = await this.sheetsRepository.findOne({
      where: { id: sheetId, clientId },
      relations: ['schema'],
    });

    if (!sheet) {
      throw new NotFoundException('Ficha não encontrada');
    }

    // Buscar o sheet template
    const sheetTemplate = await this.templatesRepository.findOne({
      where: { id: sheetTemplateId, sheetId },
    });

    if (!sheetTemplate) {
      throw new NotFoundException('Template vinculado não encontrado');
    }

    // Buscar variáveis do Studio template
    let studioVariables: Array<Record<string, unknown>> = [];
    try {
      const studioTemplate = await this.studioTemplatesService.findOne(
        sheetTemplate.studioTemplateId,
        null,
        true, // isSystemUser to bypass client check
      );
      studioVariables = (studioTemplate.studioVariables as Array<Record<string, unknown>>) || [];
    } catch {
      // Template pode não existir mais no Studio
    }

    // Campos do schema
    const schemaFields: SchemaField[] = sheet.schema?.fields || [];

    // Dados atuais
    const sheetData = (sheet.data as Record<string, unknown>) || {};

    return {
      sheetTemplate: {
        id: sheetTemplate.id,
        studioTemplateId: sheetTemplate.studioTemplateId,
        label: sheetTemplate.label,
        type: sheetTemplate.type,
      },
      fieldMappings: sheetTemplate.fieldMappings || {},
      studioVariables: studioVariables.map((v) => ({
        name: v.name as string,
        type: (v.type as string) || 'text',
        defaultValue: v.defaultValue as string,
      })),
      schemaFields: schemaFields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        section: f.section || 'Geral',
      })),
      sheetData,
      sheetName: sheet.name,
    };
  }

  /**
   * Atualiza os field mappings (variável Studio → campo da ficha)
   */
  async updateFieldMappings(
    sheetTemplateId: string,
    sheetId: string,
    clientId: string,
    mappings: Record<string, string>,
  ) {
    const sheet = await this.sheetsRepository.findOne({
      where: { id: sheetId, clientId },
    });

    if (!sheet) {
      throw new NotFoundException('Ficha não encontrada');
    }

    const sheetTemplate = await this.templatesRepository.findOne({
      where: { id: sheetTemplateId, sheetId },
    });

    if (!sheetTemplate) {
      throw new NotFoundException('Template vinculado não encontrado');
    }

    await this.templatesRepository.update(sheetTemplateId, {
      fieldMappings: mappings,
    });

    return { success: true, fieldMappings: mappings };
  }

  /**
   * Auto-mapeia campos do schema para variáveis do template por similaridade de nomes.
   */
  autoMapFields(
    schemaFields: SchemaField[],
    studioVariables: Array<{ name: string; type: string }>,
  ): Record<string, string> {
    const mappings: Record<string, string> = {};

    for (const v of studioVariables) {
      const varName = (v?.name ?? '').toLowerCase();
      if (!varName) continue;
      const varNormalized = varName.replace(/[_\-\s]/g, '');

      let bestMatch: string | null = null;
      let bestScore = 0;

      for (const f of schemaFields) {
        const fieldKey = (f.key ?? '').toLowerCase();
        const fieldNormalized = fieldKey.replace(/[_\-\s]/g, '');
        const fieldLabel = (f.label ?? f.key ?? '').toLowerCase().replace(/[_\-\s]/g, '');

        let score = 0;

        // Correspondência exata
        if (varNormalized === fieldNormalized || varNormalized === fieldLabel) {
          score = 100;
        }
        // Uma contém a outra
        else if (varNormalized.includes(fieldNormalized) || fieldNormalized.includes(varNormalized)) {
          score = 70;
        }
        // Label contém o nome da variável ou vice-versa
        else if (varNormalized.includes(fieldLabel) || fieldLabel.includes(varNormalized)) {
          score = 60;
        }
        // Palavras em comum
        else {
          const varWords = varName.split(/[_\-\s]+/);
          const fieldWords = [...fieldKey.split(/[_\-\s]+/), ...(f.label ?? f.key ?? '').toLowerCase().split(/\s+/)];
          const commonWords = varWords.filter((w) => fieldWords.some((fw) => fw.includes(w) || w.includes(fw)));
          if (commonWords.length > 0) {
            score = 30 + commonWords.length * 10;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = f.key;
        }
      }

      if (bestMatch && bestScore >= 30) {
        mappings[v.name] = bestMatch;
      }
    }

    return mappings;
  }

  private getDefaultLabel(type: string): string {
    const labels: Record<string, string> = {
      rotulo: 'Rótulo Principal',
      contra_rotulo: 'Contra Rótulo',
      gargalo: 'Gargalo',
      tampa: 'Tampa',
      caixa: 'Caixa',
      sleeve: 'Sleeve',
      tag: 'Tag',
      outro: 'Outro',
    };
    return labels[type] || 'Template';
  }

  // Tipos disponíveis para o frontend
  getTemplateTypes(): { value: string; label: string }[] {
    return [
      { value: 'rotulo', label: 'Rótulo Principal' },
      { value: 'contra_rotulo', label: 'Contra Rótulo' },
      { value: 'gargalo', label: 'Gargalo' },
      { value: 'tampa', label: 'Tampa' },
      { value: 'caixa', label: 'Caixa' },
      { value: 'sleeve', label: 'Sleeve' },
      { value: 'tag', label: 'Tag' },
      { value: 'outro', label: 'Outro' },
    ];
  }
}
