import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api/client.js';
import { useCache } from './useCache.js';

// Query keys for consistent cache management
export const QUERY_KEYS = {
  USER_PROFILE: 'user-profile',
  USER_BALANCE: 'user-balance',
  TRANSACTIONS: 'transactions',
  ANALYTICS: 'analytics',
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_COUNT: 'notification-count',
  USERS: 'users',
  RECENT_ACTIVITY: 'recent-activity',
  AUDIT_LOGS: 'audit-logs',
};

// Cache TTL configurations (in milliseconds)
const CACHE_TTL = {
  USER_PROFILE: 15 * 60 * 1000, // 15 minutes
  USER_BALANCE: 30 * 1000, // 30 seconds (frequently updated)
  TRANSACTIONS: 2 * 60 * 1000, // 2 minutes
  ANALYTICS: 5 * 60 * 1000, // 5 minutes
  NOTIFICATIONS: 1 * 60 * 1000, // 1 minute
  USERS: 10 * 60 * 1000, // 10 minutes
  RECENT_ACTIVITY: 1 * 60 * 1000, // 1 minute
};

/**
 * User Profile Query Hook
 */
export const useUserProfile = () => {
  const { getCache, setCache } = useCache();
  
  return useQuery({
    queryKey: [QUERY_KEYS.USER_PROFILE],
    queryFn: async () => {
      // Try cache first
      const cached = getCache(QUERY_KEYS.USER_PROFILE);
      if (cached) return cached;
      
      const response = await apiClient.get('/account/profile');
      const data = response.data;
      
      // Cache the result
      setCache(QUERY_KEYS.USER_PROFILE, data, CACHE_TTL.USER_PROFILE);
      
      return data;
    },
    staleTime: CACHE_TTL.USER_PROFILE,
    cacheTime: CACHE_TTL.USER_PROFILE * 2,
  });
};

/**
 * User Balance Query Hook
 */
export const useUserBalance = () => {
  const { getCache, setCache } = useCache();
  
  return useQuery({
    queryKey: [QUERY_KEYS.USER_BALANCE],
    queryFn: async () => {
      // Try cache first for immediate response
      const cached = getCache(QUERY_KEYS.USER_BALANCE);
      if (cached) {
        // Return cached data but still fetch fresh data in background
        setTimeout(async () => {
          try {
            const response = await apiClient.get('/account/balance');
            const freshData = response.data;
            setCache(QUERY_KEYS.USER_BALANCE, freshData, CACHE_TTL.USER_BALANCE);
          } catch (error) {
            console.warn('Background balance refresh failed:', error);
          }
        }, 0);
        return cached;
      }
      
      const response = await apiClient.get('/account/balance');
      const data = response.data;
      
      setCache(QUERY_KEYS.USER_BALANCE, data, CACHE_TTL.USER_BALANCE);
      
      return data;
    },
    staleTime: CACHE_TTL.USER_BALANCE,
    cacheTime: CACHE_TTL.USER_BALANCE * 2,
    refetchInterval: 60000, // Refetch every minute
  });
};

/**
 * Transactions Query Hook with Pagination
 */
export const useTransactions = (params = {}) => {
  const { getCache, setCache } = useCache();
  const cacheKey = `${QUERY_KEYS.TRANSACTIONS}_${JSON.stringify(params)}`;
  
  return useQuery({
    queryKey: [QUERY_KEYS.TRANSACTIONS, params],
    queryFn: async () => {
      // Try cache first
      const cached = getCache(cacheKey);
      if (cached) return cached;
      
      const response = await apiClient.get('/account/transactions', { params });
      const data = response.data;
      
      // Cache the result
      setCache(cacheKey, data, CACHE_TTL.TRANSACTIONS);
      
      return data;
    },
    staleTime: CACHE_TTL.TRANSACTIONS,
    cacheTime: CACHE_TTL.TRANSACTIONS * 2,
  });
};

/**
 * Analytics Query Hook
 */
export const useAnalytics = (timeframe = 'month') => {
  const { getCache, setCache } = useCache();
  const cacheKey = `${QUERY_KEYS.ANALYTICS}_${timeframe}`;
  
  return useQuery({
    queryKey: [QUERY_KEYS.ANALYTICS, timeframe],
    queryFn: async () => {
      // Try cache first
      const cached = getCache(cacheKey);
      if (cached) return cached;
      
      const response = await apiClient.get(`/account/analytics?timeframe=${timeframe}`);
      const data = response.data;
      
      // Cache analytics data for longer since it's expensive to compute
      setCache(cacheKey, data, CACHE_TTL.ANALYTICS);
      
      return data;
    },
    staleTime: CACHE_TTL.ANALYTICS,
    cacheTime: CACHE_TTL.ANALYTICS * 2,
  });
};

/**
 * Notifications Query Hook
 */
export const useNotifications = () => {
  const { getCache, setCache } = useCache();
  
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS],
    queryFn: async () => {
      // Try cache first
      const cached = getCache(QUERY_KEYS.NOTIFICATIONS);
      if (cached) return cached;
      
      const response = await apiClient.get('/notifications');
      const data = response.data;
      
      setCache(QUERY_KEYS.NOTIFICATIONS, data, CACHE_TTL.NOTIFICATIONS);
      
      return data;
    },
    staleTime: CACHE_TTL.NOTIFICATIONS,
    cacheTime: CACHE_TTL.NOTIFICATIONS * 2,
  });
};

/**
 * Notification Count Query Hook
 */
export const useNotificationCount = () => {
  const { getCache, setCache } = useCache();
  
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATION_COUNT],
    queryFn: async () => {
      // Try cache first
      const cached = getCache(QUERY_KEYS.NOTIFICATION_COUNT);
      if (cached) return cached;
      
      const response = await apiClient.get('/notifications/unread-count');
      const data = response.data;
      
      setCache(QUERY_KEYS.NOTIFICATION_COUNT, data, CACHE_TTL.NOTIFICATIONS);
      
      return data;
    },
    staleTime: CACHE_TTL.NOTIFICATIONS,
    cacheTime: CACHE_TTL.NOTIFICATIONS * 2,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Users List Query Hook
 */
export const useUsers = () => {
  const { getCache, setCache } = useCache();
  
  return useQuery({
    queryKey: [QUERY_KEYS.USERS],
    queryFn: async () => {
      // Try cache first
      const cached = getCache(QUERY_KEYS.USERS);
      if (cached) return cached;
      
      const response = await apiClient.get('/account/users');
      const data = response.data;
      
      // Cache users list for longer since it doesn't change frequently
      setCache(QUERY_KEYS.USERS, data, CACHE_TTL.USERS);
      
      return data;
    },
    staleTime: CACHE_TTL.USERS,
    cacheTime: CACHE_TTL.USERS * 2,
  });
};

/**
 * Recent Activity Query Hook
 */
export const useRecentActivity = (limit = 10) => {
  const { getCache, setCache } = useCache();
  const cacheKey = `${QUERY_KEYS.RECENT_ACTIVITY}_${limit}`;
  
  return useQuery({
    queryKey: [QUERY_KEYS.RECENT_ACTIVITY, limit],
    queryFn: async () => {
      // Try cache first
      const cached = getCache(cacheKey);
      if (cached) return cached;
      
      const response = await apiClient.get(`/account/transactions?limit=${limit}&sort=desc`);
      const data = response.data;
      
      setCache(cacheKey, data, CACHE_TTL.RECENT_ACTIVITY);
      
      return data;
    },
    staleTime: CACHE_TTL.RECENT_ACTIVITY,
    cacheTime: CACHE_TTL.RECENT_ACTIVITY * 2,
  });
};

/**
 * Transfer Money Mutation Hook
 */
export const useTransferMoney = () => {
  const queryClient = useQueryClient();
  const { invalidateCache } = useCache();
  
  return useMutation({
    mutationFn: async (transferData) => {
      const response = await apiClient.post('/account/transfer', transferData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_BALANCE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECENT_ACTIVITY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANALYTICS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_COUNT] });
      
      // Clear browser cache for affected data
      invalidateCache('balance');
      invalidateCache('transactions');
      invalidateCache('recent-activity');
      invalidateCache('analytics');
      invalidateCache('notifications');
    },
  });
};

/**
 * Add Money Mutation Hook
 */
export const useAddMoney = () => {
  const queryClient = useQueryClient();
  const { invalidateCache } = useCache();
  
  return useMutation({
    mutationFn: async (amount) => {
      const response = await apiClient.post('/account/deposit', { amount });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate balance and related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_BALANCE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECENT_ACTIVITY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANALYTICS] });
      
      // Clear browser cache
      invalidateCache('balance');
      invalidateCache('transactions');
      invalidateCache('recent-activity');
      invalidateCache('analytics');
    },
  });
};

/**
 * Mark Notification as Read Mutation Hook
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  const { invalidateCache } = useCache();
  
  return useMutation({
    mutationFn: async (notificationId) => {
      const response = await apiClient.patch(`/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_COUNT] });
      
      invalidateCache('notifications');
    },
  });
};

/**
 * Mark All Notifications as Read Mutation Hook
 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  const { invalidateCache } = useCache();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch('/notifications/mark-all-read');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_COUNT] });
      
      invalidateCache('notifications');
    },
  });
};
