import { apiClient } from '../lib/api-client'

export interface Product {
  id: string
  name: string
  description?: string
  type: 'SIM_CARD' | 'PHONE' | 'ACCESSORY' | 'MARKETING_MATERIAL'
  category: string
  brand: string
  model?: string
  sku: string
  barcode?: string
  price: number
  cost?: number
  currency: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: 'cm' | 'inch'
  }
  specifications?: Record<string, any>
  images?: string[]
  isActive: boolean
  requiresRecipientInfo: boolean
  requiresIdVerification: boolean
  requiresSignature: boolean
  requiresPhoto: boolean
  commissionRate: number
  commissionType: 'FIXED' | 'PERCENTAGE'
  distributionForm?: ProductDistributionForm
  createdAt: string
  updatedAt: string
}

export interface ProductDistributionForm {
  id: string
  productId: string
  name: string
  fields: FormField[]
  validationRules: ValidationRule[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface FormField {
  id: string
  name: string
  label: string
  type: 'TEXT' | 'NUMBER' | 'EMAIL' | 'PHONE' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'MULTISELECT' | 'FILE' | 'PHOTO'
  required: boolean
  placeholder?: string
  helpText?: string
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  conditional?: {
    field: string
    value: any
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  }
  order: number
}

export interface ValidationRule {
  id: string
  field: string
  rule: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom'
  value?: any
  message: string
  isActive: boolean
}

export interface ProductDistribution {
  id: string
  customerId: string
  agentId: string
  visitId?: string
  productId: string
  quantity: number
  distributionDate: string
  recipientName: string
  recipientPhone?: string
  recipientEmail?: string
  recipientIdNumber?: string
  recipientSignature?: string
  status: 'PENDING' | 'DISTRIBUTED' | 'RETURNED' | 'CANCELLED'
  notes?: string
  photoUrl?: string
  formData?: Record<string, any>
  commissionAmount?: number
  serialNumbers?: string[]
  batchNumber?: string
  expiryDate?: string
  returnDate?: string
  returnReason?: string
  createdAt: string
  updatedAt: string
  
  // Relationships
  customer?: {
    id: string
    name: string
    address: string
    phone?: string
  }
  agent?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  product?: Product
  visit?: {
    id: string
    scheduledDate: string
    status: string
  }
}

export interface Inventory {
  id: string
  productId: string
  agentId?: string
  warehouseId?: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  minStockLevel: number
  maxStockLevel: number
  reorderPoint: number
  lastRestockDate?: string
  nextRestockDate?: string
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED'
  location?: string
  batchNumbers?: string[]
  serialNumbers?: string[]
  expiryDates?: string[]
  createdAt: string
  updatedAt: string
  
  // Relationships
  product?: Product
  agent?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface ProductDistributionSearchParams {
  agentId?: string
  customerId?: string
  productId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  recipientName?: string
  batchNumber?: string
  serialNumber?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ProductDistributionCreateRequest {
  customerId: string
  productId: string
  visitId?: string
  quantity: number
  recipientName: string
  recipientPhone?: string
  recipientEmail?: string
  recipientIdNumber?: string
  notes?: string
  formData?: Record<string, any>
  serialNumbers?: string[]
  batchNumber?: string
}

export interface ProductDistributionUpdateRequest extends Partial<ProductDistributionCreateRequest> {
  status?: 'PENDING' | 'DISTRIBUTED' | 'RETURNED' | 'CANCELLED'
  recipientSignature?: string
  photoUrl?: string
  returnDate?: string
  returnReason?: string
}

export interface ProductCreateRequest {
  name: string
  description?: string
  type: 'SIM_CARD' | 'PHONE' | 'ACCESSORY' | 'MARKETING_MATERIAL'
  category: string
  brand: string
  model?: string
  sku: string
  barcode?: string
  price: number
  cost?: number
  currency: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: 'cm' | 'inch'
  }
  specifications?: Record<string, any>
  requiresRecipientInfo: boolean
  requiresIdVerification: boolean
  requiresSignature: boolean
  requiresPhoto: boolean
  commissionRate: number
  commissionType: 'FIXED' | 'PERCENTAGE'
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  isActive?: boolean
}

class ProductService {
  private baseUrl = '/products'

  // Product management
  async getProducts(params?: {
    type?: string
    category?: string
    brand?: string
    isActive?: boolean
    search?: string
    page?: number
    limit?: number
  }): Promise<{ products: Product[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams()
    
    if (params?.type) queryParams.append('type', params.type)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.brand) queryParams.append('brand', params.brand)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl
    return await apiClient.get<{ products: Product[]; total: number; page: number; limit: number }>(url)
  }

  async getProduct(id: string): Promise<Product> {
    return await apiClient.get<Product>(`${this.baseUrl}/${id}`)
  }

  async createProduct(data: ProductCreateRequest): Promise<Product> {
    return await apiClient.post<Product>(this.baseUrl, data)
  }

  async updateProduct(id: string, data: ProductUpdateRequest): Promise<Product> {
    return await apiClient.put<Product>(`${this.baseUrl}/${id}`, data)
  }

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`)
  }

  // Product images
  async uploadProductImage(productId: string, file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData()
    formData.append('image', file)
    
    return await apiClient.upload<{ imageUrl: string }>(`${this.baseUrl}/${productId}/images`, formData)
  }

  async deleteProductImage(productId: string, imageUrl: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${productId}/images`, {
      data: { imageUrl }
    })
  }

  // Product distribution forms
  async getProductDistributionForm(productId: string): Promise<ProductDistributionForm | null> {
    try {
      return await apiClient.get<ProductDistributionForm>(`${this.baseUrl}/${productId}/distribution-form`)
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  async createProductDistributionForm(productId: string, data: {
    name: string
    fields: Omit<FormField, 'id'>[]
    validationRules: Omit<ValidationRule, 'id'>[]
  }): Promise<ProductDistributionForm> {
    return await apiClient.post<ProductDistributionForm>(`${this.baseUrl}/${productId}/distribution-form`, data)
  }

  async updateProductDistributionForm(productId: string, formId: string, data: {
    name?: string
    fields?: Omit<FormField, 'id'>[]
    validationRules?: Omit<ValidationRule, 'id'>[]
    isActive?: boolean
  }): Promise<ProductDistributionForm> {
    return await apiClient.put<ProductDistributionForm>(`${this.baseUrl}/${productId}/distribution-form/${formId}`, data)
  }

  async deleteProductDistributionForm(productId: string, formId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${productId}/distribution-form/${formId}`)
  }

  // Product distributions
  async getProductDistributions(params?: ProductDistributionSearchParams): Promise<{ distributions: ProductDistribution[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams()
    
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.customerId) queryParams.append('customerId', params.customerId)
    if (params?.productId) queryParams.append('productId', params.productId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params?.recipientName) queryParams.append('recipientName', params.recipientName)
    if (params?.batchNumber) queryParams.append('batchNumber', params.batchNumber)
    if (params?.serialNumber) queryParams.append('serialNumber', params.serialNumber)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const url = queryParams.toString() ? `${this.baseUrl}/distributions?${queryParams.toString()}` : `${this.baseUrl}/distributions`
    return await apiClient.get<{ distributions: ProductDistribution[]; total: number; page: number; limit: number }>(url)
  }

  async getProductDistribution(id: string): Promise<ProductDistribution> {
    return await apiClient.get<ProductDistribution>(`${this.baseUrl}/distributions/${id}`)
  }

  async createProductDistribution(data: ProductDistributionCreateRequest): Promise<ProductDistribution> {
    return await apiClient.post<ProductDistribution>(`${this.baseUrl}/distributions`, data)
  }

  async updateProductDistribution(id: string, data: ProductDistributionUpdateRequest): Promise<ProductDistribution> {
    return await apiClient.put<ProductDistribution>(`${this.baseUrl}/distributions/${id}`, data)
  }

  async deleteProductDistribution(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/distributions/${id}`)
  }

  // Distribution workflow
  async distributeProduct(id: string, data: {
    recipientSignature?: string
    photoUrl?: string
    notes?: string
    actualQuantity?: number
  }): Promise<ProductDistribution> {
    return await apiClient.post<ProductDistribution>(`${this.baseUrl}/distributions/${id}/distribute`, data)
  }

  async returnProduct(id: string, data: {
    returnReason: string
    returnQuantity: number
    notes?: string
    photoUrl?: string
  }): Promise<ProductDistribution> {
    return await apiClient.post<ProductDistribution>(`${this.baseUrl}/distributions/${id}/return`, data)
  }

  async cancelDistribution(id: string, reason: string): Promise<ProductDistribution> {
    return await apiClient.post<ProductDistribution>(`${this.baseUrl}/distributions/${id}/cancel`, { reason })
  }

  // Photo and signature upload
  async uploadDistributionPhoto(distributionId: string, file: File): Promise<{ photoUrl: string }> {
    const formData = new FormData()
    formData.append('photo', file)
    
    return await apiClient.upload<{ photoUrl: string }>(`${this.baseUrl}/distributions/${distributionId}/photo`, formData)
  }

  async uploadRecipientSignature(distributionId: string, signatureData: string): Promise<{ signatureUrl: string }> {
    return await apiClient.post<{ signatureUrl: string }>(`${this.baseUrl}/distributions/${distributionId}/signature`, {
      signatureData
    })
  }

  // Inventory management
  async getInventory(params?: {
    agentId?: string
    productId?: string
    warehouseId?: string
    status?: string
    lowStock?: boolean
    page?: number
    limit?: number
  }): Promise<{ inventory: Inventory[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams()
    
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.productId) queryParams.append('productId', params.productId)
    if (params?.warehouseId) queryParams.append('warehouseId', params.warehouseId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.lowStock) queryParams.append('lowStock', params.lowStock.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const url = queryParams.toString() ? `${this.baseUrl}/inventory?${queryParams.toString()}` : `${this.baseUrl}/inventory`
    return await apiClient.get<{ inventory: Inventory[]; total: number; page: number; limit: number }>(url)
  }

  async getInventoryItem(id: string): Promise<Inventory> {
    return await apiClient.get<Inventory>(`${this.baseUrl}/inventory/${id}`)
  }

  async updateInventory(id: string, data: {
    quantity?: number
    minStockLevel?: number
    maxStockLevel?: number
    reorderPoint?: number
    location?: string
    status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED'
  }): Promise<Inventory> {
    return await apiClient.put<Inventory>(`${this.baseUrl}/inventory/${id}`, data)
  }

  async restockInventory(id: string, data: {
    quantity: number
    batchNumbers?: string[]
    serialNumbers?: string[]
    expiryDates?: string[]
    notes?: string
  }): Promise<Inventory> {
    return await apiClient.post<Inventory>(`${this.baseUrl}/inventory/${id}/restock`, data)
  }

  async transferInventory(fromInventoryId: string, toAgentId: string, quantity: number, notes?: string): Promise<{
    fromInventory: Inventory
    toInventory: Inventory
  }> {
    return await apiClient.post<{
      fromInventory: Inventory
      toInventory: Inventory
    }>(`${this.baseUrl}/inventory/${fromInventoryId}/transfer`, {
      toAgentId,
      quantity,
      notes
    })
  }

  // Commission calculation
  async calculateDistributionCommission(distributionId: string): Promise<{
    baseCommission: number
    quantityBonus: number
    performanceBonus: number
    totalCommission: number
    calculationDetails: {
      productCommissionRate: number
      commissionType: 'FIXED' | 'PERCENTAGE'
      quantity: number
      productPrice: number
      bonusMultipliers: Record<string, number>
    }
  }> {
    return await apiClient.get<{
      baseCommission: number
      quantityBonus: number
      performanceBonus: number
      totalCommission: number
      calculationDetails: {
        productCommissionRate: number
        commissionType: 'FIXED' | 'PERCENTAGE'
        quantity: number
        productPrice: number
        bonusMultipliers: Record<string, number>
      }
    }>(`${this.baseUrl}/distributions/${distributionId}/commission`)
  }

  // Analytics and reporting
  async getProductDistributionStats(params?: {
    agentId?: string
    productId?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<{
    totalDistributions: number
    completedDistributions: number
    returnedDistributions: number
    cancelledDistributions: number
    totalQuantity: number
    totalCommissions: number
    averageDistributionValue: number
    topProducts: Array<{
      productId: string
      productName: string
      distributionCount: number
      totalQuantity: number
      totalCommissions: number
    }>
    distributionsByType: Record<string, number>
    distributionsByStatus: Record<string, number>
  }> {
    const queryParams = new URLSearchParams()
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.productId) queryParams.append('productId', params.productId)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/distributions/stats?${queryParams.toString()}`
      : `${this.baseUrl}/distributions/stats`
    
    return await apiClient.get(url)
  }

  async getAgentProductPerformance(agentId: string, period?: string): Promise<{
    totalDistributions: number
    completedDistributions: number
    completionRate: number
    returnRate: number
    totalCommissions: number
    averageDistributionValue: number
    topProducts: Array<{
      productId: string
      productName: string
      distributionCount: number
      totalQuantity: number
    }>
    inventoryStatus: {
      totalProducts: number
      lowStockProducts: number
      outOfStockProducts: number
    }
  }> {
    const url = period 
      ? `${this.baseUrl}/distributions/agent/${agentId}/performance?period=${period}`
      : `${this.baseUrl}/distributions/agent/${agentId}/performance`
    
    return await apiClient.get(url)
  }

  // Bulk operations
  async bulkUpdateDistributions(distributionIds: string[], updates: Partial<ProductDistributionUpdateRequest>): Promise<{ updated: number; errors: any[] }> {
    return await apiClient.post<{ updated: number; errors: any[] }>(`${this.baseUrl}/distributions/bulk-update`, {
      distributionIds,
      updates
    })
  }

  async bulkDistributeProducts(distributionIds: string[], data: {
    notes?: string
    photoUrl?: string
  }): Promise<{ distributed: number; errors: any[] }> {
    return await apiClient.post<{ distributed: number; errors: any[] }>(`${this.baseUrl}/distributions/bulk-distribute`, {
      distributionIds,
      ...data
    })
  }

  // Export and reporting
  async exportProductDistributions(params?: ProductDistributionSearchParams): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.customerId) queryParams.append('customerId', params.customerId)
    if (params?.productId) queryParams.append('productId', params.productId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/distributions/export?${queryParams.toString()}`
      : `${this.baseUrl}/distributions/export`
    
    return await apiClient.download(url)
  }

  async exportInventory(params?: {
    agentId?: string
    productId?: string
    status?: string
  }): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.productId) queryParams.append('productId', params.productId)
    if (params?.status) queryParams.append('status', params.status)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/inventory/export?${queryParams.toString()}`
      : `${this.baseUrl}/inventory/export`
    
    return await apiClient.download(url)
  }

  // Product catalog for agents
  async getAvailableProducts(agentId?: string): Promise<Array<Product & { availableQuantity: number }>> {
    const url = agentId 
      ? `${this.baseUrl}/available?agentId=${agentId}`
      : `${this.baseUrl}/available`
    
    return await apiClient.get<Array<Product & { availableQuantity: number }>>(url)
  }

  // Product recommendations
  async getProductRecommendations(customerId: string, visitId?: string): Promise<Array<{
    product: Product
    recommendationScore: number
    reasons: string[]
    availableQuantity: number
    estimatedCommission: number
  }>> {
    const url = visitId 
      ? `${this.baseUrl}/recommendations?customerId=${customerId}&visitId=${visitId}`
      : `${this.baseUrl}/recommendations?customerId=${customerId}`
    
    return await apiClient.get(url)
  }
}

const productService = new ProductService()
export default productService