import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CalendarIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';

const TradeJournalMockup = () => {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Mock Indian stock data with real-time simulation
  const generateMockData = () => {
    const indianStocks = [
      { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Oil & Gas' },
      { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT Services' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking' },
      { symbol: 'INFY', name: 'Infosys', sector: 'IT Services' },
      { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking' },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom' },
      { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG' },
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking' },
      { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Infrastructure' }
    ];

    return indianStocks.map(stock => {
      const basePrice = Math.random() * 3000 + 500; // Random base price between 500-3500
      const change = (Math.random() - 0.5) * 100; // Random change between -50 to +50
      const changePercent = (change / basePrice) * 100;
      
      return {
        ...stock,
        price: basePrice.toFixed(2),
        change: change.toFixed(2),
        changePercent: changePercent.toFixed(2),
        volume: Math.floor(Math.random() * 1000000) + 100000,
        high: (basePrice + Math.abs(change) * 0.5).toFixed(2),
        low: (basePrice - Math.abs(change) * 0.5).toFixed(2)
      };
    });
  };

  useEffect(() => {
    // Initial load
    setMarketData(generateMockData());
    setLoading(false);

    // Update every 5 seconds to simulate real-time data
    const interval = setInterval(() => {
      setMarketData(generateMockData());
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const mockTrades = [
    {
      id: 1,
      symbol: 'RELIANCE',
      type: 'BUY',
      quantity: 50,
      price: 2485.30,
      date: '2025-09-17',
      pnl: 1250.50,
      status: 'CLOSED'
    },
    {
      id: 2,
      symbol: 'TCS',
      type: 'BUY',
      quantity: 25,
      price: 3890.75,
      date: '2025-09-16',
      pnl: -450.25,
      status: 'OPEN'
    },
    {
      id: 3,
      symbol: 'HDFCBANK',
      type: 'SELL',
      quantity: 100,
      price: 1678.90,
      date: '2025-09-15',
      pnl: 2100.80,
      status: 'CLOSED'
    }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Trade Journal Dashboard</h3>
            <p className="text-emerald-100">Track your investments with real-time market data</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">₹1,23,450</div>
            <div className="text-emerald-100 text-sm">Portfolio Value</div>
          </div>
        </div>
      </div>

      {/* Market Data Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-emerald-600" />
            Live Market Data
          </h4>
          <div className="text-xs text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketData.slice(0, 6).map((stock, index) => (
            <motion.div
              key={stock.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-gray-900">{stock.symbol}</div>
                  <div className="text-xs text-gray-500">{stock.sector}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{stock.price}</div>
                  <div className={`text-xs flex items-center ${
                    parseFloat(stock.change) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {parseFloat(stock.change) >= 0 ? (
                      <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                    )}
                    {stock.changePercent}%
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Vol: {(stock.volume / 1000).toFixed(0)}K | H: ₹{stock.high} | L: ₹{stock.low}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">Portfolio Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">15</div>
            <div className="text-sm text-blue-800">Total Trades</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">₹8,450</div>
            <div className="text-sm text-green-800">Total P&L</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">73%</div>
            <div className="text-sm text-purple-800">Win Rate</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">12</div>
            <div className="text-sm text-yellow-800">Avg Days</div>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Recent Trades</h4>
        <div className="space-y-3">
          {mockTrades.map((trade) => (
            <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  trade.type === 'BUY' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <div className="font-medium">{trade.symbol}</div>
                  <div className="text-sm text-gray-500">
                    {trade.type} {trade.quantity} @ ₹{trade.price}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${
                  trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl}
                </div>
                <div className="text-xs text-gray-500">{trade.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 text-center">
        <h4 className="font-semibold text-gray-900 mb-2">Ready to start tracking your trades?</h4>
        <p className="text-gray-600 mb-4">Join thousands of investors using QuickPe's Trade Journal</p>
        <button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl">
          Sign Up Free
        </button>
      </div>
    </div>
  );
};

export default TradeJournalMockup;
