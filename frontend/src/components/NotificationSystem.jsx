import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BellIcon, 
  XMarkIcon,
  CheckIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../sockets/useSocket';
import apiClient from '../services/api/client';

export const NotificationSystem = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Real-time notification handler
  const handleNewNotification = (notification) => {
    console.log('Frontend received notification:', notification);
    
    const newNotification = {
      _id: notification.transactionId || Date.now(),
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp || new Date(),
      transactionId: notification.transactionId,
      read: false,
      type: notification.type,
      data: notification.data || {}
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/src/assets/quickpe-favicon.svg',
        tag: notification.transactionId || 'quickpe-notification'
      });
    }
    
    // Force re-fetch to ensure consistency
    setTimeout(() => {
      fetchNotifications();
    }, 1000);
  };

  // Initialize WebSocket connection
  const { isConnected } = useSocket(userId, handleNewNotification);

  // Fetch notifications and unread count
  const fetchNotifications = async () => {
    try {
      console.log('🔄 Fetching notifications...');
      setLoading(true);
      
      const [notificationsRes, unreadCountRes] = await Promise.all([
        apiClient.get('/notifications'),
        apiClient.get('/notifications/unread-count')
      ]);
      
      console.log('📊 Notifications API response:', notificationsRes.data);
      console.log('📊 Unread count API response:', unreadCountRes.data);
      
      if (notificationsRes.data && notificationsRes.data.notifications) {
        console.log('📊 Raw notifications data:', notificationsRes.data.notifications);
        setNotifications(notificationsRes.data.notifications);
        console.log('✅ Set notifications:', notificationsRes.data.notifications.length, 'items');
        
        // Calculate unread count from actual data to ensure accuracy
        const unreadFromData = notificationsRes.data.notifications.filter(n => !n.read).length;
        console.log('🔍 Calculated unread from notifications:', unreadFromData);
        
        // Use the calculated count for more accuracy
        setUnreadCount(unreadFromData);
      } else {
        console.log('⚠️ No notifications in response:', notificationsRes.data);
        setNotifications([]);
        setUnreadCount(0);
      }
      
      // Also set from API response as backup
      if (unreadCountRes.data && unreadCountRes.data.success) {
        console.log('📊 API unread count:', unreadCountRes.data.count);
        // Only use API count if we don't have notifications data
        if (!notificationsRes.data?.notifications) {
          setUnreadCount(unreadCountRes.data.count);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      console.error('❌ Error details:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error config:', error.config);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Stop blinking animation by removing animate-pulse class
      const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
      if (notificationElement) {
        notificationElement.classList.remove('animate-pulse');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      console.log('🔄 Marking all notifications as read...');
      
      // Get all unread notification IDs
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Mark each unread notification as read via API
      const markReadPromises = unreadNotifications.map(notification => 
        apiClient.patch(`/notifications/${notification._id}/read`)
      );
      
      await Promise.all(markReadPromises);
      
      // Update local state - mark all as read
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count to 0 - this will stop bell blinking
      setUnreadCount(0);
      
      // Remove animate-pulse class from all notification elements
      const notificationElements = document.querySelectorAll('[data-notification-id]');
      notificationElements.forEach(element => {
        element.classList.remove('animate-pulse');
      });
      
      console.log('✅ All notifications marked as read - bell blinking stopped');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  // Debug React state updates
  useEffect(() => {
    console.log('🔍 NotificationSystem - notifications state updated:', notifications);
    console.log('🔍 NotificationSystem - unreadCount state updated:', unreadCount);
  }, [notifications, unreadCount]);

  // Fetch notifications on mount and when userId changes
  useEffect(() => {
    console.log('🔍 NotificationSystem useEffect - userId:', userId);
    console.log('🔍 userId type:', typeof userId);
    console.log('🔍 userId value:', userId);
    console.log('🔍 Current localStorage token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('🔍 Token value:', localStorage.getItem('token')?.substring(0, 50) + '...');
    
    // Force fetch even if userId is missing for debugging
    console.log('🔄 FORCING fetchNotifications call for debugging...');
    fetchNotifications();
    
    if (userId && localStorage.getItem('token')) {
      console.log('✅ Both userId and token present - setting up periodic refresh');
      
      // Set up periodic refresh every 5 minutes (disabled to prevent memory issues)
      // const interval = setInterval(() => {
      //   console.log('🔄 Periodic refresh triggered');
      //   fetchNotifications();
      // }, 300000);

      // return () => clearInterval(interval);
    } else {
      console.log('⚠️ Missing userId or token - userId:', userId, 'token:', !!localStorage.getItem('token'));
      console.log('⚠️ Will still attempt fetch for debugging purposes');
    }
  }, [userId]);

  // Listen for real-time notification events
  useEffect(() => {
    const handleNotificationNew = (event) => {
      console.log('🔔 Received notification:new event:', event.detail);
      handleNewNotification(event.detail);
    };

    // Add event listener for new standardized notification events
    window.addEventListener('notification:new', handleNotificationNew);

    return () => {
      window.removeEventListener('notification:new', handleNotificationNew);
    }
  }, [userId]);

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return time.toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'money_received':
        return <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 text-sm font-bold">₹</span>
        </div>;
      case 'money_sent':
        return <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 text-sm font-bold">→</span>
        </div>;
      case 'system':
        return <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
          <BellIcon className="w-4 h-4 text-emerald-600" />
        </div>;
      default:
        return <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <BellIcon className="w-4 h-4 text-gray-600" />
        </div>;
    }
  };

  console.log('🔍 NotificationSystem RENDER - unreadCount:', unreadCount, 'notifications.length:', notifications.length);

  return (
    <div className="relative" style={{ zIndex: 99999 }}>
      {/* Notification Bell */}
      <button
        onClick={() => {
          console.log('🔔 Bell clicked - showDropdown:', showDropdown, 'unreadCount:', unreadCount);
          setShowDropdown(!showDropdown);
        }}
        className="relative p-2 text-emerald-600 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-full transition-colors duration-200"
      >
        <BellIcon className={`h-5 w-5 ${unreadCount > 0 ? 'animate-pulse text-emerald-700' : 'text-emerald-600'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full z-20">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown - Using Portal */}
      {showDropdown && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[99999]">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-10" 
              onClick={() => setShowDropdown(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="fixed top-16 right-4 w-80 sm:w-96 md:w-[420px] bg-white rounded-lg shadow-2xl border-2 border-emerald-300 max-h-[80vh] overflow-hidden z-[99999]"
            >
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-3 sm:p-4 rounded-t-lg">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-base sm:text-lg font-semibold">Notifications</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <CheckIcon className="h-3 w-3" />
                      <span className="hidden sm:inline">Mark All Read</span>
                      <span className="sm:hidden">Read All</span>
                    </button>
                  )}
                  <span className="text-emerald-100 text-xs sm:text-sm hidden md:inline">
                    {isConnected ? '🟢 Active' : '🔴 Connecting...'}
                  </span>
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="text-emerald-100 hover:text-white transition-colors duration-200 p-1"
                  >
                    <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-6 sm:p-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-emerald-500 mx-auto"></div>
                  <p className="text-slate-600 mt-2 text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  <BellIcon className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    data-notification-id={notification._id}
                    className={`p-3 sm:p-4 border-b border-emerald-100 hover:bg-emerald-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-emerald-50 border-l-4 border-l-emerald-500 animate-pulse' : ''
                    }`}
                    onClick={() => markAsRead(notification._id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-emerald-900 leading-tight">
                          {notification.title}
                        </p>
                        <p className="text-xs sm:text-sm text-emerald-700 mt-1 leading-relaxed break-words">
                          {notification.message}
                        </p>
                        <p className="text-xs text-emerald-500 mt-2">
                          {formatTimestamp(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-emerald-200 text-center">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    // Navigate to notifications page if it exists
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default NotificationSystem;
