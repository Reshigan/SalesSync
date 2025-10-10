
import apiService from '@/lib/api';

export const productsService = {

  getAll: async () => {
    const response = await apiService.get('/products');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiService.get('/products');
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiService.post('/products', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiService.put('/products', data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiService.delete('/products');
    return response.data;
  },
};

export default productsService;
