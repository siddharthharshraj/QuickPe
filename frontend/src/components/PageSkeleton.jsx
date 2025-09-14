import React from 'react';
import { motion } from 'framer-motion';

export const PageSkeleton = ({ type = 'dashboard' }) => {
  const shimmer = {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  };

  const SkeletonCard = ({ className = "", children }) => (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 ${className}`}>
      {children}
    </div>
  );

  const SkeletonLine = ({ width = "100%", height = "h-4" }) => (
    <motion.div
      className={`${height} bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-lg`}
      style={{ 
        width,
        backgroundSize: '200% 100%',
      }}
      {...shimmer}
    />
  );

  const SkeletonCircle = ({ size = "w-12 h-12" }) => (
    <motion.div
      className={`${size} bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-full`}
      style={{ backgroundSize: '200% 100%' }}
      {...shimmer}
    />
  );

  const DashboardSkeleton = () => (
    <>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <SkeletonLine width="300px" height="h-8" />
        <div className="mt-2">
          <SkeletonLine width="400px" height="h-4" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {[...Array(4)].map((_, index) => (
          <SkeletonCard key={index}>
            <div className="flex items-center justify-between mb-4">
              <SkeletonCircle />
              <SkeletonLine width="60px" height="h-4" />
            </div>
            <SkeletonLine width="80px" height="h-8" />
            <div className="mt-2">
              <SkeletonLine width="100px" height="h-4" />
            </div>
          </SkeletonCard>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-1"
        >
          <SkeletonCard>
            <div className="flex items-center justify-between mb-6">
              <SkeletonLine width="120px" height="h-6" />
              <SkeletonCircle size="w-8 h-8" />
            </div>
            
            <div className="text-center mb-6">
              <SkeletonLine width="150px" height="h-10" />
              <div className="mt-2">
                <SkeletonLine width="100px" height="h-4" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center">
                  <SkeletonLine width="100%" height="h-10" />
                  <div className="mt-1">
                    <SkeletonLine width="60px" height="h-3" />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonCard>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <SkeletonCard>
            <div className="flex items-center justify-between mb-6">
              <SkeletonLine width="140px" height="h-6" />
              <SkeletonCircle size="w-8 h-8" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <SkeletonCircle size="w-10 h-10" />
                    <SkeletonCircle size="w-4 h-4" />
                  </div>
                  <SkeletonLine width="120px" height="h-5" />
                  <div className="mt-2">
                    <SkeletonLine width="160px" height="h-4" />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonCard>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-8"
      >
        <SkeletonCard>
          <div className="flex items-center justify-between mb-6">
            <SkeletonLine width="160px" height="h-6" />
            <div className="flex items-center space-x-3">
              <SkeletonLine width="100px" height="h-5" />
              <SkeletonLine width="80px" height="h-5" />
            </div>
          </div>
          
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <SkeletonCircle size="w-10 h-10" />
                  <div>
                    <SkeletonLine width="120px" height="h-4" />
                    <div className="mt-1">
                      <SkeletonLine width="80px" height="h-3" />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <SkeletonLine width="60px" height="h-4" />
                  <div className="mt-1">
                    <SkeletonLine width="70px" height="h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SkeletonCard>
      </motion.div>
    </>
  );

  const SendMoneySkeleton = () => (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <SkeletonLine width="200px" height="h-8" />
        <div className="mt-2">
          <SkeletonLine width="300px" height="h-4" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkeletonCard>
          <SkeletonLine width="150px" height="h-6" />
          <div className="mt-6 space-y-4">
            <div>
              <SkeletonLine width="100px" height="h-4" />
              <div className="mt-2">
                <SkeletonLine width="100%" height="h-12" />
              </div>
            </div>
            <div>
              <SkeletonLine width="80px" height="h-4" />
              <div className="mt-2">
                <SkeletonLine width="100%" height="h-12" />
              </div>
            </div>
            <div>
              <SkeletonLine width="120px" height="h-4" />
              <div className="mt-2">
                <SkeletonLine width="100%" height="h-24" />
              </div>
            </div>
            <SkeletonLine width="100%" height="h-12" />
          </div>
        </SkeletonCard>

        <SkeletonCard>
          <SkeletonLine width="120px" height="h-6" />
          <div className="mt-6 space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <SkeletonCircle size="w-10 h-10" />
                  <div>
                    <SkeletonLine width="100px" height="h-4" />
                    <div className="mt-1">
                      <SkeletonLine width="80px" height="h-3" />
                    </div>
                  </div>
                </div>
                <SkeletonLine width="60px" height="h-8" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </>
  );

  const TransactionHistorySkeleton = () => (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <SkeletonLine width="250px" height="h-8" />
        <div className="mt-2">
          <SkeletonLine width="350px" height="h-4" />
        </div>
      </motion.div>

      <SkeletonCard className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <SkeletonLine width="120px" height="h-10" />
            <SkeletonLine width="100px" height="h-10" />
          </div>
          <div className="flex items-center space-x-3">
            <SkeletonLine width="150px" height="h-10" />
            <SkeletonLine width="120px" height="h-10" />
            <SkeletonLine width="100px" height="h-10" />
          </div>
        </div>
      </SkeletonCard>

      <SkeletonCard>
        <div className="space-y-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <SkeletonCircle size="w-12 h-12" />
                <div>
                  <SkeletonLine width="150px" height="h-5" />
                  <div className="mt-1">
                    <SkeletonLine width="100px" height="h-3" />
                  </div>
                  <div className="mt-1">
                    <SkeletonLine width="80px" height="h-3" />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <SkeletonLine width="80px" height="h-5" />
                <div className="mt-1">
                  <SkeletonLine width="60px" height="h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
    </>
  );

  const AnalyticsSkeleton = () => (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <SkeletonLine width="200px" height="h-8" />
        <div className="mt-2">
          <SkeletonLine width="400px" height="h-4" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <SkeletonCard key={index}>
            <div className="flex items-center justify-between mb-4">
              <SkeletonCircle />
              <SkeletonLine width="60px" height="h-4" />
            </div>
            <SkeletonLine width="80px" height="h-8" />
            <div className="mt-2">
              <SkeletonLine width="100px" height="h-4" />
            </div>
          </SkeletonCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkeletonCard>
          <SkeletonLine width="150px" height="h-6" />
          <div className="mt-6">
            <SkeletonLine width="100%" height="h-64" />
          </div>
        </SkeletonCard>

        <SkeletonCard>
          <SkeletonLine width="180px" height="h-6" />
          <div className="mt-6">
            <SkeletonLine width="100%" height="h-64" />
          </div>
        </SkeletonCard>
      </div>
    </>
  );

  const AIAssistantSkeleton = () => (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <SkeletonLine width="220px" height="h-8" />
        <div className="mt-2">
          <SkeletonLine width="450px" height="h-4" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <SkeletonCard>
            <SkeletonLine width="150px" height="h-6" />
            <div className="mt-6 space-y-3">
              {[...Array(6)].map((_, index) => (
                <SkeletonLine key={index} width="100%" height="h-10" />
              ))}
            </div>
          </SkeletonCard>
        </div>

        <div className="lg:col-span-2">
          <SkeletonCard>
            <SkeletonLine width="120px" height="h-6" />
            <div className="mt-6 space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg">
                  <SkeletonLine width="200px" height="h-4" />
                  <div className="mt-2">
                    <SkeletonLine width="100%" height="h-3" />
                    <SkeletonLine width="80%" height="h-3" />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>
      </div>
    </>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'send-money':
        return <SendMoneySkeleton />;
      case 'transaction-history':
        return <TransactionHistorySkeleton />;
      case 'analytics':
        return <AnalyticsSkeleton />;
      case 'ai-assistant':
        return <AIAssistantSkeleton />;
      default:
        return <DashboardSkeleton />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="pt-4 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderSkeleton()}
        </div>
      </div>
    </div>
  );
};
export default PageSkeleton;
