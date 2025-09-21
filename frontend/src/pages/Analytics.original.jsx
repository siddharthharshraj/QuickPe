import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CurrencyRupeeIcon,
  BanknotesIcon,
  ScaleIcon,
  HeartIcon,
  ShieldCheckIcon,
  TrophyIcon,
  CalendarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PageSkeleton } from '../components/PageSkeleton';
import { CSVExportButton } from '../components/LazyPDFComponents';
import { MonthlyTrendsChart } from '../components/AnalyticsChart';
import useAnalyticsSync from '../hooks/useAnalyticsSync';
import apiClient from '../services/api/client';

// Helper functions for financial health score styling
const getHealthScoreColor = (score) => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getHealthScoreBg = (score) => {
  if (score >= 80) return 'bg-emerald-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
};

export const Analytics = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [categoriesData, setCategoriesData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [recurringData, setRecurringData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, [timeRange]);

  // Real-time sync hook
  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      const startTime = Date.now();
      
      // Show skeleton for minimum 2 seconds
      const skeletonTimer = setTimeout(() => {
        setShowSkeleton(false);
      }, 2000);
      
      // Fetch user data
      const userResponse = await apiClient.get('/user/profile');
      setUserData(userResponse.data.user);
      
      // Fetch comprehensive analytics with error handling
      const [summaryRes, categoriesRes, trendsRes, recurringRes, insightsRes] = await Promise.allSettled([
        apiClient.get(`/analytics-comprehensive/summary?timeRange=${timeRange}`),
        apiClient.get(`/analytics-comprehensive/categories?timeRange=${timeRange}`),
        apiClient.get('/analytics-comprehensive/trends?months=6'),
        apiClient.get('/analytics-comprehensive/recurring'),
        apiClient.get(`/analytics-comprehensive/insights?timeRange=${timeRange}`)
      ]);
      
      // Handle Promise.allSettled results with error logging
      if (summaryRes.status === 'fulfilled') {
        setAnalyticsData(summaryRes.value.data);
      } else {
        console.error('Summary fetch failed:', summaryRes.reason);
      }
      
      if (categoriesRes.status === 'fulfilled') {
        setCategoriesData(categoriesRes.value.data);
      } else {
        console.error('Categories fetch failed:', categoriesRes.reason);
      }
      
      if (trendsRes.status === 'fulfilled') {
        setTrendsData(trendsRes.value.data);
      } else {
        console.error('Trends fetch failed:', trendsRes.reason);
      }
      
      if (recurringRes.status === 'fulfilled') {
        setRecurringData(recurringRes.value.data);
      } else {
        console.error('Recurring fetch failed:', recurringRes.reason);
      }
      
      if (insightsRes.status === 'fulfilled') {
        setInsights(insightsRes.value.data.insights || []);
      } else {
        console.error('Insights fetch failed:', insightsRes.reason);
      }
      
      // Ensure skeleton shows for at least 2 seconds
      clearTimeout(skeletonTimer);
      setTimeout(() => {
        setShowSkeleton(false);
      }, Math.max(0, 2000 - (Date.now() - startTime)));
      
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setTimeout(() => setShowSkeleton(false), 2000);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAnalytics = async () => {
    await fetchAllAnalytics();
  };
  
  useAnalyticsSync(fetchAllAnalytics);

  // Helper functions
  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getHealthScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const handleRefresh = async () => {
    setShowSkeleton(true);
    await fetchAllAnalytics();
  };
  
  // Show skeleton while loading
  if (loading) {
    return (
      <>
        <Header />
        <PageSkeleton type="analytics" />
        <Footer />
      </>
    );
  }

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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
                  <p className="text-slate-600">Comprehensive financial insights and trends</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <CSVExportButton 
                  data={analyticsData?.transactions || []} 
                  filename="analytics-report"
                />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Current Balance</p>
                  <p className="text-3xl font-bold text-slate-900">₹{analyticsData?.summary?.currentBalance?.toLocaleString() || '0'}</p>
                  <p className="text-sm mt-1 text-slate-500">Available funds</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CurrencyRupeeIcon className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Total Spending</p>
                  <p className="text-3xl font-bold text-slate-900">₹{analyticsData?.summary?.spending?.current?.toLocaleString() || '0'}</p>
                  <p className={`text-sm mt-1 ${(analyticsData?.summary?.spending?.change || 0) >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {(analyticsData?.summary?.spending?.change || 0) >= 0 ? '+' : ''}{analyticsData?.summary?.spending?.change?.toFixed(1) || '0'}% vs last period
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">Total Income</p>
                  <p className="text-3xl font-bold text-slate-900">₹{analyticsData?.summary?.income?.current?.toLocaleString() || '0'}</p>
                  <p className={`text-sm mt-1 ${(analyticsData?.summary?.income?.change || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {(analyticsData?.summary?.income?.change || 0) >= 0 ? '+' : ''}{analyticsData?.summary?.income?.change?.toFixed(1) || '0'}% vs last period
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Net Flow</p>
                  <p className="text-3xl font-bold text-slate-900">₹{analyticsData?.summary?.netFlow?.toLocaleString() || '0'}</p>
                  <p className={`text-sm mt-1 ${(analyticsData?.summary?.netFlow || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {(analyticsData?.summary?.netFlow || 0) >= 0 ? 'Positive' : 'Negative'} flow
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${(analyticsData?.summary?.netFlow || 0) >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {(analyticsData?.summary?.netFlow || 0) >= 0 ? 
                    <ArrowTrendingUpIcon className="h-6 w-6 text-emerald-600" /> :
                    <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                  }
                </div>
              </div>
            </div>
          </motion.div>

          {/* Financial Health & Additional Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {/* Financial Health Score */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${getHealthScoreBg(analyticsData?.summary?.financialHealthScore || 0)}`}>
                  <HeartIcon className={`h-8 w-8 ${getHealthScoreColor(analyticsData?.summary?.financialHealthScore || 0)}`} />
                </div>
                <div className={`text-4xl font-bold mb-2 ${getHealthScoreColor(analyticsData?.summary?.financialHealthScore || 0)}`}>
                  {analyticsData?.summary?.financialHealthScore || 0}/100
                </div>
                <div className="text-sm text-slate-600 font-medium">Financial Health Score</div>
                <div className="text-xs text-slate-500 mt-1">
                  {(analyticsData?.summary?.financialHealthScore || 0) >= 80 ? 'Excellent' :
                   (analyticsData?.summary?.financialHealthScore || 0) >= 60 ? 'Good' : 'Needs Improvement'}
                </div>
              </div>
            </div>

            {/* Savings Ratio */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className={`text-sm font-medium ${(analyticsData?.summary?.savingsRatio || 0) >= 20 ? 'text-emerald-600' : (analyticsData?.summary?.savingsRatio || 0) >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {(analyticsData?.summary?.savingsRatio || 0) >= 20 ? 'Excellent' : (analyticsData?.summary?.savingsRatio || 0) >= 10 ? 'Good' : 'Low'}
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {analyticsData?.summary?.savingsRatio?.toFixed(1) || '0'}%
              </div>
              <div className="text-sm text-slate-600">Savings Ratio</div>
              <div className="text-xs text-slate-500 mt-1">
                Of total income saved
              </div>
            </div>

            {/* Top Contact */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrophyIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-sm font-medium text-purple-600">
                  Most Active
                </div>
              </div>
              {analyticsData?.summary?.topContact ? (
                <>
                  <div className="text-lg font-bold text-slate-900 mb-1 truncate">
                    {analyticsData.summary.topContact.name}
                  </div>
                  <div className="text-sm text-slate-600">Top Contact</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {analyticsData.summary.topContact.transactionCount} transactions • ₹{analyticsData.summary.topContact.totalAmount?.toLocaleString()}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-slate-900 mb-1">No Data</div>
                  <div className="text-sm text-slate-600">Top Contact</div>
                  <div className="text-xs text-slate-500 mt-1">No transactions yet</div>
                </>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Spending Categories */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Spending by Category</h2>
              {categoriesData?.categories?.length > 0 ? (
                <div className="space-y-4">
                  {categoriesData.categories.slice(0, 6).map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="text-lg">{category.icon}</div>
                        <span className="text-slate-700 font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-right min-w-0">
                          <div className="font-semibold text-slate-900">₹{category.totalAmount?.toLocaleString()}</div>
                          <div className="text-sm text-slate-500">{category.percentage?.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <ChartBarIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p>No spending data available</p>
                </div>
              )}
            </motion.div>

            {/* Monthly Trends Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Monthly Trends</h2>
              {trendsData?.trends?.length > 0 ? (
                <MonthlyTrendsChart data={trendsData.trends} />
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p>No trend data available</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Recurring Payments & Net Flow */}
          {recurringData?.recurringPayments?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Recurring Payments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recurringData.recurringPayments.slice(0, 6).map((payment, index) => (
                  <div key={index} className="bg-slate-50 rounded-lg p-4">
                    <div className="font-medium text-slate-900 truncate">{payment.description}</div>
                    <div className="text-sm text-slate-600 mt-1">₹{payment.amount?.toLocaleString()} • Every {payment.avgIntervalDays} days</div>
                    <div className="text-xs text-slate-500 mt-2">
                      Monthly: ₹{payment.estimatedMonthlyAmount?.toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <div className="text-sm font-medium text-yellow-800">
                  Total Recurring: ₹{recurringData.totalRecurringMonthly?.toLocaleString()}/month
                </div>
              </div>
            </motion.div>
          )}

          {/* Smart Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white"
          >
            <h2 className="text-xl font-bold mb-4">Smart Insights</h2>
            {insights?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {insights.slice(0, 4).map((insight, index) => (
                  <div key={index} className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <h3 className="font-semibold mb-2">{insight.icon} {insight.title}</h3>
                    <p className="text-sm opacity-90">{insight.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm opacity-90">No insights available yet. Complete more transactions to get personalized insights!</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Analytics;
