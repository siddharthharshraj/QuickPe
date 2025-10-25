import { useEffect, useState, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CurrencyRupeeIcon, 
    PlusIcon, 
    BanknotesIcon,
    ArrowTrendingUpIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import apiClient from "../services/api/client";
import toast from 'react-hot-toast';
import { useAnalytics } from "../contexts/AnalyticsContext";

export const BalanceEnhanced = memo(({ onBalanceUpdate }) => {
    // Use centralized analytics for balance
    const { balance: contextBalance, loading: analyticsLoading, refresh: refreshAnalytics } = useAnalytics();
    
    const [addingMoney, setAddingMoney] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [error, setError] = useState("");

    // Notify parent when balance changes
    useEffect(() => {
        if (onBalanceUpdate && contextBalance) {
            onBalanceUpdate(contextBalance);
        }
    }, [contextBalance, onBalanceUpdate]);

    // Manual refresh function
    const handleManualRefresh = async () => {
        await refreshAnalytics();
    };

    // Add money with comprehensive error handling
    const addMoney = async (amount) => {
        setSelectedAmount(amount);
        setAddingMoney(true);
        setError("");
        
        const toastId = toast.loading(`Adding ₹${amount.toLocaleString()}...`);
        
        try {
            // Validate amount before sending
            if (!amount || amount <= 0) {
                throw new Error("Invalid amount");
            }
            
            if (amount > 100000) {
                throw new Error("Maximum deposit amount is ₹1,00,000");
            }
            
            // Make deposit request
            const response = await apiClient.post("/account/deposit", { amount });
            
            if (!response.data.success) {
                throw new Error(response.data.message || "Failed to add money");
            }
            
            // Refresh analytics to get new balance
            const newBalance = response.data.data.balance;
            await refreshAnalytics();
            
            // Notify parent component
            if (onBalanceUpdate) {
                onBalanceUpdate(newBalance);
            }
            
            // Emit custom event for real-time updates
            window.dispatchEvent(new CustomEvent('balance:update', {
                detail: { 
                    newBalance, 
                    userId: 'current',
                    amount,
                    previousBalance: response.data.data.previousBalance
                }
            }));
            
            // Success feedback
            toast.success(
                `₹${amount.toLocaleString()} added successfully!`,
                { id: toastId, duration: 3000 }
            );
            
            // Analytics will auto-refresh via WebSocket
            
        } catch (error) {
            // Handle different error types
            let errorMessage = "Failed to add money. Please try again.";
            
            if (error.response) {
                const { status, data } = error.response;
                
                switch (status) {
                    case 400:
                        errorMessage = data.message || "Invalid request";
                        break;
                    case 403:
                        errorMessage = "Account is deactivated";
                        break;
                    case 404:
                        errorMessage = "User not found";
                        break;
                    case 429:
                        errorMessage = data.message || "Too many requests. Please try again later.";
                        break;
                    case 500:
                        errorMessage = "Server error. Please try again.";
                        break;
                    default:
                        errorMessage = data.message || errorMessage;
                }
            } else if (error.request) {
                errorMessage = "Network error. Please check your connection.";
            } else {
                errorMessage = error.message || errorMessage;
            }
            
            setError(errorMessage);
            toast.error(errorMessage, { id: toastId, duration: 4000 });
            
        } finally {
            setAddingMoney(false);
            setSelectedAmount(null);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatTime = (date) => {
        if (!date) return '';
        return new Intl.DateTimeFormat('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Loading state
    if (analyticsLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20"
            >
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-sm text-slate-600">Loading balance...</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden"
        >
            {/* Balance Display */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <CurrencyRupeeIcon className="h-5 w-5 text-emerald-100" />
                            <span className="text-emerald-100 font-medium">Available Balance</span>
                        </div>
                        
                        {/* Refresh button */}
                        <button
                            onClick={handleManualRefresh}
                            disabled={analyticsLoading}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh balance"
                        >
                            <ArrowPathIcon className={`h-5 w-5 ${analyticsLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-4xl font-bold mb-1">
                                {formatCurrency(contextBalance)}
                            </div>
                            <div className="text-xs text-emerald-100">
                                Updated at {formatTime(new Date())}
                            </div>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <BanknotesIcon className="h-8 w-8 text-white" />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 border-b border-red-200 px-6 py-3"
                    >
                        <div className="flex items-center space-x-2 text-red-700">
                            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Add Money Section */}
            <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Add Test Funds</h3>
                </div>
                <p className="text-slate-600 text-sm mb-6">
                    Add demo money to test transactions and explore features
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[1000, 5000, 10000].map((amount) => {
                        const isProcessing = addingMoney && selectedAmount === amount;
                        
                        return (
                            <motion.button
                                key={amount}
                                whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                                whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                                onClick={() => addMoney(amount)}
                                disabled={addingMoney}
                                className={`group relative overflow-hidden border rounded-xl p-4 transition-all duration-200 ${
                                    isProcessing
                                        ? 'bg-emerald-100 border-emerald-300'
                                        : 'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <div className="flex items-center justify-center space-x-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                        isProcessing
                                            ? 'bg-emerald-700'
                                            : 'bg-emerald-600 group-hover:bg-emerald-700'
                                    }`}>
                                        {isProcessing ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        ) : (
                                            <PlusIcon className="h-4 w-4 text-white" />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-slate-900">
                                            {isProcessing ? "Processing..." : `₹${amount.toLocaleString()}`}
                                        </div>
                                        <div className="text-xs text-slate-600">
                                            {amount === 1000 ? "Quick top-up" : amount === 5000 ? "Standard amount" : "Large deposit"}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Hover effect overlay */}
                                {!isProcessing && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
                
                {/* Info Banner */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-xs text-slate-600">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>Demo funds for testing • Max ₹1,00,000 per transaction • 10 deposits/hour limit</span>
                    </div>
                </div>
                
                {/* Success indicator */}
                {!addingMoney && !error && (
                    <div className="mt-3 flex items-center justify-center space-x-2 text-emerald-600">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span className="text-xs font-medium">System operational</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
});

BalanceEnhanced.displayName = 'BalanceEnhanced';
export default BalanceEnhanced;
