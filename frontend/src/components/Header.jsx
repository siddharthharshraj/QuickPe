import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bars3Icon, 
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  BellIcon,
  HomeIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ServerIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { NotificationSystem } from './NotificationSystem';
import QuickPeLogo from './QuickPeLogo';
import AdminButton from './AdminButton';
import { AuthContext } from '../contexts/AuthContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

export const Header = () => {
    const navigate = useNavigate();
    const { user: contextUser, updateUser } = useContext(AuthContext);
    const { getSubscriptionInfo, checkFeature } = useFeatureFlags();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [lastLogin, setLastLogin] = useState('');
    const [user, setUser] = useState(null);
    const location = useLocation();
    
    const subscriptionInfo = getSubscriptionInfo;

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        console.log('Header useEffect - token:', !!token, 'user:', user);
        
        if (token && user) {
            setIsAuthenticated(true);
            try {
                const userData = JSON.parse(user);
                console.log('Parsed user data:', userData);
                console.log('User isAdmin:', userData.isAdmin);
                setUserName(userData.firstName || userData.username || 'User');
                setLastLogin(userData.lastLogin);
                setUser(userData);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        } else {
            setIsAuthenticated(false);
            setUserName('');
            setUser(null);
            navigate('/signin');
        }
    }, [location]);


    const formatLastLogin = (lastLoginTime) => {
        if (!lastLoginTime) return '';
        const date = new Date(lastLoginTime);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };


    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        navigate('/');
    };

    const handleUserMenuClick = (action) => {
        setUserDropdownOpen(false);
        if (action === 'settings') {
            navigate('/settings');
        } else if (action === 'logout') {
            handleLogout();
        }
    };

    // Different navigation items for admin vs regular users
    const adminNavigationItems = [
        { name: 'Admin Dashboard', href: '/admin', icon: ShieldCheckIcon, authRequired: true, adminOnly: true },
        { name: 'System Logs', href: '/admin/logs', icon: ServerIcon, authRequired: true, adminOnly: true },
        { name: 'Database Status', href: '/admin/database', icon: DocumentTextIcon, authRequired: true, adminOnly: true },
    ];
    
    const regularNavigationItems = [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, authRequired: true },
        { name: 'Send Money', href: '/send-money', icon: UserCircleIcon, authRequired: true, feature: 'canSendMoney' },
        { name: 'Transaction History', href: '/transaction-history', icon: ChartBarIcon, authRequired: true },
        { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, authRequired: true, feature: 'canViewAnalytics' },
        { name: 'AI Assistant', href: '/ai-assistant', icon: Cog6ToothIcon, authRequired: true },
        { name: 'Upgrade', href: '/upgrade', icon: CreditCardIcon, authRequired: true, trialOnly: true },
    ];
    
    // Use admin navigation if user is admin, otherwise use regular navigation
    const navigationItems = (user && user.isAdmin) ? adminNavigationItems : regularNavigationItems;

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div 
                        className="flex-shrink-0 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <QuickPeLogo size="lg" className="hover:scale-105 transition-transform duration-200" />
                    </div>
                    
                    {/* Desktop Navigation - Responsive */}
                    <nav className="hidden md:flex items-center">
                        {/* Primary Navigation - Always Visible */}
                        <div className="flex items-center space-x-1 xl:space-x-2">
                            {navigationItems.slice(0, 4).map((item) => {
                                if (item.authRequired && !isAuthenticated) return null;
                                if (item.adminOnly && (!user || !user.isAdmin)) return null;
                                if (item.trialOnly && (!subscriptionInfo?.isTrialActive && !subscriptionInfo?.isExpired)) return null;
                                if (item.feature && !checkFeature(item.feature) && !user?.isAdmin) return null;
                                
                                const isActive = location.pathname === item.href;
                                const Icon = item.icon;
                                const isLocked = item.feature && !checkFeature(item.feature) && !user?.isAdmin;
                                
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => navigate(item.href)}
                                        className={`flex items-center space-x-1 xl:space-x-2 px-2 xl:px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all duration-200 relative ${
                                            isActive
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : isLocked
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                                        }`}
                                        disabled={isLocked}
                                    >
                                        <Icon className="h-3 w-3 xl:h-4 xl:w-4" />
                                        <span className="hidden lg:inline">{item.name}</span>
                                        <span className="lg:hidden">{item.name.split(' ')[0]}</span>
                                        {item.trialOnly && (
                                            <span className="ml-1 px-1 py-0.5 text-xs bg-orange-100 text-orange-600 rounded hidden xl:inline">
                                                Upgrade
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* More Menu for Additional Items */}
                        {navigationItems.slice(4).some(item => 
                            (!item.authRequired || isAuthenticated) && 
                            (!item.adminOnly || (user && user.isAdmin)) &&
                            (!item.trialOnly || (subscriptionInfo?.isTrialActive || subscriptionInfo?.isExpired)) &&
                            (!item.feature || checkFeature(item.feature) || user?.isAdmin)
                        ) && (
                            <div className="relative ml-2">
                                <button
                                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                    className="flex items-center space-x-1 px-2 py-2 rounded-lg text-xs xl:text-sm font-medium text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
                                >
                                    <span className="hidden lg:inline">More</span>
                                    <span className="lg:hidden">•••</span>
                                    <ChevronDownIcon className="h-3 w-3 xl:h-4 xl:w-4" />
                                </button>
                                
                                {userDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[9999]">
                                        {navigationItems.slice(4).map((item) => {
                                            if (item.authRequired && !isAuthenticated) return null;
                                            if (item.adminOnly && (!user || !user.isAdmin)) return null;
                                            if (item.trialOnly && (!subscriptionInfo?.isTrialActive && !subscriptionInfo?.isExpired)) return null;
                                            if (item.feature && !checkFeature(item.feature) && !user?.isAdmin) return null;
                                            
                                            const isActive = location.pathname === item.href;
                                            const Icon = item.icon;
                                            const isLocked = item.feature && !checkFeature(item.feature) && !user?.isAdmin;
                                            
                                            return (
                                                <button
                                                    key={item.name}
                                                    onClick={() => {
                                                        navigate(item.href);
                                                        setUserDropdownOpen(false);
                                                    }}
                                                    className={`flex items-center space-x-3 w-full px-4 py-2 text-sm transition-all duration-200 ${
                                                        isActive
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : isLocked
                                                            ? 'text-gray-400 cursor-not-allowed'
                                                            : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                                                    }`}
                                                    disabled={isLocked}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    <span>{item.name}</span>
                                                    {item.trialOnly && (
                                                        <span className="ml-auto px-1.5 py-0.5 text-xs bg-orange-100 text-orange-600 rounded">
                                                            Upgrade
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </nav>

                    {/* Auth Section */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                {/* Welcome Message with Trial Status - Responsive */}
                                <div className="hidden xl:block text-right">
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium text-gray-900">
                                            Welcome, {userName}!
                                        </div>
                                        {subscriptionInfo?.isTrialActive && (
                                            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded-full">
                                                Trial ({subscriptionInfo.trialDaysLeft} days left)
                                            </span>
                                        )}
                                        {subscriptionInfo?.isExpired && (
                                            <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                                                Expired
                                            </span>
                                        )}
                                        {subscriptionInfo?.isSubscriptionActive && (
                                            <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-600 rounded-full">
                                                {subscriptionInfo.plan?.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    {lastLogin && (
                                        <div className="text-xs text-gray-500">
                                            Last login: {formatLastLogin(lastLogin)}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Compact Status for Medium Screens */}
                                <div className="hidden lg:block xl:hidden">
                                    {subscriptionInfo?.isTrialActive && (
                                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded-full">
                                            Trial
                                        </span>
                                    )}
                                    {subscriptionInfo?.isExpired && (
                                        <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                                            Expired
                                        </span>
                                    )}
                                    {subscriptionInfo?.isSubscriptionActive && (
                                        <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-600 rounded-full">
                                            {subscriptionInfo.plan?.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Admin Button - Responsive */}
                                <AdminButton className="hidden lg:block" />

                                {/* Notifications */}
                                <NotificationSystem userId={user?._id} />

                                {/* User Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                        className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                        <UserCircleIcon className="h-5 w-5 text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-700">{userName}</span>
                                        <ChevronDownIcon className="h-4 w-4 text-emerald-500" />
                                    </button>

                                    {userDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[9998]">
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-sm font-medium text-gray-900">Welcome, {userName}!</p>
                                                {lastLogin && (
                                                    <p className="text-xs text-gray-500">Last login: {formatLastLogin(lastLogin)}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleUserMenuClick('settings')}
                                                className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <Cog6ToothIcon className="h-4 w-4" />
                                                <span>User Settings</span>
                                            </button>
                                            <hr className="my-1" />
                                            <button
                                                onClick={() => handleUserMenuClick('logout')}
                                                className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-2 lg:space-x-3">
                                <button
                                    onClick={() => navigate('/contact')}
                                    className="hidden lg:block text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Contact Developer
                                </button>
                                <button
                                    onClick={() => navigate('/signin')}
                                    className="text-slate-600 hover:text-emerald-600 px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 lg:px-6 py-2 rounded-lg text-xs lg:text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Get Started
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                            {isMobileMenuOpen ? (
                                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                            ) : (
                                <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="px-3 pt-3 pb-4 space-y-2">
                            {navigationItems.map((item) => {
                                if (item.authRequired && !isAuthenticated) return null;
                                if (item.adminOnly && (!user || !user.isAdmin)) return null;
                                if (item.trialOnly && (!subscriptionInfo?.isTrialActive && !subscriptionInfo?.isExpired)) return null;
                                if (item.feature && !checkFeature(item.feature) && !user?.isAdmin) return null;
                                
                                const isActive = location.pathname === item.href;
                                const Icon = item.icon;
                                const isLocked = item.feature && !checkFeature(item.feature) && !user?.isAdmin;
                                
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => {
                                            navigate(item.href);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            isActive
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : isLocked
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                                        }`}
                                        disabled={isLocked}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{item.name}</span>
                                        {item.trialOnly && (
                                            <span className="ml-auto px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded">
                                                Upgrade
                                            </span>
                                        )}
                                    </button>
                                );
                            })}

                            {/* Mobile Admin Button */}
                            <AdminButton className="w-full" />

                            {/* Mobile User Actions */}
                            {isAuthenticated && (
                                <>
                                    <hr className="my-3" />
                                    <div className="px-3 py-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Welcome, {userName}!</p>
                                                {lastLogin && (
                                                    <p className="text-xs text-gray-500">Last login: {formatLastLogin(lastLogin)}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {subscriptionInfo?.isTrialActive && (
                                                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded-full">
                                                        Trial ({subscriptionInfo.trialDaysLeft}d)
                                                    </span>
                                                )}
                                                {subscriptionInfo?.isExpired && (
                                                    <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                                                        Expired
                                                    </span>
                                                )}
                                                {subscriptionInfo?.isSubscriptionActive && (
                                                    <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-600 rounded-full">
                                                        {subscriptionInfo.plan?.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigate('/settings');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
                                    >
                                        <Cog6ToothIcon className="h-5 w-5" />
                                        <span>User Settings</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                                    >
                                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                        <span>Logout</span>
                                    </button>
                                </>
                            )}
                            
                            {/* Mobile Auth Buttons for Non-Authenticated Users */}
                            {!isAuthenticated && (
                                <div className="space-y-2 pt-3 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            navigate('/signin');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left"
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/signup');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-all duration-200"
                                    >
                                        Get Started
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};
export default Header;
