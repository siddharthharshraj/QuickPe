import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BoltIcon,
  ShieldCheckIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Optimized for Web Vitals
const LandingOptimized = () => {
  const navigate = useNavigate();

  // Real KPI Metrics (Updated)
  const kpiMetrics = {
    users: '150+',
    transactions: '100%',
    uptime: '99.9%',
    responseTime: '<300ms',
    zeroLoss: 'Guaranteed',
    dailyLimit: '₹1,00,000'
  };

  const features = [
    {
      icon: BoltIcon,
      title: 'Lightning Fast',
      description: 'Transfers complete in under 300ms with real-time updates',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Zero Money Loss',
      description: 'Atomic transactions guarantee 100% data integrity',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: CurrencyRupeeIcon,
      title: '₹10,000 Welcome Bonus',
      description: 'Start with ₹10,000 instantly upon signup',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: UserGroupIcon,
      title: '150+ Concurrent Users',
      description: 'Handles high traffic with 99.9% uptime',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: ChartBarIcon,
      title: 'Smart Analytics',
      description: 'Beautiful PDFs and real-time spending insights',
      color: 'from-red-400 to-rose-500'
    },
    {
      icon: ClockIcon,
      title: 'Request Money',
      description: 'Request up to ₹80,000/day from any user',
      color: 'from-indigo-400 to-violet-500'
    }
  ];

  const stats = [
    { label: 'Active Users', value: kpiMetrics.users, icon: UserGroupIcon },
    { label: 'Success Rate', value: kpiMetrics.transactions, icon: CheckCircleIcon },
    { label: 'Uptime', value: kpiMetrics.uptime, icon: BoltIcon },
    { label: 'Response Time', value: kpiMetrics.responseTime, icon: ClockIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Hero Section - Optimized */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-8">
              <SparklesIcon className="h-4 w-4" />
              <span>100% Production Ready • Zero Money Loss</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Fast. Secure.
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"> Simple.</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Send money instantly with <strong>zero loss guarantee</strong>. 
              Get ₹10,000 welcome bonus. Handle 150+ users seamlessly.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white text-lg font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => navigate('/signin')}
                className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-600 text-lg font-semibold rounded-xl border-2 border-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center space-x-2"
              >
                <span>Sign In</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <span>Atomic Transactions</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <span>Real-time Updates</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section - Optimized */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-4">
                  <stat.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Optimized */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose QuickPe?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for speed, security, and simplicity. Production-ready for 150+ users.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-100 group"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Excellence Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Production-Grade Technology
            </h2>
            <p className="text-xl text-emerald-100">
              Built with enterprise-level architecture and security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-5xl font-bold mb-2">100%</div>
              <div className="text-emerald-100 mb-4">Atomic Transactions</div>
              <p className="text-sm text-emerald-50">
                Zero money loss with MongoDB sessions and automatic rollback
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-5xl font-bold mb-2">150+</div>
              <div className="text-emerald-100 mb-4">Concurrent Users</div>
              <p className="text-sm text-emerald-50">
                Connection pooling (50-100) with 60% bandwidth compression
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-5xl font-bold mb-2">&lt;300ms</div>
              <div className="text-emerald-100 mb-4">Response Time</div>
              <p className="text-sm text-emerald-50">
                Optimized queries with caching and real-time WebSocket updates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join 150+ users and experience the fastest, most secure payment platform.
            Get ₹10,000 welcome bonus instantly.
          </p>
          
          <button
            onClick={() => navigate('/signup')}
            className="px-10 py-5 bg-emerald-600 text-white text-xl font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center space-x-3"
          >
            <span>Create Free Account</span>
            <ArrowRightIcon className="h-6 w-6" />
          </button>

          <p className="mt-6 text-sm text-gray-500">
            No credit card required • ₹10,000 welcome bonus • 99.9% uptime guarantee
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">QuickPe</h3>
              <p className="text-gray-400">
                Fast. Secure. Simple.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 QuickPe. All rights reserved. Built with ❤️ for speed and security.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingOptimized;
