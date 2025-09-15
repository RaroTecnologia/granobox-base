import { useState, useEffect } from 'react';
import { productsService, Product, CreateProductRequest, UpdateProductRequest, ProductFilters } from '../services/productsService';
import { toast } from 'react-hot-toast';

export function useProducts(clientId?: string, initialFilters: ProductFilters = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({ ...initialFilters, clientId });

  const loadProducts = async (newFilters?: ProductFilters) => {
    const targetFilters = newFilters || filters;
    
    try {
      setLoading(true);
      setError(null);
      
      const productsData = await productsService.getProducts(targetFilters);
      setProducts(productsData);
      setFilteredProducts(productsData);
      
      return productsData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar produtos';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (data: CreateProductRequest): Promise<Product> => {
    try {
      setLoading(true);
      setError(null);
      
      const newProduct = await productsService.createProduct(data);
      
      // Atualizar listas locais
      setProducts(prev => [newProduct, ...prev]);
      setFilteredProducts(prev => [newProduct, ...prev]);
      
      toast.success('Produto criado com sucesso!');
      return newProduct;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao criar produto';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, data: UpdateProductRequest): Promise<Product> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedProduct = await productsService.updateProduct(id, data);
      
      // Atualizar listas locais
      setProducts(prev => prev.map(product => product.id === id ? updatedProduct : product));
      setFilteredProducts(prev => prev.map(product => product.id === id ? updatedProduct : product));
      
      toast.success('Produto atualizado com sucesso!');
      return updatedProduct;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar produto';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await productsService.deleteProduct(id);
      
      // Remover das listas locais
      setProducts(prev => prev.filter(product => product.id !== id));
      setFilteredProducts(prev => prev.filter(product => product.id !== id));
      
      toast.success('Produto excluído com sucesso!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao excluir produto';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find(product => product.id === id);
  };

  const applyFilters = (newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    loadProducts(updatedFilters);
  };

  const searchProducts = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const refreshProducts = () => {
    loadProducts();
  };

  // Carregar produtos quando o clientId ou filtros mudarem
  useEffect(() => {
    if (clientId) {
      const newFilters = { ...filters, clientId };
      setFilters(newFilters);
      loadProducts(newFilters);
    }
  }, [clientId]);

  return {
    products,
    filteredProducts,
    loading,
    error,
    filters,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    applyFilters,
    searchProducts,
    refreshProducts,
  };
}
