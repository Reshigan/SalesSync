import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/auth.service';

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  roles?: string[];
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login({ email, password });
          const { user, token } = response;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });

          // Store token in localStorage for API calls
          localStorage.setItem('token', token);
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
        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) return;

        try {
          const response = await authService.refreshToken(refreshToken);
          const { token } = response;
          
          set({ token });
          localStorage.setItem('token', token);
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
          const user = await authService.getProfile();
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          // Token is invalid, logout
          get().logout();
        }
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        return user?.permissions?.includes(permission) || false;
      },

      hasRole: (role: string | string[]) => {
        const { user } = get();
        if (Array.isArray(role)) {
          return role.includes(user?.role || '');
        }
        return user?.role === role;
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