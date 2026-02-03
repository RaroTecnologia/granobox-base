import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateAssociation } from '../entities/template-association.entity';
import { CreateTemplateAssociationDto } from '../dto/create-template-association.dto';
import { UpdateTemplateAssociationDto } from '../dto/update-template-association.dto';
import { Product } from '../../products/entities/product.entity';
import { Category } from '../../products/entities/category.entity';
import { Client } from '../../clients/entities/client.entity';
import { TemplatesService } from '../../templates/templates.service';
import { TemplatesEngineProxyService } from '../../templates/templates-engine-proxy.service';

/**
 * Serviço de processamento de templates
 * 
 * Responsável por:
 * - Gerenciar associações de templates padrão por cliente/tipo
 * - Processar templates via templates-engine (local) ou Tagment (fallback)
 * - Resolver hierarquia de templates (produto > categoria > cliente)
 */
@Injectable()
export class TemplateProcessingService {
  private readonly logger = new Logger(TemplateProcessingService.name);
  
  // Fallback para templates legados no Tagment
  private readonly TAGMENT_API_URL = 'https://api.tagment.com.br/v1';

  constructor(
    @InjectRepository(TemplateAssociation)
    private templateAssociationRepository: Repository<TemplateAssociation>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private readonly templatesService: TemplatesService,
    private readonly templatesEngineProxy: TemplatesEngineProxyService,
  ) {}

  // ==================== Template Associations ====================

  async createTemplateAssociation(
    createAssociationDto: CreateTemplateAssociationDto,
  ): Promise<TemplateAssociation> {
    const existingAssociation =
      await this.templateAssociationRepository.findOne({
        where: {
          clientId: createAssociationDto.clientId,
          labelType: createAssociationDto.labelType,
        },
      });

    if (existingAssociation) {
      throw new BadRequestException(
        'Já existe um template associado para este tipo de etiqueta',
      );
    }

    const association =
      this.templateAssociationRepository.create(createAssociationDto);
    return this.templateAssociationRepository.save(association);
  }

  async getTemplateAssociations(
    clientId: string,
  ): Promise<TemplateAssociation[]> {
    return this.templateAssociationRepository.find({
      where: { clientId },
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTemplateAssociation(
    id: string,
    clientId: string,
  ): Promise<TemplateAssociation> {
    const association = await this.templateAssociationRepository.findOne({
      where: { id, clientId },
      relations: ['client'],
    });

    if (!association) {
      throw new NotFoundException('Associação de template não encontrada');
    }

    return association;
  }

  async updateTemplateAssociation(
    id: string,
    clientId: string,
    updateAssociationDto: UpdateTemplateAssociationDto,
  ): Promise<TemplateAssociation> {
    const association = await this.getTemplateAssociation(id, clientId);

    Object.assign(association, updateAssociationDto);
    return this.templateAssociationRepository.save(association);
  }

  async deleteTemplateAssociation(id: string, clientId: string): Promise<void> {
    const association = await this.getTemplateAssociation(id, clientId);
    await this.templateAssociationRepository.remove(association);
  }

  // ==================== Default Templates ====================

  async getDefaultTemplate(
    clientId: string,
    labelType: string,
  ): Promise<TemplateAssociation | null> {
    // Mapeamento: Flutter usa 'validity', backend usa 'etiqueta_validade'
    const mappedLabelType = labelType === 'validity' ? 'etiqueta_validade' : labelType;
    
    this.logger.debug(`Buscando template padrão: clientId=${clientId}, labelType=${mappedLabelType}`);
    
    const association = await this.templateAssociationRepository.findOne({
      where: {
        clientId,
        labelType: mappedLabelType as any,
        isActive: true,
      },
    });

    if (association) {
      this.logger.debug(`Template padrão encontrado: ${association.templateId}`);
    }

    return association;
  }

  async setDefaultTemplate(
    clientId: string,
    labelType: string,
    templateId: string,
  ): Promise<TemplateAssociation> {
    const existingAssociation =
      await this.templateAssociationRepository.findOne({
        where: {
          clientId,
          labelType: labelType as any,
        },
      });

    if (existingAssociation) {
      existingAssociation.templateId = templateId;
      existingAssociation.isActive = true;
      return await this.templateAssociationRepository.save(existingAssociation);
    } else {
      const association = this.templateAssociationRepository.create({
        clientId,
        templateId,
        templateName: `Template Padrão ${labelType}`,
        labelType: labelType as any,
        isActive: true,
      });
      return await this.templateAssociationRepository.save(association);
    }
  }

  // ==================== Template Resolution ====================

  /**
   * Resolve template efetivo de validade seguindo hierarquia:
   * produto > categoria > cliente > fallback
   */
  async resolveValidityTemplateId(
    productId: string,
  ): Promise<{ templateId: string | null; source?: string }> {
    this.logger.debug(`Resolvendo template para produto: ${productId}`);
    
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');

    // 1) Template do Produto
    if (product.customTemplateId) {
      this.logger.debug(`Template do produto: ${product.customTemplateId}`);
      return { templateId: product.customTemplateId, source: 'product' };
    }

    // 2) Template da Categoria
    if (product.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: { id: product.categoryId },
      });
      
      if (category && (category as any).defaultTemplateId) {
        this.logger.debug(`Template da categoria: ${(category as any).defaultTemplateId}`);
        return { templateId: (category as any).defaultTemplateId, source: 'category' };
      }
    }

    // 3) Template do Cliente (associação ativa)
    const assoc = await this.templateAssociationRepository.findOne({
      where: {
        clientId: product.clientId,
        labelType: 'etiqueta_validade' as any,
        isActive: true,
      },
      order: { updatedAt: 'DESC' },
    });
    
    if (assoc?.templateId) {
      this.logger.debug(`Template do cliente: ${assoc.templateId}`);
      return { templateId: assoc.templateId, source: 'client' };
    }

    // 4) Fallback: null (frontend usa template padrão Granobox)
    this.logger.debug(`Nenhum template encontrado, usando fallback`);
    return { templateId: null, source: null };
  }

  // ==================== Template Processing ====================

  /**
   * Processa template e retorna ZPL formatado
   * 
   * Busca template do banco local (studio_templates) e processa via templates-engine.
   * Fallback para Tagment externo se não encontrar localmente.
   */
  async processTemplate(
    templateId: string,
    variables: Record<string, any>,
    clientId: string,
  ): Promise<string> {
    this.logger.log(`Processando template: ${templateId}`);

    try {
      // 1. Tentar buscar template do banco local
      let localTemplate: any = null;
      try {
        localTemplate = await this.templatesService.findOne(templateId, clientId, true);
        this.logger.log(`Template local encontrado: ${localTemplate.name} (${localTemplate.templateType})`);
      } catch (err) {
        this.logger.log(`Template não encontrado localmente, tentando fallback...`);
      }

      // 2. Se encontrou localmente, processar via templates-engine
      if (localTemplate) {
        return await this.processLocalTemplate(localTemplate, variables);
      }

      // 3. Fallback: Tagment externo (compatibilidade com templates legados)
      return await this.processViaTagmentFallback(templateId, variables, clientId);

    } catch (error) {
      this.logger.error(`Erro ao processar template: ${error.message}`);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Erro ao processar template: ${error.message}`);
    }
  }

  /**
   * Processa múltiplos templates em paralelo
   */
  async processTemplates(
    templateId: string,
    variablesArray: Record<string, any>[],
    clientId: string,
  ): Promise<string[]> {
    this.logger.log(`Processando ${variablesArray.length} templates em paralelo`);

    const promises = variablesArray.map(variables =>
      this.processTemplate(templateId, variables, clientId),
    );

    return Promise.all(promises);
  }

  // ==================== Private Methods ====================

  private async processLocalTemplate(
    template: any,
    variables: Record<string, any>,
  ): Promise<string> {
    const templateType = template.templateType || 'elements';
    
    if (templateType === 'elements') {
      this.logger.log(`Processando via templates-engine (elements)...`);
      
      if (!template.elements || !template.size) {
        throw new BadRequestException(
          `Template ${template.id} tipo elements não possui elements ou size`,
        );
      }

      const result = await this.templatesEngineProxy.postElementsProcess({
        template: {
          size: template.size,
          elements: template.elements,
        },
        data: variables,
      });

      this.logger.log(`ZPL gerado (${result.zpl.length} bytes)`);
      return result.zpl;
    }

    if (templateType === 'studio') {
      this.logger.log(`Processando via templates-engine (studio)...`);
      
      let imageBase64 = template.studioPngData;
      
      if (!imageBase64 && template.previewImageR2Key) {
        this.logger.warn(`Template studio sem studioPngData local`);
      }

      if (!imageBase64) {
        throw new BadRequestException(
          `Template ${template.id} tipo studio não possui imagem PNG`,
        );
      }

      const result = await this.templatesEngineProxy.postStudioRender({
        templateId: template.id,
        data: variables,
        imageBase64,
        labelLayout: {
          widthMm: template.size?.w || 50,
          heightMm: template.size?.h || 30,
          dynamicFields: template.dynamicFields || [],
        },
      });

      this.logger.log(`ZPL gerado via studio (${result.zpl.length} bytes)`);
      return result.zpl;
    }

    throw new BadRequestException(`Tipo de template desconhecido: ${templateType}`);
  }

  /**
   * Fallback: Processa via Tagment externo (compatibilidade com templates legados)
   */
  private async processViaTagmentFallback(
    templateId: string,
    variables: Record<string, any>,
    clientId: string,
  ): Promise<string> {
    this.logger.log(`Usando fallback Tagment para template legado...`);

    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    if (!client.tagmentApiKey) {
      throw new BadRequestException(
        'Template não encontrado localmente e cliente não possui API Key para fallback',
      );
    }

    const url = `${this.TAGMENT_API_URL}/templates/process`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.tagmentApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template: templateId,
        data: variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Erro no fallback Tagment: ${errorText}`);
      
      if (response.status === 404) {
        throw new NotFoundException(`Template ${templateId} não encontrado`);
      } else if (response.status === 401) {
        throw new BadRequestException('API Key inválida');
      } else {
        throw new BadRequestException(`Erro ao processar template: ${response.statusText}`);
      }
    }

    const result = await response.json();
    const zpl = (result as { zpl?: string; zplCode?: string }).zpl ?? 
                (result as { zpl?: string; zplCode?: string }).zplCode;

    if (!zpl) {
      throw new BadRequestException('Resposta do fallback não contém ZPL');
    }

    this.logger.log(`ZPL gerado via fallback (${zpl.length} bytes)`);
    return zpl;
  }
}
