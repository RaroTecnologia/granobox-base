import { useState, useEffect } from 'react';
import { subscriptionsService } from '../services/subscriptionsService';
import type { 
  Plan, 
  Subscription, 
  Operation, 
  CreateSubscriptionRequest, 
  UpdateSubscriptionRequest, 
  CreateOperationRequest, 
  UpdateOperationRequest 
} from '../services/subscriptionsService';
import { toast } from 'react-hot-toast';

export function useSubscriptions(clientId?: string) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Plans
  const loadPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const plansData = await subscriptionsService.getActivePlans();
      setPlans(plansData);
      return plansData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar planos';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Subscriptions
  const loadSubscriptionsByClient = async (clientId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const subscriptionsData = await subscriptionsService.getSubscriptionsByClient(clientId);
      setSubscriptions(subscriptionsData);
      return subscriptionsData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar assinaturas';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveSubscriptionByClient = async (clientId: string): Promise<Subscription | null> => {
    try {
      setError(null);
      return await subscriptionsService.getActiveSubscriptionByClient(clientId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar assinatura ativa';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const createSubscription = async (data: CreateSubscriptionRequest): Promise<Subscription> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newSubscription = await subscriptionsService.createSubscription(data);
      setSubscriptions(prev => [newSubscription, ...prev]);
      
      toast.success('Assinatura criada com sucesso!');
      return newSubscription;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao criar assinatura';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubscription = async (id: string, data: UpdateSubscriptionRequest): Promise<Subscription> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedSubscription = await subscriptionsService.updateSubscription(id, data);
      setSubscriptions(prev => 
        prev.map(sub => sub.id === id ? updatedSubscription : sub)
      );
      
      toast.success('Assinatura atualizada com sucesso!');
      return updatedSubscription;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar assinatura';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async (id: string): Promise<Subscription> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cancelledSubscription = await subscriptionsService.cancelSubscription(id);
      setSubscriptions(prev => 
        prev.map(sub => sub.id === id ? cancelledSubscription : sub)
      );
      
      toast.success('Assinatura cancelada com sucesso!');
      return cancelledSubscription;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao cancelar assinatura';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const activateSubscription = async (id: string): Promise<Subscription> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const activatedSubscription = await subscriptionsService.activateSubscription(id);
      setSubscriptions(prev => 
        prev.map(sub => sub.id === id ? activatedSubscription : sub)
      );
      
      toast.success('Assinatura ativada com sucesso!');
      return activatedSubscription;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao ativar assinatura';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubscription = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await subscriptionsService.deleteSubscription(id);
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      
      toast.success('Assinatura excluída com sucesso!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao excluir assinatura';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Operations
  const loadOperationsByClient = async (clientId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const operationsData = await subscriptionsService.getOperationsByClient(clientId);
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

  const createOperation = async (data: CreateOperationRequest): Promise<Operation> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newOperation = await subscriptionsService.createOperation(data);
      setOperations(prev => [newOperation, ...prev]);
      
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
      
      const updatedOperation = await subscriptionsService.updateOperation(id, data);
      setOperations(prev => 
        prev.map(op => op.id === id ? updatedOperation : op)
      );
      
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

  const deleteOperation = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await subscriptionsService.deleteOperation(id);
      setOperations(prev => prev.filter(op => op.id !== id));
      
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
    // State
    plans,
    subscriptions,
    operations,
    isLoading,
    error,
    
    // Plans
    loadPlans,
    
    // Subscriptions
    loadSubscriptionsByClient,
    getActiveSubscriptionByClient,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    activateSubscription,
    deleteSubscription,
    
    // Operations
    loadOperationsByClient,
    createOperation,
    updateOperation,
    deleteOperation,
  };
}
