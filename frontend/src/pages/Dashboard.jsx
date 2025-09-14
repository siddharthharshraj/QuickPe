import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CurrencyRupeeIcon, 
  PaperAirplaneIcon, 
  DevicePhoneMobileIcon,
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { Appbar } from "../components/Appbar"
import { Balance } from "../components/Balance"
import { Users } from "../components/Users"
import { QuickPeId } from "../components/QuickPeId";
import { SendMoneyByUPI } from "../components/SendMoneyByUPI";
import { UnifiedTransactionHistory } from "../components/UnifiedTransactionHistory";
import { RecentActivity } from "../components/RecentActivity";
import { AuditTrail } from "../components/AuditTrail";
import { AnalyticsDashboard } from "../components/AnalyticsDashboard";
import { AIAutoCategorization } from "../components/AIAutoCategorization";
import { NotificationSystem } from '../components/NotificationSystem';
import { NotificationToast } from "../components/NotificationToast";
import { Footer } from "../components/Footer"
import { useSocket } from "../sockets/useSocket"
import { useTransactionSync } from "../hooks/useTransactionSync"
import { jwtDecode } from "jwt-decode"

export const Dashboard = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [userId, setUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('send'); // 'send', 'upi', 'history', 'analytics', 'audit', 'ai'
    const [recentActivityRefresh, setRecentActivityRefresh] = useState(null);

    // Set up transaction sync to refresh Recent Activity when transactions change
    useTransactionSync(() => {
        if (recentActivityRefresh) {
            recentActivityRefresh();
        }
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
        console.log('🔍 Dashboard - checking token:', !!token);
        console.log('🔍 Dashboard - full token:', token?.substring(0, 50) + '...');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                console.log('🔍 Dashboard - decoded token:', decoded);
                console.log('🔍 Dashboard - userId from token:', decoded.userId);
                console.log('🔍 Dashboard - userId type:', typeof decoded.userId);
                setUserId(decoded.userId);
                console.log('✅ Dashboard - set userId:', decoded.userId);
            } catch (error) {
                console.error("❌ Dashboard - Error decoding token:", error);
            }
        } else {
            console.log('⚠️ Dashboard - No token found in localStorage');
        }
    }, []);

    const handleNotification = (data) => {
        const notification = {
            id: Date.now(),
            ...data
        };
        setNotifications(prev => [...prev, notification]);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
    };

    // Initialize socket connection
    useSocket(userId, handleNotification);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const tabConfig = [
        { id: 'send', label: 'Send Money', icon: <PaperAirplaneIcon className="h-4 w-4" />, color: 'blue' },
        { id: 'upi', label: 'QuickPe UPI', icon: <DevicePhoneMobileIcon className="h-4 w-4" />, color: 'purple' },
        { id: 'history', label: 'History', icon: <ClockIcon className="h-4 w-4" />, color: 'green' },
        { id: 'analytics', label: 'Analytics', icon: <ChartBarIcon className="h-4 w-4" />, color: 'orange' },
        { id: 'audit', label: 'Audit Trail', icon: <ShieldCheckIcon className="h-4 w-4" />, color: 'red' },
        { id: 'ai', label: 'AI Assistant', icon: <SparklesIcon className="h-4 w-4" />, color: 'indigo' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Appbar />
            {userId && (
                <div className="fixed top-4 right-4 z-50">
                    <NotificationSystem userId={userId} />
                </div>
            )}
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                >
                    {/* Welcome Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back! 👋</h1>
                        <p className="text-gray-600">Manage your digital wallet with ease and security.</p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                        {/* Left Column - Main Actions */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Balance and QuickPe ID Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.1 }}
                                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20"
                                >
                                    <Balance />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20"
                                >
                                    <QuickPeId />
                                </motion.div>
                            </div>
                            
                            {/* Enhanced Tab Navigation */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden"
                            >
                                <div className="border-b border-gray-200/50">
                                    <nav className="flex overflow-x-auto scrollbar-hide">
                                        <div className="flex min-w-full">
                                            {tabConfig.map((tab) => {
                                                const isActive = activeTab === tab.id;
                                                const colorClasses = {
                                                    blue: isActive ? 'border-blue-500 text-blue-600 bg-blue-50' : 'hover:text-blue-600',
                                                    purple: isActive ? 'border-purple-500 text-purple-600 bg-purple-50' : 'hover:text-purple-600',
                                                    green: isActive ? 'border-green-500 text-green-600 bg-green-50' : 'hover:text-green-600',
                                                    orange: isActive ? 'border-orange-500 text-orange-600 bg-orange-50' : 'hover:text-orange-600',
                                                    red: isActive ? 'border-red-500 text-red-600 bg-red-50' : 'hover:text-red-600',
                                                    indigo: isActive ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'hover:text-indigo-600'
                                                };
                                                
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setActiveTab(tab.id)}
                                                        className={`flex-1 min-w-0 py-3 px-2 sm:px-4 text-center font-medium text-xs sm:text-sm border-b-2 transition-all duration-200 flex flex-col items-center justify-center space-y-1 whitespace-nowrap ${
                                                            isActive
                                                                ? `${colorClasses[tab.color]} border-opacity-100`
                                                                : `border-transparent text-gray-500 hover:bg-gray-50 ${colorClasses[tab.color]}`
                                                        }`}
                                                    >
                                                        <div className="flex-shrink-0">{tab.icon}</div>
                                                        <span className="hidden sm:block truncate">{tab.label}</span>
                                                        <span className="sm:hidden text-xs truncate">{tab.label.split(' ')[0]}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </nav>
                                </div>
                                
                                <motion.div 
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-4 sm:p-6 overflow-hidden"
                                >
                                    {activeTab === 'send' && <Users />}
                                    {activeTab === 'upi' && <SendMoneyByUPI />}
                                    {activeTab === 'history' && <UnifiedTransactionHistory />}
                                    {activeTab === 'analytics' && <AnalyticsDashboard />}
                                    {activeTab === 'audit' && <AuditTrail />}
                                    {activeTab === 'ai' && <AIAutoCategorization />}
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Right Column - Activity & Notifications */}
                        <div className="space-y-6">
                            {/* Recent Activity Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <ClockIcon className="h-5 w-5 text-slate-600" />
                                        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Recent Activity</h2>
                                    </div>
                                    <button
                                        onClick={() => navigate('/transaction-history')}
                                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                                    >
                                        View All →
                                    </button>
                                </div>
                                <div className="overflow-hidden">
                                    <RecentActivity onTransactionUpdate={setRecentActivityRefresh} />
                                </div>
                            </motion.div>

                            {/* Quick Stats Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white"
                            >
                                <div className="flex items-center space-x-2 mb-4">
                                    <ChartBarIcon className="h-5 w-5" />
                                    <h3 className="text-lg font-semibold">Quick Stats</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-blue-100">This Month</span>
                                        <span className="font-semibold">₹12,450</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-blue-100">Transactions</span>
                                        <span className="font-semibold">23</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-blue-100">Success Rate</span>
                                        <span className="font-semibold">100%</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Notifications Panel */}
                            {notifications.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.6 }}
                                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6"
                                >
                                    <div className="flex items-center space-x-2 mb-4">
                                        <BellIcon className="h-5 w-5 text-gray-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {notifications.slice(0, 3).map((notification) => (
                                            <div key={notification.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <p className="text-sm text-blue-800">{notification.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
        </div>
        <Footer />
        <NotificationToast notifications={notifications} />
    </div>
);
};

export default Dashboard;