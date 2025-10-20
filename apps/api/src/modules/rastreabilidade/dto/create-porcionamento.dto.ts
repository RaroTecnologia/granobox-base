import { IsString, IsNumber, IsArray, ValidateNested, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class PorcaoDto {
  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePorcionamentoDto {
  @IsUUID()
  parentItemId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PorcaoDto)
  portions: PorcaoDto[];
}
