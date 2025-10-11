import React, { useEffect, lazy, Suspense, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

// Dynamic import with error boundary
export const lazyWithRetry = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback: ComponentType = LoadingSpinner
) => {
  const LazyComponent = lazy(async () => {
    try {
      return await importFunc();
    } catch (error) {
      console.error('Failed to load component:', error);
      // Retry once after 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        return await importFunc();
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        // Return fallback component
        return { default: fallback as T };
      }
    }
  });

  const FallbackComponent = fallback;
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={<FallbackComponent />}>
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
        const resourceEntry = file as PerformanceResourceTiming;
        console.log(`${file.name}: ${(resourceEntry.transferSize / 1024).toFixed(2)}KB`);
      });
      console.groupEnd();
    }
  },

  measureComponentRender: (componentName: string) => {
    return (WrappedComponent: ComponentType<any>) => {
      return (props: any) => {
        const startTime = performance.now();
        
        useEffect(() => {
          const endTime = performance.now();
          console.log(`${componentName} render time: ${(endTime - startTime).toFixed(2)}ms`);
        });

        return <WrappedComponent {...props} />;
      };
    };
  }
};