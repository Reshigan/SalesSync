// Advanced Cache Management System - Team X2 Performance
export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  hits: number
  size: number
  tags: string[]
}

export interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  missRate: number
  evictions: number
  memoryUsage: number
}

export class AdvancedCacheManager {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number
  private maxEntries: number
  private stats: {
    hits: number
    misses: number
    evictions: number
    sets: number
  } = { hits: 0, misses: 0, evictions: 0, sets: 0 }

  constructor(options: {
    maxSize?: number // in bytes
    maxEntries?: number
    defaultTTL?: number
  } = {}) {
    this.maxSize = options.maxSize || 50 * 1024 * 1024 // 50MB
    this.maxEntries = options.maxEntries || 1000
  }

  // Set cache entry with advanced options
  set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number
      tags?: string[]
      priority?: 'low' | 'normal' | 'high'
    } = {}
  ): void {
    const { ttl = 5 * 60 * 1000, tags = [], priority = 'normal' } = options
    
    const size = this.calculateSize(data)
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      size,
      tags
    }

    // Check if we need to make room
    this.makeRoom(size)

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!
      this.cache.delete(key)
    }

    this.cache.set(key, entry)
    this.stats.sets++
  }

  // Get cache entry
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    // Update hit count and move to end (LRU)
    entry.hits++
    this.cache.delete(key)
    this.cache.set(key, entry)
    this.stats.hits++

    return entry.data
  }

  // Get or set pattern
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    options: {
      ttl?: number
      tags?: string[]
      priority?: 'low' | 'normal' | 'high'
    } = {}
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await factory()
    this.set(key, data, options)
    return data
  }

  // Delete entry
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // Clear cache by tags
  clearByTags(tags: string[]): number {
    let cleared = 0
    const toDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (entry.tags.some(tag => tags.includes(tag))) {
        toDelete.push(key)
      }
    })

    toDelete.forEach(key => {
      this.cache.delete(key)
      cleared++
    })

    return cleared
  }

  // Clear expired entries
  clearExpired(): number {
    let cleared = 0
    const now = Date.now()
    const toDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl) {
        toDelete.push(key)
      }
    })

    toDelete.forEach(key => {
      this.cache.delete(key)
      cleared++
    })

    return cleared
  }

  // Make room for new entry
  private makeRoom(newEntrySize: number): void {
    const currentSize = this.getCurrentSize()
    
    // Check size limit
    while (currentSize + newEntrySize > this.maxSize && this.cache.size > 0) {
      this.evictLRU()
    }

    // Check entry limit
    while (this.cache.size >= this.maxEntries) {
      this.evictLRU()
    }
  }

  // Evict least recently used entry
  private evictLRU(): void {
    const firstKey = this.cache.keys().next().value
    if (firstKey) {
      this.cache.delete(firstKey)
      this.stats.evictions++
    }
  }

  // Calculate data size
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2 // Rough estimate
    } catch {
      return 1024 // Default size for non-serializable data
    }
  }

  // Get current cache size
  private getCurrentSize(): number {
    let size = 0
    this.cache.forEach(entry => {
      size += entry.size
    })
    return size
  }

  // Get cache statistics
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0
    const missRate = totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0

    return {
      totalEntries: this.cache.size,
      totalSize: this.getCurrentSize(),
      hitRate,
      missRate,
      evictions: this.stats.evictions,
      memoryUsage: this.getCurrentSize()
    }
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Get entries by pattern
  getByPattern(pattern: RegExp): Array<{ key: string; data: any }> {
    const results: Array<{ key: string; data: any }> = []
    
    this.cache.forEach((entry, key) => {
      if (pattern.test(key)) {
        results.push({ key, data: entry.data })
      }
    })

    return results
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, evictions: 0, sets: 0 }
  }

  // Export cache data
  export(): Record<string, any> {
    const exported: Record<string, any> = {}
    
    this.cache.forEach((entry, key) => {
      exported[key] = {
        data: entry.data,
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        tags: entry.tags
      }
    })

    return exported
  }

  // Import cache data
  import(data: Record<string, any>): void {
    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value === 'object' && 'data' in value) {
        this.set(key, value.data, {
          ttl: value.ttl,
          tags: value.tags || []
        })
      }
    })
  }
}

// Multi-level cache system
export class MultiLevelCache {
  private l1Cache: AdvancedCacheManager // Memory cache
  private l2Cache: AdvancedCacheManager // Larger memory cache
  private l3Storage: Storage | null = null // Browser storage

  constructor() {
    this.l1Cache = new AdvancedCacheManager({
      maxSize: 10 * 1024 * 1024, // 10MB
      maxEntries: 500
    })
    
    this.l2Cache = new AdvancedCacheManager({
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 2000
    })

    // Use localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      this.l3Storage = window.localStorage
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try L1 cache first
    let data = this.l1Cache.get<T>(key)
    if (data !== null) {
      return data
    }

    // Try L2 cache
    data = this.l2Cache.get<T>(key)
    if (data !== null) {
      // Promote to L1
      this.l1Cache.set(key, data, { ttl: 5 * 60 * 1000 })
      return data
    }

    // Try L3 storage
    if (this.l3Storage) {
      try {
        const stored = this.l3Storage.getItem(`cache_${key}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Date.now() < parsed.expires) {
            // Promote to L2 and L1
            this.l2Cache.set(key, parsed.data, { ttl: 30 * 60 * 1000 })
            this.l1Cache.set(key, parsed.data, { ttl: 5 * 60 * 1000 })
            return parsed.data
          } else {
            // Remove expired entry
            this.l3Storage.removeItem(`cache_${key}`)
          }
        }
      } catch (error) {
        console.warn('L3 cache read error:', error)
      }
    }

    return null
  }

  set<T>(key: string, data: T, options: {
    l1TTL?: number
    l2TTL?: number
    l3TTL?: number
    tags?: string[]
  } = {}): void {
    const {
      l1TTL = 5 * 60 * 1000,
      l2TTL = 30 * 60 * 1000,
      l3TTL = 24 * 60 * 60 * 1000,
      tags = []
    } = options

    // Set in L1
    this.l1Cache.set(key, data, { ttl: l1TTL, tags })

    // Set in L2
    this.l2Cache.set(key, data, { ttl: l2TTL, tags })

    // Set in L3 if available
    if (this.l3Storage) {
      try {
        const toStore = {
          data,
          expires: Date.now() + l3TTL,
          tags
        }
        this.l3Storage.setItem(`cache_${key}`, JSON.stringify(toStore))
      } catch (error) {
        console.warn('L3 cache write error:', error)
      }
    }
  }

  delete(key: string): void {
    this.l1Cache.delete(key)
    this.l2Cache.delete(key)
    
    if (this.l3Storage) {
      this.l3Storage.removeItem(`cache_${key}`)
    }
  }

  clearByTags(tags: string[]): void {
    this.l1Cache.clearByTags(tags)
    this.l2Cache.clearByTags(tags)

    // Clear L3 by tags (more expensive)
    if (this.l3Storage) {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < this.l3Storage.length; i++) {
        const key = this.l3Storage.key(i)
        if (key && key.startsWith('cache_')) {
          try {
            const stored = this.l3Storage.getItem(key)
            if (stored) {
              const parsed = JSON.parse(stored)
              if (parsed.tags && parsed.tags.some((tag: string) => tags.includes(tag))) {
                keysToRemove.push(key)
              }
            }
          } catch (error) {
            // Remove corrupted entries
            keysToRemove.push(key)
          }
        }
      }

      keysToRemove.forEach(key => this.l3Storage!.removeItem(key))
    }
  }

  getStats() {
    return {
      l1: this.l1Cache.getStats(),
      l2: this.l2Cache.getStats(),
      l3: this.getL3Stats()
    }
  }

  private getL3Stats() {
    if (!this.l3Storage) {
      return { entries: 0, size: 0 }
    }

    let entries = 0
    let size = 0

    for (let i = 0; i < this.l3Storage.length; i++) {
      const key = this.l3Storage.key(i)
      if (key && key.startsWith('cache_')) {
        entries++
        const value = this.l3Storage.getItem(key)
        if (value) {
          size += value.length
        }
      }
    }

    return { entries, size }
  }

  clear(): void {
    this.l1Cache.clear()
    this.l2Cache.clear()

    if (this.l3Storage) {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < this.l3Storage.length; i++) {
        const key = this.l3Storage.key(i)
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => this.l3Storage!.removeItem(key))
    }
  }
}

// Query cache for API responses
export class QueryCache {
  private cache: MultiLevelCache
  private pendingQueries: Map<string, Promise<any>> = new Map()

  constructor() {
    this.cache = new MultiLevelCache()
  }

  async query<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: {
      ttl?: number
      staleTime?: number
      tags?: string[]
      retry?: number
    } = {}
  ): Promise<T> {
    const { ttl = 5 * 60 * 1000, staleTime = 60 * 1000, tags = [], retry = 3 } = options

    // Check if query is already pending
    if (this.pendingQueries.has(key)) {
      return this.pendingQueries.get(key)!
    }

    // Try to get from cache
    const cached = await this.cache.get<{ data: T; timestamp: number }>(key)
    if (cached) {
      const age = Date.now() - cached.timestamp
      
      // Return cached data if not stale
      if (age < staleTime) {
        return cached.data
      }
      
      // Return stale data but refresh in background
      if (age < ttl) {
        this.refreshInBackground(key, queryFn, options)
        return cached.data
      }
    }

    // Execute query with retry logic
    const queryPromise = this.executeWithRetry(queryFn, retry)
    this.pendingQueries.set(key, queryPromise)

    try {
      const data = await queryPromise
      
      // Cache the result
      this.cache.set(key, { data, timestamp: Date.now() }, {
        l1TTL: Math.min(ttl, 5 * 60 * 1000),
        l2TTL: ttl,
        l3TTL: ttl * 2,
        tags
      })

      return data
    } finally {
      this.pendingQueries.delete(key)
    }
  }

  private async refreshInBackground<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: any
  ): Promise<void> {
    try {
      const data = await queryFn()
      this.cache.set(key, { data, timestamp: Date.now() }, {
        l1TTL: Math.min(options.ttl || 5 * 60 * 1000, 5 * 60 * 1000),
        l2TTL: options.ttl || 5 * 60 * 1000,
        l3TTL: (options.ttl || 5 * 60 * 1000) * 2,
        tags: options.tags || []
      })
    } catch (error) {
      console.warn('Background refresh failed:', error)
    }
  }

  private async executeWithRetry<T>(
    queryFn: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await queryFn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError!
  }

  invalidate(pattern: string | RegExp): void {
    if (typeof pattern === 'string') {
      this.cache.delete(pattern)
    } else {
      // For regex patterns, we'd need to implement pattern matching
      // This is a simplified version
      console.warn('Regex invalidation not fully implemented')
    }
  }

  invalidateByTags(tags: string[]): void {
    this.cache.clearByTags(tags)
  }

  getStats() {
    return {
      cache: this.cache.getStats(),
      pendingQueries: this.pendingQueries.size
    }
  }

  clear(): void {
    this.cache.clear()
    this.pendingQueries.clear()
  }
}

// Create singleton instances
export const cacheManager = new AdvancedCacheManager()
export const multiLevelCache = new MultiLevelCache()
export const queryCache = new QueryCache()

// Cache decorators
export function cached(options: {
  ttl?: number
  key?: (args: any[]) => string
  tags?: string[]
} = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    const { ttl = 5 * 60 * 1000, key, tags = [] } = options

    descriptor.value = async function (...args: any[]) {
      const cacheKey = key ? key(args) : `${target.constructor.name}.${propertyName}.${JSON.stringify(args)}`
      
      return queryCache.query(
        cacheKey,
        () => method.apply(this, args),
        { ttl, tags }
      )
    }

    return descriptor
  }
}