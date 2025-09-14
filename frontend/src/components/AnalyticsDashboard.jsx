import { useState, useEffect } from "react";
import apiClient from "../services/api/client";

export const AnalyticsDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [categoryData, setCategoryData] = useState(null);
    const [quickpeStats, setQuickpeStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [timeRange, setTimeRange] = useState('30'); // days
    const [groupBy, setGroupBy] = useState('day');

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - parseInt(timeRange));
            
            const params = new URLSearchParams({
                from: fromDate.toISOString(),
                to: new Date().toISOString(),
                group_by: groupBy
            });

            // Fetch transaction analytics
            const analyticsResponse = await apiClient.get(`/analytics/transactions?${params}`);
            if (analyticsResponse.data) {
                setAnalytics(analyticsResponse.data);
            }

            // Fetch category analytics
            const categoryParams = new URLSearchParams({
                from: fromDate.toISOString(),
                to: new Date().toISOString()
            });
            const categoryResponse = await apiClient.get(`/analytics/categories?${categoryParams}`);
            if (categoryResponse.data) {
                setCategoryData(categoryResponse.data);
            }

            // Fetch QuickPe stats
            const quickpeResponse = await apiClient.get(`/analytics/quickpe-stats?${categoryParams}`);
            if (quickpeResponse.data) {
                setQuickpeStats(quickpeResponse.data);
            }

        } catch (err) {
            setError("Failed to fetch analytics data");
            console.error("Analytics fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange, groupBy]);

    const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const getTimeRangeLabel = () => {
        const labels = {
            '7': 'Last 7 days',
            '30': 'Last 30 days',
            '90': 'Last 3 months',
            '365': 'Last year'
        };
        return labels[timeRange] || 'Custom range';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 3 months</option>
                            <option value="365">Last year</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="day">Daily</option>
                            <option value="week">Weekly</option>
                            <option value="month">Monthly</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="text-3xl mr-4">💸</div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Sent</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatCurrency(analytics.summary.total_sent)}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {analytics.summary.total_transactions_sent} transactions
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="text-3xl mr-4">💰</div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Received</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(analytics.summary.total_received)}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {analytics.summary.total_transactions_received} transactions
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="text-3xl mr-4">📊</div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Net Flow</p>
                                <p className={`text-2xl font-bold ${
                                    analytics.summary.net_flow >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {formatCurrency(analytics.summary.net_flow)}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {analytics.summary.total_transactions} total transactions
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="text-3xl mr-4">🏦</div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Current Balance</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(analytics.summary.current_balance)}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {getTimeRangeLabel()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* QuickPe Adoption Stats */}
            {quickpeStats && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">QuickPe Adoption</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-3xl mb-2">⚡</div>
                            <p className="text-2xl font-bold text-purple-600">{quickpeStats.quickpe_transfers}</p>
                            <p className="text-sm text-gray-500">QuickPe Transfers</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl mb-2">📱</div>
                            <p className="text-2xl font-bold text-gray-600">{quickpeStats.regular_transfers}</p>
                            <p className="text-sm text-gray-500">Regular Transfers</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl mb-2">📈</div>
                            <p className="text-2xl font-bold text-green-600">{quickpeStats.quickpe_adoption_rate}%</p>
                            <p className="text-sm text-gray-500">Adoption Rate</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Timeline */}
            {analytics && analytics.analytics.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Timeline</h3>
                    <div className="space-y-4">
                        {analytics.analytics.map((period, index) => (
                            <div key={period.period} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{period.period}</p>
                                    <p className="text-sm text-gray-500">
                                        {period.total_transactions} transactions
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex space-x-4">
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-red-600">
                                                -{formatCurrency(period.money_sent)}
                                            </p>
                                            <p className="text-xs text-gray-400">Sent</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-green-600">
                                                +{formatCurrency(period.money_received)}
                                            </p>
                                            <p className="text-xs text-gray-400">Received</p>
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-sm font-medium ${
                                                period.net_flow >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {period.net_flow >= 0 ? '+' : ''}{formatCurrency(period.net_flow)}
                                            </p>
                                            <p className="text-xs text-gray-400">Net</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Category Breakdown */}
            {categoryData && categoryData.categories.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
                    <div className="space-y-4">
                        {categoryData.categories.map((category, index) => (
                            <div key={category.category || 'uncategorized'} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-4 h-4 rounded-full" style={{
                                        backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
                                    }}></div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {category.category || 'Uncategorized'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {category.transaction_count} transactions
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-900">
                                        {formatCurrency(category.total_amount)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {category.percentage}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <p className="font-medium text-gray-900">Total Spending</p>
                            <p className="font-bold text-lg text-gray-900">
                                {formatCurrency(categoryData.summary.total_spent)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default AnalyticsDashboard;
