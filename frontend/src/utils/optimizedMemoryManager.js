// Ultra-Optimized Memory Manager with Proper Data Structures
class OptimizedMemoryManager {
  constructor() {
    this.cache = new Map(); // LRU Cache for API responses
    this.maxCacheSize = 10; // Reduced cache size
    this.timers = new Set(); // Regular Set for timer IDs (primitives)
    this.intervals = new Set(); // Regular Set for interval IDs (primitives)
    this.eventListeners = new Map();
    this.observers = new WeakMap();

    // Memory pools for frequent allocations
    this.transactionPool = new Map();
    this.filterPool = new Map();

    // Efficient data structures
    this.sortedIndex = new Map(); // For O(1) lookups
    this.filterIndex = new Map(); // Pre-computed filter results
  }

  // Efficient LRU Cache with size limits
  setCache(key, value, maxAge = 300000) { // 5 minutes default
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry (LRU)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      maxAge
    });
  }

  getCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Efficient transaction storage using Map for O(1) access
  storeTransactions(transactions) {
    const transactionMap = new Map();
    const sortedArray = [...transactions].sort((a, b) =>
      new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)
    );

    // Create efficient lookup structures
    sortedArray.forEach((transaction, index) => {
      transactionMap.set(transaction._id || transaction.transactionId, {
        ...transaction,
        _sortedIndex: index
      });
    });

    this.transactionPool.set('current', transactionMap);
    this.sortedIndex.set('transactions', sortedArray);

    return transactionMap;
  }

  // Pre-computed filter results for O(1) filtering
  buildFilterIndex(transactions) {
    const filterIndex = new Map();

    // Build indexes for common filters
    filterIndex.set('all', transactions);
    filterIndex.set('credit', transactions.filter(t => t.type === 'credit'));
    filterIndex.set('debit', transactions.filter(t => t.type === 'debit'));

    // Date-based filters (computed once)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last3Days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    filterIndex.set('today', transactions.filter(t =>
      new Date(t.timestamp || t.createdAt) >= today
    ));
    filterIndex.set('last3', transactions.filter(t =>
      new Date(t.timestamp || t.createdAt) >= last3Days
    ));
    filterIndex.set('last30', transactions.filter(t =>
      new Date(t.timestamp || t.createdAt) >= last30Days
    ));

    this.filterIndex.set('base', filterIndex);
    return filterIndex;
  }

  // Ultra-fast combined filtering using pre-computed indexes
  applyFilters(transactions, searchTerm, typeFilter, dateFilter) {
    let result;

    // Start with date filter (most restrictive)
    if (dateFilter === 'all') {
      result = typeFilter === 'all' ? transactions :
               this.filterIndex.get('base').get(typeFilter) || [];
    } else {
      const dateFiltered = this.filterIndex.get('base').get(dateFilter) || [];
      result = typeFilter === 'all' ? dateFiltered :
               dateFiltered.filter(t => t.type === (typeFilter === 'received' ? 'credit' : 'debit'));
    }

    // Apply search filter if needed
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(transaction =>
        transaction.transactionId?.toLowerCase().includes(searchLower) ||
        transaction.otherUser?.name?.toLowerCase().includes(searchLower) ||
        transaction.description?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }

  // Memory-efficient timer management
  setTimeout(callback, delay) {
    const timerId = setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);

    this.timers.add(timerId);
    return timerId;
  }

  clearTimeout(timerId) {
    if (timerId) {
      clearTimeout(timerId);
      this.timers.delete(timerId);
    }
  }

  // Memory-efficient interval management
  setInterval(callback, delay) {
    const intervalId = setInterval(callback, delay);
    this.intervals.add(intervalId);
    return intervalId;
  }

  clearInterval(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(intervalId);
    }
  }

  // Efficient event listener management
  addEventListener(element, event, handler, options = {}) {
    const key = `${event}_${Date.now()}`;
    element.addEventListener(event, handler, options);
    this.eventListeners.set(key, { element, event, handler });
    return key;
  }

  removeEventListener(key) {
    const listener = this.eventListeners.get(key);
    if (listener) {
      listener.element.removeEventListener(listener.event, listener.handler);
      this.eventListeners.delete(key);
    }
  }

  // Memory pool management
  getFromPool(key) {
    return this.transactionPool.get(key);
  }

  setInPool(key, value) {
    this.transactionPool.set(key, value);
  }

  // Emergency cleanup
  emergencyCleanup() {
    console.log('🧹 Emergency memory cleanup');

    // Clear all timers and intervals
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.intervals.forEach(intervalId => clearInterval(intervalId));

    // Clear caches and pools
    this.cache.clear();
    this.transactionPool.clear();
    this.filterIndex.clear();
    this.sortedIndex.clear();

    // Clear event listeners
    this.eventListeners.forEach((listener, key) => {
      try {
        listener.element.removeEventListener(listener.event, listener.handler);
      } catch (e) {
        // Ignore errors for removed elements
      }
    });
    this.eventListeners.clear();

    // Force garbage collection
    if (window.gc) {
      window.gc();
    }
  }

  // Memory usage monitoring
  getMemoryStats() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
        cacheSize: this.cache.size,
        poolSize: this.transactionPool.size,
        timers: this.timers.size || 0,
        intervals: this.intervals.size || 0
      };
    }
    return null;
  }
}

// Singleton instance
export const memoryManager = new OptimizedMemoryManager();

// Global emergency cleanup
window.emergencyMemoryCleanup = () => memoryManager.emergencyCleanup();

// Auto cleanup every 5 minutes
memoryManager.setInterval(() => {
  const memory = memoryManager.getMemoryStats();
  if (memory && memory.used > 150) { // 150MB threshold
    console.warn(`🚨 High memory usage: ${memory.used}MB, triggering cleanup`);
    memoryManager.emergencyCleanup();
  }
}, 300000);
