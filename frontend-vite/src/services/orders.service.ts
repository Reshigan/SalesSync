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
  id?: string
  order_id?: string
  product_id: string
  product_name?: string
  product_code?: string
  product_sku?: string
  unit_of_measure?: string
  quantity: number
  unit_price: number
  discount_percentage?: number
  discount_percent?: number
  discount_amount?: number
  tax_percentage?: number
  tax_rate?: number
  tax_amount?: number
  line_total: number
  subtotal?: number
  total?: number
  fulfillment_status?: 'pending' | 'partially_fulfilled' | 'fulfilled'
  fulfilled_quantity?: number
  pending_quantity?: number
  notes?: string
  price_override_reason?: string
  created_at?: string
  updated_at?: string
  product?: {
    id: string
    name: string
    sku?: string
    code?: string
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
      return response.data.data?.order || response.data.data || null
    } catch (error) {
      console.error('Failed to fetch order:', error)
      return null
    }
  }

  async createOrder(order: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    try {
      const response = await apiClient.post(this.baseUrl, order)
      return response.data.data?.order || response.data.data
    } catch (error) {
      console.error('Failed to create order:', error)
      throw error
    }
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, updates)
      return response.data.data?.order || response.data.data
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
      const order = await this.getOrder(orderId)
      return order?.items || []
    } catch (error) {
      console.error('Failed to fetch order items:', error)
      return []
    }
  }

  async getCustomerOrders(customerId: string, limit: number = 10): Promise<Order[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/customer/${customerId}`, {
        params: { limit }
      })
      return response.data.data?.orders || []
    } catch (error) {
      console.error('Failed to fetch customer orders:', error)
      return []
    }
  }

  async getSalesmanOrders(salesmanId: string, filters?: { date_from?: string, date_to?: string, limit?: number }): Promise<Order[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/salesman/${salesmanId}`, {
        params: filters
      })
      return response.data.data?.orders || []
    } catch (error) {
      console.error('Failed to fetch salesman orders:', error)
      return []
    }
  }

  async getOrderStats(): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch order stats:', error)
      return null
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/${id}/status`, { status })
    } catch (error) {
      console.error('Failed to update order status:', error)
      throw error
    }
  }

  async getOrderItemsList(orderId: string): Promise<OrderItem[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${orderId}/items`)
      return response.data.data?.items || []
    } catch (error) {
      console.error('Failed to fetch order items list:', error)
      return []
    }
  }

  async getOrderItem(orderId: string, itemId: string): Promise<OrderItem | null> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${orderId}/items/${itemId}`)
      return response.data.data?.item || null
    } catch (error) {
      console.error('Failed to fetch order item:', error)
      return null
    }
  }

  async updateOrderItem(orderId: string, itemId: string, updates: Partial<OrderItem>): Promise<OrderItem> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${orderId}/items/${itemId}`, updates)
      return response.data.data?.item || response.data.data
    } catch (error) {
      console.error('Failed to update order item:', error)
      throw error
    }
  }

  async getOrderDeliveries(orderId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${orderId}/deliveries`)
      return response.data.data?.deliveries || []
    } catch (error) {
      console.error('Failed to fetch order deliveries:', error)
      return []
    }
  }

  async getOrderDelivery(orderId: string, deliveryId: string): Promise<any | null> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${orderId}/deliveries/${deliveryId}`)
      return response.data.data?.delivery || null
    } catch (error) {
      console.error('Failed to fetch order delivery:', error)
      return null
    }
  }

  async getOrderReturns(orderId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${orderId}/returns`)
      return response.data.data?.returns || []
    } catch (error) {
      console.error('Failed to fetch order returns:', error)
      return []
    }
  }

  async getOrderStatusHistory(orderId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${orderId}/status-history`)
      return response.data.data?.statusHistory || []
    } catch (error) {
      console.error('Failed to fetch order status history:', error)
      return []
    }
  }

}

export const ordersService = new OrdersService()
