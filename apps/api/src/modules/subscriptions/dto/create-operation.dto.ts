import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class CreateOperationDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsEnum(['pending', 'completed', 'failed', 'cancelled'])
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  subscriptionId?: string;
}