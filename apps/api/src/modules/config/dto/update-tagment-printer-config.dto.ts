import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTagmentPrinterConfigDto {
  @ApiProperty({ 
    description: 'ID da impressora Tagment para etiquetas de validade', 
    required: false 
  })
  @IsOptional()
  @IsString()
  tagmentPrinterValidadeId?: string;

  @ApiProperty({ 
    description: 'ID da impressora Tagment para etiquetas de rótulo', 
    required: false 
  })
  @IsOptional()
  @IsString()
  tagmentPrinterRotuloId?: string;
}
