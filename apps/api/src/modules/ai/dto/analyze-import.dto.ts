import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ImportProductRowDto {
  @ApiProperty({ description: 'Nome do produto' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  shelfLifeAmbient?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  shelfLifeRefrigerated?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  shelfLifeFrozen?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ingredients?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allergens?: string;
}

export class ExistingCategoryDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class AnalyzeImportDto {
  @ApiProperty({ type: [ImportProductRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportProductRowDto)
  products: ImportProductRowDto[];

  @ApiPropertyOptional({ type: [ExistingCategoryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExistingCategoryDto)
  existingCategories?: ExistingCategoryDto[];
}
