import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  CurrencyRupeeIcon, 
  MagnifyingGlassIcon,
  UserIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import apiClient from '../services/api/client';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const RequestMoney = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [searching, setSearching] = useState(false);

  // Search users
  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await apiClient.get(`/user/search?query=${encodeURIComponent(query)}`);
      
      if (response.data && response.data.success) {
        setSearchResults(response.data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle request submission
  const handleRequestMoney = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiClient.post('/account/request', {
        toUserId: selectedUser._id,
        toQuickpeId: selectedUser.quickpeId,
        amount: parseFloat(amount),
        description: description || `Payment request from ${selectedUser.fullName}`
      });

      if (response.data && response.data.success) {
        toast.success(`Request sent to ${selectedUser.fullName}!`);
        
        // Reset form
        setSelectedUser(null);
        setAmount('');
        setDescription('');
        setSearchQuery('');
        setSearchResults([]);
        
        // Navigate to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error requesting money:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send request';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                <CurrencyRupeeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Request Money</h1>
                <p className="text-slate-600">Request payment from other QuickPe users</p>
              </div>
            </div>
          </motion.div>

          {/* Request Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6"
          >
            <form onSubmit={handleRequestMoney} className="space-y-6">
              {/* Search User */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Search User
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or QuickPe ID"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={loading}
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && !selectedUser && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="w-full px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                      >
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-slate-900">{user.fullName}</p>
                          <p className="text-sm text-slate-500">{user.quickpeId}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searching && (
                  <p className="mt-2 text-sm text-slate-500">Searching...</p>
                )}
              </div>

              {/* Selected User */}
              {selectedUser && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-emerald-50 rounded-lg border border-emerald-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{selectedUser.fullName}</p>
                        <p className="text-sm text-slate-600">{selectedUser.quickpeId}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Change
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount (₹)
                </label>
                <div className="relative">
                  <CurrencyRupeeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this request for?"
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !selectedUser || !amount}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
                <span>{loading ? 'Sending Request...' : 'Send Request'}</span>
              </button>
            </form>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The recipient will receive a notification and can choose to accept or decline your request.
            </p>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RequestMoney;
