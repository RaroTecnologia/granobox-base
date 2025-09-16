import { api } from './api';

export interface Plan {
  id: string;
  name: string;
  description?: string;
  type: 'basic' | 'professional' | 'enterprise';
  price: number;
  currency: string;
  period: 'monthly' | 'annual';
  maxOperations: number;
  maxLabelsPerMonth: number;
  maxUsers: number;
  hasSupport: boolean;
  hasAdvancedAnalytics: boolean;
  hasCustomBranding: boolean;
  isActive: boolean;
  features?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanRequest {
  name: string;
  description?: string;
  type: 'basic' | 'professional' | 'enterprise';
  price: number;
  currency?: string;
  period?: 'monthly' | 'annual';
  maxOperations?: number;
  maxLabelsPerMonth?: number;
  maxUsers?: number;
  hasSupport?: boolean;
  hasAdvancedAnalytics?: boolean;
  hasCustomBranding?: boolean;
  isActive?: boolean;
  features?: Record<string, any>;
}

export interface UpdatePlanRequest extends Partial<CreatePlanRequest> {}

class PlansService {
  async getPlans(): Promise<Plan[]> {
    const response = await api.get<Plan[]>('/plans');
    return response.data;
  }

  async getActivePlans(): Promise<Plan[]> {
    const response = await api.get<Plan[]>('/plans/active');
    return response.data;
  }

  async getPlan(id: string): Promise<Plan> {
    const response = await api.get<Plan>(`/plans/${id}`);
    return response.data;
  }

  async getPlanByType(type: string): Promise<Plan> {
    const response = await api.get<Plan>(`/plans/type/${type}`);
    return response.data;
  }

  async createPlan(data: CreatePlanRequest): Promise<Plan> {
    const response = await api.post<Plan>('/plans', data);
    return response.data;
  }

  async updatePlan(id: string, data: UpdatePlanRequest): Promise<Plan> {
    const response = await api.patch<Plan>(`/plans/${id}`, data);
    return response.data;
  }

  async deletePlan(id: string): Promise<void> {
    await api.delete(`/plans/${id}`);
  }
}

export const plansService = new PlansService();