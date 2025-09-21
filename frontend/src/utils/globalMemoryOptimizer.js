// Global Memory Optimizer for QuickPe
class GlobalMemoryOptimizer {
  constructor() {
    this.isOptimizing = false;
    this.originalConsole = { ...console };
    this.memoryThreshold = 300; // 300MB threshold (increased)
    this.checkInterval = 60000; // Check every 60 seconds (reduced frequency)
    
    this.init();
  }

  init() {
    // Disable console in production
    if (process.env.NODE_ENV === 'production') {
      this.disableConsole();
    }

    // Start memory monitoring
    this.startMemoryMonitoring();

    // Optimize React DevTools
    this.optimizeReactDevTools();

    // Optimize animations
    this.optimizeAnimations();

    // Clean up unused event listeners
    this.cleanupEventListeners();
  }

  disableConsole() {
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.warn = () => {};
  }

  startMemoryMonitoring() {
    setInterval(() => {
      this.checkMemoryUsage();
    }, this.checkInterval);
  }

  checkMemoryUsage() {
    if (performance.memory) {
      const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
      
      if (used > this.memoryThreshold && !this.isOptimizing) {
        console.warn(`🚨 High memory usage detected: ${used}MB`);
        this.emergencyOptimization();
      }
    }
  }

  emergencyOptimization() {
    this.isOptimizing = true;
    
    // Clear all timers and intervals
    this.clearAllTimers();
    
    // Force garbage collection
    this.forceGarbageCollection();
    
    // Clear caches
    this.clearCaches();
    
    // Optimize DOM
    this.optimizeDOM();
    
    setTimeout(() => {
      this.isOptimizing = false;
    }, 5000);
  }

  clearAllTimers() {
    // Don't clear all timers - this was causing page refreshes
    console.log('Skipping aggressive timer cleanup to prevent page refresh');
  }

  forceGarbageCollection() {
    if (window.gc) {
      window.gc();
    }
    
    // Manual memory cleanup
    if (window.performance && window.performance.memory) {
      // Force memory cleanup by creating and destroying objects
      for (let i = 0; i < 100; i++) {
        const temp = new Array(1000).fill(null);
        temp.length = 0;
      }
    }
  }

  clearCaches() {
    // Clear localStorage if too large
    try {
      const storageSize = JSON.stringify(localStorage).length;
      if (storageSize > 1000000) { // 1MB
        const keysToKeep = ['user', 'token', 'theme'];
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }

    // Clear sessionStorage
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear sessionStorage:', e);
    }
  }

  optimizeDOM() {
    // Remove unused DOM elements
    const unusedElements = document.querySelectorAll('[data-unused="true"]');
    unusedElements.forEach(el => el.remove());

    // Optimize images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.naturalWidth > 800) {
        img.style.maxWidth = '800px';
        img.style.height = 'auto';
      }
    });
  }

  optimizeReactDevTools() {
    // Disable React DevTools in production
    if (process.env.NODE_ENV === 'production') {
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = null;
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount = null;
      }
    }
  }

  optimizeAnimations() {
    // Reduce animation complexity on low-end devices
    const isLowEndDevice = navigator.hardwareConcurrency < 4 || 
                          (performance.memory && performance.memory.jsHeapSizeLimit < 1073741824);
    
    if (isLowEndDevice) {
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
      document.documentElement.style.setProperty('--transition-duration', '0.1s');
    }
  }

  cleanupEventListeners() {
    // Remove duplicate event listeners
    const events = ['scroll', 'resize', 'mousemove', 'touchmove'];
    events.forEach(eventType => {
      const listeners = this.getEventListeners(window, eventType);
      if (listeners && listeners.length > 5) {
        console.warn(`Too many ${eventType} listeners:`, listeners.length);
      }
    });
  }

  getEventListeners(element, eventType) {
    // This is a simplified version - in real implementation you'd need
    // to track listeners manually
    return [];
  }

  // Public API
  getMemoryStats() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      };
    }
    return null;
  }

  manualOptimize() {
    this.emergencyOptimization();
  }
}

// Create and initialize global optimizer
const globalOptimizer = new GlobalMemoryOptimizer();

// Expose to window for debugging
window.memoryOptimizer = globalOptimizer;

export default globalOptimizer;
