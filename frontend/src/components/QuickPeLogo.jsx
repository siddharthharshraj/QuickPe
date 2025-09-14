import React from 'react';

const QuickPeLogo = ({ size = 'md', className = '', showText = true }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    const textSizeClasses = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl',
        xl: 'text-3xl'
    };

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            {/* QuickPe Icon */}
            <div className={`${sizeClasses[size]} relative`}>
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <defs>
                        <linearGradient id="quickpe-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor:'#10b981', stopOpacity:1}} />
                            <stop offset="100%" style={{stopColor:'#0d9488', stopOpacity:1}} />
                        </linearGradient>
                    </defs>
                    
                    {/* Background circle */}
                    <circle cx="16" cy="16" r="15" fill="url(#quickpe-gradient)" stroke="#ffffff" strokeWidth="2"/>
                    
                    {/* QuickPe "Q" letter stylized */}
                    <path d="M10 10 Q16 8 22 10 Q24 16 22 22 Q16 24 10 22 Q8 16 10 10 Z" fill="#ffffff" opacity="0.9"/>
                    
                    {/* Inner "P" element */}
                    <path d="M13 12 L13 20 M13 12 L18 12 Q20 14 18 16 L13 16" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    
                    {/* Quick payment indicator dots */}
                    <circle cx="20" cy="20" r="1.5" fill="#ffffff"/>
                    <circle cx="22" cy="18" r="1" fill="#ffffff" opacity="0.7"/>
                    <circle cx="24" cy="16" r="0.5" fill="#ffffff" opacity="0.5"/>
                </svg>
            </div>
            
            {/* QuickPe Text */}
            {showText && (
                <span className={`font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent ${textSizeClasses[size]}`}>
                    QuickPe
                </span>
            )}
        </div>
    );
};

export default QuickPeLogo;
