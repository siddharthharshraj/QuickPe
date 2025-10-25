import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

// Beautiful PDF Styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 30,
        fontFamily: 'Helvetica'
    },
    // Header Section
    header: {
        backgroundColor: '#059669',
        marginHorizontal: -30,
        marginTop: -30,
        paddingHorizontal: 30,
        paddingVertical: 25,
        marginBottom: 30
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    logo: {
        flexDirection: 'column'
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 1
    },
    tagline: {
        fontSize: 11,
        color: '#ffffff',
        marginTop: 4,
        opacity: 0.9
    },
    reportInfo: {
        alignItems: 'flex-end'
    },
    reportTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff'
    },
    reportDate: {
        fontSize: 10,
        color: '#ffffff',
        marginTop: 4,
        opacity: 0.9
    },
    // User Info Section
    userSection: {
        backgroundColor: '#f0fdf4',
        padding: 20,
        borderRadius: 8,
        marginBottom: 25,
        borderLeft: '4px solid #059669'
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8
    },
    userDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5
    },
    userDetailItem: {
        fontSize: 10,
        color: '#6b7280'
    },
    userDetailValue: {
        fontSize: 10,
        color: '#1f2937',
        fontWeight: 'bold'
    },
    // Summary Cards Section
    summarySection: {
        marginBottom: 25
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 15,
        paddingBottom: 8,
        borderBottom: '2px solid #e5e7eb'
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15
    },
    summaryCard: {
        width: '48%',
        backgroundColor: '#f9fafb',
        padding: 15,
        borderRadius: 8,
        borderLeft: '3px solid #059669'
    },
    cardLabel: {
        fontSize: 10,
        color: '#6b7280',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    cardValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 5
    },
    cardChange: {
        fontSize: 9,
        marginTop: 5
    },
    cardChangePositive: {
        color: '#059669'
    },
    cardChangeNegative: {
        color: '#dc2626'
    },
    // Transactions Section
    transactionsSection: {
        marginBottom: 25
    },
    table: {
        marginTop: 10
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        padding: 10,
        borderRadius: 4,
        marginBottom: 5
    },
    tableHeaderCell: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    tableRow: {
        flexDirection: 'row',
        padding: 10,
        borderBottom: '1px solid #e5e7eb'
    },
    tableCell: {
        fontSize: 9,
        color: '#1f2937'
    },
    // Column widths
    col1: { width: '15%' },
    col2: { width: '35%' },
    col3: { width: '15%' },
    col4: { width: '20%' },
    col5: { width: '15%' },
    // Category Breakdown
    categorySection: {
        marginBottom: 25
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9fafb',
        marginBottom: 8,
        borderRadius: 6
    },
    categoryName: {
        fontSize: 11,
        color: '#1f2937',
        fontWeight: 'bold'
    },
    categoryAmount: {
        fontSize: 11,
        color: '#059669',
        fontWeight: 'bold'
    },
    categoryBar: {
        height: 6,
        backgroundColor: '#059669',
        borderRadius: 3,
        marginTop: 5
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        paddingTop: 15,
        borderTop: '1px solid #e5e7eb',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    footerText: {
        fontSize: 8,
        color: '#6b7280'
    },
    pageNumber: {
        fontSize: 8,
        color: '#6b7280'
    }
});

// PDF Document Component
const AnalyticsPDFDocument = ({ data, user, timeRange }) => {
    const formatCurrency = (amount) => {
        return `₹${amount?.toLocaleString('en-IN') || '0'}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatChange = (change) => {
        if (!change || change === 0) return '0.0%';
        const sign = change > 0 ? '+' : '';
        return `${sign}${change.toFixed(1)}%`;
    };

    const getTimeRangeText = (range) => {
        const ranges = {
            'all': 'All Time',
            'today': 'Today',
            'last7days': 'Last 7 Days',
            'last30days': 'Last 30 Days',
            'last90days': 'Last 90 Days'
        };
        return ranges[range] || 'Custom Range';
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.logo}>
                            <Text style={styles.logoText}>QuickPe</Text>
                            <Text style={styles.tagline}>Fast. Secure. Simple.</Text>
                        </View>
                        <View style={styles.reportInfo}>
                            <Text style={styles.reportTitle}>Analytics Report</Text>
                            <Text style={styles.reportDate}>
                                Generated on {new Date().toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* User Information */}
                <View style={styles.userSection}>
                    <Text style={styles.userName}>
                        {user?.firstName} {user?.lastName}
                    </Text>
                    <View style={styles.userDetails}>
                        <View>
                            <Text style={styles.userDetailItem}>QuickPe ID</Text>
                            <Text style={styles.userDetailValue}>{user?.quickpeId}</Text>
                        </View>
                        <View>
                            <Text style={styles.userDetailItem}>Email</Text>
                            <Text style={styles.userDetailValue}>{user?.email}</Text>
                        </View>
                        <View>
                            <Text style={styles.userDetailItem}>Period</Text>
                            <Text style={styles.userDetailValue}>{getTimeRangeText(timeRange)}</Text>
                        </View>
                    </View>
                </View>

                {/* Summary Section */}
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Financial Summary</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.cardLabel}>Current Balance</Text>
                            <Text style={styles.cardValue}>{formatCurrency(data?.balance)}</Text>
                        </View>
                        
                        <View style={styles.summaryCard}>
                            <Text style={styles.cardLabel}>Total Income</Text>
                            <Text style={styles.cardValue}>{formatCurrency(data?.totalReceived)}</Text>
                            {data?.incomeChange !== undefined && (
                                <Text style={[styles.cardChange, data.incomeChange >= 0 ? styles.cardChangePositive : styles.cardChangeNegative]}>
                                    {formatChange(data.incomeChange)} vs previous period
                                </Text>
                            )}
                        </View>
                        
                        <View style={styles.summaryCard}>
                            <Text style={styles.cardLabel}>Total Spending</Text>
                            <Text style={styles.cardValue}>{formatCurrency(data?.totalSpent)}</Text>
                            {data?.spendingChange !== undefined && (
                                <Text style={[styles.cardChange, data.spendingChange <= 0 ? styles.cardChangePositive : styles.cardChangeNegative]}>
                                    {formatChange(data.spendingChange)} vs previous period
                                </Text>
                            )}
                        </View>
                        
                        <View style={styles.summaryCard}>
                            <Text style={styles.cardLabel}>Net Flow</Text>
                            <Text style={[styles.cardValue, { color: data?.netFlow >= 0 ? '#059669' : '#dc2626' }]}>
                                {formatCurrency(data?.netFlow)}
                            </Text>
                        </View>
                        
                        <View style={styles.summaryCard}>
                            <Text style={styles.cardLabel}>Total Transactions</Text>
                            <Text style={styles.cardValue}>{data?.transactionCount || 0}</Text>
                        </View>
                        
                        <View style={styles.summaryCard}>
                            <Text style={styles.cardLabel}>Average Transaction</Text>
                            <Text style={styles.cardValue}>{formatCurrency(data?.averageTransaction)}</Text>
                        </View>
                    </View>
                </View>

                {/* Category Breakdown */}
                {data?.categories && data.categories.length > 0 && (
                    <View style={styles.categorySection}>
                        <Text style={styles.sectionTitle}>Spending by Category</Text>
                        {data.categories.slice(0, 5).map((category, index) => {
                            const maxAmount = Math.max(...data.categories.map(c => c.amount));
                            const barWidth = `${(category.amount / maxAmount) * 100}%`;
                            
                            return (
                                <View key={index} style={styles.categoryItem}>
                                    <View style={{ width: '70%' }}>
                                        <Text style={styles.categoryName}>{category.name}</Text>
                                        <View style={[styles.categoryBar, { width: barWidth }]} />
                                    </View>
                                    <Text style={styles.categoryAmount}>{formatCurrency(category.amount)}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Recent Transactions */}
                {data?.recentTransactions && data.recentTransactions.length > 0 && (
                    <View style={styles.transactionsSection}>
                        <Text style={styles.sectionTitle}>Recent Transactions</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, styles.col1]}>Date</Text>
                                <Text style={[styles.tableHeaderCell, styles.col2]}>Description</Text>
                                <Text style={[styles.tableHeaderCell, styles.col3]}>Type</Text>
                                <Text style={[styles.tableHeaderCell, styles.col4]}>Category</Text>
                                <Text style={[styles.tableHeaderCell, styles.col5]}>Amount</Text>
                            </View>
                            {data.recentTransactions.slice(0, 10).map((txn, index) => (
                                <View key={index} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.col1]}>
                                        {formatDate(txn.createdAt || txn.timestamp)}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.col2]}>
                                        {txn.description?.substring(0, 40) || 'N/A'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.col3]}>
                                        {txn.type === 'credit' ? 'Credit' : 'Debit'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.col4]}>
                                        {txn.category || 'N/A'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.col5, { 
                                        color: txn.type === 'credit' ? '#059669' : '#dc2626',
                                        fontWeight: 'bold'
                                    }]}>
                                        {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        QuickPe Analytics Report • Confidential
                    </Text>
                    <Text style={styles.pageNumber}>
                        Page 1 of 1
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

// Download Button Component
export const AnalyticsPDFDownload = ({ data, user, timeRange = 'all' }) => {
    const fileName = `QuickPe_Analytics_${new Date().toISOString().split('T')[0]}.pdf`;

    return (
        <PDFDownloadLink
            document={<AnalyticsPDFDocument data={data} user={user} timeRange={timeRange} />}
            fileName={fileName}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md"
        >
            {({ blob, url, loading, error }) => (
                <>
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    <span>{loading ? 'Generating PDF...' : 'Download Analytics PDF'}</span>
                </>
            )}
        </PDFDownloadLink>
    );
};

export default AnalyticsPDFDownload;
