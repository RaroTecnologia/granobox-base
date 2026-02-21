import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SheetSchema, SchemaField } from '../entities/schema.entity';
import { CreateSchemaDto } from '../dto/create-schema.dto';
import { UpdateSchemaDto } from '../dto/update-schema.dto';

@Injectable()
export class SchemasService {
  constructor(
    @InjectRepository(SheetSchema)
    private schemasRepository: Repository<SheetSchema>,
  ) {}

  async findAll(clientId: string): Promise<SheetSchema[]> {
    return this.schemasRepository.find({
      where: { clientId, active: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, clientId: string): Promise<SheetSchema> {
    const schema = await this.schemasRepository.findOne({
      where: { id, clientId },
    });

    if (!schema) {
      throw new NotFoundException(`Schema com ID ${id} não encontrado`);
    }

    return schema;
  }

  async create(clientId: string, dto: CreateSchemaDto): Promise<SheetSchema> {
    const schema = this.schemasRepository.create({
      name: dto.name,
      description: dto.description,
      fields: dto.fields as SchemaField[],
      clientId,
    });

    return this.schemasRepository.save(schema);
  }

  async update(id: string, clientId: string, dto: UpdateSchemaDto): Promise<SheetSchema> {
    const schema = await this.findOne(id, clientId);

    Object.assign(schema, dto);

    return this.schemasRepository.save(schema);
  }

  async remove(id: string, clientId: string): Promise<void> {
    const schema = await this.findOne(id, clientId);
    
    // Soft delete - apenas desativa
    schema.active = false;
    await this.schemasRepository.save(schema);
  }

  // Templates base pré-definidos
  getBaseTemplates() {
    return [
      {
        id: 'ficha-alimento',
        name: 'Ficha de Alimento',
        description: 'Template padrão para produtos alimentícios',
        fields: [
          { key: 'productName', label: 'Nome do Produto', type: 'text', required: true },
          { key: 'sku', label: 'SKU', type: 'text', required: true },
          { key: 'description', label: 'Descrição', type: 'textarea', required: false },
          { key: 'ingredients', label: 'Ingredientes', type: 'textarea', required: true, section: 'Composição' },
          { key: 'allergens', label: 'Alergênicos', type: 'multiselect', required: true, options: ['Glúten', 'Leite', 'Ovo', 'Soja', 'Amendoim', 'Castanhas', 'Crustáceos', 'Peixes'], section: 'Composição' },
          { key: 'netWeight', label: 'Peso Líquido (g)', type: 'number', required: true, section: 'Especificações' },
          { key: 'expirationDays', label: 'Validade (dias)', type: 'number', required: true, section: 'Especificações' },
          { key: 'storageInstructions', label: 'Instruções de Armazenamento', type: 'textarea', required: true, section: 'Armazenamento' },
          { key: 'nutritionalInfo', label: 'Informações Nutricionais', type: 'richtext', required: false, section: 'Nutricional' },
          { key: 'organic', label: 'Produto Orgânico', type: 'boolean', required: false },
        ],
      },
      {
        id: 'ficha-cosmetico',
        name: 'Ficha de Cosmético',
        description: 'Template para produtos cosméticos',
        fields: [
          { key: 'productName', label: 'Nome do Produto', type: 'text', required: true },
          { key: 'sku', label: 'SKU', type: 'text', required: true },
          { key: 'category', label: 'Categoria', type: 'select', required: true, options: ['Skincare', 'Haircare', 'Maquiagem', 'Perfumaria', 'Corporal'] },
          { key: 'description', label: 'Descrição', type: 'textarea', required: false },
          { key: 'ingredients', label: 'Ingredientes (INCI)', type: 'textarea', required: true },
          { key: 'netContent', label: 'Conteúdo Líquido', type: 'text', required: true },
          { key: 'usageInstructions', label: 'Modo de Uso', type: 'textarea', required: true },
          { key: 'warnings', label: 'Advertências', type: 'textarea', required: true },
          { key: 'expirationMonths', label: 'Validade (meses)', type: 'number', required: true },
          { key: 'anvisaRegistry', label: 'Registro ANVISA', type: 'text', required: false },
        ],
      },
      {
        id: 'tabela-nutricional',
        name: 'Tabela Nutricional',
        description: 'Campos padrão ANVISA. Cada nutriente tem 3 valores: Por 100g, Por porção e % VD. Nos SKUs, informe apenas "Porções por embalagem".',
        fields: [
          { key: 'porcao_g', label: 'Porção (g)', type: 'number', required: true, section: 'Informação Nutricional' },
          { key: 'medida_caseira', label: 'Medida caseira', type: 'text', required: false, section: 'Informação Nutricional', placeholder: 'Ex: 1 fatia' },
          { key: 'valor_energetico_kcal', label: 'Valor energético', type: 'nutrient', required: true, section: 'Informação Nutricional', unit: 'kcal', vdReference: 2000 },
          { key: 'carboidratos_g', label: 'Carboidratos', type: 'nutrient', required: true, section: 'Informação Nutricional', unit: 'g', vdReference: 300 },
          { key: 'acucares_totais_g', label: 'Açúcares totais', type: 'nutrient', required: false, section: 'Informação Nutricional', unit: 'g', vdReference: 50 },
          { key: 'acucares_adicionados_g', label: 'Açúcares adicionados', type: 'nutrient', required: false, section: 'Informação Nutricional', unit: 'g', vdReference: 50 },
          { key: 'proteinas_g', label: 'Proteínas', type: 'nutrient', required: true, section: 'Informação Nutricional', unit: 'g', vdReference: 75 },
          { key: 'gorduras_totais_g', label: 'Gorduras totais', type: 'nutrient', required: true, section: 'Informação Nutricional', unit: 'g', vdReference: 55 },
          { key: 'gorduras_saturadas_g', label: 'Gorduras saturadas', type: 'nutrient', required: false, section: 'Informação Nutricional', unit: 'g', vdReference: 22 },
          { key: 'gorduras_trans_g', label: 'Gorduras trans', type: 'nutrient', required: false, section: 'Informação Nutricional', unit: 'g', vdReference: 0 },
          { key: 'fibras_alimentares_g', label: 'Fibras alimentares', type: 'nutrient', required: false, section: 'Informação Nutricional', unit: 'g', vdReference: 25 },
          { key: 'sodio_mg', label: 'Sódio', type: 'nutrient', required: true, section: 'Informação Nutricional', unit: 'mg', vdReference: 2000 },
        ],
      },
    ];
  }
}
