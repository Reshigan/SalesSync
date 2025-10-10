
import { apiClient } from '../lib/api-client'

export interface Order {
  id: string;
  orderNumber?: string;
  customer_id: string;
  customer_name: string;
  customerName?: string;
  customerCode?: string;
  total_amount: number;
  totalAmount?: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'draft' | 'processing';
  order_date: string;
  orderDate?: string;
  delivery_date?: string;
  deliveryDate?: string;
  items: OrderItem[];
  payment_status: 'pending' | 'paid' | 'failed' | 'partial' | 'overdue';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'partial' | 'overdue';
  delivery_address: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unitPrice: number;
  total_price: number;
  discount: number;
  tax: number;
}

export const ordersService = {

  getAll: async (filters?: any): Promise<Order[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
    }
    return await apiClient.get<Order[]>(`/orders?${params.toString()}`);
  },
  getById: async (id: string): Promise<Order> => {
    return await apiClient.get<Order>(`/orders/${id}`);
  },
  create: async (data: Partial<Order>): Promise<Order> => {
    return await apiClient.post<Order>('/orders', data);
  },
  update: async (id: string, data: Partial<Order>): Promise<Order> => {
    return await apiClient.put<Order>(`/orders/${id}`, data);
  },
  updateStatus: async (id: string, status: string): Promise<Order> => {
    return await apiClient.put<Order>(`/orders/${id}`, { status });
  },
  delete: async (id: string): Promise<void> => {
    return await apiClient.delete<void>(`/orders/${id}`);
  },
};

export default ordersService;
