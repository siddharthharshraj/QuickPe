import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useSocketCache } from '../hooks/useSocketCache';
import { useTransactionSync } from '../hooks/useTransactionSync';
import { useSocket } from '../sockets/useSocket';
import apiClient from '../services/api/client';

export const RecentActivity = ({ onTransactionUpdate }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retrying, setRetrying] = useState(false);

    // Get user ID from localStorage for socket connection
    const userId = localStorage.getItem('userId');
    
    // Initialize bulletproof real-time system
    useSocketCache();
    const { socket, isConnected, connectionStatus } = useSocket(userId);
    const { syncState, manualRefresh } = useTransactionSync(userId, (newTransaction) => {
        // Handle new transaction updates
        setTransactions(prev => {
            const exists = prev.some(t => t._id === newTransaction._id);
            if (!exists) {
                return [newTransaction, ...prev].slice(0, 5); // Keep only 5 recent
            }
            return prev;
        });
    });

    useEffect(() => {
        // Listen for real-time transaction updates
        const handleNewTransaction = (event) => {
            console.log('New transaction event received in RecentActivity:', event.detail);
            // Refresh recent transactions when new transaction occurs
            fetchRecentTransactions();
        };

        const handleCacheInvalidate = (event) => {
            console.log('Cache invalidate event received in RecentActivity:', event.detail);
            const data = event.detail;
            if (data.patterns && data.patterns.includes('transactions')) {
                // Refresh recent transactions immediately
                fetchRecentTransactions();
            }
        };

        // Add event listeners for real-time updates
        window.addEventListener('newTransaction', handleNewTransaction);
        window.addEventListener('cacheInvalidate', handleCacheInvalidate);

        return () => {
            window.removeEventListener('newTransaction', handleNewTransaction);
            window.removeEventListener('cacheInvalidate', handleCacheInvalidate);
        };
    }, []);

    console.log('RecentActivity component initialized');

    const fetchRecentTransactions = async (showRetrying = false) => {
        try {
            if (showRetrying) {
                setRetrying(true);
            } else {
                setLoading(true);
            }
            setError(null);

            console.log('Fetching recent transactions from API...');
            const response = await apiClient.get('/account/transactions?limit=3&page=1');
            console.log('API response:', response.data);
            
            if (response.data && response.data.transactions) {
                console.log('Setting transactions:', response.data.transactions);
                setTransactions(response.data.transactions);
            } else {
                console.log('No transactions in response, setting empty array');
                setTransactions([]);
            }
        } catch (err) {
            console.error('Error fetching recent transactions:', err);
            console.error('Error details:', err.response);
            setError(err.response?.data?.message || 'Failed to load recent transactions');
            setTransactions([]);
        } finally {
            setLoading(false);
            setRetrying(false);
        }
    };

    useEffect(() => {
        console.log('RecentActivity component mounted, fetching transactions...');
        fetchRecentTransactions();
    }, []);

    // Listen for transaction updates and refresh data
    useEffect(() => {
        const handleTransactionUpdate = () => {
            console.log('Transaction update detected, refreshing recent activity...');
            fetchRecentTransactions();
        };

        // Listen for custom events that might be triggered after transactions
        window.addEventListener('transactionUpdate', handleTransactionUpdate);
        
        // Set up polling as backup for real-time updates
        const pollInterval = setInterval(() => {
            console.log('Polling for transaction updates...');
            fetchRecentTransactions();
        }, 5000); // Poll every 5 seconds
        
        return () => {
            window.removeEventListener('transactionUpdate', handleTransactionUpdate);
            clearInterval(pollInterval);
        };
    }, []);

    // Auto-refresh when transaction history updates
    useEffect(() => {
        if (onTransactionUpdate) {
            onTransactionUpdate(fetchRecentTransactions);
        }
    }, [onTransactionUpdate]);

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
    };

    const getTransactionDisplay = (transaction) => {
        if (transaction.category === 'Transfer') {
            if (transaction.type === 'credit') {
                return {
                    type: 'Received',
                    party: transaction.otherUser?.name || 'Unknown User',
                    color: 'text-green-600',
                    bgColor: 'bg-green-100',
                    sign: '+'
                };
            } else {
                return {
                    type: 'Sent',
                    party: transaction.otherUser?.name || 'Unknown User', 
                    color: 'text-red-600',
                    bgColor: 'bg-red-100',
                    sign: '-'
                };
            }
        } else {
            // Handle other categories like deposits, withdrawals
            return {
                type: transaction.type === 'credit' ? 'Received' : 'Sent',
                party: 'System',
                color: transaction.type === 'credit' ? 'text-green-600' : 'text-red-600',
                bgColor: transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100',
                sign: transaction.type === 'credit' ? '+' : '-'
            };
        }
    };

    console.log('RecentActivity render - loading:', loading, 'transactions:', transactions, 'error:', error);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-16"></div>
                                <div className="h-3 bg-gray-200 rounded w-12"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load transactions</h3>
                <p className="text-sm text-gray-500 mb-4">{error}</p>
                <button
                    onClick={() => fetchRecentTransactions(true)}
                    disabled={retrying}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {retrying ? (
                        <>
                            <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Retrying...
                        </>
                    ) : (
                        <>
                            <ArrowPathIcon className="-ml-1 mr-2 h-4 w-4" />
                            Try Again
                        </>
                    )}
                </button>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent transactions available</h3>
                <p className="text-sm text-gray-500">
                    Your recent transaction activity will appear here.
                </p>
                <div className="mt-2 text-xs text-gray-400">
                    Debug: Loading={loading.toString()}, Error={error || 'none'}, TransactionCount={transactions.length}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {transactions.map((transaction, index) => {
                const display = getTransactionDisplay(transaction);
                return (
                    <motion.div
                        key={transaction._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${display.bgColor}`}>
                                {display.type === 'Received' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${display.color}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${display.color}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">
                                    {display.party}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {display.type} • {transaction.transactionId}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-sm font-medium ${display.color}`}>
                                {display.sign}₹{transaction.amount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                                {formatDate(transaction.timestamp)}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default RecentActivity;
