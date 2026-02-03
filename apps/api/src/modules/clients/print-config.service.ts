import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ConfigService } from '../config/services/config.service';
import { TemplateProcessingService } from '../template-processing/services/template-processing.service';
import { UpdatePrintConfigDto } from './dto/update-print-config.dto';
import { LabelType } from '../template-processing/entities/template-association.entity';

export interface PrintConfigResponse {
  templateProvider: 'tagment' | 'granobox';
  tagmentApiKey?: string;
  tagmentCustomerId?: string;
  tagmentLogoUuid?: string;
  defaultPrinterValidadeId?: string;
  defaultPrinterRotuloId?: string;
  defaultValidityTemplateId?: string;
  defaultRotuloTemplateId?: string;
  defaultShippingLabelDeviceId?: string;
  defaultDanfeLabelDeviceId?: string;
}

@Injectable()
export class PrintConfigService {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly configService: ConfigService,
    private readonly templateProcessingService: TemplateProcessingService,
  ) {}

  async getPrintConfig(clientId: string): Promise<PrintConfigResponse> {
    const client = await this.clientsService.findOne(clientId);
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const config = await this.configService.getDateConfig(clientId);
    const provider = (client.templateProvider ?? 'tagment') as
      | 'tagment'
      | 'granobox';

    const response: PrintConfigResponse = {
      templateProvider: provider,
      defaultPrinterValidadeId: config.tagmentPrinterValidadeId ?? undefined,
      defaultPrinterRotuloId: config.tagmentPrinterRotuloId ?? undefined,
      defaultShippingLabelDeviceId: config.defaultShippingLabelDeviceId ?? undefined,
      defaultDanfeLabelDeviceId: config.defaultDanfeLabelDeviceId ?? undefined,
    };

    if (provider === 'tagment') {
      response.tagmentApiKey = client.tagmentApiKey
        ? this.maskApiKey(client.tagmentApiKey)
        : undefined;
      response.tagmentCustomerId = client.tagmentCustomerId ?? undefined;
      response.tagmentLogoUuid = client.tagmentLogoUuid ?? undefined;

      const validityAssociation = await this.templateProcessingService.getDefaultTemplate(
        clientId,
        'etiqueta_validade',
      );
      response.defaultValidityTemplateId =
        validityAssociation?.templateId ?? undefined;
      response.defaultRotuloTemplateId = undefined;
    } else {
      response.defaultValidityTemplateId =
        config.defaultValidityTemplateId ?? undefined;
      response.defaultRotuloTemplateId =
        config.defaultRotuloTemplateId ?? undefined;
    }

    return response;
  }

  async updatePrintConfig(
    clientId: string,
    dto: UpdatePrintConfigDto,
  ): Promise<PrintConfigResponse> {
    const client = await this.clientsService.findOne(clientId);
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const clientUpdate: Record<string, unknown> = {};
    if (dto.templateProvider !== undefined) clientUpdate.templateProvider = dto.templateProvider;
    if (dto.tagmentApiKey !== undefined) clientUpdate.tagmentApiKey = dto.tagmentApiKey;
    if (dto.tagmentCustomerId !== undefined) clientUpdate.tagmentCustomerId = dto.tagmentCustomerId;
    if (dto.tagmentLogoUuid !== undefined) clientUpdate.tagmentLogoUuid = dto.tagmentLogoUuid;
    if (Object.keys(clientUpdate).length > 0) {
      await this.clientsService.update(clientId, clientUpdate as any);
    }

    const newProvider = dto.templateProvider ?? client.templateProvider ?? 'tagment';
    const configFields: Parameters<ConfigService['updatePrintConfigFields']>[1] = {};
    if (dto.defaultPrinterValidadeId !== undefined) {
      configFields.tagmentPrinterValidadeId = dto.defaultPrinterValidadeId;
    }
    if (dto.defaultPrinterRotuloId !== undefined) {
      configFields.tagmentPrinterRotuloId = dto.defaultPrinterRotuloId;
    }
    if (dto.defaultShippingLabelDeviceId !== undefined) {
      configFields.defaultShippingLabelDeviceId = dto.defaultShippingLabelDeviceId;
    }
    if (dto.defaultDanfeLabelDeviceId !== undefined) {
      configFields.defaultDanfeLabelDeviceId = dto.defaultDanfeLabelDeviceId;
    }
    if (newProvider === 'granobox') {
      if (dto.defaultValidityTemplateId !== undefined) {
        configFields.defaultValidityTemplateId = dto.defaultValidityTemplateId;
      }
      if (dto.defaultRotuloTemplateId !== undefined) {
        configFields.defaultRotuloTemplateId = dto.defaultRotuloTemplateId;
      }
    }
    if (Object.keys(configFields).length > 0) {
      await this.configService.updatePrintConfigFields(clientId, configFields);
    }

    if (dto.templateProvider === 'tagment') {
      if (dto.defaultValidityTemplateId) {
        await this.templateProcessingService.setDefaultTemplate(
          clientId,
          LabelType.ETIQUETA_VALIDADE,
          dto.defaultValidityTemplateId,
        );
      }
    }

    return this.getPrintConfig(clientId);
  }

  private maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 10) return '***';
    return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
  }
}
