import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagmentConfig } from '../entities/tagment-config.entity';
import { TemplateAssociation } from '../entities/template-association.entity';
import { CreateTagmentConfigDto } from '../dto/create-tagment-config.dto';
import { UpdateTagmentConfigDto } from '../dto/update-tagment-config.dto';
import { CreateTemplateAssociationDto } from '../dto/create-template-association.dto';
import { UpdateTemplateAssociationDto } from '../dto/update-template-association.dto';

@Injectable()
export class TagmentService {
  constructor(
    @InjectRepository(TagmentConfig)
    private tagmentConfigRepository: Repository<TagmentConfig>,
    @InjectRepository(TemplateAssociation)
    private templateAssociationRepository: Repository<TemplateAssociation>,
  ) {}

  // Configuração Tagment
  async createConfig(createConfigDto: CreateTagmentConfigDto): Promise<TagmentConfig> {
    // Verificar se já existe configuração para este cliente
    const existingConfig = await this.tagmentConfigRepository.findOne({
      where: { clientId: createConfigDto.clientId }
    });

    if (existingConfig) {
      throw new BadRequestException('Cliente já possui configuração Tagment');
    }

    const config = this.tagmentConfigRepository.create(createConfigDto);
    return this.tagmentConfigRepository.save(config);
  }

  async getConfigByClient(clientId: string): Promise<TagmentConfig | null> {
    return this.tagmentConfigRepository.findOne({
      where: { clientId },
      relations: ['client']
    });
  }

  async updateConfig(clientId: string, updateConfigDto: UpdateTagmentConfigDto): Promise<TagmentConfig> {
    const config = await this.getConfigByClient(clientId);
    
    if (!config) {
      throw new NotFoundException('Configuração Tagment não encontrada');
    }

    Object.assign(config, updateConfigDto);
    return this.tagmentConfigRepository.save(config);
  }

  async deleteConfig(clientId: string): Promise<void> {
    const config = await this.getConfigByClient(clientId);
    
    if (!config) {
      throw new NotFoundException('Configuração Tagment não encontrada');
    }

    await this.tagmentConfigRepository.remove(config);
  }

  // Template Associations
  async createTemplateAssociation(createAssociationDto: CreateTemplateAssociationDto): Promise<TemplateAssociation> {
    // Verificar se já existe associação para este tipo de etiqueta
    const existingAssociation = await this.templateAssociationRepository.findOne({
      where: { 
        clientId: createAssociationDto.clientId,
        labelType: createAssociationDto.labelType
      }
    });

    if (existingAssociation) {
      throw new BadRequestException('Já existe um template associado para este tipo de etiqueta');
    }

    const association = this.templateAssociationRepository.create(createAssociationDto);
    return this.templateAssociationRepository.save(association);
  }

  async getTemplateAssociations(clientId: string): Promise<TemplateAssociation[]> {
    return this.templateAssociationRepository.find({
      where: { clientId },
      relations: ['client'],
      order: { createdAt: 'DESC' }
    });
  }

  async getTemplateAssociation(id: string, clientId: string): Promise<TemplateAssociation> {
    const association = await this.templateAssociationRepository.findOne({
      where: { id, clientId },
      relations: ['client']
    });

    if (!association) {
      throw new NotFoundException('Associação de template não encontrada');
    }

    return association;
  }

  async updateTemplateAssociation(id: string, clientId: string, updateAssociationDto: UpdateTemplateAssociationDto): Promise<TemplateAssociation> {
    const association = await this.getTemplateAssociation(id, clientId);
    
    Object.assign(association, updateAssociationDto);
    return this.templateAssociationRepository.save(association);
  }

  async deleteTemplateAssociation(id: string, clientId: string): Promise<void> {
    const association = await this.getTemplateAssociation(id, clientId);
    await this.templateAssociationRepository.remove(association);
  }

  // Métodos auxiliares para integração com API Tagment
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      // TODO: Implementar validação real com API Tagment
      // const response = await fetch('https://api.tagment.com.br/v1/auth/info', {
      //   headers: { 'Authorization': `Bearer ${apiKey}` }
      // });
      // return response.ok;
      
      return apiKey.startsWith('tgm_') && apiKey.length > 10;
    } catch (error) {
      return false;
    }
  }

  async syncTemplatesFromTagment(clientId: string): Promise<any[]> {
    const config = await this.getConfigByClient(clientId);
    
    if (!config || !config.apiKey) {
      throw new BadRequestException('API Key Tagment não configurada');
    }

    try {
      // TODO: Implementar sincronização real com API Tagment
      // const response = await fetch('https://api.tagment.com.br/v1/templates', {
      //   headers: { 'Authorization': `Bearer ${config.apiKey}` }
      // });
      // return await response.json();
      
      // Mock para desenvolvimento
      return [
        {
          id: '1c12926f-849b-4bd7-8a61-05036f39f443',
          name: 'Etiqueta de Validade GranoBox',
          description: 'Template padrão para etiquetas de validade',
          type: 'etiqueta_validade'
        }
      ];
    } catch (error) {
      throw new BadRequestException('Erro ao sincronizar templates do Tagment');
    }
  }
}
