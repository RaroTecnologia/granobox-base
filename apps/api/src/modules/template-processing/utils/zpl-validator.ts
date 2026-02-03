/**
 * Utilitários para Validação e Correção de Código ZPL
 *
 * Previne problemas de impressão em branco garantindo que o ZPL
 * está corretamente formatado antes de ser enviado via TCP.
 */

export interface ZPLValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  corrected?: string;
}

export class ZPLValidator {
  /**
   * Valida código ZPL
   */
  static validate(zpl: string): ZPLValidationResult {
    const result: ZPLValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!zpl || zpl.trim().length === 0) {
      result.isValid = false;
      result.errors.push('ZPL está vazio');
      return result;
    }

    const trimmedZpl = zpl.trim();

    // 1. Verificar ^XA (início)
    if (!trimmedZpl.startsWith('^XA')) {
      result.isValid = false;
      result.errors.push('ZPL deve começar com ^XA');
    }

    // 2. Verificar ^XZ (fim)
    if (!trimmedZpl.endsWith('^XZ')) {
      result.isValid = false;
      result.errors.push('ZPL deve terminar com ^XZ');
    }

    // 3. Verificar tamanho mínimo
    if (trimmedZpl.length < 20) {
      result.isValid = false;
      result.errors.push(`ZPL muito curto (${trimmedZpl.length} bytes)`);
    }

    // 4. Verificar se tem conteúdo entre ^XA e ^XZ
    const content = trimmedZpl.replace(/^\^XA/, '').replace(/\^XZ$/, '').trim();
    if (content.length < 10) {
      result.warnings.push('ZPL tem pouco conteúdo entre ^XA e ^XZ');
    }

    // 5. Avisos sobre encoding
    if (!trimmedZpl.includes('^CI')) {
      result.warnings.push(
        'ZPL não define encoding (^CI). Recomendado: ^CI28 para UTF-8',
      );
    }

    // 6. Verificar comandos básicos
    if (!trimmedZpl.includes('^FO') && !trimmedZpl.includes('^FT')) {
      result.warnings.push(
        'ZPL não contém comandos de posicionamento (^FO ou ^FT)',
      );
    }

    return result;
  }

  /**
   * Corrige automaticamente problemas comuns no ZPL
   */
  static autoFix(zpl: string): string {
    if (!zpl || zpl.trim().length === 0) {
      throw new Error('ZPL vazio - impossível corrigir');
    }

    let corrected = zpl.trim();

    // 1. Adicionar ^XA no início se não existir
    if (!corrected.startsWith('^XA')) {
      corrected = '^XA\n' + corrected;
    }

    // 2. Adicionar ^XZ no final se não existir
    if (!corrected.endsWith('^XZ')) {
      corrected = corrected + '\n^XZ';
    }

    // 3. Adicionar ^CI28 (UTF-8) após ^XA se não existir
    if (!corrected.includes('^CI')) {
      corrected = corrected.replace(/^\^XA/, '^XA\n^CI28');
    }

    return corrected;
  }

  /**
   * Valida e corrige ZPL em uma única operação
   */
  static validateAndFix(
    zpl: string,
    throwOnError: boolean = false,
  ): ZPLValidationResult {
    const validation = this.validate(zpl);

    if (!validation.isValid) {
      try {
        const corrected = this.autoFix(zpl);
        const revalidation = this.validate(corrected);

        if (revalidation.isValid) {
          return {
            ...validation,
            isValid: true,
            corrected,
            warnings: [
              ...validation.errors.map((err) => `CORRIGIDO: ${err}`),
              ...validation.warnings,
            ],
            errors: [],
          };
        }
      } catch (error) {
        if (throwOnError) {
          throw new Error(`Falha ao corrigir ZPL: ${error.message}`);
        }
      }
    }

    return validation;
  }

  /**
   * Extrai informações úteis do ZPL para debug
   */
  static getDebugInfo(zpl: string): Record<string, any> {
    const trimmed = zpl.trim();

    return {
      size: trimmed.length,
      lines: trimmed.split('\n').length,
      startsWithXA: trimmed.startsWith('^XA'),
      endsWithXZ: trimmed.endsWith('^XZ'),
      hasEncoding: trimmed.includes('^CI'),
      encoding: this.extractEncoding(trimmed),
      hasFieldOrigin: trimmed.includes('^FO'),
      hasFieldTypeset: trimmed.includes('^FT'),
      hasGraphicBox: trimmed.includes('^GB'),
      hasBarcode: trimmed.includes('^B'),
      hasQRCode: trimmed.includes('^BQ'),
      hasImage: trimmed.includes('^GF') || trimmed.includes('^IM'),
      firstLine: trimmed.split('\n')[0],
      lastLine: trimmed.split('\n').slice(-1)[0],
      preview: {
        first100: trimmed.substring(0, 100),
        last100: trimmed.substring(Math.max(0, trimmed.length - 100)),
      },
    };
  }

  /**
   * Extrai o encoding especificado no ZPL
   */
  private static extractEncoding(zpl: string): string | null {
    const match = zpl.match(/\^CI(\d+)/);
    if (match) {
      const code = match[1];
      const encodings: Record<string, string> = {
        '0': 'Default (USA)',
        '13': 'UTF-16',
        '14': 'UTF-16 (BE)',
        '28': 'UTF-8',
        '29': 'UTF-8 (BOM)',
      };
      return encodings[code] || `Code ${code}`;
    }
    return null;
  }

  /**
   * Formata ZPL para melhor legibilidade (para logs)
   */
  static format(zpl: string, indent: string = '  '): string {
    const lines = zpl.trim().split('\n');
    let formatted = '';
    let level = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('^XZ')) {
        level = Math.max(0, level - 1);
      }

      formatted += indent.repeat(level) + trimmedLine + '\n';

      if (trimmedLine.startsWith('^XA')) {
        level++;
      }
    }

    return formatted.trim();
  }

  /**
   * Cria um log detalhado do ZPL para debug
   */
  static createDebugLog(zpl: string, context?: string): string {
    const validation = this.validate(zpl);
    const info = this.getDebugInfo(zpl);

    let log = '═'.repeat(80) + '\n';
    log += `🔍 DEBUG ZPL ${context ? `- ${context}` : ''}\n`;
    log += '═'.repeat(80) + '\n\n';

    // Validação
    log += '📋 VALIDAÇÃO:\n';
    log += `  Status: ${validation.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n`;

    if (validation.errors.length > 0) {
      log += '  Erros:\n';
      validation.errors.forEach((err) => (log += `    ❌ ${err}\n`));
    }

    if (validation.warnings.length > 0) {
      log += '  Avisos:\n';
      validation.warnings.forEach((warn) => (log += `    ⚠️  ${warn}\n`));
    }

    log += '\n';

    // Informações
    log += '📊 INFORMAÇÕES:\n';
    log += `  Tamanho: ${info.size} bytes\n`;
    log += `  Linhas: ${info.lines}\n`;
    log += `  Encoding: ${info.encoding || 'Não especificado'}\n`;
    log += `  Começa com ^XA: ${info.startsWithXA ? '✅' : '❌'}\n`;
    log += `  Termina com ^XZ: ${info.endsWithXZ ? '✅' : '❌'}\n`;
    log += '\n';

    // Elementos
    log += '🎨 ELEMENTOS:\n';
    log += `  Campos de texto (^FO): ${info.hasFieldOrigin ? '✅' : '❌'}\n`;
    log += `  Campos tipográficos (^FT): ${info.hasFieldTypeset ? '✅' : '❌'}\n`;
    log += `  Linhas/Caixas (^GB): ${info.hasGraphicBox ? '✅' : '❌'}\n`;
    log += `  Código de barras (^B*): ${info.hasBarcode ? '✅' : '❌'}\n`;
    log += `  QR Code (^BQ): ${info.hasQRCode ? '✅' : '❌'}\n`;
    log += `  Imagens (^GF/^IM): ${info.hasImage ? '✅' : '❌'}\n`;
    log += '\n';

    // Preview
    log += '📄 PREVIEW:\n';
    log += '  Primeiros 100 caracteres:\n';
    log += `    ${info.preview.first100}\n`;
    log += '  Últimos 100 caracteres:\n';
    log += `    ${info.preview.last100}\n`;
    log += '\n';

    // ZPL completo (formatado)
    log += '📝 ZPL COMPLETO (formatado):\n';
    log += '─'.repeat(80) + '\n';
    log += this.format(zpl) + '\n';
    log += '─'.repeat(80) + '\n';

    log += '═'.repeat(80) + '\n';

    return log;
  }
}

/**
 * Exemplo de uso:
 *
 * ```typescript
 * import { ZPLValidator } from './zpl-validator';
 *
 * // Validar ZPL
 * const result = ZPLValidator.validate(zpl);
 * if (!result.isValid) {
 *   console.error('ZPL inválido:', result.errors);
 * }
 *
 * // Corrigir automaticamente
 * const zplCorrigido = ZPLValidator.autoFix(zpl);
 *
 * // Validar e corrigir
 * const resultadoCompleto = ZPLValidator.validateAndFix(zpl);
 * if (resultadoCompleto.corrected) {
 *   console.log('ZPL foi corrigido:', resultadoCompleto.warnings);
 *   zpl = resultadoCompleto.corrected;
 * }
 *
 * // Log detalhado para debug
 * console.log(ZPLValidator.createDebugLog(zpl, 'Impressão de Validade'));
 * ```
 */
