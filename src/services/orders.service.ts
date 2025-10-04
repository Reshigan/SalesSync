import { apiClient } from '@/lib/api-client'

export interface Order {
  id?: string
  orderNumber?: string
  customerId: string
  customerName?: string
  customerCode?: string
  salesAgentId: string
  salesAgentName?: string
  orderDate: string
  deliveryDate: string
  status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue'
  paymentTerms: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  items: OrderItem[]
  subtotal?: number
  tax?: number
  discount?: number
  totalAmount?: number
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface OrderItem {
  id?: string
  productId: string
  productName?: string
  sku?: string
  quantity: number
  unitPrice: number
  discount: number
  tax: number
  totalPrice?: number
}

export interface OrderFilters {
  status?: string
  paymentStatus?: string
  customerId?: string
  salesAgentId?: string
  fromDate?: string
  toDate?: string
  search?: string
  page?: number
  limit?: number
}

class OrdersService {
  private baseUrl = '/orders'

  async getAll(filters?: OrderFilters) {
    return apiClient.get<{ orders: Order[]; total: number; page: number; pages: number }>(
      this.baseUrl,
      { params: filters }
    )
  }

  async getById(id: string) {
    return apiClient.get<Order>(`${this.baseUrl}/${id}`)
  }

  async create(order: Order) {
    return apiClient.post<Order>(this.baseUrl, order)
  }

  async update(id: string, order: Partial<Order>) {
    return apiClient.put<Order>(`${this.baseUrl}/${id}`, order)
  }

  async delete(id: string) {
    return apiClient.delete(`${this.baseUrl}/${id}`)
  }

  async updateStatus(id: string, status: Order['status']) {
    return apiClient.patch<Order>(`${this.baseUrl}/${id}/status`, { status })
  }

  async updatePaymentStatus(id: string, paymentStatus: Order['paymentStatus']) {
    return apiClient.patch<Order>(`${this.baseUrl}/${id}/payment-status`, { paymentStatus })
  }

  async approve(id: string) {
    return apiClient.post<Order>(`${this.baseUrl}/${id}/approve`)
  }

  async cancel(id: string, reason: string) {
    return apiClient.post<Order>(`${this.baseUrl}/${id}/cancel`, { reason })
  }

  async getByCustomer(customerId: string) {
    return apiClient.get<Order[]>(`${this.baseUrl}/customer/${customerId}`)
  }

  async getBySalesAgent(agentId: string) {
    return apiClient.get<Order[]>(`${this.baseUrl}/agent/${agentId}`)
  }
}

export const ordersService = new OrdersService()
