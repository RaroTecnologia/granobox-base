import { Injectable } from '@nestjs/common';
import {
  TemplateSizeDto,
  TemplateElementDto,
} from '../templates/dto/elements-process.dto';
import { ImageProcessorService, type ImageAlign } from './image-processor.service';

/** Converte valor com placeholders {{var}} ou ${var} usando data */
function substituteVars(
  value: string | undefined,
  data: Record<string, string | number>,
): string {
  if (!value) return '';
  let result = value;
  for (const [key, val] of Object.entries(data)) {
    const str = val == null ? '' : String(val);
    const re1 = new RegExp(`\\{\\{\\s*${escapeRe(key)}\\s*\\}\\}`, 'gi');
    const re2 = new RegExp(`\\$\\{\\s*${escapeRe(key)}\\s*\\}`, 'gi');
    result = result.replace(re1, str).replace(re2, str);
  }
  return result;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyTextTransform(
  value: string,
  transform: string | undefined,
): string {
  if (!transform || transform === 'none') return value;
  if (transform === 'uppercase') return value.toUpperCase();
  if (transform === 'lowercase') return value.toLowerCase();
  return value;
}

/** Mapeia os 4 padrões de rotação (0, 90, 180, 270°) para orientação ZPL (N, R, I, B). */
function rotationToZplOrientation(rotation: number | undefined): 'N' | 'R' | 'I' | 'B' {
  if (rotation == null) return 'N';
  switch (rotation) {
    case 90: return 'R';
    case 180: return 'I';
    case 270: return 'B';
    default: return 'N'; // 0 ou valor inválido
  }
}

@Injectable()
export class ElementsProcessorService {
  constructor(private readonly imageProcessor: ImageProcessorService) {}

  /**
   * Gera ZPL a partir de template elements + data.
   * size.unit: mm (8 dots/mm) ou inches (203 dots/inch).
   */
  async process(
    template: { size: TemplateSizeDto; elements: TemplateElementDto[] },
    data: Record<string, string | number>,
  ): Promise<string> {
    const unit = template.size.unit || 'mm';
    const scale = unit === 'inches' ? 203 : 8;
    const pw = Math.round(template.size.w * scale);
    const ll = Math.round(template.size.h * scale);

    const parts: string[] = ['^XA', '^CI28', `^PW${pw}^LL${ll}`];

    for (const el of template.elements) {
      const x = Math.round(el.x * scale);
      const y = Math.round(el.y * scale);
      const w = el.width != null ? Math.round(el.width * scale) : null;
      const h = el.height != null ? Math.round(el.height * scale) : null;

      const valueFromVar = el.linkedVariable
        ? (data[el.linkedVariable] != null ? String(data[el.linkedVariable]) : '')
        : null;
      let rawValue = valueFromVar ?? el.value ?? '';
      rawValue = substituteVars(rawValue, data);
      const value = applyTextTransform(rawValue, el.textTransform);

      if (el.hideIfEmpty && !value.trim()) continue;

      switch (el.type) {
        case 'text':
          parts.push(this.zplText(x, y, value, el, scale));
          break;
        case 'qr':
          parts.push(this.zplQr(x, y, value, el, scale));
          break;
        case 'barcode':
          parts.push(this.zplBarcode(x, y, value, el, scale));
          break;
        case 'line':
          parts.push(this.zplLine(x, y, el, scale));
          break;
        case 'shape':
          parts.push(this.zplShape(x, y, el, scale));
          break;
        case 'image':
          parts.push(await this.zplImage(x, y, el, scale, data));
          break;
        default:
          break;
      }
    }

    parts.push('^XZ');

    return parts.join('\n');
  }

  private zplText(
    x: number,
    y: number,
    value: string,
    el: TemplateElementDto,
    scale: number,
  ): string {
    const fontH = el.fontSize != null ? Math.max(1, Math.round(el.fontSize)) : 15;
    const fontW = Math.round(fontH * 0.8);
    const escaped = this.escapeZplFd(value);
    const orient = rotationToZplOrientation(el.rotation);
    const align = el.align ?? el.alignment ?? 'left';
    const blockW = el.fieldWidth != null ? Math.round(el.fieldWidth * scale) : (el.width != null ? Math.round(el.width * scale) : 200);
    const maxL = el.maxLines != null ? Math.max(1, Math.round(el.maxLines)) : 1;
    let out = `^FO${x},${y}^A0${orient},${fontH},${fontW}`;
    if (align === 'center' || align === 'right' || maxL > 1) {
      const just = align === 'center' ? 'C' : align === 'right' ? 'R' : 'L';
      out += `^FB${blockW},${maxL},0,${just},0`;
    }
    out += `^FD${escaped}^FS`;
    return out;
  }

  private zplQr(
    x: number,
    y: number,
    value: string,
    el: TemplateElementDto,
    scale: number,
  ): string {
    const size = el.width != null ? Math.max(1, Math.min(10, Math.round((el.width * scale) / 20))) : 4;
    const orient = rotationToZplOrientation(el.rotation);
    const rotMap = { N: 'N', R: 'R', I: 'I', B: 'B' };
    return `^FO${x},${y}^BQ${rotMap[orient]},2,${size}^FDQA,${this.escapeZplFd(value)}^FS`;
  }

  private zplBarcode(
    x: number,
    y: number,
    value: string,
    el: TemplateElementDto,
    scale: number,
  ): string {
    const height = el.height != null ? Math.round(el.height * scale) : 50;
    const showText = el.showText !== false ? 'Y' : 'N';
    const escaped = this.escapeZplFd(value);
    const type = (el.barcodeType || 'code128').toLowerCase();
    if (type.includes('128') || type === 'code128') {
      return `^FO${x},${y}^BCN,${height},${showText},N,N^FD${escaped}^FS`;
    }
    if (type.includes('39') || type === 'code39') {
      return `^FO${x},${y}^B3N,N,${height},${showText}^FD${escaped}^FS`;
    }
    return `^FO${x},${y}^BCN,${height},${showText},N,N^FD${escaped}^FS`;
  }

  private zplLine(x: number, y: number, el: TemplateElementDto, scale: number): string {
    const w = el.width != null ? Math.round(el.width * scale) : 100;
    const t = el.thickness != null ? Math.max(1, Math.round(el.thickness * scale)) : 2;
    const h = el.height != null ? Math.round(el.height * scale) : t;
    const gb = h <= t ? `^GB${w},${t},${t}` : `^GB${t},${h},${t}`;
    const color = this.zplColor(el.color);
    return `^FO${x},${y}${color}${gb}^FS`;
  }

  private zplShape(x: number, y: number, el: TemplateElementDto, scale: number): string {
    const w = el.width != null ? Math.round(el.width * scale) : 50;
    const h = el.height != null ? Math.round(el.height * scale) : 30;
    const t = el.strokeWidth != null ? Math.max(1, Math.round(el.strokeWidth * scale)) : 2;
    const color = this.zplColor(el.color);
    return `^FO${x},${y}${color}^GB${w},${h},${t}^FS`;
  }

  private async zplImage(
    x: number,
    y: number,
    el: TemplateElementDto,
    scale: number,
    data: Record<string, string | number>,
  ): Promise<string> {
    const widthMm = el.width != null ? el.width : 20;
    const heightMm = el.height != null ? el.height : 20;

    let imageBase64: string | undefined = el.imageData;
    if (!imageBase64 && el.value) {
      const varName = this.extractImageVariable(el.value);
      if (varName && data[varName] != null) imageBase64 = String(data[varName]);
    }
    if (!imageBase64) return '';

    try {
      const buffer = this.imageProcessor.base64ToBuffer(imageBase64);
      const fit = el.imageFit ?? 'contain';
      const alignRaw = el.imageAlign ?? 'center';
      const align: ImageAlign = alignRaw === 'left' || alignRaw === 'right' ? alignRaw : 'center';
      const { buffer: rawBuffer, width, height } = await this.imageProcessor.prepareForZplBox(buffer, {
        widthMm,
        heightMm,
        fit,
        align,
        offsetX: el.imageOffsetX ?? 0,
        offsetY: el.imageOffsetY ?? 0,
        scale: el.imageScale ?? 100,
      });
      const hex = this.imageProcessor.rawToHex(rawBuffer);
      const totalBytes = rawBuffer.length;
      const bytesPerRow = width;
      const gfa = `${totalBytes},${bytesPerRow},${height},${hex}`;
      const xDots = Math.round(x);
      const yDots = Math.round(y);
      return `^FO${xDots},${yDots}^GFA,${gfa}^FS`;
    } catch {
      return '';
    }
  }

  private extractImageVariable(value: string): string | null {
    const m = value.trim().match(/\{\{\s*(\w+)\s*\}\}|\$\{\s*(\w+)\s*\}/);
    return m ? (m[1] || m[2] || null) : null;
  }

  private escapeZplFd(s: string): string {
    return s
      .replace(/\\/g, '~5C')
      .replace(/\^/g, '~5E')
      .replace(/~/g, '~7E')
      .replace(/&/g, '~26');
  }

  /** Cor: preto (default, sem comando) ou branco/invertido (^FR) */
  private zplColor(color: string | undefined): string {
    if (!color || !color.trim()) return '';
    const c = color.trim().toLowerCase();
    if (c === 'white') return '^FR';
    return ''; // black ou qualquer outro = preto
  }
}
