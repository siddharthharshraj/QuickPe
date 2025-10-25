import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ArrowPathIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AnalyticsSkeleton } from '../components/LazyComponents';
import { MonthlyTrendsChart } from '../components/AnalyticsChart';
import useAnalyticsSync from '../hooks/useAnalyticsSync';
import apiClient from '../services/api/client.js';
import memoryManager from '../utils/memoryManager';
import { toast } from 'react-hot-toast';

export const Analytics = () => {
  
  // State management with memory optimization
  const [state, setState] = useState({
    loading: true,
    showSkeleton: true,
    timeRange: 'month',
    error: null
  });

  // Data stores using memory-efficient structures
  const [analyticsData, setAnalyticsData] = useState(null);
  const [categoriesData, setCategoriesData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [recurringData, setRecurringData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [userData, setUserData] = useState(null);

  // Memoized health score calculations
  const getHealthScoreColor = useCallback((score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  const getHealthScoreBg = useCallback((score) => {
    if (score >= 80) return 'bg-emerald-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  }, []);

  // Optimized data fetching with caching
  const fetchAllAnalytics = useCallback(async () => {
    const cacheKey = `analytics_${state.timeRange}`;
    const cached = memoryManager.getCache(cacheKey);
    
    if (cached) {
      setAnalyticsData(cached.analyticsData);
      setCategoriesData(cached.categoriesData);
      setTrendsData(cached.trendsData);
      setRecurringData(cached.recurringData);
      setInsights(cached.insights);
      setUserData(cached.userData);
      setState(prev => ({ ...prev, loading: false, showSkeleton: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));
      const startTime = Date.now();
      
      const skeletonTimer = setTimeout(() => {
        setState(prev => ({ ...prev, showSkeleton: false }));
      }, 2000);
      
      console.log('📊 Fetching analytics data...');
      
      // Fetch all data in parallel
      const [userResponse, ...responses] = await Promise.all([
        apiClient.get('/user/profile'),
        apiClient.get(`/analytics-comprehensive/summary?timeRange=${state.timeRange}`),
        apiClient.get(`/analytics-comprehensive/categories?timeRange=${state.timeRange}`),
        apiClient.get('/analytics-comprehensive/trends?months=6'),
        apiClient.get('/analytics-comprehensive/recurring'),
        apiClient.get(`/analytics-comprehensive/insights?timeRange=${state.timeRange}`)
      ]);
      
      console.log('✅ Analytics data fetched successfully');

      // Process responses
      const [summaryRes, categoriesRes, trendsRes, recurringRes, insightsRes] = responses;
      
      const result = {
        analyticsData: summaryRes.data,
        categoriesData: categoriesRes.data,
        trendsData: trendsRes.data,
        recurringData: recurringRes.data,
        insights: insightsRes.data.insights || [],
        userData: userResponse.data.user
      };

      // Cache for 5 minutes
      memoryManager.setCache(cacheKey, result, 300000);
      
      setAnalyticsData(result.analyticsData);
      setCategoriesData(result.categoriesData);
      setTrendsData(result.trendsData);
      setRecurringData(result.recurringData);
      setInsights(result.insights);
      setUserData(result.userData);

      clearTimeout(skeletonTimer);
      setTimeout(() => {
        setState(prev => ({ ...prev, showSkeleton: false }));
      }, Math.max(0, 2000 - (Date.now() - startTime)));
      
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        showSkeleton: false,
        error: error.message || 'Failed to load analytics'
      }));
    }
  }, [state.timeRange]);

  // Fetch data on mount and when timeRange changes
  useEffect(() => {
    fetchAllAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.timeRange]);

  // Real-time sync with memory optimization
  useAnalyticsSync(fetchAllAnalytics);

  // Export analytics data
  const exportPDF = useCallback(async () => {
    try {
      // Use backend API for PDF export
      const response = await apiClient.get('/analytics/export?format=pdf');
      
      if (response.data && response.data.success) {
        toast.success('Analytics exported successfully!');
        
        // If backend returns download URL or data
        if (response.data.downloadUrl) {
          window.open(response.data.downloadUrl, '_blank');
        }
      } else {
        toast.info('PDF export available via backend API');
      }
      
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics');
    }
  }, []);

  // Show error state if there's an error
  if (state.error && !state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Analytics</h2>
            <p className="text-gray-600 mb-6">{state.error}</p>
            <button
              onClick={() => {
                setState(prev => ({ ...prev, error: null, loading: true }));
                fetchAllAnalytics();
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show skeleton while loading
  if (state.loading || state.showSkeleton) {
    return (
      <>
        <Header />
        <AnalyticsSkeleton />
        <Footer />
      </>
    );
  }

  // Main render with optimized components
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
                <button
                  onClick={exportPDF}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  <span>Export PDF</span>
                </button>
                
                <select
                  value={state.timeRange}
                  onChange={(e) => setState(prev => ({ ...prev, timeRange: e.target.value }))}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                
                <button
                  onClick={fetchAllAnalytics}
                  disabled={state.loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Analytics Content */}
          {analyticsData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Current Balance</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        ₹{userData?.balance?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CurrencyRupeeIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Total Spending</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">
                        ₹{analyticsData.totalSpending?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Total Income</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">
                        ₹{analyticsData.totalIncome?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <ArrowTrendingUpIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Net Flow</p>
                      <p className={`text-2xl font-bold mt-1 ${(analyticsData.netFlow || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ₹{analyticsData.netFlow?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ScaleIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Charts Section */}
              {trendsData && trendsData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Trends</h3>
                  <MonthlyTrendsChart data={trendsData} />
                </motion.div>
              )}

              {/* Insights */}
              {insights && insights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Financial Insights</h3>
                  <div className="space-y-3">
                    {insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <TrophyIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{insight.title}</p>
                          <p className="text-sm text-slate-600 mt-1">{insight.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* No Data State */}
          {!analyticsData && !state.loading && (
            <div className="text-center py-12">
              <ChartBarIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No analytics data available</p>
              <button
                onClick={fetchAllAnalytics}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Load Analytics
              </button>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Analytics;
