import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { EquipmentType, EquipmentStatus, EquipmentCondition } from '../entities/equipment.entity';

export class CreateEquipmentDto {
  @ApiProperty({
    description: 'ID do cliente ao qual o equipamento pertence',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID do cliente inválido' })
  clientId: string;

  @ApiProperty({
    description: 'Nome/descrição do equipamento',
    example: 'Impressora Térmica Zebra',
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Tipo do equipamento',
    enum: EquipmentType,
    example: EquipmentType.PRINTER,
  })
  @IsEnum(EquipmentType, { message: 'Tipo de equipamento inválido' })
  type: EquipmentType;

  @ApiProperty({
    description: 'Marca do equipamento',
    example: 'Zebra',
  })
  @IsNotEmpty({ message: 'Marca é obrigatória' })
  @IsString({ message: 'Marca deve ser uma string' })
  @MaxLength(100, { message: 'Marca deve ter no máximo 100 caracteres' })
  brand: string;

  @ApiProperty({
    description: 'Modelo do equipamento',
    example: 'ZD220',
  })
  @IsNotEmpty({ message: 'Modelo é obrigatório' })
  @IsString({ message: 'Modelo deve ser uma string' })
  @MaxLength(100, { message: 'Modelo deve ter no máximo 100 caracteres' })
  model: string;

  @ApiProperty({
    description: 'Número de série do equipamento',
    example: 'ZBR123456789',
  })
  @IsNotEmpty({ message: 'Número de série é obrigatório' })
  @IsString({ message: 'Número de série deve ser uma string' })
  @MaxLength(100, { message: 'Número de série deve ter no máximo 100 caracteres' })
  serialNumber: string;

  @ApiProperty({
    description: 'Número do patrimônio (opcional)',
    required: false,
    example: 'PAT001234',
  })
  @IsOptional()
  @IsString({ message: 'Número do patrimônio deve ser uma string' })
  @MaxLength(50, { message: 'Número do patrimônio deve ter no máximo 50 caracteres' })
  patrimonyNumber?: string;

  @ApiProperty({
    description: 'Status do equipamento',
    enum: EquipmentStatus,
    default: EquipmentStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EquipmentStatus, { message: 'Status do equipamento inválido' })
  status?: EquipmentStatus;

  @ApiProperty({
    description: 'Condição do equipamento',
    enum: EquipmentCondition,
    default: EquipmentCondition.NEW,
  })
  @IsOptional()
  @IsEnum(EquipmentCondition, { message: 'Condição do equipamento inválida' })
  condition?: EquipmentCondition;

  @ApiProperty({
    description: 'Valor de compra do equipamento',
    required: false,
    example: 1500.00,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Valor de compra deve ser um número' })
  @Min(0, { message: 'Valor de compra deve ser maior ou igual a zero' })
  purchaseValue?: number;

  @ApiProperty({
    description: 'Data de compra do equipamento',
    required: false,
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de compra inválida' })
  purchaseDate?: string;

  @ApiProperty({
    description: 'Data de início do comodato',
    example: '2024-01-20',
  })
  @IsNotEmpty({ message: 'Data de início do comodato é obrigatória' })
  @IsDateString({}, { message: 'Data de início do comodato inválida' })
  loanStartDate: string;

  @ApiProperty({
    description: 'Data prevista para fim do comodato',
    required: false,
    example: '2025-01-20',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de fim do comodato inválida' })
  loanEndDate?: string;

  @ApiProperty({
    description: 'Data de devolução do equipamento',
    required: false,
    example: '2024-12-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de devolução inválida' })
  returnDate?: string;

  @ApiProperty({
    description: 'Localização do equipamento',
    required: false,
    example: 'Loja Principal - Balcão 1',
  })
  @IsOptional()
  @IsString({ message: 'Localização deve ser uma string' })
  @MaxLength(255, { message: 'Localização deve ter no máximo 255 caracteres' })
  location?: string;

  @ApiProperty({
    description: 'Especificações técnicas do equipamento',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Especificações devem ser uma string' })
  specifications?: string;

  @ApiProperty({
    description: 'Acessórios incluídos com o equipamento',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Acessórios devem ser uma string' })
  accessories?: string;

  @ApiProperty({
    description: 'Observações adicionais sobre o equipamento',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser uma string' })
  notes?: string;

  @ApiProperty({
    description: 'Indica se o equipamento está ativo',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive deve ser um booleano' })
  isActive?: boolean;

  @ApiProperty({
    description: 'URLs das fotos do equipamento',
    required: false,
    type: [String],
  })
  @IsOptional()
  photos?: string[];

  @ApiProperty({
    description: 'URL da nota fiscal do equipamento',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'URL da nota fiscal deve ser uma string' })
  @MaxLength(500, { message: 'URL da nota fiscal deve ter no máximo 500 caracteres' })
  invoiceUrl?: string;
}
