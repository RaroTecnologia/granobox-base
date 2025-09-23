import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, IsArray, IsObject } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  weightUnit?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsNumber()
  shelfLifeAmbient?: number;

  @IsOptional()
  @IsNumber()
  shelfLifeRefrigerated?: number;

  @IsOptional()
  @IsNumber()
  shelfLifeFrozen?: number;

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsOptional()
  @IsString()
  allergens?: string;

  @IsOptional()
  @IsString()
  nutritionalInfo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}


