/**
 * Analytics V2 - Production Grade
 * Zero memory leaks, smooth UX, backend-driven data
 * No polling, no excessive re-renders, proper cleanup
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyRupeeIcon,
  ScaleIcon,
  TrophyIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AnalyticsLoader } from '../components/AnalyticsLoader';
import { MonthlyTrendsChart } from '../components/AnalyticsChart';
import { SpendingBreakdown } from '../components/SpendingBreakdown';
import { SavingsGoal } from '../components/SavingsGoal';
import { BudgetTracker } from '../components/BudgetTracker';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { toast } from 'react-hot-toast';

export const AnalyticsV2 = () => {
  // Use centralized analytics - single source of truth
  const { 
    data, 
    loading, 
    error, 
    refresh, 
    changeTimeRange,
    balance,
    totalSpent,
    totalReceived,
    transactionCount,
    netFlow,
    savingsRate
  } = useAnalytics();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');

  // Using centralized analytics context - no need for local fetch

  /**
   * Handle manual refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  }, [refresh]);

  /**
   * Handle time range change
   */
  const handleTimeRangeChange = useCallback(async (newRange) => {
    setSelectedTimeRange(newRange);
    await changeTimeRange(newRange);
  }, [changeTimeRange]);

  /**
   * Handle export to PDF
   */
  const handleExport = useCallback(async () => {
    try {
      toast.success('Export feature coming soon!');
    } catch (error) {
      toast.error('Export failed');
    }
  }, []);

  // Context handles initial load and real-time updates automatically

  // Show loader
  if (loading || !data) {
    return <AnalyticsLoader />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Analytics</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => fetchAnalytics(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show no data state
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
            <p className="text-gray-600 mb-6">Start making transactions to see your analytics</p>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  // Main render with data
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
      <Header />
      
      <div className="flex-1 pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
                  <p className="text-slate-600">Real-time financial insights</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  <span>Export</span>
                </button>
                
                <select
                  value={selectedTimeRange}
                  onChange={(e) => handleTimeRangeChange(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Time</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SummaryCard
              title="Current Balance"
              value={`₹${balance.toLocaleString()}`}
              icon={CurrencyRupeeIcon}
              color="blue"
              delay={0.1}
            />
            
            <SummaryCard
              title="Total Income"
              value={`₹${totalReceived.toLocaleString()}`}
              change={data?.summary?.incomeChange || 0}
              icon={ArrowTrendingUpIcon}
              color="emerald"
              delay={0.2}
            />
            
            <SummaryCard
              title="Total Spending"
              value={`₹${totalSpent.toLocaleString()}`}
              change={data?.summary?.spendingChange || 0}
              icon={ArrowTrendingDownIcon}
              color="red"
              delay={0.3}
            />
            
            <SummaryCard
              title="Net Flow"
              value={`₹${netFlow.toLocaleString()}`}
              icon={ScaleIcon}
              color={netFlow >= 0 ? 'emerald' : 'red'}
              delay={0.4}
            />
          </div>

          {/* Charts Section */}
          {data.trends && data.trends.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Trends</h3>
              <MonthlyTrendsChart data={data.trends} />
            </motion.div>
          )}

          {/* Financial Management Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <BudgetTracker 
              totalSpent={totalSpent} 
              totalIncome={totalReceived} 
            />
            <SavingsGoal 
              balance={balance} 
              netFlow={netFlow} 
              savingsRate={savingsRate} 
            />
          </div>

          {/* Spending Breakdown */}
          {data.categories && (
            <SpendingBreakdown categories={data.categories} />
          )}

          {/* Insights */}
          {data.insights && data.insights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Financial Insights</h3>
              <div className="space-y-3">
                {data.insights.map((insight, index) => (
                  <InsightCard key={index} insight={insight} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

/**
 * Summary Card Component
 */
const SummaryCard = ({ title, value, change, icon: Icon, color, delay }) => {
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color === 'red' ? 'text-red-600' : color === 'emerald' ? 'text-emerald-600' : 'text-slate-900'}`}>
            {value}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Insight Card Component
 */
const InsightCard = ({ insight }) => {
  const typeColors = {
    success: 'bg-emerald-50 border-emerald-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const iconColors = {
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-yellow-100 text-yellow-600',
    info: 'bg-blue-100 text-blue-600'
  };

  return (
    <div className={`flex items-start space-x-3 p-4 rounded-lg border ${typeColors[insight.type] || typeColors.info}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColors[insight.type] || iconColors.info}`}>
        <TrophyIcon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900">{insight.title}</p>
        <p className="text-sm text-slate-600 mt-1">{insight.message}</p>
      </div>
    </div>
  );
};

export default AnalyticsV2;
