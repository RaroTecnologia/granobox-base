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
    
    // Sempre incluir o clientId
    params.append('clientId', '6621e831-5d1d-4801-8c33-b0f93446a3df');
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get<Product[]>(`/products?${params.toString()}`);
    return response.data;
  }

  async getProductsByClient(): Promise<Product[]> {
    const response = await api.get<Product[]>('/products?clientId=6621e831-5d1d-4801-8c33-b0f93446a3df');
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

  getProductTypeLabel(type: ProductType): string {
    const labels = {
      finished: 'Acabado',
      manipulated: 'Manipulado'
    };
    return labels[type] || type;
  }

  getProductTypeColor(type: ProductType): string {
    const colors = {
      finished: '#10B981', // green
      manipulated: '#F59E0B' // amber
    };
    return colors[type] || '#6B7280'; // gray
  }

  getShelfLifeText(days: number | null | undefined): string {
    if (!days || days === 0) return 'N/A';
    
    if (days === 1) return '1 dia';
    if (days < 30) return `${days} dias`;
    if (days < 365) return `${Math.round(days / 30)} meses`;
    return `${Math.round(days / 365)} anos`;
  }

  formatPrice(price: number | null | undefined, currency: string = 'BRL'): string {
    if (!price) return 'N/A';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'BRL' ? 'BRL' : 'USD'
    }).format(price);
  }

  formatWeight(weight: number | null | undefined, unit: string = 'kg'): string {
    if (!weight) return 'N/A';
    
    return `${weight} ${unit}`;
  }
}

export const productsService = new ProductsService();
