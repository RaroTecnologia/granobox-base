export interface CepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

class CepService {
  private readonly baseUrl = 'https://viacep.com.br/ws';

  async searchCep(cep: string): Promise<AddressData | null> {
    try {
      // Remove formatação do CEP
      const cleanCep = cep.replace(/\D/g, '');
      
      // Valida se o CEP tem 8 dígitos
      if (cleanCep.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }

      const response = await fetch(`${this.baseUrl}/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar CEP');
      }

      const data: CepResponse = await response.json();

      // Verifica se o CEP foi encontrado
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      // Converte para o formato usado no formulário
      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        zipCode: this.formatCep(cleanCep),
      };
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      throw error;
    }
  }

  private formatCep(cep: string): string {
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  isValidCep(cep: string): boolean {
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.length === 8;
  }
}

export const cepService = new CepService();
