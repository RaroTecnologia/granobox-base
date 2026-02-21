import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsNumber, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowStageDto {
  @IsString()
  name: string;

  @IsString()
  @IsIn(['technical_review', 'quality_review', 'regulatory_review', 'final_approval', 'print_approval', 'custom'])
  stageType: string;

  @IsNumber()
  @Min(1)
  order: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  assignedToUserId?: string;

  @IsString()
  @IsOptional()
  assignedToRole?: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsBoolean()
  @IsOptional()
  autoApprove?: boolean;

  @IsNumber()
  @IsOptional()
  deadlineDays?: number;
}

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  schemaId?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStageDto)
  stages: WorkflowStageDto[];
}

export class UpdateWorkflowDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  schemaId?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStageDto)
  @IsOptional()
  stages?: WorkflowStageDto[];
}
