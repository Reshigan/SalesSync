import { apiClient } from '../lib/api-client'

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  latitude?: number
  longitude?: number
  customerType: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  creditLimit?: number
  paymentTerms?: string
  taxId?: string
  contactPerson?: string
  notes?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
  tenantId: string
  
  // Relationships
  visits?: Visit[]
  orders?: Order[]
  boardPlacements?: BoardPlacement[]
  productDistributions?: ProductDistribution[]
}

export interface Visit {
  id: string
  customerId: string
  agentId: string
  scheduledDate: string
  actualDate?: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  purpose: string
  notes?: string
  latitude?: number
  longitude?: number
  checkInTime?: string
  checkOutTime?: string
  duration?: number
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  customerId: string
  agentId: string
  orderNumber: string
  orderDate: string
  status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  totalAmount: number
  currency: string
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE'
  paymentMethod?: string
  deliveryDate?: string
  notes?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discount?: number
  tax?: number
}

export interface BoardPlacement {
  id: string
  customerId: string
  agentId: string
  boardId: string
  placementDate: string
  status: 'ACTIVE' | 'REMOVED' | 'DAMAGED' | 'EXPIRED'
  location: string
  latitude?: number
  longitude?: number
  photoUrl?: string
  notes?: string
  commissionAmount?: number
  createdAt: string
  updatedAt: string
}

export interface ProductDistribution {
  id: string
  customerId: string
  agentId: string
  productId: string
  productName: string
  quantity: number
  distributionDate: string
  recipientName: string
  recipientPhone?: string
  recipientIdNumber?: string
  status: 'PENDING' | 'DISTRIBUTED' | 'RETURNED'
  notes?: string
  photoUrl?: string
  commissionAmount?: number
  createdAt: string
  updatedAt: string
}

export interface CustomerSearchParams {
  query?: string
  customerType?: string
  status?: string
  city?: string
  state?: string
  tags?: string[]
  latitude?: number
  longitude?: number
  radius?: number // in kilometers
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CustomerCreateRequest {
  name: string
  email?: string
  phone?: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  latitude?: number
  longitude?: number
  customerType: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR'
  creditLimit?: number
  paymentTerms?: string
  taxId?: string
  contactPerson?: string
  notes?: string
  tags?: string[]
}

export interface CustomerUpdateRequest extends Partial<CustomerCreateRequest> {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

export interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  suspendedCustomers: number
  retailCustomers: number
  wholesaleCustomers: number
  distributorCustomers: number
  recentVisits: number
  pendingOrders: number
  totalRevenue: number
  averageOrderValue: number
}

export interface NearbyCustomersRequest {
  latitude: number
  longitude: number
  radius: number // in kilometers
  customerType?: string
  status?: string
  limit?: number
}

class CustomerService {
  private baseUrl = '/customers'

  // Customer CRUD operations
  async getCustomers(params?: CustomerSearchParams): Promise<{ customers: Customer[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams()
    
    if (params?.query) queryParams.append('query', params.query)
    if (params?.customerType) queryParams.append('customerType', params.customerType)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.city) queryParams.append('city', params.city)
    if (params?.state) queryParams.append('state', params.state)
    if (params?.tags?.length) queryParams.append('tags', params.tags.join(','))
    if (params?.latitude) queryParams.append('latitude', params.latitude.toString())
    if (params?.longitude) queryParams.append('longitude', params.longitude.toString())
    if (params?.radius) queryParams.append('radius', params.radius.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl
    return await apiClient.get<{ customers: Customer[]; total: number; page: number; limit: number }>(url)
  }

  async getCustomer(id: string): Promise<Customer> {
    return await apiClient.get<Customer>(`${this.baseUrl}/${id}`)
  }

  async createCustomer(data: CustomerCreateRequest): Promise<Customer> {
    return await apiClient.post<Customer>(this.baseUrl, data)
  }

  async updateCustomer(id: string, data: CustomerUpdateRequest): Promise<Customer> {
    return await apiClient.put<Customer>(`${this.baseUrl}/${id}`, data)
  }

  async deleteCustomer(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`)
  }

  // Search and filtering
  async searchCustomers(query: string, filters?: Partial<CustomerSearchParams>): Promise<Customer[]> {
    const params = { query, ...filters }
    const result = await this.getCustomers(params)
    return result.customers
  }

  async getNearbyCustomers(params: NearbyCustomersRequest): Promise<Customer[]> {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      radius: params.radius.toString()
    })
    
    if (params.customerType) queryParams.append('customerType', params.customerType)
    if (params.status) queryParams.append('status', params.status)
    if (params.limit) queryParams.append('limit', params.limit.toString())

    return await apiClient.get<Customer[]>(`${this.baseUrl}/nearby?${queryParams.toString()}`)
  }

  // Customer visits
  async getCustomerVisits(customerId: string, params?: { page?: number; limit?: number; status?: string }): Promise<{ visits: Visit[]; total: number }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/${customerId}/visits?${queryParams.toString()}`
      : `${this.baseUrl}/${customerId}/visits`
    
    return await apiClient.get<{ visits: Visit[]; total: number }>(url)
  }

  async scheduleVisit(customerId: string, visitData: {
    scheduledDate: string
    purpose: string
    notes?: string
  }): Promise<Visit> {
    return await apiClient.post<Visit>(`${this.baseUrl}/${customerId}/visits`, visitData)
  }

  // Customer orders
  async getCustomerOrders(customerId: string, params?: { page?: number; limit?: number; status?: string }): Promise<{ orders: Order[]; total: number }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/${customerId}/orders?${queryParams.toString()}`
      : `${this.baseUrl}/${customerId}/orders`
    
    return await apiClient.get<{ orders: Order[]; total: number }>(url)
  }

  async createOrder(customerId: string, orderData: {
    items: { productId: string; quantity: number; unitPrice: number }[]
    notes?: string
    deliveryDate?: string
  }): Promise<Order> {
    return await apiClient.post<Order>(`${this.baseUrl}/${customerId}/orders`, orderData)
  }

  // Customer board placements
  async getCustomerBoardPlacements(customerId: string): Promise<BoardPlacement[]> {
    return await apiClient.get<BoardPlacement[]>(`${this.baseUrl}/${customerId}/board-placements`)
  }

  // Customer product distributions
  async getCustomerProductDistributions(customerId: string): Promise<ProductDistribution[]> {
    return await apiClient.get<ProductDistribution[]>(`${this.baseUrl}/${customerId}/product-distributions`)
  }

  // Statistics and analytics
  async getCustomerStats(): Promise<CustomerStats> {
    return await apiClient.get<CustomerStats>(`${this.baseUrl}/stats`)
  }

  async getCustomerAnalytics(customerId: string, period?: string): Promise<{
    totalVisits: number
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    lastVisitDate?: string
    lastOrderDate?: string
    boardPlacements: number
    productDistributions: number
  }> {
    const url = period 
      ? `${this.baseUrl}/${customerId}/analytics?period=${period}`
      : `${this.baseUrl}/${customerId}/analytics`
    
    return await apiClient.get(url)
  }

  // GPS and location services
  async validateCustomerLocation(customerId: string, latitude: number, longitude: number): Promise<{
    isValid: boolean
    distance: number
    accuracy: string
    allowManualOverride: boolean
  }> {
    return await apiClient.post<{
      isValid: boolean
      distance: number
      accuracy: string
      allowManualOverride: boolean
    }>(`${this.baseUrl}/${customerId}/validate-location`, {
      latitude,
      longitude
    })
  }

  async updateCustomerLocation(customerId: string, latitude: number, longitude: number): Promise<Customer> {
    return await apiClient.put<Customer>(`${this.baseUrl}/${customerId}/location`, {
      latitude,
      longitude
    })
  }

  // Bulk operations
  async bulkUpdateCustomers(customerIds: string[], updates: Partial<CustomerUpdateRequest>): Promise<{ updated: number; errors: any[] }> {
    return await apiClient.post<{ updated: number; errors: any[] }>(`${this.baseUrl}/bulk-update`, {
      customerIds,
      updates
    })
  }

  async importCustomers(file: File): Promise<{ imported: number; errors: any[] }> {
    const formData = new FormData()
    formData.append('file', file)
    
    return await apiClient.upload<{ imported: number; errors: any[] }>(`${this.baseUrl}/import`, formData)
  }

  async exportCustomers(filters?: CustomerSearchParams): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (filters?.customerType) queryParams.append('customerType', filters.customerType)
    if (filters?.status) queryParams.append('status', filters.status)
    if (filters?.city) queryParams.append('city', filters.city)
    if (filters?.state) queryParams.append('state', filters.state)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/export?${queryParams.toString()}`
      : `${this.baseUrl}/export`
    
    return await apiClient.download(url)
  }
}

const customerService = new CustomerService()
export default customerService