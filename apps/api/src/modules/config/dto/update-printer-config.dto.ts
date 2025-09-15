import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdatePrinterConfigDto {
  @ApiProperty({ description: 'Nome da impressora', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Endereço IP da impressora', required: false })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiProperty({ description: 'Porta da impressora', required: false })
  @IsOptional()
  @IsString()
  port?: string;

  @ApiProperty({ description: 'Modelo da impressora', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ description: 'Status da impressora', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
