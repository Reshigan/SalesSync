import React, { Suspense, ComponentType, lazy } from 'react'
import LoadingSpinner from './LoadingSpinner'
import ErrorBoundary from './ErrorBoundary'

interface LazyLoaderProps {
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
}

// Higher-order component for lazy loading with error boundary
export function withLazyLoading(
  importFunc: () => Promise<{ default: ComponentType<any> }>,
  options: LazyLoaderProps = {}
) {
  const LazyComponent = lazy(importFunc)
  
  const WrappedComponent = (props: any) => {
    const fallback = options.fallback || (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
      </div>
    )

    const errorFallback = options.errorFallback || (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load component
          </h3>
          <p className="text-gray-600 mb-4">
            There was an error loading this component. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )

    return (
      <ErrorBoundary fallback={errorFallback}>
        <Suspense fallback={fallback}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    )
  }
  
  WrappedComponent.displayName = 'LazyLoadedComponent'
  
  return WrappedComponent
}

// Preload function for better UX
export function preloadComponent(
  importFunc: () => Promise<{ default: ComponentType<any> }>
) {
  return importFunc()
}

// Hook for preloading components on hover or focus
export function usePreloadComponent(
  importFunc: () => Promise<{ default: ComponentType<any> }>
) {
  const preload = React.useCallback(() => {
    preloadComponent(importFunc)
  }, [importFunc])

  return preload
}

// Component for lazy loading with custom loading states
interface LazyWrapperProps {
  children: React.ReactNode
  loading?: boolean
  error?: Error | null
  retry?: () => void
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  loading = false,
  error = null,
  retry,
  loadingComponent,
  errorComponent
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        {loadingComponent || <LoadingSpinner size="md" />}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        {errorComponent || (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-600 mb-4">
              {error.message || 'An unexpected error occurred'}
            </p>
            {retry && (
              <button
                onClick={retry}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return <>{children}</>
}

// Skeleton loader for better perceived performance
export const SkeletonLoader: React.FC<{ 
  lines?: number
  height?: string
  className?: string
}> = ({ 
  lines = 3, 
  height = 'h-4',
  className = ''
}) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${height} ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  )
}

// Card skeleton for loading states
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  )
}

// Table skeleton for loading states
export const TableSkeleton: React.FC<{ 
  rows?: number
  columns?: number
  className?: string
}> = ({ 
  rows = 5, 
  columns = 4,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b border-gray-200 last:border-b-0">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LazyWrapper