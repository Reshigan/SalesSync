
import apiService from '@/lib/api';

export const customersService = {

  getAll: async () => {
    const response = await apiService.get('/customers');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiService.get('/customers');
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiService.post('/customers', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiService.put('/customers', data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiService.delete('/customers');
    return response.data;
  },
};

export default customersService;
