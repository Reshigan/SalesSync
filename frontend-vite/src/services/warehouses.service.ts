/**
 * Warehouses Service
 * Handles warehouse management and operations
 */

import { apiClient } from './api.service'
import { API_CONFIG } from '../config/api.config'

export interface Warehouse {
  id: string
  tenant_id: string
  name: string
  code: string
  location: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  latitude?: number
  longitude?: number
  capacity?: number
  manager_id?: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface WarehouseStock {
  warehouse_id: string
  product_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  min_stock_level?: number
  max_stock_level?: number
  reorder_point?: number
  product?: {
    id: string
    name: string
    code: string
  }
}

export interface StockTransfer {
  id: string
  tenant_id: string
  transfer_number: string
  from_warehouse_id: string
  to_warehouse_id: string
  transfer_date: string
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  items?: Array<{
    product_id: string
    quantity: number
    received_quantity?: number
  }>
}

class WarehousesService {
  private readonly baseUrl = API_CONFIG.ENDPOINTS.WAREHOUSES.BASE

  async getWarehouses(filter?: any): Promise<{ warehouses: Warehouse[], total: number }> {
    try {
      const response = await apiClient.get(this.baseUrl, { params: filter })
      return {
        warehouses: response.data.data?.warehouses || response.data.data || [],
        total: response.data.data?.pagination?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch warehouses:', error)
      throw error
    }
  }

  async getWarehouse(id: string): Promise<Warehouse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch warehouse:', error)
      throw error
    }
  }

  async createWarehouse(warehouse: Partial<Warehouse>): Promise<Warehouse> {
    try {
      const response = await apiClient.post(this.baseUrl, warehouse)
      return response.data.data
    } catch (error) {
      console.error('Failed to create warehouse:', error)
      throw error
    }
  }

  async updateWarehouse(id: string, updates: Partial<Warehouse>): Promise<Warehouse> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, updates)
      return response.data.data
    } catch (error) {
      console.error('Failed to update warehouse:', error)
      throw error
    }
  }

  async deleteWarehouse(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      console.error('Failed to delete warehouse:', error)
      throw error
    }
  }

  // Warehouse Stock
  async getWarehouseStock(warehouseId: string, filter?: any): Promise<WarehouseStock[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${warehouseId}/stock`, { params: filter })
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch warehouse stock:', error)
      return []
    }
  }

  async getProductStock(productId: string): Promise<WarehouseStock[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stock/product/${productId}`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch product stock:', error)
      return []
    }
  }

  async updateStock(warehouseId: string, stockData: {
    product_id: string
    quantity: number
    type: 'add' | 'subtract' | 'set'
    reason?: string
  }): Promise<WarehouseStock> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${warehouseId}/stock`, stockData)
      return response.data.data
    } catch (error) {
      console.error('Failed to update warehouse stock:', error)
      throw error
    }
  }

  // Stock Transfers
  async getTransfers(filter?: any): Promise<{ transfers: StockTransfer[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/transfers`, { params: filter })
      return {
        transfers: response.data.data?.transfers || response.data.data || [],
        total: response.data.data?.pagination?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch transfers:', error)
      throw error
    }
  }

  async getTransfer(id: string): Promise<StockTransfer> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/transfers/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch transfer:', error)
      throw error
    }
  }

  async createTransfer(transfer: Partial<StockTransfer>): Promise<StockTransfer> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/transfers`, transfer)
      return response.data.data
    } catch (error) {
      console.error('Failed to create transfer:', error)
      throw error
    }
  }

  async updateTransferStatus(id: string, status: StockTransfer['status']): Promise<StockTransfer> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/transfers/${id}/status`, { status })
      return response.data.data
    } catch (error) {
      console.error('Failed to update transfer status:', error)
      throw error
    }
  }

  async getWarehouseStats(warehouseId: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${warehouseId}/stats`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch warehouse stats:', error)
      throw error
    }
  }

  // Enhanced Warehouse Methods - matching new backend endpoints
  async getWarehouseDetail(id: string): Promise<WarehouseDetail> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch warehouse detail:', error)
      throw error
    }
  }

  async createWarehouseRecord(data: {
    name: string
    code?: string
    location?: string
    address?: string
    city?: string
    region?: string
    country?: string
    latitude?: number
    longitude?: number
    warehouse_type?: string
    manager_id?: string
    capacity?: number
  }): Promise<Warehouse> {
    try {
      const response = await apiClient.post(this.baseUrl, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create warehouse:', error)
      throw error
    }
  }

  async getWarehouseInventory(warehouseId: string, filter?: any): Promise<{ inventory: WarehouseInventoryItem[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${warehouseId}/inventory`, { params: filter })
      return {
        inventory: response.data.data?.inventory || response.data.data || [],
        total: response.data.data?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch warehouse inventory:', error)
      throw error
    }
  }

  async getWarehouseStockMovements(warehouseId: string, filter?: any): Promise<{ movements: StockMovement[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${warehouseId}/stock-movements`, { params: filter })
      return {
        movements: response.data.data?.movements || response.data.data || [],
        total: response.data.data?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch warehouse stock movements:', error)
      throw error
    }
  }
}

// Additional interfaces for new endpoints
export interface WarehouseDetail extends Warehouse {
  inventory_summary?: {
    total_products: number
    total_quantity: number
    total_value: number
    low_stock_count: number
  }
  manager_name?: string
  warehouse_type?: string
  region?: string
}

export interface WarehouseInventoryItem {
  product_id: string
  product_name: string
  product_code: string
  quantity_on_hand: number
  unit_cost: number
  total_value: number
  min_stock_level?: number
  max_stock_level?: number
  reorder_point?: number
  last_movement_date?: string
}

export interface StockMovement {
  id: string
  warehouse_id: string
  product_id: string
  product_name?: string
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  reference_type?: string
  reference_id?: string
  notes?: string
  created_by?: string
  created_at: string
}

export const warehousesService = new WarehousesService()
