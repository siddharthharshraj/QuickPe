import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from "../services/api/client";
import { useState } from 'react';
import { Button } from '../components/Button';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Footer } from '../components/Footer';
import { PageSkeleton } from '../components/PageSkeleton';
import { SuccessModal } from '../components/SuccessModal';

export const SendMoney = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const id = searchParams.get("to");
    const quickpeId = searchParams.get("quickpeId");
    const name = searchParams.get("name");
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showSending, setShowSending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [transactionData, setTransactionData] = useState(null);

    const validateAmount = () => {
        const numAmount = parseFloat(amount);
        if (!amount || numAmount <= 0) {
            setError('Please enter a valid amount');
            return false;
        }
        if (numAmount > 100000) {
            setError('Amount cannot exceed ₹1,00,000');
            return false;
        }
        setError('');
        return true;
    };

    const handleInitiateTransfer = () => {
        if (validateAmount()) {
            setShowConfirmation(true);
        }
    };

    const handleConfirmTransfer = async () => {
        setLoading(true);
        setError('');
        setShowConfirmation(false);
        setShowSending(true);
        
        try {
            const response = await apiClient.post("/account/transfer", {
                toQuickpeId: quickpeId,
                amount: parseFloat(amount)
            });
            
            // Store transaction data for success modal
            setTransactionData({
                amount: parseFloat(amount),
                recipientName: name,
                transactionId: response.data.transactionId,
                timestamp: new Date()
            });
            
            // Show sending animation for 4-5 seconds
            setTimeout(() => {
                setShowSending(false);
                setShowSuccess(true);
            }, 4500);
            
        } catch (err) {
            setError(err.response?.data?.message || 'Transfer failed. Please try again.');
            setShowSending(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessRedirect = () => {
        setShowSuccess(false);
        navigate('/dashboard');
    };

    const handleSuccessClose = () => {
        setShowSuccess(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 text-center">
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">💸</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Send Money</h2>
                            <p className="text-green-100 text-sm mt-1">Transfer funds securely</p>
                        </div>

                        <div className="p-6">
                            {/* Recipient Info */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-semibold text-lg">
                                            {searchParams.get("name") ? searchParams.get("name")[0].toUpperCase() : "?"}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-gray-900">
                                            {searchParams.get("name") || "Select Recipient"}
                                        </div>
                                        <div className="text-sm text-gray-500">Recipient</div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}


                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="amount"
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                        placeholder="0"
                                        min="1"
                                        max="100000"
                                    />
                                </div>

                                {/* Quick Amount Buttons */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quick amounts:</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[100, 500, 1000, 2000].map((quickAmount) => (
                                            <button
                                                key={quickAmount}
                                                onClick={() => setAmount(quickAmount.toString())}
                                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                ₹{quickAmount}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <button
                                        onClick={handleInitiateTransfer}
                                        disabled={loading || !amount || !quickpeId || showSending}
                                        className="w-full py-3 px-4 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        {showSending ? "Sending..." : "Send Money"}
                                    </button>
                                    
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full py-2 px-4 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer />

            {/* Confirmation Modal */}
            {showConfirmation && (
                <ConfirmationModal
                    isOpen={showConfirmation}
                    onClose={() => setShowConfirmation(false)}
                    onConfirm={handleConfirmTransfer}
                    transaction={{
                        amount: parseFloat(amount),
                        recipientName: searchParams.get("name")
                    }}
                    loading={loading}
                />
            )}

            {/* Sending Animation */}
            {showSending && <SendingAnimation />}

            {/* Success Modal */}
            {showSuccess && (
                <SuccessModal
                    isOpen={showSuccess}
                    onClose={handleSuccessClose}
                    onRedirect={handleSuccessRedirect}
                    transaction={transactionData}
                />
            )}
        </div>
    );
};

export default SendMoney;