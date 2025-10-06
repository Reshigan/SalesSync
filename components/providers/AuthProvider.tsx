'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { User, AuthState } from '@/types/auth'

interface AuthContextType extends AuthState {
  login: (email: string, password: string, tenantCode?: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateUser: (user: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })
  const router = useRouter()

  useEffect(() => {
    // Check for stored auth data on mount
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        setState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        })
        // Set default headers for API client
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        apiClient.defaults.headers.common['X-Tenant-Code'] = user.tenantCode || 'DEMO'
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        logout()
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = async (email: string, password: string, tenantCode: string = 'DEMO') => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        tenantCode,
      })

      const { token, user } = response.data
      
      // Store auth data
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
      
      // Set API client headers
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      apiClient.defaults.headers.common['X-Tenant-Code'] = tenantCode
      
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      })
      
      router.push('/dashboard')
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const logout = () => {
    // Clear stored data
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    
    // Clear API client headers
    delete apiClient.defaults.headers.common['Authorization']
    delete apiClient.defaults.headers.common['X-Tenant-Code']
    
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    })
    
    router.push('/login')
  }

  const refreshToken = async () => {
    try {
      const response = await apiClient.post('/auth/refresh')
      const { token, user } = response.data
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setState(prev => ({
        ...prev,
        token,
        user,
      }))
    } catch (error) {
      logout()
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (state.user) {
      const updatedUser = { ...state.user, ...userData }
      localStorage.setItem('user_data', JSON.stringify(updatedUser))
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }))
    }
  }

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}