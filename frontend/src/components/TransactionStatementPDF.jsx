import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { ArrowDownTrayIcon, CalendarIcon } from '@heroicons/react/24/outline';

// Bank Statement PDF Styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 30,
        fontFamily: 'Helvetica'
    },
    // Header
    header: {
        marginBottom: 25,
        paddingBottom: 15,
        borderBottom: '2px solid #059669'
    },
    bankName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#059669',
        marginBottom: 5
    },
    statementTitle: {
        fontSize: 14,
        color: '#374151',
        marginTop: 5
    },
    // Account Info
    accountSection: {
        backgroundColor: '#f9fafb',
        padding: 15,
        borderRadius: 6,
        marginBottom: 20
    },
    accountGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    accountLabel: {
        fontSize: 9,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    accountValue: {
        fontSize: 10,
        color: '#1f2937',
        fontWeight: 'bold',
        marginTop: 3
    },
    // Statement Period
    periodSection: {
        backgroundColor: '#ecfdf5',
        padding: 12,
        borderRadius: 6,
        marginBottom: 20,
        borderLeft: '3px solid #059669'
    },
    periodText: {
        fontSize: 10,
        color: '#047857',
        fontWeight: 'bold'
    },
    // Summary Box
    summaryBox: {
        backgroundColor: '#f0fdf4',
        padding: 15,
        borderRadius: 6,
        marginBottom: 20,
        border: '1px solid #d1fae5'
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    summaryItem: {
        alignItems: 'center'
    },
    summaryLabel: {
        fontSize: 8,
        color: '#6b7280',
        marginBottom: 5,
        textTransform: 'uppercase'
    },
    summaryValue: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    creditValue: {
        color: '#059669'
    },
    debitValue: {
        color: '#dc2626'
    },
    balanceValue: {
        color: '#1f2937'
    },
    // Transaction Table
    table: {
        marginTop: 10
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        padding: 8,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        borderBottom: '2px solid #d1d5db'
    },
    tableHeaderCell: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottom: '1px solid #e5e7eb'
    },
    tableRowAlt: {
        backgroundColor: '#f9fafb'
    },
    tableCell: {
        fontSize: 8,
        color: '#1f2937'
    },
    // Column widths for bank statement
    colDate: { width: '12%' },
    colDescription: { width: '35%' },
    colRef: { width: '15%' },
    colDebit: { width: '12%', textAlign: 'right' },
    colCredit: { width: '12%', textAlign: 'right' },
    colBalance: { width: '14%', textAlign: 'right', fontWeight: 'bold' },
    // Totals Row
    totalsRow: {
        flexDirection: 'row',
        backgroundColor: '#ecfdf5',
        padding: 10,
        borderTop: '2px solid #059669',
        marginTop: 5
    },
    totalsLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#047857'
    },
    totalsValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#047857',
        textAlign: 'right'
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        paddingTop: 12,
        borderTop: '1px solid #e5e7eb'
    },
    footerText: {
        fontSize: 7,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 3
    },
    disclaimer: {
        fontSize: 6,
        color: '#9ca3af',
        textAlign: 'center',
        fontStyle: 'italic'
    },
    pageNumber: {
        fontSize: 7,
        color: '#6b7280',
        textAlign: 'right',
        marginTop: 5
    }
});

// PDF Document Component
const TransactionStatementDocument = ({ transactions, user, startDate, endDate, openingBalance }) => {
    const formatCurrency = (amount) => {
        return amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate running balance and totals
    let runningBalance = openingBalance || 0;
    let totalCredit = 0;
    let totalDebit = 0;

    const transactionsWithBalance = transactions.map(txn => {
        const amount = txn.amount || 0;
        
        if (txn.type === 'credit') {
            runningBalance += amount;
            totalCredit += amount;
        } else {
            runningBalance -= amount;
            totalDebit += amount;
        }

        return {
            ...txn,
            runningBalance
        };
    });

    const closingBalance = runningBalance;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.bankName}>QuickPe</Text>
                    <Text style={styles.statementTitle}>Account Statement</Text>
                </View>

                {/* Account Information */}
                <View style={styles.accountSection}>
                    <View style={styles.accountGrid}>
                        <View style={{ width: '33%' }}>
                            <Text style={styles.accountLabel}>Account Holder</Text>
                            <Text style={styles.accountValue}>
                                {user?.firstName} {user?.lastName}
                            </Text>
                        </View>
                        <View style={{ width: '33%' }}>
                            <Text style={styles.accountLabel}>QuickPe ID</Text>
                            <Text style={styles.accountValue}>{user?.quickpeId}</Text>
                        </View>
                        <View style={{ width: '33%' }}>
                            <Text style={styles.accountLabel}>Email</Text>
                            <Text style={styles.accountValue}>{user?.email}</Text>
                        </View>
                    </View>
                </View>

                {/* Statement Period */}
                <View style={styles.periodSection}>
                    <Text style={styles.periodText}>
                        Statement Period: {formatDate(startDate)} to {formatDate(endDate)}
                    </Text>
                </View>

                {/* Summary */}
                <View style={styles.summaryBox}>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Opening Balance</Text>
                            <Text style={[styles.summaryValue, styles.balanceValue]}>
                                ₹{formatCurrency(openingBalance)}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Credit</Text>
                            <Text style={[styles.summaryValue, styles.creditValue]}>
                                ₹{formatCurrency(totalCredit)}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Debit</Text>
                            <Text style={[styles.summaryValue, styles.debitValue]}>
                                ₹{formatCurrency(totalDebit)}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Closing Balance</Text>
                            <Text style={[styles.summaryValue, styles.balanceValue]}>
                                ₹{formatCurrency(closingBalance)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Transaction Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDescription]}>Description</Text>
                        <Text style={[styles.tableHeaderCell, styles.colRef]}>Ref No.</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDebit]}>Debit (₹)</Text>
                        <Text style={[styles.tableHeaderCell, styles.colCredit]}>Credit (₹)</Text>
                        <Text style={[styles.tableHeaderCell, styles.colBalance]}>Balance (₹)</Text>
                    </View>

                    {transactionsWithBalance.map((txn, index) => (
                        <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                            <Text style={[styles.tableCell, styles.colDate]}>
                                {formatDate(txn.createdAt || txn.timestamp)}
                            </Text>
                            <Text style={[styles.tableCell, styles.colDescription]}>
                                {txn.description?.substring(0, 45) || 'Transaction'}
                            </Text>
                            <Text style={[styles.tableCell, styles.colRef]}>
                                {txn.transactionId?.substring(0, 12) || 'N/A'}
                            </Text>
                            <Text style={[styles.tableCell, styles.colDebit, styles.debitValue]}>
                                {txn.type === 'debit' ? formatCurrency(txn.amount) : '-'}
                            </Text>
                            <Text style={[styles.tableCell, styles.colCredit, styles.creditValue]}>
                                {txn.type === 'credit' ? formatCurrency(txn.amount) : '-'}
                            </Text>
                            <Text style={[styles.tableCell, styles.colBalance]}>
                                {formatCurrency(txn.runningBalance)}
                            </Text>
                        </View>
                    ))}

                    {/* Totals Row */}
                    <View style={styles.totalsRow}>
                        <Text style={[styles.totalsLabel, { width: '47%' }]}>TOTALS</Text>
                        <Text style={[styles.totalsLabel, { width: '15%' }]}></Text>
                        <Text style={[styles.totalsValue, styles.colDebit]}>
                            {formatCurrency(totalDebit)}
                        </Text>
                        <Text style={[styles.totalsValue, styles.colCredit]}>
                            {formatCurrency(totalCredit)}
                        </Text>
                        <Text style={[styles.totalsValue, styles.colBalance]}>
                            {formatCurrency(closingBalance)}
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        QuickPe • Fast. Secure. Simple.
                    </Text>
                    <Text style={styles.disclaimer}>
                        This is a computer-generated statement and does not require a signature. 
                        For any queries, please contact support@quickpe.com
                    </Text>
                    <Text style={styles.pageNumber}>
                        Page 1 of 1 • Generated on {formatDateTime(new Date())}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

// Download Component with Date Range Selector
export const TransactionStatementDownload = ({ user }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openingBalance, setOpeningBalance] = useState(0);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/v1/account/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=1000`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            const data = await response.json();
            setTransactions(data.transactions || []);
            setOpeningBalance(user?.balance || 0);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fileName = `QuickPe_Statement_${dateRange.startDate}_to_${dateRange.endDate}.pdf`;

    return (
        <div className="space-y-4">
            <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
                <CalendarIcon className="h-5 w-5" />
                <span>Select Date Range</span>
            </button>

            {showDatePicker && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Statement Period</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>
                    <button
                        onClick={fetchTransactions}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Loading Transactions...' : 'Generate Statement'}
                    </button>
                </div>
            )}

            {transactions.length > 0 && (
                <PDFDownloadLink
                    document={
                        <TransactionStatementDocument
                            transactions={transactions}
                            user={user}
                            startDate={dateRange.startDate}
                            endDate={dateRange.endDate}
                            openingBalance={openingBalance}
                        />
                    }
                    fileName={fileName}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md"
                >
                    {({ blob, url, loading, error }) => (
                        <>
                            <ArrowDownTrayIcon className="h-5 w-5" />
                            <span>{loading ? 'Generating PDF...' : 'Download Statement PDF'}</span>
                        </>
                    )}
                </PDFDownloadLink>
            )}
        </div>
    );
};

export default TransactionStatementDownload;
