import { apiClient } from './api.service'

export interface StockItem {
  product_id: string
  product_code: string
  product_name: string
  warehouse_id: string
  warehouse_name: string
  current_stock: number
  reserved_stock: number
  available_stock: number
  reorder_level: number
  last_updated: string
}

export interface StockMovement {
  id: string
  product_id: string
  product_name?: string
  warehouse_id: string
  warehouse_name?: string
  movement_type: 'in' | 'out' | 'transfer' | 'adjustment'
  quantity: number
  reference_type?: string
  reference_id?: string
  notes?: string
  created_at: string
}

export interface StockCount {
  id: string
  warehouse_id: string
  warehouse_name?: string
  count_date: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  counted_by: string
  variance_count: number
  total_items: number
}

export interface Warehouse {
  id: string
  warehouse_name: string
  location: string
  warehouse_type: 'main' | 'regional' | 'branch'
  capacity: number
  manager_id?: string
  status: 'active' | 'inactive'
}

class InventoryService {
  private readonly baseUrl = '/inventory'

  async getStock(filter?: any): Promise<{ data: StockItem[], total: number }> {
    try {
      const response = await apiClient.get(this.baseUrl, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch stock:', error)
      throw error
    }
  }

  async getProductInventory(productId: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/product/${productId}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch product inventory:', error)
      return null
    }
  }

  async updateInventory(id: string, data: any): Promise<any> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to update inventory:', error)
      throw error
    }
  }

  async createInventory(data: any): Promise<any> {
    try {
      const response = await apiClient.post(this.baseUrl, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create inventory:', error)
      throw error
    }
  }

  async getLowStock(): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/low-stock`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch low stock:', error)
      return []
    }
  }

  async getStockMovements(filter?: any): Promise<{ data: StockMovement[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}-enhanced/transactions`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch stock movements:', error)
      throw error
    }
  }

  async createStockMovement(data: Partial<StockMovement>): Promise<StockMovement> {
    try {
      const response = await apiClient.post(`${this.baseUrl}-enhanced/adjust`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create stock movement:', error)
      throw error
    }
  }

  async transferStock(data: { from_warehouse_id: string, to_warehouse_id: string, product_id: string, quantity: number, notes?: string }): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}-enhanced/transfer`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to transfer stock:', error)
      throw error
    }
  }

  async getStockCounts(filter?: any): Promise<{ data: StockCount[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/counts`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch stock counts:', error)
      throw error
    }
  }

  async createStockCount(data: Partial<StockCount>): Promise<StockCount> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/counts`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create stock count:', error)
      throw error
    }
  }

  async getWarehouses(filter?: any): Promise<{ data: Warehouse[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/warehouses`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch warehouses:', error)
      throw error
    }
  }

  async createWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/warehouses`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create warehouse:', error)
      throw error
    }
  }

  async getInventoryStats(filter?: any): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`, { params: filter })
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch inventory stats:', error)
      throw error
    }
  }
}

export const inventoryService = new InventoryService()
