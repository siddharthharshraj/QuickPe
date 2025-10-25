import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CircleStackIcon,
  ServerIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CpuChipIcon,
  SignalIcon,
  BoltIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import apiClient from '../services/api/client';
import { useSocket } from '../sockets/useSocket';

const AdminDatabaseEnhanced = () => {
  const navigate = useNavigate();
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(false); // Disabled by default - admin can enable
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds when enabled
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    fetchDatabaseStats();
    
    // Real-time auto-refresh
    const interval = setInterval(() => {
      if (isLive) {
        fetchDatabaseStats();
      }
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [isLive, refreshInterval]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleDbUpdate = () => {
      fetchDatabaseStats();
    };

    socket.on('database:update', handleDbUpdate);
    
    return () => {
      socket.off('database:update', handleDbUpdate);
    };
  }, [socket]);

  const fetchDatabaseStats = async () => {
    try {
      setLoading(true);
      
      const response = await apiClient.get('/admin/database-stats');
      
      if (response.data && response.data.success) {
        setDbStats(response.data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch database stats:', error);
      // Keep previous data if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'disconnected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />;
      case 'error':
      case 'disconnected':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />;
      default:
        return <CircleStackIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
      <Header />
      
      <div className="flex-1 pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center space-x-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Admin</span>
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <CircleStackIcon className="h-8 w-8 text-emerald-600" />
                  <span>Database Status</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full font-medium">
                    Single Source of Truth
                  </span>
                </h1>
                <p className="text-gray-600 mt-2">Real-time database monitoring and statistics</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Live Indicator */}
                <div className="flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {isLive ? 'Live' : 'Paused'}
                  </span>
                </div>

                {/* Refresh Controls */}
                <button
                  onClick={() => setIsLive(!isLive)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isLive
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isLive ? 'Pause' : 'Resume'}
                </button>

                <button
                  onClick={fetchDatabaseStats}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-2">
                Last updated: {lastUpdated.toLocaleTimeString('en-IN')} • 
                Auto-refresh: {refreshInterval / 1000}s •
                WebSocket: {isConnected ? '✓ Connected' : '✗ Disconnected'}
              </p>
            )}
          </motion.div>

          {/* Connection Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <ServerIcon className="h-6 w-6 text-emerald-600" />
                <span>Connection Status</span>
              </h2>
              
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${getStatusColor(dbStats?.connection?.status)}`}>
                {getStatusIcon(dbStats?.connection?.status)}
                <span className="font-semibold capitalize">
                  {dbStats?.connection?.status || 'Unknown'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <ServerIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Host</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {dbStats?.connection?.host || 'N/A'}:{dbStats?.connection?.port || 'N/A'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CircleStackIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Database</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {dbStats?.connection?.database || 'N/A'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <ClockIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Uptime</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatUptime(dbStats?.connection?.uptime)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BoltIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Ping Time</span>
                </div>
                <p className="text-lg font-semibold text-emerald-600">
                  {dbStats?.connection?.pingTime || 'N/A'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Collections Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <ChartBarIcon className="h-6 w-6 text-emerald-600" />
              <span>Collections Statistics</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dbStats?.collections && Object.entries(dbStats.collections).map(([name, stats]) => (
                <div key={name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">{name}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Documents</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.count?.toLocaleString() || 0}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Size</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.size || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Size</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.avgObjSize || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Indexes</span>
                      <span className="text-sm font-semibold text-emerald-600">{stats.indexes || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Performance Metrics */}
          {dbStats?.performance && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <CpuChipIcon className="h-6 w-6 text-emerald-600" />
                <span>Performance Metrics</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-700 font-medium">Operations/sec</span>
                    <SignalIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {dbStats.performance.opsPerSecond || 0}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-green-700 font-medium">Active Connections</span>
                    <ServerIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {dbStats.performance.activeConnections || 0}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-purple-700 font-medium">Cache Hit Rate</span>
                    <ChartBarIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {dbStats.performance.cacheHitRate || 0}%
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-orange-700 font-medium">Avg Query Time</span>
                    <ClockIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    {dbStats.performance.avgQueryTime || 0}ms
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminDatabaseEnhanced;
