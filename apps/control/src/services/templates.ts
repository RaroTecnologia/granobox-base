import { api } from './api';
import type { 
  Template, 
  CreateTemplateRequest, 
  UpdateTemplateRequest, 
  TemplateAssociation,
  CreateTemplateAssociationRequest,
  TemplatePreview 
} from '../types/templates';

export const templatesService = {
  // Templates CRUD
  async getTemplates(clientId?: string): Promise<Template[]> {
    const params = clientId ? { clientId } : {};
    const response = await api.get('/tagment/templates', { params });
    return response.data;
  },

  async getTemplate(id: string): Promise<Template> {
    const response = await api.get(`/tagment/templates/${id}`);
    return response.data;
  },

  async createTemplate(data: CreateTemplateRequest): Promise<Template> {
    const response = await api.post('/tagment/templates', data);
    return response.data;
  },

  async updateTemplate(id: string, data: UpdateTemplateRequest): Promise<Template> {
    const response = await api.put(`/tagment/templates/${id}`, data);
    return response.data;
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/tagment/templates/${id}`);
  },

  async duplicateTemplate(id: string, newName: string): Promise<Template> {
    const response = await api.post(`/tagment/templates/${id}/duplicate`, { name: newName });
    return response.data;
  },

  // Template Associations
  async getTemplateAssociations(clientId: string): Promise<TemplateAssociation[]> {
    const response = await api.get(`/tagment/template-associations`, { 
      params: { clientId } 
    });
    return response.data;
  },

  async createTemplateAssociation(data: CreateTemplateAssociationRequest): Promise<TemplateAssociation> {
    const response = await api.post('/tagment/template-associations', data);
    return response.data;
  },

  async updateTemplateAssociation(id: string, data: Partial<CreateTemplateAssociationRequest>): Promise<TemplateAssociation> {
    const response = await api.put(`/tagment/template-associations/${id}`, data);
    return response.data;
  },

  async deleteTemplateAssociation(id: string): Promise<void> {
    await api.delete(`/tagment/template-associations/${id}`);
  },

  // Template Processing
  async processTemplate(templateId: string, data: Record<string, any>): Promise<{ zpl: string; success: boolean }> {
    const response = await api.post('/tagment/process-template', {
      templateId,
      data
    });
    return response.data;
  },

  async validateTemplate(templateId: string): Promise<{ isValid: boolean; errors?: string[] }> {
    const response = await api.post(`/tagment/validate-template/${templateId}`);
    return response.data;
  },

  async generatePreview(templateId: string, data?: Record<string, any>): Promise<string> {
    const response = await api.post(`/tagment/templates/${templateId}/preview`, {
      data: data || {}
    });
    return response.data.preview;
  },

  // Template Previews
  async getTemplatePreviews(clientId?: string): Promise<TemplatePreview[]> {
    const params = clientId ? { clientId } : {};
    const response = await api.get('/tagment/template-previews', { params });
    return response.data;
  },

  // Default Templates
  async getDefaultTemplates(): Promise<Template[]> {
    const response = await api.get('/tagment/default-templates');
    return response.data;
  },

  async createFromDefault(defaultTemplateId: string, name: string, clientId?: string): Promise<Template> {
    const response = await api.post('/tagment/templates/from-default', {
      defaultTemplateId,
      name,
      clientId
    });
    return response.data;
  }
};
