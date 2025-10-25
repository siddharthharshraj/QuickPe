/**
 * Savings Goal Component
 * Helps users track savings goals and progress
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export const SavingsGoal = ({ balance, netFlow, savingsRate }) => {
  // Calculate suggested monthly savings (20% of income or current savings rate)
  const suggestedSavingsRate = Math.max(20, savingsRate);
  const currentSavings = balance;
  
  // Example goal: Save 100,000 in 6 months
  const savingsGoal = 100000;
  const progress = (currentSavings / savingsGoal) * 100;
  const remaining = Math.max(0, savingsGoal - currentSavings);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 shadow-sm border border-emerald-200"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Savings Goal</h3>
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
          <TrophyIcon className="h-5 w-5 text-emerald-600" />
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-2xl font-bold text-emerald-600">
              ₹{currentSavings.toLocaleString()}
            </p>
            <p className="text-sm text-slate-600">Current Savings</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-slate-900">
              ₹{savingsGoal.toLocaleString()}
            </p>
            <p className="text-sm text-slate-600">Goal</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-emerald-100 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ delay: 0.9, duration: 1 }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
          />
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-slate-600">
            {progress.toFixed(1)}% Complete
          </p>
          <p className="text-sm font-medium text-emerald-600">
            ₹{remaining.toLocaleString()} to go
          </p>
        </div>
      </div>
      
      {/* Savings Rate */}
      <div className="bg-white rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-slate-900">Savings Rate</span>
          </div>
          <span className="text-lg font-bold text-emerald-600">
            {savingsRate.toFixed(1)}%
          </span>
        </div>
        
        {savingsRate < 20 && (
          <p className="text-xs text-slate-600 mt-2">
            💡 Try to save at least 20% of your income for better financial health
          </p>
        )}
        
        {savingsRate >= 20 && savingsRate < 30 && (
          <p className="text-xs text-emerald-600 mt-2">
            ✨ Good job! You're saving well. Try to reach 30% for excellent savings
          </p>
        )}
        
        {savingsRate >= 30 && (
          <p className="text-xs text-emerald-600 mt-2">
            🎉 Excellent! You're saving {savingsRate.toFixed(1)}% - Keep it up!
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default SavingsGoal;
