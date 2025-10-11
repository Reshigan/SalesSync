// Comprehensive User Management Service
import apiClient from '@/lib/api-client'

export interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  role: 'ADMIN' | 'MANAGER' | 'FIELD_AGENT' | 'SUPERVISOR'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  permissions: string[]
  department?: string
  territory?: string
  managerId?: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  emailVerified: boolean
  phoneVerified: boolean
  twoFactorEnabled: boolean
  preferences: UserPreferences
  profile: UserProfile
}

export interface UserPreferences {
  language: string
  timezone: string
  theme: 'light' | 'dark' | 'auto'
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    inApp: boolean
  }
  dashboard: {
    layout: 'grid' | 'list'
    widgets: string[]
  }
}

export interface UserProfile {
  bio?: string
  location?: string
  skills: string[]
  certifications: string[]
  experience: number
  performanceRating?: number
  targetAchievement?: number
}

export interface CreateUserRequest {
  email: string
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  role: User['role']
  department?: string
  territory?: string
  managerId?: string
  permissions?: string[]
  sendWelcomeEmail?: boolean
}

export interface UpdateUserRequest {
  name?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: User['role']
  status?: User['status']
  department?: string
  territory?: string
  managerId?: string
  permissions?: string[]
  preferences?: Partial<UserPreferences>
  profile?: Partial<UserProfile>
}

export interface UserFilters {
  role?: User['role']
  status?: User['status']
  department?: string
  territory?: string
  managerId?: string
  search?: string
  createdAfter?: string
  createdBefore?: string
  lastLoginAfter?: string
  lastLoginBefore?: string
}

export interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  usersByRole: Record<string, number>
  usersByStatus: Record<string, number>
  usersByDepartment: Record<string, number>
  averageSessionDuration: number
  topPerformers: Array<{
    userId: string
    name: string
    performanceScore: number
    achievements: number
  }>
  loginTrends: Array<{
    date: string
    logins: number
    uniqueUsers: number
  }>
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  maxAge: number
  preventReuse: number
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy
  sessionTimeout: number
  maxLoginAttempts: number
  lockoutDuration: number
  twoFactorRequired: boolean
  allowedDomains: string[]
  ipWhitelist: string[]
}

class UserService {
  // Get users with filtering and pagination
  async getUsers(params: {
    page?: number
    limit?: number
    filters?: UserFilters
  } = {}): Promise<UsersResponse> {
    const { page = 1, limit = 20, filters = {} } = params
    
    const queryParams = {
      page,
      limit,
      ...filters
    }

    return apiClient.get('/users', { params: queryParams })
  }

  // Get single user by ID
  async getUser(userId: string): Promise<User> {
    return apiClient.get(`/users/${userId}`)
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    return apiClient.get('/users/me')
  }

  // Create new user
  async createUser(userData: CreateUserRequest): Promise<User> {
    return apiClient.post('/users', userData)
  }

  // Update user
  async updateUser(userId: string, updates: UpdateUserRequest): Promise<User> {
    return apiClient.put(`/users/${userId}`, updates)
  }

  // Update current user profile
  async updateProfile(updates: UpdateUserRequest): Promise<User> {
    return apiClient.put('/users/me', updates)
  }

  // Delete user (soft delete)
  async deleteUser(userId: string): Promise<void> {
    return apiClient.delete(`/users/${userId}`)
  }

  // Activate/Deactivate user
  async updateUserStatus(userId: string, status: User['status']): Promise<User> {
    return apiClient.patch(`/users/${userId}/status`, { status })
  }

  // Reset user password
  async resetPassword(userId: string, sendEmail: boolean = true): Promise<{ temporaryPassword?: string }> {
    return apiClient.post(`/users/${userId}/reset-password`, { sendEmail })
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiClient.post('/users/me/change-password', {
      currentPassword,
      newPassword
    })
  }

  // Update user permissions
  async updatePermissions(userId: string, permissions: string[]): Promise<User> {
    return apiClient.patch(`/users/${userId}/permissions`, { permissions })
  }

  // Get user permissions
  async getUserPermissions(userId: string): Promise<string[]> {
    const response = await apiClient.get(`/users/${userId}/permissions`)
    return response.permissions
  }

  // Search users
  async searchUsers(query: string, filters?: UserFilters): Promise<User[]> {
    const params = { query, ...filters }
    const response = await apiClient.get('/users/search', { params })
    return response.users
  }

  // Get users by role
  async getUsersByRole(role: User['role']): Promise<User[]> {
    const response = await apiClient.get(`/users/role/${role}`)
    return response.users
  }

  // Get user hierarchy (manager and subordinates)
  async getUserHierarchy(userId: string): Promise<{
    manager?: User
    subordinates: User[]
    peers: User[]
  }> {
    return apiClient.get(`/users/${userId}/hierarchy`)
  }

  // Get user analytics
  async getUserAnalytics(timeRange?: string): Promise<UserAnalytics> {
    const params = timeRange ? { timeRange } : {}
    return apiClient.get('/users/analytics', { params })
  }

  // Bulk operations
  async bulkUpdateUsers(userIds: string[], updates: UpdateUserRequest): Promise<User[]> {
    return apiClient.patch('/users/bulk', { userIds, updates })
  }

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    return apiClient.delete('/users/bulk', { data: { userIds } })
  }

  // Import/Export users
  async importUsers(file: File): Promise<{
    imported: number
    failed: number
    errors: string[]
  }> {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post('/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  async exportUsers(filters?: UserFilters, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const params = { ...filters, format }
    return apiClient.get('/users/export', {
      params,
      responseType: 'blob'
    })
  }

  // User preferences
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    return apiClient.patch('/users/me/preferences', preferences)
  }

  async getPreferences(): Promise<UserPreferences> {
    return apiClient.get('/users/me/preferences')
  }

  // Two-factor authentication
  async enableTwoFactor(): Promise<{ qrCode: string; backupCodes: string[] }> {
    return apiClient.post('/users/me/2fa/enable')
  }

  async disableTwoFactor(code: string): Promise<void> {
    return apiClient.post('/users/me/2fa/disable', { code })
  }

  async verifyTwoFactor(code: string): Promise<{ verified: boolean }> {
    return apiClient.post('/users/me/2fa/verify', { code })
  }

  // Session management
  async getSessions(): Promise<Array<{
    id: string
    device: string
    location: string
    lastActive: string
    current: boolean
  }>> {
    return apiClient.get('/users/me/sessions')
  }

  async revokeSession(sessionId: string): Promise<void> {
    return apiClient.delete(`/users/me/sessions/${sessionId}`)
  }

  async revokeAllSessions(): Promise<void> {
    return apiClient.delete('/users/me/sessions')
  }

  // Security settings (admin only)
  async getSecuritySettings(): Promise<SecuritySettings> {
    return apiClient.get('/admin/security-settings')
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<SecuritySettings> {
    return apiClient.patch('/admin/security-settings', settings)
  }

  // Activity logs
  async getUserActivity(userId: string, params: {
    page?: number
    limit?: number
    action?: string
    dateFrom?: string
    dateTo?: string
  } = {}): Promise<{
    activities: Array<{
      id: string
      action: string
      description: string
      timestamp: string
      ipAddress: string
      userAgent: string
      metadata?: Record<string, any>
    }>
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    return apiClient.get(`/users/${userId}/activity`, { params })
  }

  // User invitations
  async inviteUser(email: string, role: User['role'], message?: string): Promise<{
    invitationId: string
    expiresAt: string
  }> {
    return apiClient.post('/users/invite', { email, role, message })
  }

  async resendInvitation(invitationId: string): Promise<void> {
    return apiClient.post(`/users/invitations/${invitationId}/resend`)
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    return apiClient.delete(`/users/invitations/${invitationId}`)
  }

  async getInvitations(): Promise<Array<{
    id: string
    email: string
    role: string
    status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
    invitedBy: string
    createdAt: string
    expiresAt: string
  }>> {
    return apiClient.get('/users/invitations')
  }

  // User validation
  async validateEmail(email: string): Promise<{ available: boolean; suggestions?: string[] }> {
    return apiClient.post('/users/validate/email', { email })
  }

  async validateUsername(username: string): Promise<{ available: boolean; suggestions?: string[] }> {
    return apiClient.post('/users/validate/username', { username })
  }

  // Avatar management
  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('avatar', file)

    return apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  async deleteAvatar(): Promise<void> {
    return apiClient.delete('/users/me/avatar')
  }

  // Performance tracking
  async getUserPerformance(userId: string, timeRange?: string): Promise<{
    score: number
    rank: number
    totalUsers: number
    metrics: {
      visitsCompleted: number
      boardPlacements: number
      productDistributions: number
      customerSatisfaction: number
      commissionEarned: number
    }
    trends: Array<{
      date: string
      score: number
    }>
    achievements: Array<{
      id: string
      name: string
      description: string
      earnedAt: string
      icon: string
    }>
  }> {
    const params = timeRange ? { timeRange } : {}
    return apiClient.get(`/users/${userId}/performance`, { params })
  }

  // Team management
  async getTeamMembers(managerId?: string): Promise<User[]> {
    const params = managerId ? { managerId } : {}
    const response = await apiClient.get('/users/team', { params })
    return response.users
  }

  async assignManager(userId: string, managerId: string): Promise<User> {
    return apiClient.patch(`/users/${userId}/manager`, { managerId })
  }

  async removeManager(userId: string): Promise<User> {
    return apiClient.delete(`/users/${userId}/manager`)
  }
}

const userService = new UserService()
export default userService