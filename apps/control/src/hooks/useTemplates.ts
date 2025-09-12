import { useState, useEffect, useCallback } from 'react';
import { templatesService } from '../services/templates';
import type { Template, CreateTemplateRequest, UpdateTemplateRequest, TemplateAssociation, CreateTemplateAssociationRequest } from '../types/templates';

export const useTemplates = (clientId?: string) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [associations, setAssociations] = useState<TemplateAssociation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await templatesService.getTemplates(clientId);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const loadAssociations = useCallback(async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await templatesService.getTemplateAssociations(clientId);
      setAssociations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar associações');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const createTemplate = useCallback(async (data: CreateTemplateRequest) => {
    try {
      setLoading(true);
      setError(null);
      const newTemplate = await templatesService.createTemplate(data);
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar template');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, data: UpdateTemplateRequest) => {
    try {
      setLoading(true);
      setError(null);
      const updatedTemplate = await templatesService.updateTemplate(id, data);
      setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
      return updatedTemplate;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar template');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await templatesService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar template');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const duplicateTemplate = useCallback(async (id: string, newName: string) => {
    try {
      setLoading(true);
      setError(null);
      const duplicatedTemplate = await templatesService.duplicateTemplate(id, newName);
      setTemplates(prev => [...prev, duplicatedTemplate]);
      return duplicatedTemplate;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao duplicar template');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAssociation = useCallback(async (data: CreateTemplateAssociationRequest) => {
    try {
      setLoading(true);
      setError(null);
      const newAssociation = await templatesService.createTemplateAssociation(data);
      setAssociations(prev => [...prev, newAssociation]);
      return newAssociation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar associação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAssociation = useCallback(async (id: string, data: Partial<CreateTemplateAssociationRequest>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedAssociation = await templatesService.updateTemplateAssociation(id, data);
      setAssociations(prev => prev.map(a => a.id === id ? updatedAssociation : a));
      return updatedAssociation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar associação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAssociation = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await templatesService.deleteTemplateAssociation(id);
      setAssociations(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar associação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadAssociations();
  }, [loadTemplates, loadAssociations]);

  return {
    templates,
    associations,
    loading,
    error,
    loadTemplates,
    loadAssociations,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    createAssociation,
    updateAssociation,
    deleteAssociation,
  };
};
