import { ApiService } from './api.service'

export interface InventoryItem {
  id: string
  tenant_id: string
  product_id: string
  product_name: string
  product_code: string
  warehouse_id?: string
  warehouse_name?: string
  van_id?: string
  van_code?: string
  current_stock: number
  reserved_stock: number
  available_stock: number
  minimum_stock: number
  maximum_stock: number
  reorder_point: number
  unit_cost: number
  total_value: number
  last_updated: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked'
}

export interface StockMovement {
  id: string
  tenant_id: string
  product_id: string
  product_name: string
  movement_type: 'in' | 'out' | 'transfer' | 'adjustment'
  quantity: number
  unit_cost: number
  total_cost: number
  reference_type: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'return'
  reference_id?: string
  from_location?: string
  to_location?: string
  notes?: string
  created_by: string
  created_at: string
  batch_number?: string
  expiry_date?: string
}

export interface StockAdjustment {
  id: string
  tenant_id: string
  product_id: string
  current_stock: number
  adjusted_stock: number
  adjustment_quantity: number
  reason: 'damaged' | 'expired' | 'lost' | 'found' | 'correction' | 'other'
  notes?: string
  created_by: string
  created_at: string
}

export interface StockTransfer {
  id: string
  tenant_id: string
  from_location: string
  to_location: string
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  items: StockTransferItem[]
  requested_by: string
  approved_by?: string
  completed_by?: string
  requested_at: string
  approved_at?: string
  completed_at?: string
  notes?: string
}

export interface StockTransferItem {
  product_id: string
  product_name: string
  quantity_requested: number
  quantity_approved?: number
  quantity_transferred?: number
  unit_cost: number
}

export interface InventoryFilter {
  search?: string
  product_id?: string
  warehouse_id?: string
  van_id?: string
  status?: string
  low_stock_only?: boolean
  out_of_stock_only?: boolean
  location_id?: string
  stock_status?: string
  category?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface StockMovementFilter {
  search?: string
  product_id?: string
  movement_type?: string
  reference_type?: string
  start_date?: string
  end_date?: string
  created_by?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface InventoryStats {
  total_products: number
  total_stock_value: number
  low_stock_items: number
  out_of_stock_items: number
  overstocked_items: number
  stock_turnover_ratio: number
  top_moving_products: ProductMovement[]
  slow_moving_products: ProductMovement[]
}

export interface ProductMovement {
  product_id: string
  product_name: string
  current_stock: number
  movement_velocity: number
  last_movement_date: string
  total_value: number
}

export interface StockCount {
  id: string
  tenant_id: string
  location: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  items: StockCountItem[]
  scheduled_date: string
  started_at?: string
  completed_at?: string
  created_by: string
  counted_by?: string
  notes?: string
}

export interface StockCountItem {
  product_id: string
  product_name: string
  system_quantity: number
  counted_quantity?: number
  variance?: number
  variance_value?: number
  notes?: string
}

class InventoryService extends ApiService {
  private baseUrl = '/inventory'

  async getInventory(filter: InventoryFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}?${params.toString()}`)
    return response.data
  }

  async getInventoryItem(productId: string, locationId?: string) {
    const url = locationId 
      ? `${this.baseUrl}/${productId}?location_id=${locationId}`
      : `${this.baseUrl}/${productId}`
    
    const response = await this.get(url)
    return response.data
  }

  async updateInventoryItem(productId: string, data: Partial<InventoryItem>) {
    const response = await this.put(`${this.baseUrl}/${productId}`, data)
    return response.data
  }

  async getStockMovements(filter: StockMovementFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/movements?${params.toString()}`)
    return response.data
  }

  async createStockMovement(movement: Partial<StockMovement>) {
    const response = await this.post(`${this.baseUrl}/movements`, movement)
    return response.data
  }

  async adjustStock(id: string, adjustment: Partial<StockAdjustment>) {
    const response = await this.post(`${this.baseUrl}/adjustments`, { ...adjustment, product_id: id })
    return response.data
  }

  async getStockAdjustments(filter: any = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/adjustments?${params.toString()}`)
    return response.data
  }

  async createStockTransfer(transfer: Partial<StockTransfer>) {
    const response = await this.post(`${this.baseUrl}/transfers`, transfer)
    return response.data
  }

  async getStockTransfers(filter: any = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/transfers?${params.toString()}`)
    return response.data
  }

  async approveStockTransfer(transferId: string) {
    const response = await this.post(`${this.baseUrl}/transfers/${transferId}/approve`)
    return response.data
  }

  async completeStockTransfer(transferId: string, items: StockTransferItem[]) {
    const response = await this.post(`${this.baseUrl}/transfers/${transferId}/complete`, { items })
    return response.data
  }

  async cancelStockTransfer(transferId: string, reason?: string) {
    const response = await this.post(`${this.baseUrl}/transfers/${transferId}/cancel`, { reason })
    return response.data
  }



  async getLowStockItems() {
    const response = await this.get(`${this.baseUrl}/low-stock`)
    return response.data
  }

  async getOutOfStockItems() {
    const response = await this.get(`${this.baseUrl}/out-of-stock`)
    return response.data
  }

  async createStockCount(stockCount: Partial<StockCount>) {
    const response = await this.post(`${this.baseUrl}/stock-counts`, stockCount)
    return response.data
  }

  async getStockCounts(filter: any = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/stock-counts?${params.toString()}`)
    return response.data
  }

  async startStockCount(stockCountId: string) {
    const response = await this.post(`${this.baseUrl}/stock-counts/${stockCountId}/start`)
    return response.data
  }

  async updateStockCount(stockCountId: string, items: StockCountItem[]) {
    const response = await this.put(`${this.baseUrl}/stock-counts/${stockCountId}`, { items })
    return response.data
  }

  async completeStockCount(stockCountId: string) {
    const response = await this.post(`${this.baseUrl}/stock-counts/${stockCountId}/complete`)
    return response.data
  }

  async exportInventoryReport(format: 'csv' | 'excel' = 'csv', filter: InventoryFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    params.append('format', format)

    const response = await this.get(`${this.baseUrl}/export?${params.toString()}`, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inventory-report-${Date.now()}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  async importInventoryData(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.post(`${this.baseUrl}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async getInventoryValuation() {
    const response = await this.get(`${this.baseUrl}/valuation`)
    return response.data
  }

  async getStockMovementHistory(productId: string, days: number = 30) {
    const response = await this.get(`${this.baseUrl}/${productId}/movements?days=${days}`)
    return response.data
  }

  // Additional methods for missing functionality
  async getInventoryTrends(filter: InventoryFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/trends?${params.toString()}`)
    return response.data
  }

  async getStockAlerts() {
    const response = await this.get(`${this.baseUrl}/alerts`)
    return response.data
  }



  async getInventoryReports(type: string, filter: InventoryFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    params.append('type', type)

    const response = await this.get(`${this.baseUrl}/reports?${params.toString()}`)
    return response.data
  }

  async getStockLevels(filter: InventoryFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/stock-levels?${params.toString()}`)
    return response.data
  }

  async getInventoryMetrics(filter: InventoryFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/metrics?${params.toString()}`)
    return response.data
  }

  // Additional missing methods
  async getInventoryItems(filter: any = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/items?${params.toString()}`)
    return response.data
  }

  async getLocations() {
    const response = await this.get(`${this.baseUrl}/locations`)
    return response.data
  }

  async deleteInventoryItem(id: string) {
    const response = await this.delete(`${this.baseUrl}/items/${id}`)
    return response.data
  }

  async bulkUpdateItems(ids: string[], updates: any) {
    const response = await this.put(`${this.baseUrl}/items/bulk`, { ids, updates })
    return response.data
  }

  async importInventoryItems(file: File) {
    return this.importInventoryData(file)
  }

  async getInventoryStats(dateRange?: any) {
    const params = new URLSearchParams()
    if (dateRange?.start_date) params.append('start_date', dateRange.start_date)
    if (dateRange?.end_date) params.append('end_date', dateRange.end_date)

    const response = await this.get(`${this.baseUrl}/stats?${params.toString()}`)
    return response.data
  }

  async getInventoryAnalytics(filter: any = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/analytics?${params.toString()}`)
    return response.data
  }
}

export const inventoryService = new InventoryService()