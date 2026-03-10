import { apiClient } from './api.service'

export interface UserFilter {
  search?: string
  role?: string
  status?: string
  page?: number
  limit?: number
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  last_login?: string
}

class UsersService {
  async getUsers(filter?: UserFilter): Promise<{ users: User[]; total: number }> {
    try {
      const response = await apiClient.get('/users', { params: filter })
      const data = response.data.data || response.data
      return {
        users: Array.isArray(data) ? data : data?.users || [],
        total: data?.total || (Array.isArray(data) ? data.length : 0)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      return { users: [], total: 0 }
    }
  }

  async getUser(id: string): Promise<User | null> {
    try {
      const response = await apiClient.get(`/users/${id}`)
      return response.data.data || response.data
    } catch (error) {
      console.error('Failed to fetch user:', error)
      return null
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const response = await apiClient.post('/users', userData)
    return response.data.data || response.data
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, updates)
    return response.data.data || response.data
  }

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  }

  async resetPassword(id: string): Promise<void> {
    await apiClient.post(`/users/${id}/reset-password`)
  }
}

export const usersService = new UsersService()
