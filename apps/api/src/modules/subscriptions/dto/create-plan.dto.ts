import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsObject } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['basic', 'professional', 'enterprise'])
  type: 'basic' | 'professional' | 'enterprise';

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(['monthly', 'annual'])
  period: 'monthly' | 'annual';

  @IsOptional()
  @IsNumber()
  maxOperations?: number;

  @IsOptional()
  @IsNumber()
  maxLabelsPerMonth?: number;

  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @IsOptional()
  @IsBoolean()
  hasSupport?: boolean;

  @IsOptional()
  @IsBoolean()
  hasAdvancedAnalytics?: boolean;

  @IsOptional()
  @IsBoolean()
  hasCustomBranding?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;
}






