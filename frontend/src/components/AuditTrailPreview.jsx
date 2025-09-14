import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClockIcon, 
  DocumentArrowDownIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';
import apiClient from '../services/api/client';

const AuditTrailPreview = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
    
    // Listen for real-time audit log updates
    const handleAuditLogUpdate = (event) => {
      console.log('📋 Audit log update received in preview:', event.detail);
      fetchAuditLogs(); // Refresh audit logs
    };

    window.addEventListener('auditLogUpdate', handleAuditLogUpdate);
    
    return () => {
      window.removeEventListener('auditLogUpdate', handleAuditLogUpdate);
    };
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/audit/my-logs?limit=3');
      
      if (response.data && response.data.success) {
        setAuditLogs(response.data.auditLogs);
      }
    } catch (err) {
      setError('Failed to fetch audit logs');
      console.error('Audit logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType) => {
    const icons = {
      'money_sent': '💸',
      'money_received': '💰',
      'money_added': '💳',
      'login': '🔐',
      'user_created': '👤',
      'dashboard_accessed': '🏠',
      'profile_viewed': '👁️',
      'transaction_created': '💱',
      'balance_updated': '💰',
      'pdf_exported': '📄'
    };
    return icons[actionType] || '📋';
  };

  const getActionColor = (actionType) => {
    const colors = {
      'money_sent': 'text-red-600 bg-red-50',
      'money_received': 'text-green-600 bg-green-50',
      'money_added': 'text-blue-600 bg-blue-50',
      'login': 'text-purple-600 bg-purple-50',
      'user_created': 'text-indigo-600 bg-indigo-50',
      'dashboard_accessed': 'text-emerald-600 bg-emerald-50',
      'profile_viewed': 'text-yellow-600 bg-yellow-50',
      'transaction_created': 'text-orange-600 bg-orange-50',
      'balance_updated': 'text-teal-600 bg-teal-50',
      'pdf_exported': 'text-gray-600 bg-gray-50'
    };
    return colors[actionType] || 'text-gray-600 bg-gray-50';
  };

  const formatActionType = (actionType) => {
    return actionType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      const response = await apiClient.get('/audit/download-trail', {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'QuickPe-AuditTrail.pdf';
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
      
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download audit trail PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-sm">{error}</div>
        <button 
          onClick={fetchAuditLogs}
          className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Download PDF Button */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          <span>{isDownloading ? 'Generating...' : 'Export PDF'}</span>
        </motion.button>
      </div>

      {/* Audit Logs List */}
      {auditLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No recent activity found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {auditLogs.map((log, index) => (
            <motion.div
              key={log._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Action Icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getActionColor(log.action_type)}`}>
                {getActionIcon(log.action_type)}
              </div>

              {/* Log Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {formatActionType(log.action_type)}
                  </p>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {formatTimeAgo(log.created_at)}
                  </span>
                </div>
                
                {/* Additional Details */}
                {log.payload && Object.keys(log.payload).length > 0 && (
                  <div className="mt-1">
                    {log.payload.amount && (
                      <p className="text-xs text-gray-600">
                        Amount: ₹{log.payload.amount.toLocaleString('en-IN')}
                      </p>
                    )}
                    {log.payload.recipient && (
                      <p className="text-xs text-gray-600">
                        To: {log.payload.recipient}
                      </p>
                    )}
                    {log.payload.sender && (
                      <p className="text-xs text-gray-600">
                        From: {log.payload.sender}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {log.ip_address && (
                    <span className="text-xs text-gray-400">
                      {log.ip_address}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* View All Link */}
      {auditLogs.length > 0 && (
        <div className="text-center pt-2">
          <button 
            onClick={() => window.location.href = '/audit-trail'}
            className="flex items-center justify-center space-x-1 text-sm text-blue-600 hover:text-blue-700 font-medium mx-auto"
          >
            <EyeIcon className="h-4 w-4" />
            <span>View Complete Audit Trail</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditTrailPreview;
