import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../sockets/useSocket';
import apiClient from '../services/api/client';

export const useTransactionSync = (userId, onTransactionUpdate, onSyncStatusChange) => {
    const { socket, isConnected, connectionStatus } = useSocket(userId);
    const callbackRef = useRef(onTransactionUpdate);
    const syncStatusRef = useRef(onSyncStatusChange);
    
    const [syncState, setSyncState] = useState({
        lastSync: null,
        syncInProgress: false,
        missedTransactions: 0,
        autoSyncEnabled: true,
        backgroundSyncInterval: 30000, // 30 seconds
        retryAttempts: 0,
        maxRetries: 3
    });

    const backgroundSyncRef = useRef(null);
    const heartbeatRef = useRef(null);
    const retryTimeoutRef = useRef(null);

    // Update callback refs when they change
    useEffect(() => {
        callbackRef.current = onTransactionUpdate;
        syncStatusRef.current = onSyncStatusChange;
    }, [onTransactionUpdate, onSyncStatusChange]);

    // Background sync function
    const performBackgroundSync = useCallback(async () => {
        if (!userId || syncState.syncInProgress) return;

        try {
            setSyncState(prev => ({ ...prev, syncInProgress: true }));
            
            console.log('🔄 Performing background transaction sync...');
            
            // Fetch latest transactions from backend
            const response = await apiClient.get('/account/transactions', {
                params: { 
                    limit: 50,
                    timestamp: syncState.lastSync 
                }
            });

            if (response.data?.transactions) {
                const newTransactions = response.data.transactions;
                
                if (newTransactions.length > 0) {
                    console.log(`✅ Background sync found ${newTransactions.length} new transactions`);
                    
                    // Emit custom events for each new transaction
                    newTransactions.forEach(transaction => {
                        window.dispatchEvent(new CustomEvent('newTransaction', { 
                            detail: { ...transaction, source: 'background_sync' } 
                        }));
                    });
                    
                    setSyncState(prev => ({ 
                        ...prev, 
                        missedTransactions: prev.missedTransactions + newTransactions.length,
                        retryAttempts: 0 
                    }));
                } else {
                    console.log('📊 Background sync: No new transactions');
                }
            }

            setSyncState(prev => ({ 
                ...prev, 
                lastSync: Date.now(),
                syncInProgress: false 
            }));

            // Notify sync status change
            if (syncStatusRef.current) {
                syncStatusRef.current({
                    type: 'background_sync_success',
                    timestamp: Date.now(),
                    newTransactions: response.data?.transactions?.length || 0
                });
            }

        } catch (error) {
            console.error('❌ Background sync failed:', error);
            
            setSyncState(prev => ({ 
                ...prev, 
                syncInProgress: false,
                retryAttempts: prev.retryAttempts + 1
            }));

            // Retry with exponential backoff
            if (syncState.retryAttempts < syncState.maxRetries) {
                const retryDelay = Math.pow(2, syncState.retryAttempts) * 5000; // 5s, 10s, 20s
                console.log(`🔄 Retrying background sync in ${retryDelay}ms...`);
                
                retryTimeoutRef.current = setTimeout(() => {
                    performBackgroundSync();
                }, retryDelay);
            }

            // Notify sync status change
            if (syncStatusRef.current) {
                syncStatusRef.current({
                    type: 'background_sync_error',
                    error: error.message,
                    timestamp: Date.now(),
                    retryAttempts: syncState.retryAttempts
                });
            }
        }
    }, [userId, syncState.syncInProgress, syncState.lastSync, syncState.retryAttempts, syncState.maxRetries]);

    // Manual refresh function
    const manualRefresh = useCallback(async () => {
        console.log('🔄 Manual refresh triggered');
        
        try {
            setSyncState(prev => ({ ...prev, syncInProgress: true }));
            
            // Force full refresh from backend
            const response = await apiClient.get('/account/transactions');
            
            if (response.data?.transactions) {
                // Emit cache invalidation to force UI refresh
                window.dispatchEvent(new CustomEvent('cacheInvalidate', { 
                    detail: { 
                        patterns: ['transactions'], 
                        source: 'manual_refresh',
                        timestamp: Date.now()
                    } 
                }));
                
                console.log('✅ Manual refresh completed');
                
                setSyncState(prev => ({ 
                    ...prev, 
                    lastSync: Date.now(),
                    syncInProgress: false,
                    retryAttempts: 0,
                    missedTransactions: 0
                }));

                // Notify sync status change
                if (syncStatusRef.current) {
                    syncStatusRef.current({
                        type: 'manual_refresh_success',
                        timestamp: Date.now(),
                        totalTransactions: response.data.transactions.length
                    });
                }

                return { success: true, data: response.data };
            }
        } catch (error) {
            console.error('❌ Manual refresh failed:', error);
            
            setSyncState(prev => ({ ...prev, syncInProgress: false }));
            
            // Notify sync status change
            if (syncStatusRef.current) {
                syncStatusRef.current({
                    type: 'manual_refresh_error',
                    error: error.message,
                    timestamp: Date.now()
                });
            }

            return { success: false, error: error.message };
        }
    }, []);

    // Socket event handlers
    useEffect(() => {
        if (!socket) return;

        const handleNewTransaction = (transactionData) => {
            console.log('🔄 Real-time transaction received:', transactionData);
            
            setSyncState(prev => ({ 
                ...prev, 
                lastSync: Date.now(),
                retryAttempts: 0 
            }));

            // Call the callback to update UI
            if (callbackRef.current) {
                callbackRef.current(transactionData);
            }

            // Notify sync status change
            if (syncStatusRef.current) {
                syncStatusRef.current({
                    type: 'realtime_transaction',
                    transaction: transactionData,
                    timestamp: Date.now()
                });
            }
        };

        const handleTransactionUpdate = (transactionData) => {
            console.log('🔄 Transaction update received:', transactionData);
            
            if (callbackRef.current) {
                callbackRef.current(transactionData);
            }
        };

        const handleCacheInvalidate = (data) => {
            console.log('🔄 Cache invalidation received:', data);
            
            if (data.patterns?.includes('transactions')) {
                performBackgroundSync();
            }
        };

        // Listen for transaction events
        socket.on('newTransaction', handleNewTransaction);
        socket.on('transactionUpdate', handleTransactionUpdate);
        socket.on('cacheInvalidate', handleCacheInvalidate);

        return () => {
            socket.off('newTransaction', handleNewTransaction);
            socket.off('transactionUpdate', handleTransactionUpdate);
            socket.off('cacheInvalidate', handleCacheInvalidate);
        };
    }, [socket, performBackgroundSync]);

    // Auto background sync setup
    useEffect(() => {
        if (!userId || !syncState.autoSyncEnabled) return;

        // Start background sync interval
        backgroundSyncRef.current = setInterval(() => {
            if (!isConnected || connectionStatus !== 'connected') {
                console.log('🔄 Socket disconnected, performing background sync...');
                performBackgroundSync();
            }
        }, syncState.backgroundSyncInterval);

        // Initial sync after 5 seconds
        const initialSyncTimeout = setTimeout(() => {
            performBackgroundSync();
        }, 5000);

        return () => {
            if (backgroundSyncRef.current) {
                clearInterval(backgroundSyncRef.current);
            }
            clearTimeout(initialSyncTimeout);
        };
    }, [userId, syncState.autoSyncEnabled, syncState.backgroundSyncInterval, isConnected, connectionStatus, performBackgroundSync]);

    // Connection status monitoring
    useEffect(() => {
        const handleSocketDisconnected = () => {
            console.log('🔄 Socket disconnected, enabling aggressive background sync...');
            setSyncState(prev => ({ 
                ...prev, 
                backgroundSyncInterval: 10000 // Increase frequency to 10 seconds
            }));
        };

        const handleSocketReconnected = () => {
            console.log('✅ Socket reconnected, restoring normal sync interval...');
            setSyncState(prev => ({ 
                ...prev, 
                backgroundSyncInterval: 30000, // Back to 30 seconds
                retryAttempts: 0
            }));
            
            // Perform immediate sync after reconnection
            setTimeout(() => {
                performBackgroundSync();
            }, 1000);
        };

        window.addEventListener('socketDisconnected', handleSocketDisconnected);
        window.addEventListener('socketReconnected', handleSocketReconnected);

        return () => {
            window.removeEventListener('socketDisconnected', handleSocketDisconnected);
            window.removeEventListener('socketReconnected', handleSocketReconnected);
        };
    }, [performBackgroundSync]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (backgroundSyncRef.current) {
                clearInterval(backgroundSyncRef.current);
            }
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

    return {
        socket,
        isConnected,
        connectionStatus,
        syncState,
        manualRefresh,
        performBackgroundSync
    };
};
