import { IsString, IsOptional, IsIn, IsUUID, IsArray, IsDateString, IsNumber, Min } from 'class-validator';
import { ApprovalStage } from '../entities/sheet-approval.entity';

export class SubmitForApprovalDto {
  @IsOptional()
  @IsArray()
  @IsIn(['technical_review', 'quality_review', 'regulatory_review', 'final_approval', 'print_approval'], { each: true })
  stages?: ApprovalStage[];

  @IsOptional()
  @IsDateString()
  deadline?: string; // Deadline geral customizado

  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultDeadlineDays?: number; // Dias padrão por etapa se não configurado no workflow
}

export class ApprovalActionDto {
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RejectActionDto {
  @IsString()
  comment: string;
}

export class AssignApprovalDto {
  @IsUUID()
  userId: string;
}
