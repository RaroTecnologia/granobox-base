import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, ValidateNested, IsNumber, Min, IsArray, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * ⚡ Campo dinâmico - renderizado em ZPL puro (texto nativo)
 * Usado para data, lote, peso que mudam a cada impressão
 */
export class DynamicFieldDto {
  @ApiProperty({ description: 'Nome da variável', example: 'dataValidade' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Posição X em mm', example: 10 })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'Posição Y em mm', example: 25 })
  @IsNumber()
  y: number;

  @ApiProperty({ description: 'Tamanho da fonte em pontos', example: 12 })
  @IsNumber()
  @Min(6)
  fontSize: number;

  @ApiPropertyOptional({ description: 'Família da fonte', example: 'Arial' })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiPropertyOptional({ description: 'Alinhamento do texto', example: 'left' })
  @IsOptional()
  @IsIn(['left', 'center', 'right'])
  textAlign?: 'left' | 'center' | 'right';

  @ApiPropertyOptional({ description: 'Cor do texto (hex)', example: '#000000' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Largura máxima em mm (para alinhamento)', example: 40 })
  @IsOptional()
  @IsNumber()
  width?: number;
}

export class LabelLayoutDto {
  @ApiPropertyOptional({ description: 'Número de colunas na linha da bobina', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  columns?: number;

  @ApiPropertyOptional({ description: 'Espaço entre colunas (mm)', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  columnGap?: number;

  @ApiPropertyOptional({ description: 'Largura de uma etiqueta (mm)', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  labelWidth?: number;

  @ApiPropertyOptional({ description: 'Altura de uma etiqueta (mm)', example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  labelHeight?: number;

  @ApiPropertyOptional({ description: 'Largura da etiqueta (mm) - alias', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  widthMm?: number;

  @ApiPropertyOptional({ description: 'Altura da etiqueta (mm) - alias', example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  heightMm?: number;

  @ApiPropertyOptional({ 
    description: 'Campos dinâmicos para ZPL puro (data, lote, etc.)',
    type: [DynamicFieldDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DynamicFieldDto)
  dynamicFields?: DynamicFieldDto[];
}

export class StudioRenderDto {
  @ApiProperty({ example: 'studio-template-123' })
  @IsString()
  templateId: string;

  @ApiProperty({
    example: { produto: 'Produto X', imagem: 'base64-...' },
  })
  @IsObject()
  data: Record<string, string | number>;

  @ApiPropertyOptional({ description: 'Imagem PNG em base64 para render' })
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @ApiPropertyOptional({
    description: 'Layout multi-coluna: se columns > 1, repete a mesma imagem N vezes na mesma linha (bobina)',
    type: LabelLayoutDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LabelLayoutDto)
  labelLayout?: LabelLayoutDto;
}
