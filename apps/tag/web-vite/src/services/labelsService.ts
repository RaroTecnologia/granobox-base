import { api } from './api';
import { tagmentService } from './tagmentService';

export interface Label {
  id: string;
  code: string;
  type: 'validity' | 'label';
  conservationType?: 'ambiente' | 'refrigerado' | 'congelado';
  status: 'pending' | 'printed' | 'failed';
  quantity: number;
  weight?: string;
  unit?: string;
  price?: string;
  productionDate: string;
  validityDate: string;
  clientId: string;
  productId: string;
  notes?: string;
  metadata?: Record<string, any>;
  qrCode?: string;
  product: {
    id: string;
    name: string;
    code: string;
  };
  client: {
    id: string;
    businessName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabelRequest {
  type: 'validity' | 'label';
  conservationType?: 'ambiente' | 'refrigerado' | 'congelado';
  quantity: number;
  weight?: string;
  unit?: string;
  price?: string;
  productionDate: string;
  validityDate: string;
  clientId: string;
  productId: string;
  notes?: string;
  metadata?: Record<string, any>;
}

class LabelsService {
  async createLabel(data: CreateLabelRequest): Promise<Label> {
    try {
      const response = await api.post<Label>('/labels', data);
      return response.data;
    } catch (error: any) {
      console.error('Erro na criação da etiqueta:', error);
      console.error('Resposta do erro:', error.response?.data);
      throw error;
    }
  }

  async getLabels(clientId?: string, type?: string): Promise<Label[]> {
    const params = new URLSearchParams();
    if (clientId) params.append('clientId', clientId);
    if (type) params.append('type', type);
    
    const response = await api.get<Label[]>(`/labels?${params.toString()}`);
    return response.data;
  }

  async getPendingLabels(clientId?: string): Promise<Label[]> {
    const params = new URLSearchParams();
    if (clientId) params.append('clientId', clientId);
    
    const response = await api.get<Label[]>(`/labels/pending?${params.toString()}`);
    return response.data;
  }

  async getLabel(id: string): Promise<Label> {
    const response = await api.get<Label>(`/labels/${id}`);
    return response.data;
  }

  async getLabelByCode(code: string): Promise<Label> {
    const response = await api.get<Label>(`/labels/code/${code}`);
    return response.data;
  }

  async updateLabelStatus(id: string, status: 'pending' | 'printed' | 'failed'): Promise<Label> {
    const response = await api.patch<Label>(`/labels/${id}/status`, { status });
    return response.data;
  }

  async markAsPrinted(ids: string[]): Promise<void> {
    await api.post('/labels/mark-printed', { ids });
  }

  // Métodos para integração com Tagment
  async printLabelWithTagment(labelId: string, printerId: string): Promise<void> {
    // Buscar dados da etiqueta
    const label = await this.getLabel(labelId);
    
    // Gerar ZPL baseado no tipo de etiqueta
    const zpl = this.generateZPL(label);
    
    // Enviar job de impressão via Tagment
    await tagmentService.createPrintJob(printerId, zpl);
  }

  async printLabelsWithTagment(labelIds: string[], printerId: string): Promise<void> {
    // Buscar todas as etiquetas
    const labels = await Promise.all(labelIds.map(id => this.getLabel(id)));
    
    // Gerar ZPL para todas as etiquetas
    const zpl = labels.map(label => this.generateZPL(label)).join('\n');
    
    // Enviar job de impressão via Tagment
    await tagmentService.createPrintJob(printerId, zpl);
  }

  private generateZPL(label: Label): string {
    if (label.type === 'validity') {
      return this.generateValidityZPL(label);
    } else {
      return this.generateLabelZPL(label);
    }
  }

  private generateValidityZPL(label: Label): string {
    const productionDate = new Date(label.productionDate).toLocaleDateString('pt-BR');
    const validityDate = new Date(label.validityDate).toLocaleDateString('pt-BR');
    
    return `^XA
^LH0,0
^PW480
^LL480
^FO50,50^ADN,36,20^FDTagment Agent^FS
^FO50,100^ADN,24,14^FDEtiqueta de Validade^FS
^FO50,140^ADN,18,10^FDProduto: ${label.product.name}^FS
^FO50,170^ADN,18,10^FDQuantidade: ${label.quantity} unidade(s)^FS
${label.weight ? `^FO50,200^ADN,18,10^FDPeso: ${label.weight} ${label.unit}^FS` : ''}
^FO50,230^ADN,18,10^FDConservação: ${this.getConservationLabel(label.conservationType)}^FS
^FO50,260^ADN,18,10^FDProdução: ${productionDate}^FS
^FO50,290^ADN,18,10^FDValidade: ${validityDate}^FS
^FO50,320^GB380,2,2^FS
^FO50,350^ADN,16,8^FDwww.tagment.com.br^FS
^XZ`;
  }

  private generateLabelZPL(label: Label): string {
    return `^XA
^LH0,0
^PW480
^LL480
^FO50,50^ADN,36,20^FDTagment Agent^FS
^FO50,100^ADN,24,14^FDEtiqueta de Rótulo^FS
^FO50,140^ADN,18,10^FDProduto: ${label.product.name}^FS
^FO50,170^ADN,18,10^FDQuantidade: ${label.quantity} unidade(s)^FS
${label.weight ? `^FO50,200^ADN,18,10^FDPeso: ${label.weight} ${label.unit}^FS` : ''}
${label.price ? `^FO50,230^ADN,18,10^FDPreço: R$ ${label.price}^FS` : ''}
^FO50,320^GB380,2,2^FS
^FO50,350^ADN,16,8^FDwww.tagment.com.br^FS
^XZ`;
  }

  private getConservationLabel(conservationType?: string): string {
    switch (conservationType) {
      case 'ambiente': return 'Ambiente';
      case 'refrigerado': return 'Refrigerado';
      case 'congelado': return 'Congelado';
      default: return 'Ambiente';
    }
  }

  async deleteLabel(id: string): Promise<void> {
    await api.delete(`/labels/${id}`);
  }

  // Buscar todas as etiquetas (impressas e não impressas)
  async getAllLabels(clientId: string): Promise<Label[]> {
    const response = await api.get(`/labels?clientId=${clientId}`);
    return response.data;
  }

  // Marcar etiqueta como usada (dar baixa) - usando metadata para controlar uso
  async markAsUsed(labelId: string): Promise<Label> {
    // Buscar a etiqueta atual para preservar metadata existente
    const label = await this.getLabel(labelId);
    const updatedMetadata = {
      ...label.metadata,
      isUsed: true,
      usedAt: new Date().toISOString()
    };
    
    const response = await api.patch(`/labels/${labelId}`, {
      metadata: updatedMetadata
    });
    return response.data;
  }

  // Gerar ZPL para uma etiqueta (placeholder - implementar quando endpoint estiver disponível)
  async generateZPLForLabel(labelId: string): Promise<{ zpl: string }> {
    // TODO: Implementar quando endpoint estiver disponível na API
    console.warn('generateZPLForLabel: Endpoint não implementado na API');
    return { zpl: `^XA^FO50,50^A0N,50,50^FDLabel ${labelId}^FS^XZ` };
  }
}

export const labelsService = new LabelsService();
