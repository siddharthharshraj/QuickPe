import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5001', // Backend server URL
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh-token'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (userData) => api.put('/user/profile', userData),
  changePassword: (passwords) => api.put('/user/password', passwords),
};

// Account API
export const accountAPI = {
  getBalance: () => api.get('/account/balance'),
  addMoney: (amount) => api.post('/account/deposit', { amount }),
  sendMoney: (data) => api.post('/account/transfer', data),
  getTransactions: (params) => api.get('/account/transactions', { params }),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getSpendingByCategory: () => api.post('/analytics/spending-by-category'),
  getMonthlyTrends: () => api.get('/analytics/monthly-trends'),
};

// Admin API
export const adminAPI = {
  // User Management
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Analytics
  getAdminAnalytics: () => api.get('/admin/analytics'),
  getTradeAnalytics: (params) => api.get('/admin/trade-analytics', { params }),
  getSystemHealth: () => api.get('/admin/system-health'),

  // System Management
  getDatabaseStats: () => api.get('/admin/database-stats'),
  getSystemLogs: () => api.get('/admin/logs'),
  exportLogs: (format) => api.get(`/admin/logs/export?format=${format}`, { responseType: 'blob' }),

  // Feature Flags
  getFeatureFlags: () => api.get('/admin/feature-flags'),
  updateFeatureFlag: (id, data) => api.put(`/admin/feature-flags/${id}`, data),

  // User Subscriptions
  updateUserSubscription: (userId, data) => api.put(`/admin/users/${userId}/subscription`, data),

  // System Settings
  updateSystemSettings: (settings) => api.put('/admin/settings', settings),

  // Transactions
  getUserTransactions: (userId, params) => api.get(`/admin/users/${userId}/transactions`, { params }),

  // System Maintenance
  clearCache: () => api.post('/admin/maintenance/clear-cache'),
  runDatabaseBackup: () => api.post('/admin/maintenance/backup'),

  // Notifications
  sendNotification: (data) => api.post('/admin/notifications', data),
  getNotifications: (params) => api.get('/admin/notifications', { params }),

  // Audit Logs
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),

  // System Analytics
  getSystemAnalytics: () => api.get('/admin/system-analytics'),

  // Telemetry
  getTelemetry: (params) => api.get('/admin/telemetry', { params }),
  exportTelemetry: (format) => api.get(`/admin/telemetry/export?format=${format}`, { responseType: 'blob' }),
  getTelemetryAnalytics: (params) => api.get('/admin/telemetry/analytics', { params })
};

export default api;
