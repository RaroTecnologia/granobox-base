import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsIn } from 'class-validator';

export class ProcessTemplateDto {
  @ApiProperty({ example: 'template-123', description: 'ID do template' })
  @IsString()
  templateId: string;

  @ApiProperty({
    example: { produto: 'Produto X', codigo: 'ABC123', dataValidade: '30/12/2025' },
    description: 'Dados para substituição no template',
  })
  @IsObject()
  data: Record<string, string | number>;

  @ApiPropertyOptional({
    enum: ['etiqueta_validade', 'rotulo_studio'],
    default: 'etiqueta_validade',
  })
  @IsOptional()
  @IsIn(['etiqueta_validade', 'rotulo_studio'])
  type?: 'etiqueta_validade' | 'rotulo_studio' = 'etiqueta_validade';

  /** ZPL bruto do template (opcional). Se enviado, o engine usa em vez de buscar por templateId. */
  @ApiPropertyOptional({ description: 'ZPL do template (quando a API envia o conteúdo)' })
  @IsOptional()
  @IsString()
  zpl?: string;
}
