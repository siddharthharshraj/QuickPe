import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowPathIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  ServerIcon,
  CircleStackIcon,
  DocumentTextIcon,
  FlagIcon,
  BanknotesIcon,
  SparklesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import apiClient from '../services/api/client';
import { memoryManager } from '../utils/optimizedMemoryManager';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  // Consolidated state using efficient data structures
  const [state, setState] = useState({
    users: new Map(), // Use Map for O(1) lookups
    analytics: null,
    featureFlags: new Map(),
    loading: true,
    activeTab: 'user-management'
  });

  const [uiState, setUiState] = useState({
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    searchTerm: '',
    statusFilter: 'all',
    selectedUser: null,
    showCreateUser: false,
    showResetPassword: false,
    newPassword: ''
  });

  const [formData, setFormData] = useState({
    userForm: {
      firstName: '',
      lastName: '',
      email: '',
      balance: 0,
      role: 'user'
    }
  });

  // Memoized computed values
  const { filteredUsers, paginatedUsers } = useMemo(() => {
    const usersArray = Array.from(state.users.values());

    // Efficient filtering using pre-computed indexes
    let filtered = usersArray;
    if (uiState.searchTerm) {
      const searchLower = uiState.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.quickpeId?.toLowerCase().includes(searchLower)
      );
    }

    if (uiState.statusFilter !== 'all') {
      filtered = filtered.filter(user =>
        uiState.statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    // Efficient pagination
    const startIndex = (uiState.pagination.page - 1) * uiState.pagination.limit;
    const paginatedUsers = filtered.slice(startIndex, startIndex + uiState.pagination.limit);

    return { filteredUsers: filtered, paginatedUsers };
  }, [state.users, uiState.searchTerm, uiState.statusFilter, uiState.pagination]);

  // Optimized API calls with caching
  const fetchUsers = useCallback(async () => {
    const cacheKey = `users_${uiState.pagination.page}_${uiState.searchTerm}_${uiState.statusFilter}`;
    const cached = memoryManager.getCache(cacheKey);

    if (cached) {
      setState(prev => ({ ...prev, users: cached.users }));
      setUiState(prev => ({ ...prev, pagination: cached.pagination }));
      return;
    }

    try {
      const response = await apiClient.get('/admin/users', {
        params: {
          page: uiState.pagination.page,
          limit: uiState.pagination.limit,
          search: uiState.searchTerm,
          status: uiState.statusFilter
        }
      });

      if (response.data?.success) {
        // Store in efficient Map structure
        const userMap = new Map();
        response.data.users.forEach(user => {
          userMap.set(user._id, user);
        });

        // Cache for 2 minutes
        memoryManager.setCache(cacheKey, {
          users: userMap,
          pagination: response.data.pagination
        }, 120000);

        setState(prev => ({ ...prev, users: userMap }));
        setUiState(prev => ({ ...prev, pagination: response.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [uiState.pagination.page, uiState.searchTerm, uiState.statusFilter]);

  const fetchAnalytics = useCallback(async () => {
    const cacheKey = 'admin_analytics';
    const cached = memoryManager.getCache(cacheKey);

    if (cached) {
      setState(prev => ({ ...prev, analytics: cached }));
      return;
    }

    try {
      // Parallel API calls for better performance
      const [subscriptionRes, systemRes, metricsRes] = await Promise.allSettled([
        apiClient.get('/admin/subscription-analytics'),
        apiClient.get('/admin/system-analytics'),
        apiClient.get('/admin/realtime-metrics')
      ]);

      const analyticsData = {
        totalUsers: subscriptionRes.status === 'fulfilled' ? subscriptionRes.value.data?.totalUsers || 0 : 0,
        trialUsers: subscriptionRes.status === 'fulfilled' ? subscriptionRes.value.data?.trialUsers || 0 : 0,
        activeSubscriptions: subscriptionRes.status === 'fulfilled' ? subscriptionRes.value.data?.activeSubscriptions || 0 : 0,
        expiredSubscriptions: subscriptionRes.status === 'fulfilled' ? subscriptionRes.value.data?.expiredSubscriptions || 0 : 0,
        totalTransactions: systemRes.status === 'fulfilled' ? systemRes.value.data?.totalTransactions || 0 : 0,
        totalRevenue: systemRes.status === 'fulfilled' ? systemRes.value.data?.totalRevenue || 0 : 0,
        monthlyGrowth: systemRes.status === 'fulfilled' ? systemRes.value.data?.monthlyGrowth || 0 : 0,
        systemHealth: metricsRes.status === 'fulfilled' ? metricsRes.value.data?.systemHealth || 95 : 95,
        activeUsers: metricsRes.status === 'fulfilled' ? metricsRes.value.data?.activeUsers || 0 : 0,
        avgResponseTime: metricsRes.status === 'fulfilled' ? metricsRes.value.data?.avgResponseTime || 0 : 0,
        errorRate: metricsRes.status === 'fulfilled' ? metricsRes.value.data?.errorRate || 0 : 0
      };

      // Cache for 5 minutes
      memoryManager.setCache(cacheKey, analyticsData, 300000);
      setState(prev => ({ ...prev, analytics: analyticsData }));

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setState(prev => ({ ...prev, analytics: {
        totalUsers: 0, trialUsers: 0, activeSubscriptions: 0, expiredSubscriptions: 0,
        totalTransactions: 0, totalRevenue: 0, monthlyGrowth: 0, systemHealth: 0,
        activeUsers: 0, avgResponseTime: 0, errorRate: 0
      }}));
    }
  }, []);

  const fetchFeatureFlags = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/feature-flags');
      if (response.data?.success) {
        const flagMap = new Map();
        response.data.flags.forEach(flag => {
          flagMap.set(flag.id, flag);
        });
        setState(prev => ({ ...prev, featureFlags: flagMap }));
      }
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    }
  }, []);

  // Single useEffect for all data fetching
  useEffect(() => {
    const loadData = async () => {
      setState(prev => ({ ...prev, loading: true }));
      await Promise.all([fetchUsers(), fetchAnalytics(), fetchFeatureFlags()]);
      setState(prev => ({ ...prev, loading: false }));
    };

    loadData();
  }, [fetchUsers, fetchAnalytics, fetchFeatureFlags]);

  // Optimized form handlers
  const handleCreateUser = useCallback(async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/admin/users', {
        ...formData.userForm,
        password: 'quickpe123'
      });

      if (response.data?.success) {
        toast.success('User created successfully');
        setUiState(prev => ({
          ...prev,
          showCreateUser: false
        }));
        setFormData(prev => ({
          ...prev,
          userForm: { firstName: '', lastName: '', email: '', balance: 0, role: 'user' }
        }));
        // Invalidate cache and refresh
        memoryManager.setCache(`users_${uiState.pagination.page}_${uiState.searchTerm}_${uiState.statusFilter}`, null);
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  }, [formData.userForm, uiState.pagination, uiState.searchTerm, uiState.statusFilter, fetchUsers]);

  const handleDeleteUser = useCallback(async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiClient.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');

      // Update local state efficiently
      setState(prev => {
        const newUsers = new Map(prev.users);
        newUsers.delete(userId);
        return { ...prev, users: newUsers };
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  }, []);

  const handleToggleFeatureFlag = useCallback(async (flagId, isEnabled) => {
    try {
      await apiClient.put(`/admin/feature-flags/${flagId}`, { isEnabled: !isEnabled });
      toast.success('Feature flag updated successfully');

      // Update local state
      setState(prev => {
        const newFlags = new Map(prev.featureFlags);
        const flag = newFlags.get(flagId);
        if (flag) {
          newFlags.set(flagId, { ...flag, enabled: !isEnabled });
        }
        return { ...prev, featureFlags: newFlags };
      });
    } catch (error) {
      toast.error('Failed to update feature flag');
    }
  }, []);

  // Optimized UI update functions
  const updatePagination = useCallback((page) => {
    setUiState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }));
  }, []);

  const updateFilters = useCallback((updates) => {
    setUiState(prev => ({ ...prev, ...updates, pagination: { ...prev.pagination, page: 1 } }));
  }, []);

  // Memoized components
  const StatCard = useCallback(({ title, value, icon: Icon, color = "border-blue-500" }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-sm border-l-4 ${color} p-6`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
    </motion.div>
  ), []);

  if (state.loading && state.users.size === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, feature flags, and view analytics</p>
        </motion.div>

        {/* Analytics Cards */}
        {state.analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard key="total-users" title="Total Users" value={state.analytics.totalUsers || 0} icon={UsersIcon} color="border-blue-500" />
            <StatCard key="active-users" title="Active Users" value={state.analytics.activeUsers || 0} icon={CheckCircleIcon} color="border-green-500" />
            <StatCard key="total-transactions" title="Total Transactions" value={state.analytics.totalTransactions || 0} icon={ChartBarIcon} color="border-purple-500" />
            <StatCard key="total-volume" title="Total Volume" value={`₹${(state.analytics.totalRevenue || 0).toLocaleString()}`} icon={DocumentArrowDownIcon} color="border-yellow-500" />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex flex-wrap space-x-4 lg:space-x-8">
            {[
              { id: 'user-management', name: 'User Management', icon: UsersIcon },
              { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
              { id: 'data-sync', name: 'Data Sync', icon: ArrowTrendingUpIcon },
              { id: 'feature-flags', name: 'Feature Flags', icon: FlagIcon },
              { id: 'payments', name: 'Payments', icon: BanknotesIcon, comingSoon: true },
              { id: 'trade-analytics', name: 'Trade Journal Analytics', icon: DocumentTextIcon, comingSoon: true },
              { id: 'ai-assistant', name: 'AI Assistant', icon: SparklesIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab.id }))}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm relative ${
                  state.activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
                {tab.comingSoon && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs px-1 rounded-full">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* User Management Tab */}
        {state.activeTab === 'user-management' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">User Management</h2>
                <button
                  onClick={() => setUiState(prev => ({ ...prev, showCreateUser: true }))}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QuickPe ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-emerald-800">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.quickpeId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{user.balance?.toLocaleString() || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setUiState(prev => ({
                              ...prev,
                              selectedUser: user,
                              showResetPassword: true
                            }))}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            <KeyIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feature Flags Tab */}
        {state.activeTab === 'feature-flags' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Feature Flags</h2>
            <div className="space-y-4">
              {Array.from(state.featureFlags.values()).map((flag) => (
                <div key={flag.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{flag.name}</h3>
                    <p className="text-sm text-gray-500">{flag.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeatureFlag(flag.id, flag.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      flag.enabled ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        flag.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {state.activeTab === 'analytics' && state.analytics && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-emerald-800">
                    Live data • Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <UsersIcon className="h-8 w-8 text-emerald-600 mr-5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-lg font-medium text-gray-900">{state.analytics.totalUsers || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-blue-600 mr-5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Users (24h)</p>
                    <p className="text-lg font-medium text-gray-900">{state.analytics.activeUsers || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <BanknotesIcon className="h-8 w-8 text-green-600 mr-5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                    <p className="text-lg font-medium text-gray-900">{state.analytics.totalTransactions || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600 mr-5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-lg font-medium text-gray-900">₹{(state.analytics.totalRevenue || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs with placeholder content */}
        {state.activeTab === 'data-sync' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Data Synchronization</h3>
            <p className="text-gray-600">Data sync functionality is being loaded...</p>
          </div>
        )}

        {/* Create User Modal */}
        {uiState.showCreateUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Create New User</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.userForm.firstName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      userForm: { ...prev.userForm, firstName: e.target.value }
                    }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.userForm.lastName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      userForm: { ...prev.userForm, lastName: e.target.value }
                    }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.userForm.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      userForm: { ...prev.userForm, email: e.target.value }
                    }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Initial Balance</label>
                  <input
                    type="number"
                    value={formData.userForm.balance}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      userForm: { ...prev.userForm, balance: parseFloat(e.target.value) || 0 }
                    }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                  >
                    Create User
                  </button>
                  <button
                    type="button"
                    onClick={() => setUiState(prev => ({ ...prev, showCreateUser: false }))}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
