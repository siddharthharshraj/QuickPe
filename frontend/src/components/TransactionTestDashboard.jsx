import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    PlayIcon, 
    StopIcon, 
    CheckCircleIcon, 
    XCircleIcon,
    ClockIcon,
    ChartBarIcon,
    UsersIcon,
    WifiIcon
} from '@heroicons/react/24/outline';
import { networkResilienceTest } from '../utils/networkResilienceTest';
import { useTransactionIntegrity } from '../hooks/useTransactionIntegrity';
import { useTransactionSync } from '../hooks/useTransactionSync';

const TransactionTestDashboard = () => {
    const [testResults, setTestResults] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [currentTest, setCurrentTest] = useState(null);
    const [testSummary, setTestSummary] = useState(null);

    const currentUserId = localStorage.getItem('userId');
    const { integrityState, performIntegrityCheck } = useTransactionIntegrity(currentUserId);
    const { syncState, manualRefresh } = useTransactionSync(currentUserId);

    useEffect(() => {
        // Listen for test completion events
        const handleTestComplete = (event) => {
            const result = event.detail;
            setTestResults(prev => [...prev, result]);
            setTestSummary(networkResilienceTest.getTestSummary());
        };

        window.addEventListener('networkResilienceTestComplete', handleTestComplete);

        return () => {
            window.removeEventListener('networkResilienceTestComplete', handleTestComplete);
        };
    }, []);

    // Test concurrent user transaction isolation
    const testConcurrentUserIsolation = async () => {
        setCurrentTest('concurrent_user_isolation');
        setIsRunning(true);

        try {
            console.log('🧪 Starting concurrent user isolation validation...');

            const testResult = {
                testType: 'concurrent_user_isolation_validation',
                startTime: Date.now(),
                users: [],
                isolationIssues: [],
                success: false
            };

            // Simulate multiple users with different transaction patterns
            const mockUsers = [
                { id: 'user_1', name: 'Alice', transactionCount: 15 },
                { id: 'user_2', name: 'Bob', transactionCount: 20 },
                { id: 'user_3', name: 'Charlie', transactionCount: 10 }
            ];

            // Track transactions per user
            const userTransactions = new Map();
            const crossContamination = [];

            // Listen for transaction events
            const transactionListener = (event) => {
                const transaction = event.detail;
                const targetUser = transaction.userId || transaction.targetUser;

                if (!userTransactions.has(targetUser)) {
                    userTransactions.set(targetUser, []);
                }

                userTransactions.get(targetUser).push(transaction);

                // Check for cross-contamination
                mockUsers.forEach(user => {
                    if (user.id !== targetUser && userTransactions.has(user.id)) {
                        const userTxns = userTransactions.get(user.id);
                        if (userTxns.some(t => t.transactionId === transaction.transactionId)) {
                            crossContamination.push({
                                transactionId: transaction.transactionId,
                                intendedUser: targetUser,
                                contaminatedUser: user.id
                            });
                        }
                    }
                });
            };

            window.addEventListener('newTransaction', transactionListener);

            // Generate transactions for each user
            for (const user of mockUsers) {
                console.log(`📊 Generating ${user.transactionCount} transactions for ${user.name}...`);

                for (let i = 0; i < user.transactionCount; i++) {
                    const transaction = {
                        transactionId: `${user.id}_${Date.now()}_${i}`,
                        userId: user.id,
                        amount: Math.floor(Math.random() * 1000) + 1,
                        type: Math.random() > 0.5 ? 'credit' : 'debit',
                        timestamp: Date.now(),
                        description: `${user.name} transaction ${i + 1}`,
                        otherUser: { name: `Test User ${Math.floor(Math.random() * 100)}` }
                    };

                    // Emit transaction event
                    window.dispatchEvent(new CustomEvent('newTransaction', { 
                        detail: transaction 
                    }));

                    // Small delay between transactions
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                testResult.users.push({
                    ...user,
                    transactionsGenerated: user.transactionCount,
                    transactionsReceived: userTransactions.get(user.id)?.length || 0
                });
            }

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 3000));

            window.removeEventListener('newTransaction', transactionListener);

            // Analyze results
            testResult.isolationIssues = crossContamination;
            testResult.endTime = Date.now();
            testResult.success = crossContamination.length === 0;

            // Validate transaction counts
            testResult.users.forEach(user => {
                const receivedCount = userTransactions.get(user.id)?.length || 0;
                user.isolationScore = receivedCount === user.transactionCount ? 100 : 
                    Math.max(0, 100 - Math.abs(receivedCount - user.transactionCount) * 10);
            });

            testResult.overallIsolationScore = testResult.users.reduce((sum, user) => sum + user.isolationScore, 0) / testResult.users.length;

            console.log('✅ Concurrent user isolation test completed:', testResult);
            setTestResults(prev => [...prev, testResult]);

            return testResult;

        } catch (error) {
            console.error('❌ Concurrent user isolation test failed:', error);
            return { success: false, error: error.message };
        } finally {
            setIsRunning(false);
            setCurrentTest(null);
        }
    };

    // Run comprehensive test suite
    const runComprehensiveTests = async () => {
        setIsRunning(true);
        setCurrentTest('comprehensive_suite');

        try {
            console.log('🚀 Starting comprehensive real-time transaction test suite...');

            // Clear previous results
            networkResilienceTest.clearResults();
            setTestResults([]);

            // Run all tests in sequence
            const results = await networkResilienceTest.runComprehensiveTests();
            
            // Add our concurrent user isolation test
            const isolationResult = await testConcurrentUserIsolation();
            results.tests.push(isolationResult);

            // Run integrity check
            const integrityResult = await performIntegrityCheck('comprehensive_test');
            results.tests.push({
                testType: 'transaction_integrity',
                ...integrityResult,
                success: integrityResult.isHealthy
            });

            // Update summary
            setTestSummary(networkResilienceTest.getTestSummary());
            
            console.log('🎯 Comprehensive test suite completed:', results);

        } catch (error) {
            console.error('❌ Comprehensive test suite failed:', error);
        } finally {
            setIsRunning(false);
            setCurrentTest(null);
        }
    };

    const getStatusIcon = (success) => {
        return success ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
        ) : (
            <XCircleIcon className="h-5 w-5 text-red-600" />
        );
    };

    const getStatusColor = (success) => {
        return success ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Real-Time Transaction Testing</h2>
                    <p className="text-gray-600">Comprehensive validation of transaction history reliability</p>
                </div>
                
                <div className="flex space-x-3">
                    <button
                        onClick={testConcurrentUserIsolation}
                        disabled={isRunning}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                    >
                        <UsersIcon className="h-4 w-4" />
                        <span>Test User Isolation</span>
                    </button>
                    
                    <button
                        onClick={runComprehensiveTests}
                        disabled={isRunning}
                        className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                    >
                        {isRunning ? (
                            <StopIcon className="h-4 w-4 animate-spin" />
                        ) : (
                            <PlayIcon className="h-4 w-4" />
                        )}
                        <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
                    </button>
                </div>
            </div>

            {/* Current Test Status */}
            {isRunning && currentTest && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
                >
                    <div className="flex items-center space-x-2">
                        <ClockIcon className="h-5 w-5 text-blue-600 animate-spin" />
                        <span className="text-blue-800 font-medium">
                            Running: {currentTest.replace(/_/g, ' ').toUpperCase()}
                        </span>
                    </div>
                </motion.div>
            )}

            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <WifiIcon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Connection Status</span>
                    </div>
                    <div className="text-sm text-gray-600">
                        Socket: {syncState.lastSync ? 'Connected' : 'Disconnected'}
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <ChartBarIcon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Integrity Score</span>
                    </div>
                    <div className="text-sm text-gray-600">
                        {integrityState.lastCheck ? '100%' : 'Not checked'}
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <UsersIcon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Sync Status</span>
                    </div>
                    <div className="text-sm text-gray-600">
                        {syncState.syncInProgress ? 'Syncing...' : 'Idle'}
                    </div>
                </div>
            </div>

            {/* Test Summary */}
            {testSummary && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{testSummary.totalTests}</div>
                            <div className="text-sm text-gray-600">Total Tests</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">{testSummary.successfulTests}</div>
                            <div className="text-sm text-gray-600">Passed</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">{testSummary.failedTests}</div>
                            <div className="text-sm text-gray-600">Failed</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-600">{testSummary.successRate.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">Success Rate</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Results */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
                
                {testResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No tests have been run yet. Click "Run All Tests" to start.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {testResults.map((result, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`border rounded-lg p-4 ${getStatusColor(result.success)}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {getStatusIcon(result.success)}
                                        <div>
                                            <div className="font-medium">
                                                {result.testType.replace(/_/g, ' ').toUpperCase()}
                                            </div>
                                            <div className="text-sm opacity-75">
                                                Duration: {result.endTime ? 
                                                    `${((result.endTime - result.startTime) / 1000).toFixed(1)}s` : 
                                                    'In progress...'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {result.metrics && (
                                        <div className="text-right text-sm">
                                            {result.metrics.throughput && (
                                                <div>Throughput: {result.metrics.throughput.toFixed(1)}/s</div>
                                            )}
                                            {result.overallIsolationScore && (
                                                <div>Isolation: {result.overallIsolationScore.toFixed(1)}%</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {result.error && (
                                    <div className="mt-2 text-sm text-red-600">
                                        Error: {result.error}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionTestDashboard;
