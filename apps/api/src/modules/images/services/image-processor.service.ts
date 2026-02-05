import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { rgbaToZ64 } from 'zpl-image';

export interface Z64ConversionResult {
  z64: string;
  totalBytes: number;
  bytesPerRow: number;
  widthDots: number;
  heightDots: number;
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  /**
   * Converte uma imagem para formato Z64 (ZPL Image)
   * @param imageBuffer Buffer da imagem original
   * @param targetWidth Largura alvo em pixels/dots
   * @param targetHeight Altura alvo em pixels/dots
   * @param dither (DEPRECATED - ignorado) A biblioteca zpl-image faz a conversão internamente
   * @param fit Modo de ajuste: contain (cabe sem cortar), cover (preenche cortando), fill (estica)
   * @param scale Escala em porcentagem (50-200, padrão: 100)
   * @param offsetX Deslocamento horizontal em porcentagem (-50 a 50, padrão: 0)
   * @param offsetY Deslocamento vertical em porcentagem (-50 a 50, padrão: 0)
   */
  async convertToZ64(
    imageBuffer: Buffer,
    targetWidth?: number,
    targetHeight?: number,
    dither = true,
    fit: 'contain' | 'cover' | 'fill' = 'contain',
    scale = 100,
    offsetX = 0,
    offsetY = 0,
  ): Promise<Z64ConversionResult> {
    try {
      // Obter metadata da imagem
      const metadata = await sharp(imageBuffer).metadata();
      this.logger.debug(`Imagem original: ${metadata.width}x${metadata.height}`);

      // Definir dimensões de saída
      const outputWidth = targetWidth || metadata.width || 300;
      const outputHeight = targetHeight || metadata.height || 300;

      // Aplicar escala às dimensões de processamento
      const scaleRatio = scale / 100;
      const scaledWidth = Math.round(outputWidth * scaleRatio);
      const scaledHeight = Math.round(outputHeight * scaleRatio);

      // Processar imagem com sharp - primeiro redimensionar com escala
      let resizedImage = await sharp(imageBuffer)
        .resize(scaledWidth, scaledHeight, {
          fit: fit,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png()
        .toBuffer();

      // Calcular posição com offset
      // Offset em porcentagem: -50 = totalmente à esquerda/cima, +50 = totalmente à direita/baixo
      const extraWidth = scaledWidth - outputWidth;
      const extraHeight = scaledHeight - outputHeight;
      
      // Se a imagem escalada é maior que o alvo, precisamos recortar
      // Se é menor, precisamos posicionar em uma canvas maior
      let left = 0;
      let top = 0;

      if (extraWidth > 0 || extraHeight > 0) {
        // Imagem maior que o alvo - calcular onde recortar
        // offsetX/Y de 0 = centralizado, -50 = pega da esquerda/cima, +50 = pega da direita/baixo
        left = Math.round(Math.max(0, extraWidth / 2 + (offsetX / 100) * extraWidth));
        top = Math.round(Math.max(0, extraHeight / 2 + (offsetY / 100) * extraHeight));
        
        // Garantir que não ultrapasse os limites
        left = Math.min(left, Math.max(0, scaledWidth - outputWidth));
        top = Math.min(top, Math.max(0, scaledHeight - outputHeight));

        // Recortar a região desejada
        resizedImage = await sharp(resizedImage)
          .extract({
            left,
            top,
            width: Math.min(outputWidth, scaledWidth),
            height: Math.min(outputHeight, scaledHeight),
          })
          .png()
          .toBuffer();
      }

      // Criar canvas final e compor a imagem (RGBA, depois convertemos para grayscale)
      let sharpInstance = sharp({
        create: {
          width: outputWidth,
          height: outputHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      });

      // Calcular posição para composição quando imagem é menor que alvo
      let composeLeft = 0;
      let composeTop = 0;
      
      if (scaledWidth < outputWidth || scaledHeight < outputHeight) {
        // Imagem menor que o alvo - calcular onde posicionar
        const spareWidth = outputWidth - scaledWidth;
        const spareHeight = outputHeight - scaledHeight;
        composeLeft = Math.round(Math.max(0, spareWidth / 2 + (offsetX / 100) * spareWidth));
        composeTop = Math.round(Math.max(0, spareHeight / 2 + (offsetY / 100) * spareHeight));
      }

      // Converter imagem para grayscale antes de compor
      const grayscaleInput = await sharp(resizedImage).grayscale().toBuffer();

      sharpInstance = sharpInstance.composite([
        {
          input: grayscaleInput,
          left: composeLeft,
          top: composeTop,
        },
      ]);

      // Obter buffer grayscale (1 canal)
      // NÃO usar .threshold() - a biblioteca zpl-image faz a conversão internamente
      const grayBuffer = await sharpInstance.grayscale().raw().toBuffer();

      // IMPORTANTE: rgbaToZ64 espera RGBA (4 bytes/pixel)
      // Converter grayscale (1 byte/pixel) para RGBA manualmente
      const rgbaArray = new Uint8Array(outputWidth * outputHeight * 4);
      for (let i = 0; i < grayBuffer.length; i++) {
        const value = grayBuffer[i];
        rgbaArray[i * 4] = value;     // R
        rgbaArray[i * 4 + 1] = value; // G
        rgbaArray[i * 4 + 2] = value; // B
        rgbaArray[i * 4 + 3] = 255;   // A (opaco)
      }

      // Converter para Z64 usando zpl-image
      const z64Result = rgbaToZ64(rgbaArray, outputWidth, {
        notrim: true, // Manter dimensões exatas
      });

      this.logger.debug(
        `Z64 gerado: ${z64Result.length} bytes, ${z64Result.width}x${z64Result.height} dots (scale: ${scale}%, offset: ${offsetX}/${offsetY})`,
      );

      return {
        z64: z64Result.z64,
        totalBytes: z64Result.length,
        bytesPerRow: z64Result.rowlen,
        widthDots: z64Result.width,
        heightDots: z64Result.height,
      };
    } catch (error) {
      this.logger.error(`Erro ao converter imagem para Z64: ${error.message}`);
      throw error;
    }
  }

  /**
   * Valida e extrai metadados básicos de uma imagem
   */
  async getImageMetadata(imageBuffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
  }> {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
    };
  }

  /**
   * Redimensiona uma imagem mantendo aspect ratio
   */
  async resizeImage(
    imageBuffer: Buffer,
    maxWidth: number,
    maxHeight: number,
    format: 'png' | 'jpeg' | 'webp' = 'png',
  ): Promise<Buffer> {
    return sharp(imageBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat(format)
      .toBuffer();
  }

  /**
   * Calcula dimensões em dots baseado em mm e DPI
   */
  mmToDots(mm: number, dpi = 203): number {
    return Math.round((mm / 25.4) * dpi);
  }

  /**
   * Calcula dimensões em mm baseado em dots e DPI
   */
  dotsToMm(dots: number, dpi = 203): number {
    return Number(((dots * 25.4) / dpi).toFixed(2));
  }
}
