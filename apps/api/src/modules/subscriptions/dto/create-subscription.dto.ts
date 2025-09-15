import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  clientId: string;

  @IsString()
  planId: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'cancelled', 'suspended', 'expired'])
  status?: 'active' | 'inactive' | 'cancelled' | 'suspended' | 'expired';

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  billingCycle?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
