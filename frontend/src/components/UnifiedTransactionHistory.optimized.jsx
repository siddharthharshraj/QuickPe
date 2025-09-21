import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  DocumentArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import apiClient from "../services/api/client";
import { PageSkeleton } from "./PageSkeleton";
import { useSocket } from '../sockets/useSocket';
import { memoryManager } from '../utils/optimizedMemoryManager';

export const UnifiedTransactionHistory = () => {
  // Reduced state variables - combine where possible
  const [state, setState] = useState({
    transactions: [],
    loading: true,
    error: null,
    currentBalance: 0,
    refreshing: false
  });

  // Filter state as single object
  const [filters, setFilters] = useState({
    searchTerm: '',
    dateFilter: 'all',
    typeFilter: 'all'
  });

  // UI state
  const [uiState, setUiState] = useState({
    showDownloadDropdown: false,
    currentPage: 1
  });

  const itemsPerPage = 6;
  const componentRef = useRef(null);

  // Memoized socket connection (only create once)
  const { socket, isConnected } = useSocket(localStorage.getItem('userId'));

  // Memoized filtered and paginated data
  const { filteredTransactions, paginatedTransactions, totalPages } = useMemo(() => {
    // Get transactions from memory manager's efficient storage
    const transactions = memoryManager.getFromPool('current') || state.transactions;
    const transactionArray = Array.from(transactions.values());

    // Apply filters using pre-computed indexes
    const filtered = memoryManager.applyFilters(
      transactionArray,
      filters.searchTerm,
      filters.typeFilter,
      filters.dateFilter
    );

    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (uiState.currentPage - 1) * itemsPerPage;
    const paginatedTransactions = filtered.slice(startIndex, startIndex + itemsPerPage);

    return {
      filteredTransactions: filtered,
      paginatedTransactions,
      totalPages
    };
  }, [state.transactions, filters, uiState.currentPage]);

  // Optimized fetch function with caching
  const fetchTransactions = useCallback(async (force = false) => {
    const cacheKey = 'transactions';
    const cached = !force ? memoryManager.getCache(cacheKey) : null;

    if (cached) {
      setState(prev => ({ ...prev, transactions: cached, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [transactionsResponse, balanceResponse] = await Promise.all([
        apiClient.get('/account/transactions', {
          headers: { 'Cache-Control': 'no-cache' }
        }),
        apiClient.get('/account/balance')
      ]);

      if (transactionsResponse.data?.transactions) {
        // Store in memory manager's efficient data structure
        const transactionMap = memoryManager.storeTransactions(transactionsResponse.data.transactions);
        memoryManager.buildFilterIndex(Array.from(transactionMap.values()));

        // Cache for 5 minutes
        memoryManager.setCache(cacheKey, transactionMap, 300000);

        setState(prev => ({
          ...prev,
          transactions: transactionMap,
          currentBalance: balanceResponse.data?.balance || 0,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load transactions',
        loading: false
      }));
    }
  }, []);

  // Single useEffect for initialization and event listeners
  useEffect(() => {
    fetchTransactions();

    // Efficient event listeners using memory manager
    const listeners = [];

    const handleNewTransaction = (event) => {
      const transaction = event.detail;
      const transactionMap = memoryManager.getFromPool('current') || new Map();

      // Add to efficient data structure
      transactionMap.set(transaction._id || transaction.transactionId, {
        ...transaction,
        _sortedIndex: transactionMap.size
      });

      // Rebuild indexes
      memoryManager.buildFilterIndex(Array.from(transactionMap.values()));

      setState(prev => ({ ...prev, transactions: transactionMap }));
    };

    const handleCacheInvalidate = () => {
      memoryManager.setCache('transactions', null); // Clear cache
      fetchTransactions(true); // Force refresh
    };

    // Register listeners with memory manager for automatic cleanup
    listeners.push(memoryManager.addEventListener(window, 'transaction:new', handleNewTransaction));
    listeners.push(memoryManager.addEventListener(window, 'cache:invalidate', handleCacheInvalidate));

    // Cleanup function
    return () => {
      listeners.forEach(key => memoryManager.removeEventListener(key));
    };
  }, [fetchTransactions]);

  // Optimized filter handlers using single state update
  const updateFilters = useCallback((updates) => {
    setFilters(prev => ({ ...prev, ...updates }));
    setUiState(prev => ({ ...prev, currentPage: 1 })); // Reset pagination
  }, []);

  // Optimized pagination
  const updatePage = useCallback((page) => {
    setUiState(prev => ({ ...prev, currentPage: page }));
  }, []);

  // Efficient CSV export using pre-computed data
  const handleExportCSV = useCallback(async () => {
    try {
      setUiState(prev => ({ ...prev, showDownloadDropdown: false }));

      const transactions = Array.from((memoryManager.getFromPool('current') || new Map()).values());
      const csvContent = [
        'Date,Type,Amount,Description,Balance,Transaction ID',
        ...transactions.map(t => [
          new Date(t.createdAt).toLocaleDateString(),
          t.type === 'credit' ? 'Received' : 'Sent',
          `Rs ${t.amount.toLocaleString()}`,
          t.description || 'N/A',
          `Rs ${t.balance?.toLocaleString() || 'N/A'}`,
          t.transactionId || t._id
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QuickPe-Statement-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('CSV export failed:', error);
      alert(`CSV export failed: ${error.message}`);
    }
  }, []);

  // Memory-efficient transaction row component
  const TransactionRow = useCallback(({ transaction, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3) }} // Cap delay
      className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            transaction.type === 'credit'
              ? 'bg-green-100 text-green-600'
              : 'bg-red-100 text-red-600'
          }`}>
            {transaction.type === 'credit' ? '↓' : '↑'}
          </div>
          <div>
            <p className="font-medium text-slate-900">{transaction.description}</p>
            <p className="text-sm text-slate-500">
              {transaction.otherUser?.name || 'System'} • {transaction.transactionId}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${
            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
          }`}>
            {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500">
            {new Date(transaction.timestamp || transaction.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </motion.div>
  ), []);

  if (state.loading) {
    return <PageSkeleton layout="transaction-history" />;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
      {/* Top Bar - Download Statement */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-slate-900">Transaction History</h2>
            <span className="text-sm text-slate-600">
              {filteredTransactions.length} transactions shown
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setUiState(prev => ({ ...prev, showDownloadDropdown: !prev.showDownloadDropdown }))}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>Download CSV</span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Filter */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Transaction ID or User Name..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <CalendarIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select
              value={filters.dateFilter}
              onChange={(e) => updateFilters({ dateFilter: e.target.value })}
              className="pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last3">Last 3 Days</option>
              <option value="last30">Last 30 Days</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filters.typeFilter}
              onChange={(e) => updateFilters({ typeFilter: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="received">Received</option>
              <option value="sent">Sent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="p-6">
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{state.error}</p>
          </div>
        )}

        {paginatedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentArrowDownIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No transactions found</h3>
            <p className="text-slate-500">No transactions match your selected filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedTransactions.map((transaction, index) => (
              <TransactionRow key={transaction._id || transaction.transactionId} transaction={transaction} index={index} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {((uiState.currentPage - 1) * itemsPerPage) + 1} to {Math.min(uiState.currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </p>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => updatePage(Math.max(uiState.currentPage - 1, 1))}
                disabled={uiState.currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => updatePage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      uiState.currentPage === pageNum
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => updatePage(Math.min(uiState.currentPage + 1, totalPages))}
                disabled={uiState.currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedTransactionHistory;
