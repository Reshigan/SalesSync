import { apiClient } from '@/lib/api-client'

export interface InventoryMovement {
  id?: string
  type: 'receive' | 'transfer' | 'adjust' | 'sale' | 'return'
  warehouseId: string
  warehouseName?: string
  productId: string
  productName?: string
  quantity: number
  unitCost?: number
  referenceNumber?: string
  notes?: string
  createdBy?: string
  createdAt?: string
}

export interface GoodsReceipt {
  warehouseId: string
  supplierId: string
  referenceNumber: string
  items: Array<{
    productId: string
    quantity: number
    unitCost: number
    batchNumber?: string
    expiryDate?: string
  }>
  notes?: string
}

export interface StockTransfer {
  fromWarehouseId: string
  toWarehouseId: string
  items: Array<{
    productId: string
    quantity: number
  }>
  notes?: string
}

export interface StockAdjustment {
  warehouseId: string
  reason: 'damage' | 'loss' | 'found' | 'correction' | 'other'
  items: Array<{
    productId: string
    quantityChange: number
  }>
  notes?: string
}

class InventoryService {
  private baseUrl = '/inventory'

  async getMovements(filters?: any) {
    return apiClient.get<{ movements: InventoryMovement[]; total: number }>(
      `${this.baseUrl}/movements`,
      { params: filters }
    )
  }

  async getStockLevels(warehouseId?: string) {
    return apiClient.get<any[]>(`${this.baseUrl}/stock`, { params: { warehouseId } })
  }

  async receiveStock(receipt: GoodsReceipt) {
    return apiClient.post(`${this.baseUrl}/receive`, receipt)
  }

  async transferStock(transfer: StockTransfer) {
    return apiClient.post(`${this.baseUrl}/transfer`, transfer)
  }

  async adjustStock(adjustment: StockAdjustment) {
    return apiClient.post(`${this.baseUrl}/adjust`, adjustment)
  }

  async getLowStockAlerts() {
    return apiClient.get<any[]>(`${this.baseUrl}/alerts/low-stock`)
  }

  async getStockValue(warehouseId?: string) {
    return apiClient.get<{ totalValue: number; itemCount: number }>(
      `${this.baseUrl}/value`,
      { params: { warehouseId } }
    )
  }
}

export const inventoryService = new InventoryService()
