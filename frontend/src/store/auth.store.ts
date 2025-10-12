import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '@/services/auth.service';

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(email, password);
          const { user, token: accessToken } = response;
          
          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false
          });

          // Store token in localStorage for API calls
          localStorage.setItem('token', accessToken);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
        
        // Clear token from localStorage
        localStorage.removeItem('token');
        
        // Clear any other auth-related data
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await authService.refreshToken(token);
          const { token: accessToken } = response;
          
          set({ token: accessToken });
          localStorage.setItem('token', accessToken);
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authService.getProfile();
          const { user } = response;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
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
      })
    }
  )
);