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

  // Van Inventory Ledger - New endpoints matching backend
  async getVanInventoryLedger(filter?: any): Promise<{ inventory: VanInventoryItem[], total: number }> {
    try {
      const response = await apiClient.get('/van-inventory', { params: filter })
      return {
        inventory: response.data.data?.inventory || response.data.data || [],
        total: response.data.data?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch van inventory ledger:', error)
      throw error
    }
  }

  async getVanInventorySummary(vanId: string): Promise<VanInventorySummary> {
    try {
      const response = await apiClient.get(`/van-inventory/${vanId}/summary`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch van inventory summary:', error)
      throw error
    }
  }

  async loadVanStock(data: {
    van_id: string
    product_id: string
    quantity: number
    unit_cost?: number
    reference_type?: string
    reference_id?: string
  }): Promise<VanInventoryItem> {
    try {
      const response = await apiClient.post('/van-inventory/load', data)
      return response.data.data
    } catch (error) {
      console.error('Failed to load van stock:', error)
      throw error
    }
  }

  async unloadVanStock(data: {
    van_id: string
    product_id: string
    quantity: number
    reference_type?: string
    reference_id?: string
  }): Promise<VanInventoryItem> {
    try {
      const response = await apiClient.post('/van-inventory/unload', data)
      return response.data.data
    } catch (error) {
      console.error('Failed to unload van stock:', error)
      throw error
    }
  }

  async recordVanSale(data: {
    van_id: string
    product_id: string
    quantity: number
    sale_price?: number
    order_id?: string
  }): Promise<VanInventoryItem> {
    try {
      const response = await apiClient.post('/van-inventory/sale', data)
      return response.data.data
    } catch (error) {
      console.error('Failed to record van sale:', error)
      throw error
    }
  }

  async getVanStockMovements(vanId: string, filter?: any): Promise<{ movements: VanStockMovement[], total: number }> {
    try {
      const response = await apiClient.get(`/van-inventory/${vanId}/movements`, { params: filter })
      return {
        movements: response.data.data?.movements || response.data.data || [],
        total: response.data.data?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch van stock movements:', error)
      throw error
    }
  }

  // Vans - Enhanced endpoints
  async getVans(filter?: any): Promise<{ vans: Van[], total: number }> {
    try {
      const response = await apiClient.get('/vans', { params: filter })
      return {
        vans: response.data.data?.vans || response.data.data || [],
        total: response.data.data?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch vans:', error)
      throw error
    }
  }

  async getVanDetail(id: string): Promise<VanDetail> {
    try {
      const response = await apiClient.get(`/vans/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch van detail:', error)
      throw error
    }
  }

  async createVan(data: {
    registration_number: string
    make?: string
    model?: string
    year?: string
    capacity?: number
    status?: string
  }): Promise<Van> {
    try {
      const response = await apiClient.post('/vans', data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create van:', error)
      throw error
    }
  }

  async updateVan(id: string, data: Partial<Van>): Promise<Van> {
    try {
      const response = await apiClient.put(`/vans/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to update van:', error)
      throw error
    }
  }

  async assignVanDriver(vanId: string, driverId: string): Promise<Van> {
    try {
      const response = await apiClient.post(`/vans/${vanId}/assign-driver`, { driver_id: driverId })
      return response.data.data
    } catch (error) {
      console.error('Failed to assign van driver:', error)
      throw error
    }
  }
}

// Additional interfaces for new endpoints
export interface VanInventoryItem {
  id: string
  van_id: string
  product_id: string
  product_name?: string
  product_code?: string
  quantity_on_hand: number
  unit_cost: number
  total_value?: number
  created_at: string
  updated_at?: string
}

export interface VanInventorySummary {
  van_id: string
  total_products: number
  total_quantity: number
  total_value: number
  last_load_date?: string
  last_sale_date?: string
}

export interface VanStockMovement {
  id: string
  van_id: string
  product_id: string
  product_name?: string
  movement_type: 'load' | 'unload' | 'sale' | 'return' | 'adjustment'
  quantity: number
  reference_type?: string
  reference_id?: string
  created_by?: string
  created_at: string
}

export interface Van {
  id: string
  tenant_id: string
  registration_number: string
  make?: string
  model?: string
  year?: string
  capacity?: number
  driver_id?: string
  driver_name?: string
  status: 'active' | 'inactive' | 'maintenance'
  created_by?: string
  created_at: string
  updated_at?: string
}

export interface VanDetail extends Van {
  inventory_summary?: VanInventorySummary
  current_route?: any
  recent_sales?: any[]
}

export const vanSalesService = new VanSalesService()
