import { lazy, ComponentType, LazyExoticComponent } from 'react'

// Utility for creating lazy components with better error handling
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await importFn()
    } catch (error) {
      console.error('Failed to load component:', error)
      // Return fallback component if available
      if (fallback) {
        return { default: fallback as T }
      }
      throw error
    }
  })
}

// Lazy load heavy dashboard components
export const LazyDashboard = createLazyComponent(
  () => import('@/app/dashboard/page'),
  () => <div className="p-4">Loading Dashboard...</div> as any
)

export const LazyGoogleMaps = createLazyComponent(
  () => import('@react-google-maps/api').then(module => ({ default: module.GoogleMap })),
  () => <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">Loading Map...</div> as any
)

export const LazyCharts = createLazyComponent(
  () => import('recharts').then(module => ({ default: module.ResponsiveContainer })),
  () => <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">Loading Chart...</div> as any
)

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload dashboard after login
  setTimeout(() => {
    import('@/app/dashboard/page')
  }, 1000)
  
  // Preload common components
  setTimeout(() => {
    import('@/components/ui/Button')
    import('@/components/ui/Input')
  }, 500)
}