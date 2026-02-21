import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { FieldType } from '../entities/schema.entity';

export class FieldValidationDto {
  @IsOptional()
  min?: number;

  @IsOptional()
  max?: number;

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

export class SchemaFieldDto {
  @IsString()
  key: string;

  @IsString()
  label: string;

  @IsIn(['text', 'textarea', 'richtext', 'number', 'date', 'select', 'multiselect', 'boolean', 'image', 'nutrient'])
  type: FieldType;

  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  vdReference?: number;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  defaultValue?: unknown;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FieldValidationDto)
  validation?: FieldValidationDto;
}

export class CreateSchemaDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchemaFieldDto)
  fields: SchemaFieldDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchemaFieldDto)
  skuFields?: SchemaFieldDto[];
}
