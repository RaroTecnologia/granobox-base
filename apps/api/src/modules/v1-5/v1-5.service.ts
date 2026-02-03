import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PrintLabelDto,
  PrintLabelResponseDto,
  LabelTypeEnum,
} from './dto/print-label.dto';
import { Label, LabelType } from '../labels/entities/label.entity';
import { TemplateProcessingService } from '../template-processing/services/template-processing.service';
import { EdgeGoWebSocketGateway } from '../websocket/edge-go-websocket.gateway';
import { WsServiceClient } from '../websocket/ws-service-client';
import { PrintersService } from '../printers/printers.service';
import { generateLabelCode } from '../labels/utils/label-code.utils';
import { PrintJobsService } from '../edge/services/print-jobs.service';
import { PrintMethod } from '../edge/entities/print-job.entity';
import { LabelsService } from '../labels/labels.service';
import { LabelEventType } from '../labels/entities/label-event.entity';

@Injectable()
export class V15Service {
  private readonly logger = new Logger(V15Service.name);

  constructor(
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
    private readonly templateProcessingService: TemplateProcessingService,
    private readonly edgeGoGateway: EdgeGoWebSocketGateway,
    private readonly wsServiceClient: WsServiceClient,
    private readonly printersService: PrintersService,
    private readonly printJobsService: PrintJobsService,
    private readonly labelsService: LabelsService,
  ) {}

  /**
   * Endpoint principal: /v1.5/print-label
   * Processa templates no backend e envia para impressão
   */
  async printLabel(
    dto: PrintLabelDto,
    userId: string,
    clientId: string,
  ): Promise<PrintLabelResponseDto> {
    this.logger.log(`📋 [v1.5] Print label request:`, {
      labelType: dto.labelType,
      copies: dto.copies,
      templateId: dto.templateId,
      printerId: dto.printerId,
    });

    // 1. Validar metadados para labelType=validity
    if (dto.labelType === LabelTypeEnum.VALIDITY) {
      if (!dto.metadata?.productId) {
        throw new BadRequestException(
          'metadata.productId é obrigatório para labelType=validity',
        );
      }
      if (!dto.metadata?.validityDate) {
        throw new BadRequestException(
          'metadata.validityDate é obrigatório para labelType=validity',
        );
      }
    }

    // 2. Buscar impressora e validar
    const printer = await this.validatePrinter(dto.printerId, clientId);

    // 3. Processar de acordo com o tipo
    let zpl: string;
    let labels: Array<{ id: string; code: string }> | undefined;

    if (dto.labelType === LabelTypeEnum.VALIDITY) {
      // Etiquetas rastreáveis - cada uma com código único
      const result = await this.processValidityLabels(
        dto,
        userId,
        clientId,
      );
      zpl = result.zpl;
      labels = result.labels;
    } else {
      // Etiquetas genéricas - todas iguais
      zpl = await this.processGenericLabels(dto, clientId);
    }

    // 4. Aplicar offsets se fornecidos
    if (dto.offsets) {
      zpl = this.applyOffsets(zpl, dto.offsets.x, dto.offsets.y);
    }

    // 5. Enviar para impressora via Edge-Go
    // ⭐ IMPORTANTE: usar printer.deviceId (edge-go-xxx), não printerId (UUID)!
    const jobId = await this.sendToEdgeGo(
      printer.deviceId,
      zpl,
      dto.copies,
      labels?.map(l => l.id),
      userId,
      clientId,
    );

    this.logger.log(`✅ [v1.5] Print job created: ${jobId}`);

    return {
      success: true,
      jobId,
      message: `${dto.copies} etiqueta(s) enviada(s) para impressão`,
      labels,
      details: {
        printer: printer.name,
        copies: dto.copies,
        zplBytes: zpl.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Processa etiquetas de validade (rastreáveis)
   * Cria N registros no banco e gera N ZPLs com códigos únicos
   */
  private async processValidityLabels(
    dto: PrintLabelDto,
    userId: string,
    clientId: string,
  ): Promise<{ zpl: string; labels: Array<{ id: string; code: string }> }> {
    this.logger.log(`📦 [v1.5] Creating ${dto.copies} validity labels...`);

    // 1. Criar etiquetas no banco
    const labels: Label[] = [];
    for (let i = 0; i < dto.copies; i++) {
      const label = this.labelRepository.create({
        code: generateLabelCode(),
        type: LabelType.VALIDITY,
        clientId,
        productId: dto.metadata!.productId,
        operationId: dto.metadata?.operationId,
        storageLocationId: dto.metadata?.storageLocationId,
        conservationType: dto.metadata?.conservationType as any,
        productionDate: dto.metadata?.productionDate
          ? new Date(dto.metadata.productionDate)
          : new Date(),
        validityDate: new Date(dto.metadata!.validityDate),
        manufacturingBatch: dto.metadata?.manufacturingBatch,
        expiryDate: dto.metadata?.expiryDate
          ? new Date(dto.metadata.expiryDate)
          : undefined,
        quantity: 1,
        status: 'pending' as any,
      });

      labels.push(label);
    }

    await this.labelRepository.save(labels);

    this.logger.log(
      `✅ [v1.5] Created ${labels.length} labels:`,
      labels.map(l => l.code),
    );

    // ⭐ Criar eventos de CREATED para cada label
    for (const label of labels) {
      try {
        await this.labelsService.addLabelEvent(
          label.id,
          LabelEventType.CREATED,
          userId,
          {
            conservacao: label.conservationType,
            produto: dto.labelData?.produto || dto.labelData?.nome_produto,
            templateId: dto.templateId,
          },
        );
      } catch (error) {
        this.logger.error(`Erro ao criar evento CREATED para label ${label.code}: ${error.message}`);
        // Não falhar a impressão se o evento falhar
      }
    }

    // 2. Processar template para cada etiqueta (cada uma com seu código)
    const variablesArray = labels.map(label => ({
      ...dto.labelData,
      codigo: label.code,
      qrcode: label.code,
      barcode: label.code,
    }));

    this.logger.log(`🎨 [v1.5] Processing ${labels.length} templates...`);

    const zpls = await this.templateProcessingService.processTemplates(
      dto.templateId,
      variablesArray,
      clientId,
    );

    // 3. Concatenar todos os ZPLs
    const finalZpl = zpls.join('\n');

    this.logger.log(
      `✅ [v1.5] Generated ${zpls.length} ZPLs (${finalZpl.length} bytes)`,
    );

    return {
      zpl: finalZpl,
      labels: labels.map(l => ({ id: l.id, code: l.code })),
    };
  }

  /**
   * Processa etiquetas genéricas (não rastreáveis)
   * Gera 1 ZPL e usa comando ^PQ para imprimir N cópias
   */
  private async processGenericLabels(dto: PrintLabelDto, clientId: string): Promise<string> {
    this.logger.log(`📄 [v1.5] Creating generic label (${dto.copies} copies)...`);

    // 1. Processar template UMA vez
    this.logger.log(`🎨 [v1.5] Processing template...`);

    let zpl = await this.templateProcessingService.processTemplate(
      dto.templateId,
      dto.labelData,
      clientId,
    );

    // 2. Adicionar comando ^PQ (Print Quantity) se necessário
    if (dto.copies > 1) {
      zpl = this.addPrintQuantityCommand(zpl, dto.copies);
    }

    this.logger.log(
      `✅ [v1.5] Generated generic ZPL (${zpl.length} bytes, ${dto.copies} copies)`,
    );

    return zpl;
  }

  /**
   * Adiciona comando ^PQ ao ZPL para imprimir múltiplas cópias
   */
  private addPrintQuantityCommand(zpl: string, quantity: number): string {
    // Remover ^PQ existente (se houver)
    zpl = zpl.replace(/\^PQ\d+/g, '');

    // Adicionar ^PQ antes do ^XZ final
    if (zpl.includes('^XZ')) {
      zpl = zpl.replace(/\^XZ/, `^PQ${quantity}^XZ`);
    } else {
      // Se não houver ^XZ, adicionar no final
      zpl += `\n^PQ${quantity}`;
    }

    return zpl;
  }

  /**
   * Aplica offsets (deslocamento) ao ZPL
   */
  private applyOffsets(zpl: string, x: number, y: number): string {
    if (x === 0 && y === 0) {
      return zpl;
    }

    this.logger.log(`📐 [v1.5] Applying offsets: x=${x}, y=${y}`);

    // Adicionar ^LT (Label Top) e ^LS (Label Shift) após ^XA
    const offsetCommands = [];
    if (y !== 0) offsetCommands.push(`^LT${y}`);
    if (x !== 0) offsetCommands.push(`^LS${x}`);

    if (offsetCommands.length > 0) {
      zpl = zpl.replace(/\^XA/, `^XA\n${offsetCommands.join('\n')}`);
    }

    return zpl;
  }

  /**
   * Valida impressora e permissões
   */
  private async validatePrinter(printerId: string, clientId: string) {
    // Se for edge-go-xxx ou edge-pro-xxx, buscar pela tabela de printers usando deviceId
    let printer: any;

    if (printerId.startsWith('edge-go-') || printerId.startsWith('edge-pro-')) {
      // Buscar impressora com este deviceId (fingerprint do Edge-Go/Edge-Pro)
      const printers = await this.printersService.findAll(clientId);
      printer = printers.find(
        p => p.deviceId === printerId || p.id === printerId,
      );
    } else {
      // Buscar por ID
      printer = await this.printersService.findOne(printerId);
    }

    if (!printer) {
      throw new NotFoundException('Impressora não encontrada');
    }

    if (printer.clientId !== clientId) {
      throw new BadRequestException(
        'Você não tem permissão para usar esta impressora',
      );
    }

    if (printer.status !== 'active') {
      throw new BadRequestException(
        `Impressora está ${printer.status}. Apenas impressoras ativas podem imprimir.`,
      );
    }

    return printer;
  }

  /**
   * Envia ZPL para Edge-Go via WebSocket
   */
  private async sendToEdgeGo(
    deviceFingerprint: string,
    zpl: string,
    copies: number,
    labelIds?: string[],
    userId?: string,
    clientId?: string,
  ): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`🚀 [v1.5] Sending to Edge-Go: ${deviceFingerprint}`);
    this.logger.log(`   Job ID: ${jobId}`);
    this.logger.log(`   ZPL size: ${zpl.length} bytes`);
    this.logger.log(`   Copies: ${copies}`);
    if (labelIds) {
      this.logger.log(`   Label IDs: ${labelIds.join(', ')}`);
    }

    // ⭐ VERIFICAR SE USA WS-SERVICE EXTERNO
    const useExternalWs = this.wsServiceClient.isExternalWsService();
    
    if (useExternalWs) {
      this.logger.log(`📡 [v1.5] Usando ws-service externo para enviar job`);
      
      // ⭐ CRIAR JOB NO BANCO PARA RASTREAR labelIds (antes de enviar)
      if (labelIds && labelIds.length > 0) {
        try {
          await this.printJobsService.createJob(
            {
              jobId,
              deviceFingerprint,
              printerId: deviceFingerprint,
              zpl,
              copies,
              priority: 'normal',
              printMethod: PrintMethod.WEBSOCKET,
              metadata: {
                labelIds,
                source: 'v1.5',
              },
            },
            userId,
            clientId,
          );
          this.logger.log(`✅ Job registrado no banco com ${labelIds.length} labelIds`);
        } catch (error) {
          this.logger.error(`❌ Erro ao criar job no banco: ${error.message}`);
        }
      }
      
      // Enviar via ws-service externo
      // ⭐ copies: 1 porque o ZPL já contém todas as cópias (^PQ ou concatenado)
      try {
        const response = await this.wsServiceClient.sendJob({
          deviceId: deviceFingerprint,
          jobId,
          zpl,
          copies: 1, // ZPL já tem o comando ^PQ ou múltiplos labels concatenados
        });
        
        if (response.success) {
          this.logger.log(`✅ [v1.5] Job enviado via ws-service externo: ${jobId}`);
          return jobId;
        } else {
          throw new BadRequestException(response.message || 'Falha ao enviar job');
        }
      } catch (error: any) {
        this.logger.error(`❌ [v1.5] Erro ao enviar via ws-service: ${error.message}`);
        throw new BadRequestException(
          `Falha ao enviar job para Edge-Go ${deviceFingerprint}: ${error.message}`,
        );
      }
    }

    // ========== FALLBACK: Gateway local ==========
    
    // 🔍 VERIFICAR SE O DISPOSITIVO ESTÁ CONECTADO ANTES DE ENVIAR
    const isConnected = this.edgeGoGateway.isDeviceConnected(deviceFingerprint);
    if (!isConnected) {
      this.logger.error(`❌ [v1.5] Edge-Go ${deviceFingerprint} não está conectado no WebSocket`);
      this.logger.error(`   Verifique se o dispositivo está ligado e conectado à internet`);
      throw new BadRequestException(
        `Edge-Go ${deviceFingerprint} não está conectado`,
      );
    }

    // ⭐ CRIAR JOB NO BANCO PARA RASTREAR labelIds
    if (labelIds && labelIds.length > 0) {
      try {
        await this.printJobsService.createJob(
          {
            jobId,
            deviceFingerprint,
            printerId: deviceFingerprint,
            zpl,
            copies,
            priority: 'normal',
            printMethod: PrintMethod.WEBSOCKET,
            metadata: {
              labelIds, // ⭐ Salvar labelIds para marcar como printed no print_ack
              source: 'v1.5',
            },
          },
          userId,
          clientId,
        );
        this.logger.log(`✅ Job registrado no banco com ${labelIds.length} labelIds`);
      } catch (error) {
        this.logger.error(`❌ Erro ao criar job no banco: ${error.message}`);
        // Continuar mesmo se falhar (não bloquear impressão)
      }
    }

    // Montar payload para o Edge-Go
    const printJob = {
      jobId,
      printerId: 'auto-usb-lp0', // Edge-Go detecta automaticamente
      zpl,
      priority: 'normal',
      copies: 1, // ZPL já tem o comando ^PQ ou múltiplos labels concatenados
      labelIds,
    };

    // Enviar via WebSocket (EdgeGoWebSocketGateway)
    const sent = await this.edgeGoGateway.sendPrintJob(
      deviceFingerprint,
      printJob as any,
    );

    if (!sent) {
      // Este erro agora não deveria acontecer, pois já verificamos acima
      this.logger.error(`❌ [v1.5] Falha inesperada ao enviar job para ${deviceFingerprint}`);
      throw new BadRequestException(
        `Falha ao enviar job para Edge-Go ${deviceFingerprint}`,
      );
    }

    this.logger.log(`✅ [v1.5] Job sent successfully: ${jobId}`);

    return jobId;
  }
}

