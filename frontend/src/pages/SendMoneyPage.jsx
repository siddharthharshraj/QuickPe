import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Users } from '../components/Users';
import { PageSkeleton } from '../components/PageSkeleton';

export const SendMoneyPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show skeleton for 2 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <PageSkeleton type="send-money" />
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
      <Header />
      
      <div className="flex-1 pt-20 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <PaperAirplaneIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Send Money</h1>
              <p className="text-slate-600">Transfer funds instantly to other QuickPe users</p>
            </div>
          </motion.div>

          {/* Users Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Users />
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SendMoneyPage;
