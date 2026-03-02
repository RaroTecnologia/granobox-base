import { api } from './api';

export interface SupplyRoll {
  id: string;
  shortCode: string | null;
  type: 'label' | 'ribbon';
  status: 'in_stock' | 'assigned' | 'installed' | 'depleted';
  skuId: string;
  sku?: { id: string; name: string; code?: string; labelsPerRoll?: number };
  clientId?: string;
  client?: { id: string; tradeName?: string; companyName?: string };
  printerId?: string;
  operationId?: string;
  orderId?: string;
  batchCode: string;
  supplierInvoice?: string;
  receivedAt?: string;
  assignedAt?: string;
  installedAt?: string;
  depletedAt?: string;
  printsSinceInstall: number;
  ribbonUsedMetersSinceInstall: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchDto {
  skuId: string;
  type: 'label' | 'ribbon';
  quantity: number;
  batchCode?: string;
  clientId?: string;
}

export const supplyRollsService = {
  async createBatch(dto: CreateBatchDto): Promise<SupplyRoll[]> {
    const { data } = await api.post('/supply-rolls/batch', dto);
    return data;
  },

  async getByClient(clientId: string, status?: string): Promise<SupplyRoll[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const { data } = await api.get(`/supply-rolls/client/${clientId}`, { params });
    return data;
  },

  async getByPrinter(printerId: string): Promise<SupplyRoll[]> {
    const { data } = await api.get(`/supply-rolls/printer/${printerId}`);
    return data;
  },

  async getById(id: string): Promise<SupplyRoll> {
    const { data } = await api.get(`/supply-rolls/${id}`);
    return data;
  },

  async assign(id: string, clientId: string): Promise<SupplyRoll> {
    const { data } = await api.post(`/supply-rolls/${id}/assign`, { clientId });
    return data;
  },

  async install(id: string, printerId: string): Promise<SupplyRoll> {
    const { data } = await api.post(`/supply-rolls/${id}/install`, { printerId });
    return data;
  },

  async deplete(id: string): Promise<SupplyRoll> {
    const { data } = await api.post(`/supply-rolls/${id}/deplete`);
    return data;
  },

  async getAll(filters?: {
    status?: string;
    hasInvoice?: string;
    batchCode?: string;
    skuId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: SupplyRoll[]; total: number }> {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.hasInvoice !== undefined) params.hasInvoice = filters.hasInvoice;
    if (filters?.batchCode) params.batchCode = filters.batchCode;
    if (filters?.skuId) params.skuId = filters.skuId;
    if (filters?.limit) params.limit = String(filters.limit);
    if (filters?.offset) params.offset = String(filters.offset);
    const { data } = await api.get('/supply-rolls', { params });
    return data;
  },

  async receiveBatch(dto: {
    rollIds: string[];
    supplierInvoice: string;
    receivedAt?: string;
  }): Promise<{ updated: number }> {
    const { data } = await api.post('/supply-rolls/receive', dto);
    return data;
  },

  async assignToOrder(dto: {
    rollIds: string[];
    orderId: string;
  }): Promise<{ assigned: number }> {
    const { data } = await api.post('/supply-rolls/assign-to-order', dto);
    return data;
  },
};
