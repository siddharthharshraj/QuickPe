import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import AdminAIChat from '../components/AdminAIChat';
// import DataSyncStatus from '../components/DataSyncStatus';
import apiClient from '../services/api/client';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  // Temporarily disabled memory manager to fix errors
  // const componentRef = useRef({});
  // const memoryManager = useMemoryManager(componentRef.current);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('user-management');
  const [analytics, setAnalytics] = useState(null);
  const [featureFlags, setFeatureFlags] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    balance: 0,
    role: 'user'
  });

  useEffect(() => {
    if (pagination?.page) {
      fetchUsers();
    }
    fetchAnalytics();
    fetchFeatureFlags();
    
    // Set up real-time data refresh (disabled to fix memory issues)
    // const interval = setInterval(() => {
    //   fetchAnalytics();
    //   if (activeTab === 'user-management') {
    //     fetchUsers();
    //   }
    // }, 60000);

    // return () => clearInterval(interval);
  }, [pagination?.page, searchTerm, statusFilter, activeTab]);

  // Initial load effect
  useEffect(() => {
    fetchUsers();
    fetchAnalytics();
    fetchFeatureFlags();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/users', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          status: statusFilter
        }
      });
      
      if (response.data && response.data.success) {
        setUsers(response.data.users || []);
        setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
      } else {
        console.error('API returned unsuccessful response:', response.data);
        setUsers([]);
        setPagination({ page: 1, limit: 10, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error.response?.data?.message || error.message);
      setUsers([]);
      setPagination({ page: 1, limit: 10, total: 0, pages: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Initialize with default values
      let analyticsData = {
        totalUsers: 0,
        trialUsers: 0,
        activeSubscriptions: 0,
        expiredSubscriptions: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        monthlyGrowth: 0,
        systemHealth: 95,
        activeUsers: 0,
        avgResponseTime: 0,
        errorRate: 0
      };
      
      // Fetch subscription analytics with error handling
      try {
        const subscriptionResponse = await apiClient.get('/admin/subscription-analytics');
        if (subscriptionResponse.data) {
          analyticsData = {
            ...analyticsData,
            totalUsers: subscriptionResponse.data.totalUsers || 0,
            trialUsers: subscriptionResponse.data.trialUsers || 0,
            activeSubscriptions: subscriptionResponse.data.activeSubscriptions || 0,
            expiredSubscriptions: subscriptionResponse.data.expiredSubscriptions || 0
          };
        }
      } catch (subError) {
        console.error('Subscription analytics failed:', subError.message);
      }
      
      // Fetch system analytics with error handling
      try {
        const systemResponse = await apiClient.get('/admin/system-analytics');
        if (systemResponse.data) {
          analyticsData = {
            ...analyticsData,
            totalTransactions: systemResponse.data.totalTransactions || 0,
            totalRevenue: systemResponse.data.totalRevenue || 0,
            monthlyGrowth: systemResponse.data.monthlyGrowth || 0
          };
        }
      } catch (sysError) {
        console.error('System analytics failed:', sysError.message);
      }
      
      // Fetch real-time metrics with error handling
      try {
        const metricsResponse = await apiClient.get('/admin/realtime-metrics');
        if (metricsResponse.data) {
          analyticsData = {
            ...analyticsData,
            systemHealth: metricsResponse.data.systemHealth || 95,
            activeUsers: metricsResponse.data.activeUsers || 0,
            avgResponseTime: metricsResponse.data.avgResponseTime || 0,
            errorRate: metricsResponse.data.errorRate || 0
          };
        }
      } catch (metricsError) {
        console.error('Realtime metrics failed:', metricsError.message);
      }
      
      setAnalytics(analyticsData);
      
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Set minimal working data to prevent UI crashes
      setAnalytics({
        totalUsers: 0,
        trialUsers: 0,
        activeSubscriptions: 0,
        expiredSubscriptions: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        monthlyGrowth: 0,
        systemHealth: 0,
        activeUsers: 0,
        avgResponseTime: 0,
        errorRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      const response = await apiClient.get('/admin/feature-flags');
      if (response.data.success) {
        setFeatureFlags(response.data.flags);
      }
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/admin/users', {
        ...userForm,
        password: 'quickpe123'
      });
      
      if (response.data.success) {
        toast.success('User created successfully');
        setShowCreateUser(false);
        setUserForm({ firstName: '', lastName: '', email: '', balance: 0, role: 'user' });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      const response = await apiClient.post(`/admin/users/${userId}/reset-password`, {
        newPassword
      });
      
      if (response.data.success) {
        toast.success('Password reset successfully');
        setShowResetPassword(false);
        setNewPassword('');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      if (response.data.success) {
        toast.success('User deleted successfully');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleFeatureFlag = async (flagId, isEnabled) => {
    try {
      const response = await apiClient.put(`/admin/feature-flags/${flagId}`, {
        isEnabled: !isEnabled
      });
      
      if (response.data.success) {
        toast.success('Feature flag updated successfully');
        fetchFeatureFlags();
      }
    } catch (error) {
      console.error('Error updating feature flag:', error);
      toast.error('Failed to update feature flag');
    }
  };

  const exportAnalytics = async (format = 'json') => {
    try {
      const response = await apiClient.get(`/admin/analytics/export?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quickpe-analytics.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Analytics exported successfully');
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = "border-blue-500" }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-sm border-l-4 ${color} p-6`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
    </motion.div>
  );

  if (loading && users.length === 0) {
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

        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              key="total-users"
              title="Total Users"
              value={analytics.totalUsers || 0}
              icon={UsersIcon}
              color="border-blue-500"
            />
            <StatCard
              key="active-users"
              title="Active Users"
              value={analytics.activeUsers || 0}
              icon={CheckCircleIcon}
              color="border-green-500"
            />
            <StatCard
              key="total-transactions"
              title="Total Transactions"
              value={analytics.totalTransactions || 0}
              icon={ChartBarIcon}
              color="border-purple-500"
            />
            <StatCard
              key="total-volume"
              title="Total Volume"
              value={`₹${(analytics.totalRevenue || 0).toLocaleString()}`}
              icon={DocumentArrowDownIcon}
              color="border-yellow-500"
            />
          </div>
        )}

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
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm relative ${
                  activeTab === tab.id
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

        {activeTab === 'user-management' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">User Management</h2>
                <button
                  onClick={() => setShowCreateUser(true)}
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
                  {users.map((user) => (
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
                            key={`reset-${user._id}`}
                            onClick={() => {
                              setSelectedUser(user);
                              setShowResetPassword(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            <KeyIcon className="h-4 w-4" />
                          </button>
                          <button
                            key={`delete-${user._id}`}
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

        {activeTab === 'feature-flags' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Feature Flags</h2>
            <div className="space-y-4">
              {featureFlags.map((flag) => (
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

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : analytics ? (
              <>
                {/* Real-time Data Indicator */}
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
                
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UsersIcon className="h-8 w-8 text-emerald-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                          <dd className="text-lg font-medium text-gray-900">{analytics.totalUsers || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Active Users (24h)</dt>
                          <dd className="text-lg font-medium text-gray-900">{analytics.activeUsers || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <BanknotesIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                          <dd className="text-lg font-medium text-gray-900">{analytics.totalTransactions || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                          <dd className="text-lg font-medium text-gray-900">₹{(analytics.totalRevenue || 0).toLocaleString()}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <SparklesIcon className="h-8 w-8 text-orange-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Trial Users</dt>
                          <dd className="text-lg font-medium text-gray-900">{analytics.trialUsers || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Active Subscriptions</dt>
                          <dd className="text-lg font-medium text-gray-900">{analytics.activeSubscriptions || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">System Health</dt>
                          <dd className="text-lg font-medium text-gray-900">{(analytics.systemHealth || 0).toFixed(1)}%</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Monthly Growth</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {analytics.monthlyGrowth >= 0 ? '+' : ''}{(analytics.monthlyGrowth || 0).toFixed(1)}%
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center">
                  <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
                  <p className="mt-1 text-sm text-gray-500">Unable to load analytics data. Please try again.</p>
                  <div className="mt-6">
                    <button
                      onClick={fetchAnalytics}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'data-sync' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Data Synchronization</h3>
            <p className="text-gray-600">Data sync functionality is being loaded...</p>
          </div>
        )}

        {activeTab === 'ai-assistant' && (
          <AdminAIChat />
        )}

        {activeTab === 'payments' && (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <BanknotesIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">Payment Management</h2>
            <p className="text-gray-600 mb-4">Advanced payment processing, merchant management, and transaction monitoring tools.</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">Coming Soon</p>
              <p className="text-yellow-700 text-sm">This feature is under development and will be available in the next release.</p>
            </div>
          </div>
        )}

        {activeTab === 'trade-analytics' && (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">Trade Journal Analytics</h2>
            <p className="text-gray-600 mb-4">Comprehensive trading analytics, portfolio insights, and performance metrics for all users.</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">Coming Soon</p>
              <p className="text-yellow-700 text-sm">Advanced trading analytics dashboard is being developed.</p>
            </div>
          </div>
        )}
      </div>

      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  required
                  value={userForm.firstName}
                  onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  required
                  value={userForm.lastName}
                  onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Initial Balance</label>
                <input
                  type="number"
                  value={userForm.balance}
                  onChange={(e) => setUserForm({...userForm, balance: parseFloat(e.target.value) || 0})}
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
                  onClick={() => setShowCreateUser(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetPassword && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Reset Password for {selectedUser.firstName} {selectedUser.lastName}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter new password"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleResetPassword(selectedUser._id)}
                  disabled={!newPassword}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => {
                    setShowResetPassword(false);
                    setNewPassword('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminDashboard;
