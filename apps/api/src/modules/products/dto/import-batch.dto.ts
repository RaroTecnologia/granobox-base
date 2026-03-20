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

export class ImportBatchItemDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

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

  @ApiPropertyOptional({ description: 'ID de categoria existente' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Nome da nova categoria a criar' })
  @IsOptional()
  @IsString()
  newCategoryName?: string;

  @ApiPropertyOptional({ description: 'Nome da nova subcategoria a criar' })
  @IsOptional()
  @IsString()
  newSubcategoryName?: string;

  @ApiPropertyOptional({
    description: 'ID da categoria pai da subcategoria',
  })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;
}

export class ImportBatchDto {
  @ApiProperty({ type: [ImportBatchItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportBatchItemDto)
  items: ImportBatchItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  operationId?: string;
}
