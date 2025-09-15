import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ContactType } from '../entities/contact.entity';

export class CreateContactDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'ID do cliente deve ser um UUID válido' })
  clientId: string;

  @ApiProperty({
    description: 'Nome completo do contato',
    example: 'João Silva Santos',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Cargo ou função do contato',
    required: false,
    example: 'Gerente Comercial',
  })
  @IsOptional()
  @IsString({ message: 'Cargo deve ser uma string' })
  @MaxLength(100, { message: 'Cargo deve ter no máximo 100 caracteres' })
  role?: string;

  @ApiProperty({
    description: 'Tipo de contato',
    enum: ContactType,
    example: ContactType.COMMERCIAL,
  })
  @IsEnum(ContactType, { message: 'Tipo de contato deve ser um valor válido' })
  type: ContactType;

  @ApiProperty({
    description: 'Email principal do contato',
    example: 'joao@empresa.com.br',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @MaxLength(255, { message: 'Email deve ter no máximo 255 caracteres' })
  email: string;

  @ApiProperty({
    description: 'Telefone do contato (apenas números)',
    required: false,
    example: '11999999999',
  })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  @MaxLength(20, { message: 'Telefone deve ter no máximo 20 caracteres' })
  phone?: string;

  @ApiProperty({
    description: 'WhatsApp do contato (apenas números)',
    required: false,
    example: '11888888888',
  })
  @IsOptional()
  @IsString({ message: 'WhatsApp deve ser uma string' })
  @MaxLength(20, { message: 'WhatsApp deve ter no máximo 20 caracteres' })
  whatsapp?: string;

  @ApiProperty({
    description: 'Departamento do contato',
    required: false,
    example: 'Vendas',
  })
  @IsOptional()
  @IsString({ message: 'Departamento deve ser uma string' })
  @MaxLength(100, { message: 'Departamento deve ter no máximo 100 caracteres' })
  department?: string;

  @ApiProperty({
    description: 'Se é o contato principal do cliente',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isPrimary deve ser um valor booleano' })
  isPrimary?: boolean;

  @ApiProperty({
    description: 'Observações sobre o contato',
    required: false,
    example: 'Responsável por aprovações de compras',
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser uma string' })
  notes?: string;
}
