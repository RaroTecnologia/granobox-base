import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateSystemConfigDto {
  @ApiProperty({ description: 'Nome da empresa', required: false })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiProperty({ description: 'CNPJ da empresa', required: false })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiProperty({ description: 'Endereço da empresa', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Telefone da empresa', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Email da empresa', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'URL da logo colorida', required: false })
  @IsOptional()
  @IsString()
  logoColorida?: string;

  @ApiProperty({ description: 'URL da logo monocromática', required: false })
  @IsOptional()
  @IsString()
  logoMonocromatica?: string;
}





