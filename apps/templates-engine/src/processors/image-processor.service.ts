import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import { rgbaToZ64 } from 'zpl-image';

export interface ImageToZplOptions {
  widthMm?: number;
  heightMm?: number;
  dpi?: number;
}

export interface Z64Result {
  z64: string;
  totalBytes: number;
  bytesPerRow: number;
  width: number;
  height: number;
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
   * @deprecated Use prepareForZ64 para gerar Z64 comprimido (muito menor)
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

  /**
   * Prepara imagem para ZPL usando formato Z64 comprimido.
   * Retorna dados Z64 prontos para uso com ^GFA.
   * 
   * Z64 usa compressão zlib + base64, resultando em arquivos ~95% menores
   * que o formato HEX tradicional.
   * 
   * IMPORTANTE: rgbaToZ64 espera dados RGBA (4 bytes/pixel).
   * Usamos grayscale + conversão manual para RGBA (igual ao Tagment).
   */
  async prepareForZ64(
    imageBuffer: Buffer,
    options: ImageBoxOptions = {},
  ): Promise<Z64Result> {
    const { widthMm = 50, heightMm = 30, dpi = 203, fit = 'contain', align = 'center', offsetX = 0, offsetY = 0, scale = 100 } = options;
    const widthPx = Math.round((widthMm / 25.4) * dpi);
    const heightPx = Math.round((heightMm / 25.4) * dpi);
    const scaleFactor = scale / 100;
    const targetW = Math.max(1, Math.round(widthPx * scaleFactor));
    const targetH = Math.max(1, Math.round(heightPx * scaleFactor));

    // Função auxiliar para converter grayscale para RGBA
    // rgbaToZ64 espera 4 bytes/pixel (RGBA), mas grayscale tem apenas 1 byte/pixel
    const grayscaleToRgba = (grayBuffer: Buffer, width: number, height: number): Uint8Array => {
      const rgbaArray = new Uint8Array(width * height * 4);
      for (let i = 0; i < grayBuffer.length; i++) {
        const value = grayBuffer[i];
        rgbaArray[i * 4] = value;     // R
        rgbaArray[i * 4 + 1] = value; // G
        rgbaArray[i * 4 + 2] = value; // B
        rgbaArray[i * 4 + 3] = 255;   // A (opaco)
      }
      return rgbaArray;
    };

    // Processar imagem com sharp - grayscale SEM ensureAlpha (1 canal apenas)
    // NÃO usar .threshold() - a biblioteca zpl-image faz a conversão internamente
    const grayBuffer = await sharp(imageBuffer)
      .resize(targetW, targetH, {
        fit: fit === 'cover' ? 'cover' : fit === 'fill' ? 'fill' : 'contain',
        background: { r: 255, g: 255, b: 255 },
      })
      .grayscale()
      .raw()
      .toBuffer();

    // Se contain e imagem menor que a caixa, criar canvas e centralizar
    if (fit === 'contain' && (targetW < widthPx || targetH < heightPx)) {
      // Criar canvas branco do tamanho da caixa (RGBA, depois converter para grayscale)
      const canvasGray = await sharp({
        create: {
          width: widthPx,
          height: heightPx,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite([
          {
            input: await sharp(imageBuffer)
              .resize(targetW, targetH, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
              .toBuffer(),
            left: align === 'left' ? 0 : align === 'right' ? widthPx - targetW : Math.floor((widthPx - targetW) / 2),
            top: Math.floor((heightPx - targetH) / 2),
          },
        ])
        .grayscale()
        .raw()
        .toBuffer();

      // Converter grayscale para RGBA
      const rgbaArray = grayscaleToRgba(canvasGray, widthPx, heightPx);

      // Converter para Z64
      const z64Result = rgbaToZ64(rgbaArray, widthPx, { notrim: true });

      return {
        z64: z64Result.z64,
        totalBytes: z64Result.length,
        bytesPerRow: z64Result.rowlen,
        width: z64Result.width,
        height: z64Result.height,
      };
    }

    // Converter grayscale para RGBA
    const rgbaArray = grayscaleToRgba(grayBuffer, targetW, targetH);

    // Converter para Z64 usando zpl-image
    const z64Result = rgbaToZ64(rgbaArray, targetW, { notrim: true });

    return {
      z64: z64Result.z64,
      totalBytes: z64Result.length,
      bytesPerRow: z64Result.rowlen,
      width: z64Result.width,
      height: z64Result.height,
    };
  }
}
