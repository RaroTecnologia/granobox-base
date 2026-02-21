import { IsString, IsOptional, IsEnum, IsEmail, IsDateString, IsObject, IsNotEmpty } from 'class-validator';

export class CreateSheetShareDto {
  @IsEnum(['public', 'email_restricted'])
  accessType: 'public' | 'email_restricted';

  @IsEnum(['view', 'comment', 'edit', 'approve'])
  @IsOptional()
  permission?: 'view' | 'comment' | 'edit' | 'approve';

  @IsEmail()
  @IsOptional()
  allowedEmail?: string;

  @IsString()
  @IsOptional()
  guestName?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class ShareCommentDto {
  @IsString()
  author: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  stage?: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}

export class ShareApprovalDto {
  @IsString()
  author: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(['approved', 'rejected'])
  action: 'approved' | 'rejected';

  @IsString()
  @IsOptional()
  comment?: string;
}

export class ShareEditDto {
  @IsString()
  @IsNotEmpty()
  author: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsObject()
  @IsNotEmpty()
  data: Record<string, unknown>;
}
