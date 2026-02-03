import { Injectable } from '@nestjs/common';

/**
 * Processa templates ZPL puros (etiqueta_validade).
 * Substitui variáveis no formato {{nome}} ou ${nome} pelo valor em data.
 */
@Injectable()
export class ZplProcessorService {
  /**
   * Substitui variáveis no ZPL. Aceita {{var}} e ${var}.
   */
  process(zpl: string, data: Record<string, string | number>): string {
    if (!zpl || typeof zpl !== 'string') {
      throw new Error('ZPL inválido ou vazio');
    }

    let result = zpl;

    for (const [key, value] of Object.entries(data)) {
      const strValue = value == null ? '' : String(value);
      // {{key}} e ${key}
      const re1 = new RegExp(`\\{\\{\\s*${escapeRegex(key)}\\s*\\}\\}`, 'gi');
      const re2 = new RegExp(`\\$\\{\\s*${escapeRegex(key)}\\s*\\}`, 'gi');
      result = result.replace(re1, strValue).replace(re2, strValue);
    }

    return result;
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
