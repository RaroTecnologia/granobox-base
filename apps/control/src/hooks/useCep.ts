import { useState, useCallback } from 'react';
import { cepService, type AddressData } from '../services/cep';

interface UseCepReturn {
  /** Dados do endereço encontrado */
  addressData: AddressData | null;
  /** Estado de loading durante a busca */
  isLoading: boolean;
  /** Mensagem de erro, se houver */
  error: string | null;
  /** Função para buscar o CEP */
  searchCep: (cep: string) => Promise<void>;
  /** Função para limpar os dados */
  clearData: () => void;
  /** Função para validar formato do CEP */
  isValidCep: (cep: string) => boolean;
}

/**
 * Hook para busca de endereço por CEP usando a API ViaCEP
 * 
 * @example
 * ```tsx
 * const { addressData, isLoading, error, searchCep } = useCep();
 * 
 * const handleCepChange = async (cep: string) => {
 *   if (cep.replace(/\D/g, '').length === 8) {
 *     await searchCep(cep);
 *   }
 * };
 * ```
 */
export function useCep(): UseCepReturn {
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCep = useCallback(async (cep: string) => {
    if (!cep || !cepService.isValidCep(cep)) {
      setError('CEP inválido');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAddressData(null);

    try {
      const data = await cepService.searchCep(cep);
      setAddressData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar CEP';
      setError(errorMessage);
      setAddressData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setAddressData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const isValidCep = useCallback((cep: string) => {
    return cepService.isValidCep(cep);
  }, []);

  return {
    addressData,
    isLoading,
    error,
    searchCep,
    clearData,
    isValidCep,
  };
}
