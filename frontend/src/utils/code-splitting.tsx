import React, { lazy, Suspense, ComponentType } from 'react';
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
      return new Promise<{ default: T }>((resolve, reject) => {
        setTimeout(() => {
          importFunc().then(resolve).catch(reject);
        }, 1000);
      });
    })
  );

  return (props: React.ComponentProps<T>) => {
    const FallbackComponent = fallback;
    return (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
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
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsFiles = entries.filter(entry => 
        entry.name.includes('.js') && !entry.name.includes('node_modules')
      );
      
      console.group('Bundle Analysis');
      jsFiles.forEach(file => {
        console.log(`${file.name}: ${(file.transferSize / 1024).toFixed(2)}KB`);
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
          console.log(`${componentName} render time: ${(endTime - startTime).toFixed(2)}ms`);
        });

        return <WrappedComponent {...props} />;
      };
    };
  }
};