
import apiService from '@/lib/api';

export interface Product {
  id?: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  unitOfMeasure: string;
  basePrice: number;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  taxRate: number;
  barcode: string;
  weight?: number;
  volume?: number;
  isActive: boolean;
  status?: string;
  reorderLevel?: number;
  maxStockLevel?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const productsService = {

  getAll: async (filters?: any) => {
    const response = await apiService.getProducts(filters);
    // Handle nested response structure: {success: true, data: {products: [...], pagination: {...}}}
    return response.data?.data || response.data;
  },
  getById: async (id: string) => {
    const response = await apiService.getProduct(id);
    // Handle nested response structure
    return response.data?.data || response.data;
  },
  create: async (data: any) => {
    const response = await apiService.createProduct(data);
    // Handle nested response structure
    return response.data?.data || response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiService.updateProduct(id, data);
    // Handle nested response structure
    return response.data?.data || response.data;
  },
  delete: async (id: string) => {
    const response = await apiService.deleteProduct(id);
    // Handle nested response structure
    return response.data?.data || response.data;
  },
};

export default productsService;
