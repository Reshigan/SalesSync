// GPS Security Service - Prevents location spoofing and validates GPS data
interface GPSReading {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
  timestamp: number
}

interface GPSValidationResult {
  isValid: boolean
  confidence: number
  warnings: string[]
  errors: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

interface LocationHistory {
  readings: GPSReading[]
  maxHistory: number
}

class GPSSecurityService {
  private locationHistory: LocationHistory = {
    readings: [],
    maxHistory: 50
  }
  
  private readonly MAX_SPEED_KMH = 120 // Maximum reasonable speed in km/h
  private readonly MIN_ACCURACY_METERS = 100 // Minimum acceptable accuracy
  private readonly MAX_ACCURACY_METERS = 5 // Maximum accuracy for high confidence
  private readonly MIN_TIME_BETWEEN_READINGS = 1000 // Minimum time between readings in ms
  private readonly MAX_DISTANCE_JUMP = 1000 // Maximum distance jump in meters
  
  // Validate GPS reading for potential spoofing
  public validateGPSReading(reading: GPSReading): GPSValidationResult {
    const result: GPSValidationResult = {
      isValid: true,
      confidence: 1.0,
      warnings: [],
      errors: [],
      riskLevel: 'LOW'
    }
    
    // Basic validation
    this.validateBasicCoordinates(reading, result)
    this.validateAccuracy(reading, result)
    this.validateTimestamp(reading, result)
    
    // Advanced validation against history
    if (this.locationHistory.readings.length > 0) {
      this.validateAgainstHistory(reading, result)
      this.validateMovementPattern(reading, result)
      this.validateSpeed(reading, result)
    }
    
    // Check for common spoofing indicators
    this.checkSpoofingIndicators(reading, result)
    
    // Calculate overall risk level
    this.calculateRiskLevel(result)
    
    // Store reading in history
    this.addToHistory(reading)
    
    return result
  }
  
  // Validate basic coordinate values
  private validateBasicCoordinates(reading: GPSReading, result: GPSValidationResult) {
    // Check latitude bounds
    if (reading.latitude < -90 || reading.latitude > 90) {
      result.errors.push('Invalid latitude: must be between -90 and 90')
      result.isValid = false
      result.confidence *= 0.1
    }
    
    // Check longitude bounds
    if (reading.longitude < -180 || reading.longitude > 180) {
      result.errors.push('Invalid longitude: must be between -180 and 180')
      result.isValid = false
      result.confidence *= 0.1
    }
    
    // Check for exact zero coordinates (common in spoofing)
    if (reading.latitude === 0 && reading.longitude === 0) {
      result.warnings.push('Coordinates are exactly (0,0) - possible default value')
      result.confidence *= 0.3
    }
    
    // Check for suspiciously round numbers
    if (this.isRoundNumber(reading.latitude) && this.isRoundNumber(reading.longitude)) {
      result.warnings.push('Coordinates are suspiciously round numbers')
      result.confidence *= 0.7
    }
  }
  
  // Validate GPS accuracy
  private validateAccuracy(reading: GPSReading, result: GPSValidationResult) {
    if (reading.accuracy < 0) {
      result.errors.push('Invalid accuracy: cannot be negative')
      result.isValid = false
      result.confidence *= 0.1
    }
    
    if (reading.accuracy > this.MIN_ACCURACY_METERS) {
      result.warnings.push(`Low GPS accuracy: ${reading.accuracy}m (threshold: ${this.MIN_ACCURACY_METERS}m)`)
      result.confidence *= Math.max(0.3, this.MIN_ACCURACY_METERS / reading.accuracy)
    }
    
    // Suspiciously high accuracy might indicate spoofing
    if (reading.accuracy < 1) {
      result.warnings.push('Suspiciously high accuracy - possible spoofing')
      result.confidence *= 0.8
    }
  }
  
  // Validate timestamp
  private validateTimestamp(reading: GPSReading, result: GPSValidationResult) {
    const now = Date.now()
    const timeDiff = Math.abs(now - reading.timestamp)
    
    // Check if timestamp is too far in the future or past
    if (timeDiff > 300000) { // 5 minutes
      result.warnings.push('GPS timestamp is significantly different from current time')
      result.confidence *= 0.8
    }
    
    // Check if timestamp is exactly current time (possible spoofing)
    if (timeDiff < 100) { // Less than 100ms
      result.warnings.push('GPS timestamp matches current time too closely')
      result.confidence *= 0.9
    }
  }
  
  // Validate against location history
  private validateAgainstHistory(reading: GPSReading, result: GPSValidationResult) {
    const lastReading = this.locationHistory.readings[this.locationHistory.readings.length - 1]
    
    if (!lastReading) return
    
    const timeDiff = reading.timestamp - lastReading.timestamp
    const distance = this.calculateDistance(
      lastReading.latitude, lastReading.longitude,
      reading.latitude, reading.longitude
    )
    
    // Check minimum time between readings
    if (timeDiff < this.MIN_TIME_BETWEEN_READINGS) {
      result.warnings.push('GPS readings too frequent - possible automated spoofing')
      result.confidence *= 0.7
    }
    
    // Check for impossible distance jumps
    if (distance > this.MAX_DISTANCE_JUMP && timeDiff < 60000) { // 1 minute
      result.errors.push(`Impossible location jump: ${distance.toFixed(0)}m in ${timeDiff/1000}s`)
      result.isValid = false
      result.confidence *= 0.2
    }
  }
  
  // Validate movement pattern
  private validateMovementPattern(reading: GPSReading, result: GPSValidationResult) {
    if (this.locationHistory.readings.length < 3) return
    
    const recentReadings = this.locationHistory.readings.slice(-3)
    recentReadings.push(reading)
    
    // Check for perfectly straight line movement (suspicious)
    if (this.isLinearMovement(recentReadings)) {
      result.warnings.push('Movement pattern is suspiciously linear')
      result.confidence *= 0.8
    }
    
    // Check for repetitive patterns
    if (this.hasRepetitivePattern(recentReadings)) {
      result.warnings.push('Repetitive movement pattern detected')
      result.confidence *= 0.7
    }
  }
  
  // Validate speed
  private validateSpeed(reading: GPSReading, result: GPSValidationResult) {
    const lastReading = this.locationHistory.readings[this.locationHistory.readings.length - 1]
    
    if (!lastReading) return
    
    const timeDiff = (reading.timestamp - lastReading.timestamp) / 1000 // seconds
    const distance = this.calculateDistance(
      lastReading.latitude, lastReading.longitude,
      reading.latitude, reading.longitude
    )
    
    if (timeDiff > 0) {
      const speedMps = distance / timeDiff // meters per second
      const speedKmh = speedMps * 3.6 // km/h
      
      if (speedKmh > this.MAX_SPEED_KMH) {
        result.errors.push(`Impossible speed: ${speedKmh.toFixed(1)} km/h (max: ${this.MAX_SPEED_KMH} km/h)`)
        result.isValid = false
        result.confidence *= 0.1
      }
      
      // Check for instant teleportation (0 time, significant distance)
      if (timeDiff < 1 && distance > 10) {
        result.errors.push('Instant teleportation detected')
        result.isValid = false
        result.confidence *= 0.1
      }
    }
  }
  
  // Check for common spoofing indicators
  private checkSpoofingIndicators(reading: GPSReading, result: GPSValidationResult) {
    // Check for mock location app indicators
    if (this.isMockLocationEnabled()) {
      result.warnings.push('Mock location apps detected on device')
      result.confidence *= 0.5
    }
    
    // Check for developer options enabled
    if (this.isDeveloperModeEnabled()) {
      result.warnings.push('Developer options enabled - location spoofing possible')
      result.confidence *= 0.8
    }
    
    // Check for common spoofing coordinates
    if (this.isCommonSpoofingLocation(reading.latitude, reading.longitude)) {
      result.warnings.push('Location matches common spoofing coordinates')
      result.confidence *= 0.6
    }
    
    // Check altitude consistency
    if (reading.altitude !== undefined && this.locationHistory.readings.length > 0) {
      const lastReading = this.locationHistory.readings[this.locationHistory.readings.length - 1]
      if (lastReading.altitude !== undefined) {
        const altitudeDiff = Math.abs(reading.altitude - lastReading.altitude)
        const distance = this.calculateDistance(
          lastReading.latitude, lastReading.longitude,
          reading.latitude, reading.longitude
        )
        
        // Impossible altitude changes
        if (altitudeDiff > distance * 0.5) { // More than 50% grade
          result.warnings.push('Impossible altitude change detected')
          result.confidence *= 0.7
        }
      }
    }
  }
  
  // Calculate overall risk level
  private calculateRiskLevel(result: GPSValidationResult) {
    if (!result.isValid || result.confidence < 0.3) {
      result.riskLevel = 'CRITICAL'
    } else if (result.confidence < 0.5 || result.errors.length > 0) {
      result.riskLevel = 'HIGH'
    } else if (result.confidence < 0.7 || result.warnings.length > 2) {
      result.riskLevel = 'MEDIUM'
    } else {
      result.riskLevel = 'LOW'
    }
  }
  
  // Add reading to history
  private addToHistory(reading: GPSReading) {
    this.locationHistory.readings.push(reading)
    
    // Keep only recent readings
    if (this.locationHistory.readings.length > this.locationHistory.maxHistory) {
      this.locationHistory.readings.shift()
    }
  }
  
  // Utility functions
  private isRoundNumber(num: number): boolean {
    return num === Math.round(num * 100) / 100 // Round to 2 decimal places
  }
  
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
  
  private isLinearMovement(readings: GPSReading[]): boolean {
    if (readings.length < 3) return false
    
    // Calculate bearing between consecutive points
    const bearings: number[] = []
    for (let i = 0; i < readings.length - 1; i++) {
      const bearing = this.calculateBearing(
        readings[i].latitude, readings[i].longitude,
        readings[i + 1].latitude, readings[i + 1].longitude
      )
      bearings.push(bearing)
    }
    
    // Check if all bearings are similar (within 10 degrees)
    const avgBearing = bearings.reduce((sum, b) => sum + b, 0) / bearings.length
    return bearings.every(b => Math.abs(b - avgBearing) < 10)
  }
  
  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = this.toRadians(lon2 - lon1)
    const lat1Rad = this.toRadians(lat1)
    const lat2Rad = this.toRadians(lat2)
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon)
    
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
  }
  
  private hasRepetitivePattern(readings: GPSReading[]): boolean {
    if (readings.length < 4) return false
    
    // Check for back-and-forth movement
    const distances = []
    for (let i = 0; i < readings.length - 1; i++) {
      distances.push(this.calculateDistance(
        readings[i].latitude, readings[i].longitude,
        readings[i + 1].latitude, readings[i + 1].longitude
      ))
    }
    
    // If distances are very similar, it might be repetitive
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length
    
    return variance < 10 && avgDistance > 0 // Low variance but non-zero movement
  }
  
  private isMockLocationEnabled(): boolean {
    // This would need to be implemented based on platform
    // For web, we can't directly detect mock location apps
    // But we can check for certain browser behaviors
    
    try {
      // Check if geolocation is overridden
      const descriptor = Object.getOwnPropertyDescriptor(navigator, 'geolocation')
      if (descriptor && descriptor.configurable === false) {
        return true // Likely overridden
      }
      
      // Check for common spoofing libraries
      if ((window as any).mockGeolocation || (window as any).fakeGPS) {
        return true
      }
      
      return false
    } catch (error) {
      return false
    }
  }
  
  private isDeveloperModeEnabled(): boolean {
    // For web, check for developer tools indicators
    try {
      // Check if console is open (rough indicator)
      const threshold = 160
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        return true
      }
      
      return false
    } catch (error) {
      return false
    }
  }
  
  private isCommonSpoofingLocation(lat: number, lon: number): boolean {
    // Common spoofing locations (approximate)
    const commonLocations = [
      { lat: 37.7749, lon: -122.4194, name: 'San Francisco' },
      { lat: 40.7128, lon: -74.0060, name: 'New York' },
      { lat: 51.5074, lon: -0.1278, name: 'London' },
      { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
      { lat: 0, lon: 0, name: 'Null Island' }
    ]
    
    const threshold = 0.01 // ~1km
    
    return commonLocations.some(location => 
      Math.abs(lat - location.lat) < threshold && 
      Math.abs(lon - location.lon) < threshold
    )
  }
  
  // Get current location with security validation
  public async getSecureLocation(options?: PositionOptions): Promise<{
    position: GeolocationPosition
    validation: GPSValidationResult
  }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      
      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const reading: GPSReading = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp
          }
          
          const validation = this.validateGPSReading(reading)
          
          resolve({ position, validation })
        },
        (error) => {
          reject(error)
        },
        defaultOptions
      )
    })
  }
  
  // Watch position with security validation
  public watchSecurePosition(
    callback: (position: GeolocationPosition, validation: GPSValidationResult) => void,
    errorCallback?: (error: GeolocationPositionError) => void,
    options?: PositionOptions
  ): number {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported')
    }
    
    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
      ...options
    }
    
    return navigator.geolocation.watchPosition(
      (position) => {
        const reading: GPSReading = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp
        }
        
        const validation = this.validateGPSReading(reading)
        callback(position, validation)
      },
      errorCallback,
      defaultOptions
    )
  }
  
  // Clear location history
  public clearHistory() {
    this.locationHistory.readings = []
  }
  
  // Get location history
  public getLocationHistory(): GPSReading[] {
    return [...this.locationHistory.readings]
  }
  
  // Get security statistics
  public getSecurityStats(): {
    totalReadings: number
    validReadings: number
    invalidReadings: number
    averageConfidence: number
    riskDistribution: Record<string, number>
  } {
    const readings = this.locationHistory.readings
    const validations = readings.map(r => this.validateGPSReading(r))
    
    const validReadings = validations.filter(v => v.isValid).length
    const averageConfidence = validations.reduce((sum, v) => sum + v.confidence, 0) / validations.length
    
    const riskDistribution = validations.reduce((acc, v) => {
      acc[v.riskLevel] = (acc[v.riskLevel] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalReadings: readings.length,
      validReadings,
      invalidReadings: readings.length - validReadings,
      averageConfidence: averageConfidence || 0,
      riskDistribution
    }
  }
}

// Create singleton instance
const gpsSecurityService = new GPSSecurityService()

export default gpsSecurityService
export { GPSSecurityService, GPSReading, GPSValidationResult }