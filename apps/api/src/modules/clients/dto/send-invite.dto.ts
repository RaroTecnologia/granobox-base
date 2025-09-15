import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendInviteDto {
  @ApiProperty({
    description: 'Email do usuário master que receberá o convite',
    example: 'admin@restaurante.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Nome do usuário master',
    example: 'João Silva',
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Mensagem personalizada no convite (opcional)',
    required: false,
    example: 'Bem-vindo à plataforma Granobox!',
  })
  @IsOptional()
  @IsString({ message: 'Mensagem deve ser uma string' })
  @MaxLength(500, { message: 'Mensagem deve ter no máximo 500 caracteres' })
  message?: string;
}
