import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { SheetShare } from '../entities/sheet-share.entity';
import { Sheet } from '../entities/sheet.entity';
import { SheetVersion, VersionChange } from '../entities/sheet-version.entity';
import { CreateSheetShareDto } from '../dto/sheet-share.dto';
import { SheetsService } from './sheets.service';

@Injectable()
export class SheetSharesService {
  constructor(
    @InjectRepository(SheetShare)
    private sharesRepository: Repository<SheetShare>,
    @InjectRepository(Sheet)
    private sheetsRepository: Repository<Sheet>,
    @InjectRepository(SheetVersion)
    private versionsRepository: Repository<SheetVersion>,
    @Inject(forwardRef(() => SheetsService))
    private sheetsService: SheetsService,
  ) {}

  // Gera token curto e legível (ex: "abc123xyz")
  private generateToken(): string {
    return randomBytes(12).toString('base64url').substring(0, 16);
  }

  // Criar compartilhamento
  async create(
    sheetId: string,
    clientId: string,
    userId: string,
    dto: CreateSheetShareDto,
  ): Promise<SheetShare> {
    // Verificar se a sheet existe e pertence ao cliente
    const sheet = await this.sheetsRepository.findOne({
      where: { id: sheetId, clientId },
    });
    if (!sheet) {
      throw new NotFoundException('Ficha técnica não encontrada');
    }

    // Validar email se restrito
    if (dto.accessType === 'email_restricted' && !dto.allowedEmail) {
      throw new BadRequestException('Email é obrigatório para acesso restrito');
    }

    // Verificar se já existe share ativo para o mesmo email
    if (dto.allowedEmail) {
      const existing = await this.sharesRepository.findOne({
        where: {
          sheetId,
          allowedEmail: dto.allowedEmail,
          active: true,
        },
      });
      if (existing) {
        return existing; // Retorna o share existente
      }
    }

    const share = this.sharesRepository.create({
      sheetId,
      clientId,
      token: this.generateToken(),
      accessType: dto.accessType,
      permission: dto.permission || 'view',
      allowedEmail: dto.allowedEmail,
      guestName: dto.guestName,
      message: dto.message,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      createdBy: userId,
    });

    return this.sharesRepository.save(share);
  }

  // Listar compartilhamentos de uma sheet
  async findBySheet(sheetId: string, clientId: string): Promise<SheetShare[]> {
    return this.sharesRepository.find({
      where: { sheetId, clientId },
      order: { createdAt: 'DESC' },
    });
  }

  // Revogar compartilhamento
  async revoke(id: string, clientId: string): Promise<void> {
    const share = await this.sharesRepository.findOne({
      where: { id, clientId },
    });
    if (!share) {
      throw new NotFoundException('Compartilhamento não encontrado');
    }
    share.active = false;
    await this.sharesRepository.save(share);
  }

  // Deletar compartilhamento
  async remove(id: string, clientId: string): Promise<void> {
    const share = await this.sharesRepository.findOne({
      where: { id, clientId },
    });
    if (!share) {
      throw new NotFoundException('Compartilhamento não encontrado');
    }
    await this.sharesRepository.remove(share);
  }

  // ============================================
  // ACESSO PÚBLICO (sem auth)
  // ============================================

  // Acessar sheet via token público
  async accessByToken(token: string, email?: string) {
    const share = await this.sharesRepository.findOne({
      where: { token, active: true },
      relations: ['sheet'],
    });

    if (!share) {
      throw new NotFoundException('Link de compartilhamento não encontrado ou expirado');
    }

    // Verificar expiração
    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new ForbiddenException('Este link de compartilhamento expirou');
    }

    // Verificar restrição de email
    if (share.accessType === 'email_restricted') {
      if (!email) {
        // Retorna indicação de que precisa de email
        return {
          requiresEmail: true,
          guestName: share.guestName,
          message: share.message,
        };
      }
      if (email.toLowerCase() !== share.allowedEmail.toLowerCase()) {
        throw new ForbiddenException('Este link é restrito a um email específico');
      }
    }

    // Atualizar tracking
    share.accessCount += 1;
    share.lastAccessedAt = new Date();
    await this.sharesRepository.save(share);

    // Carregar sheet completa com relações
    const sheet = await this.sheetsRepository.findOne({
      where: { id: share.sheetId },
      relations: [
        'schema',
        'approvals',
        'approvals.assignedUser',
        'approvals.completedByUser',
        'skus',
        'createdByUser',
      ],
    });

    if (!sheet) {
      throw new NotFoundException('Ficha técnica não encontrada');
    }

    // Usar versão publicada quando há rascunho em cima da ficha ativa (não quebrar o "ao vivo")
    const publishedData = await this.sheetsService.getPublishedData(sheet.id, sheet.clientId);
    const dataToUse = publishedData?.data ?? sheet.data;
    const skusToUse = publishedData ? publishedData.skus : (sheet.skus
      ?.filter((s) => s.active)
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        id: s.id,
        sku: s.sku,
        name: s.name,
        description: s.description,
        weight: s.weight,
        weightUnit: s.weightUnit,
        quantity: s.quantity,
        baseName: s.baseName,
        basePreviewUrl: s.basePreviewUrl,
      })) ?? []);

    return {
      requiresEmail: false,
      share: {
        id: share.id,
        permission: share.permission,
        guestName: share.guestName,
        message: share.message,
        accessType: share.accessType,
      },
      sheet: {
        id: sheet.id,
        name: sheet.name,
        sku: sheet.sku,
        status: sheet.status,
        version: sheet.version,
        data: dataToUse,
        schema: sheet.schema
          ? {
              name: sheet.schema.name,
              fields: sheet.schema.fields,
            }
          : null,
        approvals: sheet.approvals
          ?.sort((a, b) => a.order - b.order)
          .map((a) => ({
            id: a.id,
            stage: a.stage,
            status: a.status,
            order: a.order,
            deadline: a.deadline,
            startedAt: a.startedAt,
            completedAt: a.completedAt,
            assignedUser: a.assignedUser
              ? { name: a.assignedUser.name }
              : null,
            completedByUser: a.completedByUser
              ? { name: a.completedByUser.name }
              : null,
            comment: a.comment,
          })),
        skus: skusToUse,
        createdByUser: sheet.createdByUser
          ? { name: sheet.createdByUser.name }
          : null,
        comments: ((sheet.metadata as Record<string, unknown>)?.externalComments as Array<Record<string, unknown>>) || [],
        createdAt: sheet.createdAt,
        updatedAt: sheet.updatedAt,
        deadline: sheet.deadline,
        submittedAt: sheet.submittedAt,
      },
    };
  }

  // Adicionar comentário via share (público)
  async addComment(
    token: string,
    data: { author: string; email?: string; content: string; stage?: string; parentId?: string },
  ) {
    const share = await this.sharesRepository.findOne({
      where: { token, active: true },
    });

    if (!share) {
      throw new NotFoundException('Link não encontrado');
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new ForbiddenException('Link expirado');
    }

    if (share.permission === 'view') {
      throw new ForbiddenException('Este link não permite comentários');
    }

    // Verificar email se restrito
    if (share.accessType === 'email_restricted' && data.email) {
      if (data.email.toLowerCase() !== share.allowedEmail.toLowerCase()) {
        throw new ForbiddenException('Email não autorizado');
      }
    }

    // Buscar sheet e adicionar comentário como metadata
    const sheet = await this.sheetsRepository.findOne({
      where: { id: share.sheetId },
    });

    if (!sheet) {
      throw new NotFoundException('Ficha não encontrada');
    }

    // Armazenar comentários externos em metadata
    const externalComments = (sheet.metadata as Record<string, unknown>)?.externalComments as Array<Record<string, unknown>> || [];
    externalComments.push({
      id: randomBytes(8).toString('hex'),
      shareId: share.id,
      author: data.author,
      email: data.email,
      content: data.content,
      stage: data.stage,
      parentId: data.parentId || null,
      createdAt: new Date().toISOString(),
    });

    await this.sheetsRepository.update(sheet.id, {
      metadata: {
        ...(sheet.metadata as Record<string, unknown> || {}),
        externalComments,
      },
    });

    return { success: true };
  }

  // Editar sheet via share (público - permissão 'edit')
  // Cria uma nova versão e coloca a ficha para aprovação
  async editByToken(
    token: string,
    data: { author: string; email?: string; data: Record<string, unknown> },
  ) {
    const share = await this.sharesRepository.findOne({
      where: { token, active: true },
    });

    if (!share) {
      throw new NotFoundException('Link não encontrado');
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new ForbiddenException('Link expirado');
    }

    if (share.permission !== 'edit' && share.permission !== 'approve') {
      throw new ForbiddenException('Este link não permite edição');
    }

    // Verificar email se restrito
    if (share.accessType === 'email_restricted' && data.email) {
      if (data.email.toLowerCase() !== share.allowedEmail.toLowerCase()) {
        throw new ForbiddenException('Email não autorizado');
      }
    }

    // Validar que data.data existe e tem campos
    if (!data.data || typeof data.data !== 'object') {
      throw new BadRequestException('Dados de edição inválidos');
    }

    const sheet = await this.sheetsRepository.findOne({
      where: { id: share.sheetId },
    });

    if (!sheet) {
      throw new NotFoundException('Ficha não encontrada');
    }

    const currentData = (sheet.data as Record<string, unknown>) || {};
    const incomingData = data.data || {};

    // Calcular apenas campos efetivamente alterados
    const changes: VersionChange[] = [];
    for (const key of Object.keys(incomingData)) {
      const oldValue = currentData[key];
      const newValue = incomingData[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field: key, oldValue, newValue });
      }
    }

    if (changes.length === 0) {
      return { success: true, updatedFields: [], newVersion: sheet.version, message: 'Nenhuma alteração detectada' };
    }

    // 1. Descobrir a próxima versão disponível na tabela de versões
    const lastVersion = await this.versionsRepository
      .createQueryBuilder('v')
      .where('v.sheetId = :sheetId', { sheetId: sheet.id })
      .orderBy('v.version', 'DESC')
      .getOne();

    const nextVersionNumber = lastVersion
      ? Math.max(lastVersion.version + 1, sheet.version + 1)
      : sheet.version;

    // 2. Salvar versão anterior (snapshot)
    const versionSnapshot = this.versionsRepository.create({
      sheetId: sheet.id,
      version: nextVersionNumber,
      data: currentData,
      changes,
      createdBy: sheet.updatedBy || sheet.createdBy,
    });
    await this.versionsRepository.save(versionSnapshot);

    // 2. Merge dos dados
    const updatedData = {
      ...currentData,
      ...incomingData,
    };

    // 3. Registrar edição externa no metadata
    const currentMetadata = (sheet.metadata as Record<string, unknown>) || {};
    const editHistory = (currentMetadata.externalEdits as Array<Record<string, unknown>>) || [];
    editHistory.push({
      id: randomBytes(8).toString('hex'),
      shareId: share.id,
      author: data.author,
      email: data.email,
      fields: changes.map((c) => c.field),
      version: nextVersionNumber + 1,
      editedAt: new Date().toISOString(),
    });

    // 4. Atualizar sheet: incrementar versão, voltar para changes_requested
    // Se estava ativa/aprovada, volta para revisão para reaprovação
    const needsReapproval = ['approved', 'active', 'pending_review', 'in_review'].includes(sheet.status);
    const newVersion = nextVersionNumber + 1;

    await this.sheetsRepository.update(sheet.id, {
      data: updatedData,
      version: newVersion,
      status: needsReapproval ? 'changes_requested' : sheet.status,
      metadata: {
        ...currentMetadata,
        externalEdits: editHistory,
        lastExternalEditBy: data.author,
        lastExternalEditAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      updatedFields: changes.map((c) => c.field),
      newVersion,
      needsReapproval,
      message: needsReapproval
        ? `${changes.length} campo(s) alterados. Nova versão v${newVersion} criada. A ficha voltou para revisão.`
        : `${changes.length} campo(s) alterados. Nova versão v${newVersion} criada.`,
    };
  }
}
