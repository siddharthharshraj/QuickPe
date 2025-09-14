import { useState, useEffect } from "react";
import apiClient from "../services/api/client";

export const AIAutoCategorization = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categorizing, setCategorizing] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [budgetSuggestions, setBudgetSuggestions] = useState([]);

    const categories = [
        'food_dining',
        'transportation',
        'shopping',
        'entertainment',
        'utilities',
        'healthcare',
        'education',
        'travel',
        'groceries',
        'fuel',
        'other'
    ];

    const categoryIcons = {
        'food_dining': '🍽️',
        'transportation': '🚗',
        'shopping': '🛍️',
        'entertainment': '🎬',
        'utilities': '💡',
        'healthcare': '🏥',
        'education': '📚',
        'travel': '✈️',
        'groceries': '🛒',
        'fuel': '⛽',
        'other': '📋'
    };

    const fetchUncategorizedTransactions = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/account/transactions?type=sent&limit=50');
            if (response.data && response.data.transactions) {
                const uncategorized = response.data.transactions.filter(t => 
                    !t.category || t.category === 'other'
                );
                setTransactions(uncategorized);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateAISuggestions = async () => {
        setCategorizing(true);
        try {
            // Simulate AI categorization logic
            const aiSuggestions = transactions.map(transaction => {
                const description = transaction.description?.toLowerCase() || '';
                const otherUserName = transaction.otherUser?.name?.toLowerCase() || '';
                const amount = transaction.amount;

                let suggestedCategory = 'other';
                let confidence = 0.5;

                // Simple rule-based categorization (simulating AI)
                if (description.includes('food') || description.includes('restaurant') || 
                    otherUserName.includes('restaurant') || otherUserName.includes('cafe')) {
                    suggestedCategory = 'food_dining';
                    confidence = 0.85;
                } else if (description.includes('uber') || description.includes('taxi') || 
                          description.includes('transport') || otherUserName.includes('driver')) {
                    suggestedCategory = 'transportation';
                    confidence = 0.9;
                } else if (description.includes('shop') || description.includes('store') || 
                          amount > 1000) {
                    suggestedCategory = 'shopping';
                    confidence = 0.7;
                } else if (description.includes('movie') || description.includes('game') || 
                          description.includes('entertainment')) {
                    suggestedCategory = 'entertainment';
                    confidence = 0.8;
                } else if (description.includes('electric') || description.includes('water') || 
                          description.includes('internet') || description.includes('bill')) {
                    suggestedCategory = 'utilities';
                    confidence = 0.85;
                } else if (description.includes('medical') || description.includes('doctor') || 
                          description.includes('pharmacy')) {
                    suggestedCategory = 'healthcare';
                    confidence = 0.9;
                } else if (amount < 100) {
                    suggestedCategory = 'groceries';
                    confidence = 0.6;
                } else if (amount > 5000) {
                    suggestedCategory = 'travel';
                    confidence = 0.65;
                }

                return {
                    transactionId: transaction._id,
                    currentCategory: transaction.category || 'other',
                    suggestedCategory,
                    confidence,
                    reason: `Based on transaction details and amount pattern`
                };
            });

            setSuggestions(aiSuggestions);
            generateBudgetSuggestions(aiSuggestions);
        } catch (error) {
            console.error('AI categorization failed:', error);
        } finally {
            setCategorizing(false);
        }
    };

    const generateBudgetSuggestions = (categorizedData) => {
        const categorySpending = {};
        
        transactions.forEach((transaction, index) => {
            const suggestion = categorizedData[index];
            const category = suggestion.suggestedCategory;
            
            if (!categorySpending[category]) {
                categorySpending[category] = 0;
            }
            categorySpending[category] += transaction.amount;
        });

        const budgetSuggestions = Object.entries(categorySpending).map(([category, spent]) => {
            let suggestedBudget = Math.ceil(spent * 1.2); // 20% buffer
            let priority = 'medium';
            let advice = '';

            if (category === 'food_dining' && spent > 5000) {
                priority = 'high';
                advice = 'Consider cooking more meals at home to reduce dining expenses';
                suggestedBudget = Math.ceil(spent * 0.8);
            } else if (category === 'entertainment' && spent > 3000) {
                priority = 'medium';
                advice = 'Look for free or low-cost entertainment alternatives';
                suggestedBudget = Math.ceil(spent * 0.9);
            } else if (category === 'transportation' && spent > 2000) {
                priority = 'high';
                advice = 'Consider using public transport or carpooling';
            } else if (category === 'shopping' && spent > 10000) {
                priority = 'high';
                advice = 'Review shopping habits and focus on essential purchases';
                suggestedBudget = Math.ceil(spent * 0.7);
            }

            return {
                category,
                currentSpending: spent,
                suggestedBudget,
                priority,
                advice,
                savings: spent - suggestedBudget
            };
        }).filter(suggestion => suggestion.currentSpending > 0);

        setBudgetSuggestions(budgetSuggestions);
    };

    const applyCategorization = async (transactionId, category) => {
        try {
            // In a real implementation, this would call an API to update the transaction
            console.log(`Applying category ${category} to transaction ${transactionId}`);
            
            // Update local state
            setSuggestions(prev => prev.filter(s => s.transactionId !== transactionId));
            setTransactions(prev => prev.filter(t => t._id !== transactionId));
        } catch (error) {
            console.error('Failed to apply categorization:', error);
        }
    };

    const applyAllSuggestions = async () => {
        try {
            for (const suggestion of suggestions) {
                await applyCategorization(suggestion.transactionId, suggestion.suggestedCategory);
            }
        } catch (error) {
            console.error('Failed to apply all suggestions:', error);
        }
    };

    useEffect(() => {
        fetchUncategorizedTransactions();
    }, []);

    const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'text-green-600 bg-green-50';
        if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'high': 'text-red-600 bg-red-50 border-red-200',
            'medium': 'text-yellow-600 bg-yellow-50 border-yellow-200',
            'low': 'text-green-600 bg-green-50 border-green-200'
        };
        return colors[priority] || colors.medium;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">AI Auto-Categorization</h2>
                        <p className="text-gray-600 mt-1">
                            Smart categorization and budget suggestions powered by AI
                        </p>
                    </div>
                    <div className="text-4xl">🤖</div>
                </div>
                
                <div className="mt-6 flex flex-wrap gap-4">
                    <button
                        onClick={fetchUncategorizedTransactions}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Refresh Transactions'}
                    </button>
                    
                    {transactions.length > 0 && (
                        <button
                            onClick={generateAISuggestions}
                            disabled={categorizing}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            {categorizing ? 'Analyzing...' : '🧠 Generate AI Suggestions'}
                        </button>
                    )}
                    
                    {suggestions.length > 0 && (
                        <button
                            onClick={applyAllSuggestions}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            ✅ Apply All Suggestions
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="text-2xl mr-3">📊</div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Uncategorized</p>
                            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="text-2xl mr-3">🎯</div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">AI Suggestions</p>
                            <p className="text-2xl font-bold text-purple-600">{suggestions.length}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="text-2xl mr-3">💡</div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Budget Tips</p>
                            <p className="text-2xl font-bold text-green-600">{budgetSuggestions.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">AI Categorization Suggestions</h3>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                        {suggestions.map((suggestion, index) => {
                            const transaction = transactions.find(t => t._id === suggestion.transactionId);
                            if (!transaction) return null;
                            
                            return (
                                <div key={suggestion.transactionId} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <div className="text-2xl">
                                                    {categoryIcons[suggestion.suggestedCategory]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        To {transaction.otherUser?.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatCurrency(transaction.amount)} • {new Date(transaction.timestamp).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-4">
                                            <div className="text-center">
                                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                                    {Math.round(suggestion.confidence * 100)}% confident
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Suggest: {suggestion.suggestedCategory.replace('_', ' ')}
                                                </p>
                                            </div>
                                            
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => applyCategorization(suggestion.transactionId, suggestion.suggestedCategory)}
                                                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                                >
                                                    Apply
                                                </button>
                                                <button
                                                    onClick={() => setSuggestions(prev => prev.filter(s => s.transactionId !== suggestion.transactionId))}
                                                    className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                                >
                                                    Skip
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Budget Suggestions */}
            {budgetSuggestions.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Smart Budget Suggestions</h3>
                    </div>
                    
                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {budgetSuggestions.map((suggestion) => (
                                <div key={suggestion.category} className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-2xl">{categoryIcons[suggestion.category]}</span>
                                            <h4 className="font-medium capitalize">
                                                {suggestion.category.replace('_', ' ')}
                                            </h4>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(suggestion.priority)}`}>
                                            {suggestion.priority} priority
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Current Spending:</span>
                                            <span className="font-medium">{formatCurrency(suggestion.currentSpending)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Suggested Budget:</span>
                                            <span className="font-medium text-green-600">{formatCurrency(suggestion.suggestedBudget)}</span>
                                        </div>
                                        {suggestion.savings > 0 && (
                                            <div className="flex justify-between">
                                                <span>Potential Savings:</span>
                                                <span className="font-medium text-green-600">{formatCurrency(suggestion.savings)}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {suggestion.advice && (
                                        <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs">
                                            💡 {suggestion.advice}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && transactions.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-gray-600">
                        All your transactions are properly categorized. Great job managing your finances!
                    </p>
                </div>
            )}
        </div>
    );
};
export default AIAutoCategorization;
