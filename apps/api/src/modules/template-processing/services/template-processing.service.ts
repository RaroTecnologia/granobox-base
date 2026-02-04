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
import { Config } from '../../config/entities/config.entity';
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

  constructor(
    @InjectRepository(TemplateAssociation)
    private templateAssociationRepository: Repository<TemplateAssociation>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Config)
    private configRepository: Repository<Config>,
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

  /**
   * Busca template padrão do cliente na tabela config (Granobox Studio)
   * ⭐ Apenas templates do Granobox são suportados
   */
  async getDefaultTemplate(
    clientId: string,
    labelType: string,
  ): Promise<{ templateId: string } | null> {
    // Mapeamento: Flutter usa 'validity', backend usa 'etiqueta_validade'
    const mappedLabelType = labelType === 'validity' ? 'etiqueta_validade' : labelType;
    
    this.logger.debug(`Buscando template padrão Granobox: clientId=${clientId}, labelType=${mappedLabelType}`);
    
    const config = await this.configRepository.findOne({
      where: { clientId },
    });
    
    if (!config) {
      this.logger.debug(`Config não encontrada para cliente ${clientId}`);
      return null;
    }
    
    let templateId: string | null = null;
    
    if (mappedLabelType === 'etiqueta_validade' && config.defaultValidityTemplateId) {
      templateId = config.defaultValidityTemplateId;
    } else if (mappedLabelType === 'etiqueta_rotulo' && config.defaultRotuloTemplateId) {
      templateId = config.defaultRotuloTemplateId;
    }
    
    if (templateId) {
      this.logger.debug(`Template padrão encontrado: ${templateId}`);
      return { templateId };
    }
    
    this.logger.debug(`Nenhum template padrão configurado para ${mappedLabelType}`);
    return null;
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
   * ⭐ Apenas templates do Granobox são suportados (Tagment removido).
   */
  async processTemplate(
    templateId: string,
    variables: Record<string, any>,
    clientId: string,
  ): Promise<string> {
    this.logger.log(`Processando template Granobox: ${templateId}`);

    try {
      // Buscar template do banco local (Granobox Studio)
      const template = await this.templatesService.findOne(templateId, clientId, true);
      this.logger.log(`Template encontrado: ${template.name} (${template.templateType})`);
      
      // Processar via templates-engine
      return await this.processLocalTemplate(template, variables);

    } catch (error) {
      this.logger.error(`Erro ao processar template: ${error.message}`);
      
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          `Template ${templateId} não encontrado. Certifique-se de que o template existe no Granobox Studio.`,
        );
      }
      
      if (error instanceof BadRequestException) {
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
}
