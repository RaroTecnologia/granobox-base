import { IsString, IsOptional, IsBoolean, IsUUID, Length, IsEmail, ValidateIf } from 'class-validator';

export class CreateOperatorDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(4, 4)
  pin: string;

  @IsOptional()
  @ValidateIf((o) => o.phone && o.phone.trim() !== '')
  @IsString()
  @Length(1, 20)
  phone?: string;

  @IsOptional()
  @ValidateIf((o) => o.email && o.email.trim() !== '')
  @IsEmail()
  @Length(1, 100)
  email?: string;

  @IsOptional()
  @ValidateIf((o) => o.department && o.department.trim() !== '')
  @IsString()
  @Length(1, 100)
  department?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsUUID()
  clientId: string;
}
