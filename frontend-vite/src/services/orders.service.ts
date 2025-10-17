import { apiClient } from './api.service'

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
  private baseUrl = '/api/orders'

  async getOrders(filter?: OrderFilter): Promise<{ orders: Order[], total: number }> {
    try {
      const response = await apiClient.get(this.baseUrl, { params: filter })
      return {
        orders: response.data.data?.orders || response.data.data || [],
        total: response.data.data?.pagination?.total || response.data.data?.length || 0
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      // Return mock data for development
      return this.getMockOrders(filter)
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

  // Mock data for development
  private getMockOrders(filter?: OrderFilter): { orders: Order[], total: number } {
    const mockOrders: Order[] = [
      {
        id: '132222ef28591ab877b2ca90263ed8bb',
        tenant_id: 'demo',
        order_number: 'ORD-001',
        customer_id: 'c874a76dc577e314126efbc7ef6e36a9',
        order_date: '2025-10-06',
        subtotal: 150.00,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 150.00,
        payment_status: 'pending',
        order_status: 'pending',
        created_at: '2025-10-06T06:30:34Z',
        customer: {
          id: 'c874a76dc577e314126efbc7ef6e36a9',
          name: 'Demo Customer',
          email: 'customer@demo.com',
          phone: '+44 123 456 7890'
        },
        items: [
          {
            id: '7e03b0a0041b4c94342f326bd3056096',
            order_id: '132222ef28591ab877b2ca90263ed8bb',
            product_id: '76f4d483-bdaa-40e9-94e1-65b8dcdca410',
            quantity: 2,
            unit_price: 75.00,
            discount_amount: 0,
            tax_amount: 0,
            total_amount: 150.00,
            product: {
              id: '76f4d483-bdaa-40e9-94e1-65b8dcdca410',
              name: 'Premium Product',
              sku: 'PROD-001'
            }
          }
        ]
      }
    ]

    let filteredOrders = mockOrders

    if (filter) {
      filteredOrders = mockOrders.filter(order => {
        if (filter.status && order.order_status !== filter.status) return false
        if (filter.payment_status && order.payment_status !== filter.payment_status) return false
        if (filter.customer_id && order.customer_id !== filter.customer_id) return false
        return true
      })
    }

    const limit = filter?.limit || 10
    const page = filter?.page || 1
    const start = (page - 1) * limit
    const end = start + limit

    return {
      orders: filteredOrders.slice(start, end),
      total: filteredOrders.length
    }
  }
}

export const ordersService = new OrdersService()