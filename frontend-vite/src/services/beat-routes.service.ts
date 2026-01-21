/**
 * Beat Routes Service
 * Handles sales beat and route management
 */

import { apiClient } from './api.service'
import { API_CONFIG } from '../config/api.config'

export interface BeatRoute {
  id: string
  tenant_id: string
  name: string
  code: string
  description?: string
  area?: string
  city?: string
  state?: string
  assigned_to?: string
  status: 'active' | 'inactive'
  created_at: string
  customers?: Array<{
    customer_id: string
    customer_name: string
    visit_order: number
  }>
}

export interface BeatPlan {
  id: string
  tenant_id: string
  beat_route_id: string
  salesman_id: string
  plan_date: string
  start_time?: string
  end_time?: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
}

export interface RouteCustomer {
  id: string
  beat_route_id: string
  customer_id: string
  visit_order: number
  visit_frequency?: string
  last_visit_date?: string
  next_visit_date?: string
  created_at: string
}

class BeatRoutesService {
  private readonly baseUrl = API_CONFIG.ENDPOINTS.BEAT_ROUTES.BASE
  // Build full URL using centralized config

  async getBeatRoutes(filter?: any): Promise<{ routes: BeatRoute[], total: number }> {
    try {
      const response = await apiClient.get(this.baseUrl, { params: filter })
      return {
        routes: response.data.data?.routes || response.data.data || [],
        total: response.data.data?.pagination?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch beat routes:', error)
      throw error
    }
  }

  async getBeatRoute(id: string): Promise<BeatRoute> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch beat route:', error)
      throw error
    }
  }

  async createBeatRoute(route: Partial<BeatRoute>): Promise<BeatRoute> {
    try {
      const response = await apiClient.post(this.baseUrl, route)
      return response.data.data
    } catch (error) {
      console.error('Failed to create beat route:', error)
      throw error
    }
  }

  async updateBeatRoute(id: string, updates: Partial<BeatRoute>): Promise<BeatRoute> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, updates)
      return response.data.data
    } catch (error) {
      console.error('Failed to update beat route:', error)
      throw error
    }
  }

  async deleteBeatRoute(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      console.error('Failed to delete beat route:', error)
      throw error
    }
  }

  // Route Customers
  async getRouteCustomers(routeId: string): Promise<RouteCustomer[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${routeId}/customers`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch route customers:', error)
      return []
    }
  }

  async addCustomerToRoute(routeId: string, customerId: string, visitOrder?: number): Promise<RouteCustomer> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${routeId}/customers`, {
        customer_id: customerId,
        visit_order: visitOrder
      })
      return response.data.data
    } catch (error) {
      console.error('Failed to add customer to route:', error)
      throw error
    }
  }

  async removeCustomerFromRoute(routeId: string, customerId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${routeId}/customers/${customerId}`)
    } catch (error) {
      console.error('Failed to remove customer from route:', error)
      throw error
    }
  }

  async reorderRouteCustomers(routeId: string, customers: Array<{ customer_id: string, visit_order: number }>): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/${routeId}/customers/reorder`, { customers })
    } catch (error) {
      console.error('Failed to reorder route customers:', error)
      throw error
    }
  }

  // Beat Plans
  async getBeatPlans(filter?: any): Promise<{ plans: BeatPlan[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/plans`, { params: filter })
      return {
        plans: response.data.data?.plans || response.data.data || [],
        total: response.data.data?.pagination?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch beat plans:', error)
      throw error
    }
  }

  async createBeatPlan(plan: Partial<BeatPlan>): Promise<BeatPlan> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/plans`, plan)
      return response.data.data
    } catch (error) {
      console.error('Failed to create beat plan:', error)
      throw error
    }
  }

  async updateBeatPlan(id: string, updates: Partial<BeatPlan>): Promise<BeatPlan> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/plans/${id}`, updates)
      return response.data.data
    } catch (error) {
      console.error('Failed to update beat plan:', error)
      throw error
    }
  }

  async startBeatPlan(id: string): Promise<BeatPlan> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/plans/${id}/start`)
      return response.data.data
    } catch (error) {
      console.error('Failed to start beat plan:', error)
      throw error
    }
  }

  async completeBeatPlan(id: string): Promise<BeatPlan> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/plans/${id}/complete`)
      return response.data.data
    } catch (error) {
      console.error('Failed to complete beat plan:', error)
      throw error
    }
  }

  async getBeatStats(routeId?: string, salesmanId?: string): Promise<any> {
    try {
      const params: any = {}
      if (routeId) params.route_id = routeId
      if (salesmanId) params.salesman_id = salesmanId
      
      const response = await apiClient.get(`${this.baseUrl}/stats`, { params })
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch beat stats:', error)
      throw error
    }
  }

  async optimizeRoute(routeId: string): Promise<{ optimized_order: Array<{ customer_id: string, visit_order: number }> }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${routeId}/optimize`)
      return response.data.data
    } catch (error) {
      console.error('Failed to optimize route:', error)
      throw error
    }
  }

  // Routes - Enhanced methods matching new backend endpoints
  async getRouteDetail(id: string): Promise<RouteDetail> {
    try {
      const response = await apiClient.get(`/routes/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch route detail:', error)
      throw error
    }
  }

  async createRoute(data: {
    name: string
    code?: string
    description?: string
    area_id?: string
    route_type?: string
  }): Promise<BeatRoute> {
    try {
      const response = await apiClient.post('/routes', data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create route:', error)
      throw error
    }
  }

  async updateRoute(id: string, data: Partial<BeatRoute>): Promise<BeatRoute> {
    try {
      const response = await apiClient.put(`/routes/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to update route:', error)
      throw error
    }
  }

  async assignRouteAgent(routeId: string, agentId: string): Promise<BeatRoute> {
    try {
      const response = await apiClient.post(`/routes/${routeId}/assign`, { agent_id: agentId })
      return response.data.data
    } catch (error) {
      console.error('Failed to assign route agent:', error)
      throw error
    }
  }

  // Route Stops - New endpoints
  async getRouteStopsForRoute(routeId: string): Promise<RouteStop[]> {
    try {
      const response = await apiClient.get('/route-stops', { params: { route_id: routeId } })
      return response.data.data?.stops || response.data.data || []
    } catch (error) {
      console.error('Failed to fetch route stops:', error)
      throw error
    }
  }

  async createRouteStop(data: {
    route_id: string
    customer_id?: string
    sequence_order?: number
    planned_arrival_time?: string
    planned_duration?: number
    visit_type?: string
    notes?: string
  }): Promise<RouteStop> {
    try {
      const response = await apiClient.post('/route-stops', data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create route stop:', error)
      throw error
    }
  }

  async updateRouteStop(id: string, data: Partial<RouteStop>): Promise<RouteStop> {
    try {
      const response = await apiClient.put(`/route-stops/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to update route stop:', error)
      throw error
    }
  }

  async deleteRouteStop(id: string): Promise<void> {
    try {
      await apiClient.delete(`/route-stops/${id}`)
    } catch (error) {
      console.error('Failed to delete route stop:', error)
      throw error
    }
  }

  async checkInRouteStop(id: string, data: {
    latitude?: number
    longitude?: number
    notes?: string
  }): Promise<RouteStop> {
    try {
      const response = await apiClient.post(`/route-stops/${id}/check-in`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to check in route stop:', error)
      throw error
    }
  }

  async checkOutRouteStop(id: string, data: {
    latitude?: number
    longitude?: number
    completion_notes?: string
  }): Promise<RouteStop> {
    try {
      const response = await apiClient.post(`/route-stops/${id}/check-out`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to check out route stop:', error)
      throw error
    }
  }

  async skipRouteStop(id: string, reason: string): Promise<RouteStop> {
    try {
      const response = await apiClient.post(`/route-stops/${id}/skip`, { skip_reason: reason })
      return response.data.data
    } catch (error) {
      console.error('Failed to skip route stop:', error)
      throw error
    }
  }

  // Areas - New endpoints
  async getAreas(filter?: any): Promise<{ areas: Area[], total: number }> {
    try {
      const response = await apiClient.get('/areas', { params: filter })
      return {
        areas: response.data.data?.areas || response.data.data || [],
        total: response.data.data?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch areas:', error)
      throw error
    }
  }

  async createArea(data: {
    name: string
    code?: string
    description?: string
    region?: string
  }): Promise<Area> {
    try {
      const response = await apiClient.post('/areas', data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create area:', error)
      throw error
    }
  }

  async updateArea(id: string, data: Partial<Area>): Promise<Area> {
    try {
      const response = await apiClient.put(`/areas/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to update area:', error)
      throw error
    }
  }

  async deleteArea(id: string): Promise<void> {
    try {
      await apiClient.delete(`/areas/${id}`)
    } catch (error) {
      console.error('Failed to delete area:', error)
      throw error
    }
  }
}

// Additional interfaces for new endpoints
export interface RouteDetail extends BeatRoute {
  stops?: RouteStop[]
  assigned_agent_name?: string
  area_name?: string
  route_type?: string
}

export interface RouteStop {
  id: string
  route_id: string
  customer_id?: string
  customer_name?: string
  sequence_order: number
  planned_arrival_time?: string
  planned_duration: number
  visit_type: string
  notes?: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  actual_arrival_time?: string
  actual_departure_time?: string
  check_in_latitude?: number
  check_in_longitude?: number
  check_out_latitude?: number
  check_out_longitude?: number
  completion_notes?: string
  skip_reason?: string
  created_by?: string
  created_at: string
  updated_at?: string
}

export interface Area {
  id: string
  tenant_id: string
  name: string
  code?: string
  description?: string
  region?: string
  status: 'active' | 'inactive'
  created_by?: string
  created_at: string
  updated_at?: string
}

export const beatRoutesService = new BeatRoutesService()
