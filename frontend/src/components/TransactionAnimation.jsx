import { useState, useEffect } from "react";

export const TransactionAnimation = ({ 
    isVisible, 
    amount, 
    fromUser, 
    toUser, 
    isQuickPe = false,
    onComplete 
}) => {
    const [animationStage, setAnimationStage] = useState('start'); // start, sending, success, complete
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (isVisible) {
            const sequence = async () => {
                setAnimationStage('start');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                setAnimationStage('sending');
                generateParticles();
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                setAnimationStage('success');
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                setAnimationStage('complete');
                if (onComplete) onComplete();
            };
            
            sequence();
        }
    }, [isVisible, onComplete]);

    const generateParticles = () => {
        const newParticles = Array.from({ length: 8 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 0.5,
            duration: 1 + Math.random() * 0.5
        }));
        setParticles(newParticles);
    };

    const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    if (!isVisible || animationStage === 'complete') {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden">
                {/* Background particles */}
                {animationStage === 'sending' && (
                    <div className="absolute inset-0 pointer-events-none">
                        {particles.map(particle => (
                            <div
                                key={particle.id}
                                className={`absolute w-2 h-2 rounded-full ${
                                    isQuickPe ? 'bg-purple-400' : 'bg-blue-400'
                                } animate-ping`}
                                style={{
                                    left: `${particle.x}%`,
                                    top: `${particle.y}%`,
                                    animationDelay: `${particle.delay}s`,
                                    animationDuration: `${particle.duration}s`
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Main content */}
                <div className="relative z-10 text-center">
                    {/* Animation stages */}
                    {animationStage === 'start' && (
                        <div className="space-y-4">
                            <div className="text-6xl animate-bounce">
                                {isQuickPe ? '⚡' : '💸'}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                Preparing Transfer...
                            </h3>
                        </div>
                    )}

                    {animationStage === 'sending' && (
                        <div className="space-y-6">
                            {/* Amount display */}
                            <div className="text-center">
                                <div className={`text-4xl font-bold ${
                                    isQuickPe ? 'text-purple-600' : 'text-blue-600'
                                } animate-pulse`}>
                                    {formatCurrency(amount)}
                                </div>
                                {isQuickPe && (
                                    <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full mt-2">
                                        <span className="mr-1">⚡</span>
                                        QuickPe Transfer
                                    </div>
                                )}
                            </div>

                            {/* Transfer flow animation */}
                            <div className="flex items-center justify-center space-x-4">
                                {/* From user */}
                                <div className="text-center">
                                    <div className={`w-16 h-16 rounded-full ${
                                        isQuickPe ? 'bg-purple-100' : 'bg-blue-100'
                                    } flex items-center justify-center text-2xl animate-pulse`}>
                                        👤
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2 max-w-20 truncate">
                                        {fromUser}
                                    </p>
                                </div>

                                {/* Arrow with money flow */}
                                <div className="flex-1 relative">
                                    <div className={`h-1 ${
                                        isQuickPe ? 'bg-purple-200' : 'bg-blue-200'
                                    } rounded-full relative overflow-hidden`}>
                                        <div className={`h-full ${
                                            isQuickPe ? 'bg-purple-600' : 'bg-blue-600'
                                        } rounded-full animate-pulse`} 
                                        style={{
                                            width: '100%',
                                            animation: 'slideRight 2s ease-in-out infinite'
                                        }}></div>
                                    </div>
                                    
                                    {/* Flying money icons */}
                                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full">
                                        <div className="text-lg animate-bounce" 
                                             style={{ 
                                                 animation: 'flyRight 2s ease-in-out infinite',
                                                 animationDelay: '0s'
                                             }}>
                                            💰
                                        </div>
                                    </div>
                                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full">
                                        <div className="text-lg animate-bounce" 
                                             style={{ 
                                                 animation: 'flyRight 2s ease-in-out infinite',
                                                 animationDelay: '0.5s'
                                             }}>
                                            💸
                                        </div>
                                    </div>
                                </div>

                                {/* To user */}
                                <div className="text-center">
                                    <div className={`w-16 h-16 rounded-full ${
                                        isQuickPe ? 'bg-purple-100' : 'bg-green-100'
                                    } flex items-center justify-center text-2xl animate-pulse`}>
                                        👤
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2 max-w-20 truncate">
                                        {toUser}
                                    </p>
                                </div>
                            </div>

                            <p className="text-gray-600">
                                {isQuickPe ? 'Lightning-fast transfer in progress...' : 'Processing your transfer...'}
                            </p>
                        </div>
                    )}

                    {animationStage === 'success' && (
                        <div className="space-y-4">
                            <div className="text-6xl animate-bounce">
                                ✅
                            </div>
                            <h3 className="text-xl font-semibold text-green-600">
                                Transfer Successful!
                            </h3>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(amount)}
                            </div>
                            <p className="text-gray-600">
                                Successfully sent to {toUser}
                            </p>
                            {isQuickPe && (
                                <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                    <span className="mr-1">⚡</span>
                                    Completed via QuickPe
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom CSS animations */}
            <style jsx>{`
                @keyframes slideRight {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                @keyframes flyRight {
                    0% { 
                        transform: translateX(-20px) translateY(-50%); 
                        opacity: 0; 
                    }
                    50% { 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateX(calc(100% + 20px)) translateY(-50%); 
                        opacity: 0; 
                    }
                }
            `}</style>
        </div>
    );
};
export default TransactionAnimation;
