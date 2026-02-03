import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsEnum,
  IsPositive,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateRecebimentoDto {
  @IsOptional()
  @IsString()
  supplierId?: string; // UUID do fornecedor cadastrado (opcional)

  @IsOptional()
  @IsString()
  supplierCode?: string;

  @IsOptional()
  @IsString()
  supplierName?: string; // Opcional - pode ser removido no futuro

  @IsOptional()
  @IsString()
  supplierCnpj?: string;

  @IsOptional()
  @IsString()
  productId?: string; // UUID do produto cadastrado (opcional)

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  productDescription?: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string = 'UN';

  @IsOptional()
  @IsDateString()
  productionDate?: string; // Opcional

  @IsDateString()
  validityDate: string; // Obrigatório

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsString()
  sif?: string; // Número do SIF

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  condition?: string; // 'conforme', 'nao_conforme', 'parcial'

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  itemQuantity?: number; // Quantidade por item/etiqueta

  @IsOptional()
  @IsBoolean()
  generateLabels?: boolean; // Se deve gerar etiquetas imediatamente
}
