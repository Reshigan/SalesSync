export interface User {
  id: string
  email: string
  name: string
  role: string
  tenantCode: string
  permissions: string[]
  avatar?: string
  phone?: string
  lastLogin?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface LoginRequest {
  email: string
  password: string
  tenantCode?: string
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
}