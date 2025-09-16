import { IsString, IsOptional, IsEnum, IsInt, IsDateString, IsUUID, IsObject, Min } from 'class-validator';
import { LabelType, ConservationType } from '../entities/label.entity';

export class CreateLabelDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsEnum(LabelType)
  type: LabelType;

  @IsOptional()
  @IsEnum(ConservationType)
  conservationType?: ConservationType;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  weight?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsDateString()
  productionDate: string;

  @IsDateString()
  validityDate: string;

  @IsUUID()
  clientId: string;

  @IsUUID()
  productId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
