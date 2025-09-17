import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  TagIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import apiClient from '../services/api/client';
import toast from 'react-hot-toast';

export const TradeJournal = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [summary, setSummary] = useState({
    totalTrades: 0,
    totalPnL: 0,
    winningTrades: 0,
    losingTrades: 0,
    avgHoldingPeriod: 0,
    totalInvested: 0,
    winRate: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    symbol: '',
    status: 'all',
    tradeType: 'all',
    startDate: '',
    endDate: ''
  });
  const [tradeForm, setTradeForm] = useState({
    symbol: '',
    tradeType: 'BUY',
    quantity: '',
    entryPrice: '',
    exitPrice: '',
    entryDate: '',
    exitDate: '',
    strategy: '',
    notes: '',
    tags: [],
    sector: '',
    marketCap: 'LARGE_CAP',
    target: '',
    brokerage: '',
    taxes: ''
  });

  useEffect(() => {
    console.log('🔍 Component mounted, fetching trades...');
    fetchTrades();
  }, []);

  useEffect(() => {
    console.log('🔄 Filters or pagination changed, refetching trades...');
    if (trades.length > 0) { // Only refetch if we have initial data
      fetchTrades();
    }
  }, [filters, pagination.page]);

  const checkFeatureAccess = async () => {
    try {
      await fetchTrades();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Trade Journal feature is not enabled for your account');
      }
    }
  };

  const fetchTrades = async () => {
    try {
      console.log('📊 Fetching trades...');
      setLoading(true);
      
      const response = await apiClient.get('/trade-journal', {
        params: {
          ...filters,
          page: pagination.page,
          limit: pagination.limit,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      });
      
      console.log('✅ API Response received:', response.data);
      
      if (response.data.success) {
        const tradesData = response.data.trades || [];
        console.log('📋 Trades count:', tradesData.length);
        
        setTrades(tradesData);
        setSummary(response.data.summary || {
          totalTrades: 0,
          totalPnL: 0,
          winningTrades: 0,
          losingTrades: 0,
          avgHoldingPeriod: 0,
          totalInvested: 0,
          winRate: 0
        });
        setPagination(response.data.pagination || pagination);
      } else {
        console.error('❌ API returned success: false');
        toast.error('Failed to fetch trades');
      }
    } catch (error) {
      console.error('❌ Error fetching trades:', error);
      if (error.response?.status !== 403) {
        toast.error('Failed to fetch trades');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedTrade ? `/trade-journal/${selectedTrade._id}` : '/trade-journal';
      const method = selectedTrade ? 'put' : 'post';
      
      const response = await apiClient[method](url, {
        ...tradeForm,
        quantity: parseInt(tradeForm.quantity),
        entryPrice: parseFloat(tradeForm.entryPrice),
        exitPrice: tradeForm.exitPrice ? parseFloat(tradeForm.exitPrice) : null,
        brokerage: parseFloat(tradeForm.brokerage) || 0,
        taxes: parseFloat(tradeForm.taxes) || 0
      });
      
      if (response.data.success) {
        console.log('Trade saved successfully, refreshing data...');
        toast.success(selectedTrade ? 'Trade updated successfully' : 'Trade created successfully');
        setShowModal(false);
        resetForm();
        await fetchTrades(); // Make sure to wait for the fetch to complete
        console.log('Data refreshed after trade save');
      }
    } catch (error) {
      console.error('Error saving trade:', error);
      toast.error('Failed to save trade');
    }
  };

  const handleDelete = async (tradeId) => {
    if (!window.confirm('Are you sure you want to delete this trade?')) return;
    
    try {
      const response = await apiClient.delete(`/trade-journal/${tradeId}`);
      if (response.data.success) {
        toast.success('Trade deleted successfully');
        fetchTrades();
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast.error('Failed to delete trade');
    }
  };

  const handleCloseTrade = async (tradeId, exitPrice) => {
    try {
      const response = await apiClient.put(`/trade-journal/${tradeId}/close`, {
        exitPrice: parseFloat(exitPrice),
        exitDate: new Date().toISOString().split('T')[0]
      });
      
      if (response.data.success) {
        toast.success('Trade closed successfully');
        fetchTrades();
      }
    } catch (error) {
      console.error('Error closing trade:', error);
      toast.error('Failed to close trade');
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await apiClient.get('/trade-journal/export/csv', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'trade-journal.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const resetForm = () => {
    setTradeForm({
      symbol: '',
      tradeType: 'BUY',
      quantity: '',
      entryPrice: '',
      exitPrice: '',
      entryDate: '',
      exitDate: '',
      strategy: '',
      notes: '',
      tags: [],
      sector: '',
      marketCap: 'LARGE_CAP',
      target: '',
      brokerage: '',
      taxes: ''
    });
    setSelectedTrade(null);
  };

  const StatCard = ({ title, value, icon: Icon, color = "text-blue-600" }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
    </motion.div>
  );

  if (loading && trades.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Trade Journal</h1>
              <p className="text-gray-600">Track and analyze your trading performance</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  console.log('Manual refresh triggered');
                  setTrades([]); // Clear current trades
                  setLoading(true); // Show loading
                  fetchTrades();
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                <ArrowTrendingUpIcon className="h-4 w-4" />
                <span>Force Refresh</span>
              </button>
              <button
                onClick={exportToCSV}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Trade</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Debug Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-800 mb-2">Debug Info:</h3>
          <div className="text-sm text-yellow-700">
            <p>Trades in state: {trades.length}</p>
            <p>Loading: {loading.toString()}</p>
            <p>Summary total trades: {summary.totalTrades}</p>
            <p>API Base URL: {import.meta.env.DEV ? 'http://localhost:5001/api/v1' : 'Production'}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Trades"
            value={summary.totalTrades}
            icon={ChartBarIcon}
            color="text-blue-600"
          />
          <StatCard
            title="Total P&L"
            value={`₹${summary.totalPnL?.toLocaleString() || 0}`}
            icon={summary.totalPnL >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
            color={summary.totalPnL >= 0 ? "text-green-600" : "text-red-600"}
          />
          <StatCard
            title="Win Rate"
            value={`${summary.winRate || 0}%`}
            icon={ChartBarIcon}
            color="text-purple-600"
          />
          <StatCard
            title="Total Invested"
            value={`₹${summary.totalInvested?.toLocaleString() || 0}`}
            icon={CalendarIcon}
            color="text-yellow-600"
          />
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
              <input
                type="text"
                placeholder="Search symbol..."
                value={filters.symbol}
                onChange={(e) => setFilters({...filters, symbol: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.tradeType}
                onChange={(e) => setFilters({...filters, tradeType: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </motion.div>

        {/* Trades Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {console.log('Rendering table with trades:', trades)}
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading trades...</p>
                    </td>
                  </tr>
                ) : trades.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center py-8">
                        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 mb-4">No trades found</p>
                        <p className="text-sm text-gray-400">Get started by adding your first trade.</p>
                        <button
                          onClick={() => setShowModal(true)}
                          className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center space-x-2 mx-auto"
                        >
                          <PlusIcon className="h-4 w-4" />
                          <span>Add Trade</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  trades.map((trade) => (
                    <tr key={trade._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{trade.symbol}</div>
                            <div className="text-sm text-gray-500">{trade.sector}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trade.tradeType === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.tradeType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trade.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{trade.entryPrice?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trade.exitPrice ? `₹${trade.exitPrice.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${
                          trade.pnl > 0 ? 'text-green-600' : trade.pnl < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {trade.pnl > 0 ? '+' : ''}₹{trade.pnl?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trade.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => {
                              setSelectedTrade(trade);
                              setTradeForm({
                                ...trade,
                                entryDate: trade.entryDate?.split('T')[0] || '',
                                exitDate: trade.exitDate?.split('T')[0] || ''
                              });
                              setShowModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(trade._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} trades
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Trade Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {selectedTrade ? 'Edit Trade' : 'Add New Trade'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Symbol</label>
                  <input
                    type="text"
                    required
                    value={tradeForm.symbol}
                    onChange={(e) => setTradeForm({...tradeForm, symbol: e.target.value.toUpperCase()})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., RELIANCE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trade Type</label>
                  <select
                    value={tradeForm.tradeType}
                    onChange={(e) => setTradeForm({...tradeForm, tradeType: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    required
                    value={tradeForm.quantity}
                    onChange={(e) => setTradeForm({...tradeForm, quantity: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Entry Price</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={tradeForm.entryPrice}
                    onChange={(e) => setTradeForm({...tradeForm, entryPrice: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Entry Date</label>
                  <input
                    type="date"
                    required
                    value={tradeForm.entryDate}
                    onChange={(e) => setTradeForm({...tradeForm, entryDate: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sector</label>
                  <input
                    type="text"
                    value={tradeForm.sector}
                    onChange={(e) => setTradeForm({...tradeForm, sector: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., Technology"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Strategy</label>
                <input
                  type="text"
                  value={tradeForm.strategy}
                  onChange={(e) => setTradeForm({...tradeForm, strategy: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Swing trading"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={tradeForm.notes}
                  onChange={(e) => setTradeForm({...tradeForm, notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows="3"
                  placeholder="Add any notes about this trade..."
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                >
                  {selectedTrade ? 'Update Trade' : 'Add Trade'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default TradeJournal;
