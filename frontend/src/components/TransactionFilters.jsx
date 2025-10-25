import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  TagIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';

export const TransactionFilters = ({ 
  filters, 
  onFilterChange, 
  showAdvanced, 
  onToggleAdvanced,
  onClearFilters 
}) => {
  
  const handleInputChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = () => {
    return filters.typeFilter !== 'all' ||
           filters.categoryFilter !== 'all' ||
           filters.dateFilter !== 'all' ||
           filters.startDate ||
           filters.endDate ||
           filters.minAmount ||
           filters.maxAmount ||
           filters.searchTerm;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      {/* Basic Filters */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-emerald-600" />
          <span>Filters</span>
          {hasActiveFilters() && (
            <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
              Active
            </span>
          )}
        </h3>
        
        <div className="flex items-center space-x-3">
          {hasActiveFilters() && (
            <button
              onClick={onClearFilters}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          )}
          
          <button
            onClick={onToggleAdvanced}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
          </button>
        </div>
      </div>

      {/* Quick Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
            <ArrowsUpDownIcon className="h-4 w-4" />
            <span>Type</span>
          </label>
          <select
            value={filters.typeFilter}
            onChange={(e) => handleInputChange('typeFilter', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="credit">Credit (Received)</option>
            <option value="debit">Debit (Sent)</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
            <TagIcon className="h-4 w-4" />
            <span>Category</span>
          </label>
          <select
            value={filters.categoryFilter}
            onChange={(e) => handleInputChange('categoryFilter', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="Transfer">Transfer</option>
            <option value="Deposit">Deposit</option>
            <option value="Food & Dining">Food & Dining</option>
            <option value="Transportation">Transportation</option>
            <option value="Shopping">Shopping</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Utilities">Utilities</option>
            <option value="Healthcare">Healthcare</option>
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
            <CalendarIcon className="h-4 w-4" />
            <span>Date Range</span>
          </label>
          <select
            value={filters.dateFilter}
            onChange={(e) => handleInputChange('dateFilter', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Advanced Filters</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Custom Date Range */}
                {filters.dateFilter === 'custom' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">From</label>
                        <input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">To</label>
                        <input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => handleInputChange('endDate', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount Range */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                    <CurrencyRupeeIcon className="h-4 w-4" />
                    <span>Amount Range</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Min Amount (₹)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={filters.minAmount}
                        onChange={(e) => handleInputChange('minAmount', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max Amount (₹)</label>
                      <input
                        type="number"
                        placeholder="No limit"
                        value={filters.maxAmount}
                        onChange={(e) => handleInputChange('maxAmount', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Transactions
                  </label>
                  <input
                    type="text"
                    placeholder="Search by description or transaction ID..."
                    value={filters.searchTerm}
                    onChange={(e) => handleInputChange('searchTerm', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            
            {filters.typeFilter !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center space-x-1">
                <span>Type: {filters.typeFilter}</span>
                <button onClick={() => handleInputChange('typeFilter', 'all')} className="ml-1 hover:text-blue-900">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.categoryFilter !== 'all' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full flex items-center space-x-1">
                <span>Category: {filters.categoryFilter}</span>
                <button onClick={() => handleInputChange('categoryFilter', 'all')} className="ml-1 hover:text-purple-900">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.dateFilter !== 'all' && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full flex items-center space-x-1">
                <span>Date: {filters.dateFilter}</span>
                <button onClick={() => handleInputChange('dateFilter', 'all')} className="ml-1 hover:text-green-900">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {(filters.minAmount || filters.maxAmount) && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full flex items-center space-x-1">
                <span>
                  Amount: {filters.minAmount ? `₹${filters.minAmount}` : '₹0'} - {filters.maxAmount ? `₹${filters.maxAmount}` : '∞'}
                </span>
                <button 
                  onClick={() => {
                    handleInputChange('minAmount', '');
                    handleInputChange('maxAmount', '');
                  }} 
                  className="ml-1 hover:text-yellow-900"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.searchTerm && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center space-x-1">
                <span>Search: "{filters.searchTerm}"</span>
                <button onClick={() => handleInputChange('searchTerm', '')} className="ml-1 hover:text-gray-900">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFilters;
