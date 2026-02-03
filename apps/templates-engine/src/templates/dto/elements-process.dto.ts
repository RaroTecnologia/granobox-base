import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsObject,
  IsOptional,
  ValidateNested,
  IsNumber,
  IsArray,
  IsEnum,
  IsIn,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TemplateSizeDto {
  @ApiProperty({ description: 'Largura da etiqueta', example: 50 })
  @IsNumber()
  @Min(0)
  w: number;

  @ApiProperty({ description: 'Altura da etiqueta', example: 30 })
  @IsNumber()
  @Min(0)
  h: number;

  @ApiPropertyOptional({ description: 'Unidade (mm ou inches)', enum: ['mm', 'inches'], default: 'mm' })
  @IsOptional()
  @IsEnum(['mm', 'inches'])
  unit?: 'mm' | 'inches';
}

/** Elemento de template: texto, QR, código de barras, linha, imagem, forma */
export class TemplateElementDto {
  @ApiProperty({ enum: ['text', 'qr', 'barcode', 'line', 'image', 'shape'] })
  @IsEnum(['text', 'qr', 'barcode', 'line', 'image', 'shape'])
  type: 'text' | 'qr' | 'barcode' | 'line' | 'image' | 'shape';

  @ApiProperty({ description: 'Posição X (na unidade do template)', example: 5 })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'Posição Y', example: 5 })
  @IsNumber()
  y: number;

  @ApiPropertyOptional({ description: 'Largura' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ description: 'Altura' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({ description: 'Valor (texto, URL, conteúdo). Pode usar {{var}} ou ${var}' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ description: 'Variável que preenche o valor (alternativa a value com placeholder)' })
  @IsOptional()
  @IsString()
  linkedVariable?: string;

  @ApiPropertyOptional({ description: 'Tamanho da fonte em pontos/dots', example: 15 })
  @IsOptional()
  @IsNumber()
  fontSize?: number;

  @ApiPropertyOptional({ description: 'Alinhamento: left, center, right' })
  @IsOptional()
  @IsString()
  align?: string;

  @ApiPropertyOptional({ description: 'Alias de align (Tagment)' })
  @IsOptional()
  @IsString()
  alignment?: string;

  @ApiPropertyOptional({ description: 'Rotação: 0, 90, 180 ou 270 graus (padrões ZPL N, R, I, B)' })
  @IsOptional()
  @IsIn([0, 90, 180, 270])
  rotation?: 0 | 90 | 180 | 270;

  @ApiPropertyOptional({ description: 'Cor: black (preto) ou white (branco/invertido). ZPL: branco usa ^FR' })
  @IsOptional()
  @IsIn(['black', 'white'])
  color?: 'black' | 'white';

  @ApiPropertyOptional({ description: 'Transformação do texto: none, uppercase, lowercase' })
  @IsOptional()
  @IsString()
  textTransform?: string;

  @ApiPropertyOptional({ description: 'Largura do campo em mm (texto, ^FB)' })
  @IsOptional()
  @IsNumber()
  fieldWidth?: number;

  @ApiPropertyOptional({ description: 'Máximo de linhas (texto, ^FB)' })
  @IsOptional()
  @IsNumber()
  maxLines?: number;

  @ApiPropertyOptional({ description: 'Ocultar elemento se valor vazio' })
  @IsOptional()
  @IsBoolean()
  hideIfEmpty?: boolean;

  // line
  @ApiPropertyOptional({ description: 'Espessura da linha (mm ou dots)' })
  @IsOptional()
  @IsNumber()
  thickness?: number;

  // barcode
  @ApiPropertyOptional({ description: 'Tipo de código de barras: code128, code39, ean13, etc.' })
  @IsOptional()
  @IsString()
  barcodeType?: string;

  @ApiPropertyOptional({ description: 'Exibir texto abaixo do código de barras' })
  @IsOptional()
  @IsBoolean()
  showText?: boolean;

  // shape
  @ApiPropertyOptional({ description: 'Tipo de forma: rect, etc.' })
  @IsOptional()
  @IsString()
  shapeType?: string;

  @ApiPropertyOptional({ description: 'Preencher retângulo' })
  @IsOptional()
  @IsBoolean()
  fill?: boolean;

  @ApiPropertyOptional({ description: 'Espessura da borda' })
  @IsOptional()
  @IsNumber()
  strokeWidth?: number;

  // image
  @ApiPropertyOptional({ description: 'Imagem em base64 (data URL ou raw base64)' })
  @IsOptional()
  @IsString()
  imageData?: string;

  @ApiPropertyOptional({ description: 'Ajuste na caixa: contain, cover, fill' })
  @IsOptional()
  @IsIn(['contain', 'cover', 'fill'])
  imageFit?: 'contain' | 'cover' | 'fill';

  @ApiPropertyOptional({ description: 'Alinhamento horizontal: left, center, right' })
  @IsOptional()
  @IsString()
  imageAlign?: string;

  @ApiPropertyOptional({ description: 'Deslocamento horizontal % (-100 a 100)' })
  @IsOptional()
  @IsNumber()
  imageOffsetX?: number;

  @ApiPropertyOptional({ description: 'Deslocamento vertical % (-100 a 100)' })
  @IsOptional()
  @IsNumber()
  imageOffsetY?: number;

  @ApiPropertyOptional({ description: 'Escala da imagem na caixa % (50 a 150)' })
  @IsOptional()
  @IsNumber()
  imageScale?: number;
}

export class TemplateElementsDto {
  @ApiProperty({ type: TemplateSizeDto })
  @ValidateNested()
  @Type(() => TemplateSizeDto)
  size: TemplateSizeDto;

  @ApiProperty({ type: [TemplateElementDto], description: 'Lista de elementos do template' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateElementDto)
  elements: TemplateElementDto[];
}

export class ElementsProcessDto {
  @ApiPropertyOptional({ description: 'ID do template (se já existir no backend)' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty({ type: TemplateElementsDto, description: 'Template com size e elements' })
  @ValidateNested()
  @Type(() => TemplateElementsDto)
  template: TemplateElementsDto;

  @ApiProperty({
    description: 'Dados para substituir variáveis ({{var}} ou linkedVariable)',
    example: { produto: 'Produto X', lote: 'L001' },
  })
  @IsObject()
  data: Record<string, string | number>;
}
