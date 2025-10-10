
import { apiClient } from '../lib/api-client'

export interface Customer {
  id: string;
  name: string;
  businessName?: string;
  code: string;
  customerCode?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  type: 'retail' | 'wholesale' | 'distributor';
  status: 'active' | 'inactive' | 'blocked';
  creditLimit?: number;
  paymentTerms?: string;
  created_at: string;
  updated_at: string;
}

export const customersService = {

  getAll: async (filters?: any): Promise<Customer[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
    }
    return await apiClient.get<Customer[]>(`/customers?${params.toString()}`);
  },
  getById: async (id: string): Promise<Customer> => {
    return await apiClient.get<Customer>(`/customers/${id}`);
  },
  create: async (data: Partial<Customer>): Promise<Customer> => {
    return await apiClient.post<Customer>('/customers', data);
  },
  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    return await apiClient.put<Customer>(`/customers/${id}`, data);
  },
  delete: async (id: string): Promise<void> => {
    return await apiClient.delete<void>(`/customers/${id}`);
  },
};

export default customersService;
