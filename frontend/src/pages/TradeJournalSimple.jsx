import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import apiClient from '../services/api/client';

export const TradeJournalSimple = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      console.log('🔍 Fetching trades...');
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/trade-journal');
      console.log('📊 API Response:', response.data);
      
      if (response.data.success) {
        const tradesData = response.data.trades || [];
        console.log('✅ Trades received:', tradesData.length);
        console.log('📋 First trade:', tradesData[0]);
        setTrades(tradesData);
      } else {
        setError('API returned success: false');
      }
    } catch (err) {
      console.error('❌ Error fetching trades:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  console.log('🔄 Component render - trades count:', trades.length);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Trade Journal - Simple Debug</h1>
        
        {/* Debug Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-blue-800 mb-2">🔍 Debug Information:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Loading:</strong> {loading.toString()}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
            <p><strong>Trades in state:</strong> {trades.length}</p>
            <p><strong>API Base URL:</strong> {apiClient.defaults.baseURL}</p>
            <p><strong>Token exists:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
          </div>
          <button 
            onClick={fetchTrades}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading trades...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-red-800">❌ Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Trades Table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Trades ({trades.length})</h2>
            </div>
            
            {trades.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No trades found</p>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trades.map((trade, index) => (
                      <tr key={trade._id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {trade.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            trade.tradeType === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {trade.tradeType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {trade.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          ₹{trade.entryPrice?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            trade.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Raw Data Display */}
        {trades.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold mb-2">📄 Raw Trade Data:</h3>
            <pre className="text-xs overflow-x-auto bg-white p-3 rounded border">
              {JSON.stringify(trades, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default TradeJournalSimple;
