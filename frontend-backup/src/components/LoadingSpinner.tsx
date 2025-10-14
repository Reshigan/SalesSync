'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      {text && (
        <span className="text-gray-600 text-sm">{text}</span>
      )}
    </div>
  );
};

// Skeleton components for loading states
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-white rounded-lg shadow p-6 ${className}`}>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="animate-pulse bg-white rounded-lg shadow overflow-hidden">
    {/* Header */}
    <div className="bg-gray-50 px-6 py-3 border-b">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded flex-1"></div>
        ))}
      </div>
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="px-6 py-4 border-b border-gray-100">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div key={colIndex} className="h-3 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-white rounded-lg shadow p-6 ${className}`}>
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
    <div className="h-64 bg-gray-100 rounded flex items-end justify-between px-4 pb-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-200 rounded-t"
          style={{
            height: `${Math.random() * 80 + 20}%`,
            width: '12%'
          }}
        ></div>
      ))}
    </div>
  </div>
);

export const SkeletonStats: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="animate-pulse bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    ))}
  </div>
);

// Page loading component
export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">{text}</p>
    </div>
  </div>
);

// Button loading state
export const ButtonLoading: React.FC<{ 
  loading: boolean; 
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ loading, children, className = '', disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={`flex items-center justify-center gap-2 ${className} ${
      (disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </button>
);