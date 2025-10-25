import apiClient from './api/client';
import { useQuery, useQueryClient, useMutation } from 'react-query';
import { toast } from 'react-hot-toast';

// Admin Dashboard Data
export const fetchDashboardData = async () => {
  const response = await apiClient.get('/api/admin/dashboard');
  return response.data;
};

export const useDashboardData = () => {
  return useQuery('adminDashboard', fetchDashboardData, {
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data fresh for 10 seconds
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard data');
    },
  });
};

// User Management
export const fetchUsers = async (page = 1, limit = 10, search = '') => {
  const response = await apiClient.get('/api/admin/users', {
    params: { page, limit, search },
  });
  return response.data;
};

export const useUsers = (page, limit, search) => {
  return useQuery(
    ['adminUsers', page, limit, search],
    () => fetchUsers(page, limit, search),
    {
      keepPreviousData: true,
      staleTime: 30000,
    }
  );
};

// System Analytics
export const fetchSystemAnalytics = async () => {
  const response = await apiClient.get('/api/admin/system-analytics');
  return response.data;
};

export const useSystemAnalytics = () => {
  return useQuery('systemAnalytics', fetchSystemAnalytics, {
    refetchInterval: 60000, // Refetch every minute
  });
};

// Trade Analytics
export const fetchTradeAnalytics = async (timeframe = '30d') => {
  const response = await apiClient.get('/api/admin/trade-analytics-overview', {
    params: { timeframe },
  });
  return response.data;
};

export const useTradeAnalytics = (timeframe) => {
  return useQuery(
    ['tradeAnalytics', timeframe],
    () => fetchTradeAnalytics(timeframe),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );
};

// System Health
export const fetchSystemHealth = async () => {
  const response = await apiClient.get('/api/admin/system-health');
  return response.data;
};

export const useSystemHealth = () => {
  return useQuery('systemHealth', fetchSystemHealth, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Feature Flags
export const fetchFeatureFlags = async () => {
  const response = await apiClient.get('/api/admin/feature-flags');
  return response.data;
};

export const useFeatureFlags = () => {
  return useQuery('featureFlags', fetchFeatureFlags, {
    refetchInterval: 60000, // Refetch every minute
  });
};

// Update User
export const updateUser = async (userId, userData) => {
  const response = await apiClient.put(`/api/admin/users/${userId}`, userData);
  return response.data;
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation(updateUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('adminUsers');
      queryClient.invalidateQueries('adminDashboard');
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });
};

// Delete User
export const deleteUser = async (userId) => {
  const response = await apiClient.delete(`/api/admin/users/${userId}`);
  return response.data;
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation(deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('adminUsers');
      queryClient.invalidateQueries('adminDashboard');
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });
};

// Toggle Feature Flag
export const toggleFeatureFlag = async (flagName, enabled) => {
  const response = await apiClient.put(`/api/admin/feature-flags/${flagName}`, { enabled });
  return response.data;
};

export const useToggleFeatureFlag = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ flagName, enabled }) => toggleFeatureFlag(flagName, enabled),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('featureFlags');
        toast.success('Feature flag updated');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update feature flag');
      },
    }
  );
};
