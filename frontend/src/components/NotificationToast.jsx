import { useState, useEffect } from 'react';

export const NotificationToast = ({ notifications = [] }) => {
    const [visibleNotifications, setVisibleNotifications] = useState([]);

    useEffect(() => {
        if (notifications && notifications.length > 0) {
            const latestNotification = notifications[notifications.length - 1];
            if (latestNotification && latestNotification.id) {
                setVisibleNotifications(prev => [...prev, { ...latestNotification, isVisible: true }]);
                
                // Auto-hide after 5 seconds
                setTimeout(() => {
                    setVisibleNotifications(prev => 
                        prev.map(n => n.id === latestNotification.id ? { ...n, isVisible: false } : n)
                    );
                    
                    // Remove after animation
                    setTimeout(() => {
                        setVisibleNotifications(prev => prev.filter(n => n.id !== latestNotification.id));
                    }, 300);
                }, 5000);
            }
        }
    }, [notifications]);

    const getIcon = (type) => {
        switch (type) {
            case 'sent': return '💸';
            case 'received': return '💰';
            default: return '📱';
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case 'sent': return 'bg-orange-50 border-orange-200';
            case 'received': return 'bg-green-50 border-green-200';
            default: return 'bg-blue-50 border-blue-200';
        }
    };

    const getTextColor = (type) => {
        switch (type) {
            case 'sent': return 'text-orange-800';
            case 'received': return 'text-green-800';
            default: return 'text-blue-800';
        }
    };

    const handleClose = (notificationId) => {
        setVisibleNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, isVisible: false } : n)
        );
        
        setTimeout(() => {
            setVisibleNotifications(prev => prev.filter(n => n.id !== notificationId));
        }, 300);
    };

    if (visibleNotifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {visibleNotifications.map((notification, index) => (
                <div 
                    key={notification.id}
                    className={`transform transition-all duration-300 ${
                        notification.isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                    }`}
                    style={{ top: `${index * 80}px` }}
                >
                    <div className={`max-w-sm w-full ${getBgColor(notification.type)} border rounded-lg shadow-lg p-4`}>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">{getIcon(notification.type)}</span>
                            </div>
                            <div className="ml-3 w-0 flex-1">
                                <p className={`text-sm font-medium ${getTextColor(notification.type)}`}>
                                    {notification.type === 'sent' 
                                        ? `Sent ₹${notification.amount} to ${notification.to}`
                                        : `Received ₹${notification.amount} from ${notification.from}`
                                    }
                                </p>
                                <p className={`mt-1 text-sm ${getTextColor(notification.type)} opacity-75`}>
                                    New balance: ₹{notification.newBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                            <div className="ml-4 flex-shrink-0 flex">
                                <button
                                    className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    onClick={() => handleClose(notification.id)}
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
export default NotificationToast;
