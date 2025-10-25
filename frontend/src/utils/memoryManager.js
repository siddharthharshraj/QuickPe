// Aggressive Memory Manager for QuickPe
class MemoryManager {
  constructor() {
    this.timers = new Set();
    this.intervals = new Set();
    this.eventListeners = new Map();
    this.components = new WeakMap();
    this.cache = new Map(); // Cache storage
    this.maxTimers = 10; // Limit concurrent timers
    this.maxIntervals = 5; // Limit concurrent intervals
    this.maxCacheSize = 50; // Limit cache entries
  }

  // Managed setTimeout with automatic cleanup
  setTimeout(callback, delay, component = null) {
    if (this.timers.size >= this.maxTimers) {
      console.warn('⚠️ Too many timers, clearing oldest');
      this.clearOldestTimer();
    }

    const timerId = setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);

    this.timers.add(timerId);
    
    if (component) {
      this.trackComponent(component, 'timer', timerId);
    }

    return timerId;
  }

  // Managed setInterval with automatic cleanup
  setInterval(callback, delay, component = null) {
    if (this.intervals.size >= this.maxIntervals) {
      console.warn('⚠️ Too many intervals, clearing oldest');
      this.clearOldestInterval();
    }

    const intervalId = setInterval(callback, delay);
    this.intervals.add(intervalId);
    
    if (component) {
      this.trackComponent(component, 'interval', intervalId);
    }

    return intervalId;
  }

  // Clear specific timer
  clearTimeout(timerId) {
    clearTimeout(timerId);
    this.timers.delete(timerId);
  }

  // Clear specific interval
  clearInterval(intervalId) {
    clearInterval(intervalId);
    this.intervals.delete(intervalId);
  }

  // Track component resources
  trackComponent(component, type, id) {
    if (!this.components.has(component)) {
      this.components.set(component, { timers: [], intervals: [], listeners: [] });
    }
    this.components.get(component)[type + 's'].push(id);
  }

  // Cleanup component resources
  cleanupComponent(component) {
    const resources = this.components.get(component);
    if (resources) {
      resources.timers.forEach(id => this.clearTimeout(id));
      resources.intervals.forEach(id => this.clearInterval(id));
      resources.listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.components.delete(component);
    }
  }

  // Clear oldest timer
  clearOldestTimer() {
    const oldest = this.timers.values().next().value;
    if (oldest) {
      this.clearTimeout(oldest);
    }
  }

  // Clear oldest interval
  clearOldestInterval() {
    const oldest = this.intervals.values().next().value;
    if (oldest) {
      this.clearInterval(oldest);
    }
  }

  // Emergency cleanup - clear all resources
  emergencyCleanup() {
    console.warn('🚨 Emergency memory cleanup initiated');
    
    // Clear all timers
    this.timers.forEach(id => clearTimeout(id));
    this.timers.clear();
    
    // Clear all intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();
    
    // Clear event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners.clear();

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  // Memory usage monitoring
  getMemoryUsage() {
    if (performance.memory) {
      const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
      const total = Math.round(performance.memory.totalJSHeapSize / 1048576);
      const limit = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
      
      return { used, total, limit };
    }
    return null;
  }

  // Auto cleanup when memory is high
  autoCleanup() {
    const memory = this.getMemoryUsage();
    if (memory && memory.used > 100) { // If over 100MB
      console.warn(`🧹 Auto cleanup triggered - Memory: ${memory.used}MB`);
      
      // Clear half of the timers and intervals
      const timersToKeep = Math.floor(this.timers.size / 2);
      const intervalsToKeep = Math.floor(this.intervals.size / 2);
      
      let cleared = 0;
      for (const timerId of this.timers) {
        if (cleared >= timersToKeep) break;
        this.clearTimeout(timerId);
        cleared++;
      }
      
      cleared = 0;
      for (const intervalId of this.intervals) {
        if (cleared >= intervalsToKeep) break;
        this.clearInterval(intervalId);
        cleared++;
      }
    }
  }

  // Get resource counts
  getResourceCounts() {
    return {
      timers: this.timers.size,
      intervals: this.intervals.size,
      listeners: this.eventListeners.size,
      cache: this.cache.size
    };
  }

  // Cache management
  setCache(key, value, ttl = 300000) { // Default 5 minutes TTL
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest cache entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  clearCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  getCacheSize() {
    return this.cache.size;
  }
}

// Create singleton instance
const memoryManager = new MemoryManager();

// Disabled auto cleanup to prevent page refreshes
// memoryManager.setInterval(() => {
//   memoryManager.autoCleanup();
// }, 30000);

// Simple memory manager hook
export const useMemoryManager = (component) => {
  return {
    setTimeout: (callback, delay) => memoryManager.setTimeout(callback, delay, component),
    setInterval: (callback, delay) => memoryManager.setInterval(callback, delay, component),
    clearTimeout: (id) => memoryManager.clearTimeout(id),
    clearInterval: (id) => memoryManager.clearInterval(id),
    cleanup: () => memoryManager.cleanupComponent(component),
    getMemoryUsage: () => memoryManager.getMemoryUsage(),
    getResourceCounts: () => memoryManager.getResourceCounts()
  };
};

// Global cleanup function
window.emergencyMemoryCleanup = () => memoryManager.emergencyCleanup();

export default memoryManager;
