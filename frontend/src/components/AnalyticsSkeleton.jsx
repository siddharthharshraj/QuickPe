import React from 'react';
import { motion } from 'framer-motion';

export const AnalyticsSkeleton = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
            {/* Header Skeleton */}
            <div className="pt-20 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Title Section Skeleton */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gray-300 rounded-xl animate-pulse"></div>
                                <div>
                                    <div className="h-8 bg-gray-300 rounded w-32 mb-2 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="h-10 bg-gray-300 rounded-lg w-32 animate-pulse"></div>
                                <div className="h-10 bg-gray-300 rounded-lg w-24 animate-pulse"></div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Summary Cards Skeleton */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                    >
                        {[...Array(3)].map((_, index) => (
                            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-24 mb-3 animate-pulse"></div>
                                        <div className="h-8 bg-gray-300 rounded w-32 mb-2 animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 rounded w-28 animate-pulse"></div>
                                    </div>
                                    <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Additional Metrics Skeleton */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                    >
                        {[...Array(4)].map((_, index) => (
                            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                                </div>
                                <div className="h-6 bg-gray-300 rounded w-20 mb-1 animate-pulse"></div>
                                <div className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
                                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                            </div>
                        ))}
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Categories Chart Skeleton */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6"
                        >
                            <div className="h-6 bg-gray-300 rounded w-40 mb-6 animate-pulse"></div>
                            <div className="space-y-4">
                                {[...Array(5)].map((_, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
                                            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="w-24 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                                            <div className="text-right">
                                                <div className="h-4 bg-gray-300 rounded w-16 mb-1 animate-pulse"></div>
                                                <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Trends Chart Skeleton */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6"
                        >
                            <div className="h-6 bg-gray-300 rounded w-32 mb-6 animate-pulse"></div>
                            <div className="space-y-4">
                                {[...Array(6)].map((_, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="flex-1 mx-4">
                                            <div className="flex space-x-2">
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse"></div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Insights Skeleton */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6"
                    >
                        <div className="h-6 bg-white/30 rounded w-32 mb-4 animate-pulse"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[...Array(2)].map((_, index) => (
                                <div key={index} className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                                    <div className="h-5 bg-white/30 rounded w-28 mb-2 animate-pulse"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-white/20 rounded w-full animate-pulse"></div>
                                        <div className="h-3 bg-white/20 rounded w-3/4 animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Loading Message */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 text-center"
                    >
                        <div className="inline-flex items-center space-x-2 text-slate-600">
                            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Loading your analytics...</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
export default AnalyticsSkeleton;
