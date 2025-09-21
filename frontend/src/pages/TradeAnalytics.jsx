import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import SubscriptionGate from '../components/SubscriptionGate';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

const TradeAnalytics = () => {
  const { checkFeature } = useFeatureFlags();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [analytics, setAnalytics] = useState({
    portfolio: {
      totalValue: 125000,
      totalPnL: 15230,
      todaysPnL: 2340,
      winRate: 68,
      profitFactor: 1.8,
      sharpeRatio: 1.45
    },
    performance: {
      totalTrades: 247,
      winningTrades: 168,
      losingTrades: 79,
      averageWin: 1250,
      averageLoss: -850,
      largestWin: 5600,
      largestLoss: -2100,
      maxDrawdown: 8.5,
      valueAtRisk: 12500
    },
    strategies: [
      { name: 'Momentum Trading', winRate: 72, pnl: 8500, trades: 89 },
      { name: 'Mean Reversion', winRate: 65, pnl: 4200, trades: 67 },
      { name: 'Breakout Trading', winRate: 58, pnl: 2800, trades: 45 },
      { name: 'Scalping', winRate: 78, pnl: 3200, trades: 156 }
    ],
    marketIntelligence: {
      optionsFlow: 'Bullish bias detected',
      institutionalFlow: 'RELIANCE (+2.3%)',
      sentiment: '68% positive',
      volatility: 'Moderate'
    }
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual trade analytics API
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching trade analytics:', error);
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, change, trend, icon: Icon, color = 'emerald' }) => {
    const colorClasses = {
      emerald: 'from-emerald-500 to-emerald-600',
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600'
    };

    return (
      <motion.div
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        whileHover={{ scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {change && (
            <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
              <span className="font-medium">{change}</span>
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 ml-1" />
              ) : trend === 'down' ? (
                <TrendingDown className="w-4 h-4 ml-1" />
              ) : null}
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
          <p className="text-gray-600 text-sm">{title}</p>
        </div>
      </motion.div>
    );
  };

  const StrategyCard = ({ strategy }) => (
    <motion.div
      className="bg-white rounded-lg p-4 border border-gray-200"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{strategy.name}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          strategy.winRate >= 70 ? 'bg-green-100 text-green-800' : 
          strategy.winRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 
          'bg-red-100 text-red-800'
        }`}>
          {strategy.winRate}% Win Rate
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">P&L:</span>
          <span className={`font-medium ${strategy.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{strategy.pnl.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Trades:</span>
          <span className="font-medium text-gray-900">{strategy.trades}</span>
        </div>
      </div>
    </motion.div>
  );

  if (!checkFeature('canUseTradeAnalytics')) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Trade Analytics</h1>
            <p className="text-gray-600">Advanced trading insights and portfolio analysis</p>
          </div>
          
          <SubscriptionGate 
            feature="canUseTradeAnalytics"
            className="max-w-2xl mx-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trade Analytics</h1>
              <p className="text-gray-600 mt-1">Advanced trading insights and portfolio analysis</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Timeframe Selector */}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
              
              <button
                onClick={fetchAnalytics}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Portfolio Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Total Portfolio Value"
              value={`₹${analytics.portfolio.totalValue.toLocaleString()}`}
              change="+5.2%"
              trend="up"
              icon={DollarSign}
              color="emerald"
            />
            <MetricCard
              title="Total P&L"
              value={`₹${analytics.portfolio.totalPnL.toLocaleString()}`}
              change="+12.2%"
              trend="up"
              icon={TrendingUp}
              color="blue"
            />
            <MetricCard
              title="Today's P&L"
              value={`₹${analytics.portfolio.todaysPnL.toLocaleString()}`}
              change="+1.9%"
              trend="up"
              icon={Activity}
              color="purple"
            />
            <MetricCard
              title="Win Rate"
              value={`${analytics.portfolio.winRate}%`}
              change="+2.1%"
              trend="up"
              icon={Target}
              color="orange"
            />
            <MetricCard
              title="Profit Factor"
              value={analytics.portfolio.profitFactor}
              change="+0.3"
              trend="up"
              icon={Award}
              color="emerald"
            />
            <MetricCard
              title="Sharpe Ratio"
              value={analytics.portfolio.sharpeRatio}
              change="+0.15"
              trend="up"
              icon={BarChart3}
              color="blue"
            />
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Trade Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Total Trades</span>
                <span className="font-semibold text-gray-900">{analytics.performance.totalTrades}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Winning Trades</span>
                <span className="font-semibold text-green-600">{analytics.performance.winningTrades}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Losing Trades</span>
                <span className="font-semibold text-red-600">{analytics.performance.losingTrades}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Average Win</span>
                <span className="font-semibold text-green-600">₹{analytics.performance.averageWin.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Average Loss</span>
                <span className="font-semibold text-red-600">₹{Math.abs(analytics.performance.averageLoss).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Risk Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Maximum Drawdown</span>
                <span className="font-semibold text-red-600">{analytics.performance.maxDrawdown}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Value at Risk (95%)</span>
                <span className="font-semibold text-orange-600">₹{analytics.performance.valueAtRisk.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Largest Win</span>
                <span className="font-semibold text-green-600">₹{analytics.performance.largestWin.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Largest Loss</span>
                <span className="font-semibold text-red-600">₹{Math.abs(analytics.performance.largestLoss).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Strategy Performance */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Strategy Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.strategies.map((strategy, index) => (
              <StrategyCard key={index} strategy={strategy} />
            ))}
          </div>
        </div>

        {/* Market Intelligence */}
        <motion.div
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Market Intelligence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Options Flow</h4>
              <p className="text-sm text-gray-600">{analytics.marketIntelligence.optionsFlow}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Institutional Flow</h4>
              <p className="text-sm text-gray-600">{analytics.marketIntelligence.institutionalFlow}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Market Sentiment</h4>
              <p className="text-sm text-gray-600">{analytics.marketIntelligence.sentiment}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Volatility</h4>
              <p className="text-sm text-gray-600">{analytics.marketIntelligence.volatility}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TradeAnalytics;
