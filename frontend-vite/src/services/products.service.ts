import { apiClient } from './api.service'

export interface Product {
  id: string
  tenant_id: string
  name: string
  code: string
  barcode?: string
  category_id: string
  brand_id: string
  unit_of_measure?: string
  selling_price: number
  cost_price: number
  tax_rate: number
  status: 'active' | 'inactive' | 'discontinued'
  created_at: string
  sample_inventory: number
  category_name?: string
  brand_name?: string
  total_stock: number
  description?: string
  image_url?: string
  min_stock_level?: number
  max_stock_level?: number
  reorder_point?: number
  supplier_id?: string
  supplier_name?: string
}

export interface Category {
  id: string
  tenant_id: string
  name: string
  code: string
  parent_id?: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface Brand {
  id: string
  tenant_id: string
  name: string
  code: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface ProductFilter {
  search?: string
  category_id?: string
  brand_id?: string
  status?: string
  price_min?: number
  price_max?: number
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface ProductStats {
  total_products: number
  active_products: number
  inactive_products: number
  total_value: number
  low_stock_products: number
  out_of_stock_products: number
  top_selling_products: Product[]
  products_by_category: Array<{
    category: string
    count: number
    value: number
  }>
  products_by_brand: Array<{
    brand: string
    count: number
    value: number
  }>
}

class ProductsService {
  private baseUrl = '/api/products'

  async getProducts(filter?: ProductFilter): Promise<{ products: Product[], categories: Category[], brands: Brand[], pagination: any }> {
    try {
      const response = await apiClient.get(this.baseUrl, { params: filter })
      return {
        products: response.data.data?.products || response.data.data || [],
        categories: response.data.data?.categories || [],
        brands: response.data.data?.brands || [],
        pagination: response.data.data?.pagination || {}
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      throw error
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch product:', error)
      return null
    }
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'total_stock'>): Promise<Product> {
    try {
      const response = await apiClient.post(this.baseUrl, product)
      return response.data.data
    } catch (error) {
      console.error('Failed to create product:', error)
      throw error
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, updates)
      return response.data.data
    } catch (error) {
      console.error('Failed to update product:', error)
      throw error
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      console.error('Failed to delete product:', error)
      throw error
    }
  }

  async getProductStats(): Promise<ProductStats> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch product stats:', error)
      // Return mock stats for development
      return this.getMockStats()
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get('/api/categories')
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      return []
    }
  }

  async getBrands(): Promise<Brand[]> {
    try {
      const response = await apiClient.get('/api/brands')
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch brands:', error)
      return []
    }
  }

  async updateStock(productId: string, stockData: { quantity: number, type: 'add' | 'subtract', reason?: string }): Promise<Product> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${productId}/stock`, stockData)
      return response.data.data
    } catch (error) {
      console.error('Failed to update stock:', error)
      throw error
    }
  }

  async getStockMovements(productId: string, filter?: any): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${productId}/movements`, { params: filter })
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch stock movements:', error)
      return []
    }
  }

  async exportProducts(filter?: ProductFilter, format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/export`, {
        params: { ...filter, format },
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Failed to export products:', error)
      throw error
    }
  }

  async bulkUpdateProducts(updates: Array<{ id: string; updates: Partial<Product> }>): Promise<Product[]> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/bulk`, { updates })
      return response.data.data
    } catch (error) {
      console.error('Failed to bulk update products:', error)
      throw error
    }
  }

  async importProducts(file: File): Promise<{ success: number; errors: any[] }> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await apiClient.post(`${this.baseUrl}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data.data
    } catch (error) {
      console.error('Failed to import products:', error)
      throw error
    }
  }

  async uploadProductImage(productId: string, file: File): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await apiClient.post(`${this.baseUrl}/${productId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data.data.image_url
    } catch (error) {
      console.error('Failed to upload product image:', error)
      throw error
    }
  }

  // Mock data for development
  private getMockStats(): ProductStats {
    return {
      total_products: 3,
      active_products: 3,
      inactive_products: 0,
      total_value: 21000, // 3 products * 1000 stock * avg price
      low_stock_products: 0,
      out_of_stock_products: 0,
      top_selling_products: [],
      products_by_category: [
        {
          category: 'Beverages',
          count: 3,
          value: 21000
        }
      ],
      products_by_brand: [
        {
          brand: 'Premium Brand',
          count: 3,
          value: 21000
        }
      ]
    }
  }
}

export const productsService = new ProductsService()