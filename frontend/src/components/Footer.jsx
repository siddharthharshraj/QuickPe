import React, { useState, useEffect } from 'react';
import { 
    EnvelopeIcon, 
    GlobeAltIcon,
    CodeBracketIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';

export const Footer = () => {
    const [currentDate] = useState(new Date());

    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    const techStack = [
        'React.js', 'Node.js', 'MongoDB', 'Express.js', 'Tailwind CSS', 
        'Vite', 'React Flow', 'Driver.js', 'Framer Motion', 'Socket.io'
    ];

    return (
        <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* QuickPe Info */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">Q</span>
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                QuickPe
                            </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">
                            Modern digital wallet platform for instant money transfers using unique QuickPe IDs. 
                            Built with cutting-edge technology for seamless user experience.
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <CalendarIcon className="h-4 w-4" />
                            <span>Updated: {currentMonth} {currentYear}</span>
                        </div>
                    </div>

                    {/* Developer Info */}
                    <div className="lg:col-span-1">
                        <h4 className="text-lg font-semibold mb-4 text-white">Developer</h4>
                        <div className="space-y-3">
                            <div className="text-gray-300">
                                <p className="font-medium text-white mb-2">Siddharth Harsh Raj</p>
                                <p className="text-sm text-gray-400 mb-3">Full Stack Developer</p>
                            </div>
                            <div className="space-y-2">
                                <a 
                                    href="mailto:contact@siddharth-dev.tech" 
                                    className="flex items-center space-x-2 text-gray-300 hover:text-emerald-400 transition-colors text-sm"
                                >
                                    <EnvelopeIcon className="h-4 w-4" />
                                    <span>contact@siddharth-dev.tech</span>
                                </a>
                                <a 
                                    href="https://www.linkedin.com/in/siddharthharshraj/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-gray-300 hover:text-emerald-400 transition-colors text-sm"
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                    </svg>
                                    <span>LinkedIn Profile</span>
                                </a>
                                <a 
                                    href="https://siddharth-dev.tech" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-gray-300 hover:text-emerald-400 transition-colors text-sm"
                                >
                                    <GlobeAltIcon className="h-4 w-4" />
                                    <span>Portfolio</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="lg:col-span-1">
                        <h4 className="text-lg font-semibold mb-4 text-white flex items-center space-x-2">
                            <CodeBracketIcon className="h-5 w-5" />
                            <span>Tech Stack</span>
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {techStack.map((tech, index) => (
                                <div 
                                    key={index}
                                    className="bg-gray-800/50 px-3 py-1 rounded-lg text-xs text-gray-300 border border-gray-700 hover:border-blue-500 transition-colors"
                                >
                                    {tech}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-1">
                        <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
                        <div className="space-y-2">
                            <a href="/" className="block text-gray-300 hover:text-blue-400 transition-colors text-sm">
                                Home
                            </a>
                            <a href="/kpi-reports" className="block text-gray-300 hover:text-blue-400 transition-colors text-sm">
                                KPI Reports
                            </a>
                            <a href="/about" className="block text-gray-300 hover:text-blue-400 transition-colors text-sm">
                                About Project
                            </a>
                            <a href="/signup" className="block text-gray-300 hover:text-blue-400 transition-colors text-sm">
                                Get Started
                            </a>
                        </div>
                        
                        {/* Project Stats */}
                        <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                            <h5 className="text-sm font-semibold text-white mb-2">Project Status</h5>
                            <div className="space-y-1 text-xs text-gray-400">
                                <div className="flex justify-between">
                                    <span>Version:</span>
                                    <span className="text-green-400">v1.0.0</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Load Tested:</span>
                                    <span className="text-green-400">500 Users</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Uptime:</span>
                                    <span className="text-green-400">99.9%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-gray-700 mt-8 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="text-center md:text-left">
                            <p className="text-gray-400 text-sm">
                                &copy; {currentYear} QuickPe. Built with ❤️ for modern digital payments.
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                                Last updated: {currentMonth} {currentYear} • Made in India 🇮🇳
                            </p>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Privacy Policy</span>
                            <span>•</span>
                            <span>Terms of Service</span>
                            <span>•</span>
                            <span>Security</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
export default Footer;
