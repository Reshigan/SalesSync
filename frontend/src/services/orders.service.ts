
import apiService from '@/lib/api';

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  price: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Order {
  id?: string;
  orderNumber?: string;
  customer?: string;
  customerId?: string;
  customerName?: string;
  customerCode?: string;
  salesAgentId?: string;
  items?: number | OrderItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  totalAmount?: number;
  status?: 'draft' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentTerms?: string;
  priority?: 'low' | 'medium' | 'high';
  date?: string;
  orderDate?: string;
  deliveryDate?: string;
  notes?: string;
}

export const ordersService = {

  getAll: async (filters?: any) => {
    const response = await apiService.getOrders(filters);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiService.getOrder(id);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiService.createOrder(data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiService.updateOrder(id, data);
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await apiService.updateOrder(id, { status });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiService.deleteOrder(id);
    return response.data;
  },
};

export default ordersService;
