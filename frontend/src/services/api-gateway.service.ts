// Enterprise API Gateway Service - Advanced Microservices Architecture
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import apiClient from '@/lib/api-client'

export interface ServiceEndpoint {
  name: string
  baseURL: string
  version: string
  healthCheck: string
  timeout: number
  retries: number
  circuitBreaker: CircuitBreakerConfig
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
  monitoringPeriod: number
}

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  uptime: number
  lastCheck: string
  errors: number
}

export interface LoadBalancerConfig {
  strategy: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash'
  healthCheck: boolean
  failover: boolean
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests: boolean
  skipFailedRequests: boolean
}

class APIGatewayService {
  private services: Map<string, ServiceEndpoint> = new Map()
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()
  private loadBalancers: Map<string, LoadBalancer> = new Map()
  private rateLimiters: Map<string, RateLimiter> = new Map()
  private healthChecks: Map<string, ServiceHealth> = new Map()
  private requestQueue: Map<string, Array<() => Promise<any>>> = new Map()

  constructor() {
    this.initializeServices()
    this.startHealthChecking()
  }

  private initializeServices() {
    // Core services
    this.registerService({
      name: 'customer-service',
      baseURL: process.env.NEXT_PUBLIC_CUSTOMER_SERVICE_URL || 'http://localhost:3001',
      version: 'v1',
      healthCheck: '/health',
      timeout: 5000,
      retries: 3,
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 10000
      }
    })

    this.registerService({
      name: 'visit-service',
      baseURL: process.env.NEXT_PUBLIC_VISIT_SERVICE_URL || 'http://localhost:3002',
      version: 'v1',
      healthCheck: '/health',
      timeout: 5000,
      retries: 3,
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 10000
      }
    })

    this.registerService({
      name: 'board-service',
      baseURL: process.env.NEXT_PUBLIC_BOARD_SERVICE_URL || 'http://localhost:3003',
      version: 'v1',
      healthCheck: '/health',
      timeout: 10000,
      retries: 2,
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeout: 30000,
        monitoringPeriod: 5000
      }
    })

    this.registerService({
      name: 'product-service',
      baseURL: process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:3004',
      version: 'v1',
      healthCheck: '/health',
      timeout: 5000,
      retries: 3,
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 10000
      }
    })

    this.registerService({
      name: 'commission-service',
      baseURL: process.env.NEXT_PUBLIC_COMMISSION_SERVICE_URL || 'http://localhost:3005',
      version: 'v1',
      healthCheck: '/health',
      timeout: 8000,
      retries: 3,
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeout: 45000,
        monitoringPeriod: 8000
      }
    })

    this.registerService({
      name: 'notification-service',
      baseURL: process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
      version: 'v1',
      healthCheck: '/health',
      timeout: 3000,
      retries: 2,
      circuitBreaker: {
        failureThreshold: 10,
        resetTimeout: 30000,
        monitoringPeriod: 5000
      }
    })

    this.registerService({
      name: 'analytics-service',
      baseURL: process.env.NEXT_PUBLIC_ANALYTICS_SERVICE_URL || 'http://localhost:3007',
      version: 'v1',
      healthCheck: '/health',
      timeout: 15000,
      retries: 2,
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeout: 120000,
        monitoringPeriod: 15000
      }
    })
  }

  registerService(endpoint: ServiceEndpoint) {
    this.services.set(endpoint.name, endpoint)
    this.circuitBreakers.set(endpoint.name, new CircuitBreaker(endpoint.circuitBreaker))
    this.loadBalancers.set(endpoint.name, new LoadBalancer({ strategy: 'round-robin', healthCheck: true, failover: true }))
    this.rateLimiters.set(endpoint.name, new RateLimiter({ windowMs: 60000, maxRequests: 1000, skipSuccessfulRequests: false, skipFailedRequests: false }))
  }

  async request<T = any>(
    serviceName: string,
    config: AxiosRequestConfig & {
      priority?: 'low' | 'normal' | 'high' | 'critical'
      timeout?: number
      retries?: number
      fallback?: () => Promise<T>
    }
  ): Promise<T> {
    const service = this.services.get(serviceName)
    if (!service) {
      throw new Error(`Service ${serviceName} not found`)
    }

    const circuitBreaker = this.circuitBreakers.get(serviceName)!
    const rateLimiter = this.rateLimiters.get(serviceName)!

    // Check rate limiting
    if (!rateLimiter.allowRequest()) {
      throw new Error(`Rate limit exceeded for service ${serviceName}`)
    }

    // Check circuit breaker
    if (!circuitBreaker.allowRequest()) {
      if (config.fallback) {
        return config.fallback()
      }
      throw new Error(`Circuit breaker open for service ${serviceName}`)
    }

    const requestConfig: AxiosRequestConfig = {
      ...config,
      baseURL: service.baseURL,
      timeout: config.timeout || service.timeout,
      headers: {
        ...config.headers,
        'X-Service-Version': service.version,
        'X-Request-ID': this.generateRequestId(),
        'X-Priority': config.priority || 'normal'
      }
    }

    try {
      const response = await this.executeWithRetry(
        () => apiClient.request<T>(requestConfig),
        config.retries || service.retries
      )

      circuitBreaker.recordSuccess()
      rateLimiter.recordSuccess()
      
      return response.data
    } catch (error) {
      circuitBreaker.recordFailure()
      rateLimiter.recordFailure()

      if (config.fallback) {
        return config.fallback()
      }

      throw error
    }
  }

  private async executeWithRetry<T>(
    fn: () => Promise<AxiosResponse<T>>,
    maxRetries: number
  ): Promise<AxiosResponse<T>> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError!
  }

  // Service discovery
  async discoverServices(): Promise<ServiceEndpoint[]> {
    const services: ServiceEndpoint[] = []
    
    for (const [name, endpoint] of this.services) {
      try {
        const health = await this.checkServiceHealth(name)
        if (health.status !== 'unhealthy') {
          services.push(endpoint)
        }
      } catch (error) {
        console.warn(`Service discovery failed for ${name}:`, error)
      }
    }

    return services
  }

  // Health checking
  private startHealthChecking() {
    setInterval(async () => {
      for (const serviceName of this.services.keys()) {
        try {
          await this.checkServiceHealth(serviceName)
        } catch (error) {
          console.error(`Health check failed for ${serviceName}:`, error)
        }
      }
    }, 30000) // Check every 30 seconds
  }

  async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const service = this.services.get(serviceName)
    if (!service) {
      throw new Error(`Service ${serviceName} not found`)
    }

    const startTime = Date.now()
    
    try {
      const response = await apiClient.get(`${service.baseURL}${service.healthCheck}`, {
        timeout: 5000
      })

      const responseTime = Date.now() - startTime
      const health: ServiceHealth = {
        name: serviceName,
        status: response.status === 200 ? 'healthy' : 'degraded',
        responseTime,
        uptime: response.data?.uptime || 0,
        lastCheck: new Date().toISOString(),
        errors: 0
      }

      this.healthChecks.set(serviceName, health)
      return health
    } catch (error) {
      const health: ServiceHealth = {
        name: serviceName,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        uptime: 0,
        lastCheck: new Date().toISOString(),
        errors: this.healthChecks.get(serviceName)?.errors || 0 + 1
      }

      this.healthChecks.set(serviceName, health)
      return health
    }
  }

  // Get all service health statuses
  getServiceHealthStatuses(): ServiceHealth[] {
    return Array.from(this.healthChecks.values())
  }

  // Request routing with load balancing
  async routeRequest<T>(
    serviceName: string,
    config: AxiosRequestConfig,
    instances?: string[]
  ): Promise<T> {
    const loadBalancer = this.loadBalancers.get(serviceName)
    if (!loadBalancer || !instances) {
      return this.request<T>(serviceName, config)
    }

    const selectedInstance = loadBalancer.selectInstance(instances)
    const service = { ...this.services.get(serviceName)!, baseURL: selectedInstance }
    
    return this.request<T>(serviceName, { ...config, baseURL: selectedInstance })
  }

  // Batch requests
  async batchRequests<T>(
    requests: Array<{
      serviceName: string
      config: AxiosRequestConfig
      key: string
    }>
  ): Promise<Record<string, T>> {
    const results: Record<string, T> = {}
    const promises = requests.map(async ({ serviceName, config, key }) => {
      try {
        const result = await this.request<T>(serviceName, config)
        results[key] = result
      } catch (error) {
        console.error(`Batch request failed for ${key}:`, error)
        results[key] = null as any
      }
    })

    await Promise.all(promises)
    return results
  }

  // Service mesh communication
  async serviceToServiceCall<T>(
    fromService: string,
    toService: string,
    config: AxiosRequestConfig
  ): Promise<T> {
    const enhancedConfig = {
      ...config,
      headers: {
        ...config.headers,
        'X-Source-Service': fromService,
        'X-Target-Service': toService,
        'X-Service-Mesh': 'true'
      }
    }

    return this.request<T>(toService, enhancedConfig)
  }

  // API versioning
  async requestWithVersion<T>(
    serviceName: string,
    version: string,
    config: AxiosRequestConfig
  ): Promise<T> {
    const service = this.services.get(serviceName)
    if (!service) {
      throw new Error(`Service ${serviceName} not found`)
    }

    const versionedConfig = {
      ...config,
      baseURL: `${service.baseURL}/${version}`,
      headers: {
        ...config.headers,
        'X-API-Version': version
      }
    }

    return this.request<T>(serviceName, versionedConfig)
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get gateway statistics
  getGatewayStats() {
    const stats = {
      services: this.services.size,
      healthyServices: 0,
      unhealthyServices: 0,
      totalRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      circuitBreakersOpen: 0
    }

    this.healthChecks.forEach(health => {
      if (health.status === 'healthy') {
        stats.healthyServices++
      } else {
        stats.unhealthyServices++
      }
    })

    this.circuitBreakers.forEach(cb => {
      if (cb.isOpen()) {
        stats.circuitBreakersOpen++
      }
    })

    return stats
  }
}

// Circuit Breaker implementation
class CircuitBreaker {
  private failures: number = 0
  private lastFailureTime: number = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(private config: CircuitBreakerConfig) {}

  allowRequest(): boolean {
    if (this.state === 'CLOSED') {
      return true
    }

    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'HALF_OPEN'
        return true
      }
      return false
    }

    // HALF_OPEN state
    return true
  }

  recordSuccess() {
    this.failures = 0
    this.state = 'CLOSED'
  }

  recordFailure() {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN'
    }
  }

  isOpen(): boolean {
    return this.state === 'OPEN'
  }
}

// Load Balancer implementation
class LoadBalancer {
  private currentIndex: number = 0

  constructor(private config: LoadBalancerConfig) {}

  selectInstance(instances: string[]): string {
    if (instances.length === 0) {
      throw new Error('No instances available')
    }

    switch (this.config.strategy) {
      case 'round-robin':
        const instance = instances[this.currentIndex % instances.length]
        this.currentIndex++
        return instance

      case 'least-connections':
        // Simplified - would need connection tracking
        return instances[0]

      case 'weighted':
        // Simplified - would need weight configuration
        return instances[0]

      case 'ip-hash':
        // Simplified - would need client IP
        return instances[0]

      default:
        return instances[0]
    }
  }
}

// Rate Limiter implementation
class RateLimiter {
  private requests: number[] = []

  constructor(private config: RateLimitConfig) {}

  allowRequest(): boolean {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // Remove old requests
    this.requests = this.requests.filter(time => time > windowStart)

    if (this.requests.length >= this.config.maxRequests) {
      return false
    }

    this.requests.push(now)
    return true
  }

  recordSuccess() {
    // Implementation for success tracking
  }

  recordFailure() {
    // Implementation for failure tracking
  }
}

// Create singleton instance
const apiGateway = new APIGatewayService()
export default apiGateway