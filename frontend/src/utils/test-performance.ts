// Performance Testing Utilities - Team X2 Quality Assurance
import { performance } from 'perf_hooks'

export interface PerformanceMetrics {
  name: string
  duration: number
  memory?: number
  timestamp: number
  metadata?: Record<string, any>
}

export class PerformanceTester {
  private metrics: PerformanceMetrics[] = []
  private thresholds: Map<string, number> = new Map()

  constructor() {
    this.setupDefaultThresholds()
  }

  private setupDefaultThresholds() {
    // Performance thresholds in milliseconds
    this.thresholds.set('api.response', 1000) // API responses should be under 1s
    this.thresholds.set('component.render', 16) // Component renders should be under 16ms (60fps)
    this.thresholds.set('page.load', 3000) // Page loads should be under 3s
    this.thresholds.set('search.query', 500) // Search queries should be under 500ms
    this.thresholds.set('form.submit', 2000) // Form submissions should be under 2s
    this.thresholds.set('image.load', 1500) // Image loads should be under 1.5s
    this.thresholds.set('cache.hit', 10) // Cache hits should be under 10ms
  }

  // Measure function execution time
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const startMemory = this.getMemoryUsage()
    
    try {
      const result = await fn()
      const end = performance.now()
      const endMemory = this.getMemoryUsage()
      
      this.recordMetric({
        name,
        duration: end - start,
        memory: endMemory - startMemory,
        timestamp: Date.now()
      })
      
      return result
    } catch (error) {
      const end = performance.now()
      this.recordMetric({
        name: `${name}.error`,
        duration: end - start,
        timestamp: Date.now(),
        metadata: { error: error.message }
      })
      throw error
    }
  }

  measureSync<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const startMemory = this.getMemoryUsage()
    
    try {
      const result = fn()
      const end = performance.now()
      const endMemory = this.getMemoryUsage()
      
      this.recordMetric({
        name,
        duration: end - start,
        memory: endMemory - startMemory,
        timestamp: Date.now()
      })
      
      return result
    } catch (error) {
      const end = performance.now()
      this.recordMetric({
        name: `${name}.error`,
        duration: end - start,
        timestamp: Date.now(),
        metadata: { error: error.message }
      })
      throw error
    }
  }

  // Record custom metric
  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric)
    
    // Check against thresholds
    const threshold = this.thresholds.get(metric.name)
    if (threshold && metric.duration > threshold) {
      console.warn(`Performance threshold exceeded for ${metric.name}: ${metric.duration}ms > ${threshold}ms`)
    }
  }

  // Get memory usage (Node.js only)
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return 0
  }

  // Analyze metrics
  getMetrics(name?: string): PerformanceMetrics[] {
    if (name) {
      return this.metrics.filter(m => m.name === name || m.name.startsWith(name))
    }
    return [...this.metrics]
  }

  getAverageTime(name: string): number {
    const metrics = this.getMetrics(name)
    if (metrics.length === 0) return 0
    
    const total = metrics.reduce((sum, m) => sum + m.duration, 0)
    return total / metrics.length
  }

  getPercentile(name: string, percentile: number): number {
    const metrics = this.getMetrics(name).sort((a, b) => a.duration - b.duration)
    if (metrics.length === 0) return 0
    
    const index = Math.ceil((percentile / 100) * metrics.length) - 1
    return metrics[index]?.duration || 0
  }

  // Performance report
  generateReport(): {
    summary: Record<string, any>
    violations: Array<{ name: string; duration: number; threshold: number }>
    recommendations: string[]
  } {
    const summary: Record<string, any> = {}
    const violations: Array<{ name: string; duration: number; threshold: number }> = []
    const recommendations: string[] = []

    // Group metrics by name
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = []
      }
      acc[metric.name].push(metric)
      return acc
    }, {} as Record<string, PerformanceMetrics[]>)

    // Analyze each group
    Object.entries(grouped).forEach(([name, metrics]) => {
      const durations = metrics.map(m => m.duration)
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length
      const min = Math.min(...durations)
      const max = Math.max(...durations)
      const p95 = this.getPercentile(name, 95)
      
      summary[name] = {
        count: metrics.length,
        average: Math.round(avg * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        p95: Math.round(p95 * 100) / 100
      }

      // Check violations
      const threshold = this.thresholds.get(name)
      if (threshold && avg > threshold) {
        violations.push({ name, duration: avg, threshold })
      }

      // Generate recommendations
      if (avg > 1000) {
        recommendations.push(`Consider optimizing ${name} - average time is ${avg.toFixed(2)}ms`)
      }
      if (max > avg * 3) {
        recommendations.push(`${name} has inconsistent performance - max time is ${max.toFixed(2)}ms vs average ${avg.toFixed(2)}ms`)
      }
    })

    return { summary, violations, recommendations }
  }

  // Clear metrics
  clear() {
    this.metrics = []
  }

  // Set custom threshold
  setThreshold(name: string, threshold: number) {
    this.thresholds.set(name, threshold)
  }
}

// Load testing utilities
export class LoadTester {
  private results: Array<{
    concurrency: number
    duration: number
    successRate: number
    averageResponseTime: number
    errors: string[]
  }> = []

  async runLoadTest(
    testFn: () => Promise<any>,
    options: {
      concurrency: number
      duration: number // in seconds
      rampUp?: number // in seconds
    }
  ): Promise<void> {
    const { concurrency, duration, rampUp = 0 } = options
    const startTime = Date.now()
    const endTime = startTime + (duration * 1000)
    
    const results: Array<{ success: boolean; duration: number; error?: string }> = []
    const workers: Promise<void>[] = []

    // Create workers
    for (let i = 0; i < concurrency; i++) {
      const delay = rampUp > 0 ? (i / concurrency) * rampUp * 1000 : 0
      
      workers.push(
        new Promise<void>(async (resolve) => {
          if (delay > 0) {
            await new Promise(r => setTimeout(r, delay))
          }

          while (Date.now() < endTime) {
            const requestStart = performance.now()
            
            try {
              await testFn()
              results.push({
                success: true,
                duration: performance.now() - requestStart
              })
            } catch (error) {
              results.push({
                success: false,
                duration: performance.now() - requestStart,
                error: error.message
              })
            }

            // Small delay to prevent overwhelming
            await new Promise(r => setTimeout(r, 10))
          }
          
          resolve()
        })
      )
    }

    // Wait for all workers to complete
    await Promise.all(workers)

    // Analyze results
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    const successRate = (successful.length / results.length) * 100
    const averageResponseTime = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length

    this.results.push({
      concurrency,
      duration,
      successRate,
      averageResponseTime,
      errors: failed.map(f => f.error || 'Unknown error')
    })

    console.log(`Load test completed:`)
    console.log(`- Concurrency: ${concurrency}`)
    console.log(`- Duration: ${duration}s`)
    console.log(`- Total requests: ${results.length}`)
    console.log(`- Success rate: ${successRate.toFixed(2)}%`)
    console.log(`- Average response time: ${averageResponseTime.toFixed(2)}ms`)
    console.log(`- Errors: ${failed.length}`)
  }

  getResults() {
    return [...this.results]
  }

  clear() {
    this.results = []
  }
}

// Memory leak detector
export class MemoryLeakDetector {
  private snapshots: Array<{
    timestamp: number
    heapUsed: number
    heapTotal: number
    external: number
  }> = []

  takeSnapshot() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage()
      this.snapshots.push({
        timestamp: Date.now(),
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external
      })
    }
  }

  detectLeaks(): {
    hasLeak: boolean
    trend: 'increasing' | 'decreasing' | 'stable'
    growthRate: number // bytes per second
    recommendations: string[]
  } {
    if (this.snapshots.length < 3) {
      return {
        hasLeak: false,
        trend: 'stable',
        growthRate: 0,
        recommendations: ['Need more snapshots to detect leaks']
      }
    }

    const recent = this.snapshots.slice(-10) // Last 10 snapshots
    const first = recent[0]
    const last = recent[recent.length - 1]
    
    const timeDiff = (last.timestamp - first.timestamp) / 1000 // seconds
    const memoryDiff = last.heapUsed - first.heapUsed
    const growthRate = memoryDiff / timeDiff

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (growthRate > 1024) { // 1KB/s
      trend = 'increasing'
    } else if (growthRate < -1024) {
      trend = 'decreasing'
    }

    const hasLeak = trend === 'increasing' && growthRate > 10240 // 10KB/s

    const recommendations: string[] = []
    if (hasLeak) {
      recommendations.push('Potential memory leak detected')
      recommendations.push('Check for unclosed event listeners')
      recommendations.push('Verify proper cleanup in useEffect hooks')
      recommendations.push('Look for circular references')
    }

    return {
      hasLeak,
      trend,
      growthRate,
      recommendations
    }
  }

  clear() {
    this.snapshots = []
  }
}

// Component performance testing
export function withPerformanceTest<P extends object>(
  Component: React.ComponentType<P>,
  testName: string
): React.ComponentType<P> {
  return function PerformanceTestWrapper(props: P) {
    const performanceTester = new PerformanceTester()
    
    React.useEffect(() => {
      const start = performance.now()
      
      return () => {
        const end = performance.now()
        performanceTester.recordMetric({
          name: `component.${testName}.lifecycle`,
          duration: end - start,
          timestamp: Date.now()
        })
      }
    }, [])

    return React.createElement(Component, props)
  }
}

// API performance testing
export async function testApiPerformance(
  apiCall: () => Promise<any>,
  options: {
    iterations?: number
    timeout?: number
    expectedResponseTime?: number
  } = {}
): Promise<{
  averageTime: number
  minTime: number
  maxTime: number
  successRate: number
  errors: string[]
}> {
  const { iterations = 10, timeout = 5000, expectedResponseTime = 1000 } = options
  const results: Array<{ success: boolean; duration: number; error?: string }> = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeout)
      })
      
      await Promise.race([apiCall(), timeoutPromise])
      
      const duration = performance.now() - start
      results.push({ success: true, duration })
      
      if (duration > expectedResponseTime) {
        console.warn(`API call ${i + 1} exceeded expected response time: ${duration}ms > ${expectedResponseTime}ms`)
      }
    } catch (error) {
      results.push({
        success: false,
        duration: performance.now() - start,
        error: error.message
      })
    }
  }

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  const durations = successful.map(r => r.duration)
  const averageTime = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
  const minTime = durations.length > 0 ? Math.min(...durations) : 0
  const maxTime = durations.length > 0 ? Math.max(...durations) : 0
  const successRate = (successful.length / results.length) * 100

  return {
    averageTime,
    minTime,
    maxTime,
    successRate,
    errors: failed.map(f => f.error || 'Unknown error')
  }
}

// Create singleton instances
export const performanceTester = new PerformanceTester()
export const loadTester = new LoadTester()
export const memoryLeakDetector = new MemoryLeakDetector()

// Auto-start memory monitoring in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    memoryLeakDetector.takeSnapshot()
  }, 30000) // Every 30 seconds
}