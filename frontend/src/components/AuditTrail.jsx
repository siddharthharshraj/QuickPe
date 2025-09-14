import { useState, useEffect } from "react";
import apiClient from "../services/api/client";
import io from 'socket.io-client';

export const AuditTrail = () => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState({
        action_type: "",
        from_date: "",
        to_date: ""
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });
    const [stats, setStats] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Initialize socket connection for real-time audit log updates
        const socketConnection = io('http://localhost:5001');
        setSocket(socketConnection);

        // Listen for audit log updates
        socketConnection.on('auditLogUpdate', (auditData) => {
            console.log('Audit log update received:', auditData);
            setAuditLogs(prev => {
                // Check if audit log already exists to avoid duplicates
                const exists = prev.some(log => log._id === auditData._id);
                if (exists) return prev;
                
                // Add new audit log at the beginning for chronological order
                const updated = [auditData, ...prev];
                // Sort by created_at to maintain chronological order
                return updated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            });
        });

        // Listen for cache invalidation events
        socketConnection.on('cacheInvalidate', (data) => {
            console.log('Cache invalidation received in AuditTrail:', data);
            if (data.patterns && data.patterns.includes('audit')) {
                // Refresh audit logs immediately
                fetchAuditLogs();
            }
        });

        return () => {
            socketConnection.disconnect();
        };
    }, []);

    const fetchAuditLogs = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString()
            });

            // Add filters
            if (filters.action_type) params.append('action_type', filters.action_type);
            if (filters.from_date) params.append('from_date', filters.from_date);
            if (filters.to_date) params.append('to_date', filters.to_date);

            const response = await apiClient.get(`/audit?${params}`);
            
            if (response.data && response.data.audit_logs) {
                setAuditLogs(response.data.audit_logs);
                setPagination(prev => ({
                    ...prev,
                    page,
                    total: response.data.pagination?.total || 0,
                    pages: response.data.pagination?.pages || 0
                }));
            }
        } catch (err) {
            setError("Failed to fetch audit logs");
            console.error("Audit logs fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.from_date) params.append('from_date', filters.from_date);
            if (filters.to_date) params.append('to_date', filters.to_date);

            const response = await apiClient.get(`/audit/stats?${params}`);
            if (response.data) {
                setStats(response.data);
            }
        } catch (err) {
            console.error("Stats fetch error:", err);
        }
    };

    useEffect(() => {
        fetchAuditLogs(1);
        fetchStats();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            action_type: "",
            from_date: "",
            to_date: ""
        });
    };

    const getActionIcon = (actionType) => {
        const icons = {
            'money_sent': '💸',
            'money_received': '💰',
            'user_login': '🔐',
            'user_signup': '👤',
            'account_created': '🏦',
            'profile_updated': '✏️',
            'password_changed': '🔑'
        };
        return icons[actionType] || '📋';
    };

    const getActionColor = (actionType) => {
        const colors = {
            'money_sent': 'text-red-600 bg-red-50',
            'money_received': 'text-green-600 bg-green-50',
            'user_login': 'text-blue-600 bg-blue-50',
            'user_signup': 'text-purple-600 bg-purple-50',
            'account_created': 'text-indigo-600 bg-indigo-50',
            'profile_updated': 'text-yellow-600 bg-yellow-50',
            'password_changed': 'text-orange-600 bg-orange-50'
        };
        return colors[actionType] || 'text-gray-600 bg-gray-50';
    };

    const formatActionType = (actionType) => {
        return actionType.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    if (loading && auditLogs.length === 0) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center">
                            <div className="text-2xl mr-3">📊</div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Logs</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_logs}</p>
                            </div>
                        </div>
                    </div>
                    {stats.action_type_stats.slice(0, 3).map((stat, index) => (
                        <div key={stat._id} className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center">
                                <div className="text-2xl mr-3">{getActionIcon(stat._id)}</div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{formatActionType(stat._id)}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Filter Audit Logs</h3>
                    <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Clear All
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Action Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                        <select
                            value={filters.action_type}
                            onChange={(e) => handleFilterChange('action_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Actions</option>
                            <option value="money_sent">Money Sent</option>
                            <option value="money_received">Money Received</option>
                            <option value="user_login">User Login</option>
                            <option value="user_signup">User Signup</option>
                            <option value="account_created">Account Created</option>
                            <option value="profile_updated">Profile Updated</option>
                            <option value="password_changed">Password Changed</option>
                        </select>
                    </div>

                    {/* Date From */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                        <input
                            type="date"
                            value={filters.from_date}
                            onChange={(e) => handleFilterChange('from_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                        <input
                            type="date"
                            value={filters.to_date}
                            onChange={(e) => handleFilterChange('to_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Audit Logs Timeline */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
                        <div className="text-sm text-gray-500">
                            {pagination.total} total entries
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                        {error}
                    </div>
                )}

                <div className="p-4">
                    {auditLogs.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <div className="text-4xl mb-2">🔍</div>
                            <p>No audit logs found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {auditLogs.map((log, index) => (
                                <div key={log._id} className="flex items-start space-x-4">
                                    {/* Timeline connector */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getActionColor(log.action_type)}`}>
                                            {getActionIcon(log.action_type)}
                                        </div>
                                        {index < auditLogs.length - 1 && (
                                            <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                                        )}
                                    </div>

                                    {/* Log content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {formatActionType(log.action_type)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(log.created_at).toLocaleString('en-IN', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {log.ip_address}
                                            </div>
                                        </div>

                                        {/* Payload details */}
                                        {log.payload && Object.keys(log.payload).length > 0 && (
                                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                    {Object.entries(log.payload).map(([key, value]) => (
                                                        <div key={key}>
                                                            <span className="font-medium text-gray-600">
                                                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                                            </span>
                                                            <span className="ml-2 text-gray-900">
                                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Entity info */}
                                        {log.entity_type && (
                                            <div className="mt-2 text-xs text-gray-500">
                                                Entity: {log.entity_type} {log.entity_id && `(${log.entity_id})`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Page {pagination.page} of {pagination.pages}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => fetchAuditLogs(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => fetchAuditLogs(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.pages}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default AuditTrail;
