/**
 * Budget Tracker Component
 * Helps users track spending against budget
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export const BudgetTracker = ({ totalSpent, totalIncome }) => {
  // Suggested budget: 50% of income for needs, 30% for wants, 20% for savings
  const suggestedBudget = totalIncome * 0.8; // 80% of income (50% needs + 30% wants)
  const budgetUsed = (totalSpent / suggestedBudget) * 100;
  const remaining = Math.max(0, suggestedBudget - totalSpent);
  
  const isOverBudget = budgetUsed > 100;
  const isNearLimit = budgetUsed > 80 && budgetUsed <= 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className={`rounded-xl p-6 shadow-sm border ${
        isOverBudget 
          ? 'bg-red-50 border-red-200' 
          : isNearLimit 
          ? 'bg-yellow-50 border-yellow-200' 
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Budget Tracker</h3>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isOverBudget 
            ? 'bg-red-100' 
            : isNearLimit 
            ? 'bg-yellow-100' 
            : 'bg-emerald-100'
        }`}>
          {isOverBudget || isNearLimit ? (
            <ExclamationTriangleIcon className={`h-5 w-5 ${
              isOverBudget ? 'text-red-600' : 'text-yellow-600'
            }`} />
          ) : (
            <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Spending vs Budget */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-2xl font-bold text-slate-900">
                ₹{totalSpent.toLocaleString()}
              </p>
              <p className="text-sm text-slate-600">Spent this period</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-slate-900">
                ₹{suggestedBudget.toLocaleString()}
              </p>
              <p className="text-sm text-slate-600">Suggested Budget</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetUsed, 100)}%` }}
              transition={{ delay: 1, duration: 1 }}
              className={`h-full ${
                isOverBudget 
                  ? 'bg-gradient-to-r from-red-500 to-red-600' 
                  : isNearLimit 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-slate-600">
              {budgetUsed.toFixed(1)}% Used
            </p>
            {!isOverBudget && (
              <p className="text-sm font-medium text-emerald-600">
                ₹{remaining.toLocaleString()} remaining
              </p>
            )}
            {isOverBudget && (
              <p className="text-sm font-medium text-red-600">
                ₹{(totalSpent - suggestedBudget).toLocaleString()} over budget
              </p>
            )}
          </div>
        </div>
        
        {/* Status Message */}
        <div className={`rounded-lg p-3 ${
          isOverBudget 
            ? 'bg-red-100' 
            : isNearLimit 
            ? 'bg-yellow-100' 
            : 'bg-emerald-100'
        }`}>
          {isOverBudget && (
            <p className="text-sm text-red-700">
              ⚠️ You've exceeded your budget! Consider reducing expenses.
            </p>
          )}
          {isNearLimit && !isOverBudget && (
            <p className="text-sm text-yellow-700">
              ⚡ You're near your budget limit. Spend wisely!
            </p>
          )}
          {!isNearLimit && !isOverBudget && (
            <p className="text-sm text-emerald-700">
              ✅ Great! You're within budget. Keep it up!
            </p>
          )}
        </div>
        
        {/* 50/30/20 Rule */}
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-700 mb-2">💡 50/30/20 Budget Rule</p>
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>50% Needs (essentials)</span>
              <span className="font-medium">₹{(totalIncome * 0.5).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>30% Wants (lifestyle)</span>
              <span className="font-medium">₹{(totalIncome * 0.3).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>20% Savings (future)</span>
              <span className="font-medium">₹{(totalIncome * 0.2).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BudgetTracker;
