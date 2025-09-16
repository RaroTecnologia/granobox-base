import { api } from './api';

export interface Printer {
  id: string;
  name: string;
  ip: string;
  port: string;
  model: string;
  location?: string;
  usage?: string[];
  status: 'online' | 'offline' | 'connecting';
  lastTestAt?: string;
  lastTestResult?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrinterDto {
  name: string;
  ip: string;
  port: string;
  model: string;
  location?: string;
  usage?: string[];
}

export interface UpdatePrinterDto {
  name?: string;
  ip?: string;
  port?: string;
  model?: string;
  location?: string;
  usage?: string[];
}

export interface TestPrinterResponse {
  success: boolean;
  message: string;
}

export const printerService = {
  // Buscar todas as impressoras
  getAll: async (): Promise<Printer[]> => {
    const response = await api.get<Printer[]>('/printers');
    return response.data;
  },

  // Buscar impressora por ID
  getById: async (id: string): Promise<Printer> => {
    const response = await api.get<Printer>(`/printers/${id}`);
    return response.data;
  },

  // Criar nova impressora
  create: async (data: CreatePrinterDto): Promise<Printer> => {
    const response = await api.post<Printer>('/printers', data);
    return response.data;
  },

  // Atualizar impressora
  update: async (id: string, data: UpdatePrinterDto): Promise<Printer> => {
    const response = await api.patch<Printer>(`/printers/${id}`, data);
    return response.data;
  },

  // Remover impressora
  delete: async (id: string): Promise<void> => {
    await api.delete(`/printers/${id}`);
  },

  // Testar conexão com impressora
  testConnection: async (id: string, testMessage?: string): Promise<TestPrinterResponse> => {
    const response = await api.post<TestPrinterResponse>(`/printers/${id}/test`, {
      testMessage,
    });
    return response.data;
  },
};




export interface Printer {
  id: string;
  name: string;
  ip: string;
  port: string;
  model: string;
  location?: string;
  usage?: string[];
  status: 'online' | 'offline' | 'connecting';
  lastTestAt?: string;
  lastTestResult?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrinterDto {
  name: string;
  ip: string;
  port: string;
  model: string;
  location?: string;
  usage?: string[];
}

export interface UpdatePrinterDto {
  name?: string;
  ip?: string;
  port?: string;
  model?: string;
  location?: string;
  usage?: string[];
}

export interface TestPrinterResponse {
  success: boolean;
  message: string;
}



