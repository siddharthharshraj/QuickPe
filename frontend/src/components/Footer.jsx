import { useState, useEffect } from 'react';

export const Footer = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000); // Update every second for real-time updates

        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
    };

    const formatCurrentMonthYear = (date) => {
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
    };

    const techStack = [
        { name: 'React', icon: '⚛️' },
        { name: 'Node.js', icon: '🟢' },
        { name: 'Express.js', icon: '🚀' },
        { name: 'MongoDB', icon: '🍃' },
        { name: 'Socket.IO', icon: '🔌' },
        { name: 'JWT', icon: '🔐' },
        { name: 'Tailwind CSS', icon: '🎨' },
        { name: 'Axios', icon: '📡' }
    ];

    return (
        <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xl">₹</span>
                            </div>
                            <span className="text-2xl font-bold text-white">QuickPe</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">
                            Secure, fast, and reliable digital payments platform built with modern web technologies.
                        </p>
                        <div className="flex space-x-3">
                            <a href="https://www.linkedin.com/in/siddharthharshraj/" target="_blank" rel="noopener noreferrer" 
                               className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors">
                                <span className="text-white text-sm font-bold">in</span>
                            </a>
                            <a href="https://siddharth-dev.tech" target="_blank" rel="noopener noreferrer"
                               className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors">
                                <span className="text-white text-sm">🌐</span>
                            </a>
                            <a href="mailto:contact@siddharth-dev.tech"
                               className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors">
                                <span className="text-white text-sm">✉</span>
                            </a>
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="lg:col-span-2">
                        <h3 className="text-xl font-bold mb-6 text-white">Built With Modern Technologies</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {techStack.map((tech, index) => (
                                <div 
                                    key={index}
                                    className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-opacity-20 transition-all duration-300 group"
                                >
                                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{tech.icon}</div>
                                    <div className="text-sm font-medium text-gray-200">{tech.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Developer Info */}
                    <div className="lg:col-span-1">
                        <h3 className="text-xl font-bold mb-6 text-white">Developer</h3>
                        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white font-bold text-xl">SH</span>
                            </div>
                            <a 
                                href="https://siddharth-dev.tech" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-lg font-bold text-white text-center mb-2 block hover:text-blue-300 transition-colors duration-200"
                            >
                                Siddharth Harsh Raj
                            </a>
                            <p className="text-gray-300 text-sm text-center mb-3">Absolute Learner and Engineer</p>
                            <p className="text-gray-400 text-xs text-center">{formatDate(currentDate)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white border-opacity-20">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-6 text-sm text-gray-300">
                            <span>© {formatCurrentMonthYear(currentDate)} QuickPe. All rights reserved.</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">Made with ❤️ in India</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Version 1.0.0</span>
                            <span>•</span>
                            <span>Secure & Encrypted</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
