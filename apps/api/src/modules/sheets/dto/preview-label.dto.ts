import { IsString, IsOptional, IsObject, IsArray, IsNumber, Min } from 'class-validator';

export class PreviewLabelSkuDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  weightUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;
}

export class PreviewLabelSchemaFieldDto {
  @IsString()
  key: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class PreviewLabelDto {
  @IsString()
  name: string;

  @IsObject()
  data: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  skus?: PreviewLabelSkuDto[];

  @IsOptional()
  @IsArray()
  schemaFields?: PreviewLabelSchemaFieldDto[];

  @IsString()
  templateId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  skuIndex?: number;
}
