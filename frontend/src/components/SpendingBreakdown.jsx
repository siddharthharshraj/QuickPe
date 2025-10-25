/**
 * Spending Breakdown Component
 * Shows detailed category-wise spending analysis
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBagIcon,
  TruckIcon,
  FilmIcon,
  HomeIcon,
  HeartIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

const categoryIcons = {
  'Food & Dining': ShoppingBagIcon,
  'Transportation': TruckIcon,
  'Entertainment': FilmIcon,
  'Utilities': HomeIcon,
  'Healthcare': HeartIcon,
  'Transfer': ArrowsRightLeftIcon,
  'Shopping': ShoppingBagIcon
};

const categoryColors = {
  'Food & Dining': 'bg-orange-100 text-orange-600',
  'Transportation': 'bg-blue-100 text-blue-600',
  'Entertainment': 'bg-purple-100 text-purple-600',
  'Utilities': 'bg-green-100 text-green-600',
  'Healthcare': 'bg-red-100 text-red-600',
  'Transfer': 'bg-indigo-100 text-indigo-600',
  'Shopping': 'bg-pink-100 text-pink-600'
};

export const SpendingBreakdown = ({ categories }) => {
  if (!categories || Object.keys(categories).length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Spending by Category</h3>
      
      <div className="space-y-4">
        {Object.entries(categories).map(([category, data], index) => {
          const Icon = categoryIcons[category] || ShoppingBagIcon;
          const colorClass = categoryColors[category] || 'bg-gray-100 text-gray-600';
          
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{category}</p>
                  <p className="text-xs text-slate-500">{data.count} transactions</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  ₹{data.total.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">{data.percentage.toFixed(1)}%</p>
              </div>
              
              {/* Progress bar */}
              <div className="ml-4 w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.percentage}%` }}
                  transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                  className={`h-full ${colorClass.split(' ')[0]}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SpendingBreakdown;
