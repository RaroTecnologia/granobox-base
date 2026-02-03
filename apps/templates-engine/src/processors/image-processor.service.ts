import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';

export interface ImageToZplOptions {
  widthMm?: number;
  heightMm?: number;
  dpi?: number;
}

export type ImageFit = 'contain' | 'cover' | 'fill';
export type ImageAlign = 'left' | 'center' | 'right';

export interface ImageBoxOptions extends ImageToZplOptions {
  fit?: ImageFit;
  align?: ImageAlign;
  offsetX?: number;
  offsetY?: number;
  /** Escala % (50–150), default 100 */
  scale?: number;
}

/**
 * Utilitários para processamento de imagens (PNG → ZPL GF).
 * Usado pelo studio-processor para templates rotulo_studio.
 */
@Injectable()
export class ImageProcessorService {
  /**
   * Redimensiona e converte PNG buffer para formato adequado para ZPL (preenche a caixa, estica).
   * Retorna buffer raw (monocromático) para conversão em ^GFA.
   */
  async prepareForZpl(
    imageBuffer: Buffer,
    options: ImageToZplOptions = {},
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    const { widthMm = 50, heightMm = 30, dpi = 203 } = options;
    const widthPx = Math.round((widthMm / 25.4) * dpi);
    const heightPx = Math.round((heightMm / 25.4) * dpi);

    const pipeline = sharp(imageBuffer)
      .grayscale()
      .resize(widthPx, heightPx, { fit: 'fill' })
      .raw();

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    const width = info.width;
    const height = info.height;

    return { buffer: data, width, height };
  }

  /**
   * Redimensiona e posiciona a imagem na caixa (mm): fit (contain/cover/fill), align e offset.
   * Saída tem exatamente widthPx x heightPx. Usado para elemento imagem no ZPL.
   */
  async prepareForZplBox(
    imageBuffer: Buffer,
    options: ImageBoxOptions = {},
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    const { widthMm = 50, heightMm = 30, dpi = 203, fit = 'contain', align = 'center', offsetX = 0, offsetY = 0, scale = 100 } = options;
    const widthPx = Math.round((widthMm / 25.4) * dpi);
    const heightPx = Math.round((heightMm / 25.4) * dpi);
    const scaleFactor = scale / 100;
    const targetW = Math.max(1, Math.round(widthPx * scaleFactor));
    const targetH = Math.max(1, Math.round(heightPx * scaleFactor));

    if (fit === 'fill') {
      const result = await this.prepareForZpl(imageBuffer, { widthMm, heightMm, dpi });
      return result;
    }

    const pipeline = sharp(imageBuffer)
      .grayscale()
      .resize(targetW, targetH, {
        fit: fit === 'cover' ? 'cover' : 'contain',
        background: { r: 255, g: 255, b: 255 },
      })
      .raw();

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    const w2 = info.width;
    const h2 = info.height;

    const out = Buffer.alloc(widthPx * heightPx, 255);

    const alignH = (val: string | undefined): ImageAlign => {
      if (val === 'left' || val === 'right') return val;
      if (typeof val === 'string' && val.startsWith('left')) return 'left';
      if (typeof val === 'string' && val.startsWith('right')) return 'right';
      return 'center';
    };
    const a = alignH(align);

    const alignOffsetXContain = (v: ImageAlign) => {
      if (v === 'left') return 0;
      if (v === 'right') return widthPx - w2;
      return Math.floor((widthPx - w2) / 2);
    };
    const alignOffsetYContain = () => Math.floor((heightPx - h2) / 2);

    const needsCrop = w2 > widthPx || h2 > heightPx;
    if (fit === 'cover' || needsCrop) {
      const cropXBase = a === 'left' ? 0 : a === 'right' ? w2 - widthPx : Math.floor((w2 - widthPx) / 2);
      const cropYBase = Math.floor((h2 - heightPx) / 2);
      const cropX = Math.max(0, Math.min(w2 - widthPx, Math.round(cropXBase + (offsetX / 100) * widthPx)));
      const cropY = Math.max(0, Math.min(h2 - heightPx, Math.round(cropYBase + (offsetY / 100) * heightPx)));
      for (let row = 0; row < heightPx; row++) {
        const srcRow = cropY + row;
        const srcStart = srcRow * w2 + cropX;
        const dstStart = row * widthPx;
        data.copy(out, dstStart, srcStart, srcStart + widthPx);
      }
      return { buffer: out, width: widthPx, height: heightPx };
    }

    let baseX = alignOffsetXContain(a);
    let baseY = alignOffsetYContain();
    baseX = Math.round(baseX + (offsetX / 100) * widthPx);
    baseY = Math.round(baseY + (offsetY / 100) * heightPx);

    for (let row = 0; row < h2; row++) {
      const dstRow = baseY + row;
      if (dstRow < 0 || dstRow >= heightPx) continue;
      const srcStart = row * w2;
      const dstStart = dstRow * widthPx + baseX;
      for (let col = 0; col < w2; col++) {
        const dstCol = baseX + col;
        if (dstCol >= 0 && dstCol < widthPx) out[dstStart + col] = data[srcStart + col];
      }
    }
    return { buffer: out, width: widthPx, height: heightPx };
  }

  /**
   * Converte buffer raw (grayscale) em string hexadecimal para ^GFA.
   * ZPL espera bytes em hex: cada byte vira 2 caracteres hex.
   */
  rawToHex(buffer: Buffer): string {
    return buffer.toString('hex').toUpperCase();
  }

  /**
   * Converte imagem base64 (PNG) em buffer.
   */
  base64ToBuffer(base64: string): Buffer {
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }
}
