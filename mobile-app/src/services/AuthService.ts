import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './ApiService';
import { User } from '../types/User';

interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'authToken';
  private readonly USER_KEY = 'userData';

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiService.post('/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        
        // Store token and user data
        await AsyncStorage.setItem(this.TOKEN_KEY, token);
        await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
        
        // Set token for future API calls
        apiService.setAuthToken(token);
        
        return {
          success: true,
          user,
          token,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Login failed',
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Network error',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage regardless of API call result
      await AsyncStorage.multiRemove([this.TOKEN_KEY, this.USER_KEY]);
      apiService.clearAuthToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await AsyncStorage.getItem(this.TOKEN_KEY);
      if (!token) return null;

      // Set token for API calls
      apiService.setAuthToken(token);

      // Try to get fresh user data from API
      const response = await apiService.get('/auth/me');
      if (response.data.success) {
        const user = response.data.user;
        await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
        return user;
      }

      // Fallback to stored user data
      const storedUser = await AsyncStorage.getItem(this.USER_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      // Return stored user data as fallback
      try {
        const storedUser = await AsyncStorage.getItem(this.USER_KEY);
        return storedUser ? JSON.parse(storedUser) : null;
      } catch {
        return null;
      }
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(this.TOKEN_KEY);
      if (!token) return false;

      const response = await apiService.post('/auth/refresh', { token });
      
      if (response.data.success) {
        const newToken = response.data.token;
        await AsyncStorage.setItem(this.TOKEN_KEY, newToken);
        apiService.setAuthToken(newToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem(this.TOKEN_KEY);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }
}

export const authService = new AuthService();