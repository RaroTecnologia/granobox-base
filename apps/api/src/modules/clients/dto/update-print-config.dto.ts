import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  MaxLength,
} from 'class-validator';

export class UpdatePrintConfigDto {
  @ApiProperty({
    description: 'Fonte dos templates: tagment | granobox',
    enum: ['tagment', 'granobox'],
    required: false,
  })
  @IsOptional()
  @IsIn(['tagment', 'granobox'])
  templateProvider?: 'tagment' | 'granobox';

  @ApiProperty({
    description: 'API Key Tagment (apenas quando templateProvider = tagment)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tagmentApiKey?: string;

  @ApiProperty({
    description: 'Customer ID Tagment (apenas quando templateProvider = tagment)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tagmentCustomerId?: string;

  @ApiProperty({
    description: 'UUID do logo no Tagment',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tagmentLogoUuid?: string;

  @ApiProperty({
    description: 'ID da impressora padrão para etiqueta validade (Granobox)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  defaultPrinterValidadeId?: string;

  @ApiProperty({
    description: 'ID da impressora padrão para rótulo (Granobox)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  defaultPrinterRotuloId?: string;

  @ApiProperty({
    description:
      'ID do template padrão para etiqueta validade (Tagment ou Granobox conforme provider)',
    required: false,
  })
  @IsOptional()
  @IsString()
  defaultValidityTemplateId?: string;

  @ApiProperty({
    description:
      'ID do template padrão para rótulo (Tagment ou Granobox conforme provider)',
    required: false,
  })
  @IsOptional()
  @IsString()
  defaultRotuloTemplateId?: string;

  @ApiProperty({
    description: 'DeviceId do Edge-Go usado por padrão para etiqueta de envio',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  defaultShippingLabelDeviceId?: string;

  @ApiProperty({
    description: 'DeviceId do Edge-Go usado por padrão para etiqueta DANFE',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  defaultDanfeLabelDeviceId?: string;
}
