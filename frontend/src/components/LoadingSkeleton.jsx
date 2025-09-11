import React from 'react';

export const LoadingSkeleton = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
                {/* Animated Money Icon */}
                <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <span className="text-3xl animate-bounce">💸</span>
                    </div>
                    {/* Ripple Effect */}
                    <div className="absolute inset-0 w-20 h-20 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
                        <div className="absolute inset-2 rounded-full border-2 border-blue-400 animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
                    </div>
                </div>

                {/* Loading Text */}
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Processing Transfer</h3>
                <p className="text-gray-600 mb-6">Please wait while we process your transaction...</p>

                {/* Loading Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                </div>

                {/* Animated Dots */}
                <div className="flex justify-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
            </div>
        </div>
    );
};

export const SendingAnimation = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
                {/* Money Flying Animation */}
                <div className="relative mb-6 h-24">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">You</span>
                        </div>
                    </div>
                    
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">👤</span>
                        </div>
                    </div>

                    {/* Flying Money */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="animate-ping">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>

                    {/* Arrow Animation */}
                    <div className="absolute top-1/2 left-1/4 right-1/4 transform -translate-y-1/2">
                        <div className="flex items-center justify-center">
                            <div className="w-full h-0.5 bg-gradient-to-r from-blue-500 to-green-500 relative overflow-hidden">
                                <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                            </div>
                            <span className="text-green-500 ml-1 animate-bounce">→</span>
                        </div>
                    </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-2">Sending Money</h3>
                <p className="text-gray-600">Your transfer is being processed securely...</p>
            </div>
        </div>
    );
};
