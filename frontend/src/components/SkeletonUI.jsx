import React from 'react';
import { motion } from 'framer-motion';

export const SkeletonUI = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
      {/* No header skeleton - header should remain visible */}
      
      <div className="flex-1 pt-4 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section Skeleton */}
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

          {/* Stats Grid Skeleton */}
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
            {/* Balance Card Skeleton */}
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

            {/* Quick Actions Skeleton */}
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

          {/* Recent Activity Skeleton */}
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
        </div>
      </div>
      
      {/* Footer Skeleton */}
      <div className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <SkeletonLine width="100px" height="h-5" />
                <div className="mt-4 space-y-2">
                  <SkeletonLine width="80px" height="h-4" />
                  <SkeletonLine width="90px" height="h-4" />
                  <SkeletonLine width="70px" height="h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SkeletonUI;
