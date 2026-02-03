import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
  IsNumber,
  Min,
  ValidateIf,
  Matches,
  IsBoolean,
} from 'class-validator';

import { ClientType, BusinessType } from '../entities/client.entity';

export class CreateClientDto {
  @ApiProperty({
    description: 'Tipo de cliente',
    enum: ClientType,
    example: ClientType.BUSINESS,
  })
  @IsNotEmpty({ message: 'Tipo de cliente é obrigatório' })
  @IsEnum(ClientType, { message: 'Tipo de cliente deve ser um valor válido' })
  clientType: ClientType;

  // Campos para Pessoa Física
  @ApiProperty({
    description: 'Nome completo (apenas para PF)',
    required: false,
    example: 'João Silva Santos',
  })
  @ValidateIf((o) => o.clientType === ClientType.INDIVIDUAL)
  @IsNotEmpty({ message: 'Nome completo é obrigatório para pessoa física' })
  @IsString({ message: 'Nome completo deve ser uma string' })
  @MaxLength(255, {
    message: 'Nome completo deve ter no máximo 255 caracteres',
  })
  fullName?: string;

  @ApiProperty({
    description: 'CPF (apenas para PF)',
    required: false,
    example: '12345678901',
  })
  @ValidateIf((o) => o.clientType === ClientType.INDIVIDUAL)
  @IsNotEmpty({ message: 'CPF é obrigatório para pessoa física' })
  @IsString({ message: 'CPF deve ser uma string' })
  @Matches(/^\d{11}$/, { message: 'CPF deve conter exatamente 11 dígitos' })
  cpf?: string;

  @ApiProperty({
    description: 'Data de nascimento (apenas para PF)',
    required: false,
    example: '1990-01-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de nascimento deve ser uma data válida' })
  birthDate?: string;

  @ApiProperty({
    description: 'Nome fantasia/comercial (para PF e PJ)',
    required: false,
    example: 'Padaria do João',
  })
  @IsOptional()
  @IsString({ message: 'Nome fantasia deve ser uma string' })
  @MaxLength(255, {
    message: 'Nome fantasia deve ter no máximo 255 caracteres',
  })
  businessName?: string;

  // Campos para Pessoa Jurídica

  @ApiProperty({
    description: 'Razão social (apenas para PJ)',
    required: false,
    example: 'João Silva Santos ME',
  })
  @IsOptional()
  @IsString({ message: 'Razão social deve ser uma string' })
  @MaxLength(255, { message: 'Razão social deve ter no máximo 255 caracteres' })
  legalName?: string;

  @ApiProperty({
    description: 'CNPJ (apenas para PJ)',
    required: false,
    example: '12345678000195',
  })
  @ValidateIf((o) => o.clientType === ClientType.BUSINESS)
  @IsNotEmpty({ message: 'CNPJ é obrigatório para pessoa jurídica' })
  @IsString({ message: 'CNPJ deve ser uma string' })
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter exatamente 14 dígitos' })
  cnpj?: string;

  @ApiProperty({
    description: 'Tipo de negócio (apenas para PJ)',
    enum: BusinessType,
    required: false,
    example: BusinessType.BAKERY,
  })
  @IsOptional()
  @IsEnum(BusinessType, { message: 'Tipo de negócio deve ser um valor válido' })
  businessType?: BusinessType;

  // Contato Principal
  @ApiProperty({
    description: 'Nome do contato principal',
    example: 'João Silva',
  })
  @IsNotEmpty({ message: 'Nome do contato é obrigatório' })
  @IsString({ message: 'Nome do contato deve ser uma string' })
  @MaxLength(255, {
    message: 'Nome do contato deve ter no máximo 255 caracteres',
  })
  contactName: string;

  @ApiProperty({
    description: 'Email do contato principal',
    example: 'joao@padaria.com',
  })
  @IsNotEmpty({ message: 'Email do contato é obrigatório' })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @MaxLength(255, { message: 'Email deve ter no máximo 255 caracteres' })
  contactEmail: string;

  @ApiProperty({
    description: 'Telefone do contato',
    required: false,
    example: '11999999999',
  })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  @MaxLength(20, { message: 'Telefone deve ter no máximo 20 caracteres' })
  contactPhone?: string;

  @ApiProperty({
    description: 'WhatsApp do contato',
    required: false,
    example: '11999999999',
  })
  @IsOptional()
  @IsString({ message: 'WhatsApp deve ser uma string' })
  @MaxLength(20, { message: 'WhatsApp deve ter no máximo 20 caracteres' })
  contactWhatsapp?: string;

  // Endereço
  @ApiProperty({
    description: 'CEP',
    example: '01234567',
  })
  @IsNotEmpty({ message: 'CEP é obrigatório' })
  @IsString({ message: 'CEP deve ser uma string' })
  @Matches(/^\d{8}$/, { message: 'CEP deve conter exatamente 8 dígitos' })
  zipCode: string;

  @ApiProperty({
    description: 'Logradouro',
    example: 'Rua das Flores',
  })
  @IsNotEmpty({ message: 'Logradouro é obrigatório' })
  @IsString({ message: 'Logradouro deve ser uma string' })
  @MaxLength(255, { message: 'Logradouro deve ter no máximo 255 caracteres' })
  street: string;

  @ApiProperty({
    description: 'Número',
    example: '123',
  })
  @IsNotEmpty({ message: 'Número é obrigatório' })
  @IsString({ message: 'Número deve ser uma string' })
  @MaxLength(10, { message: 'Número deve ter no máximo 10 caracteres' })
  number: string;

  @ApiProperty({
    description: 'Complemento',
    required: false,
    example: 'Apto 45',
  })
  @IsOptional()
  @IsString({ message: 'Complemento deve ser uma string' })
  @MaxLength(100, { message: 'Complemento deve ter no máximo 100 caracteres' })
  complement?: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Centro',
  })
  @IsNotEmpty({ message: 'Bairro é obrigatório' })
  @IsString({ message: 'Bairro deve ser uma string' })
  @MaxLength(100, { message: 'Bairro deve ter no máximo 100 caracteres' })
  neighborhood: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
  })
  @IsNotEmpty({ message: 'Cidade é obrigatória' })
  @IsString({ message: 'Cidade deve ser uma string' })
  @MaxLength(100, { message: 'Cidade deve ter no máximo 100 caracteres' })
  city: string;

  @ApiProperty({
    description: 'Estado (UF)',
    example: 'SP',
  })
  @IsNotEmpty({ message: 'Estado é obrigatório' })
  @IsString({ message: 'Estado deve ser uma string' })
  @Matches(/^[A-Z]{2}$/, {
    message: 'Estado deve ser uma UF válida (2 letras maiúsculas)',
  })
  state: string;

  // Termos Comerciais
  @ApiProperty({
    description: 'Mensalidade',
    example: 99.9,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Mensalidade deve ser um número' })
  @Min(0, { message: 'Mensalidade deve ser maior ou igual a zero' })
  monthlyFee?: number;

  @ApiProperty({
    description: 'Taxa de instalação',
    example: 150.0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Taxa de instalação deve ser um número' })
  @Min(0, { message: 'Taxa de instalação deve ser maior ou igual a zero' })
  setupFee?: number;

  @ApiProperty({
    description: 'Prazo de pagamento (em dias)',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Prazo de pagamento deve ser um número' })
  @Min(1, { message: 'Prazo de pagamento deve ser maior que zero' })
  paymentTerms?: number;

  @ApiProperty({
    description: 'Observações',
    required: false,
    example: 'Cliente interessado em equipamento adicional',
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser uma string' })
  notes?: string;

  @ApiProperty({
    description: 'API Key do Tagment para integração de impressão',
    required: false,
    example:
      'tgm_7bf097a437f821a8219ecd09b375ca6900d012cbf45bb916d18ddc0253c8bda7',
  })
  @IsOptional()
  @IsString({ message: 'API Key do Tagment deve ser uma string' })
  @MaxLength(255, {
    message: 'API Key do Tagment deve ter no máximo 255 caracteres',
  })
  tagmentApiKey?: string;

  @ApiProperty({
    description: 'Customer ID no Tagment',
    required: false,
    example: 'gbx_padaria_do_joao',
  })
  @IsOptional()
  @IsString({ message: 'Customer ID do Tagment deve ser uma string' })
  @MaxLength(100, { message: 'Customer ID deve ter no máximo 100 caracteres' })
  tagmentCustomerId?: string;

  @ApiProperty({
    description: 'Número SIF do cliente',
    required: false,
    example: '12345',
  })
  @IsOptional()
  @IsString({ message: 'SIF deve ser uma string' })
  @MaxLength(50, { message: 'SIF deve ter no máximo 50 caracteres' })
  tagmentSif?: string;

  @ApiProperty({
    description: 'Marca padrão para etiquetas',
    required: false,
    example: 'TACCHINO',
  })
  @IsOptional()
  @IsString({ message: 'Marca deve ser uma string' })
  @MaxLength(100, { message: 'Marca deve ter no máximo 100 caracteres' })
  tagmentBrand?: string;

  @ApiProperty({
    description: 'UUID do logo do cliente para impressão',
    required: false,
    example: '7b3de5c2-8a0f-4f9a-b6d1-4a2a3b1c9f0e',
  })
  @IsOptional()
  @IsString({ message: 'UUID do logo deve ser uma string' })
  @MaxLength(255, { message: 'UUID do logo deve ter no máximo 255 caracteres' })
  tagmentLogoUuid?: string;

  @ApiProperty({
    description: 'Fonte dos templates: tagment (API Tagment) | granobox (templates do Granobox)',
    required: false,
    example: 'tagment',
    enum: ['tagment', 'granobox'],
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  templateProvider?: 'tagment' | 'granobox';

  @ApiProperty({
    description: 'Habilita ou desabilita o módulo de impressão de rótulos',
    required: false,
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'hasRotuloModule deve ser um valor booleano' })
  hasRotuloModule?: boolean;
}
