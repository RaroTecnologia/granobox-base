import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TemplatesEngineProxyService {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('TEMPLATES_ENGINE_URL') ||
      'http://localhost:3002';
  }

  async postElementsProcess(body: {
    template: unknown;
    data: Record<string, string | number>;
  }): Promise<{ zpl: string; success: boolean }> {
    const res = await fetch(`${this.baseUrl}/templates/elements/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ zpl: string; success: boolean }>;
  }

  async postStudioRender(body: {
    templateId: string;
    data: Record<string, string | number>;
    imageBase64: string;
    labelLayout?: unknown;
  }): Promise<{ zpl: string; success?: boolean }> {
    const res = await fetch(`${this.baseUrl}/templates/studio/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ zpl: string; success?: boolean }>;
  }

  /**
   * Converte ZPL em imagem PNG via Labelary (preview de template Elements).
   * widthMm/heightMm em mm; Labelary espera largura/altura em polegadas.
   * Usa 24dpmm (600 DPI) para melhor qualidade de preview (textos nítidos).
   */
  async zplToPng(
    zpl: string,
    widthMm: number,
    heightMm: number,
  ): Promise<Buffer> {
    const MM_TO_IN = 1 / 25.4;
    const wIn = Math.max(0.5, Math.min(15, Math.round((widthMm * MM_TO_IN) * 100) / 100));
    const hIn = Math.max(0.5, Math.min(15, Math.round((heightMm * MM_TO_IN) * 100) / 100));
    // 24dpmm = 600 DPI para alta qualidade de preview (textos nítidos)
    // Opções: 6dpmm (152 DPI), 8dpmm (203 DPI), 12dpmm (300 DPI), 24dpmm (600 DPI)
    const url = `http://api.labelary.com/v1/printers/24dpmm/labels/${wIn}x${hIn}/0/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'image/png',
      },
      body: zpl,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Labelary: ${res.status} ${text || res.statusText}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return buf;
  }
}
