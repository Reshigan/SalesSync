
import apiService from '@/lib/api';

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  items: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
}

export const ordersService = {

  getAll: async (filters?: any) => {
    const response = await apiService.get('/orders', { params: filters });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiService.get('/orders');
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiService.post('/orders', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiService.put(`/orders/${id}`, data);
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await apiService.put(`/orders/${id}`, { status });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiService.delete(`/orders/${id}`);
    return response.data;
  },
};

export default ordersService;
