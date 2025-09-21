import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  PaperAirplaneIcon,
  ClockIcon,
  ChartBarIcon,
  BanknotesIcon,
  ArrowRightIcon,
  PlusIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Balance } from '../components/Balance';
import { RecentActivity } from '../components/RecentActivity';
import { LogoLoader } from '../components/LogoLoader';
import AuditTrailPreview from '../components/AuditTrailPreview';
import { Link } from 'react-router-dom';
import apiClient from '../services/api/client';
import { useMemoryManager } from '../utils/memoryManager';
import driver from 'driver.js';

export const DashboardHome = () => {
  const navigate = useNavigate();
  // Temporarily disabled memory manager to fix errors
  // const componentRef = useRef({});
  // const memoryManager = useMemoryManager(componentRef.current);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalTransactions: 0,
    totalSent: 0,
    totalReceived: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [showLogoLoader, setShowLogoLoader] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);

  // Initialize socket for real-time updates
  const { socket, isConnected } = useSocket(userId, (notification) => {
    console.log('Dashboard received notification:', notification);
    // Refresh dashboard data when notifications arrive
    fetchDashboardData();
  });

  useEffect(() => {
    // Listen for real-time transaction updates
    const handleNewTransaction = (event) => {
      console.log('🆕 New transaction event received in Dashboard:', event.detail);
      setTimeout(() => {
        fetchDashboardData();
      }, 100);
    };

    const handleTransactionUpdate = (event) => {
      console.log('🔄 Transaction update event received in Dashboard:', event.detail);
      fetchDashboardData();
    };

    const handleBalanceUpdate = (event) => {
      console.log('💰 Balance update event received in Dashboard:', event.detail);
      const balanceData = event.detail;
      if (balanceData.userId && balanceData.newBalance !== undefined) {
        setStats(prevStats => ({
          ...prevStats,
          totalBalance: balanceData.newBalance
        }));
      }
      setTimeout(() => {
        fetchDashboardData();
      }, 100);
    };

    const handleAnalyticsUpdate = (event) => {
      console.log('📊 Analytics update event received in Dashboard:', event.detail);
      fetchDashboardData();
    };

    const handleCacheInvalidate = (event) => {
      console.log('🗑️ Cache invalidate event received in Dashboard:', event.detail);
      const data = event.detail;
      if (data.patterns && (data.patterns.includes('balance') || data.patterns.includes('transactions'))) {
        fetchDashboardData();
      }
    };

    // Add event listeners for real-time updates
    window.addEventListener('transaction:new', handleNewTransaction);
    window.addEventListener('transaction:update', handleTransactionUpdate);
    window.addEventListener('balance:update', handleBalanceUpdate);
    window.addEventListener('analytics:update', handleAnalyticsUpdate);
    window.addEventListener('newTransaction', handleNewTransaction); // Legacy support
    window.addEventListener('cacheInvalidate', handleCacheInvalidate);

    return () => {
      window.removeEventListener('transaction:new', handleNewTransaction);
      window.removeEventListener('transaction:update', handleTransactionUpdate);
      window.removeEventListener('balance:update', handleBalanceUpdate);
      window.removeEventListener('analytics:update', handleAnalyticsUpdate);
      window.removeEventListener('newTransaction', handleNewTransaction);
      window.removeEventListener('cacheInvalidate', handleCacheInvalidate);
    };
  }, []);

  // Handle balance updates from Balance component
  const handleBalanceUpdate = async (newBalance) => {
    console.log('Balance updated from Balance component:', newBalance);
    setStats(prevStats => ({
      ...prevStats,
      totalBalance: newBalance
    }));
    
    // Refetch dashboard data to update all stats with real calculations
    try {
      await fetchDashboardData();
    } catch (error) {
      console.error('Error refetching dashboard data after balance update:', error);
    }
  };


  useEffect(() => {
    console.log('DashboardHome useEffect triggered');
    
    // Always start with loading state
    setLoading(true);
    setShowSkeleton(false);
    setShowLogoLoader(false);
    
    loadUserData();
    
    // Start fetching data immediately
    setTimeout(() => {
      fetchDashboardData();
    }, 500);
    
    // Check if this is the first visit to show tour
    const hasSeenTour = localStorage.getItem('dashboard-tour-seen');
    if (!hasSeenTour) {
      setTimeout(() => {
        startDashboardTour();
        localStorage.setItem('dashboard-tour-seen', 'true');
      }, 3000);
    }
  }, []);

  // Handle logo loader completion
  const handleLogoLoaderComplete = () => {
    setShowLogoLoader(false);
    setShowSkeleton(true);
    // Start fetching data after logo loader completes
    setTimeout(() => {
      fetchDashboardData();
    }, 100);
  };

  const loadUserData = () => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setUserName(userData.firstName || 'User');
        setUserId(userData.id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchDashboardData = async () => {
    console.log('fetchDashboardData called');
    try {
      // Fetch balance and analytics data for accurate stats
      const [balanceRes, analyticsRes, transactionsRes] = await Promise.all([
        apiClient.get('/account/balance'),
        apiClient.get('/analytics/overview'),
        apiClient.get('/account/transactions?limit=5')
      ]);

      console.log('Dashboard balance fetch:', balanceRes.data);
      console.log('Dashboard analytics fetch:', analyticsRes.data);
      
      const currentBalance = balanceRes.data.balance || 0;
      const analytics = analyticsRes.data.overview || {};
      const transactions = transactionsRes.data.transactions || [];
      
      const newStats = {
        totalBalance: analytics.currentBalance || currentBalance,
        totalTransactions: analytics.transactionCount || transactions.length,
        totalSent: analytics.totalSpending || 0,
        totalReceived: analytics.totalIncome || 0,
        recentTransactions: transactions
      };
      
      setStats(newStats);
      console.log('Updated stats from analytics:', newStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setStats({
        totalBalance: 0,
        totalTransactions: 0,
        totalSent: 0,
        totalReceived: 0,
        recentTransactions: []
      });
    } finally {
      // Immediately stop loading
      console.log('Setting loading to false');
      setLoading(false);
      setShowSkeleton(false);
    }
  };


  const startDashboardTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#dashboard-welcome',
          popover: {
            title: 'Welcome to Your Dashboard',
            description: 'This is your personal QuickPe dashboard where you can manage all your financial activities.'
          }
        },
        {
          element: '#balance-card',
          popover: {
            title: 'Your Balance',
            description: 'View your current account balance and add money to your wallet.'
          }
        },
        {
          element: '#stats-overview',
          popover: {
            title: 'Transaction Statistics',
            description: 'Get insights into your transaction history and spending patterns.'
          }
        },
        {
          element: '#quick-actions',
          popover: {
            title: 'Quick Actions',
            description: 'Access frequently used features like sending money, viewing history, and analytics.'
          }
        },
        {
          element: '#recent-transactions',
          popover: {
            title: 'Recent Activity',
            description: 'View your latest transactions and monitor your account activity.'
          }
        }
      ]
    });
    driverObj.drive();
  };

  const quickActions = [
    {
      title: 'Send Money',
      description: 'Transfer funds to other users',
      icon: BanknotesIcon,
      color: 'from-emerald-500 to-teal-600',
      path: '/send-money'
    },
    {
      title: 'Transaction History',
      description: 'View all your transactions',
      icon: ClockIcon,
      color: 'from-blue-500 to-indigo-600',
      path: '/transaction-history'
    },
    {
      title: 'Analytics',
      description: 'Detailed spending insights',
      icon: ChartBarIcon,
      color: 'from-purple-500 to-pink-600',
      path: '/analytics'
    },
    {
      title: 'AI Assistant',
      description: 'Smart financial insights',
      icon: UserGroupIcon,
      color: 'from-orange-500 to-red-600',
      path: '/ai-assistant'
    }
  ];

  const statCards = [
    {
      title: 'Total Balance',
      value: `₹${stats.totalBalance.toLocaleString()}`,
      change: '+12.5%',
      changeType: 'positive',
      icon: CurrencyRupeeIcon,
      color: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'Total Sent',
      value: `₹${stats.totalSent.toLocaleString()}`,
      change: '+8.2%',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Total Received',
      value: `₹${stats.totalReceived.toLocaleString()}`,
      change: '+15.3%',
      changeType: 'positive',
      icon: ArrowTrendingDownIcon,
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Transactions',
      value: stats.totalTransactions.toString(),
      change: '+23.1%',
      changeType: 'positive',
      icon: ChartBarIcon,
      color: 'from-orange-500 to-red-600'
    }
  ];

  // Show logo loader if needed
  if (showLogoLoader) {
    return <LogoLoader onComplete={handleLogoLoaderComplete} />;
  }

  // Show skeleton while loading
  if (showSkeleton || loading) {
    return (
      <>
        <Header />
        <PageSkeleton type="dashboard" />
        <Footer />
      </>
    );
  }

  // Debug: Log render state
  console.log('DashboardHome rendering with stats:', stats, 'loading:', loading, 'showSkeleton:', showSkeleton);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
      <Header />
      
      <div className="flex-1 pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <motion.div
            id="dashboard-welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, {userName}! 👋</h1>
            <p className="text-slate-600">Manage your digital wallet with ease and security.</p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            id="stats-overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {statCards.map((stat, index) => (
              <div
                key={stat.title}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.title}</div>
              </div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Balance Card */}
            <motion.div
              id="balance-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <Balance onBalanceUpdate={handleBalanceUpdate} />
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              id="quick-actions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-2"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <PlusIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.title}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(action.path)}
                      className="group bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 rounded-xl p-4 text-left transition-all duration-200 border border-slate-200 hover:border-slate-300"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1">{action.title}</h3>
                      <p className="text-sm text-slate-600">{action.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Transactions */}
          <motion.div
            id="recent-transactions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Recent Transactions</h2>
                <button
                  onClick={() => navigate('/transaction-history')}
                  className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  <span>View All</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {stats.recentTransactions.length > 0 ? (
                  stats.recentTransactions.slice(0, 3).map((transaction, index) => (
                    <div key={transaction._id || index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'credit' ? 'bg-emerald-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <ArrowTrendingDownIcon className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <ArrowTrendingUpIcon className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {transaction.type === 'credit' ? 'Received' : 'Sent'}
                          </p>
                          <p className="text-sm text-slate-600">
                            {new Date(transaction.timestamp || transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        transaction.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toLocaleString() || 0}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <ClockIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>No recent transactions</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Audit Trail Preview */}
          <motion.div
            id="audit-trail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Audit Trail</h2>
                <button
                  onClick={() => navigate('/audit-trail')}
                  className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  <span>View All</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
              
              <AuditTrailPreview />
            </div>
          </motion.div>

        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default DashboardHome;
