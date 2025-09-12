import axios from 'axios';
import type { LoginRequest, LoginResponse } from '../types/auth';
import type { ApiClient, CreateClientRequest, ApiContact, CreateContactRequest, ApiEquipment, CreateEquipmentRequest } from '../types/api';

// Configuração base da API
export const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 10000,
});

// Interceptor para adicionar o token de autorização
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('granobox_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se o token expirou, redirecionar para login
    if (error.response?.status === 401) {
      localStorage.removeItem('granobox_token');
      localStorage.removeItem('granobox_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('granobox_token');
    localStorage.removeItem('granobox_user');
  },

  getStoredUser: () => {
    const user = localStorage.getItem('granobox_user');
    return user ? JSON.parse(user) : null;
  },

  getStoredToken: () => {
    return localStorage.getItem('granobox_token');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('granobox_token');
    const user = localStorage.getItem('granobox_user');
    return !!(token && user);
  },
};

// Serviços de usuários
export const usersService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id: string, userData: any) => {
    const response = await api.patch(`/users/${id}`, userData);
    return response.data;
  },

  toggleStatus: async (id: string) => {
    const response = await api.patch(`/users/${id}/toggle-status`);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/users/${id}`);
  },

  resetPassword: async (id: string) => {
    const response = await api.post(`/users/${id}/reset-password`);
    return response.data;
  },
};

// Serviços de clientes
export const clientsService = {
  getAll: async (): Promise<ApiClient[]> => {
    const response = await api.get<ApiClient[]>('/clients');
    return response.data;
  },

  getById: async (id: string): Promise<ApiClient> => {
    const response = await api.get<ApiClient>(`/clients/${id}`);
    return response.data;
  },

  create: async (clientData: CreateClientRequest): Promise<ApiClient> => {
    const response = await api.post<ApiClient>('/clients', clientData);
    return response.data;
  },

  update: async (id: string, clientData: Partial<CreateClientRequest>): Promise<ApiClient> => {
    const response = await api.patch<ApiClient>(`/clients/${id}`, clientData);
    return response.data;
  },

  activate: async (id: string): Promise<ApiClient> => {
    const response = await api.patch<ApiClient>(`/clients/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: string): Promise<ApiClient> => {
    const response = await api.patch<ApiClient>(`/clients/${id}/deactivate`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};

// Serviços de Contatos
export const contactsService = {
  getAll: async (): Promise<ApiContact[]> => {
    const response = await api.get<ApiContact[]>('/contacts');
    return response.data;
  },

  getByClient: async (clientId: string): Promise<ApiContact[]> => {
    const response = await api.get<ApiContact[]>(`/contacts?clientId=${clientId}`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiContact> => {
    const response = await api.get<ApiContact>(`/contacts/${id}`);
    return response.data;
  },

  create: async (data: CreateContactRequest): Promise<ApiContact> => {
    const response = await api.post<ApiContact>('/contacts', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateContactRequest>): Promise<ApiContact> => {
    const response = await api.patch<ApiContact>(`/contacts/${id}`, data);
    return response.data;
  },

  setPrimary: async (id: string): Promise<ApiContact> => {
    const response = await api.patch<ApiContact>(`/contacts/${id}/set-primary`);
    return response.data;
  },

  toggleActive: async (id: string): Promise<ApiContact> => {
    const response = await api.patch<ApiContact>(`/contacts/${id}/toggle-active`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/contacts/${id}`);
  },
};

// Serviços de Equipamentos
export const equipmentService = {
  getAll: async (): Promise<ApiEquipment[]> => {
    const response = await api.get<ApiEquipment[]>('/equipment');
    return response.data;
  },

  getByClient: async (clientId: string): Promise<ApiEquipment[]> => {
    const response = await api.get<ApiEquipment[]>(`/equipment?clientId=${clientId}`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiEquipment> => {
    const response = await api.get<ApiEquipment>(`/equipment/${id}`);
    return response.data;
  },

  getStats: async (clientId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
    returned: number;
  }> => {
    const url = clientId ? `/equipment/stats?clientId=${clientId}` : '/equipment/stats';
    const response = await api.get(url);
    return response.data;
  },

  create: async (data: CreateEquipmentRequest): Promise<ApiEquipment> => {
    const response = await api.post<ApiEquipment>('/equipment', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateEquipmentRequest>): Promise<ApiEquipment> => {
    const response = await api.patch<ApiEquipment>(`/equipment/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: ApiEquipment['status']): Promise<ApiEquipment> => {
    const response = await api.patch<ApiEquipment>(`/equipment/${id}/status`, { status });
    return response.data;
  },

  toggleActive: async (id: string): Promise<ApiEquipment> => {
    const response = await api.patch<ApiEquipment>(`/equipment/${id}/toggle-active`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/equipment/${id}`);
  },
};
