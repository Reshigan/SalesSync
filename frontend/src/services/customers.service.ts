
import apiService from '@/lib/api';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  status: 'active' | 'inactive';
  type: 'retail' | 'wholesale';
  creditLimit?: number;
  businessName?: string;
  customerCode?: string;
  createdAt: string;
  updatedAt: string;
}

export const customersService = {

  getAll: async (filters?: any) => {
    const response = await apiService.get('/customers', { params: filters });
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
