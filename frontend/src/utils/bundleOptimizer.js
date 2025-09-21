/**
 * Bundle Optimizer - Frontend Performance Utilities
 * Optimizes bundle size, lazy loading, and asset management
 */

// Dynamic import utility with error handling
export const dynamicImport = async (importFn, fallback = null) => {
  try {
    const module = await importFn();
    return module.default || module;
  } catch (error) {
    console.error('Dynamic import failed:', error);
    return fallback;
  }
};

// Preload critical resources
export const preloadResource = (href, as = 'script', crossorigin = null) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (crossorigin) link.crossOrigin = crossorigin;
  document.head.appendChild(link);
};

// Prefetch non-critical resources
export const prefetchResource = (href) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

// Image optimization utility
export const optimizeImage = (src, options = {}) => {
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    lazy = true
  } = options;
  
  // Create optimized image URL (for services like Cloudinary, ImageKit)
  let optimizedSrc = src;
  
  // Add lazy loading
  const img = new Image();
  if (lazy) {
    img.loading = 'lazy';
  }
  
  img.decoding = 'async';
  img.src = optimizedSrc;
  
  return img;
};

// Service Worker registration for caching
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
      return registration;
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  }
};

// Bundle size analyzer
export const analyzeBundleSize = () => {
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  const analysis = {
    scripts: scripts.map(script => ({
      src: script.src,
      async: script.async,
      defer: script.defer
    })),
    styles: styles.map(style => ({
      href: style.href,
      media: style.media
    })),
    totalScripts: scripts.length,
    totalStyles: styles.length
  };
  
  console.table(analysis.scripts);
  return analysis;
};

// Performance observer for monitoring
export const observePerformance = () => {
  if ('PerformanceObserver' in window) {
    // Observe largest contentful paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // Observe first input delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    
    // Observe cumulative layout shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log('CLS:', clsValue);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }
};

// Memory usage monitor
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = performance.memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }
  return null;
};

// Critical CSS inliner
export const inlineCriticalCSS = (css) => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
};

// Font loading optimization
export const optimizeFontLoading = (fontFamilies) => {
  fontFamilies.forEach(family => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = `/fonts/${family}.woff2`;
    document.head.appendChild(link);
  });
};

// Resource hints for third-party domains
export const addResourceHints = (domains) => {
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
};

// Intersection Observer for lazy loading
export const createLazyLoader = (selector, callback) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '50px'
  });
  
  document.querySelectorAll(selector).forEach(el => {
    observer.observe(el);
  });
  
  return observer;
};

// Bundle splitting recommendations
export const getBundleSplittingRecommendations = () => {
  return {
    vendor: ['react', 'react-dom', 'react-router-dom'],
    ui: ['framer-motion', '@heroicons/react'],
    utils: ['axios', 'react-hot-toast'],
    charts: ['recharts', 'chart.js'], // if used
    async: ['components that are rarely used']
  };
};

// Performance budget checker
export const checkPerformanceBudget = (budgets) => {
  const navigation = performance.getEntriesByType('navigation')[0];
  const results = {};
  
  Object.entries(budgets).forEach(([metric, budget]) => {
    let actual;
    switch (metric) {
      case 'loadTime':
        actual = navigation.loadEventEnd - navigation.fetchStart;
        break;
      case 'domContentLoaded':
        actual = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        break;
      case 'firstPaint':
        const fp = performance.getEntriesByName('first-paint')[0];
        actual = fp ? fp.startTime : 0;
        break;
      default:
        actual = 0;
    }
    
    results[metric] = {
      budget,
      actual,
      passed: actual <= budget,
      difference: actual - budget
    };
  });
  
  return results;
};

// Tree shaking analyzer
export const analyzeTreeShaking = () => {
  const unusedExports = [];
  
  // This would need to be implemented with build tools
  // For now, return recommendations
  return {
    recommendations: [
      'Use named imports instead of default imports',
      'Avoid importing entire libraries',
      'Use babel-plugin-import for selective imports',
      'Enable sideEffects: false in package.json'
    ],
    unusedExports
  };
};

export default {
  dynamicImport,
  preloadResource,
  prefetchResource,
  optimizeImage,
  registerServiceWorker,
  analyzeBundleSize,
  observePerformance,
  monitorMemoryUsage,
  inlineCriticalCSS,
  optimizeFontLoading,
  addResourceHints,
  createLazyLoader,
  getBundleSplittingRecommendations,
  checkPerformanceBudget,
  analyzeTreeShaking
};
