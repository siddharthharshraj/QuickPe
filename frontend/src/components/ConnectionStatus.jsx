import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    WifiIcon, 
    ExclamationTriangleIcon, 
    ArrowPathIcon,
    XCircleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const ConnectionStatus = ({ connectionStatus, reconnectAttempts, lastHeartbeat, isConnected }) => {
    const [showStatus, setShowStatus] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    useEffect(() => {
        // Show status indicator when connection is not stable
        setShowStatus(connectionStatus !== 'connected' || !isConnected);
        
        if (connectionStatus === 'connected' && isConnected) {
            setLastSyncTime(Date.now());
            
            // Hide status after 3 seconds if connection is stable
            const timer = setTimeout(() => {
                setShowStatus(false);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [connectionStatus, isConnected]);

    // Listen for socket events to show temporary status updates
    useEffect(() => {
        const handleSocketConnected = () => {
            setShowStatus(true);
            setTimeout(() => setShowStatus(false), 3000);
        };

        const handleSocketDisconnected = () => {
            setShowStatus(true);
        };

        const handleSocketReconnected = () => {
            setShowStatus(true);
            setTimeout(() => setShowStatus(false), 3000);
        };

        const handleSocketReconnectFailed = () => {
            setShowStatus(true);
        };

        window.addEventListener('socketConnected', handleSocketConnected);
        window.addEventListener('socketDisconnected', handleSocketDisconnected);
        window.addEventListener('socketReconnected', handleSocketReconnected);
        window.addEventListener('socketReconnectFailed', handleSocketReconnectFailed);

        return () => {
            window.removeEventListener('socketConnected', handleSocketConnected);
            window.removeEventListener('socketDisconnected', handleSocketDisconnected);
            window.removeEventListener('socketReconnected', handleSocketReconnected);
            window.removeEventListener('socketReconnectFailed', handleSocketReconnectFailed);
        };
    }, []);

    const getStatusConfig = () => {
        switch (connectionStatus) {
            case 'connected':
                return {
                    icon: CheckCircleIcon,
                    color: 'text-emerald-600',
                    bgColor: 'bg-emerald-50',
                    borderColor: 'border-emerald-200',
                    text: 'Real-time sync active',
                    pulse: false
                };
            case 'connecting':
                return {
                    icon: ArrowPathIcon,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    text: 'Connecting...',
                    pulse: true
                };
            case 'reconnecting':
                return {
                    icon: ArrowPathIcon,
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    text: `Reconnecting... (${reconnectAttempts}/10)`,
                    pulse: true
                };
            case 'disconnected':
                return {
                    icon: WifiIcon,
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    text: 'Disconnected - Using cached data',
                    pulse: false
                };
            case 'error':
                return {
                    icon: ExclamationTriangleIcon,
                    color: 'text-orange-600',
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                    text: 'Connection error - Retrying...',
                    pulse: true
                };
            case 'failed':
                return {
                    icon: XCircleIcon,
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    text: 'Connection failed - Manual refresh needed',
                    pulse: false
                };
            default:
                return {
                    icon: WifiIcon,
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    text: 'Unknown status',
                    pulse: false
                };
        }
    };

    const config = getStatusConfig();
    const IconComponent = config.icon;

    const formatLastSync = () => {
        if (!lastSyncTime) return null;
        
        const now = Date.now();
        const diff = Math.floor((now - lastSyncTime) / 1000);
        
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };

    return (
        <AnimatePresence>
            {showStatus && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="fixed top-4 right-4 z-50"
                >
                    <div className={`
                        ${config.bgColor} ${config.borderColor} ${config.color}
                        border rounded-lg shadow-lg backdrop-blur-sm p-3 min-w-[280px]
                        flex items-center space-x-3
                    `}>
                        <div className="relative">
                            <IconComponent 
                                className={`h-5 w-5 ${config.color} ${config.pulse ? 'animate-spin' : ''}`} 
                            />
                            {config.pulse && (
                                <motion.div
                                    className={`absolute inset-0 rounded-full ${config.color.replace('text-', 'bg-')} opacity-20`}
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            )}
                        </div>
                        
                        <div className="flex-1">
                            <div className="text-sm font-medium">
                                {config.text}
                            </div>
                            {lastSyncTime && connectionStatus === 'connected' && (
                                <div className="text-xs opacity-75">
                                    Last sync: {formatLastSync()}
                                </div>
                            )}
                            {lastHeartbeat && connectionStatus === 'connected' && (
                                <div className="text-xs opacity-75">
                                    Heartbeat: {Math.floor((Date.now() - lastHeartbeat) / 1000)}s ago
                                </div>
                            )}
                        </div>

                        {connectionStatus === 'failed' && (
                            <button
                                onClick={() => window.location.reload()}
                                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition-colors"
                            >
                                Refresh
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export { ConnectionStatus };
export default ConnectionStatus;
