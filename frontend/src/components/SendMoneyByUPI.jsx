import { useNavigate } from 'react-router-dom';
import { useState } from "react";
import apiClient from "../services/api/client";
import { TransactionAnimation } from "./TransactionAnimation";

import { Button } from "./Button";

export const SendMoneyByUPI = () => {
    const [quickpeId, setQuickpeId] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [recipientInfo, setRecipientInfo] = useState(null);
    const [step, setStep] = useState(1); // 1: Enter UPI ID, 2: Enter Amount, 3: Confirm
    const [showAnimation, setShowAnimation] = useState(false);
    const navigate = useNavigate();

    const validateQuickPeId = (id) => {
        const regex = /^QP[0-9]{6}$/;
        return regex.test(id);
    };

    const fetchRecipientInfo = async () => {
        if (!validateQuickPeId(quickpeId)) {
            setError("Please enter a valid QuickPe ID (format: QP123456)");
            return;
        }

        setLoading(true);
        setError("");
        
        try {
            const response = await apiClient.get(`/user/bulk?filter=${quickpeId}`);
            const users = response.data.users || [];
            
            if (users.length === 0) {
                setError("QuickPe ID not found. Please check and try again.");
                return;
            }
            
            const recipient = users[0];
            setRecipientInfo(recipient);
            setStep(2);
        } catch (error) {
            setError("Failed to find recipient. Please try again.");
            console.error("Recipient lookup error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAmountSubmit = () => {
        const amountNum = parseFloat(amount);
        if (!amount || amountNum <= 0) {
            setError("Please enter a valid amount");
            return;
        }
        if (amountNum > 100000) {
            setError("Maximum transfer limit is ₹1,00,000");
            return;
        }
        setError("");
        setStep(3);
    };

    const handleTransfer = async () => {
        setLoading(true);
        setError("");
        
        try {
            // Show animation before making the request
            setShowAnimation(true);
            
            const response = await apiClient.post("/account/transfer", {
                to: quickpeId,
                amount: parseFloat(amount)
            });

            if (response.data) {
                setSuccess("Money sent successfully!");
                setError("");
                // Animation will handle completion and page reload
            }
        } catch (err) {
            setError(err.response?.data?.message || "Transfer failed");
            setSuccess("");
            setShowAnimation(false);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setQuickpeId("");
        setAmount("");
        setRecipientInfo(null);
        setStep(1);
        setError("");
        setSuccess("");
        setShowAnimation(false);
    };

    const handleAnimationComplete = () => {
        setShowAnimation(false);
        // Don't reload - let WebSocket handle updates
        // setTimeout(() => {
        //     window.location.reload();
        // }, 1000);
    };

    if (step === 4 && success) {
        return (
            <div className="max-w-md mx-auto">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Transfer Successful!</h3>
                    <p className="text-green-700">{success}</p>
                    <button
                        onClick={resetForm}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Send Another Payment
                    </button>
                </div>
                {/* Transaction Animation */}
                <TransactionAnimation
                    isVisible={showAnimation}
                    amount={parseFloat(amount)}
                    fromUser="You"
                    toUser={recipientInfo?.name || quickpeId}
                    isQuickPe={true}
                    onComplete={handleAnimationComplete}
                />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>1</div>
                        <div className={`w-8 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>2</div>
                        <div className={`w-8 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>3</div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Step 1: Enter QuickPe ID */}
                {step === 1 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter QuickPe ID</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Recipient's QuickPe ID
                                </label>
                                <input
                                    type="text"
                                    value={quickpeId}
                                    onChange={(e) => setQuickpeId(e.target.value.toUpperCase())}
                                    placeholder="QP123456"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg tracking-wider"
                                    maxLength={8}
                                />
                                <p className="text-xs text-gray-500 mt-1">Format: QP followed by 6 digits</p>
                            </div>
                            <Button
                                onClick={fetchRecipientInfo}
                                label={loading ? "Verifying..." : "Continue"}
                                disabled={loading || !quickpeId}
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: Enter Amount */}
                {step === 2 && recipientInfo && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Amount</h3>
                        
                        {/* Recipient Info */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {recipientInfo.firstName[0]}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {recipientInfo.firstName} {recipientInfo.lastName}
                                    </p>
                                    <p className="text-sm text-gray-600">{recipientInfo.quickpeId}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                    min="1"
                                    max="100000"
                                />
                                <p className="text-xs text-gray-500 mt-1">Maximum limit: ₹1,00,000</p>
                            </div>
                            
                            {/* Quick Amount Buttons */}
                            <div className="grid grid-cols-3 gap-2">
                                {[100, 500, 1000].map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setAmount(amt.toString())}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                    >
                                        ₹{amt}
                                    </button>
                                ))}
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Back
                                </button>
                                <Button
                                    onClick={handleAmountSubmit}
                                    label="Continue"
                                    disabled={!amount}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Confirm Transfer */}
                {step === 3 && recipientInfo && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Transfer</h3>
                        
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">To:</span>
                                    <span className="font-medium">{recipientInfo.firstName} {recipientInfo.lastName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">QuickPe ID:</span>
                                    <span className="font-mono">{recipientInfo.quickpeId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Amount:</span>
                                    <span className="font-bold text-lg text-green-600">₹{amount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Back
                            </button>
                            <Button
                                onClick={handleTransfer}
                                label={loading ? "Processing..." : "Send Money"}
                                disabled={loading}
                            />
                        </div>
                    </div>
                )}
            </div>
            
            {/* Transaction Animation */}
            <TransactionAnimation
                isVisible={showAnimation}
                amount={parseFloat(amount) || 0}
                fromUser="You"
                toUser={recipientInfo?.name || quickpeId}
                isQuickPe={true}
                onComplete={handleAnimationComplete}
            />
        </div>
    );
};
export default SendMoneyByUPI;
