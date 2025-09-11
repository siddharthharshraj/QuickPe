import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (userId, onNotification) => {
    const socketRef = useRef(null);

    useEffect(() => {
        if (!userId) return;

        // Initialize socket connection
        const socket = io('http://localhost:3001');
        socketRef.current = socket;

        // Join user room
        socket.emit('join', userId);

        // Listen for transaction notifications
        socket.on('transaction', (data) => {
            onNotification({
                type: data.type === 'received' ? 'success' : 'info',
                message: data.type === 'received' 
                    ? `Received ₹${data.amount} from ${data.from}`
                    : `Sent ₹${data.amount} to ${data.to}`,
                timestamp: data.timestamp,
                amount: data.amount
            });
        });

        socket.on('connect', () => {
            console.log('Dashboard socket connected');
        });

        socket.on('disconnect', () => {
            console.log('Dashboard socket disconnected');
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [userId, onNotification]);

    return socketRef.current;
};
