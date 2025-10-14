'use client'

import React from 'react'

interface LoadingSkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
  lines?: number
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded'
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full'
      case 'rectangular':
        return 'rounded-md'
      case 'text':
      default:
        return 'rounded'
    }
  }

  const getDefaultSize = () => {
    switch (variant) {
      case 'circular':
        return { width: '40px', height: '40px' }
      case 'rectangular':
        return { width: '100%', height: '200px' }
      case 'text':
      default:
        return { width: '100%', height: '1rem' }
    }
  }

  const defaultSize = getDefaultSize()
  const style = {
    width: width || defaultSize.width,
    height: height || defaultSize.height
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} ${index < lines - 1 ? 'mb-2' : ''}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={style}
    />
  )
}

// Pre-built skeleton components for common use cases
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => (
  <div className="space-y-4">
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, index) => (
        <LoadingSkeleton key={`header-${index}`} height="20px" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <LoadingSkeleton key={`cell-${rowIndex}-${colIndex}`} height="16px" />
        ))}
      </div>
    ))}
  </div>
)

export const CardSkeleton: React.FC<{ showAvatar?: boolean }> = ({ showAvatar = false }) => (
  <div className="p-6 space-y-4">
    {showAvatar && (
      <div className="flex items-center space-x-4">
        <LoadingSkeleton variant="circular" width="48px" height="48px" />
        <div className="flex-1">
          <LoadingSkeleton height="20px" width="60%" />
          <LoadingSkeleton height="16px" width="40%" className="mt-2" />
        </div>
      </div>
    )}
    <LoadingSkeleton lines={3} />
    <div className="flex space-x-2">
      <LoadingSkeleton height="32px" width="80px" />
      <LoadingSkeleton height="32px" width="80px" />
    </div>
  </div>
)

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="bg-gray-100 rounded-lg p-6">
      <LoadingSkeleton height="32px" width="300px" />
      <LoadingSkeleton height="20px" width="400px" className="mt-2" />
    </div>
    
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <LoadingSkeleton height="16px" width="80%" />
              <LoadingSkeleton height="24px" width="60%" className="mt-2" />
              <LoadingSkeleton height="14px" width="50%" className="mt-2" />
            </div>
            <LoadingSkeleton variant="circular" width="48px" height="48px" />
          </div>
        </div>
      ))}
    </div>
    
    {/* Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <LoadingSkeleton height="24px" width="200px" />
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <LoadingSkeleton variant="circular" width="32px" height="32px" />
                  <div className="flex-1">
                    <LoadingSkeleton height="16px" width="70%" />
                    <LoadingSkeleton height="14px" width="50%" className="mt-1" />
                  </div>
                  <LoadingSkeleton height="20px" width="80px" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <LoadingSkeleton height="24px" width="150px" />
          </div>
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <LoadingSkeleton variant="circular" width="20px" height="20px" />
                  <LoadingSkeleton height="16px" width="80%" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default LoadingSkeleton