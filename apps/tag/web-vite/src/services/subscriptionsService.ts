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
  operations?: any[];
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

class SubscriptionsService {
  async getSubscriptions(): Promise<Subscription[]> {
    const response = await api.get<Subscription[]>('/subscriptions');
    return response.data;
  }

  async getSubscriptionsByClient(clientId: string): Promise<Subscription[]> {
    const response = await api.get<Subscription[]>(`/subscriptions/client/${clientId}`);
    return response.data;
  }

  async getActiveSubscriptionByClient(clientId: string): Promise<Subscription | null> {
    const response = await api.get<Subscription>(`/subscriptions/client/${clientId}/active`);
    return response.data;
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

  async getSubscriptionStats(): Promise<{
    total: number;
    active: number;
    cancelled: number;
    suspended: number;
  }> {
    const response = await api.get('/subscriptions/stats');
    return response.data;
  }
}

export const subscriptionsService = new SubscriptionsService();

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
  operations?: any[];
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

class SubscriptionsService {
  async getSubscriptions(): Promise<Subscription[]> {
    const response = await api.get<Subscription[]>('/subscriptions');
    return response.data;
  }

  async getSubscriptionsByClient(clientId: string): Promise<Subscription[]> {
    const response = await api.get<Subscription[]>(`/subscriptions/client/${clientId}`);
    return response.data;
  }

  async getActiveSubscriptionByClient(clientId: string): Promise<Subscription | null> {
    const response = await api.get<Subscription>(`/subscriptions/client/${clientId}/active`);
    return response.data;
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

  async getSubscriptionStats(): Promise<{
    total: number;
    active: number;
    cancelled: number;
    suspended: number;
  }> {
    const response = await api.get('/subscriptions/stats');
    return response.data;
  }
}

export const subscriptionsService = new SubscriptionsService();
