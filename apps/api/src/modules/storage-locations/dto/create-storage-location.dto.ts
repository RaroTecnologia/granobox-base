import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StorageLocationType } from '../entities/storage-location.entity';

export class CreateStorageLocationDto {
  @ApiProperty({ description: 'Nome do local de armazenamento', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  nome: string;

  @ApiProperty({ 
    description: 'Tipo do local de armazenamento',
    enum: StorageLocationType,
    example: StorageLocationType.GELADEIRA
  })
  @IsEnum(StorageLocationType)
  tipo: StorageLocationType;

  @ApiPropertyOptional({ description: 'Descrição do local' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ 
    description: 'Temperatura do local em Celsius', 
    minimum: -50, 
    maximum: 50 
  })
  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(50)
  temperatura?: number;

  @ApiPropertyOptional({ 
    description: 'Capacidade do local em litros', 
    minimum: 1 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacidade?: number;

  @ApiPropertyOptional({ description: 'Setor ou área do local', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  setor?: string;

  @ApiPropertyOptional({ description: 'Se o local está ativo', default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

