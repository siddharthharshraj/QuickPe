import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  UserCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api/client';
import { useSocket } from '../sockets/useSocket';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const MoneyRequests = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const { socket } = useSocket();
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fetch requests
  const fetchRequests = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const endpoint = activeTab === 'received' ? '/money-requests/received' : '/money-requests/sent';
      console.log('🔍 Fetching money requests:', endpoint, 'filter:', filter);
      
      const response = await apiClient.get(`${endpoint}?status=${filter}`);
      console.log('📦 Response:', response.data);
      
      if (response.data.success) {
        console.log('✅ Requests found:', response.data.data.requests.length);
        setRequests(response.data.data.requests);
      } else {
        console.log('❌ Response not successful');
      }
    } catch (error) {
      console.error('❌ Failed to fetch requests:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, filter]);

  // Initial load
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = () => {
      fetchRequests(true);
    };

    const handleRequestUpdate = () => {
      fetchRequests(true);
    };

    socket.on('money-request:new', handleNewRequest);
    socket.on('money-request:approved', handleRequestUpdate);
    socket.on('money-request:rejected', handleRequestUpdate);

    return () => {
      socket.off('money-request:new', handleNewRequest);
      socket.off('money-request:approved', handleRequestUpdate);
      socket.off('money-request:rejected', handleRequestUpdate);
    };
  }, [socket, fetchRequests]);

  // Approve request - show modal
  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };
  
  // Confirm approve
  const handleApproveConfirm = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      const response = await apiClient.post(`/money-requests/${selectedRequest._id}/approve`);
      
      if (response.data.success) {
        setShowApproveModal(false);
        setSuccessMessage(`Successfully sent ₹${selectedRequest.amount.toLocaleString()} to ${selectedRequest.requesterName}!`);
        setShowSuccessModal(true);
        fetchRequests(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  // Reject request - show modal
  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };
  
  // Confirm reject
  const handleRejectConfirm = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      const response = await apiClient.post(`/money-requests/${selectedRequest._id}/reject`, { 
        reason: rejectReason || 'No reason provided' 
      });
      
      if (response.data.success) {
        setShowRejectModal(false);
        setSuccessMessage(`Request from ${selectedRequest.requesterName} has been rejected.`);
        setShowSuccessModal(true);
        fetchRequests(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  // Cancel request
  const handleCancel = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    try {
      const response = await apiClient.post(`/money-requests/${requestId}/cancel`);
      
      if (response.data.success) {
        alert('Request cancelled');
        fetchRequests(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  // Refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  // Format time remaining
  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    
    return badges[status] || badges.pending;
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
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Money Requests</h1>
                <p className="text-gray-600 mt-1">Manage your money requests</p>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-1 mb-6 inline-flex"
          >
            <button
              onClick={() => setActiveTab('received')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'received'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Received
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'sent'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sent
            </button>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-4 mb-6"
          >
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              {['all', 'pending', 'approved', 'rejected'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Requests List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <CurrencyRupeeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No {filter !== 'all' ? filter : ''} requests found</p>
              </div>
            ) : (
              <AnimatePresence>
                {requests.map((request, index) => (
                  <motion.div
                    key={request._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="bg-emerald-100 rounded-full p-3">
                          <UserCircleIcon className="h-6 w-6 text-emerald-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {activeTab === 'received' ? request.requesterName : request.requesteeName}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {activeTab === 'received' ? request.requesterQuickpeId : request.requesteeQuickpeId}
                          </p>
                          
                          {request.description && (
                            <p className="text-sm text-gray-700 mb-3">{request.description}</p>
                          )}
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <CurrencyRupeeIcon className="h-4 w-4" />
                              <span className="font-semibold text-gray-900">
                                ₹{request.amount.toLocaleString()}
                              </span>
                            </div>
                            
                            {request.status === 'pending' && (
                              <div className="flex items-center space-x-2 text-yellow-600">
                                <ClockIcon className="h-4 w-4" />
                                <span>{formatTimeRemaining(request.expiresAt)}</span>
                              </div>
                            )}
                            
                            <span className="text-xs">
                              {new Date(request.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {request.status === 'pending' && (
                        <div className="flex items-center space-x-3 ml-4">
                          {activeTab === 'received' ? (
                            <>
                              <button
                                onClick={() => handleApproveClick(request)}
                                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleRejectClick(request)}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >
                                <XCircleIcon className="h-5 w-5" />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleCancel(request._id)}
                              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              <XCircleIcon className="h-5 w-5" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {request.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Rejection reason:</span> {request.rejectionReason}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </div>
      
      <Footer />
      
      {/* Approve Modal */}
      <AnimatePresence>
        {showApproveModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !processing && setShowApproveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Approve Request?</h3>
                <p className="text-gray-600 mb-6">
                  You are about to send <span className="font-bold text-emerald-600">₹{selectedRequest.amount.toLocaleString()}</span> to <span className="font-bold">{selectedRequest.requesterName}</span>
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold">₹{selectedRequest.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">To:</span>
                    <span className="font-semibold">{selectedRequest.requesterName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">QuickPe ID:</span>
                    <span className="font-semibold">{selectedRequest.requesterQuickpeId}</span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowApproveModal(false)}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveConfirm}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                  >
                    {processing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      'Confirm & Send'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !processing && setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircleIcon className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Reject Request?</h3>
                <p className="text-gray-600 mb-6">
                  You are about to reject the request from <span className="font-bold">{selectedRequest.requesterName}</span> for <span className="font-bold text-red-600">₹{selectedRequest.amount.toLocaleString()}</span>
                </p>
                
                <div className="mb-6 text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for rejection (optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g., Insufficient funds, Wrong request, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows="3"
                    disabled={processing}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectConfirm}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                  >
                    {processing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      'Confirm Reject'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
                <p className="text-gray-600 mb-6">{successMessage}</p>
                
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoneyRequests;
