
import { apiClient } from '../lib/api-client'
import { Product } from '../types'

export const productsService = {

  getAll: async (filters?: any): Promise<{ products: Product[] }> => {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    const url = queryParams ? `/products?${queryParams}` : '/products';
    const products = await apiClient.get<Product[]>(url);
    return { products };
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
