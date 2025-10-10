#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('⚡ Creating performance optimization utilities...\n');

// Performance monitoring hook
const performanceHookContent = `'use client'

import { useEffect, useState, useCallback } from 'react';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  connectionType?: string;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const measurePerformance = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;

        let memoryUsage;
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        }

        let connectionType;
        if ('connection' in navigator) {
          connectionType = (navigator as any).connection.effectiveType;
        }

        setMetrics({
          loadTime,
          renderTime,
          memoryUsage,
          connectionType
        });
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  return metrics;
};

// Lazy loading hook
export const useLazyLoad = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  const ref = useCallback((node: Element | null) => {
    if (node) setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [element, threshold]);

  return { ref, isVisible };
};

// Image optimization hook
export const useOptimizedImage = (src: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
} = {}) => {
  const [optimizedSrc, setOptimizedSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setIsLoading(false);
      setError(null);
    };
    
    img.onerror = () => {
      setIsLoading(false);
      setError('Failed to load image');
    };

    // Build optimized URL (assuming image optimization service)
    const params = new URLSearchParams();
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);

    const optimized = params.toString() ? \`\${src}?\${params.toString()}\` : src;
    setOptimizedSrc(optimized);
    img.src = optimized;
  }, [src, options.width, options.height, options.quality, options.format]);

  return { src: optimizedSrc, isLoading, error };
};`;

// Caching utilities
const cachingUtilsContent = `// Cache management utilities
export class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, data: any, ttl = 300000) { // 5 minutes default
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    this.cache.forEach(entry => {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      } else {
        valid++;
      }
    });

    return { total: this.cache.size, valid, expired };
  }
}

// Global cache instance
export const globalCache = new CacheManager(200);

// API response caching
export const withCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300000
): Promise<T> => {
  const cached = globalCache.get(key);
  if (cached) {
    return Promise.resolve(cached);
  }

  return fetcher().then(data => {
    globalCache.set(key, data, ttl);
    return data;
  });
};

// Local storage with expiration
export const localStorageCache = {
  set(key: string, data: any, ttl = 86400000) { // 24 hours default
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get(key: string): any | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      // Check if expired
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed.data;
    } catch {
      return null;
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  }
};`;

// Code splitting utilities
const codeSplittingContent = `import { lazy, Suspense, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

// Dynamic import with error boundary
export const lazyWithRetry = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback: React.ComponentType = LoadingSpinner
) => {
  const LazyComponent = lazy(() =>
    importFunc().catch(error => {
      console.error('Failed to load component:', error);
      // Retry once after 1 second
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(importFunc());
        }, 1000);
      });
    })
  );

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={<fallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Preload component
export const preloadComponent = (importFunc: () => Promise<any>) => {
  const componentImport = importFunc();
  return componentImport;
};

// Route-based code splitting
export const createAsyncRoute = (
  importFunc: () => Promise<{ default: ComponentType<any> }>
) => {
  return lazyWithRetry(importFunc);
};

// Bundle analyzer helper
export const bundleAnalyzer = {
  logBundleSize: () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const entries = performance.getEntriesByType('resource');
      const jsFiles = entries.filter(entry => 
        entry.name.includes('.js') && !entry.name.includes('node_modules')
      );
      
      console.group('Bundle Analysis');
      jsFiles.forEach(file => {
        console.log(\`\${file.name}: \${(file.transferSize / 1024).toFixed(2)}KB\`);
      });
      console.groupEnd();
    }
  },

  measureComponentRender: (componentName: string) => {
    return (WrappedComponent: ComponentType<any>) => {
      return (props: any) => {
        const startTime = performance.now();
        
        React.useEffect(() => {
          const endTime = performance.now();
          console.log(\`\${componentName} render time: \${(endTime - startTime).toFixed(2)}ms\`);
        });

        return <WrappedComponent {...props} />;
      };
    };
  }
};`;

// Performance optimization components
const performanceComponentsContent = `import React, { memo, useMemo, useCallback } from 'react';
import { useLazyLoad, useOptimizedImage } from '@/hooks/use-performance';

// Optimized image component
export const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  className?: string;
  lazy?: boolean;
}> = memo(({ src, alt, width, height, quality = 80, className = '', lazy = true }) => {
  const { ref, isVisible } = useLazyLoad();
  const { src: optimizedSrc, isLoading, error } = useOptimizedImage(
    src,
    { width, height, quality, format: 'webp' }
  );

  if (lazy && !isVisible) {
    return (
      <div
        ref={ref}
        className={\`bg-gray-200 animate-pulse \${className}\`}
        style={{ width, height }}
      />
    );
  }

  if (error) {
    return (
      <div className={\`bg-gray-200 flex items-center justify-center \${className}\`}>
        <span className="text-gray-500 text-sm">Failed to load</span>
      </div>
    );
  }

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={\`\${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity \${className}\`}
      loading={lazy ? 'lazy' : 'eager'}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Virtual list component for large datasets
export const VirtualList: React.FC<{
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
}> = memo(({ items, itemHeight, containerHeight, renderItem, overscan = 5 }) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';

// Debounced input component
export const DebouncedInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  delay?: number;
  placeholder?: string;
  className?: string;
}> = memo(({ value, onChange, delay = 300, placeholder, className = '' }) => {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, delay]);

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={placeholder}
      className={\`border rounded px-3 py-2 \${className}\`}
    />
  );
});

DebouncedInput.displayName = 'DebouncedInput';`;

// Create directories
const hooksDir = path.join(__dirname, 'frontend/src/hooks');
const utilsDir = path.join(__dirname, 'frontend/src/utils');
const componentsDir = path.join(__dirname, 'frontend/src/components/ui');

[hooksDir, utilsDir, componentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Write files
fs.writeFileSync(path.join(hooksDir, 'use-performance.ts'), performanceHookContent);
fs.writeFileSync(path.join(utilsDir, 'cache.ts'), cachingUtilsContent);
fs.writeFileSync(path.join(utilsDir, 'code-splitting.tsx'), codeSplittingContent);
fs.writeFileSync(path.join(componentsDir, 'performance.tsx'), performanceComponentsContent);

console.log('✅ Created performance monitoring hooks');
console.log('✅ Created caching utilities');
console.log('✅ Created code splitting utilities');
console.log('✅ Created optimized components');
console.log('\n🎉 Performance optimization implemented!');