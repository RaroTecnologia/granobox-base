import { api } from './api';

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

class OperationsService {
  async getOperations(): Promise<Operation[]> {
    const response = await api.get<Operation[]>('/operations');
    return response.data;
  }

  async getOperationsByClient(clientId: string): Promise<Operation[]> {
    const response = await api.get<Operation[]>(`/operations?clientId=${clientId}`);
    return response.data;
  }

  async getActiveOperationsByClient(clientId: string): Promise<Operation[]> {
    const response = await api.get<Operation[]>(`/operations?clientId=${clientId}`);
    // Filtrar apenas operações ativas no frontend
    return response.data.filter(op => op.status === 'active' && op.isActive);
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

  async getOperationStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  }> {
    const response = await api.get('/operations/stats');
    return response.data;
  }
}

export const operationsService = new OperationsService();


