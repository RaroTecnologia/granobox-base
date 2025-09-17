import { IsString, IsEnum, IsOptional, IsBoolean, IsObject, IsUUID } from 'class-validator';
import { LabelType } from '../entities/template-association.entity';

export class CreateTemplateAssociationDto {
  @IsString()
  templateId: string;

  @IsString()
  templateName: string;

  @IsEnum(LabelType)
  labelType: LabelType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;

  @IsUUID()
  clientId: string;
}

