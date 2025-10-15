import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '@/services/auth.service';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  areaId?: string;
  routeId?: string;
  monthlyTarget?: number;
  status: string;
  lastLogin?: string;
  createdAt: string;
  permissions?: Array<{
    module: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canApprove: boolean;
    canExport: boolean;
  }>;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Helper function to set cookie
function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
}

// Helper function to delete cookie
function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        console.log('🔐 Auth Store: Starting login process');
        set({ isLoading: true });
        try {
          console.log('🔐 Auth Store: Calling auth service');
          const response = await authService.login(email, password);
          console.log('🔐 Auth Store: Auth service response:', response);
          
          // Backend returns { message, user, tokens }
          const { user, tokens } = response;
          console.log('🔐 Auth Store: Extracted user:', user);
          console.log('🔐 Auth Store: Extracted tokens:', tokens);
          
          const accessToken = tokens.accessToken;
          console.log('🔐 Auth Store: Access token:', accessToken);

          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false
          });

          // Store tokens in localStorage for API calls
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Store token in cookies for middleware
          setCookie('token', accessToken, 7);
          
          // Set token on api service
          api.setToken(accessToken);
          
          console.log('🔐 Auth Store: Login successful, tokens stored in localStorage and cookies');
        } catch (error) {
          console.error('🔐 Auth Store: Login error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        console.log('🔐 Auth Store: Logging out');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });

        // Clear localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Clear cookies
        deleteCookie('token');
        
        // Clear token from api service
        api.setToken(null);
      },

      refreshToken: async () => {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await authService.refreshToken(refreshToken);
          const newToken = response.token;

          set({ token: newToken });
          localStorage.setItem('accessToken', newToken);
          setCookie('token', newToken, 7);
          
          // Set token on api service
          api.setToken(newToken);
        } catch (error) {
          console.error('Token refresh failed:', error);
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) {
            return;
          }

          // Verify token with backend
          const response = await authService.getProfile();
          const { user } = response;

          set({
            user,
            token,
            isAuthenticated: true
          });
          
          // Ensure cookie is set
          setCookie('token', token, 7);
          
          // Set token on api service
          api.setToken(token);
        } catch (error) {
          console.error('Auth check failed:', error);
          // Token is invalid, logout
          get().logout();
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        // Set token on api service when rehydrating from localStorage
        if (state?.token) {
          api.setToken(state.token);
        }
      }
    }
  )
);