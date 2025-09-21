import React, { useState, useEffect } from 'react';
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
import { useExportData } from '../hooks/useExportData';
import { useTransactionIntegrity } from '../hooks/useTransactionIntegrity';
import { PDFStatement } from './PDFStatement';

export const UnifiedTransactionHistory = () => {
  // State management
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  console.log('=== Component render - checking localStorage ===');
  const currentToken = localStorage.getItem('token');
  const currentUserId = localStorage.getItem('userId');
  console.log('Token present:', !!currentToken);
  console.log('UserId present:', !!currentUserId);

  const { socket, isConnected, connectionStatus } = useSocket(currentUserId);
  const { generateFreshPDF, generateFreshCSV, exportState } = useExportData();
  const { integrityState, updateFrontendCache } = useTransactionIntegrity(currentUserId);

  const fetchTransactions = async (params = {}) => {
    console.log('=== fetchTransactions called ===');
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('Making API calls with token:', token ? 'Present' : 'Missing');
      console.log('API base URL:', 'http://localhost:5001/api/v1');
      
      const [transactionsResponse, balanceResponse] = await Promise.all([
        apiClient.get('/account/transactions', { 
          params,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }),
        apiClient.get('/account/balance', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
      ]);
      
      console.log('API calls completed successfully');
      console.log('API Response:', transactionsResponse.data);
      
      if (transactionsResponse.data && transactionsResponse.data.transactions) {
        const fetchedTransactions = transactionsResponse.data.transactions;
        console.log('Fetched transactions:', fetchedTransactions.length);
        setTransactions(fetchedTransactions);
        setFilteredTransactions(fetchedTransactions);
        
        // Update integrity cache with fresh transactions
        updateFrontendCache(fetchedTransactions);
      } else if (transactionsResponse.data && Array.isArray(transactionsResponse.data)) {
        // Handle case where transactions are returned directly as array
        const fetchedTransactions = transactionsResponse.data;
        console.log('Fetched transactions (direct array):', fetchedTransactions.length);
        setTransactions(fetchedTransactions);
        setFilteredTransactions(fetchedTransactions);
        updateFrontendCache(fetchedTransactions);
      } else {
        console.log('No transactions found in response');
        setTransactions([]);
        setFilteredTransactions([]);
        updateFrontendCache([]);
      }
      
      if (balanceResponse.data && typeof balanceResponse.data.balance === 'number') {
        setCurrentBalance(balanceResponse.data.balance);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      console.error('Error details:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Please log in to view transactions. Your session may have expired.');
      } else {
        setError('Failed to load transactions. Please try again.');
      }
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== UnifiedTransactionHistory useEffect triggered ===');
    
    if (!currentToken) {
      console.error('No authentication token found in localStorage');
      setError('Please log in to view transactions');
      setLoading(false);
      return;
    }

    // Remove userId requirement - token is sufficient for API calls
    console.log('Calling fetchTransactions...');
    fetchTransactions();

    // Listen for new transactions via custom events
    const handleNewTransaction = (event) => {
      const transaction = event.detail;
      console.log('🆕 New transaction received in UnifiedTransactionHistory:', transaction);
      updateTransactionList(transaction);
    };

    const handleTransactionUpdate = (event) => {
      const transaction = event.detail;
      console.log('🔄 Transaction update received in UnifiedTransactionHistory:', transaction);
      updateTransactionList(transaction);
    };

    const updateTransactionList = (transaction) => {
      setTransactions(prev => {
        // Enhanced duplicate prevention with multiple checks
        const duplicateChecks = [
          t => t.transactionId === transaction.transactionId,
          t => t._id === transaction._id,
          t => Math.abs(new Date(t.timestamp || t.createdAt) - new Date(transaction.timestamp || transaction.createdAt)) < 1000 && 
               t.amount === transaction.amount && 
               t.type === transaction.type
        ];
        
        const exists = prev.some(t => duplicateChecks.some(check => check(t)));
        if (exists) {
          console.log('❌ Transaction already exists, skipping duplicate:', transaction.transactionId);
          return prev;
        }
        
        // Validate transaction data integrity
        if (!transaction.transactionId || !transaction.amount || !transaction.type) {
          console.error('❌ Invalid transaction data received:', transaction);
          return prev;
        }
        
        // Add transaction with enhanced metadata
        const enhancedTransaction = {
          ...transaction,
          receivedAt: Date.now(),
          source: 'realtime'
        };
        
        const updated = [enhancedTransaction, ...prev];
        console.log('✅ Added new transaction to list, total transactions:', updated.length);
        
        // Robust chronological sorting with fallback timestamps
        const sorted = updated.sort((a, b) => {
          const timeA = new Date(a.timestamp || a.createdAt || a.receivedAt);
          const timeB = new Date(b.timestamp || b.createdAt || b.receivedAt);
          
          // Primary sort by timestamp (newest first)
          const timeDiff = timeB - timeA;
          if (timeDiff !== 0) return timeDiff;
          
          // Secondary sort by transaction ID for consistency
          if (a.transactionId && b.transactionId) {
            return b.transactionId.localeCompare(a.transactionId);
          }
          
          // Tertiary sort by amount as final tiebreaker
          return b.amount - a.amount;
        });
        
        console.log('📊 Sorted transactions by timestamp with fallbacks');
        
        // Emit transaction integrity event for monitoring
        window.dispatchEvent(new CustomEvent('transactionIntegrityCheck', {
          detail: { 
            totalTransactions: sorted.length,
            newTransaction: transaction.transactionId,
            timestamp: Date.now()
          }
        }));
        
        return sorted;
      });
      
      // Update filtered transactions if the new transaction matches current filters
      if (matchesCurrentFilters(transaction)) {
        setFilteredTransactions(prev => {
          const exists = prev.some(t => t.transactionId === transaction.transactionId);
          if (!exists) {
            const updated = [transaction, ...prev];
            return updated.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
          }
          return prev;
        });
      }
    };

    // Listen for cache invalidation events
    const handleCacheInvalidate = (event) => {
      const data = event.detail;
      console.log('🔄 Cache invalidation received in TransactionHistory:', data);
      // Always refresh transactions on cache invalidation
      console.log('🔄 Refreshing transactions due to cache invalidation');
      setTimeout(() => {
        fetchTransactions();
      }, 100); // Small delay to ensure backend has processed the transaction
    };

    // Add event listeners for both new and legacy events
    window.addEventListener('transaction:new', handleNewTransaction);
    window.addEventListener('transaction:update', handleTransactionUpdate);
    window.addEventListener('newTransaction', handleNewTransaction); // Legacy support
    window.addEventListener('cacheInvalidate', handleCacheInvalidate);
    window.addEventListener('cache:invalidate', handleCacheInvalidate); // New standardized event

    return () => {
      window.removeEventListener('transaction:new', handleNewTransaction);
      window.removeEventListener('transaction:update', handleTransactionUpdate);
      window.removeEventListener('newTransaction', handleNewTransaction);
      window.removeEventListener('cacheInvalidate', handleCacheInvalidate);
      window.removeEventListener('cache:invalidate', handleCacheInvalidate);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, dateFilter, typeFilter]);

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter (Transaction ID and User Name)
    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      const filterType = typeFilter === 'received' ? 'credit' : 'debit';
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'last3':
          startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          break;
        case 'last30':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filtered = filtered.filter(transaction => 
          new Date(transaction.timestamp || transaction.createdAt) >= startDate
        );
      }
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const matchesCurrentFilters = (transaction) => {
    // Check if transaction matches current filters for real-time updates
    let matches = true;

    if (searchTerm) {
      matches = matches && (
        transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      const filterType = typeFilter === 'received' ? 'credit' : 'debit';
      matches = matches && transaction.type === filterType;
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'last3':
          startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          break;
        case 'last30':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        matches = matches && new Date(transaction.timestamp || transaction.createdAt) >= startDate;
      }
    }

    return matches;
  };

  const handleExportPDF = async () => {
    try {
      console.log('📄 Starting fresh PDF export...');
      setShowDownloadDropdown(false);
      
      // Generate PDF with fresh database data
      const freshData = await generateFreshPDF();
      
      console.log('✅ PDF export data fetched:', {
        transactionCount: freshData.transactions.length,
        balance: freshData.balance,
        exportTime: freshData.metadata.exportTime
      });

      // Generate CSV statement instead of PDF for memory efficiency
      const csvHeaders = ['Date', 'Type', 'Amount', 'Description', 'Balance', 'Transaction ID'];
      const csvRows = freshData.transactions.map(transaction => [
        new Date(transaction.createdAt).toLocaleDateString(),
        transaction.type === 'credit' ? 'Received' : 'Sent',
        `Rs ${transaction.amount.toLocaleString()}`,
        transaction.description || 'N/A',
        `Rs ${transaction.balance?.toLocaleString() || 'N/A'}`,
        transaction.transactionId || transaction._id
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QuickPe-Statement-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ Professional CSV statement downloaded successfully');
      
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      alert(`CSV generation failed: ${error.message}`);
    }
  };

  const handleExportCSV = async () => {
    try {
      console.log('📊 Starting fresh CSV export...');
      setShowDownloadDropdown(false);
      
      // Generate CSV with fresh database data
      const result = await generateFreshCSV();
      
      if (result.success) {
        console.log('✅ CSV export completed:', {
          filename: result.filename,
          recordCount: result.recordCount
        });
      }
      
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      alert(`CSV export failed: ${error.message}`);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const TransactionRow = ({ transaction, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
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
  );

  if (loading) {
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
            <div className="relative">
              <button
                onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Download Statement</span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              
              {showDownloadDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    <span>Export as PDF</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    <span>Export as CSV</span>
                  </button>
                </div>
              )}
            </div>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          {/* Date Range Filter */}
          <div className="relative">
            <CalendarIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
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
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
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
              <TransactionRow key={transaction._id || index} transaction={transaction} index={index} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </p>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
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
