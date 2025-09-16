import { useState, useEffect } from 'react';
import { categoriesService, Category, CreateCategoryRequest, UpdateCategoryRequest } from '../services/categoriesService';
import { toast } from 'react-hot-toast';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [rootCategories, setRootCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [allCategories, rootCats] = await Promise.all([
        categoriesService.getCategoriesByClient(),
        categoriesService.getRootCategories(),
      ]);
      
      setCategories(allCategories);
      setRootCategories(rootCats);
      
      return allCategories;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar categorias';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (data: CreateCategoryRequest): Promise<Category> => {
    try {
      setLoading(true);
      setError(null);
      
      const newCategory = await categoriesService.createCategory(data);
      
      // Atualizar listas locais
      setCategories(prev => [newCategory, ...prev]);
      if (!newCategory.parentId) {
        setRootCategories(prev => [newCategory, ...prev]);
      }
      
      toast.success('Categoria criada com sucesso!');
      return newCategory;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao criar categoria';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: string, data: UpdateCategoryRequest): Promise<Category> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedCategory = await categoriesService.updateCategory(id, data);
      
      // Atualizar listas locais
      setCategories(prev => prev.map(cat => cat.id === id ? updatedCategory : cat));
      setRootCategories(prev => prev.map(cat => cat.id === id ? updatedCategory : cat));
      
      toast.success('Categoria atualizada com sucesso!');
      return updatedCategory;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar categoria';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await categoriesService.deleteCategory(id);
      
      // Remover das listas locais
      setCategories(prev => prev.filter(cat => cat.id !== id));
      setRootCategories(prev => prev.filter(cat => cat.id !== id));
      
      toast.success('Categoria excluída com sucesso!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao excluir categoria';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(cat => cat.id === id);
  };

  const getCategoriesByParent = (parentId: string | null): Category[] => {
    return categories.filter(cat => cat.parentId === parentId);
  };

  const refreshCategories = () => {
    loadCategories();
  };

  // Carregar categorias quando o componente montar
  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    rootCategories,
    loading,
    error,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoriesByParent,
    refreshCategories,
  };
}

