import { IsString, IsOptional, IsBoolean, IsObject, IsUUID } from 'class-validator';

export class CreateTagmentConfigDto {
  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @IsUUID()
  clientId: string;
}


