import React, { memo, useMemo, useCallback } from 'react';
import { useState } from 'react';
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
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
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
      className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity ${className}`}
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
      className={`border rounded px-3 py-2 ${className}`}
    />
  );
});

DebouncedInput.displayName = 'DebouncedInput';