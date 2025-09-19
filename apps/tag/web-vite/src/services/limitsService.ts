import { api } from './api';

export interface PlanLimits {
  plan: {
    name: string;
    type: string;
    maxOperations: number;
    maxLabelsPerMonth: number;
    maxUsers: number;
  };
  usage: {
    operations: number;
    users: number;
    labelsThisMonth: number;
  };
  available: {
    operations: number;
    users: number;
    labelsThisMonth: number;
  };
}

class LimitsService {
  async getClientLimits(clientId: string): Promise<PlanLimits> {
    const response = await api.get<PlanLimits>(`/limits/client/${clientId}`);
    return response.data;
  }

  // Verificar se uma ação pode ser executada baseada nos limites
  async canCreateOperation(clientId: string): Promise<boolean> {
    try {
      const limits = await this.getClientLimits(clientId);
      return limits.available.operations > 0;
    } catch (error) {
      console.error('Erro ao verificar limite de operações:', error);
      return false;
    }
  }

  async canPrintLabels(clientId: string, quantity: number): Promise<boolean> {
    try {
      const limits = await this.getClientLimits(clientId);
      return limits.available.labelsThisMonth >= quantity;
    } catch (error) {
      console.error('Erro ao verificar limite de etiquetas:', error);
      return false;
    }
  }

  // Calcular percentual de uso
  getUsagePercentage(used: number, max: number): number {
    return Math.round((used / max) * 100);
  }

  // Verificar se está próximo do limite (70% ou mais)
  isNearLimit(used: number, max: number): boolean {
    return this.getUsagePercentage(used, max) >= 70;
  }

  // Verificar se atingiu o limite crítico (90% ou mais)
  isCriticalLimit(used: number, max: number): boolean {
    return this.getUsagePercentage(used, max) >= 90;
  }
}

export const limitsService = new LimitsService();








