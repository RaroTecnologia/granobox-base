import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface Operator {
  id: string;
  name: string;
  pin: string;
  phone?: string;
  email?: string;
  department?: string;
  isActive: boolean;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperatorRequest {
  name: string;
  pin: string;
  phone?: string;
  email?: string;
  department?: string;
  isActive?: boolean;
  clientId: string;
}

export interface UpdateOperatorRequest extends Partial<CreateOperatorRequest> {}

export function useOperators(clientId?: string) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOperators = useCallback(async () => {
    if (!clientId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/operators?clientId=${clientId}`);
      setOperators(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar operadores');
      console.error('Erro ao carregar operadores:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  const createOperator = useCallback(async (data: CreateOperatorRequest): Promise<Operator> => {
    try {
      const response = await api.post('/operators', data);
      const newOperator = response.data;
      setOperators(prev => [...prev, newOperator]);
      return newOperator;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao criar operador';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateOperator = useCallback(async (id: string, data: UpdateOperatorRequest): Promise<Operator> => {
    try {
      const response = await api.patch(`/operators/${id}`, data);
      const updatedOperator = response.data;
      setOperators(prev => prev.map(op => op.id === id ? updatedOperator : op));
      return updatedOperator;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar operador';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteOperator = useCallback(async (id: string): Promise<void> => {
    try {
      await api.delete(`/operators/${id}`);
      setOperators(prev => prev.filter(op => op.id !== id));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao excluir operador';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const validatePin = useCallback(async (id: string, pin: string): Promise<boolean> => {
    try {
      const response = await api.post(`/operators/${id}/validate-pin`, { pin });
      return response.data;
    } catch (err: any) {
      console.error('Erro ao validar PIN:', err);
      return false;
    }
  }, []);

  const authenticateOperator = useCallback(async (clientId: string, pin: string): Promise<Operator | null> => {
    try {
      const response = await api.post('/operators/authenticate', { clientId, pin });
      return response.data;
    } catch (err: any) {
      console.error('Erro ao autenticar operador:', err);
      return null;
    }
  }, []);

  const getOperatorById = useCallback((id: string): Operator | undefined => {
    return operators.find(operator => operator.id === id);
  }, [operators]);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  return {
    operators,
    isLoading,
    error,
    fetchOperators,
    createOperator,
    updateOperator,
    deleteOperator,
    validatePin,
    authenticateOperator,
    getOperatorById,
  };
}
