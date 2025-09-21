// Memory optimization utilities
export class MemoryOptimizer {
  static instance = null;
  
  constructor() {
    if (MemoryOptimizer.instance) {
      return MemoryOptimizer.instance;
    }
    
    this.cache = new Map();
    this.maxCacheSize = 50; // Limit cache size
    this.cleanupInterval = null;
    
    MemoryOptimizer.instance = this;
    this.startCleanup();
  }

  // Memoization with size limit
  memoize(fn, key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const result = fn();
    
    // Limit cache size
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
    return result;
  }

  // Clear cache periodically
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cache.clear();
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
    }, 300000); // Every 5 minutes
  }

  // Manual cleanup
  cleanup() {
    this.cache.clear();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  // Memory-efficient array operations
  static chunkArray(array, size = 100) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Debounced function with cleanup
  static debounce(func, wait) {
    let timeout;
    const debounced = function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
    
    debounced.cancel = () => {
      clearTimeout(timeout);
    };
    
    return debounced;
  }

  // Throttled function with cleanup
  static throttle(func, limit) {
    let inThrottle;
    const throttled = function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
    
    return throttled;
  }

  // Image optimization
  static optimizeImage(src, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const optimizedSrc = canvas.toDataURL('image/jpeg', quality);
        
        // Cleanup
        canvas.remove();
        resolve(optimizedSrc);
      };
      img.src = src;
    });
  }

  // Virtual scrolling helper
  static getVisibleItems(items, scrollTop, itemHeight, containerHeight) {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 2,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex)
    };
  }

  // Memory usage monitor
  static getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }

  // Component cleanup helper
  static createCleanupHook() {
    const cleanupFunctions = [];
    
    const addCleanup = (fn) => {
      cleanupFunctions.push(fn);
    };
    
    const cleanup = () => {
      cleanupFunctions.forEach(fn => {
        try {
          fn();
        } catch (error) {
          console.warn('Cleanup function failed:', error);
        }
      });
      cleanupFunctions.length = 0;
    };
    
    return { addCleanup, cleanup };
  }
}

// React hook for memory optimization
export const useMemoryOptimizer = () => {
  const optimizer = new MemoryOptimizer();
  
  const { addCleanup, cleanup } = MemoryOptimizer.createCleanupHook();
  
  // Cleanup on unmount
  React.useEffect(() => {
    return cleanup;
  }, []);
  
  return {
    memoize: optimizer.memoize.bind(optimizer),
    addCleanup,
    getMemoryUsage: MemoryOptimizer.getMemoryUsage,
    debounce: MemoryOptimizer.debounce,
    throttle: MemoryOptimizer.throttle
  };
};

// Export singleton instance
export default new MemoryOptimizer();
