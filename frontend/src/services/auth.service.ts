import { apiClient } from '../lib/api-client'

export interface User {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  tenantId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  role?: string
}

class AuthService {
  private baseUrl = '/auth'

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return await apiClient.post<LoginResponse>(`${this.baseUrl}/login`, credentials)
  }

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    return await apiClient.post<LoginResponse>(`${this.baseUrl}/register`, userData)
  }

  async logout(): Promise<void> {
    await apiClient.post(`${this.baseUrl}/logout`)
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    return await apiClient.post<{ token: string; refreshToken: string }>(`${this.baseUrl}/refresh`, {
      refreshToken
    })
  }

  async getCurrentUser(): Promise<User> {
    return await apiClient.get<User>(`${this.baseUrl}/me`)
  }

  async getProfile(): Promise<User> {
    return await apiClient.get<User>(`${this.baseUrl}/me`)
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    return await apiClient.put<User>(`${this.baseUrl}/profile`, userData)
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/change-password`, {
      currentPassword,
      newPassword
    })
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/forgot-password`, { email })
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/reset-password`, {
      token,
      newPassword
    })
  }

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/verify-email`, { token })
  }

  async resendVerificationEmail(): Promise<void> {
    await apiClient.post(`${this.baseUrl}/resend-verification`)
  }

  // Token management
  setToken(token: string): void {
    localStorage.setItem('auth_token', token)
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  removeToken(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
  }

  setRefreshToken(refreshToken: string): void {
    localStorage.setItem('refresh_token', refreshToken)
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token')
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

const authService = new AuthService()
export default authService