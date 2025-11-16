import { apiClient } from './api.service'

export interface VanRoute {
  id: string
  route_name: string
  van_id: string
  driver_id: string
  start_location: string
  end_location: string
  planned_stops: number
  completed_stops: number
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  route_date: string
  created_at: string
}

export interface VanInventory {
  product_id: string
  product_code: string
  product_name: string
  current_stock: number
  loaded_stock: number
  sold_stock: number
  returned_stock: number
  total_value: number
  last_updated: string
}

export interface VanOrder {
  id: string
  order_number: string
  customer_id: string
  customer_name: string
  van_id: string
  route_id: string
  order_date: string
  total_amount: number
  payment_method: 'cash' | 'credit' | 'mobile_money'
  payment_status: 'pending' | 'paid' | 'partial'
  delivery_status: 'pending' | 'delivered' | 'failed'
  items: VanOrderItem[]
}

export interface VanOrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

class VanSalesService {
  private readonly baseUrl = '/van-sales'

  async getRoutes(filter?: any): Promise<{ data: VanRoute[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/routes`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch van routes:', error)
      throw error
    }
  }

  async getRoute(id: string): Promise<VanRoute> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/routes/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch van route:', error)
      throw error
    }
  }

  async createRoute(data: Partial<VanRoute>): Promise<VanRoute> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/routes`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create van route:', error)
      throw error
    }
  }

  async updateRoute(id: string, data: Partial<VanRoute>): Promise<VanRoute> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/routes/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to update van route:', error)
      throw error
    }
  }

  async deleteRoute(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/routes/${id}`)
    } catch (error) {
      console.error('Failed to delete van route:', error)
      throw error
    }
  }

  async getVanInventory(vanId: string): Promise<VanInventory[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/vans/${vanId}/inventory`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch van inventory:', error)
      throw error
    }
  }

  async loadVanInventory(vanId: string, items: any[]): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/vans/${vanId}/load`, { items })
    } catch (error) {
      console.error('Failed to load van inventory:', error)
      throw error
    }
  }

  async getVanOrders(filter?: any): Promise<{ data: VanOrder[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/orders`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch van orders:', error)
      throw error
    }
  }

  async getVanOrder(id: string): Promise<VanOrder> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/orders/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch van order:', error)
      throw error
    }
  }

  async createVanOrder(data: Partial<VanOrder>): Promise<VanOrder> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/orders`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create van order:', error)
      throw error
    }
  }

  async getVanSalesStats(filter?: any): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`, { params: filter })
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch van sales stats:', error)
      throw error
    }
  }

  async getRouteStops(routeId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/routes/${routeId}/stops`)
      return response.data.data?.stops || []
    } catch (error) {
      console.error('Failed to fetch route stops:', error)
      throw error
    }
  }

  async getRouteExceptions(routeId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/routes/${routeId}/exceptions`)
      return response.data.data?.exceptions || []
    } catch (error) {
      console.error('Failed to fetch route exceptions:', error)
      throw error
    }
  }

  async getVanLoadItems(loadId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/loads/${loadId}/items`)
      return response.data.data?.items || []
    } catch (error) {
      console.error('Failed to fetch van load items:', error)
      throw error
    }
  }
}

export const vanSalesService = new VanSalesService()
