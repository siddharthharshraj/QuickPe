import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Settings,
  BarChart3,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import UserManagement from '../../components/UserManagement';

const KPICard = ({ title, value, change, trend, icon: Icon, color = 'emerald' }) => {
  const colorClasses = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <motion.div
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
          {change && (
            <>
              <span className="font-medium">{change}</span>
              <TrendingUp className={`w-4 h-4 ml-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
            </>
          )}
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-gray-600 text-sm">{title}</p>
      </div>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const { isAdmin, adminLevel } = useFeatureFlags();
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    monthlyRevenue: 0,
    systemHealth: 'good',
    loading: true
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch real-time data from backend
      const [usersResponse, subscriptionResponse] = await Promise.all([
        fetch('/api/admin/users?limit=1', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/subscription-analytics', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const usersData = await usersResponse.json();
      const subscriptionData = await subscriptionResponse.json();

      setDashboardData({
        totalUsers: subscriptionData.totalUsers || 0,
        activeSubscribers: subscriptionData.activeSubscriptions || 0,
        trialUsers: subscriptionData.trialUsers || 0,
        expiredUsers: subscriptionData.expiredSubscriptions || 0,
        systemHealth: 'good',
        loading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to demo data
      setDashboardData({
        totalUsers: 8542,
        activeSubscribers: 2341,
        trialUsers: 4523,
        expiredUsers: 1678,
        systemHealth: 'good',
        loading: false
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, Administrator (Level {adminLevel})
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">System Healthy</span>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Users"
            value={dashboardData.totalUsers.toLocaleString()}
            change="+12.5%"
            trend="up"
            icon={Users}
            color="blue"
          />
          <KPICard
            title="Active Subscribers"
            value={dashboardData.activeSubscribers.toLocaleString()}
            change="+8.2%"
            trend="up"
            icon={CheckCircle}
            color="emerald"
          />
          <KPICard
            title="Trial Users"
            value={dashboardData.trialUsers?.toLocaleString() || '0'}
            change="+15.3%"
            trend="up"
            icon={Activity}
            color="orange"
          />
          <KPICard
            title="Expired Users"
            value={dashboardData.expiredUsers?.toLocaleString() || '0'}
            change="+8.3%"
            trend="up"
            icon={TrendingUp}
            color="emerald"
          />
          <KPICard
            title="Monthly Revenue"
            value={`₹${(dashboardData.monthlyRevenue / 1000).toFixed(0)}K`}
            change="+23.1%"
            trend="up"
            icon={DollarSign}
            color="purple"
          />
          <KPICard
            title="System Health"
            value="99.9%"
            change="Uptime"
            trend="up"
            icon={Activity}
            color="orange"
          />
        </div>

        {/* User Management Section */}
        <div className="mb-8">
          <UserManagement />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Management */}
          <motion.div
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">User Management</h3>
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Active Users Today</span>
                <span className="font-semibold text-emerald-600">3,421</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">New Signups (24h)</span>
                <span className="font-semibold text-blue-600">127</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Conversion Rate</span>
                <span className="font-semibold text-purple-600">{dashboardData.conversionRate}%</span>
              </div>
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
              Manage Users
            </button>
          </motion.div>

          {/* Revenue Analytics */}
          <motion.div
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Revenue Analytics</h3>
              <BarChart3 className="w-6 h-6 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Basic Plan Revenue</span>
                <span className="font-semibold text-blue-600">₹128K</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Premium Plan Revenue</span>
                <span className="font-semibold text-emerald-600">₹99K</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Churn Rate</span>
                <span className="font-semibold text-red-600">{dashboardData.churnRate}%</span>
              </div>
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              View Analytics
            </button>
          </motion.div>
        </div>

        {/* System Alerts */}
        <motion.div
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">System Alerts</h3>
            <AlertTriangle className="w-6 h-6 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800">All systems operational</span>
              <span className="text-green-600 text-sm ml-auto">2 min ago</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800">High CPU usage on DB server (78%)</span>
              <span className="text-yellow-600 text-sm ml-auto">15 min ago</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800">Scheduled maintenance completed successfully</span>
              <span className="text-blue-600 text-sm ml-auto">1 hour ago</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
