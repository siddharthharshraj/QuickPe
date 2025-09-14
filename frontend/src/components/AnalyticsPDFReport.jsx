import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, PDFDownloadLink } from '@react-pdf/renderer';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

// PDF Styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 25,
        fontFamily: 'Helvetica'
    },
    header: {
        backgroundColor: '#059669',
        marginHorizontal: -25,
        marginTop: -25,
        paddingHorizontal: 25,
        paddingVertical: 20,
        marginBottom: 25
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff'
    },
    tagline: {
        fontSize: 12,
        color: '#ffffff',
        marginTop: 2,
        opacity: 0.9
    },
    reportInfo: {
        alignItems: 'flex-end'
    },
    reportTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff'
    },
    reportDate: {
        fontSize: 11,
        color: '#ffffff',
        marginTop: 3,
        opacity: 0.9
    },
    userInfo: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#059669',
        padding: 18,
        borderRadius: 8,
        marginBottom: 20
    },
    userInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#059669',
        marginBottom: 12,
        textAlign: 'center'
    },
    userInfoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    userInfoItem: {
        width: '48%',
        marginBottom: 8
    },
    userInfoLabel: {
        fontSize: 11,
        color: '#374151',
        fontWeight: 'bold',
        marginBottom: 2
    },
    userInfoValue: {
        fontSize: 12,
        color: '#1e293b',
        fontWeight: 'normal'
    },
    section: {
        marginBottom: 25
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 15,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 25
    },
    metricCard: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 10,
        width: '48%',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#059669',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6
    },
    metricIcon: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 4
    },
    metricValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#059669',
        marginBottom: 6,
        textAlign: 'center'
    },
    metricLabel: {
        fontSize: 12,
        color: '#374151',
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 4
    },
    metricChange: {
        fontSize: 10,
        textAlign: 'center',
        fontWeight: 'bold'
    },
    positiveChange: {
        color: '#059669'
    },
    negativeChange: {
        color: '#ef4444'
    },
    categoryContainer: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    categoryName: {
        fontSize: 12,
        color: '#1e293b',
        fontWeight: 'bold',
        flex: 1
    },
    categoryAmount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#059669',
        width: 90,
        textAlign: 'right'
    },
    categoryPercentage: {
        fontSize: 10,
        color: '#6b7280',
        width: 50,
        textAlign: 'right',
        fontWeight: 'bold'
    },
    insightCard: {
        backgroundColor: '#f0f9ff',
        padding: 14,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#059669',
        borderWidth: 1,
        borderColor: '#e0f2fe'
    },
    insightTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#059669',
        marginBottom: 6
    },
    insightText: {
        fontSize: 11,
        color: '#374151',
        lineHeight: 1.5
    },
    healthScoreCard: {
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#059669',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6
    },
    healthScoreValue: {
        fontSize: 42,
        fontWeight: 'bold',
        marginBottom: 8
    },
    healthScoreLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    footer: {
        position: 'absolute',
        bottom: 25,
        left: 25,
        right: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 15,
        borderTopWidth: 2,
        borderTopColor: '#059669'
    },
    footerLeft: {
        fontSize: 9,
        color: '#374151',
        lineHeight: 1.3
    },
    footerRight: {
        fontSize: 9,
        color: '#374151',
        textAlign: 'right',
        lineHeight: 1.3
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 4
    },
    trendInfo: {
        width: '30%',
        paddingRight: 10
    },
    trendMonth: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e293b'
    },
    trendAmount: {
        fontSize: 9,
        color: '#64748b'
    },
    barContainer: {
        width: '50%',
        height: 12,
        backgroundColor: '#e5e7eb',
        borderRadius: 6,
        marginHorizontal: 8,
        overflow: 'hidden'
    },
    barFill: {
        height: '100%',
        backgroundColor: '#059669',
        borderRadius: 6
    },
    trendChange: {
        width: '20%',
        fontSize: 8,
        color: '#64748b',
        textAlign: 'right'
    }
});

// PDF Document Component
const AnalyticsPDFDocument = ({ userData, analyticsData, insights }) => {
    const getHealthScoreColor = (score) => {
        if (score >= 80) return '#059669';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <Document>
            <Page size="A4" style={styles.page} wrap={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.logo}>
                            <Text style={styles.logoText}>QuickPe</Text>
                            <Text style={styles.tagline}>Your Digital Wallet</Text>
                        </View>
                        <View style={styles.reportInfo}>
                            <Text style={styles.reportTitle}>Analytics Report</Text>
                            <Text style={styles.reportDate}>
                                Generated on {new Date().toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* User Information */}
                <View style={styles.userInfo}>
                    <Text style={styles.userInfoTitle}>Account Holder Information</Text>
                    <View style={styles.userInfoGrid}>
                        <View style={styles.userInfoItem}>
                            <Text style={styles.userInfoLabel}>Name:</Text>
                            <Text style={styles.userInfoValue}>{userData?.firstName && userData?.lastName ? `${userData.firstName} ${userData.lastName}` : userData?.name || 'N/A'}</Text>
                        </View>
                        <View style={styles.userInfoItem}>
                            <Text style={styles.userInfoLabel}>Email:</Text>
                            <Text style={styles.userInfoValue}>{userData?.email || 'N/A'}</Text>
                        </View>
                        <View style={styles.userInfoItem}>
                            <Text style={styles.userInfoLabel}>QuickPe ID:</Text>
                            <Text style={styles.userInfoValue}>{userData?.quickpeId || 'N/A'}</Text>
                        </View>
                        <View style={styles.userInfoItem}>
                            <Text style={styles.userInfoLabel}>Current Balance:</Text>
                            <Text style={styles.userInfoValue}>Rs {analyticsData.summary?.currentBalance?.toLocaleString() || '0'}</Text>
                        </View>
                    </View>
                </View>

                {/* Financial Overview */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Financial Overview</Text>
                    <View style={styles.metricsGrid}>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricIcon}>💸</Text>
                            <Text style={styles.metricValue}>
                                Rs {analyticsData.summary?.spending?.current?.toLocaleString() || '0'}
                            </Text>
                            <Text style={styles.metricLabel}>Total Spending</Text>
                            <Text style={[
                                styles.metricChange,
                                analyticsData.summary?.spending?.change >= 0 ? styles.negativeChange : styles.positiveChange
                            ]}>
                                {analyticsData.summary?.spending?.change >= 0 ? '+' : ''}{analyticsData.summary?.spending?.change?.toFixed(1) || '0'}%
                            </Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricIcon}>💰</Text>
                            <Text style={styles.metricValue}>
                                Rs {analyticsData.summary?.income?.current?.toLocaleString() || '0'}
                            </Text>
                            <Text style={styles.metricLabel}>Total Income</Text>
                            <Text style={[
                                styles.metricChange,
                                analyticsData.summary?.income?.change >= 0 ? styles.positiveChange : styles.negativeChange
                            ]}>
                                {analyticsData.summary?.income?.change >= 0 ? '+' : ''}{analyticsData.summary?.income?.change?.toFixed(1) || '0'}%
                            </Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricIcon}>📊</Text>
                            <Text style={styles.metricValue}>
                                Rs {analyticsData.summary?.netFlow?.toLocaleString() || '0'}
                            </Text>
                            <Text style={styles.metricLabel}>Net Flow</Text>
                            <Text style={[
                                styles.metricChange,
                                analyticsData.summary?.netFlow >= 0 ? styles.positiveChange : styles.negativeChange
                            ]}>
                                {analyticsData.summary?.netFlow >= 0 ? 'Positive' : 'Negative'}
                            </Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricIcon}>🏦</Text>
                            <Text style={styles.metricValue}>
                                {analyticsData.summary?.savingsRatio?.toFixed(1) || '0'}%
                            </Text>
                            <Text style={styles.metricLabel}>Savings Ratio</Text>
                        </View>
                    </View>
                </View>

                {/* Financial Health Score */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Financial Health Score</Text>
                    <View style={styles.healthScoreCard}>
                        <Text style={[
                            styles.healthScoreValue,
                            { color: getHealthScoreColor(analyticsData.summary?.financialHealthScore || 0) }
                        ]}>
                            {analyticsData.summary?.financialHealthScore || 0}/100
                        </Text>
                        <Text style={[
                            styles.healthScoreLabel,
                            { color: getHealthScoreColor(analyticsData.summary?.financialHealthScore || 0) }
                        ]}>
                            {analyticsData.summary?.financialHealthScore >= 80 ? '🌟 Excellent' :
                             analyticsData.summary?.financialHealthScore >= 60 ? '👍 Good' : '⚠️ Needs Improvement'}
                        </Text>
                    </View>
                </View>

                {/* Spending Categories */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Spending by Category</Text>
                    <View style={styles.categoryContainer}>
                        {analyticsData.categories?.slice(0, 8).map((category, index) => (
                            <View key={index} style={[styles.categoryRow, index === analyticsData.categories.slice(0, 8).length - 1 && { borderBottomWidth: 0 }]}>
                                <Text style={styles.categoryName}>{category.name}</Text>
                                <Text style={styles.categoryAmount}>Rs {category.totalAmount?.toLocaleString()}</Text>
                                <Text style={styles.categoryPercentage}>{category.percentage?.toFixed(1)}%</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Top Contact */}
                {analyticsData.summary?.topContact && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Most Frequent Contact</Text>
                        <View style={styles.userInfoRow}>
                            <Text style={styles.userInfoLabel}>Contact:</Text>
                            <Text style={styles.userInfoValue}>{analyticsData.summary.topContact.name}</Text>
                        </View>
                        <View style={styles.userInfoRow}>
                            <Text style={styles.userInfoLabel}>Transactions:</Text>
                            <Text style={styles.userInfoValue}>{analyticsData.summary.topContact.transactionCount}</Text>
                        </View>
                        <View style={styles.userInfoRow}>
                            <Text style={styles.userInfoLabel}>Total Amount:</Text>
                            <Text style={styles.userInfoValue}>Rs {analyticsData.summary.topContact.totalAmount?.toLocaleString()}</Text>
                        </View>
                    </View>
                )}

                {/* Monthly Trends Chart */}
                {analyticsData.trends && analyticsData.trends.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📈 Monthly Spending Trends</Text>
                        {analyticsData.trends.slice(0, 6).map((trend, index) => {
                            const maxSpending = Math.max(...analyticsData.trends.map(t => t.spending || 0));
                            const barWidth = maxSpending > 0 ? (trend.spending / maxSpending) * 100 : 0;
                            
                            return (
                                <View key={index} style={styles.trendRow}>
                                    <View style={styles.trendInfo}>
                                        <Text style={styles.trendMonth}>{trend.month}</Text>
                                        <Text style={styles.trendAmount}>Rs {trend.spending?.toLocaleString() || '0'}</Text>
                                    </View>
                                    <View style={styles.barContainer}>
                                        <View style={[styles.barFill, { width: `${barWidth}%` }]} />
                                    </View>
                                    <Text style={styles.trendChange}>
                                        {trend.change ? `${trend.change >= 0 ? '+' : ''}${trend.change.toFixed(1)}%` : 'N/A'}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Smart Insights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Smart Insights</Text>
                    {insights && insights.length > 0 ? insights.slice(0, 4).map((insight, index) => (
                        <View key={index} style={styles.insightCard}>
                            <Text style={styles.insightTitle}>{insight.icon} {insight.title}</Text>
                            <Text style={styles.insightText}>{insight.message}</Text>
                        </View>
                    )) : (
                        <View style={styles.insightCard}>
                            <Text style={styles.insightTitle}>💡 Excellent Savings</Text>
                            <Text style={styles.insightText}>You're saving {analyticsData.summary?.savingsRatio?.toFixed(1) || '0'}% of your income. You're on track for financial success!</Text>
                        </View>
                    )}
                    {analyticsData.summary?.spending?.change < 0 && (
                        <View style={styles.insightCard}>
                            <Text style={styles.insightTitle}>📉 Spending Reduction</Text>
                            <Text style={styles.insightText}>Great job! Your spending decreased by {Math.abs(analyticsData.summary.spending.change).toFixed(1)}% compared to last period.</Text>
                        </View>
                    )}
                    {analyticsData.summary?.income?.change > 0 && (
                        <View style={styles.insightCard}>
                            <Text style={styles.insightTitle}>📈 Income Growth</Text>
                            <Text style={styles.insightText}>Your income increased by {analyticsData.summary.income.change.toFixed(1)}% this period. Keep up the excellent work!</Text>
                        </View>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View>
                        <Text style={styles.footerLeft}>Developed by: Siddharth Harsh Raj</Text>
                        <Text style={styles.footerLeft}>Email: contact@siddharth-dev.tech</Text>
                        <Text style={styles.footerLeft}>LinkedIn: siddharthharshraj</Text>
                    </View>
                    <View>
                        <Text style={styles.footerRight}>Page 1 of 2</Text>
                        <Text style={styles.footerRight}>© 2025 QuickPe. All rights reserved.</Text>
                    </View>
                </View>
            </Page>

            {/* Second Page */}
            <Page size="A4" style={styles.page} wrap={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.logo}>
                            <Text style={styles.logoText}>QuickPe</Text>
                            <Text style={styles.tagline}>Your Digital Wallet</Text>
                        </View>
                        <View style={styles.reportInfo}>
                            <Text style={styles.reportTitle}>Analytics Report</Text>
                            <Text style={styles.reportDate}>Page 2 - Detailed Analysis</Text>
                        </View>
                    </View>
                </View>

                {/* Monthly Trends Chart */}
                {analyticsData.trends && analyticsData.trends.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📈 Monthly Spending Trends</Text>
                        <View style={styles.categoryContainer}>
                            {analyticsData.trends.slice(0, 6).map((trend, index) => {
                                const maxSpending = Math.max(...analyticsData.trends.map(t => t.spending || 0));
                                const barWidth = maxSpending > 0 ? (trend.spending / maxSpending) * 100 : 0;
                                
                                return (
                                    <View key={index} style={styles.trendRow}>
                                        <View style={styles.trendInfo}>
                                            <Text style={styles.trendMonth}>{trend.month}</Text>
                                            <Text style={styles.trendAmount}>Rs {trend.spending?.toLocaleString() || '0'}</Text>
                                        </View>
                                        <View style={styles.barContainer}>
                                            <View style={[styles.barFill, { width: `${barWidth}%` }]} />
                                        </View>
                                        <Text style={styles.trendChange}>
                                            {trend.change ? `${trend.change >= 0 ? '+' : ''}${trend.change.toFixed(1)}%` : 'N/A'}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Additional Smart Insights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Additional Financial Insights</Text>
                    
                    {analyticsData.summary?.financialHealthScore >= 80 && (
                        <View style={styles.insightCard}>
                            <Text style={styles.insightTitle}>🏆 Financial Excellence</Text>
                            <Text style={styles.insightText}>Outstanding! Your financial health score of {analyticsData.summary.financialHealthScore}/100 puts you in the top tier of financial management.</Text>
                        </View>
                    )}
                    
                    {analyticsData.summary?.topContact && (
                        <View style={styles.insightCard}>
                            <Text style={styles.insightTitle}>👥 Transaction Pattern</Text>
                            <Text style={styles.insightText}>Your most frequent contact is {analyticsData.summary.topContact.name} with {analyticsData.summary.topContact.transactionCount} transactions totaling Rs {analyticsData.summary.topContact.totalAmount?.toLocaleString()}.</Text>
                        </View>
                    )}
                    
                    <View style={styles.insightCard}>
                        <Text style={styles.insightTitle}>💼 Financial Summary</Text>
                        <Text style={styles.insightText}>Based on your current balance of Rs {analyticsData.summary?.currentBalance?.toLocaleString() || '0'} and spending patterns, you're maintaining a healthy financial profile with consistent transaction management.</Text>
                    </View>
                </View>

                {/* Report Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Report Summary</Text>
                    <View style={styles.categoryContainer}>
                        <View style={styles.categoryRow}>
                            <Text style={styles.categoryName}>Report Generated</Text>
                            <Text style={styles.categoryAmount}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                        </View>
                        <View style={styles.categoryRow}>
                            <Text style={styles.categoryName}>Data Period</Text>
                            <Text style={styles.categoryAmount}>{analyticsData.summary?.timeRange || 'Current Month'}</Text>
                        </View>
                        <View style={styles.categoryRow}>
                            <Text style={styles.categoryName}>Total Transactions</Text>
                            <Text style={styles.categoryAmount}>{analyticsData.summary?.transactionCount || '0'}</Text>
                        </View>
                        <View style={[styles.categoryRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.categoryName}>Account Status</Text>
                            <Text style={styles.categoryAmount}>Active</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View>
                        <Text style={styles.footerLeft}>Developed by: Siddharth Harsh Raj</Text>
                        <Text style={styles.footerLeft}>Email: contact@siddharth-dev.tech</Text>
                        <Text style={styles.footerLeft}>LinkedIn: siddharthharshraj</Text>
                    </View>
                    <View>
                        <Text style={styles.footerRight}>Page 2 of 2</Text>
                        <Text style={styles.footerRight}>© 2025 QuickPe. All rights reserved.</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

// Export Button Component
const AnalyticsPDFExport = ({ userData, analyticsData, insights, isLoading }) => {
    if (isLoading || !analyticsData) {
        return (
            <button
                disabled
                className="flex items-center space-x-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
            >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Loading...</span>
            </button>
        );
    }

    return (
        <PDFDownloadLink
            document={<AnalyticsPDFDocument userData={userData} analyticsData={analyticsData} insights={insights} />}
            fileName={`QuickPe-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf`}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
            {({ blob, url, loading, error }) => (
                <>
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span>{loading ? 'Generating PDF...' : 'Export Analytics Report'}</span>
                </>
            )}
        </PDFDownloadLink>
    );
};

export default AnalyticsPDFExport;
