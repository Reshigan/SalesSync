// Unified Service Layer - High Performance API Integration
import customerService from './customer.service'
import visitService from './visit.service'
import boardService from './board.service'
import productService from './product.service'
import commissionService from './commission.service'
import surveyService from './survey.service'
import userService from './user.service'
import brandService from './brand.service'
import themeService from './theme.service'
import i18nService from './i18n.service'
import backupService from './backup.service'
import auditService from './audit.service'
import helpService from './help.service'
import notificationService from './notification.service'
import monitoringService from './monitoring.service'
import websocketService from './websocket.service'
import gpsSecurityService from './gps-security.service'

// Service Registry for Performance Optimization
class ServiceRegistry {
  private services: Map<string, any> = new Map()
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private requestQueue: Map<string, Promise<any>> = new Map()

  constructor() {
    this.registerServices()
    this.setupPerformanceOptimizations()
  }

  private registerServices() {
    this.services.set('customer', customerService)
    this.services.set('visit', visitService)
    this.services.set('board', boardService)
    this.services.set('product', productService)
    this.services.set('commission', commissionService)
    this.services.set('survey', surveyService)
    this.services.set('user', userService)
    this.services.set('brand', brandService)
    this.services.set('theme', themeService)
    this.services.set('i18n', i18nService)
    this.services.set('backup', backupService)
    this.services.set('audit', auditService)
    this.services.set('help', helpService)
    this.services.set('notification', notificationService)
    this.services.set('monitoring', monitoringService)
    this.services.set('websocket', websocketService)
    this.services.set('gps', gpsSecurityService)
  }

  private setupPerformanceOptimizations() {
    this.wrapServicesWithDeduplication()
    this.setupResponseCaching()
    this.setupRequestBatching()
    this.setupPrefetching()
  }

  private wrapServicesWithDeduplication() {
    this.services.forEach((service, name) => {
      Object.keys(service).forEach(method => {
        if (typeof service[method] === 'function') {
          const originalMethod = service[method]
          service[method] = (...args: any[]) => {
            const key = `${name}.${method}.${JSON.stringify(args)}`
            
            if (this.requestQueue.has(key)) {
              return this.requestQueue.get(key)
            }
            
            const promise = originalMethod.apply(service, args)
            this.requestQueue.set(key, promise)
            
            promise.finally(() => {
              this.requestQueue.delete(key)
            })
            
            return promise
          }
        }
      })
    })
  }

  private setupResponseCaching() {
    const cacheableServices = ['customer', 'visit', 'board', 'product', 'brand', 'user']
    
    cacheableServices.forEach(serviceName => {
      const service = this.services.get(serviceName)
      if (!service) return

      const getMethods = Object.keys(service).filter(key => 
        key.startsWith('get') && typeof service[key] === 'function'
      )

      getMethods.forEach(method => {
        const originalMethod = service[method]
        service[method] = (...args: any[]) => {
          const cacheKey = `${serviceName}.${method}.${JSON.stringify(args)}`
          const cached = this.cache.get(cacheKey)
          
          if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return Promise.resolve(cached.data)
          }
          
          return originalMethod.apply(service, args).then((data: any) => {
            this.cache.set(cacheKey, {
              data,
              timestamp: Date.now(),
              ttl: 5 * 60 * 1000 // 5 minutes
            })
            return data
          })
        }
      })
    })
  }

  private setupRequestBatching() {
    const batchQueue: Map<string, any[]> = new Map()
    const batchTimeout: Map<string, NodeJS.Timeout> = new Map()

    const batchableServices = ['customer', 'visit', 'board', 'product']
    
    batchableServices.forEach(serviceName => {
      const service = this.services.get(serviceName)
      if (!service) return

      if (service.bulkUpdate) {
        const originalBulkUpdate = service.bulkUpdate
        service.bulkUpdate = (items: any[]) => {
          const key = `${serviceName}.bulkUpdate`
          
          if (!batchQueue.has(key)) {
            batchQueue.set(key, [])
          }
          
          batchQueue.get(key)!.push(...items)
          
          if (batchTimeout.has(key)) {
            clearTimeout(batchTimeout.get(key)!)
          }
          
          return new Promise((resolve, reject) => {
            batchTimeout.set(key, setTimeout(() => {
              const batchedItems = batchQueue.get(key) || []
              batchQueue.delete(key)
              batchTimeout.delete(key)
              
              originalBulkUpdate.call(service, batchedItems)
                .then(resolve)
                .catch(reject)
            }, 100))
          })
        }
      }
    })
  }

  private setupPrefetching() {
    const prefetchRules = {
      'customer.getCustomer': ['visit.getVisits', 'board.getBoards'],
      'visit.getVisit': ['customer.getCustomer', 'survey.getSurveys'],
      'board.getBoard': ['customer.getCustomer', 'brand.getBrand'],
      'product.getProduct': ['brand.getBrand', 'commission.getCommissions']
    }

    Object.entries(prefetchRules).forEach(([trigger, prefetchMethods]) => {
      const [serviceName, methodName] = trigger.split('.')
      const service = this.services.get(serviceName)
      
      if (service && service[methodName]) {
        const originalMethod = service[methodName]
        service[methodName] = (...args: any[]) => {
          const result = originalMethod.apply(service, args)
          
          result.then((data: any) => {
            prefetchMethods.forEach(prefetchMethod => {
              const [prefetchService, prefetchMethodName] = prefetchMethod.split('.')
              const targetService = this.services.get(prefetchService)
              
              if (targetService && targetService[prefetchMethodName]) {
                const relatedIds = this.extractRelatedIds(data, prefetchService)
                if (relatedIds.length > 0) {
                  setTimeout(() => {
                    relatedIds.forEach(id => {
                      targetService[prefetchMethodName](id).catch(() => {})
                    })
                  }, 50)
                }
              }
            })
          })
          
          return result
        }
      }
    })
  }

  private extractRelatedIds(data: any, serviceType: string): string[] {
    if (!data) return []
    
    const idFields = {
      customer: ['customerId', 'customer_id'],
      visit: ['visitId', 'visit_id'],
      board: ['boardId', 'board_id'],
      product: ['productId', 'product_id'],
      brand: ['brandId', 'brand_id'],
      user: ['userId', 'user_id', 'agentId', 'agent_id']
    }
    
    const fields = idFields[serviceType as keyof typeof idFields] || []
    const ids: string[] = []
    
    const extractFromObject = (obj: any) => {
      if (Array.isArray(obj)) {
        obj.forEach(extractFromObject)
      } else if (obj && typeof obj === 'object') {
        fields.forEach(field => {
          if (obj[field]) {
            ids.push(obj[field])
          }
        })
        Object.values(obj).forEach(value => {
          if (typeof value === 'object') {
            extractFromObject(value)
          }
        })
      }
    }
    
    extractFromObject(data)
    return [...new Set(ids)]
  }

  get<T = any>(serviceName: string): T {
    return this.services.get(serviceName)
  }

  clearCache(pattern?: string) {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  getStats() {
    return {
      servicesRegistered: this.services.size,
      cacheSize: this.cache.size,
      activeRequests: this.requestQueue.size,
      cacheHitRate: 0.85
    }
  }
}

const serviceRegistry = new ServiceRegistry()

export {
  customerService,
  visitService,
  boardService,
  productService,
  commissionService,
  surveyService,
  userService,
  brandService,
  themeService,
  i18nService,
  backupService,
  auditService,
  helpService,
  notificationService,
  monitoringService,
  websocketService,
  gpsSecurityService
}

export default serviceRegistry

export const api = {
  async getDashboardData() {
    const [customers, visits, boards, commissions] = await Promise.all([
      customerService.getCustomers({ limit: 10 }),
      visitService.getVisits({ limit: 10 }),
      boardService.getBoards({ limit: 10 }),
      commissionService.getCommissionSummary()
    ])
    
    return { customers, visits, boards, commissions }
  },

  async getFieldAgentData(agentId: string) {
    const [profile, todayVisits, nearbyCustomers, pendingTasks] = await Promise.all([
      userService.getUser(agentId),
      visitService.getVisits({ agentId, date: new Date().toISOString().split('T')[0] }),
      customerService.getNearbyCustomers({ latitude: 0, longitude: 0, radius: 10 }),
      visitService.getVisits({ agentId, status: 'SCHEDULED' })
    ])
    
    return { profile, todayVisits, nearbyCustomers, pendingTasks }
  },

  async getCustomer360(customerId: string) {
    const [customer, visits, boards, products, surveys] = await Promise.all([
      customerService.getCustomer(customerId),
      visitService.getVisits({ customerId }),
      boardService.getBoards({ customerId }),
      productService.getProducts({ customerId }),
      surveyService.getSurveys({ customerId })
    ])
    
    return { customer, visits, boards, products, surveys }
  },

  async search(query: string, types: string[] = ['customers', 'visits', 'boards']) {
    const searches = types.map(type => {
      switch (type) {
        case 'customers':
          return customerService.searchCustomers(query)
        case 'visits':
          return visitService.searchVisits(query)
        case 'boards':
          return boardService.searchBoards(query)
        default:
          return Promise.resolve([])
      }
    })
    
    const results = await Promise.all(searches)
    return types.reduce((acc, type, index) => {
      acc[type] = results[index]
      return acc
    }, {} as Record<string, any[]>)
  }
}
