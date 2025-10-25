import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/api/client';

export const useTransactionIntegrity = (userId) => {
    const [integrityState, setIntegrityState] = useState({
        lastCheck: null,
        checksPerformed: 0,
        inconsistenciesFound: 0,
        isChecking: false,
        autoCheckEnabled: true,
        checkInterval: 60000, // 1 minute
        lastInconsistency: null,
        frontendCache: new Map(),
        backendSnapshot: new Map()
    });

    const integrityCheckRef = useRef(null);
    const inconsistencyLogRef = useRef([]);

    // Perform comprehensive integrity check
    const performIntegrityCheck = useCallback(async (checkType = 'scheduled') => {
        if (!userId || integrityState.isChecking) return;

        try {
            setIntegrityState(prev => ({ ...prev, isChecking: true }));
            
            console.log(`🔍 Starting ${checkType} transaction integrity check...`);

            // Fetch fresh data from backend
            const backendResponse = await apiClient.get('/account/transactions', {
                params: { 
                    integrity_check: true,
                    timestamp: Date.now(),
                    limit: 100
                },
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (!backendResponse.data?.transactions) {
                throw new Error('Invalid backend response for integrity check');
            }

            const backendTransactions = backendResponse.data.transactions;
            
            // Get frontend cached transactions
            const frontendTransactions = Array.from(integrityState.frontendCache.values());

            // Perform integrity checks
            const integrityResults = {
                timestamp: Date.now(),
                checkType,
                backendCount: backendTransactions.length,
                frontendCount: frontendTransactions.length,
                countMatch: backendTransactions.length === frontendTransactions.length,
                missingInFrontend: [],
                missingInBackend: [],
                dataInconsistencies: [],
                duplicatesInFrontend: [],
                chronologyIssues: []
            };

            // Check for missing transactions
            const backendIds = new Set(backendTransactions.map(t => t.transactionId));
            const frontendIds = new Set(frontendTransactions.map(t => t.transactionId));

            // Find missing transactions
            backendTransactions.forEach(backendTxn => {
                if (!frontendIds.has(backendTxn.transactionId)) {
                    integrityResults.missingInFrontend.push({
                        transactionId: backendTxn.transactionId,
                        amount: backendTxn.amount,
                        timestamp: backendTxn.timestamp || backendTxn.createdAt,
                        type: backendTxn.type
                    });
                }
            });

            frontendTransactions.forEach(frontendTxn => {
                if (!backendIds.has(frontendTxn.transactionId)) {
                    integrityResults.missingInBackend.push({
                        transactionId: frontendTxn.transactionId,
                        amount: frontendTxn.amount,
                        timestamp: frontendTxn.timestamp || frontendTxn.createdAt,
                        type: frontendTxn.type
                    });
                }
            });

            // Check for data inconsistencies in matching transactions
            backendTransactions.forEach(backendTxn => {
                const frontendTxn = frontendTransactions.find(t => t.transactionId === backendTxn.transactionId);
                if (frontendTxn) {
                    const inconsistencies = [];
                    
                    if (backendTxn.amount !== frontendTxn.amount) {
                        inconsistencies.push(`Amount mismatch: backend=${backendTxn.amount}, frontend=${frontendTxn.amount}`);
                    }
                    
                    if (backendTxn.type !== frontendTxn.type) {
                        inconsistencies.push(`Type mismatch: backend=${backendTxn.type}, frontend=${frontendTxn.type}`);
                    }

                    const backendTime = new Date(backendTxn.timestamp || backendTxn.createdAt).getTime();
                    const frontendTime = new Date(frontendTxn.timestamp || frontendTxn.createdAt).getTime();
                    if (Math.abs(backendTime - frontendTime) > 5000) { // 5 second tolerance
                        inconsistencies.push(`Timestamp mismatch: backend=${backendTime}, frontend=${frontendTime}`);
                    }

                    if (inconsistencies.length > 0) {
                        integrityResults.dataInconsistencies.push({
                            transactionId: backendTxn.transactionId,
                            issues: inconsistencies
                        });
                    }
                }
            });

            // Check for duplicates in frontend
            const frontendIdCounts = {};
            frontendTransactions.forEach(txn => {
                frontendIdCounts[txn.transactionId] = (frontendIdCounts[txn.transactionId] || 0) + 1;
            });

            Object.entries(frontendIdCounts).forEach(([id, count]) => {
                if (count > 1) {
                    integrityResults.duplicatesInFrontend.push({ transactionId: id, count });
                }
            });

            // Check chronological order in frontend
            for (let i = 1; i < frontendTransactions.length; i++) {
                const prevTime = new Date(frontendTransactions[i-1].timestamp || frontendTransactions[i-1].createdAt);
                const currTime = new Date(frontendTransactions[i].timestamp || frontendTransactions[i].createdAt);
                
                if (prevTime < currTime) { // Should be newest first
                    integrityResults.chronologyIssues.push({
                        index: i,
                        prevTransaction: frontendTransactions[i-1].transactionId,
                        currTransaction: frontendTransactions[i].transactionId,
                        prevTime: prevTime.toISOString(),
                        currTime: currTime.toISOString()
                    });
                }
            }

            // Calculate overall integrity score
            const totalIssues = integrityResults.missingInFrontend.length + 
                              integrityResults.missingInBackend.length + 
                              integrityResults.dataInconsistencies.length + 
                              integrityResults.duplicatesInFrontend.length + 
                              integrityResults.chronologyIssues.length;

            integrityResults.integrityScore = totalIssues === 0 ? 100 : Math.max(0, 100 - (totalIssues * 10));
            integrityResults.isHealthy = totalIssues === 0;

            // Log results
            if (integrityResults.isHealthy) {
                console.log('✅ Transaction integrity check passed:', {
                    score: integrityResults.integrityScore,
                    backendCount: integrityResults.backendCount,
                    frontendCount: integrityResults.frontendCount
                });
            } else {
                console.warn('⚠️ Transaction integrity issues found:', integrityResults);
                inconsistencyLogRef.current.push(integrityResults);
                
                // Keep only last 10 inconsistency logs
                if (inconsistencyLogRef.current.length > 10) {
                    inconsistencyLogRef.current = inconsistencyLogRef.current.slice(-10);
                }
            }

            // Update state
            setIntegrityState(prev => ({
                ...prev,
                lastCheck: Date.now(),
                checksPerformed: prev.checksPerformed + 1,
                inconsistenciesFound: prev.inconsistenciesFound + (integrityResults.isHealthy ? 0 : 1),
                isChecking: false,
                lastInconsistency: integrityResults.isHealthy ? prev.lastInconsistency : integrityResults,
                backendSnapshot: new Map(backendTransactions.map(t => [t.transactionId, t]))
            }));

            // Emit integrity check event
            window.dispatchEvent(new CustomEvent('transactionIntegrityResult', {
                detail: integrityResults
            }));

            return integrityResults;

        } catch (error) {
            console.error('❌ Transaction integrity check failed:', error);
            
            setIntegrityState(prev => ({
                ...prev,
                isChecking: false,
                lastInconsistency: {
                    timestamp: Date.now(),
                    error: error.message,
                    checkType
                }
            }));

            return { error: error.message, isHealthy: false };
        }
    }, [userId, integrityState.isChecking, integrityState.frontendCache]);

    // Update frontend cache when transactions change
    const updateFrontendCache = useCallback((transactions) => {
        if (!Array.isArray(transactions)) return;

        const newCache = new Map();
        transactions.forEach(transaction => {
            if (transaction.transactionId) {
                newCache.set(transaction.transactionId, transaction);
            }
        });

        setIntegrityState(prev => ({
            ...prev,
            frontendCache: newCache
        }));

        console.log(`📊 Frontend transaction cache updated: ${newCache.size} transactions`);
    }, []);

    // Auto-heal inconsistencies
    const autoHealInconsistencies = useCallback(async (integrityResult) => {
        if (!integrityResult || integrityResult.isHealthy) return;

        console.log('🔧 Attempting to auto-heal transaction inconsistencies...');

        try {
            // If missing transactions in frontend, emit events to add them
            if (integrityResult.missingInFrontend.length > 0) {
                console.log(`🔧 Adding ${integrityResult.missingInFrontend.length} missing transactions to frontend`);
                
                integrityResult.missingInFrontend.forEach(transaction => {
                    window.dispatchEvent(new CustomEvent('newTransaction', {
                        detail: { ...transaction, source: 'integrity_heal' }
                    }));
                });
            }

            // If duplicates found, emit cache invalidation
            if (integrityResult.duplicatesInFrontend.length > 0) {
                console.log('🔧 Removing duplicate transactions from frontend');
                
                window.dispatchEvent(new CustomEvent('cacheInvalidate', {
                    detail: { 
                        patterns: ['transactions'], 
                        source: 'integrity_heal',
                        reason: 'duplicate_removal'
                    }
                }));
            }

            // If chronology issues, trigger re-sort
            if (integrityResult.chronologyIssues.length > 0) {
                console.log('🔧 Fixing chronological order issues');
                
                window.dispatchEvent(new CustomEvent('transactionReorder', {
                    detail: { source: 'integrity_heal' }
                }));
            }

            console.log('✅ Auto-heal completed');

        } catch (error) {
            console.error('❌ Auto-heal failed:', error);
        }
    }, []);

    // Set up automatic integrity checks
    useEffect(() => {
        if (!userId || !integrityState.autoCheckEnabled) return;

        // Disabled automatic integrity checks - manual only
        /* integrityCheckRef.current = setInterval(() => {
            performIntegrityCheck('automatic');
        }, integrityState.checkInterval); */

        // Initial check after 10 seconds
        const initialCheckTimeout = setTimeout(() => {
            performIntegrityCheck('initial');
        }, 10000);

        return () => {
            if (integrityCheckRef.current) {
                clearInterval(integrityCheckRef.current);
            }
            clearTimeout(initialCheckTimeout);
        };
    }, [userId, integrityState.autoCheckEnabled, integrityState.checkInterval, performIntegrityCheck]);

    // Listen for integrity check events and auto-heal
    useEffect(() => {
        const handleIntegrityResult = (event) => {
            const result = event.detail;
            if (!result.isHealthy) {
                autoHealInconsistencies(result);
            }
        };

        window.addEventListener('transactionIntegrityResult', handleIntegrityResult);

        return () => {
            window.removeEventListener('transactionIntegrityResult', handleIntegrityResult);
        };
    }, [autoHealInconsistencies]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (integrityCheckRef.current) {
                clearInterval(integrityCheckRef.current);
            }
        };
    }, []);

    return {
        integrityState,
        performIntegrityCheck,
        updateFrontendCache,
        inconsistencyLog: inconsistencyLogRef.current
    };
};
