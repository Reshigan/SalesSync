import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use the same backend URL as the web app
    this.baseURL = 'https://ss.gonxt.tech/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userData');
          // You might want to redirect to login screen here
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string): void {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    delete this.api.defaults.headers.common['Authorization'];
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete(url, config);
  }

  // Specific API methods for SalesSync
  async getOrders(params?: any) {
    return this.get('/orders', { params });
  }

  async getCustomers(params?: any) {
    return this.get('/customers', { params });
  }

  async getProducts(params?: any) {
    return this.get('/products', { params });
  }

  async createOrder(orderData: any) {
    return this.post('/orders', orderData);
  }

  async updateOrder(orderId: string, orderData: any) {
    return this.put(`/orders/${orderId}`, orderData);
  }

  async getInventory(params?: any) {
    return this.get('/inventory', { params });
  }

  async updateInventory(inventoryData: any) {
    return this.post('/inventory/update', inventoryData);
  }

  async getRoutes(params?: any) {
    return this.get('/routes', { params });
  }

  async updateLocation(locationData: any) {
    return this.post('/location/update', locationData);
  }

  async uploadImage(imageData: FormData) {
    return this.post('/upload/image', imageData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const apiService = new ApiService();