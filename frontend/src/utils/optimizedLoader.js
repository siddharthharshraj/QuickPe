import { lazy, Suspense, memo, useState, useEffect, useMemo } from 'react';

// Optimized lazy loading with preloading
export const createOptimizedLazy = (importFunc, fallback = null) => {
  const LazyComponent = lazy(importFunc);
  
  // Preload the component
  LazyComponent.preload = importFunc;
  
  return memo((props) => (
    <Suspense fallback={fallback || <ComponentSkeleton />}>
      <LazyComponent {...props} />
    </Suspense>
  ));
};

// Lightweight skeleton component
const ComponentSkeleton = memo(() => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
));

// Optimized image component with lazy loading
export const OptimizedImage = memo(({ src, alt, className, ...props }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      {...props}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  );
});

// Debounced search hook
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized API call hook
export const useMemoizedAPI = (apiCall, dependencies = []) => {
  return useMemo(() => apiCall, dependencies);
};

// Virtual scrolling for large lists
export const VirtualizedList = memo(({ items, renderItem, itemHeight = 50, containerHeight = 400 }) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 1, items.length);
  const visibleItems = items.slice(startIndex, endIndex);
  
  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
});

export default {
  createOptimizedLazy,
  OptimizedImage,
  useDebounce,
  useMemoizedAPI,
  VirtualizedList
};
