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
    
    // Verificar operações
    if (limitsService.isCriticalLimit(usage.operations, plan.maxOperations)) {
      toast.error(`Limite crítico: ${usage.operations}/${plan.maxOperations} operações utilizadas`);
    } else if (limitsService.isNearLimit(usage.operations, plan.maxOperations)) {
      toast.warning(`Atenção: ${usage.operations}/${plan.maxOperations} operações utilizadas`);
    }
    
    // Verificar etiquetas
    if (limitsService.isCriticalLimit(usage.labelsThisMonth, plan.maxLabelsPerMonth)) {
      toast.error(`Limite crítico: ${usage.labelsThisMonth}/${plan.maxLabelsPerMonth} etiquetas utilizadas este mês`);
    } else if (limitsService.isNearLimit(usage.labelsThisMonth, plan.maxLabelsPerMonth)) {
      toast.warning(`Atenção: ${usage.labelsThisMonth}/${plan.maxLabelsPerMonth} etiquetas utilizadas este mês`);
    }
    
    // Verificar usuários
    if (limitsService.isCriticalLimit(usage.users, plan.maxUsers)) {
      toast.error(`Limite crítico: ${usage.users}/${plan.maxUsers} usuários utilizados`);
    } else if (limitsService.isNearLimit(usage.users, plan.maxUsers)) {
      toast.warning(`Atenção: ${usage.users}/${plan.maxUsers} usuários utilizados`);
    }
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