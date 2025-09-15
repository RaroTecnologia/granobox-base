import { api } from './api';

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  clientId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  parent?: Category;
  _count?: {
    products: number;
    children: number;
  };
}

export interface CreateCategoryRequest {
  name: string;
  parentId?: string;
  clientId: string;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface CategoryStats {
  totalCategories: number;
  rootCategories: number;
  subcategories: number;
}

class CategoriesService {
  async getCategoriesByClient(clientId: string): Promise<Category[]> {
    const response = await api.get<Category[]>(`/categories?clientId=${clientId}`);
    return response.data;
  }

  async getRootCategories(clientId: string): Promise<Category[]> {
    const response = await api.get<Category[]>(`/categories?clientId=${clientId}&rootOnly=true`);
    return response.data;
  }

  async getCategoryById(id: string): Promise<Category> {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  }

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const response = await api.post<Category>('/categories', data);
    return response.data;
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    const response = await api.put<Category>(`/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  }

  async getCategoryStats(clientId: string): Promise<CategoryStats> {
    const response = await api.get<CategoryStats>(`/categories/stats?clientId=${clientId}`);
    return response.data;
  }
}

export const categoriesService = new CategoriesService();
