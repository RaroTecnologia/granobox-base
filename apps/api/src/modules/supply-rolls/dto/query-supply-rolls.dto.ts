import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { SupplyRollStatus } from '../entities/supply-roll.entity';

export class QuerySupplyRollsDto {
  @IsOptional()
  @IsEnum(SupplyRollStatus)
  status?: SupplyRollStatus;

  @IsOptional()
  @IsString()
  hasInvoice?: string; // 'true' or 'false'

  @IsOptional()
  @IsString()
  batchCode?: string;

  @IsOptional()
  @IsString()
  skuId?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsNumberString()
  offset?: string;
}
