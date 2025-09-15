import { useState, useEffect } from 'react';
import { operationsService, Operation, CreateOperationRequest, UpdateOperationRequest } from '../services/operationsService';
import { toast } from 'react-hot-toast';

export function useOperations() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [activeOperations, setActiveOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOperations = async (clientId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let operationsData: Operation[];
      if (clientId) {
        operationsData = await operationsService.getOperationsByClient(clientId);
      } else {
        operationsData = await operationsService.getOperations();
      }
      
      setOperations(operationsData);
      return operationsData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar operações';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveOperations = async (clientId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let activeOperationsData: Operation[];
      if (clientId) {
        activeOperationsData = await operationsService.getActiveOperationsByClient(clientId);
      } else {
        const allOperations = await operationsService.getOperations();
        activeOperationsData = allOperations.filter(op => op.status === 'active' && op.isActive);
      }
      
      setActiveOperations(activeOperationsData);
      return activeOperationsData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar operações ativas';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createOperation = async (data: CreateOperationRequest): Promise<Operation> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newOperation = await operationsService.createOperation(data);
      setOperations(prev => [newOperation, ...prev]);
      
      if (newOperation.status === 'active' && newOperation.isActive) {
        setActiveOperations(prev => [newOperation, ...prev]);
      }
      
      toast.success('Operação criada com sucesso!');
      return newOperation;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao criar operação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateOperation = async (id: string, data: UpdateOperationRequest): Promise<Operation> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedOperation = await operationsService.updateOperation(id, data);
      
      setOperations(prev => 
        prev.map(op => op.id === id ? updatedOperation : op)
      );
      
      setActiveOperations(prev => {
        if (updatedOperation.status === 'active' && updatedOperation.isActive) {
          return prev.map(op => op.id === id ? updatedOperation : op);
        } else {
          return prev.filter(op => op.id !== id);
        }
      });
      
      toast.success('Operação atualizada com sucesso!');
      return updatedOperation;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar operação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const activateOperation = async (id: string): Promise<Operation> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const activatedOperation = await operationsService.activateOperation(id);
      
      setOperations(prev => 
        prev.map(op => op.id === id ? activatedOperation : op)
      );
      
      setActiveOperations(prev => {
        const exists = prev.find(op => op.id === id);
        if (exists) {
          return prev.map(op => op.id === id ? activatedOperation : op);
        } else {
          return [activatedOperation, ...prev];
        }
      });
      
      toast.success('Operação ativada com sucesso!');
      return activatedOperation;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao ativar operação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deactivateOperation = async (id: string): Promise<Operation> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const deactivatedOperation = await operationsService.deactivateOperation(id);
      
      setOperations(prev => 
        prev.map(op => op.id === id ? deactivatedOperation : op)
      );
      
      setActiveOperations(prev => prev.filter(op => op.id !== id));
      
      toast.success('Operação desativada com sucesso!');
      return deactivatedOperation;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao desativar operação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOperation = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await operationsService.deleteOperation(id);
      
      setOperations(prev => prev.filter(op => op.id !== id));
      setActiveOperations(prev => prev.filter(op => op.id !== id));
      
      toast.success('Operação excluída com sucesso!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao excluir operação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    operations,
    activeOperations,
    isLoading,
    error,
    loadOperations,
    loadActiveOperations,
    createOperation,
    updateOperation,
    activateOperation,
    deactivateOperation,
    deleteOperation,
  };
}