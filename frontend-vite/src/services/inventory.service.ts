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
      const response = await apiClient.get('/stock-movements', { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch stock movements:', error)
      throw error
    }
  }

  async createStockMovement(data: Partial<StockMovement>): Promise<StockMovement> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/adjustments/create`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create stock movement:', error)
      throw error
    }
  }

  async transferStock(data: { from_warehouse_id: string, to_warehouse_id: string, product_id: string, quantity: number, notes?: string }): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/transfers/create`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to transfer stock:', error)
      throw error
    }
  }

  async getStockCounts(filter?: any): Promise<{ data: StockCount[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stock-counts`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch stock counts:', error)
      throw error
    }
  }

  async createStockCount(data: Partial<StockCount>): Promise<StockCount> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/stock-counts/create`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create stock count:', error)
      throw error
    }
  }
  
  // Adjustments - use authoritative endpoints with stock movements
  async getAdjustments(filter?: any): Promise<{ data: any[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/adjustments`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch adjustments:', error)
      throw error
    }
  }

  async createAdjustment(data: any): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/adjustments/create`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create adjustment:', error)
      throw error
    }
  }

  async transitionAdjustment(id: string, new_status: string, notes?: string): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/adjustments/${id}/transition`, { new_status, notes })
      return response.data.data
    } catch (error) {
      console.error('Failed to transition adjustment:', error)
      throw error
    }
  }

  // Transfers - use authoritative endpoints with stock movements
  async getTransfers(filter?: any): Promise<{ data: any[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/transfers`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch transfers:', error)
      throw error
    }
  }

  async createTransfer(data: any): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/transfers/create`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create transfer:', error)
      throw error
    }
  }

  async transitionTransfer(id: string, new_status: string, notes?: string): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/transfers/${id}/transition`, { new_status, notes })
      return response.data.data
    } catch (error) {
      console.error('Failed to transition transfer:', error)
      throw error
    }
  }

  // Receipts (GRN) - use authoritative endpoints with stock movements
  async getReceipts(filter?: any): Promise<{ data: any[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/receipts`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch receipts:', error)
      throw error
    }
  }

  async createReceipt(data: any): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/receipts/create`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create receipt:', error)
      throw error
    }
  }

  async transitionReceipt(id: string, new_status: string, notes?: string): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/receipts/${id}/transition`, { new_status, notes })
      return response.data.data
    } catch (error) {
      console.error('Failed to transition receipt:', error)
      throw error
    }
  }

  // Issues - use authoritative endpoints with stock movements
  async getIssues(filter?: any): Promise<{ data: any[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/issues`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch issues:', error)
      throw error
    }
  }

  async createIssue(data: any): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/issues/create`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create issue:', error)
      throw error
    }
  }

  async transitionIssue(id: string, new_status: string, notes?: string): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/issues/${id}/transition`, { new_status, notes })
      return response.data.data
    } catch (error) {
      console.error('Failed to transition issue:', error)
      throw error
    }
  }

  async transitionStockCount(id: string, new_status: string, notes?: string): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/stock-counts/${id}/transition`, { new_status, notes })
      return response.data.data
    } catch (error) {
      console.error('Failed to transition stock count:', error)
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

  async getStockCountLines(countId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stock-counts/${countId}/lines`)
      return response.data.data?.lines || []
    } catch (error) {
      console.error('Failed to fetch stock count lines:', error)
      throw error
    }
  }

  async getAdjustmentItems(adjustmentId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/adjustments/${adjustmentId}/items`)
      return response.data.data?.items || []
    } catch (error) {
      console.error('Failed to fetch adjustment items:', error)
      throw error
    }
  }

  async getTransferItems(transferId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/transfers/${transferId}/items`)
      return response.data.data?.items || []
    } catch (error) {
      console.error('Failed to fetch transfer items:', error)
      throw error
    }
  }

  async getBatchTracking(batchId: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/batches/${batchId}/tracking`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch batch tracking:', error)
      throw error
    }
  }

  async getLotTracking(lotId: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/lots/${lotId}/tracking`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch lot tracking:', error)
      throw error
    }
  }

  async getBatchMovements(batchId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/batches/${batchId}/movements`)
      return response.data.data?.movements || []
    } catch (error) {
      console.error('Failed to fetch batch movements:', error)
      throw error
    }
  }

  async getBatchAllocations(batchId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/batches/${batchId}/allocations`)
      return response.data.data?.allocations || []
    } catch (error) {
      console.error('Failed to fetch batch allocations:', error)
      throw error
    }
  }

  async getStockLedgerByProduct(productId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stock-ledger/product/${productId}`)
      return response.data.data?.ledger || []
    } catch (error) {
      console.error('Failed to fetch stock ledger by product:', error)
      throw error
    }
  }

  async getStockLedgerByWarehouse(warehouseId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stock-ledger/warehouse/${warehouseId}`)
      return response.data.data?.ledger || []
    } catch (error) {
      console.error('Failed to fetch stock ledger by warehouse:', error)
      throw error
    }
  }

  async getSerialTracking(serialNumber: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/serials/${serialNumber}/tracking`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch serial tracking:', error)
      throw error
    }
  }
}

export const inventoryService = new InventoryService()
