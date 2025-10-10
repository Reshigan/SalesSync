
import { apiClient } from '../lib/api-client'

export interface Product {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: string;
  price: number;
  basePrice: number;
  cost?: number;
  unit: string;
  status: 'active' | 'inactive';
  min_stock?: number;
  max_stock?: number;
  reorderLevel?: number;
  created_at: string;
  updated_at: string;
}

export const productsService = {

  getAll: async (): Promise<Product[]> => {
    return await apiClient.get<Product[]>('/products');
  },
  getById: async (id: string): Promise<Product> => {
    return await apiClient.get<Product>(`/products/${id}`);
  },
  create: async (data: Partial<Product>): Promise<Product> => {
    return await apiClient.post<Product>('/products', data);
  },
  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    return await apiClient.put<Product>(`/products/${id}`, data);
  },
  delete: async (id: string): Promise<void> => {
    return await apiClient.delete<void>(`/products/${id}`);
  },
};

export default productsService;
