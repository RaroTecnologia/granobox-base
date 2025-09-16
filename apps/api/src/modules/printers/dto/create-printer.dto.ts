import { IsString, IsOptional, IsUUID, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { PrinterUsage } from '../entities/printer.entity';

export class CreatePrinterDto {
  // Referência ao Tagment
  @IsString()
  tagmentId: string;

  // Metadados específicos do Granobox
  @IsString()
  location: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  usage?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  // Relacionamentos
  @IsUUID()
  clientId: string;

  @IsUUID()
  createdById: string;
}
