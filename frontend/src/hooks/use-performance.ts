'use client'

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

    const optimized = params.toString() ? `${src}?${params.toString()}` : src;
    setOptimizedSrc(optimized);
    img.src = optimized;
  }, [src, options.width, options.height, options.quality, options.format]);

  return { src: optimizedSrc, isLoading, error };
};