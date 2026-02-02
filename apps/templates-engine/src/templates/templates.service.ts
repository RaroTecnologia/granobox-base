import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZplProcessorService } from '../processors/zpl-processor.service';
import { StudioProcessorService } from '../processors/studio-processor.service';
import { ElementsProcessorService } from '../processors/elements-processor.service';
import { TemplateSizeDto, TemplateElementDto } from './dto/elements-process.dto';

const DEFAULT_CACHE_MAX = 100;

export interface TemplateInfo {
  id: string;
  name: string;
  type: 'etiqueta_validade' | 'rotulo_studio';
  variables?: string[];
  createdAt?: string;
}

@Injectable()
export class TemplatesService {
  private readonly cache = new Map<string, string>();
  private readonly cacheEnabled: boolean;
  private readonly cacheMaxSize: number;

  constructor(
    private readonly config: ConfigService,
    private readonly zplProcessor: ZplProcessorService,
    private readonly studioProcessor: StudioProcessorService,
    private readonly elementsProcessor: ElementsProcessorService,
  ) {
    this.cacheEnabled = this.config.get<string>('CACHE_ENABLED', 'true') === 'true';
    this.cacheMaxSize = parseInt(this.config.get<string>('CACHE_MAX_SIZE', String(DEFAULT_CACHE_MAX)), 10) || DEFAULT_CACHE_MAX;
  }

  /**
   * Processa template e retorna ZPL.
   * Se dto.zpl for enviado, usa esse conteúdo; senão tenta obter por templateId (store interno ou futuro DB).
   */
  async process(
    templateId: string,
    data: Record<string, string | number>,
    type: 'etiqueta_validade' | 'rotulo_studio',
    zplContent?: string,
  ): Promise<{ zpl: string; processedAt: string }> {
    const cacheKey = this.buildCacheKey(templateId, data, type);
    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return { zpl: cached, processedAt: new Date().toISOString() };
    }

    if (type === 'rotulo_studio') {
      const imageBase64 = (data?.imagem as string) || (data?.image as string);
      if (!imageBase64) {
        throw new Error('Template rotulo_studio requer campo "imagem" ou "image" em base64');
      }
      const { zpl } = await this.studioProcessor.render(imageBase64, data);
      if (this.cacheEnabled) this.setCache(cacheKey, zpl);
      return { zpl, processedAt: new Date().toISOString() };
    }

    const zpl = zplContent || this.getTemplateById(templateId);
    if (!zpl) {
      throw new Error(`Template não encontrado: ${templateId}. Envie o campo "zpl" no body ou registre o template.`);
    }

    const processed = this.zplProcessor.process(zpl, data);
    if (this.cacheEnabled) this.setCache(cacheKey, processed);
    return { zpl: processed, processedAt: new Date().toISOString() };
  }

  /**
   * Renderiza template Studio (PNG → ZPL). Endpoint dedicado.
   * 
   * ⚡ Suporta ZPL híbrido:
   * - Elementos estáticos → Imagem GRF
   * - Campos dinâmicos (dynamicFields) → Texto ZPL nativo
   * 
   * Se labelLayout.columns > 1, repete a mesma imagem N vezes na mesma linha (bobina multi-coluna).
   */
  async renderStudio(
    templateId: string,
    data: Record<string, string | number>,
    imageBase64?: string,
    labelLayout?: { 
      columns?: number; 
      columnGap?: number; 
      labelWidth?: number; 
      labelHeight?: number;
      widthMm?: number;
      heightMm?: number;
      dynamicFields?: Array<{
        name: string;
        x: number;
        y: number;
        fontSize: number;
        fontFamily?: string;
        textAlign?: 'left' | 'center' | 'right';
        color?: string;
        width?: number;
      }>;
    },
  ): Promise<{ zpl: string; imageSize: { width: number; height: number }; success: boolean }> {
    const img = imageBase64 || (data?.imagem as string) || (data?.image as string);
    if (!img) {
      throw new Error('Campo imagem/imagemBase64 é obrigatório para render Studio');
    }
    
    // Extrair dimensões (suporta ambos os formatos)
    const widthMm = labelLayout?.labelWidth || labelLayout?.widthMm;
    const heightMm = labelLayout?.labelHeight || labelLayout?.heightMm;
    
    const options = {
      ...(widthMm && { widthMm }),
      ...(heightMm && { heightMm }),
      dynamicFields: labelLayout?.dynamicFields,
    };
    
    const result = await this.studioProcessor.render(img, data, options);
    let zpl = result.zpl;
    
    // Multi-coluna se configurado
    if (labelLayout && labelLayout.columns && labelLayout.columns > 1) {
      const zpls = Array(labelLayout.columns).fill(zpl);
      zpl = this.composeMultiColumn(zpls, {
        columns: labelLayout.columns,
        columnGap: labelLayout.columnGap || 0,
        labelWidth: widthMm || 50,
        labelHeight: heightMm || 30,
      }, 'mm');
    }
    
    return {
      zpl,
      imageSize: result.imageSize,
      success: true,
    };
  }

  /**
   * Processa template tipo elements: { size, elements } + data → ZPL.
   * Usado para preview e impressão de templates baseados em lista de elementos.
   */
  async processElements(
    template: { size: TemplateSizeDto; elements: TemplateElementDto[] },
    data: Record<string, string | number>,
  ): Promise<string> {
    return this.elementsProcessor.process(template, data);
  }

  /**
   * Obtém informações de um template (store interno; futuro: DB).
   */
  getTemplateInfo(id: string): TemplateInfo | null {
    const zpl = this.getTemplateById(id);
    if (!zpl) return null;
    const variables = this.extractVariables(zpl);
    return {
      id,
      name: `Template ${id}`,
      type: 'etiqueta_validade',
      variables,
      createdAt: new Date().toISOString(),
    };
  }

  getCacheStats(): { enabled: boolean; size: number; maxSize: number } {
    return {
      enabled: this.cacheEnabled,
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
    };
  }

  private getTemplateById(id: string): string | null {
    // Por enquanto sem DB: templates devem ser enviados no body (zpl).
    // Opcional: store em memória via registerTemplate (não exposto na API v1).
    return null;
  }

  private buildCacheKey(templateId: string, data: Record<string, string | number>, type: string): string {
    const dataStr = JSON.stringify(data);
    return `${type}:${templateId}:${dataStr}`;
  }

  private setCache(key: string, zpl: string): void {
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, zpl);
  }

  private extractVariables(zpl: string): string[] {
    const re = /\{\{\s*(\w+)\s*\}\}|\$\{\s*(\w+)\s*\}/g;
    const vars = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = re.exec(zpl)) !== null) {
      vars.add(m[1] || m[2] || '');
    }
    return Array.from(vars);
  }

  /**
   * Compõe um único ZPL para uma linha de bobina com N colunas.
   * Recebe N ZPLs (um por coluna), aplica offset em X a cada um e monta ^XA^PW...^LL... ... ^XZ.
   * Usado para impressão correta de bobinas com múltiplas colunas (elements e studio).
   */
  composeMultiColumn(
    zpls: string[],
    labelLayout: { columns: number; columnGap: number; labelWidth: number; labelHeight: number },
    unit: 'mm' | 'inches' = 'mm',
  ): string {
    const { columns, columnGap, labelWidth, labelHeight } = labelLayout;
    if (columns < 1 || zpls.length !== columns) {
      throw new Error(
        `labelLayout.columns (${columns}) deve ser >= 1 e zpls.length (${zpls.length}) deve ser igual a columns`,
      );
    }
    // 203 DPI: 1 mm ≈ 8 dots, 1 inch = 203 dots
    const scale = unit === 'inches' ? 203 : 8;
    const labelWidthDots = Math.round(labelWidth * scale);
    const labelHeightDots = Math.round(labelHeight * scale);
    const columnGapDots = Math.round(columnGap * scale);
    const w = labelWidthDots;
    const h = labelHeightDots;
    const gap = columnGapDots;
    const totalWidthDots = columns * w + (columns - 1) * gap;

    const parts: string[] = [];
    for (let col = 0; col < columns; col++) {
      const offsetX = col * (w + gap);
      const inner = this.stripXaXz(zpls[col] || '');
      const shifted = this.addOffsetToFo(inner, offsetX, 0);
      parts.push(shifted);
    }

    return `^XA^PW${totalWidthDots}^LL${labelHeightDots}\n${parts.join('\n')}\n^XZ`;
  }

  /** Remove envelope ^XA e ^XZ do ZPL, retornando só o conteúdo. */
  private stripXaXz(zpl: string): string {
    return zpl.replace(/^\^XA\r?\n?/i, '').replace(/\r?\n?\^XZ\s*$/i, '').trim();
  }

  /** Soma offsetX e offsetY a todas as coordenadas em comandos ^FO do ZPL. */
  private addOffsetToFo(zpl: string, offsetX: number, offsetY: number): string {
    return zpl.replace(/\^FO(\d+),(\d+)(?:,(\d+))?/gi, (_, x, y, z) => {
      const nx = parseInt(x, 10) + offsetX;
      const ny = parseInt(y, 10) + offsetY;
      return z !== undefined ? `^FO${nx},${ny},${z}` : `^FO${nx},${ny}`;
    });
  }
}
