// Simple Memory Leak Detector (Non-intrusive)
class MemoryLeakDetector {
  constructor() {
    this.startTime = Date.now();
    this.memoryHistory = [];
    this.init();
  }

  init() {
    // Monitor memory every 30 seconds without overriding native functions
    setInterval(() => {
      this.checkForLeaks();
    }, 30000);
  }

  checkForLeaks() {
    const memoryInfo = this.getMemoryInfo();
    const uptime = Math.round((Date.now() - this.startTime) / 1000);

    if (memoryInfo) {
      this.memoryHistory.push({
        timestamp: Date.now(),
        memory: memoryInfo.used,
        uptime
      });

      // Keep only last 10 readings
      if (this.memoryHistory.length > 10) {
        this.memoryHistory.shift();
      }

      console.log('🔍 Memory Check:', {
        memory: `${memoryInfo.used}MB`,
        uptime: `${uptime}s`,
        trend: this.getMemoryTrend()
      });

      // Alert if memory is consistently high
      if (memoryInfo.used > 150) {
        console.warn('⚠️ High memory usage detected:', memoryInfo.used, 'MB');
        this.suggestOptimizations();
      }
    }
  }

  getMemoryTrend() {
    if (this.memoryHistory.length < 2) return 'stable';
    
    const recent = this.memoryHistory.slice(-3);
    const isIncreasing = recent.every((reading, i) => 
      i === 0 || reading.memory >= recent[i - 1].memory
    );
    
    return isIncreasing ? 'increasing' : 'stable';
  }

  suggestOptimizations() {
    console.log('💡 Memory Optimization Suggestions:');
    console.log('- Close unused browser tabs');
    console.log('- Refresh the page if memory usage is high');
    console.log('- Check for memory leaks in components');
  }

  getMemoryInfo() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      };
    }
    return null;
  }

  getStats() {
    return {
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      memory: this.getMemoryInfo(),
      memoryHistory: this.memoryHistory,
      trend: this.getMemoryTrend()
    };
  }

  cleanup() {
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
      console.log('🧹 Manual garbage collection triggered');
    }
    
    // Clear memory history
    this.memoryHistory = [];
  }
}

// Create detector instance
const detector = new MemoryLeakDetector();

// Expose to window for debugging
window.memoryLeakDetector = detector;

export default detector;
