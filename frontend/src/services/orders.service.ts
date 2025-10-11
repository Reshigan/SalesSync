
import { apiClient } from '../lib/api-client'

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: Date;
  deliveryDate?: Date;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'PARTIAL' | 'OVERDUE';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  customerId: string;
  userId: string;
  items: OrderItem[];
  customer?: {
    id: string;
    name: string;
    code: string;
    customerType: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  orderId: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
  };
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
