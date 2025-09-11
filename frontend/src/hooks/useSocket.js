import { useEffect, useRef } from 'react';
import axios from 'axios';

export const useSocket = (userId, onNotification) => {
    const intervalRef = useRef(null);
    const lastNotificationRef = useRef(null);

    useEffect(() => {
        if (!userId) return;

        // Serverless-compatible notification polling
        const pollNotifications = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await axios.get('/v1/notifications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.data.success && response.data.notifications) {
                    const notifications = response.data.notifications;
                    
                    // Check for new notifications since last poll
                    if (notifications.length > 0) {
                        const latestNotification = notifications[0];
                        
                        // Only trigger if this is a new notification
                        if (!lastNotificationRef.current || 
                            latestNotification._id !== lastNotificationRef.current._id) {
                            
                            lastNotificationRef.current = latestNotification;
                            
                            // Trigger notification callback
                            onNotification({
                                type: latestNotification.type === 'TRANSFER_RECEIVED' ? 'success' : 'info',
                                message: latestNotification.message,
                                timestamp: latestNotification.createdAt,
                                title: latestNotification.title
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error polling notifications:', error);
            }
        };

        // Initial poll
        pollNotifications();

        // Set up polling interval (every 5 seconds)
        intervalRef.current = setInterval(pollNotifications, 5000);

        console.log('Notification polling started for user:', userId);

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                console.log('Notification polling stopped');
            }
        };
    }, [userId, onNotification]);

    return null; // No socket object in polling mode
};
