import { useState, useEffect, useCallback } from 'react';

/**
 * Browser Storage Cache Hook
 * Provides localStorage and sessionStorage caching with TTL support
 */
export const useCache = () => {
  const setCache = useCallback((key, data, ttl = 300000, storage = 'localStorage') => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      const storageObj = storage === 'sessionStorage' ? sessionStorage : localStorage;
      storageObj.setItem(`quickpe_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }, []);

  const getCache = useCallback((key, storage = 'localStorage') => {
    try {
      const storageObj = storage === 'sessionStorage' ? sessionStorage : localStorage;
      const cached = storageObj.getItem(`quickpe_${key}`);
      
      if (!cached) return null;
      
      const { data, timestamp, ttl } = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - timestamp > ttl) {
        storageObj.removeItem(`quickpe_${key}`);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }, []);

  const clearCache = useCallback((key, storage = 'localStorage') => {
    try {
      const storageObj = storage === 'sessionStorage' ? sessionStorage : localStorage;
      if (key) {
        storageObj.removeItem(`quickpe_${key}`);
      } else {
        // Clear all QuickPe cache entries
        Object.keys(storageObj).forEach(k => {
          if (k.startsWith('quickpe_')) {
            storageObj.removeItem(k);
          }
        });
      }
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }, []);

  const invalidateCache = useCallback((pattern) => {
    try {
      [localStorage, sessionStorage].forEach(storage => {
        Object.keys(storage).forEach(key => {
          if (key.startsWith('quickpe_') && key.includes(pattern)) {
            storage.removeItem(key);
          }
        });
      });
    } catch (error) {
      console.warn('Cache invalidation failed:', error);
    }
  }, []);

  return { setCache, getCache, clearCache, invalidateCache };
};

/**
 * IndexedDB Cache Hook for larger structured data
 */
export const useIndexedDBCache = () => {
  const [db, setDb] = useState(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open('QuickPeCache', 1);
        
        request.onerror = () => {
          console.warn('IndexedDB failed to open');
        };
        
        request.onsuccess = () => {
          setDb(request.result);
        };
        
        request.onupgradeneeded = (event) => {
          const database = event.target.result;
          if (!database.objectStoreNames.contains('cache')) {
            const store = database.createObjectStore('cache', { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      } catch (error) {
        console.warn('IndexedDB initialization failed:', error);
      }
    };

    initDB();
  }, []);

  const setIndexedCache = useCallback(async (key, data, ttl = 600000) => {
    if (!db) return;
    
    try {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      await store.put({
        key: `quickpe_${key}`,
        data,
        timestamp: Date.now(),
        ttl
      });
    } catch (error) {
      console.warn('IndexedDB set failed:', error);
    }
  }, [db]);

  const getIndexedCache = useCallback(async (key) => {
    if (!db) return null;
    
    try {
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(`quickpe_${key}`);
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }
          
          // Check TTL
          if (Date.now() - result.timestamp > result.ttl) {
            // Delete expired entry
            const deleteTransaction = db.transaction(['cache'], 'readwrite');
            const deleteStore = deleteTransaction.objectStore('cache');
            deleteStore.delete(`quickpe_${key}`);
            resolve(null);
            return;
          }
          
          resolve(result.data);
        };
        
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.warn('IndexedDB get failed:', error);
      return null;
    }
  }, [db]);

  const clearIndexedCache = useCallback(async (key) => {
    if (!db) return;
    
    try {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      if (key) {
        await store.delete(`quickpe_${key}`);
      } else {
        await store.clear();
      }
    } catch (error) {
      console.warn('IndexedDB clear failed:', error);
    }
  }, [db]);

  return { setIndexedCache, getIndexedCache, clearIndexedCache };
};
