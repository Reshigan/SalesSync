// Performance Optimization Utilities - Team X2 Speed Enhancement
import { debounce, throttle } from 'lodash-es'

// Performance monitoring
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private observers: Map<string, PerformanceObserver> = new Map()

  constructor() {
    this.setupObservers()
  }

  private setupObservers() {
    // Core Web Vitals monitoring
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.recordMetric('LCP', lastEntry.startTime)
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set('lcp', lcpObserver)

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.recordMetric('FID', entry.processingStart - entry.startTime)
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.set('fid', fidObserver)

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            this.recordMetric('CLS', entry.value)
          }
        })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.set('cls', clsObserver)
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
  }

  getMetrics() {
    const result: Record<string, any> = {}
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        current: values[values.length - 1],
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      }
    })
    
    return result
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }
}

// Image optimization
export class ImageOptimizer {
  private cache: Map<string, string> = new Map()
  private loadingImages: Set<string> = new Set()

  async optimizeImage(src: string, options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png'
  } = {}): Promise<string> {
    const cacheKey = `${src}-${JSON.stringify(options)}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    if (this.loadingImages.has(cacheKey)) {
      return new Promise((resolve) => {
        const checkCache = () => {
          if (this.cache.has(cacheKey)) {
            resolve(this.cache.get(cacheKey)!)
          } else {
            setTimeout(checkCache, 50)
          }
        }
        checkCache()
      })
    }

    this.loadingImages.add(cacheKey)

    try {
      // Create canvas for image processing
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      return new Promise((resolve, reject) => {
        img.onload = () => {
          const { width = img.width, height = img.height, quality = 0.8, format = 'webp' } = options
          
          canvas.width = width
          canvas.height = height
          
          ctx.drawImage(img, 0, 0, width, height)
          
          const optimizedSrc = canvas.toDataURL(`image/${format}`, quality)
          this.cache.set(cacheKey, optimizedSrc)
          this.loadingImages.delete(cacheKey)
          resolve(optimizedSrc)
        }
        
        img.onerror = () => {
          this.loadingImages.delete(cacheKey)
          reject(new Error(`Failed to load image: ${src}`))
        }
        
        img.src = src
      })
    } catch (error) {
      this.loadingImages.delete(cacheKey)
      throw error
    }
  }

  preloadImages(urls: string[]) {
    urls.forEach(url => {
      const img = new Image()
      img.src = url
    })
  }

  clearCache() {
    this.cache.clear()
  }
}

// Virtual scrolling for large lists
export class VirtualScroller {
  private container: HTMLElement
  private items: any[]
  private itemHeight: number
  private visibleCount: number
  private scrollTop: number = 0
  private renderCallback: (items: any[], startIndex: number) => void

  constructor(
    container: HTMLElement,
    items: any[],
    itemHeight: number,
    renderCallback: (items: any[], startIndex: number) => void
  ) {
    this.container = container
    this.items = items
    this.itemHeight = itemHeight
    this.renderCallback = renderCallback
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2
    
    this.setupScrollListener()
    this.render()
  }

  private setupScrollListener() {
    const handleScroll = throttle(() => {
      this.scrollTop = this.container.scrollTop
      this.render()
    }, 16) // 60fps

    this.container.addEventListener('scroll', handleScroll)
  }

  private render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight)
    const endIndex = Math.min(startIndex + this.visibleCount, this.items.length)
    const visibleItems = this.items.slice(startIndex, endIndex)
    
    this.renderCallback(visibleItems, startIndex)
  }

  updateItems(items: any[]) {
    this.items = items
    this.render()
  }
}

// Lazy loading utility
export class LazyLoader {
  private observer: IntersectionObserver
  private elements: Map<Element, () => void> = new Map()

  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const callback = this.elements.get(entry.target)
          if (callback) {
            callback()
            this.unobserve(entry.target)
          }
        }
      })
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    })
  }

  observe(element: Element, callback: () => void) {
    this.elements.set(element, callback)
    this.observer.observe(element)
  }

  unobserve(element: Element) {
    this.elements.delete(element)
    this.observer.unobserve(element)
  }

  disconnect() {
    this.observer.disconnect()
    this.elements.clear()
  }
}

// Memory management
export class MemoryManager {
  private cache: Map<string, { data: any; timestamp: number; size: number }> = new Map()
  private maxSize: number = 50 * 1024 * 1024 // 50MB
  private currentSize: number = 0

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) {
    const size = this.calculateSize(data)
    
    // Remove expired items
    this.cleanup()
    
    // Make room if needed
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictOldest()
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
      size
    })
    
    this.currentSize += size
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() > item.timestamp) {
      this.delete(key)
      return null
    }
    
    return item.data
  }

  delete(key: string) {
    const item = this.cache.get(key)
    if (item) {
      this.currentSize -= item.size
      this.cache.delete(key)
    }
  }

  private cleanup() {
    const now = Date.now()
    const toDelete: string[] = []
    
    this.cache.forEach((item, key) => {
      if (now > item.timestamp) {
        toDelete.push(key)
      }
    })
    
    toDelete.forEach(key => this.delete(key))
  }

  private evictOldest() {
    let oldestKey: string | null = null
    let oldestTime = Infinity
    
    this.cache.forEach((item, key) => {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    })
    
    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2 // Rough estimate
  }

  getStats() {
    return {
      size: this.currentSize,
      maxSize: this.maxSize,
      itemCount: this.cache.size,
      utilization: (this.currentSize / this.maxSize) * 100
    }
  }

  clear() {
    this.cache.clear()
    this.currentSize = 0
  }
}

// Touch gesture handler for mobile
export class TouchGestureHandler {
  private element: HTMLElement
  private startX: number = 0
  private startY: number = 0
  private currentX: number = 0
  private currentY: number = 0
  private isTracking: boolean = false

  constructor(element: HTMLElement) {
    this.element = element
    this.setupEventListeners()
  }

  private setupEventListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
  }

  private handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0]
    this.startX = touch.clientX
    this.startY = touch.clientY
    this.currentX = touch.clientX
    this.currentY = touch.clientY
    this.isTracking = true
  }

  private handleTouchMove(e: TouchEvent) {
    if (!this.isTracking) return
    
    const touch = e.touches[0]
    this.currentX = touch.clientX
    this.currentY = touch.clientY
  }

  private handleTouchEnd(e: TouchEvent) {
    if (!this.isTracking) return
    
    const deltaX = this.currentX - this.startX
    const deltaY = this.currentY - this.startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Detect gestures
    if (distance > 50) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.onSwipeRight()
        } else {
          this.onSwipeLeft()
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.onSwipeDown()
        } else {
          this.onSwipeUp()
        }
      }
    } else if (distance < 10) {
      this.onTap()
    }
    
    this.isTracking = false
  }

  onSwipeLeft() {}
  onSwipeRight() {}
  onSwipeUp() {}
  onSwipeDown() {}
  onTap() {}
}

// Bundle optimization utilities
export const bundleOptimizer = {
  // Dynamic imports for code splitting
  async loadComponent(componentName: string) {
    try {
      const module = await import(`../components/${componentName}`)
      return module.default
    } catch (error) {
      console.error(`Failed to load component: ${componentName}`, error)
      return null
    }
  },

  // Preload critical resources
  preloadResources(resources: string[]) {
    resources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource
      
      if (resource.endsWith('.js')) {
        link.as = 'script'
      } else if (resource.endsWith('.css')) {
        link.as = 'style'
      } else if (resource.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
        link.as = 'image'
      }
      
      document.head.appendChild(link)
    })
  },

  // Prefetch next page resources
  prefetchPage(pageName: string) {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = `/pages/${pageName}`
    document.head.appendChild(link)
  }
}

// Create singleton instances
export const performanceMonitor = new PerformanceMonitor()
export const imageOptimizer = new ImageOptimizer()
export const memoryManager = new MemoryManager()

// Utility functions
export const createDebouncedFunction = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  return debounce(func, delay) as T
}

export const createThrottledFunction = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  return throttle(func, delay) as T
}

// Performance measurement decorator
export function measurePerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value
  
  descriptor.value = function (...args: any[]) {
    const start = performance.now()
    const result = method.apply(this, args)
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now()
        performanceMonitor.recordMetric(`${target.constructor.name}.${propertyName}`, end - start)
      })
    } else {
      const end = performance.now()
      performanceMonitor.recordMetric(`${target.constructor.name}.${propertyName}`, end - start)
      return result
    }
  }
  
  return descriptor
}

// Cleanup function
export function cleanup() {
  performanceMonitor.disconnect()
  memoryManager.clear()
  imageOptimizer.clearCache()
}