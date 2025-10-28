import { IsOptional, IsInt, Min, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum LabelSortBy {
  CREATED_AT = 'createdAt',
  VALIDITY_DATE = 'validityDate',
  PRODUCTION_DATE = 'productionDate',
  PRODUCT_NAME = 'productName',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryLabelsDto {
  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Tipo de etiqueta', example: 'validity' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Status da etiqueta', example: 'pending' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Tipo de conservação', example: 'refrigerado' })
  @IsOptional()
  @IsString()
  conservationType?: string;

  @ApiPropertyOptional({ description: 'Buscar por nome do produto ou código' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Data de validade inicial (ISO)', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  validityDateFrom?: string;

  @ApiPropertyOptional({ description: 'Data de validade final (ISO)', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  validityDateTo?: string;

  @ApiPropertyOptional({ description: 'Número da página', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página', minimum: 1, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Campo para ordenação', enum: LabelSortBy, default: LabelSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(LabelSortBy)
  sortBy?: LabelSortBy = LabelSortBy.CREATED_AT;

  @ApiPropertyOptional({ description: 'Ordem de classificação', enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

export interface PaginatedLabelsResponse {
  data: any[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

