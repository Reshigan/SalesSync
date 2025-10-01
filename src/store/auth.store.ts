'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Permission } from '@/types'
import apiService from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  permissions: Permission[]
  _hasHydrated: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
  hasPermission: (module: string, action: string) => boolean
  hasRole: (roles: string | string[]) => boolean
  setHasHydrated: (hasHydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          const response = await apiService.login(email, password)
          
          if (response.error) {
            set({ isLoading: false })
            return { success: false, error: response.message || response.error }
          }

          if (response.data) {
            set({
              user: response.data.user,
              token: response.data.accessToken,
              isAuthenticated: true,
              permissions: response.data.user.permissions || [],
              isLoading: false,
            })
            return { success: true }
          }

          set({ isLoading: false })
          return { success: false, error: 'Login failed' }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Network error' }
        }
      },

      logout: () => {
        apiService.logout()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          permissions: [],
        })
      },

      setUser: (user: User) => {
        set({
          user,
          permissions: user.permissions || [],
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      hasPermission: (module: string, action: string) => {
        const { permissions } = get()
        const permission = permissions.find(p => p.module === module)
        
        if (!permission) return false
        
        switch (action) {
          case 'view':
            return permission.canView
          case 'create':
            return permission.canCreate
          case 'edit':
            return permission.canEdit
          case 'delete':
            return permission.canDelete
          case 'approve':
            return permission.canApprove
          case 'export':
            return permission.canExport
          default:
            return false
        }
      },

      hasRole: (roles: string | string[]) => {
        const { user } = get()
        if (!user) return false
        
        const roleArray = Array.isArray(roles) ? roles : [roles]
        return roleArray.includes(user.role)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
      }),
    }
  )
)