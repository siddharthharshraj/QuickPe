import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { Button } from "./Button";

export const Balance = () => {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [addingMoney, setAddingMoney] = useState(false);

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        try {
            const response = await apiClient.get("/account/balance");
            setBalance(response.data.balance);
        } catch (error) {
            setError("Failed to fetch balance");
            console.error("Balance fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const addFakeMoney = async (amount) => {
        setAddingMoney(true);
        try {
            const response = await apiClient.post("/account/add-money", { amount });
            setBalance(response.data.newBalance);
        } catch (error) {
            console.error("Add money error:", error);
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
            <div className="flex items-center justify-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                <div className="text-red-600 font-medium">Error</div>
                <div className="text-red-500 text-sm">{error}</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-lg font-semibold text-gray-700">Your Balance</div>
                    <div className="text-3xl font-bold text-green-600">
                        {formatCurrency(balance)}
                    </div>
                </div>
                <div className="text-4xl">💰</div>
            </div>
            
            <div className="mt-6 border-t pt-4">
                <div className="text-base font-semibold text-gray-700 mb-3">Add Test Money:</div>
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => addFakeMoney(1000)}
                        disabled={addingMoney}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-medium text-sm transition-colors"
                    >
                        {addingMoney ? "Adding..." : "+₹1000"}
                    </button>
                    <button 
                        onClick={() => addFakeMoney(5000)}
                        disabled={addingMoney}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-medium text-sm transition-colors"
                    >
                        {addingMoney ? "Adding..." : "+₹5000"}
                    </button>
                    <button 
                        onClick={() => addFakeMoney(10000)}
                        disabled={addingMoney}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-medium text-sm transition-colors"
                    >
                        {addingMoney ? "Adding..." : "+₹10000"}
                    </button>
                </div>
            </div>
        </div>
    );
};