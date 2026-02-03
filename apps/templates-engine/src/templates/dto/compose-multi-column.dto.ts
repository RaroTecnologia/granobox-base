import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LabelLayoutDto {
  @ApiProperty({ description: 'Número de colunas na linha da bobina', example: 2 })
  @IsNumber()
  @Min(1)
  columns: number;

  @ApiProperty({ description: 'Espaço entre colunas (mm)', example: 2 })
  @IsNumber()
  @Min(0)
  columnGap: number;

  @ApiProperty({ description: 'Largura de uma etiqueta (mm)', example: 50 })
  @IsNumber()
  @Min(1)
  labelWidth: number;

  @ApiProperty({ description: 'Altura de uma etiqueta (mm)', example: 30 })
  @IsNumber()
  @Min(1)
  labelHeight: number;
}

export class ComposeMultiColumnDto {
  @ApiProperty({
    description: 'Array de ZPL (um por coluna). Cada ZPL deve ser um bloco ^XA...^XZ completo.',
    type: [String],
    example: ['^XA^FO0,0^A0N,20,20^FDCol1^FS^XZ', '^XA^FO0,0^A0N,20,20^FDCol2^FS^XZ'],
  })
  @IsArray()
  @IsString({ each: true })
  zpls: string[];

  @ApiProperty({ description: 'Layout da bobina multi-coluna', type: LabelLayoutDto })
  @ValidateNested()
  @Type(() => LabelLayoutDto)
  labelLayout: LabelLayoutDto;

  @ApiPropertyOptional({ description: 'Unidade (mm ou inches)', default: 'mm' })
  @IsOptional()
  @IsString()
  unit?: 'mm' | 'inches';
}
