import { apiClient } from '@/lib/api-client'

export interface SystemSettings {
  id?: string
  // GPS & Location Settings
  gpsValidationRadius: number // meters - default 10m
  requireGPSForVisits: boolean
  allowManualLocationEntry: boolean
  
  // Survey Settings
  skipCompletedSurveys: boolean // Skip surveys if completed at same location
  surveyExpiryDays: number // Days before survey needs to be redone
  mandatorySurveyFirst: boolean // Force mandatory surveys before optional ones
  
  // Visit Settings
  visitTimeout: number // minutes before visit auto-closes
  requirePhotosForVisit: boolean
  minPhotosPerVisit: number
  
  // Agent Settings
  allowOfflineMode: boolean
  syncIntervalMinutes: number
  maxOfflineHours: number
  
  // Working Hours
  workingHoursStart?: string // "08:00"
  workingHoursEnd?: string // "18:00"
  allowOutsideWorkingHours: boolean
  
  // Data Validation
  requireCustomerPhone: boolean
  requireCustomerEmail: boolean
  validatePhoneNumber: boolean
  phoneNumberPattern?: string
  
  updatedAt?: string
  updatedBy?: string
}

export const DEFAULT_SETTINGS: SystemSettings = {
  gpsValidationRadius: 10, // 10 meters
  requireGPSForVisits: true,
  allowManualLocationEntry: false,
  skipCompletedSurveys: true,
  surveyExpiryDays: 30,
  mandatorySurveyFirst: true,
  visitTimeout: 120,
  requirePhotosForVisit: false,
  minPhotosPerVisit: 1,
  allowOfflineMode: true,
  syncIntervalMinutes: 15,
  maxOfflineHours: 24,
  allowOutsideWorkingHours: false,
  requireCustomerPhone: true,
  requireCustomerEmail: false,
  validatePhoneNumber: true
}

class SettingsService {
  private baseUrl = '/settings'

  async getSettings() {
    try {
      return await apiClient.get<SystemSettings>(this.baseUrl)
    } catch (error) {
      console.warn('Using default settings:', error)
      return DEFAULT_SETTINGS
    }
  }

  async updateSettings(settings: Partial<SystemSettings>) {
    return apiClient.put<SystemSettings>(this.baseUrl, settings)
  }

  async resetToDefaults() {
    return apiClient.post<SystemSettings>(`${this.baseUrl}/reset`, {})
  }

  // Helper: Check if location is within radius of previous location
  isLocationWithinRadius(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    radiusMeters: number
  ): boolean {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    const distance = R * c // Distance in meters
    return distance <= radiusMeters
  }

  // Helper: Calculate distance between two GPS coordinates
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }
}

export const settingsService = new SettingsService()
