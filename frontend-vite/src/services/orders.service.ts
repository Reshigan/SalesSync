import { apiClient } from './api.service'
import { API_CONFIG } from '../config/api.config'

export interface Order {
  id: string
  tenant_id: string
  order_number: string
  customer_id: string
  salesman_id?: string
  order_date: string
  delivery_date?: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method?: string
  payment_status: string
  order_status: string
  notes?: string
  created_at: string
  customer?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  product?: {
    id: string
    name: string
    sku?: string
  }
}

export interface OrderFilter {
  status?: string
  payment_status?: string
  customer_id?: string
  salesman_id?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

class OrdersService {
  private readonly baseUrl = API_CONFIG.ENDPOINTS.ORDERS.BASE

  async getOrders(filter?: OrderFilter): Promise<{ orders: Order[], total: number }> {
    try {
      const response = await apiClient.get(this.baseUrl, { params: filter })
      return {
        orders: response.data.data?.orders || response.data.data || [],
        total: response.data.data?.pagination?.total || response.data.data?.length || 0
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      throw error
    }
  }

  async getOrder(id: string): Promise<Order | null> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch order:', error)
      return null
    }
  }

  async createOrder(order: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    try {
      const response = await apiClient.post(this.baseUrl, order)
      return response.data
    } catch (error) {
      console.error('Failed to create order:', error)
      throw error
    }
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, updates)
      return response.data
    } catch (error) {
      console.error('Failed to update order:', error)
      throw error
    }
  }

  async deleteOrder(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      console.error('Failed to delete order:', error)
      throw error
    }
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${orderId}/items`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch order items:', error)
      return []
    }
  }

}

export const ordersService = new OrdersService()