import { useState, useCallback } from 'react';
import apiClient from '../services/api/client';

export const useExportData = () => {
    const [exportState, setExportState] = useState({
        isExporting: false,
        lastExportTime: null,
        exportType: null,
        error: null
    });

    // Fetch fresh data directly from database for exports
    const fetchFreshExportData = useCallback(async (exportType = 'all') => {
        try {
            setExportState(prev => ({ 
                ...prev, 
                isExporting: true, 
                exportType,
                error: null 
            }));

            console.log(`🔄 Fetching fresh data for ${exportType} export...`);

            // Force fresh data fetch with cache-busting parameters
            const timestamp = Date.now();
            const [transactionsResponse, balanceResponse, userResponse] = await Promise.all([
                apiClient.get('/account/transactions', {
                    params: { 
                        fresh: true,
                        timestamp,
                        export: true
                        // Remove limit to get ALL transactions from database
                    },
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                }),
                apiClient.get('/account/balance', {
                    params: { fresh: true, timestamp },
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                }),
                apiClient.get('/user/profile', {
                    params: { fresh: true, timestamp },
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                })
            ]);

            // Validate response data
            if (!transactionsResponse.data?.transactions) {
                throw new Error('Invalid transaction data received from server');
            }

            if (typeof balanceResponse.data?.balance !== 'number') {
                throw new Error('Invalid balance data received from server');
            }

            if (!userResponse.data?.user) {
                throw new Error('Invalid user data received from server');
            }

            const exportData = {
                transactions: transactionsResponse.data.transactions,
                balance: balanceResponse.data.balance,
                userInfo: userResponse.data.user,
                metadata: {
                    exportTime: new Date().toISOString(),
                    exportType,
                    totalTransactions: transactionsResponse.data.transactions.length,
                    dataFreshness: 'live_database',
                    cacheBypass: true
                }
            };

            // Verify data integrity
            const integrityCheck = {
                transactionCount: exportData.transactions.length,
                hasBalance: typeof exportData.balance === 'number',
                hasUserInfo: !!exportData.userInfo.email,
                dataTimestamp: timestamp
            };

            console.log('✅ Fresh export data fetched:', integrityCheck);

            setExportState(prev => ({ 
                ...prev, 
                isExporting: false,
                lastExportTime: Date.now(),
                error: null
            }));

            // Emit data integrity verification event
            window.dispatchEvent(new CustomEvent('exportDataIntegrityCheck', {
                detail: { 
                    exportType,
                    integrityCheck,
                    timestamp: Date.now()
                }
            }));

            return { success: true, data: exportData, integrity: integrityCheck };

        } catch (error) {
            console.error('❌ Export data fetch failed:', error);
            
            setExportState(prev => ({ 
                ...prev, 
                isExporting: false,
                error: error.message
            }));

            // Emit export error event
            window.dispatchEvent(new CustomEvent('exportDataError', {
                detail: { 
                    exportType,
                    error: error.message,
                    timestamp: Date.now()
                }
            }));

            return { success: false, error: error.message };
        }
    }, []);

    // Generate PDF with fresh data
    const generateFreshPDF = useCallback(async () => {
        console.log('📄 Generating PDF with fresh database data...');
        
        const result = await fetchFreshExportData('pdf');
        
        if (!result.success) {
            throw new Error(`PDF generation failed: ${result.error}`);
        }

        return result.data;
    }, [fetchFreshExportData]);

    // Generate CSV with fresh data
    const generateFreshCSV = useCallback(async () => {
        console.log('📊 Generating CSV with fresh database data...');
        
        const result = await fetchFreshExportData('csv');
        
        if (!result.success) {
            throw new Error(`CSV generation failed: ${result.error}`);
        }

        const { transactions, userInfo, metadata } = result.data;

        // Create comprehensive CSV with metadata
        const csvHeader = [
            '# QuickPe Digital Wallet - Transaction Statement',
            `# Account Holder: ${userInfo.firstName} ${userInfo.lastName}`,
            `# Email: ${userInfo.email}`,
            `# QuickPe ID: ${userInfo.quickpeId}`,
            `# Export Generated: ${metadata.exportTime}`,
            `# Data Source: ${metadata.dataFreshness}`,
            `# Total Transactions: ${metadata.totalTransactions}`,
            '#',
            'Date,Time,Type,Description,Other Party,Amount,Transaction ID,Status'
        ].join('\n');

        const csvRows = transactions.map(transaction => {
            const date = new Date(transaction.timestamp || transaction.createdAt);
            const dateStr = date.toLocaleDateString('en-IN');
            const timeStr = date.toLocaleTimeString('en-IN');
            const type = transaction.type === 'credit' ? 'Received' : 'Sent';
            const description = `"${(transaction.description || '').replace(/"/g, '""')}"`;
            const otherParty = `"${(transaction.otherUser?.name || 'System').replace(/"/g, '""')}"`;
            const amount = `₹${transaction.amount}`;
            const txnId = transaction.transactionId || '';
            const status = transaction.status || 'Completed';
            
            return [dateStr, timeStr, type, description, otherParty, amount, txnId, status].join(',');
        });

        const csvContent = csvHeader + '\n' + csvRows.join('\n');
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QuickPe_Statement_${userInfo.firstName}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('✅ CSV export completed with fresh data');
        
        return { success: true, filename: a.download, recordCount: transactions.length };
    }, [fetchFreshExportData]);

    // Verify export data consistency
    const verifyExportConsistency = useCallback(async () => {
        console.log('🔍 Verifying export data consistency...');
        
        try {
            // Fetch data twice with small delay to check consistency
            const [firstFetch, secondFetch] = await Promise.all([
                fetchFreshExportData('verification_1'),
                new Promise(resolve => setTimeout(async () => {
                    const result = await fetchFreshExportData('verification_2');
                    resolve(result);
                }, 1000))
            ]);

            if (!firstFetch.success || !secondFetch.success) {
                return { consistent: false, error: 'Failed to fetch verification data' };
            }

            const consistency = {
                transactionCountMatch: firstFetch.data.transactions.length === secondFetch.data.transactions.length,
                balanceMatch: firstFetch.data.balance === secondFetch.data.balance,
                userInfoMatch: firstFetch.data.userInfo.email === secondFetch.data.userInfo.email,
                timeDifference: Math.abs(firstFetch.integrity.dataTimestamp - secondFetch.integrity.dataTimestamp)
            };

            const isConsistent = consistency.transactionCountMatch && 
                               consistency.balanceMatch && 
                               consistency.userInfoMatch;

            console.log(isConsistent ? '✅ Export data consistency verified' : '⚠️ Export data inconsistency detected', consistency);

            return { consistent: isConsistent, details: consistency };

        } catch (error) {
            console.error('❌ Export consistency verification failed:', error);
            return { consistent: false, error: error.message };
        }
    }, [fetchFreshExportData]);

    return {
        exportState,
        fetchFreshExportData,
        generateFreshPDF,
        generateFreshCSV,
        verifyExportConsistency
    };
};
