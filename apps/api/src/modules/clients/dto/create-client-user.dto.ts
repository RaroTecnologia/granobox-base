import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsUUID,
  IsArray,
} from 'class-validator';
import { ClientUserRole } from '../entities/client-user.entity';

export class CreateClientUserDto {
  @ApiProperty({
    description: 'Nome do usuário',
    example: 'Maria Santos',
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'maria@restaurante.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
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
    description: 'Função do usuário',
    enum: ClientUserRole,
    example: ClientUserRole.OPERATOR,
  })
  @IsEnum(ClientUserRole, { message: 'Função inválida' })
  role: ClientUserRole;

  // ⭐ NOVO: IDs das operações que o usuário pode acessar
  // Se vazio ou null, usuário tem acesso a todas as operações
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
