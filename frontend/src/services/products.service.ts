
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
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiService.getProduct(id);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiService.createProduct(data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiService.updateProduct(id, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiService.deleteProduct(id);
    return response.data;
  },
};

export default productsService;
