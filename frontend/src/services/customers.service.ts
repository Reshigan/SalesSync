import { apiClient } from '@/lib/api-client'

export interface Customer {
  id?: string
  customerCode?: string
  name: string
  businessName?: string
  type: 'retail' | 'wholesale' | 'distributor'
  category?: string
  phone: string
  email?: string
  address: string
  city: string
  region?: string
  area?: string
  gpsLocation?: { lat: number; lng: number }
  creditLimit: number
  creditBalance?: number
  paymentTerms: string
  taxNumber?: string
  status: 'active' | 'inactive' | 'blocked'
  routeId?: string
  salesAgentId?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface CustomerFilters {
  status?: string
  type?: string
  category?: string
  routeId?: string
  salesAgentId?: string
  search?: string
  page?: number
  limit?: number
}

class CustomersService {
  private baseUrl = '/customers'

  async getAll(filters?: CustomerFilters) {
    return apiClient.get<{ customers: Customer[]; total: number }>(this.baseUrl, { params: filters })
  }

  async getById(id: string) {
    return apiClient.get<Customer>(`${this.baseUrl}/${id}`)
  }

  async create(customer: Customer) {
    return apiClient.post<Customer>(this.baseUrl, customer)
  }

  async update(id: string, customer: Partial<Customer>) {
    return apiClient.put<Customer>(`${this.baseUrl}/${id}`, customer)
  }

  async delete(id: string) {
    return apiClient.delete(`${this.baseUrl}/${id}`)
  }

  async updateStatus(id: string, status: Customer['status']) {
    return apiClient.patch<Customer>(`${this.baseUrl}/${id}/status`, { status })
  }

  async updateCreditLimit(id: string, creditLimit: number) {
    return apiClient.patch<Customer>(`${this.baseUrl}/${id}/credit-limit`, { creditLimit })
  }

  async getTransactionHistory(id: string) {
    return apiClient.get<any[]>(`${this.baseUrl}/${id}/transactions`)
  }

  async getOrders(id: string) {
    return apiClient.get<any[]>(`${this.baseUrl}/${id}/orders`)
  }

  async getByRoute(routeId: string) {
    return apiClient.get<Customer[]>(`${this.baseUrl}/route/${routeId}`)
  }
}

export const customersService = new CustomersService()
