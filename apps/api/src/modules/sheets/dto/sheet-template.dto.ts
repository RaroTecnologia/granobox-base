import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, IsIn } from 'class-validator';

export class AddSheetTemplateDto {
  @IsString()
  studioTemplateId: string;

  @IsString()
  @IsOptional()
  studioTemplateName?: string;

  @IsString()
  @IsOptional()
  studioTemplatePreview?: string;

  @IsString()
  @IsIn(['rotulo', 'contra_rotulo', 'gargalo', 'tampa', 'caixa', 'sleeve', 'tag', 'outro'])
  type: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsObject()
  @IsOptional()
  fieldMappings?: Record<string, string>;

  @IsObject()
  @IsOptional()
  customData?: Record<string, unknown>;
}

export class UpdateSheetTemplateDto {
  @IsString()
  @IsOptional()
  studioTemplateName?: string;

  @IsString()
  @IsOptional()
  studioTemplatePreview?: string;

  @IsString()
  @IsIn(['rotulo', 'contra_rotulo', 'gargalo', 'tampa', 'caixa', 'sleeve', 'tag', 'outro'])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsObject()
  @IsOptional()
  fieldMappings?: Record<string, string>;

  @IsObject()
  @IsOptional()
  customData?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class ReorderSheetTemplatesDto {
  @IsString({ each: true })
  templateIds: string[];
}

export class UpdateFieldMappingsDto {
  @IsObject()
  mappings: Record<string, string>;
}
