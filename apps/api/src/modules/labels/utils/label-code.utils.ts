/**
 * Utilitários para geração de códigos amigáveis de etiquetas
 */

// Caracteres que são fáceis de ler (sem 0, O, 1, I, etc.)
const FRIENDLY_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const FRIENDLY_NUMBERS = '23456789';

/**
 * Gera um código amigável de 6 caracteres para etiquetas
 * Formato: L-N-L-N-L-N (Letra-Número-Letra-Número-Letra-Número)
 * Exemplos: A2B4C6, H3K7M9, D5F8J2
 */
export function generateLabelCode(): string {
  let code = '';
  
  // Gerar 6 caracteres alternando letras e números
  for (let i = 0; i < 6; i++) {
    if (i % 2 === 0) {
      // Posições pares (0, 2, 4): letras maiúsculas
      code += FRIENDLY_LETTERS[Math.floor(Math.random() * FRIENDLY_LETTERS.length)];
    } else {
      // Posições ímpares (1, 3, 5): números
      code += FRIENDLY_NUMBERS[Math.floor(Math.random() * FRIENDLY_NUMBERS.length)];
    }
  }
  
  return code;
}

/**
 * Valida se um código segue o padrão amigável
 * @param code Código a ser validado
 * @returns true se o código é válido
 */
export function validateLabelCode(code: string): boolean {
  if (!code || code.length !== 6) {
    return false;
  }

  // Verificar padrão: Letra-Número-Letra-Número-Letra-Número
  for (let i = 0; i < 6; i++) {
    const char = code[i];
    if (i % 2 === 0) {
      // Posições pares devem ser letras
      if (!FRIENDLY_LETTERS.includes(char)) {
        return false;
      }
    } else {
      // Posições ímpares devem ser números
      if (!FRIENDLY_NUMBERS.includes(char)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Gera um código único verificando se já existe
 * @param existingCodes Array de códigos já existentes
 * @param maxAttempts Número máximo de tentativas
 * @returns Código único gerado
 */
export function generateUniqueCode(existingCodes: string[], maxAttempts: number = 100): string {
  let code: string;
  let attempts = 0;
  
  do {
    code = generateLabelCode();
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error('Não foi possível gerar um código único após muitas tentativas');
    }
  } while (existingCodes.includes(code));
  
  return code;
}




