import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import apiClient from '../services/api/client';
import { useSocket } from '../sockets/useSocket';

export const SystemLogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLive, setIsLive] = useState(true);
  const logsEndRef = useRef(null);
  const { socket } = useSocket();

  useEffect(() => {
    fetchLogs();
  }, []);

  // Real-time log updates via WebSocket
  useEffect(() => {
    if (!socket || !isLive) return;

    const handleNewLog = (log) => {
      setLogs(prev => [...prev, log].slice(-1000)); // Keep last 1000 logs
      if (autoScroll) {
        scrollToBottom();
      }
    };

    socket.on('system:log', handleNewLog);

    return () => {
      socket.off('system:log', handleNewLog);
    };
  }, [socket, isLive, autoScroll]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/logs?limit=500');
      if (response.data.success) {
        setLogs(response.data.data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getLogColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warn':
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'debug':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLogIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'warn':
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const downloadLogs = () => {
    const logsText = filteredLogs.map(log => 
      `[${new Date(log.timestamp).toISOString()}] [${log.level?.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quickpe-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level?.toLowerCase() === filterLevel.toLowerCase();
    const matchesSearch = !searchTerm || 
      log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.level?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <DocumentTextIcon className="h-7 w-7 text-emerald-600" />
          <span>System Logs</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {isLive ? '● Live' : '○ Paused'}
          </span>
        </h2>

        <div className="flex items-center space-x-3">
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
            onClick={downloadLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Download</span>
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-3">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="debug">Debug</option>
          </select>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Auto-scroll</span>
          </label>
        </div>
      </div>

      {/* Logs Display */}
      <div className="bg-gray-900 rounded-lg p-4 h-[600px] overflow-y-auto font-mono text-sm">
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No logs found</div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start space-x-3 p-3 rounded border ${getLogColor(log.level)}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.level)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="text-xs font-semibold uppercase">
                      {log.level || 'INFO'}
                    </span>
                    <span className="text-xs opacity-75">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="text-sm break-words">
                    {log.message}
                  </div>
                  
                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs opacity-75 overflow-x-auto">
                        {JSON.stringify(log.meta, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 bg-red-500 rounded-full"></span>
            <span>Errors: {logs.filter(l => l.level === 'error').length}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 bg-yellow-500 rounded-full"></span>
            <span>Warnings: {logs.filter(l => l.level === 'warn').length}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
            <span>Info: {logs.filter(l => l.level === 'info').length}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemLogsViewer;
