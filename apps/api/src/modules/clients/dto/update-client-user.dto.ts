import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ClientUserRole, ClientUserStatus } from '../entities/client-user.entity';

export class UpdateClientUserDto {
  @ApiProperty({
    description: 'Nome do usuário',
    example: 'Maria Santos',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name?: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'maria@restaurante.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiProperty({
    description: 'Senha do usuário (opcional para atualização)',
    example: 'MinhaSenh@123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  password?: string;

  @ApiProperty({
    description: 'Função do usuário',
    enum: ClientUserRole,
    example: ClientUserRole.OPERATOR,
    required: false,
  })
  @IsOptional()
  @IsEnum(ClientUserRole, { message: 'Função inválida' })
  role?: ClientUserRole;

  @ApiProperty({
    description: 'Status do usuário',
    enum: ClientUserStatus,
    example: ClientUserStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ClientUserStatus, { message: 'Status inválido' })
  status?: ClientUserStatus;

  @ApiProperty({
    description:
      'IDs das operações que o usuário pode acessar (opcional - se vazio, acessa todas)',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  operationIds?: string[];

}

