import React from 'react';

export const SuccessModal = ({ isOpen, onClose, transaction, onRedirect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center transform animate-scale-in">
                {/* Success Icon with Animation */}
                <div className="relative mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    {/* Success Ripple Effect */}
                    <div className="absolute inset-0 w-20 h-20 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
                    </div>
                </div>

                {/* Success Message */}
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Transfer Successful!</h3>
                <p className="text-gray-600 mb-6">
                    Your money has been sent successfully
                </p>

                {/* Transaction Details */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Amount:</span>
                            <span className="font-semibold text-green-600 text-lg">₹{transaction?.amount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">To:</span>
                            <span className="font-semibold text-gray-800">{transaction?.recipientName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Status:</span>
                            <span className="font-semibold text-green-600 flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                Completed
                            </span>
                        </div>
                    </div>
                </div>

                {/* Celebration Animation */}
                <div className="mb-6">
                    <div className="flex justify-center space-x-2">
                        <span className="text-2xl animate-bounce">🎉</span>
                        <span className="text-2xl animate-bounce" style={{animationDelay: '0.1s'}}>💰</span>
                        <span className="text-2xl animate-bounce" style={{animationDelay: '0.2s'}}>✨</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={onRedirect}
                        className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                        Go to Dashboard
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Add custom CSS for scale-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes scale-in {
        0% {
            opacity: 0;
            transform: scale(0.9);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }
    .animate-scale-in {
        animation: scale-in 0.3s ease-out;
    }
`;
document.head.appendChild(style);
export default SuccessModal;
