import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../sockets/useSocket';

const useAnalyticsSync = (refreshCallback) => {
    const [lastUpdate, setLastUpdate] = useState(Date.now());
    const { socket } = useSocket();

    const handleTransactionUpdate = useCallback(() => {
        console.log('Analytics sync: Transaction update detected');
        setLastUpdate(Date.now());
        if (refreshCallback) {
            // Debounce refresh calls to avoid excessive API requests
            setTimeout(() => {
                refreshCallback();
            }, 1000);
        }
    }, [refreshCallback]);

    useEffect(() => {
        if (socket) {
            console.log('Analytics sync: Setting up socket listeners');
            
            // Listen for transaction events that should trigger analytics refresh
            socket.on('transaction:new', handleTransactionUpdate);
            socket.on('balance:update', handleTransactionUpdate);
            socket.on('analytics:update', handleTransactionUpdate);
            
            return () => {
                console.log('Analytics sync: Cleaning up socket listeners');
                socket.off('transaction:new', handleTransactionUpdate);
                socket.off('balance:update', handleTransactionUpdate);
                socket.off('analytics:update', handleTransactionUpdate);
            };
        }
    }, [socket, handleTransactionUpdate]);

    // Polling disabled - rely on WebSocket only
    useEffect(() => {
        // Disabled aggressive polling - WebSocket handles all updates
        /* const interval = setInterval(() => {
            const timeSinceLastUpdate = Date.now() - lastUpdate;
            // Only refresh if no recent socket updates (15+ seconds)
            if (timeSinceLastUpdate >= 15000 && refreshCallback) {
                console.log('Analytics sync: Polling refresh triggered');
                refreshCallback();
                setLastUpdate(Date.now());
            }
        }, 15000);

        return () => clearInterval(interval); */
    }, [lastUpdate, refreshCallback]);

    return { lastUpdate };
};

export default useAnalyticsSync;
