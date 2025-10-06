import { apiClient } from '@/lib/api-client'

export interface Product {
  id?: string
  sku: string
  name: string
  description?: string
  category?: string
  brand?: string
  unitOfMeasure: string
  basePrice: number
  costPrice?: number
  wholesalePrice?: number
  retailPrice?: number
  taxRate: number
  barcode?: string
  weight?: number
  volume?: number
  reorderLevel?: number
  maxStockLevel?: number
  status: 'active' | 'inactive' | 'discontinued'
  images?: string[]
  supplierId?: string
  createdAt?: string
  updatedAt?: string
}

export interface ProductFilters {
  status?: string
  category?: string
  brand?: string
  supplierId?: string
  search?: string
  page?: number
  limit?: number
}

class ProductsService {
  private baseUrl = '/products'

  async getAll(filters?: ProductFilters) {
    return apiClient.get<{ products: Product[]; total: number }>(this.baseUrl, { params: filters })
  }

  async getById(id: string) {
    return apiClient.get<Product>(`${this.baseUrl}/${id}`)
  }

  async create(product: Product) {
    return apiClient.post<Product>(this.baseUrl, product)
  }

  async update(id: string, product: Partial<Product>) {
    return apiClient.put<Product>(`${this.baseUrl}/${id}`, product)
  }

  async delete(id: string) {
    return apiClient.delete(`${this.baseUrl}/${id}`)
  }

  async updateStatus(id: string, status: Product['status']) {
    return apiClient.patch<Product>(`${this.baseUrl}/${id}/status`, { status })
  }

  async updatePricing(id: string, pricing: { basePrice: number; wholesalePrice: number; retailPrice: number }) {
    return apiClient.patch<Product>(`${this.baseUrl}/${id}/pricing`, pricing)
  }

  async uploadImage(id: string, file: File) {
    const formData = new FormData()
    formData.append('image', file)
    return apiClient.upload<{ imageUrl: string }>(`${this.baseUrl}/${id}/image`, formData)
  }

  async bulkImport(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.upload<{ imported: number; failed: number }>(`${this.baseUrl}/bulk-import`, formData)
  }

  async getStockLevels(id: string) {
    return apiClient.get<any[]>(`${this.baseUrl}/${id}/stock`)
  }
}

export const productsService = new ProductsService()
