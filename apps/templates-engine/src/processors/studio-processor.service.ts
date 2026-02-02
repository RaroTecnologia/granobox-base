import { Injectable, Logger } from '@nestjs/common';
import { ImageProcessorService } from './image-processor.service';
import { DynamicFieldDto } from '../templates/dto/studio-render.dto';

/**
 * Processa templates tipo rotulo_studio: imagem (PNG) → ZPL ^GFA.
 * ⚡ Suporta ZPL híbrido: GRF (imagem) + campos dinâmicos (texto nativo).
 */
@Injectable()
export class StudioProcessorService {
  private readonly logger = new Logger(StudioProcessorService.name);

  constructor(private readonly imageProcessor: ImageProcessorService) {}

  /**
   * Renderiza template Studio: recebe imagem em base64 e dados, retorna ZPL.
   * 
   * ⚡ ZPL Híbrido:
   * - Elementos estáticos (logo, nome do produto, tabela nutricional) → Imagem GRF
   * - Campos dinâmicos (data, lote, peso) → Texto ZPL nativo nas coordenadas especificadas
   */
  async render(
    imageBase64: string,
    data: Record<string, string | number>,
    options?: { 
      widthMm?: number; 
      heightMm?: number; 
      dpi?: number;
      dynamicFields?: DynamicFieldDto[];
    },
  ): Promise<{ zpl: string; imageSize: { width: number; height: number } }> {
    if (!imageBase64) {
      throw new Error('Imagem base64 é obrigatória para render Studio');
    }

    const dpi = options?.dpi || 203;
    const dotsPerMm = dpi / 25.4;

    const buffer = this.imageProcessor.base64ToBuffer(imageBase64);
    const { buffer: rawBuffer, width, height } = await this.imageProcessor.prepareForZpl(
      buffer,
      options,
    );

    const hex = this.imageProcessor.rawToHex(rawBuffer);
    const byteCount = rawBuffer.length;
    const bytesPerRow = width;
    const totalBytes = byteCount;

    // Construir ZPL
    const zplParts: string[] = [];

    // Cabeçalho
    zplParts.push('^XA');
    zplParts.push('^CI28'); // Codepage UTF-8

    // Imagem GRF (elementos estáticos)
    const gfaData = `${totalBytes},${bytesPerRow},${height},${hex}`;
    zplParts.push(`^FO0,0^GFA,${gfaData}^FS`);

    // ⚡ Campos dinâmicos (texto ZPL nativo)
    if (options?.dynamicFields && options.dynamicFields.length > 0) {
      this.logger.log(`[Studio] Adding ${options.dynamicFields.length} dynamic fields`);
      
      for (const field of options.dynamicFields) {
        const value = data[field.name];
        if (value !== undefined && value !== null && value !== '') {
          const textZpl = this.generateTextZpl(field, String(value), dotsPerMm);
          zplParts.push(textZpl);
        }
      }
    }

    // Rodapé
    zplParts.push('^XZ');

    const zpl = zplParts.join('\n');

    this.logger.log(`[Studio] Generated ZPL: ${zpl.length} bytes (GRF: ${hex.length} chars, dynamic: ${options?.dynamicFields?.length || 0} fields)`);

    return {
      zpl,
      imageSize: { width, height },
    };
  }

  /**
   * Gera comando ZPL para texto dinâmico
   */
  private generateTextZpl(
    field: DynamicFieldDto,
    value: string,
    dotsPerMm: number,
  ): string {
    const xDots = Math.round(field.x * dotsPerMm);
    const yDots = Math.round(field.y * dotsPerMm);
    
    // Calcular tamanho da fonte em dots
    // Fonte ZPL: altura e largura em dots (aproximadamente pontos * DPI / 72)
    const fontHeight = Math.round(field.fontSize * dotsPerMm * 0.35); // Ajuste empírico
    const fontWidth = Math.round(fontHeight * 0.8);

    // Determinar fonte ZPL (0 = default scalable)
    const zplFont = '0';

    // Montar comando de texto
    let textCmd = `^FO${xDots},${yDots}`;
    textCmd += `^A${zplFont}N,${fontHeight},${fontWidth}`;
    
    // Alinhamento (^FB para field block)
    if (field.textAlign && field.textAlign !== 'left' && field.width) {
      const widthDots = Math.round(field.width * dotsPerMm);
      const alignment = field.textAlign === 'center' ? 'C' : 'R';
      textCmd += `^FB${widthDots},1,0,${alignment}`;
    }
    
    textCmd += `^FD${this.escapeZplText(value)}^FS`;

    return textCmd;
  }

  /**
   * Escapa caracteres especiais para ZPL
   */
  private escapeZplText(text: string): string {
    // ZPL usa ^ e ~ como caracteres de controle
    return text
      .replace(/\^/g, '^5E') // ^ -> ^5E (escape)
      .replace(/~/g, '^7E')  // ~ -> ^7E (escape)
      .replace(/\\/g, '^5C'); // \ -> ^5C (escape)
  }
}
