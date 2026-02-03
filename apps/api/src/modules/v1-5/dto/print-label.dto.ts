import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsObject,
  Min,
  Max,
  ValidateNested,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LabelTypeEnum {
  VALIDITY = 'validity',
  LABEL = 'label',
}

export enum ConservationTypeEnum {
  AMBIENT = 'ambiente',
  REFRIGERATED = 'refrigerado',
  FROZEN = 'congelado',
  ORIGINAL_VALIDITY = 'validade_original',
}

export class PrintLabelMetadataDto {
  @ApiPropertyOptional({ description: 'ID do produto' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'ID da operação' })
  @IsOptional()
  @IsUUID()
  operationId?: string;

  @ApiPropertyOptional({ description: 'ID do local de armazenamento' })
  @IsOptional()
  @IsUUID()
  storageLocationId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de conservação',
    enum: ConservationTypeEnum,
  })
  @IsOptional()
  @IsEnum(ConservationTypeEnum)
  conservationType?: ConservationTypeEnum;

  @ApiPropertyOptional({ description: 'Data de produção/manipulação (ISO)' })
  @IsOptional()
  @IsDateString()
  productionDate?: string;

  @ApiPropertyOptional({ description: 'Data de validade (ISO)' })
  @IsOptional()
  @IsDateString()
  validityDate?: string;

  @ApiPropertyOptional({ description: 'Lote de fabricação (para recebimento)' })
  @IsOptional()
  @IsString()
  manufacturingBatch?: string;

  @ApiPropertyOptional({ description: 'Data de validade original (para recebimento)' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class PrintLabelOffsetsDto {
  @ApiProperty({ description: 'Offset horizontal (em pontos)', default: 0 })
  @IsInt()
  x: number;

  @ApiProperty({ description: 'Offset vertical (em pontos)', default: 0 })
  @IsInt()
  y: number;
}

export class PrintLabelDto {
  @ApiProperty({
    description: 'ID da impressora (Edge-Go fingerprint ou printer UUID)',
    example: 'edge-go-d7e2b4',
  })
  @IsString()
  printerId: string;

  @ApiProperty({
    description: 'Tipo de etiqueta',
    enum: LabelTypeEnum,
    example: LabelTypeEnum.VALIDITY,
  })
  @IsEnum(LabelTypeEnum)
  labelType: LabelTypeEnum;

  @ApiProperty({
    description: 'ID do template do Tagment',
    example: '1c12926f-849b-4bd7-8a61-05036f39f443',
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: 'Número de cópias',
    minimum: 1,
    maximum: 100,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  copies: number;

  @ApiProperty({
    description: 'Dados para preencher o template (variáveis do template)',
    example: {
      produto: 'Manteiga',
      marca: 'Laticínios',
      dataManipulacao: '30/11/2025',
      dataValidade: '30/12/2025',
      qtdPeso: '500G',
      responsavel: 'Tiago L',
      armazenamento: 'Geladeira 1',
    },
  })
  @IsObject()
  labelData: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Metadados para rastreabilidade (obrigatório para labelType=validity)',
    type: PrintLabelMetadataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PrintLabelMetadataDto)
  metadata?: PrintLabelMetadataDto;

  @ApiPropertyOptional({
    description: 'Ajustes de posição da etiqueta',
    type: PrintLabelOffsetsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PrintLabelOffsetsDto)
  offsets?: PrintLabelOffsetsDto;
}

export class PrintLabelResponseLabelDto {
  @ApiProperty({ description: 'ID da etiqueta criada' })
  id: string;

  @ApiProperty({ description: 'Código único da etiqueta' })
  code: string;
}

export class PrintLabelResponseDetailsDto {
  @ApiProperty({ description: 'Nome da impressora' })
  printer: string;

  @ApiProperty({ description: 'Número de cópias' })
  copies: number;

  @ApiProperty({ description: 'Tamanho do ZPL em bytes' })
  zplBytes: number;

  @ApiProperty({ description: 'Timestamp da impressão' })
  timestamp: string;
}

export class PrintLabelResponseDto {
  @ApiProperty({ description: 'Indica se a operação foi bem-sucedida' })
  success: boolean;

  @ApiProperty({ description: 'ID do job de impressão' })
  jobId: string;

  @ApiProperty({ description: 'Mensagem de status' })
  message: string;

  @ApiPropertyOptional({
    description: 'Etiquetas criadas (apenas para labelType=validity)',
    type: [PrintLabelResponseLabelDto],
  })
  labels?: PrintLabelResponseLabelDto[];

  @ApiProperty({
    description: 'Detalhes da impressão',
    type: PrintLabelResponseDetailsDto,
  })
  details: PrintLabelResponseDetailsDto;
}


