
import apiService from '@/lib/api';

export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  city?: string;
  region?: string;
  area?: string;
  category?: string;
  status: 'active' | 'inactive';
  type: 'retail' | 'wholesale';
  creditLimit: number;
  creditBalance?: number;
  businessName?: string;
  customerCode?: string;
  paymentTerms?: string;
  taxNumber?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const customersService = {

  getAll: async (filters?: any) => {
    const response = await apiService.getCustomers(filters);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiService.getCustomer(id);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiService.createCustomer(data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiService.updateCustomer(id, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiService.deleteCustomer(id);
    return response.data;
  },
};

export default customersService;
