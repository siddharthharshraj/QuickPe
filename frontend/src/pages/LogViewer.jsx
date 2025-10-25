import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MagnifyingGlassIcon, 
    ArrowDownTrayIcon, 
    ArrowPathIcon,
    FunnelIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XCircleIcon,
    CheckCircleIcon,
    ClockIcon,
    ServerIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import api from '../services/api/client';

const LogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(null);
    
    // Filters
    const [filters, setFilters] = useState({
        level: 'all',
        search: '',
        limit: 100,
        offset: 0
    });
    
    // UI State
    const [showFilters, setShowFilters] = useState(false);
    const [expandedLogs, setExpandedLogs] = useState(new Set());

    /**
     * Fetch logs from the API
     */
    const fetchLogs = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'all') {
                    params.append(key, value);
                }
            });

            const response = await api.get(`/logs?${params.toString()}`);
            
            if (response.data.success) {
                setLogs(response.data.data.logs || []);
            } else {
                throw new Error(response.data.message || 'Failed to fetch logs');
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch logs');
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [filters]);

    /**
     * Fetch log statistics
     */
    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get('/logs/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching log stats:', err);
        }
    }, []);

    /**
     * Download logs as JSON
     */
    const downloadLogs = async () => {
        try {
            setLoading(true);
            
            const params = new URLSearchParams();
            if (filters.level !== 'all') params.append('level', filters.level);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(`/logs/download?${params.toString()}`, {
                responseType: 'blob'
            });

            // Create download link
            const blob = new Blob([JSON.stringify(response.data, null, 2)], {
                type: 'application/json'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `quickpe-logs-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading logs:', err);
            setError('Failed to download logs');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Toggle log expansion
     */
    const toggleLogExpansion = (index) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedLogs(newExpanded);
    };

    /**
     * Handle log export to external services
     */
    const handleExport = async (service) => {
        try {
            setLoading(true);
            
            const response = await api.post('/logs/export', {
                service,
                level: filters.level !== 'all' ? filters.level : undefined,
                startDate: filters.startDate,
                endDate: filters.endDate
            });

            if (response.data.success) {
                // Show success message
                setError(null);
                // You could add a toast notification here
                console.log(`Export to ${service} completed:`, response.data.data);
            } else {
                throw new Error(response.data.message || `Failed to export to ${service}`);
            }
        } catch (err) {
            console.error(`Error exporting to ${service}:`, err);
            setError(`Failed to export logs to ${service}: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get level badge styling
     */
    const getLevelBadge = (level) => {
        const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
        
        switch (level?.toLowerCase()) {
            case 'error':
                return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
            case 'warn':
            case 'warning':
                return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
            case 'info':
                return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
            case 'debug':
                return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
        }
    };

    /**
     * Get level icon
     */
    const getLevelIcon = (level) => {
        switch (level?.toLowerCase()) {
            case 'error':
                return <XCircleIcon className="w-4 h-4 text-red-500" />;
            case 'warn':
            case 'warning':
                return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
            case 'info':
                return <InformationCircleIcon className="w-4 h-4 text-blue-500" />;
            case 'debug':
                return <CheckCircleIcon className="w-4 h-4 text-gray-500" />;
            default:
                return <InformationCircleIcon className="w-4 h-4 text-gray-500" />;
        }
    };

    /**
     * Format timestamp
     */
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    // Auto-refresh disabled - manual refresh only
    useEffect(() => {
        // Auto-refresh functionality disabled to prevent memory issues
        // Use manual refresh button instead
        if (refreshInterval) {
            clearInterval(refreshInterval);
            setRefreshInterval(null);
        }
    }, [autoRefresh, fetchLogs]);

    // Initial load
    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [fetchLogs, fetchStats]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <ServerIcon className="w-8 h-8 text-emerald-600" />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Log Viewer</h1>
                                <p className="text-sm text-gray-500">Real-time application logs</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            {/* Auto-refresh toggle */}
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                                    autoRefresh
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <ArrowPathIcon className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                                Auto-refresh
                            </button>
                            
                            {/* Manual refresh */}
                            <button
                                onClick={() => fetchLogs()}
                                disabled={loading}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            
                            {/* Download logs */}
                            <button
                                onClick={downloadLogs}
                                disabled={loading}
                                className="inline-flex items-center px-3 py-2 border border-emerald-300 rounded-md text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ServerIcon className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-500">Total Logs</p>
                                    <p className="text-lg font-semibold text-gray-900">{stats.totalLogs}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <XCircleIcon className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-500">Errors</p>
                                    <p className="text-lg font-semibold text-gray-900">{stats.logLevels.error || 0}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-500">Warnings</p>
                                    <p className="text-lg font-semibold text-gray-900">{stats.logLevels.warn || 0}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ClockIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {stats.lastUpdated ? formatTimestamp(stats.lastUpdated) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            <FunnelIcon className="w-4 h-4 mr-2" />
                            Filters
                            <motion.div
                                animate={{ rotate: showFilters ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="ml-2"
                            >
                                ▼
                            </motion.div>
                        </button>
                    </div>
                    
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Log Level Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Log Level
                                        </label>
                                        <select
                                            value={filters.level}
                                            onChange={(e) => setFilters({ ...filters, level: e.target.value, offset: 0 })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="all">All Levels</option>
                                            <option value="error">Error</option>
                                            <option value="warn">Warning</option>
                                            <option value="info">Info</option>
                                            <option value="debug">Debug</option>
                                        </select>
                                    </div>
                                    
                                    {/* Search */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Search
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={filters.search}
                                                onChange={(e) => setFilters({ ...filters, search: e.target.value, offset: 0 })}
                                                placeholder="Search logs..."
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                    
                                    {/* Limit */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Limit
                                        </label>
                                        <select
                                            value={filters.limit}
                                            onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), offset: 0 })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value={50}>50 logs</option>
                                            <option value={100}>100 logs</option>
                                            <option value={200}>200 logs</option>
                                            <option value={500}>500 logs</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <XCircleIcon className="w-5 h-5 text-red-400 mr-2" />
                            <p className="text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                {/* Logs Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Application Logs ({logs.length})
                        </h3>
                    </div>
                    
                    {loading && logs.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <ArrowPathIcon className="w-8 h-8 text-emerald-600 animate-spin mr-3" />
                            <span className="text-gray-600">Loading logs...</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <ServerIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No logs found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Timestamp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Level
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Message
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log, index) => (
                                        <React.Fragment key={index}>
                                            <tr className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                    {formatTimestamp(log.timestamp)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {getLevelIcon(log.level)}
                                                        <span className={`ml-2 ${getLevelBadge(log.level)}`}>
                                                            {log.level?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 font-mono max-w-md">
                                                    <div className="truncate">
                                                        {log.message}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {log.category || 'general'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <button
                                                        onClick={() => toggleLogExpansion(index)}
                                                        className="text-emerald-600 hover:text-emerald-900"
                                                    >
                                                        {expandedLogs.has(index) ? (
                                                            <EyeSlashIcon className="w-4 h-4" />
                                                        ) : (
                                                            <EyeIcon className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                            
                                            {/* Expanded log details */}
                                            <AnimatePresence>
                                                {expandedLogs.has(index) && (
                                                    <motion.tr
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                                            <div className="text-sm">
                                                                <h4 className="font-medium text-gray-900 mb-2">Log Details</h4>
                                                                <pre className="bg-gray-100 rounded p-3 text-xs overflow-x-auto font-mono">
                                                                    {JSON.stringify(log, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Export Features */}
                <div className="mt-6 bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Log Export</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <span className="text-emerald-600 text-sm">📊</span>
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Database Storage</p>
                                <p className="text-xs text-gray-500">All logs stored in MongoDB</p>
                            </div>
                            <div className="ml-auto">
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
                                    Active
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <span className="text-yellow-600 text-sm">🚀</span>
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Sentry Export</p>
                                <p className="text-xs text-gray-500">Error tracking ready</p>
                            </div>
                            <div className="ml-auto">
                                <button
                                    onClick={() => handleExport('sentry')}
                                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium hover:bg-yellow-200 transition-colors"
                                >
                                    Export
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 text-sm">⚡</span>
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">ELK Stack</p>
                                <p className="text-xs text-gray-500">Elasticsearch ready</p>
                            </div>
                            <div className="ml-auto">
                                <button
                                    onClick={() => handleExport('elk')}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                                >
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Export Information</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li>• All logs are automatically stored in MongoDB with full metadata</li>
                            <li>• Export functions are ready for Sentry and ELK Stack integration</li>
                            <li>• Logs include user context, error details, and performance metrics</li>
                            <li>• Export status tracking prevents duplicate exports</li>
                            <li>• Batch processing ensures efficient data transfer</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogViewer;
