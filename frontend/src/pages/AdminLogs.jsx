import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import apiClient from '../services/api/client';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchLogs();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchLogs = async () => {
    try {
      // First try to get telemetry data (comprehensive logs)
      try {
        const telemetryResponse = await apiClient.get('/admin/telemetry', {
          params: {
            limit: 100,
            level: filter === 'all' ? undefined : filter
          }
        });
        
        if (telemetryResponse.data && telemetryResponse.data.success) {
          const telemetryLogs = telemetryResponse.data.data.map(log => ({
            id: log._id || log.correlationId,
            timestamp: log.timestamp,
            level: log.level,
            message: log.message,
            service: log.service || 'quickpe-backend',
            category: log.category,
            event: log.event,
            userId: log.userId,
            error: log.data?.error || log.stack,
            details: log.data ? JSON.stringify(log.data, null, 2) : undefined,
            responseTime: log.responseTime,
            method: log.method,
            url: log.url,
            statusCode: log.statusCode,
            tags: log.tags
          }));
          setLogs(telemetryLogs);
          return;
        }
      } catch (telemetryError) {
        console.log('Telemetry API not available, trying file logs...');
      }
      
      // Fallback to file-based logs
      const response = await apiClient.get('/admin/logs', {
        params: {
          limit: 100,
          level: filter === 'all' ? undefined : filter
        }
      });
      
      if (response.data && response.data.success) {
        setLogs(response.data.logs || []);
      } else {
        // Final fallback to empty logs
        setLogs([]);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error.response?.data?.message || error.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getLogBadgeColor = (level) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.level === filter);

  const exportLogs = async (format) => {
    try {
      const response = await apiClient.get('/admin/telemetry/export', {
        params: {
          format,
          level: filter === 'all' ? undefined : filter
        },
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      
      if (format === 'csv') {
        // Handle CSV download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quickpe-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Handle JSON download
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quickpe-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      toast.success(`Logs exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export logs');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ServerIcon className="h-8 w-8 text-emerald-600 mr-3" />
                System Logs
              </h1>
              <p className="text-gray-600 mt-2">Monitor system events and errors in real-time</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </button>
              
              <button
                onClick={fetchLogs}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => exportLogs('json')}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => exportLogs('csv')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <div className="flex space-x-2">
              {['all', 'error', 'warning', 'info'].map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === level
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-sm rounded-lg overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading logs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getLogIcon(log.level)}
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getLogBadgeColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {log.service}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.message}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.error && (
                          <div className="text-red-600 font-mono text-xs">
                            {log.error}
                          </div>
                        )}
                        {log.details && (
                          <div className="text-gray-600 text-xs">
                            {log.details}
                          </div>
                        )}
                        {log.userId && (
                          <div className="text-blue-600 text-xs">
                            User: {log.userId}
                          </div>
                        )}
                        {log.transactionId && (
                          <div className="text-green-600 text-xs">
                            TXN: {log.transactionId}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredLogs.length === 0 && (
                <div className="p-8 text-center">
                  <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No logs found for the selected filter.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminLogs;
