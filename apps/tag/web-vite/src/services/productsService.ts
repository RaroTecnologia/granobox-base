import { api } from './api';

export type ProductType = 'finished' | 'manipulated';

export interface Product {
  id: string;
  name: string;
  code?: string;
  type: ProductType;
  categoryId: string;
  clientId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    parentId?: string;
  };
}

export interface CreateProductRequest {
  name: string;
  code?: string;
  type: ProductType;
  categoryId: string;
  clientId: string;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  code?: string;
  type?: ProductType;
  categoryId?: string;
  isActive?: boolean;
}

export interface ProductFilters {
  clientId?: string;
  categoryId?: string;
  search?: string;
  type?: ProductType;
  isActive?: boolean;
}

class ProductsService {
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get<Product[]>(`/products?${params.toString()}`);
    return response.data;
  }

  async getProductsByClient(clientId: string): Promise<Product[]> {
    const response = await api.get<Product[]>(`/products?clientId=${clientId}`);
    return response.data;
  }

  async getProductById(id: string): Promise<Product> {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await api.post<Product>('/products', data);
    return response.data;
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    const response = await api.put<Product>(`/products/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  }
}

export const productsService = new ProductsService();
