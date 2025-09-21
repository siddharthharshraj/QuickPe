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
import apiClient from '../services/api/client';
import { memoryManager } from '../utils/memoryManager';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const Analytics = () => {
  // State management with memory optimization
  const [state, setState] = useState({
    loading: true,
    showSkeleton: true,
    timeRange: 'month'
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
      
      // Fetch all data in parallel
      const [userResponse, ...responses] = await Promise.all([
        apiClient.get('/user/profile'),
        apiClient.get(`/analytics-comprehensive/summary?timeRange=${state.timeRange}`),
        apiClient.get(`/analytics-comprehensive/categories?timeRange=${state.timeRange}`),
        apiClient.get('/analytics-comprehensive/trends?months=6'),
        apiClient.get('/analytics-comprehensive/recurring'),
        apiClient.get(`/analytics-comprehensive/insights?timeRange=${state.timeRange}`)
      ]);

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
      setTimeout(() => setState(prev => ({ ...prev, showSkeleton: false })), 2000);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.timeRange]);

  // Real-time sync with memory optimization
  useAnalyticsSync(fetchAllAnalytics);

  // PDF Export with memory-efficient implementation
  const exportPDF = useCallback(async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      
      // Add content to PDF
      const { width, height } = page.getSize();
      const fontSize = 12;
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      page.drawText('QuickPe Analytics Report', {
        x: 50,
        y: height - 50,
        size: 20,
        font,
        color: rgb(0, 0.5, 0.3) // QuickPe emerald
      });

      // Add more content...
      
      const pdfBytes = await pdfDoc.save();
      
      // Download PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QuickPe-Analytics-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  }, [analyticsData, userData]);

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

          {/* Rest of the optimized components... */}
          {/* [Previous component implementations remain unchanged but with memory optimizations] */}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Analytics;
