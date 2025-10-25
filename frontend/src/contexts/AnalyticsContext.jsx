/**
 * Analytics Context - Single Source of Truth
 * Provides centralized analytics data to all components
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/api/client';
import { useSocket } from '../sockets/useSocket';

const AnalyticsContext = createContext(null);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
};

export const AnalyticsProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const isMounted = useRef(true);
  const abortController = useRef(null);
  const { socket } = useSocket();

  /**
   * Fetch analytics data - Single source of truth
   */
  const fetchAnalytics = useCallback(async (timeRange = 'all', silent = false) => {
    try {
      // Cancel any pending requests
      if (abortController.current) {
        abortController.current.abort();
      }

      abortController.current = new AbortController();

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const response = await apiClient.get(`/analytics/comprehensive?timeRange=${timeRange}`, {
        signal: abortController.current.signal
      });

      if (!isMounted.current) return;

      if (response.data.success) {
        const analyticsData = response.data.data;
        
        // Transform to single source of truth format
        const transformedData = {
          // Core metrics - used everywhere
          balance: analyticsData.user.balance,
          totalSpent: analyticsData.summary.totalSpending,
          totalReceived: analyticsData.summary.totalIncome,
          transactionCount: analyticsData.summary.transactionCount,
          
          // Additional metrics
          netFlow: analyticsData.summary.netFlow,
          averageTransaction: analyticsData.summary.averageTransaction,
          savingsRate: analyticsData.summary.savingsRate,
          
          // Change indicators
          incomeChange: analyticsData.summary.incomeChange,
          spendingChange: analyticsData.summary.spendingChange,
          
          // User info
          user: analyticsData.user,
          
          // Detailed data
          categories: analyticsData.categories,
          trends: analyticsData.trends,
          recurring: analyticsData.recurring,
          insights: analyticsData.insights,
          
          // Metadata
          timeRange: analyticsData.metadata.timeRange,
          generatedAt: analyticsData.metadata.generatedAt
        };
        
        setData(transformedData);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error(response.data.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      if (err.name === 'CanceledError') return;
      
      console.error('Analytics fetch failed:', err);
      if (isMounted.current) {
        setError(err.message || 'Failed to load analytics');
      }
    } finally {
      if (isMounted.current && !silent) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Refresh analytics data
   */
  const refresh = useCallback(() => {
    return fetchAnalytics(data?.timeRange || 'all', false);
  }, [fetchAnalytics, data?.timeRange]);

  /**
   * Change time range
   */
  const changeTimeRange = useCallback((timeRange) => {
    return fetchAnalytics(timeRange, false);
  }, [fetchAnalytics]);

  /**
   * Initial load - only when authenticated
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      fetchAnalytics('all', false);
    } else {
      setLoading(false);
    }
  }, [fetchAnalytics]);

  /**
   * Real-time updates via WebSocket
   */
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      console.log('🔄 Real-time update: Refreshing analytics...');
      fetchAnalytics(data?.timeRange || 'all', true); // Silent refresh
    };

    socket.on('transaction:new', handleUpdate);
    socket.on('balance:update', handleUpdate);

    return () => {
      socket.off('transaction:new', handleUpdate);
      socket.off('balance:update', handleUpdate);
    };
  }, [socket, fetchAnalytics, data?.timeRange]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const value = {
    // Data
    data,
    loading,
    error,
    lastUpdated,
    
    // Core metrics (easy access)
    balance: data?.balance || 0,
    totalSpent: data?.totalSpent || 0,
    totalReceived: data?.totalReceived || 0,
    transactionCount: data?.transactionCount || 0,
    netFlow: data?.netFlow || 0,
    savingsRate: data?.savingsRate || 0,
    
    // Actions
    refresh,
    changeTimeRange,
    fetchAnalytics
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export default AnalyticsContext;
