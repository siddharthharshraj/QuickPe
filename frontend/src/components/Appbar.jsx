import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { io } from 'socket.io-client';
import axios from 'axios';

export const Appbar = () => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [userName, setUserName] = useState("User");
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Fetch initial notifications and set up real-time updates
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserName(decoded.firstName || "User");
                
                // Fetch initial notifications
                const fetchNotifications = async () => {
                    try {
                        const response = await axios.get('/v1/notifications', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        
                        setNotifications(response.data);
                        
                        // Count unread notifications
                        const unread = response.data.filter(n => !n.read).length;
                        setUnreadCount(unread);
                    } catch (error) {
                    }
                };
                
                fetchNotifications();
                
                // Set up socket connection for real-time updates
                const socket = io('/', {
                    auth: {
                        token: token
                    }
                });

                socket.on('connect', () => {
                    // Join user room for notifications
                    socket.emit('join', decoded.userId);
                });

                // Listen for new notifications
                socket.on('notification:new', (data) => {
                    setNotifications(prev => [data, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    
                    // Show browser notification
                    if (Notification.permission === 'granted') {
                        new Notification('💰 Money Received!', {
                            body: data.message,
                            icon: '/favicon.ico',
                            tag: 'quickpe-notification'
                        });
                    }
                });

                // Listen for read-all events
                socket.on('notifications:read-all', () => {
                    setNotifications(prev => 
                        prev.map(n => ({ ...n, read: true }))
                    );
                    setUnreadCount(0);
                });

                socket.on('disconnect', () => {});

                socket.on('error', (error) => {
                    console.error('💥 Socket error:', error);
                });

                return () => {
                    socket.disconnect();
                };
            } catch (error) {
                console.error("❌ Error decoding token:", error);
            }
        }
    }, []);

    // Request notification permission
    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
            });
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/signin");
    };

    const markNotificationsAsRead = async () => {
        try {
            const token = localStorage.getItem("token");
            
            await axios.put('/v1/notifications?action=read-all', {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('❌ Error marking notifications as read:', error);
        }
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diff = now - notificationTime;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setIsDropdownOpen(false);
            }
            if (!event.target.closest('.notification-container')) {
                setIsNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="shadow h-14 flex justify-between items-center px-4 bg-white border-b">
            <div 
                className="flex items-center cursor-pointer"
                onClick={() => navigate('/dashboard')}
            >
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">₹</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">QuickPe</span>
                </div>
            </div>
        
            <div className="flex items-center space-x-4">
                <div className="text-gray-700 hidden sm:block">
                    Welcome back, <span className="font-semibold">{userName}</span>
                </div>
                <div className="text-gray-700 sm:hidden">
                    <span className="font-semibold">{userName}</span>
                </div>
            
                {/* Notification Bell */}
                <div className="relative notification-container">
                <button 
                    onClick={() => {
                        setIsNotificationOpen(!isNotificationOpen);
                        if (!isNotificationOpen && unreadCount > 0) {
                            markNotificationsAsRead();
                        }
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg relative"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {/* Notification count badge */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div 
                                    key={notification._id} 
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                    }`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {notification.message}
                                            </p>
                                            <p className="text-sm font-semibold text-green-600">
                                                ₹{notification.amount?.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatTimeAgo(notification.createdAt)}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="flex-shrink-0">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                            <button 
                                onClick={markNotificationsAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                                disabled={unreadCount === 0}
                            >
                                {unreadCount > 0 ? 'Mark all as read' : 'All read'}
                            </button>
                            <span className="text-xs text-gray-500">
                                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
            )}
                </div>
        
                <div className="relative dropdown-container">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2"
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="true"
                    >
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {userName[0].toUpperCase()}
                        </div>
                        <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            <button
                                onClick={() => navigate('/settings')}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                                Settings
                            </button>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};