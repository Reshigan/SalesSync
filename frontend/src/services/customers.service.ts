
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
    console.log('🔍 CustomersService: getAll called with filters:', filters)
    const response = await apiService.getCustomers(filters);
    console.log('🔍 CustomersService: Raw API response:', response)
    console.log('🔍 CustomersService: response.data:', response.data)
    console.log('🔍 CustomersService: response.data?.customers:', response.data?.customers)
    console.log('🔍 CustomersService: response.data?.data:', (response.data as any)?.data)
    console.log('🔍 CustomersService: response.data?.data?.customers:', (response.data as any)?.data?.customers)
    
    // Backend returns: { success: true, data: { customers: [...], pagination: {...} } }
    // API service wraps it as: { data: { success: true, data: { customers: [...], pagination: {...} } } }
    let result;
    if ((response.data as any)?.data?.customers) {
      result = { customers: (response.data as any).data.customers, pagination: (response.data as any).data.pagination };
    } else if (response.data?.customers) {
      result = { customers: response.data.customers, pagination: response.data.pagination };
    } else {
      result = { customers: [], pagination: null };
    }
    
    console.log('🔍 CustomersService: Final result:', result)
    console.log('🔍 CustomersService: Customers array:', result.customers)
    console.log('🔍 CustomersService: Customers count:', result.customers?.length || 0)
    return result;
  },
  getById: async (id: string) => {
    const response = await apiService.getCustomer(id);
    return response.data?.data || response.data;
  },
  create: async (data: any) => {
    const response = await apiService.createCustomer(data);
    return response.data?.data || response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiService.updateCustomer(id, data);
    return response.data?.data || response.data;
  },
  delete: async (id: string) => {
    const response = await apiService.deleteCustomer(id);
    return response.data?.data || response.data;
  },
};

export default customersService;
