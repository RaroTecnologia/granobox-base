import { api } from './api';

// Plan interfaces
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

// Subscription interfaces
export interface Subscription {
  id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'suspended' | 'expired';
  startDate: string;
  endDate?: string;
  cancellationDate?: string;
  price: number;
  currency: string;
  billingCycle: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  planId: string;
  plan?: Plan;
  operations?: Operation[];
}

export interface CreateSubscriptionRequest {
  clientId: string;
  planId: string;
  status?: 'active' | 'inactive' | 'cancelled' | 'suspended' | 'expired';
  startDate: string;
  endDate?: string;
  price?: number;
  currency?: string;
  billingCycle?: number;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSubscriptionRequest extends Partial<CreateSubscriptionRequest> {}

// Operation interfaces
export interface Operation {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended';
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  settings?: Record<string, any>;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  subscriptionId?: string;
}

export interface CreateOperationRequest {
  clientId: string;
  subscriptionId?: string;
  name: string;
  description?: string;
  status?: 'active' | 'inactive' | 'suspended';
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  settings?: Record<string, any>;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateOperationRequest extends Partial<CreateOperationRequest> {}

// Service class
class SubscriptionsService {
  // Plans
  async getPlans(): Promise<Plan[]> {
    const response = await api.get<Plan[]>('/plans');
    return response.data;
  }

  async getActivePlans(): Promise<Plan[]> {
    const response = await api.get<Plan[]>('/plans/active');
    return response.data;
  }

  // Subscriptions
  async getSubscriptions(): Promise<Subscription[]> {
    const response = await api.get<Subscription[]>('/subscriptions');
    return response.data;
  }

  async getSubscriptionsByClient(clientId: string): Promise<Subscription[]> {
    const response = await api.get<Subscription[]>(`/subscriptions/client/${clientId}`);
    return response.data;
  }

  async getActiveSubscriptionByClient(clientId: string): Promise<Subscription | null> {
    try {
      const response = await api.get<Subscription>(`/subscriptions/client/${clientId}/active`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getSubscription(id: string): Promise<Subscription> {
    const response = await api.get<Subscription>(`/subscriptions/${id}`);
    return response.data;
  }

  async createSubscription(data: CreateSubscriptionRequest): Promise<Subscription> {
    const response = await api.post<Subscription>('/subscriptions', data);
    return response.data;
  }

  async updateSubscription(id: string, data: UpdateSubscriptionRequest): Promise<Subscription> {
    const response = await api.patch<Subscription>(`/subscriptions/${id}`, data);
    return response.data;
  }

  async cancelSubscription(id: string): Promise<Subscription> {
    const response = await api.patch<Subscription>(`/subscriptions/${id}/cancel`);
    return response.data;
  }

  async activateSubscription(id: string): Promise<Subscription> {
    const response = await api.patch<Subscription>(`/subscriptions/${id}/activate`);
    return response.data;
  }

  async suspendSubscription(id: string): Promise<Subscription> {
    const response = await api.patch<Subscription>(`/subscriptions/${id}/suspend`);
    return response.data;
  }

  async deleteSubscription(id: string): Promise<void> {
    await api.delete(`/subscriptions/${id}`);
  }

  // Operations
  async getOperations(): Promise<Operation[]> {
    const response = await api.get<Operation[]>('/operations');
    return response.data;
  }

  async getOperationsByClient(clientId: string): Promise<Operation[]> {
    const response = await api.get<Operation[]>(`/operations/client/${clientId}`);
    return response.data;
  }

  async getActiveOperationsByClient(clientId: string): Promise<Operation[]> {
    const response = await api.get<Operation[]>(`/operations/client/${clientId}/active`);
    return response.data;
  }

  async getOperation(id: string): Promise<Operation> {
    const response = await api.get<Operation>(`/operations/${id}`);
    return response.data;
  }

  async createOperation(data: CreateOperationRequest): Promise<Operation> {
    const response = await api.post<Operation>('/operations', data);
    return response.data;
  }

  async updateOperation(id: string, data: UpdateOperationRequest): Promise<Operation> {
    const response = await api.patch<Operation>(`/operations/${id}`, data);
    return response.data;
  }

  async activateOperation(id: string): Promise<Operation> {
    const response = await api.patch<Operation>(`/operations/${id}/activate`);
    return response.data;
  }

  async deactivateOperation(id: string): Promise<Operation> {
    const response = await api.patch<Operation>(`/operations/${id}/deactivate`);
    return response.data;
  }

  async suspendOperation(id: string): Promise<Operation> {
    const response = await api.patch<Operation>(`/operations/${id}/suspend`);
    return response.data;
  }

  async deleteOperation(id: string): Promise<void> {
    await api.delete(`/operations/${id}`);
  }

  // Stats
  async getSubscriptionStats(): Promise<{
    total: number;
    active: number;
    cancelled: number;
    suspended: number;
  }> {
    const response = await api.get('/subscriptions/stats');
    return response.data;
  }

  async getOperationStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  }> {
    const response = await api.get('/operations/stats');
    return response.data;
  }

  // Limits
  async getClientLimits(clientId: string): Promise<{
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
  }> {
    const response = await api.get(`/limits/client/${clientId}`);
    return response.data;
  }
}

export const subscriptionsService = new SubscriptionsService();
// Plan interfaces
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

// Subscription interfaces
export interface Subscription {
  id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'suspended' | 'expired';
  startDate: string;
  endDate?: string;
  cancellationDate?: string;
  price: number;
  currency: string;
  billingCycle: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  planId: string;
  plan?: Plan;
  operations?: Operation[];
}

export interface CreateSubscriptionRequest {
  clientId: string;
  planId: string;
  status?: 'active' | 'inactive' | 'cancelled' | 'suspended' | 'expired';
  startDate: string;
  endDate?: string;
  price?: number;
  currency?: string;
  billingCycle?: number;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSubscriptionRequest extends Partial<CreateSubscriptionRequest> {}

// Operation interfaces
export interface Operation {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended';
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  settings?: Record<string, any>;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  subscriptionId?: string;
}

export interface CreateOperationRequest {
  clientId: string;
  subscriptionId?: string;
  name: string;
  description?: string;
  status?: 'active' | 'inactive' | 'suspended';
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  settings?: Record<string, any>;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateOperationRequest extends Partial<CreateOperationRequest> {}

// Service class
