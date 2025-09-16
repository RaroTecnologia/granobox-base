import { useState, useEffect } from 'react';
import { limitsService, PlanLimits } from '../services/limitsService';
import { toast } from 'react-hot-toast';

export function useLimits(clientId?: string) {
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLimits = async (id?: string) => {
    const targetClientId = id || clientId;
    if (!targetClientId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const limitsData = await limitsService.getClientLimits(targetClientId);
      setLimits(limitsData);
      
      // Verificar se há alertas de limite
      checkLimitAlerts(limitsData);
      
      return limitsData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar limites do plano';
      setError(errorMessage);
      console.error('Erro ao carregar limites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkLimitAlerts = (limitsData: PlanLimits) => {
    const { usage, plan } = limitsData;
    
    // Verificar operações (removido toasts chatos)
    // Os limites ainda são verificados, mas sem notificações intrusivas
    
    // Verificar etiquetas (removido toasts automáticos chatos)
    // Os limites ainda são verificados e exibidos na interface, mas sem notificações intrusivas
    
    // Verificar usuários (removido toasts automáticos chatos)
    // Os limites ainda são verificados e exibidos na interface, mas sem notificações intrusivas
  };

  const canCreateOperation = async (id?: string): Promise<boolean> => {
    const targetClientId = id || clientId;
    if (!targetClientId) return false;
    
    return await limitsService.canCreateOperation(targetClientId);
  };

  const canPrintLabels = async (quantity: number, id?: string): Promise<boolean> => {
    const targetClientId = id || clientId;
    if (!targetClientId) return false;
    
    return await limitsService.canPrintLabels(targetClientId, quantity);
  };

  const refreshLimits = () => {
    if (clientId) {
      loadLimits(clientId);
    }
  };

  // Carregar limites automaticamente quando clientId mudar
  useEffect(() => {
    if (clientId) {
      loadLimits(clientId);
    }
  }, [clientId]);

  return {
    limits,
    isLoading,
    error,
    loadLimits,
    canCreateOperation,
    canPrintLabels,
    refreshLimits,
    // Helpers para UI
    getUsagePercentage: limitsService.getUsagePercentage,
    isNearLimit: limitsService.isNearLimit,
    isCriticalLimit: limitsService.isCriticalLimit,
  };
}
