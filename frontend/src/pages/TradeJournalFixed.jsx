import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  CheckIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import MarketDataWidget from '../components/MarketDataWidget';
import apiClient from '../services/api/client';
import toast from 'react-hot-toast';

export const TradeJournal = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [closeTradeForm, setCloseTradeForm] = useState({
    exitPrice: '',
    exitDate: '',
    closeType: 'FULL',
    quantity: ''
  });
  const [summary, setSummary] = useState({
    totalTrades: 0,
    totalPnL: 0,
    winningTrades: 0,
    losingTrades: 0,
    avgHoldingPeriod: 0,
    totalInvested: 0,
    winRate: 0
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
    sector: ''
  });

  // Simple, working useEffect - exactly like the working version
  useEffect(() => {
    console.log('🔍 Component mounted, fetching trades...');
    fetchTrades();
  }, []);

  // Simple fetchTrades function - exactly like the working version
  const fetchTrades = async () => {
    try {
      console.log('📊 Fetching trades...');
      setLoading(true);
      
      const response = await apiClient.get('/trade-journal');
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
      } else {
        console.error('❌ API returned success: false');
        toast.error('Failed to fetch trades');
      }
    } catch (error) {
      console.error('❌ Error fetching trades:', error);
      toast.error('Failed to fetch trades');
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
        exitPrice: tradeForm.exitPrice ? parseFloat(tradeForm.exitPrice) : null
      });
      
      if (response.data.success) {
        console.log('✅ Trade saved, refreshing...');
        toast.success(selectedTrade ? 'Trade updated successfully' : 'Trade created successfully');
        setShowModal(false);
        resetForm();
        fetchTrades(); // Simple refetch
      }
    } catch (error) {
      console.error('❌ Error saving trade:', error);
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

  const handleCloseTrade = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.put(`/trade-journal/${selectedTrade._id}/close`, {
        exitPrice: parseFloat(closeTradeForm.exitPrice),
        exitDate: closeTradeForm.exitDate,
        closeType: closeTradeForm.closeType,
        quantity: closeTradeForm.closeType === 'PARTIAL' ? parseInt(closeTradeForm.quantity) : undefined
      });
      
      if (response.data.success) {
        const { realizedPnL, closedQuantity } = response.data;
        toast.success(
          `Trade ${closeTradeForm.closeType.toLowerCase()} closed successfully! ` +
          `Realized P&L: ₹${realizedPnL?.toLocaleString()} (${closedQuantity} shares)`
        );
        setShowCloseModal(false);
        resetCloseForm();
        fetchTrades();
      }
    } catch (error) {
      console.error('Error closing trade:', error);
      toast.error('Failed to close trade');
    }
  };

  const exportToJSON = async () => {
    try {
      const response = await apiClient.get('/trade-journal/export/json', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quickpe-trades-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('JSON exported successfully');
    } catch (error) {
      console.error('Error exporting JSON:', error);
      toast.error('Failed to export JSON');
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
      link.setAttribute('download', `quickpe-trades-${new Date().toISOString().split('T')[0]}.csv`);
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
      sector: ''
    });
    setSelectedTrade(null);
  };

  const resetCloseForm = () => {
    setCloseTradeForm({
      exitPrice: '',
      exitDate: new Date().toISOString().split('T')[0],
      closeType: 'FULL',
      quantity: ''
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
                  console.log('🔄 Manual refresh triggered');
                  fetchTrades();
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                <ArrowTrendingUpIcon className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportToCSV}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>CSV</span>
              </button>
              <button
                onClick={exportToJSON}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>JSON</span>
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


        {/* Market Data Widget */}
        <div className="mb-8">
          <MarketDataWidget />
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

        {/* Trades Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Trades ({trades.length})</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading trades...</p>
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-8">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No trades found</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center space-x-2 mx-auto"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Trade</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trades.map((trade) => (
                    <tr key={trade._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{trade.symbol}</div>
                        <div className="text-sm text-gray-500">{trade.sector}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trade.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          {trade.status === 'OPEN' && (
                            <button
                              onClick={() => {
                                setSelectedTrade(trade);
                                setCloseTradeForm({
                                  exitPrice: '',
                                  exitDate: new Date().toISOString().split('T')[0],
                                  closeType: 'FULL',
                                  quantity: trade.quantity
                                });
                                setShowCloseModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Close Trade"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}
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
                            title="Edit Trade"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(trade._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Trade"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Trade Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {selectedTrade ? 'Edit Trade' : 'Add New Trade'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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

      {/* Close Trade Modal */}
      {showCloseModal && selectedTrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Close Trade: {selectedTrade.symbol}
            </h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <p><strong>Current Position:</strong> {selectedTrade.quantity} shares @ ₹{selectedTrade.entryPrice}</p>
                <p><strong>Investment:</strong> ₹{(selectedTrade.quantity * selectedTrade.entryPrice).toLocaleString()}</p>
              </div>
            </div>
            <form onSubmit={handleCloseTrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Close Type</label>
                <select
                  value={closeTradeForm.closeType}
                  onChange={(e) => setCloseTradeForm({...closeTradeForm, closeType: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="FULL">Full Close</option>
                  <option value="PARTIAL">Partial Close</option>
                </select>
              </div>
              
              {closeTradeForm.closeType === 'PARTIAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity to Close (Max: {selectedTrade.quantity})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedTrade.quantity - 1}
                    value={closeTradeForm.quantity}
                    onChange={(e) => setCloseTradeForm({...closeTradeForm, quantity: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Exit Price</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={closeTradeForm.exitPrice}
                  onChange={(e) => setCloseTradeForm({...closeTradeForm, exitPrice: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter exit price"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Exit Date</label>
                <input
                  type="date"
                  required
                  value={closeTradeForm.exitDate}
                  onChange={(e) => setCloseTradeForm({...closeTradeForm, exitDate: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              {/* P&L Preview */}
              {closeTradeForm.exitPrice && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">P&L Preview:</p>
                    {(() => {
                      const qty = closeTradeForm.closeType === 'PARTIAL' ? parseInt(closeTradeForm.quantity) || 0 : selectedTrade.quantity;
                      const pnl = selectedTrade.tradeType === 'BUY' 
                        ? (parseFloat(closeTradeForm.exitPrice) - selectedTrade.entryPrice) * qty
                        : (selectedTrade.entryPrice - parseFloat(closeTradeForm.exitPrice)) * qty;
                      const pnlPercent = ((pnl / (selectedTrade.entryPrice * qty)) * 100);
                      
                      return (
                        <p className={`font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString()} ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                        </p>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>Close Trade</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCloseModal(false);
                    resetCloseForm();
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 flex items-center space-x-2"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Cancel</span>
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
