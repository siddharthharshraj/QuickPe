import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (userId, onNotification) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [lastHeartbeat, setLastHeartbeat] = useState(null);
    const heartbeatIntervalRef = useRef(null);

    useEffect(() => {
        if (!userId) return;

        console.log('🔌 Initializing socket connection for userId:', userId);
        console.log('🔍 Socket - userId type:', typeof userId, 'value:', userId);
        
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No token found for socket connection');
            return;
        }

        console.log('🔍 Socket - token present:', !!token);

        // Initialize socket with auth
        const newSocket = io('http://localhost:5001', {
            auth: {
                token: token
            }
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
                            console.log('💓 Heartbeat acknowledged by server');
                        }
                    });
                }
            }, 30000); // Send heartbeat every 30 seconds
        };

        socket.on('connect', () => {
            console.log('✅ Connected to WebSocket server with socket ID:', socket.id);
            setIsConnected(true);
            setConnectionStatus('connected');
            setReconnectAttempts(0);
            setLastHeartbeat(Date.now());
            
            // Start heartbeat monitoring
            startHeartbeat();
            
            // Join user-specific room with acknowledgement
            console.log('🏠 Joining user room:', userId);
            socket.emit('join', userId, (response) => {
                if (response?.success) {
                    console.log('✅ Successfully joined room with acknowledgement:', response.data);
                } else {
                    console.error('❌ Failed to join room:', response?.error);
                }
            });
            
            // Emit connection success event for UI components
            window.dispatchEvent(new CustomEvent('socketConnected', { 
                detail: { userId, socketId: socket.id, timestamp: Date.now() } 
            }));
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from WebSocket server. Reason:', reason);
            setIsConnected(false);
            setConnectionStatus('disconnected');
            
            // Clear heartbeat interval
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            
            // Emit disconnection event for UI components
            window.dispatchEvent(new CustomEvent('socketDisconnected', { 
                detail: { reason, timestamp: Date.now() } 
            }));
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Reconnected to WebSocket server after', attemptNumber, 'attempts');
            setConnectionStatus('connected');
            setReconnectAttempts(0);
            
            // Rejoin user room after reconnection with acknowledgement
            socket.emit('join', userId, (response) => {
                if (response?.success) {
                    console.log('✅ Successfully rejoined room after reconnection:', response.data);
                } else {
                    console.error('❌ Failed to rejoin room after reconnection:', response?.error);
                }
            });
            
            // Emit reconnection event for UI components
            window.dispatchEvent(new CustomEvent('socketReconnected', { 
                detail: { attemptNumber, timestamp: Date.now() } 
            }));
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('🔄 Attempting to reconnect... Attempt:', attemptNumber);
            setConnectionStatus('reconnecting');
            setReconnectAttempts(attemptNumber);
        });

        socket.on('reconnect_error', (error) => {
            console.error('❌ Reconnection failed:', error);
            setConnectionStatus('error');
        });

        socket.on('reconnect_failed', () => {
            console.error('❌ Failed to reconnect after maximum attempts');
            setConnectionStatus('failed');
            
            // Emit reconnection failure event for UI components
            window.dispatchEvent(new CustomEvent('socketReconnectFailed', { 
                detail: { timestamp: Date.now() } 
            }));
        });

        socket.on('notification', (notification) => {
            console.log('Received notification:', notification);
            
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
            console.log('🆕 Received new transaction event:', transaction);
            window.dispatchEvent(new CustomEvent('transaction:new', { detail: transaction }));
        });

        socket.on('transaction:update', (transaction) => {
            console.log('🔄 Received transaction update event:', transaction);
            window.dispatchEvent(new CustomEvent('transaction:update', { detail: transaction }));
        });

        // Listen for balance updates
        socket.on('balance:update', (balanceData) => {
            console.log('💰 Received balance update event:', balanceData);
            window.dispatchEvent(new CustomEvent('balance:update', { detail: balanceData }));
        });

        // Listen for analytics updates
        socket.on('analytics:update', (analyticsData) => {
            console.log('📊 Received analytics update event:', analyticsData);
            window.dispatchEvent(new CustomEvent('analytics:update', { detail: analyticsData }));
        });

        // Listen for notification events
        socket.on('notification:new', (notification) => {
            console.log('🔔 Received new notification event:', notification);
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
            console.log('📝 Legacy: Received new transaction:', transaction);
            window.dispatchEvent(new CustomEvent('newTransaction', { detail: transaction }));
        });

        socket.on('cacheInvalidate', (data) => {
            console.log('🗑️ Cache invalidation received:', data);
            window.dispatchEvent(new CustomEvent('cacheInvalidate', { detail: data }));
        });

        // Listen for cache invalidation events (standardized)
        socket.on('cache:invalidate', (data) => {
            console.log('🔄 Cache invalidation received (standardized):', data);
            window.dispatchEvent(new CustomEvent('cache:invalidate', { detail: data }));
        });

        socket.on('auditLogUpdate', (auditData) => {
            console.log('📋 Audit log update received:', auditData);
            window.dispatchEvent(new CustomEvent('auditLogUpdate', { detail: auditData }));
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            setIsConnected(false);
        });

        socket.on('joined', (data) => {
            console.log('✅ Successfully joined room:', data);
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                // Emit logout event before disconnecting
                socketRef.current.emit('logout', (response) => {
                    console.log('🚪 Logout acknowledgement:', response);
                });
                
                // Disconnect socket
                socketRef.current.disconnect();
            }
            
            // Clear heartbeat interval
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
        };
    }, [userId, onNotification]);

    return { 
        socket: socketRef.current, 
        isConnected,
        connectionStatus,
        reconnectAttempts,
        lastHeartbeat
    };
};

export default useSocket;
