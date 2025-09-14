import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../sockets/useSocket';
import { useCache } from './useCache';
import { QUERY_KEYS } from './useQueries';

/**
 * Socket-based cache invalidation hook
 * Listens to real-time events and invalidates relevant cache entries
 */
export const useSocketCache = () => {
  const queryClient = useQueryClient();
  const { invalidateCache } = useCache();
  const userId = localStorage.getItem('userId');
  const { socket } = useSocket(userId);

  useEffect(() => {
    if (!socket) return;

    // Handle new transaction events
    const handleNewTransaction = (data) => {
      console.log('🔄 New transaction received, invalidating cache:', data);
      
      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_BALANCE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECENT_ACTIVITY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANALYTICS] });
      
      // Invalidate browser storage cache
      invalidateCache('balance');
      
      // Trigger custom event for components that don't use React Query
      window.dispatchEvent(new CustomEvent('transactionUpdate', { detail: data }));
      invalidateCache('transactions');
      invalidateCache('recent-activity');
      invalidateCache('analytics');
      
      // Optimistically update balance if provided
      if (data.newBalance !== undefined) {
        queryClient.setQueryData([QUERY_KEYS.USER_BALANCE], (oldData) => ({
          ...oldData,
          balance: data.newBalance
        }));
      }
    };

    // Handle new notification events
    const handleNewNotification = (data) => {
      console.log('🔔 New notification received, invalidating cache:', data);
      
      // Invalidate notification-related cache
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_COUNT] });
      
      // Invalidate browser storage cache
      invalidateCache('notifications');
      
      // Optimistically update notification count
      queryClient.setQueryData([QUERY_KEYS.NOTIFICATION_COUNT], (oldData) => ({
        ...oldData,
        count: (oldData?.count || 0) + 1
      }));
    };

    // Handle balance update events
    const handleBalanceUpdate = (data) => {
      console.log('💰 Balance update received, invalidating cache:', data);
      
      // Invalidate balance-related cache
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_BALANCE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANALYTICS] });
      
      // Invalidate browser storage cache
      invalidateCache('balance');
      invalidateCache('analytics');
      
      // Optimistically update balance
      if (data.newBalance !== undefined) {
        queryClient.setQueryData([QUERY_KEYS.USER_BALANCE], (oldData) => ({
          ...oldData,
          balance: data.newBalance
        }));
      }
    };

    // Handle user profile update events
    const handleProfileUpdate = (data) => {
      console.log('👤 Profile update received, invalidating cache:', data);
      
      // Invalidate user-related cache
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });
      
      // Invalidate browser storage cache
      invalidateCache('user-profile');
      
      // Optimistically update profile data
      if (data.profile) {
        queryClient.setQueryData([QUERY_KEYS.USER_PROFILE], data.profile);
      }
    };

    // Handle notification read events
    const handleNotificationRead = (data) => {
      console.log('📖 Notification read, invalidating cache:', data);
      
      // Invalidate notification cache
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_COUNT] });
      
      // Invalidate browser storage cache
      invalidateCache('notifications');
      
      // Optimistically update notification count
      queryClient.setQueryData([QUERY_KEYS.NOTIFICATION_COUNT], (oldData) => ({
        ...oldData,
        count: Math.max((oldData?.count || 0) - 1, 0)
      }));
    };

    // Handle cache invalidation events from server
    const handleCacheInvalidate = (data) => {
      console.log('🗑️ Cache invalidation received from server:', data);
      
      const { patterns, userId } = data;
      
      if (patterns) {
        patterns.forEach(pattern => {
          // Invalidate React Query cache based on pattern
          if (pattern.includes('balance')) {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_BALANCE] });
          }
          if (pattern.includes('transactions')) {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECENT_ACTIVITY] });
          }
          if (pattern.includes('analytics')) {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANALYTICS] });
          }
          if (pattern.includes('notifications')) {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_COUNT] });
          }
          if (pattern.includes('profile')) {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });
          }
          
          // Invalidate browser storage cache
          invalidateCache(pattern);
        });
      }
    };

    // Handle transaction update events (alias for newTransaction)
    const handleTransactionUpdate = (data) => {
      console.log('🔄 Transaction update received, invalidating cache:', data);
      handleNewTransaction(data); // Use the same logic as newTransaction
    };

    // Register event listeners only if socket exists
    if (socket) {
      socket.on('newTransaction', handleNewTransaction);
      socket.on('transactionUpdate', handleTransactionUpdate);
      socket.on('balanceUpdate', handleBalanceUpdate);
      socket.on('profileUpdate', handleProfileUpdate);
      socket.on('notificationRead', handleNotificationRead);
      socket.on('cacheInvalidate', handleCacheInvalidate);
    }

    // Cleanup event listeners
    return () => {
      if (socket) {
        socket.off('newTransaction', handleNewTransaction);
        socket.off('transactionUpdate', handleTransactionUpdate);
        socket.off('balanceUpdate', handleBalanceUpdate);
        socket.off('profileUpdate', handleProfileUpdate);
        socket.off('notificationRead', handleNotificationRead);
        socket.off('cacheInvalidate', handleCacheInvalidate);
      }
    };
  }, [socket, queryClient, invalidateCache]);

  return {
    // Expose manual cache invalidation functions
    invalidateBalance: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_BALANCE] });
      invalidateCache('balance');
    },
    invalidateTransactions: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECENT_ACTIVITY] });
      invalidateCache('transactions');
      invalidateCache('recent-activity');
    },
    invalidateNotifications: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_COUNT] });
      invalidateCache('notifications');
    },
    invalidateAnalytics: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANALYTICS] });
      invalidateCache('analytics');
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
      invalidateCache();
    }
  };
};
