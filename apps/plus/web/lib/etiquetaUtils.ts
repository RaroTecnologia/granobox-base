/**
 * Utilitários para geração e gerenciamento de etiquetas
 */

// Caracteres que são fáceis de ler (sem 0, O, 1, I, etc.)
const LETRAS_AMIGAVEIS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const NUMEROS_AMIGAVEIS = '23456789';

/**
 * Gera um código amigável de 6 caracteres para etiquetas
 * Formato: L-N-L-N-L-N (Letra-Número-Letra-Número-Letra-Número)
 * Exemplos: A2B4C6, H3K7M9, D5F8J2
 */
export function gerarCodigoEtiqueta(): string {
  let codigo = '';
  
  // Gerar 6 caracteres alternando letras e números
  for (let i = 0; i < 6; i++) {
    if (i % 2 === 0) {
      // Posições pares (0, 2, 4): letras maiúsculas
      codigo += LETRAS_AMIGAVEIS[Math.floor(Math.random() * LETRAS_AMIGAVEIS.length)];
    } else {
      // Posições ímpares (1, 3, 5): números
      codigo += NUMEROS_AMIGAVEIS[Math.floor(Math.random() * NUMEROS_AMIGAVEIS.length)];
    }
  }
  
  return codigo;
}

/**
 * Gera um código de lote amigável
 * Formato: LOTE-YYYYMMDD-HHMM
 * Exemplo: LOTE-20241220-1430
 */
export function gerarCodigoLote(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  
  return `LOTE-${ano}${mes}${dia}-${hora}${minuto}`;
}

/**
 * Calcula data de validade padrão (1 ano a partir de hoje)
 */
export function calcularDataValidadePadrao(): string {
  const hoje = new Date();
  const umAno = new Date(hoje.getTime() + 365 * 24 * 60 * 60 * 1000);
  return umAno.toISOString().split('T')[0];
}

/**
 * Formata data para exibição amigável (DD/MM/YYYY)
 */
export function formatarDataAmigavel(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * Valida se um código de etiqueta está no formato correto
 */
export function validarCodigoEtiqueta(codigo: string): boolean {
  const regex = /^[A-Z][0-9][A-Z][0-9][A-Z][0-9]$/;
  return regex.test(codigo);
}

/**
 * Gera um código único verificando se já existe
 */
export function gerarCodigoUnico(codigosExistentes: string[]): string {
  let codigo: string;
  let tentativas = 0;
  const maxTentativas = 100;
  
  do {
    codigo = gerarCodigoEtiqueta();
    tentativas++;
    
    if (tentativas > maxTentativas) {
      throw new Error('Não foi possível gerar um código único após muitas tentativas');
    }
  } while (codigosExistentes.includes(codigo));
  
  return codigo;
}
