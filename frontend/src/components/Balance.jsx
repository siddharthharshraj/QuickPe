import { useEffect, useState, memo, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { 
    CurrencyRupeeIcon, 
    PlusIcon, 
    BanknotesIcon,
    ArrowTrendingUpIcon 
} from "@heroicons/react/24/outline";
import apiClient from "../services/api/client";
import { Button } from "./Button";
import { useDebounce, useOptimizedCallback } from "../utils/performance";

export const Balance = memo(({ onBalanceUpdate }) => {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [addingMoney, setAddingMoney] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBalance();
        }, 100); // Debounce initial fetch
        
        return () => clearTimeout(timer);
    }, []);

    const fetchBalance = useCallback(async () => {
        try {
            const response = await apiClient.get("/account/balance");
            console.log('Balance fetch response:', response.data);
            const fetchedBalance = Number(response.data.balance) || 0;
            setBalance(fetchedBalance);
            setError(""); // Clear any previous errors
            // Notify parent component about initial balance
            if (onBalanceUpdate) {
                onBalanceUpdate(fetchedBalance);
            }
        } catch (error) {
            console.error("Balance fetch error:", error);
            setError("Failed to fetch balance");
            setBalance(0); // Set fallback balance
        } finally {
            setLoading(false);
        }
    }, [onBalanceUpdate]);

    const addFakeMoney = async (amount) => {
        setAddingMoney(true);
        setError(""); // Clear any previous errors
        try {
            const response = await apiClient.post("/account/deposit", { amount });
            console.log('Add money response:', response.data);
            
            // Always refresh balance from server after deposit
            const refreshResponse = await apiClient.get("/account/balance");
            const refreshedBalance = Number(refreshResponse.data.balance) || 0;
            
            setBalance(refreshedBalance);
            
            // Notify parent component about balance update
            if (onBalanceUpdate) {
                onBalanceUpdate(refreshedBalance);
            }
            
            // Emit custom event for real-time updates
            window.dispatchEvent(new CustomEvent('balance:update', {
                detail: { newBalance: refreshedBalance, userId: 'current' }
            }));
            
            console.log('Balance updated successfully:', refreshedBalance);
        } catch (error) {
            console.error("Add money error:", error);
            if (error.response?.status === 429) {
                const errorMsg = error.response?.data?.error || "Add money limit exceeded. Please try again later.";
                setError(errorMsg);
            } else {
                setError("Failed to add money. Please try again.");
            }
        } finally {
            setAddingMoney(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 3
        }).format(amount);
    };

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20"
            >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-red-50/80 backdrop-blur-sm rounded-2xl shadow-lg border border-red-200"
            >
                <div className="text-red-600 font-medium">Error</div>
                <div className="text-red-500 text-sm">{error}</div>
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
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <CurrencyRupeeIcon className="h-5 w-5 text-emerald-100" />
                            <span className="text-emerald-100 font-medium">Available Balance</span>
                        </div>
                        <div className="text-3xl font-bold">
                            {formatCurrency(balance)}
                        </div>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <BanknotesIcon className="h-8 w-8 text-white" />
                    </div>
                </div>
            </div>
            
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
                    {[1000, 5000, 10000].map((amount, index) => (
                        <motion.button
                            key={amount}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => addFakeMoney(amount)}
                            disabled={addingMoney}
                            className="group relative overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-xl p-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-700 transition-colors">
                                    <PlusIcon className="h-4 w-4 text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-slate-900">
                                        {addingMoney ? "Adding..." : `₹${amount.toLocaleString()}`}
                                    </div>
                                    <div className="text-xs text-slate-600">
                                        {amount === 1000 ? "Quick top-up" : amount === 5000 ? "Standard amount" : "Large deposit"}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Hover effect overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                        </motion.button>
                    ))}
                </div>
                
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-xs text-slate-600">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>Demo funds for testing purposes only</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

Balance.displayName = 'Balance';
export default Balance;
