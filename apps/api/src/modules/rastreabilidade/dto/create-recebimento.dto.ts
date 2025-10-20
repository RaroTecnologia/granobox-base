import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, IsPositive, Min } from 'class-validator';

export class CreateRecebimentoDto {
  @IsOptional()
  @IsString()
  supplierId?: string; // UUID do fornecedor cadastrado (opcional)

  @IsOptional()
  @IsString()
  supplierCode?: string;

  @IsString()
  supplierName: string;

  @IsOptional()
  @IsString()
  supplierCnpj?: string;

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
  unit?: string = 'kg';

  @IsDateString()
  productionDate: string;

  @IsDateString()
  validityDate: string;

  @IsOptional()
  @IsNumber()
  temperature?: number;

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
  generateLabels?: boolean; // Se deve gerar etiquetas imediatamente
}
