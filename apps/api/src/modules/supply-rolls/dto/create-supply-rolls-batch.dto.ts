import { IsUUID, IsEnum, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { SupplyRollType } from '../entities/supply-roll.entity';

export class CreateSupplyRollsBatchDto {
  @IsUUID()
  skuId: string;

  @IsEnum(SupplyRollType)
  type: SupplyRollType;

  @IsInt()
  @Min(1)
  @Max(500)
  quantity: number;

  @IsOptional()
  @IsString()
  batchCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
