import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, DocumentArrowDownIcon, ShieldCheckIcon, FunnelIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import apiClient from '../services/api/client';
import { CSVExportButton } from '../components/LazyPDFComponents';

const AuditTrail = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [stats, setStats] = useState({});
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        actionType: '',
        page: 1,
        limit: 50
    });
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0,
        has_more: false
    });
    const [logsLoading, setLogsLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportDates, setExportDates] = useState({
        fromDate: '',
        toDate: ''
    });

    useEffect(() => {
        fetchAuditStats();
        fetchUserInfo();
        fetchAuditLogs();
        
        // Set up real-time updates
        const handleAuditUpdate = () => {
            fetchAuditLogs();
            fetchAuditStats();
        };
        
        window.addEventListener('auditLogUpdate', handleAuditUpdate);
        
        return () => {
            window.removeEventListener('auditLogUpdate', handleAuditUpdate);
        };
    }, []);

    useEffect(() => {
        fetchAuditLogs();
    }, [filters.page]);

    const fetchAuditStats = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
            if (filters.toDate) queryParams.append('toDate', filters.toDate);
            
            const response = await apiClient.get(`/audit/stats?${queryParams}`);
            
            if (response.data && response.data.success) {
                setStats({
                    totalLogs: response.data.totalLogs || 0,
                    recentLogs: response.data.recentLogs || 0,
                    securityScore: response.data.securityScore || 'Good',
                    recentLogs7d: response.data.recentLogs7d || 0,
                    recentLogs24h: response.data.recentLogs24h || 0,
                    actionTypeStats: response.data.actionTypeStats || []
                });
            }
        } catch (error) {
            console.error('Error fetching audit stats:', error);
            toast.error('Failed to load audit statistics');
            setStats({
                totalLogs: 0,
                recentLogs: 0,
                securityScore: 'Good'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchUserInfo = async () => {
        try {
            const response = await apiClient.get('/auth/profile');
            console.log('User profile response:', response.data);
            if (response.data && response.data.success) {
                setUserInfo(response.data.user);
                console.log('User info set:', response.data.user);
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            setLogsLoading(true);
            const queryParams = new URLSearchParams({
                page: filters.page.toString(),
                limit: filters.limit.toString()
            });
            
            if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
            if (filters.toDate) queryParams.append('toDate', filters.toDate);
            if (filters.actionType) queryParams.append('actionType', filters.actionType);
            
            const response = await apiClient.get(`/audit?${queryParams}`);
            
            if (response.data && response.data.success) {
                setAuditLogs(response.data.audit_logs || []);
                setPagination(response.data.pagination || {
                    page: 1,
                    pages: 1,
                    total: 0,
                    has_more: false
                });
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            toast.error('Failed to load audit logs');
            setAuditLogs([]);
        } finally {
            setLogsLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1 // Reset to first page when filters change
        }));
    };

    const applyFilters = () => {
        fetchAuditLogs();
        fetchAuditStats();
    };

    const clearFilters = () => {
        setFilters({
            fromDate: '',
            toDate: '',
            actionType: '',
            page: 1,
            limit: 50
        });
        setTimeout(() => {
            fetchAuditLogs();
            fetchAuditStats();
        }, 100);
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUCCESS': return 'text-green-600 bg-green-100';
            case 'FAILURE': return 'text-red-600 bg-red-100';
            case 'WARNING': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const actionTypeOptions = [
        { value: '', label: 'All Actions' },
        { value: 'login', label: 'Login' },
        { value: 'logout', label: 'Logout' },
        { value: 'money_sent', label: 'Money Sent' },
        { value: 'money_received', label: 'Money Received' },
        { value: 'money_added', label: 'Money Added' },
        { value: 'balance_updated', label: 'Balance Updated' },
        { value: 'password_changed', label: 'Password Changed' },
        { value: 'profile_viewed', label: 'Profile Viewed' },
        { value: 'dashboard_accessed', label: 'Dashboard Accessed' },
        { value: 'pdf_exported', label: 'PDF Exported' }
    ];

    const downloadAuditTrail = async (hasCustomDates = false) => {
        try {
            setLoading(true);
            
            // Build query params for custom date export
            const queryParams = new URLSearchParams();
            if (hasCustomDates) {
                if (exportDates.fromDate) {
                    queryParams.append('fromDate', exportDates.fromDate);
                }
                if (exportDates.toDate) {
                    queryParams.append('toDate', exportDates.toDate);
                }
            }
            // Always limit to 50 latest trails
            queryParams.append('limit', '50');
            
            const endpoint = `/audit/download-trail${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await apiClient.get(endpoint, {
                responseType: 'blob'
            });
            
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Get filename from response headers or create default
            const contentDisposition = response.headers['content-disposition'];
            const dateStr = new Date().toISOString().split('T')[0];
            let filename = `QuickPe-AuditTrail-${dateStr}.pdf`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Error downloading audit trail:', error);
            alert('Failed to download audit trail. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <ArrowLeftIcon className="h-4 w-4" />
                                <span>Back to Dashboard</span>
                            </button>
                            <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                                <ShieldCheckIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Audit Trail</h1>
                                <p className="text-slate-600">Download your complete activity history</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200"
                            >
                                <FunnelIcon className="h-5 w-5" />
                                <span>Filters</span>
                            </button>
                            
                            {auditLogs.length > 0 && (
                                <CSVExportButton
                                    data={auditLogs}
                                    filename="audit-trail-report"
                                />
                            )}
                            
                            <button
                                onClick={() => setShowExportModal(true)}
                                disabled={loading}
                                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <DocumentArrowDownIcon className="h-5 w-5" />
                                <span>Export PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters Section */}
                {showFilters && (
                    <motion.div
                        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Filter Audit Logs</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
                                <input
                                    type="date"
                                    value={filters.fromDate}
                                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
                                <input
                                    type="date"
                                    value={filters.toDate}
                                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Action Type</label>
                                <select
                                    value={filters.actionType}
                                    onChange={(e) => handleFilterChange('actionType', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    {actionTypeOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end space-x-2">
                                <button
                                    onClick={applyFilters}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
                {/* Info Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                >
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Total Activities</h3>
                                <p className="text-2xl font-bold text-blue-600">{stats.totalLogs || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <DocumentArrowDownIcon className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Last 30 Days</h3>
                                <p className="text-2xl font-bold text-emerald-600">{stats.recentLogs || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Security Score</h3>
                                <p className="text-2xl font-bold text-purple-600">Excellent</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Audit Logs Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden mb-8"
                >
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-slate-900">Detailed Audit Log</h2>
                        <p className="text-slate-600 text-sm mt-1">
                            Showing {auditLogs.length} of {pagination.total} records
                        </p>
                    </div>
                    
                    {logsLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : auditLogs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {auditLogs.map((log, index) => (
                                        <tr key={log.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDateTime(log.timestamp)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {log.action}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.actor}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {log.target}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.ip_address}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No audit logs found for the selected criteria.</p>
                        </div>
                    )}
                    
                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Page {pagination.page} of {pagination.pages}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={!pagination.has_more}
                                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Description */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8"
                >
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">What's Included in Your Audit Trail</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">Login Activities</h4>
                                    <p className="text-slate-600 text-sm">All signin and signout events with timestamps</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">Transaction History</h4>
                                    <p className="text-slate-600 text-sm">Money transfers, deposits, and withdrawals</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">Profile Changes</h4>
                                    <p className="text-slate-600 text-sm">Updates to personal information and settings</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">Security Events</h4>
                                    <p className="text-slate-600 text-sm">Password changes and security updates</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">System Access</h4>
                                    <p className="text-slate-600 text-sm">IP addresses and device information</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">Unique Activity IDs</h4>
                                    <p className="text-slate-600 text-sm">Each activity has a unique identifier for tracking</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="flex items-start space-x-3">
                            <ShieldCheckIcon className="h-5 w-5 text-emerald-600 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-emerald-900">Privacy & Security</h4>
                                <p className="text-emerald-700 text-sm mt-1">
                                    Your audit trail is generated in real-time and contains only your personal activity data. 
                                    This information is securely stored and only accessible to you and authorized administrators.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Export PDF Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                    >
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Export Audit Trail PDF</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    From Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={exportDates.fromDate}
                                    onChange={(e) => setExportDates(prev => ({ ...prev, fromDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    To Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={exportDates.toDate}
                                    onChange={(e) => setExportDates(prev => ({ ...prev, toDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">
                                    {exportDates.fromDate || exportDates.toDate 
                                        ? `Export will include up to 50 trails from selected date range.`
                                        : `Leave dates empty to export the latest 50 audit trails.`
                                    }
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowExportModal(false);
                                    setExportDates({ fromDate: '', toDate: '' });
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    downloadAuditTrail(exportDates.fromDate || exportDates.toDate);
                                    setShowExportModal(false);
                                }}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Exporting...' : 'Export PDF'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AuditTrail;
