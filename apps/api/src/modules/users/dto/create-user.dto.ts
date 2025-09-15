import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsPhoneNumber,
} from 'class-validator';

import { UserRole, UserDepartment } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@granobox.com',
  })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @MaxLength(255, { message: 'Email deve ter no máximo 255 caracteres' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'MinhaSenh@123',
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Papel do usuário no sistema',
    enum: UserRole,
    example: UserRole.SUPPORT,
  })
  @IsNotEmpty({ message: 'Papel é obrigatório' })
  @IsEnum(UserRole, { message: 'Papel deve ser um valor válido' })
  role: UserRole;

  @ApiProperty({
    description: 'Departamento do usuário',
    enum: UserDepartment,
    required: false,
    example: UserDepartment.SUPPORT,
  })
  @IsOptional()
  @IsEnum(UserDepartment, { message: 'Departamento deve ser um valor válido' })
  department?: UserDepartment;

  @ApiProperty({
    description: 'Telefone do usuário',
    required: false,
    example: '+5511999999999',
  })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  @MaxLength(20, { message: 'Telefone deve ter no máximo 20 caracteres' })
  phone?: string;

  @ApiProperty({
    description: 'URL do avatar do usuário',
    required: false,
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString({ message: 'Avatar deve ser uma string' })
  @MaxLength(500, { message: 'Avatar deve ter no máximo 500 caracteres' })
  avatar?: string;

  @ApiProperty({
    description: 'ID do usuário que está criando este usuário',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'CreatedBy deve ser uma string' })
  createdBy?: string;
}
