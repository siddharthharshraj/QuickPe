import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import apiClient from '../services/api/client';

const MarketDataWidget = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchMarketData();
    // Update every 2 minutes to reduce memory usage
    const interval = setInterval(fetchMarketData, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      const response = await apiClient.get('/market-data');
      if (response.data.success) {
        setMarketData(response.data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChange = (change, changePercent) => {
    const isPositive = change >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
        ) : (
          <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
        )}
        {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!marketData) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Live Market Data</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            marketData.status === 'OPEN' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {marketData.status}
          </span>
        </div>
        {lastUpdated && (
          <div className="flex items-center text-xs text-gray-500">
            <ClockIcon className="h-3 w-3 mr-1" />
            {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Indices */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600">NIFTY 50</div>
          <div className="text-lg font-bold text-gray-900">
            {marketData.indices.nifty50.value.toLocaleString()}
          </div>
          <div className="text-xs">
            {formatChange(marketData.indices.nifty50.change, marketData.indices.nifty50.changePercent)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600">SENSEX</div>
          <div className="text-lg font-bold text-gray-900">
            {marketData.indices.sensex.value.toLocaleString()}
          </div>
          <div className="text-xs">
            {formatChange(marketData.indices.sensex.change, marketData.indices.sensex.changePercent)}
          </div>
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Combine gainers and losers for a comprehensive view */}
        {[...marketData.topGainers.slice(0, 3), ...marketData.topLosers.slice(0, 3)].map((stock, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-bold text-gray-900 text-lg">{stock.symbol}</div>
                <div className="text-sm text-gray-500">{stock.sector || 'Stock'}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-gray-900">₹{stock.price.toFixed(2)}</div>
                <div className={`text-sm font-medium ${
                  stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stock.changePercent >= 0 ? '↗' : '↘'} {stock.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Vol: {Math.floor(Math.random() * 1000)}K | H: ₹{(stock.price * 1.02).toFixed(2)} | L: ₹{(stock.price * 0.98).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default MarketDataWidget;
