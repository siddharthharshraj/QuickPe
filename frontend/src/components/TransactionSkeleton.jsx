import React from 'react';
import { motion } from 'framer-motion';

export const TransactionSkeleton = () => {
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

  const SkeletonRow = ({ delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white rounded-lg p-4 mb-3 border border-slate-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Avatar skeleton */}
          <motion.div
            className="w-12 h-12 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-full"
            style={{
              backgroundSize: '200% 100%',
            }}
            animate={shimmer.animate}
            transition={shimmer.transition}
          />
          
          <div className="flex-1">
            {/* Title skeleton */}
            <motion.div
              className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded mb-2"
              style={{
                backgroundSize: '200% 100%',
                width: '60%',
              }}
              animate={shimmer.animate}
              transition={shimmer.transition}
            />
            
            {/* Subtitle skeleton */}
            <motion.div
              className="h-3 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded"
              style={{
                backgroundSize: '200% 100%',
                width: '40%',
              }}
              animate={shimmer.animate}
              transition={shimmer.transition}
            />
          </div>
        </div>
        
        <div className="text-right">
          {/* Amount skeleton */}
          <motion.div
            className="h-5 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded mb-1"
            style={{
              backgroundSize: '200% 100%',
              width: '80px',
            }}
            animate={shimmer.animate}
            transition={shimmer.transition}
          />
          
          {/* Date skeleton */}
          <motion.div
            className="h-3 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded"
            style={{
              backgroundSize: '200% 100%',
              width: '60px',
            }}
            animate={shimmer.animate}
            transition={shimmer.transition}
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <motion.div
            className="h-6 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded"
            style={{
              backgroundSize: '200% 100%',
              width: '200px',
            }}
            animate={shimmer.animate}
            transition={shimmer.transition}
          />
        </div>
        <motion.div
          className="h-8 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded"
          style={{
            backgroundSize: '200% 100%',
            width: '120px',
          }}
          animate={shimmer.animate}
          transition={shimmer.transition}
        />
      </div>

      {/* Table header skeleton */}
      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-4 gap-4">
          {['Transaction', 'Amount', 'Date', 'Status'].map((_, index) => (
            <motion.div
              key={index}
              className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded"
              style={{
                backgroundSize: '200% 100%',
              }}
              animate={shimmer.animate}
              transition={{ ...shimmer.transition, delay: index * 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Transaction rows skeleton */}
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeletonRow key={index} delay={index * 0.1} />
      ))}

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
        <motion.div
          className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded"
          style={{
            backgroundSize: '200% 100%',
            width: '150px',
          }}
          animate={shimmer.animate}
          transition={shimmer.transition}
        />
        
        <div className="flex items-center space-x-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <motion.div
              key={index}
              className="w-8 h-8 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded"
              style={{
                backgroundSize: '200% 100%',
              }}
              animate={shimmer.animate}
              transition={{ ...shimmer.transition, delay: index * 0.05 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransactionSkeleton;
