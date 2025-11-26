import {
  IsString,
  IsArray,
  IsOptional,
  IsObject,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LabelDataDto {
  @ApiProperty({ description: 'Nome do produto', example: 'Milho' })
  @IsString()
  produto: string;

  @ApiProperty({ description: 'Número do lote', example: 'L123456' })
  @IsString()
  lote: string;

  @ApiProperty({ description: 'Data de validade', example: '2025-12-31' })
  @IsString()
  validade: string;

  @ApiProperty({
    description: 'Data de fabricação',
    example: '2025-01-15',
    required: false,
  })
  @IsString()
  @IsOptional()
  fabricacao?: string;

  @ApiProperty({
    description: 'Peso/quantidade',
    example: '50kg',
    required: false,
  })
  @IsString()
  @IsOptional()
  peso?: string;

  @ApiProperty({ description: 'Código de barras', required: false })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({
    description: 'Dados adicionais personalizados',
    required: false,
  })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;
}

export class CreatePrintJobDto {
  @ApiProperty({
    description: 'ID da impressora de destino',
    example: 'printer-001',
  })
  @IsString()
  printerId: string;

  @ApiProperty({
    description: 'Array de etiquetas para imprimir',
    type: [LabelDataDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabelDataDto)
  labels: LabelDataDto[];

  @ApiProperty({
    description: 'ID do template a ser usado (opcional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiProperty({
    description: 'Configurações adicionais de impressão',
    required: false,
  })
  @IsObject()
  @IsOptional()
  printConfig?: {
    copies?: number;
    darkness?: number;
    speed?: number;
    orientation?: 'portrait' | 'landscape';
  };
}

export class PrintJobResponseDto {
  @ApiProperty({ description: 'ID único do job de impressão' })
  jobId: string;

  @ApiProperty({ description: 'ID da impressora' })
  printerId: string;

  @ApiProperty({ description: 'Quantidade de etiquetas no lote' })
  labelCount: number;

  @ApiProperty({ description: 'Método de envio (WebSocket ou MQTT)', required: false })
  transport?: 'websocket' | 'mqtt';

  @ApiProperty({ description: 'Timestamp de criação' })
  timestamp: string;

  @ApiProperty({ description: 'Status do envio' })
  status: 'sent' | 'queued' | 'processing' | 'error';

  @ApiProperty({ description: 'Mensagem adicional', required: false })
  message?: string;
}
