import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (userId, onNotification) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [lastHeartbeat, setLastHeartbeat] = useState(null);
    const heartbeatIntervalRef = useRef(null);
    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (!userId) return;
        
        // Prevent multiple socket instances
        if (isInitializedRef.current || socketRef.current?.connected) {
            return;
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        isInitializedRef.current = true;

        // Initialize socket with auth and reconnection settings
        const newSocket = io('http://localhost:5001', {
            auth: {
                token: token
            },
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 10000,
            transports: ['websocket'],
            autoConnect: true
        });

        socketRef.current = newSocket;
        const socket = socketRef.current;

        // Start heartbeat monitoring
        const startHeartbeat = () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            
            heartbeatIntervalRef.current = setInterval(() => {
                if (socket.connected) {
                    socket.emit('heartbeat', { timestamp: Date.now() }, (response) => {
                        if (response?.received) {
                            setLastHeartbeat(Date.now());
                        }
                    });
                }
            }, 30000); // Send heartbeat every 30 seconds
        };

        socket.on('connect', () => {
            setIsConnected(true);
            setConnectionStatus('connected');
            setReconnectAttempts(0);
            setLastHeartbeat(Date.now());
            
            // Start heartbeat monitoring
            startHeartbeat();
            
            // Join user-specific room with acknowledgement
            socket.emit('join', userId);
        });

        socket.on('disconnect', (reason) => {
            setIsConnected(false);
            setConnectionStatus('disconnected');
            
            // Clear heartbeat interval
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
        });

        socket.on('reconnect', (attemptNumber) => {
            setConnectionStatus('connected');
            setReconnectAttempts(0);
            socket.emit('join', userId);
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
            setConnectionStatus('reconnecting');
            setReconnectAttempts(attemptNumber);
        });

        socket.on('reconnect_error', (error) => {
            console.error('❌ Reconnection failed:', error);
            setConnectionStatus('error');
        });

        socket.on('reconnect_failed', () => {
            setConnectionStatus('failed');
        });

        socket.on('notification', (notification) => {
            
            // Trigger notification callback
            if (onNotification) {
                onNotification({
                    type: notification.type === 'transaction' ? 'success' : 'info',
                    title: notification.title,
                    message: notification.message,
                    timestamp: notification.timestamp,
                    transactionId: notification.transactionId
                });
            }
        });

        // Listen for transaction events from backend
        socket.on('transaction:new', (transaction) => {
            window.dispatchEvent(new CustomEvent('transaction:new', { detail: transaction }));
        });

        socket.on('transaction:update', (transaction) => {
            window.dispatchEvent(new CustomEvent('transaction:update', { detail: transaction }));
        });

        // Listen for balance updates
        socket.on('balance:update', (balanceData) => {
            window.dispatchEvent(new CustomEvent('balance:update', { detail: balanceData }));
        });

        // Listen for analytics updates
        socket.on('analytics:update', (analyticsData) => {
            window.dispatchEvent(new CustomEvent('analytics:update', { detail: analyticsData }));
        });

        // Listen for notification events
        socket.on('notification:new', (notification) => {
            window.dispatchEvent(new CustomEvent('notification:new', { detail: notification }));
            
            // Also trigger the callback for immediate UI updates
            if (onNotification) {
                onNotification({
                    type: notification.type === 'transaction' ? 'success' : 'info',
                    title: notification.title,
                    message: notification.message,
                    timestamp: notification.timestamp,
                    transactionId: notification.transactionId
                });
            }
        });

        // Legacy event listeners (keeping for backward compatibility)
        socket.on('newTransaction', (transaction) => {
            window.dispatchEvent(new CustomEvent('newTransaction', { detail: transaction }));
        });

        socket.on('cacheInvalidate', (data) => {
            window.dispatchEvent(new CustomEvent('cacheInvalidate', { detail: data }));
        });

        // Listen for cache invalidation events (standardized)
        socket.on('cache:invalidate', (data) => {
            window.dispatchEvent(new CustomEvent('cache:invalidate', { detail: data }));
        });

        socket.on('auditLogUpdate', (auditData) => {
            window.dispatchEvent(new CustomEvent('auditLogUpdate', { detail: auditData }));
        });

        socket.on('connect_error', () => {
            setIsConnected(false);
        });

        socket.on('joined', (data) => {
            // Room joined successfully
        });

        // Cleanup on unmount
        return () => {
            isInitializedRef.current = false;
            
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
            }
            
            if (socketRef.current) {
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [userId]);

    return { 
        socket: socketRef.current, 
        isConnected,
        connectionStatus,
        reconnectAttempts,
        lastHeartbeat
    };
};

export default useSocket;
