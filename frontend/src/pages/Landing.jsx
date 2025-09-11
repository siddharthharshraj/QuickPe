import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';

export const Landing = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: '🔒',
            title: 'Secure Transactions',
            description: 'Bank-level security with encrypted transfers and JWT authentication'
        },
        {
            icon: '⚡',
            title: 'Real-time Notifications',
            description: 'Instant notifications for all transactions with WebSocket technology'
        },
        {
            icon: '💰',
            title: 'Easy Money Transfer',
            description: 'Send money to anyone with just a few clicks and confirmation'
        },
        {
            icon: '📱',
            title: 'Modern Interface',
            description: 'Beautiful, responsive design that works on all devices'
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation Header */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">₹</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">QuickPe</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate("/about")}
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                About
                            </button>
                            <button
                                onClick={() => navigate("/kpi-reports")}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                            >
                                KPI Reports
                            </button>
                            <button
                                onClick={() => navigate("/signin")}
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate("/signup")}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-3xl">₹</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
                            The Future of
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                Digital Payments
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
                            Experience seamless, secure, and instant money transfers with QuickPe. 
                            Join thousands of users who trust us for their digital payment needs.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                            <button
                                onClick={() => navigate('/signup')}
                                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                            >
                                Start Your Journey
                            </button>
                            <button
                                onClick={() => navigate('/signin')}
                                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all duration-200"
                            >
                                Sign In
                            </button>
                        </div>
                        
                        {/* Trust Indicators */}
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-gray-500">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">Bank-Level Security</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">Instant Transfers</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">24/7 Available</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Why Choose QuickPe?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Built with cutting-edge technology to provide you with the best digital payment experience
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="group">
                                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 group-hover:-translate-y-2">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <span className="text-3xl">{feature.icon}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
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
            <section className="py-20 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-gray-600 mb-10">
                        Join QuickPe today and experience the future of digital payments
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        className="bg-blue-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                        Create Your Account
                    </button>
                </div>
            </section>
            
            <Footer />
        </div>
    );
};
