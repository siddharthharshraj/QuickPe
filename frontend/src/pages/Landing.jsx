import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { driver } from 'driver.js';
import { 
    ShieldCheckIcon, 
    BoltIcon, 
    GlobeAltIcon,
    ArrowRightIcon,
    PlayIcon
} from '@heroicons/react/24/outline';
import QuickPeLogo from '../components/QuickPeLogo';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import TradeJournalMockup from '../components/TradeJournalMockup';
import 'driver.js/dist/driver.css';

export const Landing = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);

    const features = [
        {
            icon: ShieldCheckIcon,
            title: "Bank-Level Security",
            description: "Your money and data are protected with enterprise-grade encryption and security protocols."
        },
        {
            icon: BoltIcon,
            title: "Instant Transfers",
            description: "Send money instantly to anyone, anywhere. No waiting, no delays - just fast, reliable transfers."
        },
        {
            icon: GlobeAltIcon,
            title: "Global Reach",
            description: "Connect with users worldwide. Send money across borders with competitive exchange rates."
        }
    ];

    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            steps: [
                {
                    element: '#quickpe-logo',
                    popover: {
                        title: 'Welcome to QuickPe',
                        description: 'Your modern digital wallet for secure money transfers. Click here to navigate home.'
                    }
                },
                {
                    element: '#about-btn',
                    popover: {
                        title: 'About QuickPe',
                        description: 'Learn more about our project, technology stack, and architecture.'
                    }
                },
                {
                    element: '#kpi-reports-btn',
                    popover: {
                        title: 'KPI Reports',
                        description: 'View detailed analytics and performance metrics of the platform.'
                    }
                },
                {
                    element: '#signin-btn',
                    popover: {
                        title: 'Sign In',
                        description: 'Access your existing QuickPe account or try our demo accounts.'
                    }
                },
                {
                    element: '#signup-btn',
                    popover: {
                        title: 'Sign Up',
                        description: 'Create your new QuickPe account and start using our services.'
                    }
                },
                {
                    element: '#get-started-btn',
                    popover: {
                        title: 'Get Started',
                        description: 'Create your account or sign in to start using QuickPe.'
                    }
                }
            ]
        });
        driverObj.drive();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <motion.div 
                            id="quickpe-logo"
                            className="flex items-center space-x-2 cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
                        >
                            <QuickPeLogo />
                        </motion.div>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center space-x-6">
                            <button 
                                id="about-btn"
                                onClick={() => navigate('/about')}
                                className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                            >
                                About
                            </button>
                            <button 
                                id="kpi-reports-btn"
                                onClick={() => navigate('/kpi-reports')}
                                className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                            >
                                KPI Reports
                            </button>
                            {isAuthenticated ? (
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Dashboard
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={startTour}
                                        className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                                    >
                                        Take Tour
                                    </button>
                                    <button 
                                        id="signup-btn"
                                        onClick={() => navigate('/signup')}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        Sign Up
                                    </button>
                                    <button 
                                        id="signin-btn"
                                        onClick={() => navigate('/signin')}
                                        className="text-emerald-600 border border-emerald-600 px-6 py-2 rounded-lg font-medium hover:bg-emerald-50 transition-all duration-200"
                                    >
                                        Sign In
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center">
                        <motion.h1 
                            className="text-5xl md:text-6xl font-bold text-slate-900 mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            Your Digital Wallet
                            <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                Reimagined
                            </span>
                        </motion.h1>
                        <motion.p 
                            className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            Experience the future of digital payments with QuickPe. Send money instantly, 
                            track expenses, and manage your finances with bank-level security.
                        </motion.p>
                        <motion.div 
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            {!isAuthenticated ? (
                                <>
                                    <button 
                                        onClick={() => navigate('/signup')}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                                    >
                                        Start Free Today
                                    </button>
                                    <button 
                                        onClick={() => navigate('/signin')}
                                        className="flex items-center justify-center space-x-2 text-slate-700 border-2 border-slate-300 px-8 py-4 rounded-xl font-semibold text-lg hover:border-emerald-500 hover:text-emerald-600 transition-all duration-200"
                                    >
                                        <PlayIcon className="w-6 h-6" />
                                        <span>Sign In</span>
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center space-x-2"
                                >
                                    <span>Go to Dashboard</span>
                                    <ArrowRightIcon className="w-5 h-5" />
                                </button>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Real Metrics Section */}
            <section className="py-16 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Live Platform Metrics</h2>
                        <p className="text-lg text-slate-600">Real-time data from our production environment</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <motion.div 
                            className="text-center p-6 bg-white rounded-xl shadow-lg"
                            whileHover={{ y: -5 }}
                        >
                            <div className="text-3xl font-bold text-emerald-600 mb-2">3.2K+</div>
                            <div className="text-sm text-slate-600">Total Requests</div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mx-auto mt-2"></div>
                        </motion.div>
                        <motion.div 
                            className="text-center p-6 bg-white rounded-xl shadow-lg"
                            whileHover={{ y: -5 }}
                        >
                            <div className="text-3xl font-bold text-blue-600 mb-2">391ms</div>
                            <div className="text-sm text-slate-600">Avg Response Time</div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-auto mt-2"></div>
                        </motion.div>
                        <motion.div 
                            className="text-center p-6 bg-white rounded-xl shadow-lg"
                            whileHover={{ y: -5 }}
                        >
                            <div className="text-3xl font-bold text-purple-600 mb-2">89%</div>
                            <div className="text-sm text-slate-600">Success Rate</div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse mx-auto mt-2"></div>
                        </motion.div>
                        <motion.div 
                            className="text-center p-6 bg-white rounded-xl shadow-lg"
                            whileHover={{ y: -5 }}
                        >
                            <div className="text-3xl font-bold text-teal-600 mb-2">2.2K</div>
                            <div className="text-sm text-slate-600">Concurrent Users</div>
                            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse mx-auto mt-2"></div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.h2 
                            className="text-4xl font-bold text-slate-900 mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            Why Choose QuickPe?
                        </motion.h2>
                        <motion.p 
                            className="text-xl text-slate-600 max-w-2xl mx-auto"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            viewport={{ once: true }}
                        >
                            Built for the modern world with cutting-edge technology and user-first design.
                        </motion.p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div 
                                    key={index}
                                    className="text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-lg transition-shadow"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.2 }}
                                    viewport={{ once: true }}
                                    whileHover={{ y: -5 }}
                                >
                                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-slate-900 mb-4">{feature.title}</h3>
                                    <p className="text-slate-600">{feature.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Project Features Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Built with Modern Architecture
                        </h2>
                        <p className="text-xl text-blue-100">
                            A comprehensive digital wallet solution with enterprise-grade features
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-white mb-2">🔔</div>
                            <div className="text-xl font-semibold text-white mb-2">Real-time</div>
                            <div className="text-blue-100 text-lg">Socket.IO Notifications</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-white mb-2">🔐</div>
                            <div className="text-xl font-semibold text-white mb-2">JWT Auth</div>
                            <div className="text-blue-100 text-lg">Secure Authentication</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-white mb-2">📊</div>
                            <div className="text-xl font-semibold text-white mb-2">Full Stack</div>
                            <div className="text-blue-100 text-lg">MERN Application</div>
                        </div>
                    </div>
                </div>
            </section>


            {/* CTA Section */}
            {/* Trade Journal Showcase Section */}
            <motion.section
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="py-20 bg-gradient-to-br from-gray-50 to-emerald-50"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Professional Trade Journal
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Track your investments with real-time market data from Indian stock exchanges. 
                            Monitor your portfolio performance and make informed decisions.
                        </p>
                        <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-emerald-600">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span>Live market data • Updates every 5 seconds</span>
                        </div>
                    </div>
                    
                    <div className="max-w-5xl mx-auto">
                        <TradeJournalMockup />
                    </div>
                    
                    <div className="text-center mt-12">
                        <p className="text-gray-600 mb-6">
                            Join thousands of investors already using QuickPe's Trade Journal
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <button
                                onClick={() => navigate('/signup')}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:from-emerald-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Start Trading Journal Free
                            </button>
                            <button
                                onClick={() => navigate('/about')}
                                className="text-emerald-600 border border-emerald-600 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-emerald-50 transition-all duration-200"
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </motion.section>

            <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-emerald-100 mb-10">
                        Join QuickPe today and experience the future of digital payments
                    </p>
                    {!isAuthenticated ? (
                        <button
                            id="get-started-btn"
                            onClick={() => navigate('/signup')}
                            className="bg-white text-emerald-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
                        >
                            Create Your Account
                        </button>
                    ) : (
                        <button
                            id="get-started-btn"
                            onClick={() => navigate('/dashboard')}
                            className="bg-white text-emerald-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
                        >
                            Go to Dashboard
                        </button>
                    )}
                </div>
            </section>
            
            <Footer />
        </div>
    );
};

export default Landing;
