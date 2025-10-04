// API service for connecting to SalesSync backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
console.log('API_BASE_URL:', API_BASE_URL);

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('ApiService initialized with baseURL:', this.baseURL);
    // Token will be set by Zustand store after rehydration
    // via apiService.setToken() in auth store
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add tenant code header to all requests
    const tenantCode = process.env.NEXT_PUBLIC_TENANT_CODE || 'DEMO';
    headers['X-Tenant-Code'] = tenantCode;

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('Using token:', this.token.substring(0, 20) + '...');
    } else {
      console.log('No token available for API request');
    }

    try {
      console.log('Making API request to:', url);
      console.log('Request options:', { ...options, headers });
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        return {
          error: data.error || 'Request failed',
          message: data.message || `HTTP ${response.status}`,
        };
      }

      return { data };
    } catch (error) {
      console.error('API request error:', error);
      return {
        error: 'Network Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>> {
    const tenantCode = process.env.NEXT_PUBLIC_TENANT_CODE || 'DEMO';
    const response = await this.request<{ success: boolean; data: { user: any; token: string; refreshToken: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: {
        'X-Tenant-Code': tenantCode,
      },
    });

    if (response.data && response.data.success && response.data.data) {
      // Transform backend response format to frontend expected format
      const backendData = response.data.data;
      const transformedData = {
        accessToken: backendData.token,
        refreshToken: backendData.refreshToken,
        user: backendData.user
      };
      
      this.token = transformedData.accessToken;
      // Store refresh token separately (not managed by Zustand)
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', transformedData.refreshToken);
      }
      
      return { data: transformedData };
    }

    return { error: response.error, message: response.message };
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<ApiResponse<{ user: any }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    
    if (!refreshToken) {
      return { error: 'No refresh token available' };
    }

    const response = await this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.data) {
      this.token = response.data.accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
    }

    return response;
  }

  logout(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refreshToken');
      // Note: accessToken and user are now managed by Zustand persist
    }
  }
  
  // Method to set token from Zustand store
  setToken(token: string | null): void {
    this.token = token;
  }
  
  // Method to get current token
  getToken(): string | null {
    return this.token;
  }

  // User methods
  async getUsers(params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<ApiResponse<{ users: any[]; total: number; page: number; totalPages: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return this.request(`/users${query ? `?${query}` : ''}`);
  }

  async getUser(id: string): Promise<ApiResponse<any>> {
    return this.request(`/users/${id}`);
  }

  async createUser(userData: any): Promise<ApiResponse<any>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any): Promise<ApiResponse<any>> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserStats(): Promise<ApiResponse<any>> {
    return this.request('/users/stats');
  }

  // Product methods
  async getProducts(params?: { page?: number; limit?: number; category?: string; search?: string }): Promise<ApiResponse<{ products: any[]; total: number; page: number; totalPages: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id: string): Promise<ApiResponse<any>> {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: any): Promise<ApiResponse<any>> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: any): Promise<ApiResponse<any>> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getProductCategories(): Promise<ApiResponse<{ categories: string[] }>> {
    return this.request('/products/categories');
  }

  async getProductBrands(): Promise<ApiResponse<{ brands: string[] }>> {
    return this.request('/products/brands');
  }

  // Order methods
  async getOrders(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<ApiResponse<{ orders: any[]; total: number; page: number; totalPages: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return this.request(`/orders${query ? `?${query}` : ''}`);
  }

  async getOrder(id: string): Promise<ApiResponse<any>> {
    return this.request(`/orders/${id}`);
  }

  async createOrder(orderData: any): Promise<ApiResponse<any>> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrder(id: string, orderData: any): Promise<ApiResponse<any>> {
    return this.request(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  async deleteOrder(id: string): Promise<ApiResponse<void>> {
    return this.request(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  async getOrderStats(): Promise<ApiResponse<any>> {
    return this.request('/orders/stats');
  }

  // Customer methods
  async getCustomers(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<{ customers: any[]; total: number; page: number; totalPages: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return this.request(`/customers${query ? `?${query}` : ''}`);
  }

  async getCustomer(id: string): Promise<ApiResponse<any>> {
    return this.request(`/customers/${id}`);
  }

  async createCustomer(customerData: any): Promise<ApiResponse<any>> {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomer(id: string, customerData: any): Promise<ApiResponse<any>> {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard methods
  async getDashboard(): Promise<ApiResponse<{
    overview: {
      totalUsers: number;
      totalCustomers: number;
      totalProducts: number;
      totalOrders: number;
      todayOrders: number;
      todayRevenue: number;
      activeAgents: number;
    };
    recentOrders: any[];
    topCustomers: any[];
    salesByMonth: any[];
    agentPerformance: any[];
  }>> {
    return this.request('/dashboard');
  }

  async getDashboardStats(period?: string): Promise<ApiResponse<{
    period: string;
    orders: any;
    revenue: any;
    visits: any;
    customers: any;
  }>> {
    const query = period ? `?period=${period}` : '';
    return this.request(`/dashboard/stats${query}`);
  }

  async getDashboardActivities(limit?: number): Promise<ApiResponse<{
    activities: Array<{
      id: string;
      type: string;
      reference: string;
      description: string;
      customer_name: string | null;
      agent_name: string;
      amount: number | null;
      status: string;
      timestamp: string;
      timeAgo: string;
      detail: string;
      icon: string;
      color: string;
    }>;
    total: number;
  }>> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/dashboard/activities${query}`);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export types for use in components
export type { ApiResponse };