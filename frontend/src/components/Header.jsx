import React, { useState, useEffect } from 'react';
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
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { NotificationSystem } from './NotificationSystem';
import QuickPeLogo from './QuickPeLogo';

export const Header = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [lastLogin, setLastLogin] = useState('');
    const [user, setUser] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        console.log('Header useEffect - token:', !!token, 'user:', user);
        
        if (token && user) {
            setIsAuthenticated(true);
            try {
                const userData = JSON.parse(user);
                setUserName(userData.firstName || userData.username || 'User');
                setLastLogin(userData.lastLogin);
                setUser(userData);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        } else {
            setIsAuthenticated(false);
            setUserName('');
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

    const navigationItems = [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, authRequired: true },
        { name: 'Send Money', href: '/send-money', icon: UserCircleIcon, authRequired: true },
        { name: 'Transaction History', href: '/transaction-history', icon: ChartBarIcon, authRequired: true },
        { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, authRequired: true },
        { name: 'AI Assistant', href: '/ai-assistant', icon: Cog6ToothIcon, authRequired: true },
    ];

    return (
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
                <div className="flex justify-between items-center h-14 sm:h-16">
                    {/* Logo */}
                    <div 
                        className="cursor-pointer group"
                        onClick={() => navigate('/')}
                    >
                        <QuickPeLogo size="lg" className="group-hover:scale-105 transition-transform duration-200" />
                    </div>
                    
                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-1">
                        {navigationItems.map((item) => {
                            if (item.authRequired && !isAuthenticated) return null;
                            const isActive = location.pathname === item.href;
                            const Icon = item.icon;
                            
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => navigate(item.href)}
                                    className={`flex items-center space-x-1.5 px-2 xl:px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all duration-200 ${
                                        isActive
                                            ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                                            : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
                                    <span className="hidden xl:inline">{item.name}</span>
                                    <span className="xl:hidden">{item.name.split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Auth Section */}
                    <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
                        {isAuthenticated ? (
                            <div className="flex items-center space-x-2 lg:space-x-4">
                                {/* Welcome Message & Last Login */}
                                <div className="hidden xl:block text-right">
                                    <div className="text-sm font-medium text-slate-700">
                                        Welcome, {userName}!
                                    </div>
                                    {lastLogin && (
                                        <div className="text-xs text-slate-500">
                                            Last login: {formatLastLogin(lastLogin)}
                                        </div>
                                    )}
                                </div>

                                {/* Notifications */}
                                <NotificationSystem userId={user?._id} />

                                {/* User Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                        className="flex items-center space-x-1.5 lg:space-x-2 px-2 lg:px-3 py-2 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                        <UserCircleIcon className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-600" />
                                        <span className="text-xs lg:text-sm font-medium text-emerald-700 hidden md:inline">{userName}</span>
                                        <ChevronDownIcon className="h-3 w-3 lg:h-4 lg:w-4 text-emerald-500" />
                                    </button>

                                    {userDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
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
                            </div>
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
                    <div className="lg:hidden">
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
                    <div className="lg:hidden border-t border-gray-200 bg-white">
                        <div className="px-3 pt-3 pb-4 space-y-2">
                            {navigationItems.map((item) => {
                                if (item.authRequired && !isAuthenticated) return null;
                                const isActive = location.pathname === item.href;
                                const Icon = item.icon;
                                
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
                                                : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{item.name}</span>
                                    </button>
                                );
                            })}
                            
                            {/* Mobile Auth Section */}
                            <div className="border-t border-gray-200 pt-3 mt-3">
                                {isAuthenticated ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                                            <UserCircleIcon className="h-5 w-5 text-gray-600" />
                                            <span className="text-sm font-medium text-gray-700">
                                                Welcome, {userName}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="flex items-center space-x-3 w-full px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                            <span className="text-sm font-medium">Logout</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => {
                                                navigate('/signin');
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-medium transition-colors"
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
                    </div>
                )}
            </div>
        </header>
    );
};
export default Header;
