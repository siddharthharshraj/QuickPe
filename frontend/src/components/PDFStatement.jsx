import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink
} from '@react-pdf/renderer';

// Use default Helvetica font for better PDF compatibility
// Font.register is not needed for built-in fonts

// Professional QuickPe branded styles with modern design
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 40,
    backgroundColor: '#ffffff',
    lineHeight: 1.3,
  },
  
  // Professional Header with QuickPe Branding
  headerContainer: {
    backgroundColor: '#10b981',
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 40,
    paddingRight: 40,
    marginBottom: 0,
  },
  brandBar: {
    backgroundColor: '#059669',
    height: 3,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandedTitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
  },
  
  // Content Container
  contentContainer: {
    paddingLeft: 40,
    paddingRight: 40,
  },

  // Section Styles
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 12,
    paddingBottom: 4,
    borderBottom: '1.5 solid #10b981',
  },

  // Account Information Card
  accountCard: {
    backgroundColor: '#f8fafc',
    border: '1.5 solid #cbd5e1',
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: '0.5 solid #e2e8f0',
  },
  accountLabel: {
    fontSize: 10,
    color: '#64748b',
    width: '40%',
  },
  accountValue: {
    fontSize: 11,
    color: '#1e293b',
    width: '60%',
    textAlign: 'right',
  },
  balanceValue: {
    fontSize: 14,
    color: '#059669',
  },
  
  // Transaction Summary Cards
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    border: '1.5 solid #10b981',
    borderRadius: 4,
    padding: 10,
    width: '23%',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 12,
    textAlign: 'center',
  },
  creditValue: {
    color: '#059669',
  },
  debitValue: {
    color: '#dc2626',
  },
  totalValue: {
    color: '#3b82f6',
  },
  netPositive: {
    color: '#059669',
  },
  netNegative: {
    color: '#dc2626',
  },
  
  // Professional Transaction Table
  tableContainer: {
    border: '1 solid #000000',
    marginBottom: 15,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 5,
    paddingRight: 5,
    borderBottom: '1 solid #000000',
  },
  tableHeaderCell: {
    fontSize: 10,
    color: '#000000',
    paddingLeft: 3,
    paddingRight: 3,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 5,
    paddingRight: 5,
    borderBottom: '0.5 solid #000000',
    minHeight: 20,
  },
  tableRowAlt: {
    backgroundColor: '#f9f9f9',
  },
  tableCell: {
    fontSize: 9,
    color: '#000000',
    paddingLeft: 3,
    paddingRight: 3,
    lineHeight: 1.1,
    borderRight: '0.5 solid #cccccc',
  },
  tableCellCenter: {
    textAlign: 'center',
  },
  tableCellRight: {
    textAlign: 'right',
  },
  typeCreditBold: {
    color: '#008000',
  },
  typeDebitBold: {
    color: '#cc0000',
  },
  amountCredit: {
    color: '#008000',
    textAlign: 'right',
  },
  amountDebit: {
    color: '#cc0000',
    textAlign: 'right',
  },
  
  // Column widths for professional table layout
  colDate: { width: '18%' },
  colType: { width: '12%' },
  colDescription: { width: '45%' },
  colAmount: { width: '25%' },
  
  
  // Utility Styles
  noTransactions: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    padding: 60,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    border: '2 solid #e2e8f0',
  },
  emptyStateIcon: {
    fontSize: 24,
    color: '#d1d5db',
    marginBottom: 12,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginTop: 16,
    marginBottom: 16,
  },
});

// Format currency with Rs. prefix
const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Rs. 0.00';
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${amount < 0 ? '-' : ''}Rs. ${formatted}`;
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN');
};

// Format time for display
const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Truncate text to fit in cells
const truncateText = (text, maxLength) => {
  if (!text) return 'N/A';
  const str = String(text);
  return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
};

// Header Component
const Header = () => (
  <View>
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <Text style={styles.brandedTitle}>QuickPe | Wallet Statement</Text>
        <View style={styles.headerRight}>
          <Text style={styles.dateText}>
            Generated: {new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
      </View>
    </View>
    <View style={styles.brandBar} />
  </View>
);

// Account Information Component
const AccountInfo = ({ userInfo, currentBalance }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Account Information</Text>
    <View style={styles.accountCard}>
      <View style={styles.accountRow}>
        <Text style={styles.accountLabel}>Account Holder:</Text>
        <Text style={styles.accountValue}>
          {`${userInfo.firstName || 'User'} ${userInfo.lastName || ''}`.trim()}
        </Text>
      </View>
      <View style={styles.accountRow}>
        <Text style={styles.accountLabel}>Email Address:</Text>
        <Text style={styles.accountValue}>{userInfo.email || 'Not Available'}</Text>
      </View>
      <View style={styles.accountRow}>
        <Text style={styles.accountLabel}>QuickPe ID:</Text>
        <Text style={styles.accountValue}>{userInfo.quickpeId || 'Not Assigned'}</Text>
      </View>
      <View style={styles.accountRow}>
        <Text style={styles.accountLabel}>Current Balance:</Text>
        <Text style={[styles.accountValue, styles.balanceValue]}>
          {formatCurrency(currentBalance)}
        </Text>
      </View>
    </View>
  </View>
);

// Transaction Summary Component
const Summary = ({ summaryData }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Transaction Summary</Text>
    <View style={styles.summaryGrid}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Txns</Text>
        <Text style={[styles.summaryValue, styles.totalValue]}>{summaryData.totalCount}</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Money Received</Text>
        <Text style={[styles.summaryValue, styles.creditValue]}>
          {formatCurrency(summaryData.totalCredit)}
        </Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Money Sent</Text>
        <Text style={[styles.summaryValue, styles.debitValue]}>
          {formatCurrency(summaryData.totalDebit)}
        </Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Net Flow</Text>
        <Text style={[
          styles.summaryValue, 
          summaryData.netFlow >= 0 ? styles.netPositive : styles.netNegative
        ]}>
          {summaryData.netFlow >= 0 ? '+' : ''}{formatCurrency(summaryData.netFlow)}
        </Text>
      </View>
    </View>
  </View>
);

// Transaction Table Component with pagination support
const TransactionTable = ({ transactions, isFirstPage = false, pageTransactions = [] }) => {
  const displayTransactions = pageTransactions.length > 0 ? pageTransactions : transactions;
  const maxTransactions = isFirstPage ? 5 : 10;
  const limitedTransactions = displayTransactions ? displayTransactions.slice(0, maxTransactions) : [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Transaction History</Text>
      {limitedTransactions && limitedTransactions.length > 0 ? (
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
            <Text style={[styles.tableHeaderCell, styles.colType]}>Type</Text>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
          </View>
          
          {/* Table Rows with Zebra Striping */}
          {limitedTransactions.map((transaction, index) => (
            <View 
              key={transaction.transactionId || index} 
              style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableCell, styles.colDate]}>
                {formatDate(transaction.timestamp || transaction.createdAt)}
              </Text>
              <Text style={[
                styles.tableCell, 
                styles.tableCellCenter, 
                styles.colType,
                transaction.type === 'credit' ? styles.typeCreditBold : styles.typeDebitBold
              ]}>
                {transaction.type === 'credit' ? 'CREDIT' : 'DEBIT'}
              </Text>
              <Text style={[styles.tableCell, styles.colDescription]}>
                {truncateText(transaction.description, 40)}
              </Text>
              <Text style={[
                styles.tableCell, 
                styles.colAmount,
                transaction.type === 'credit' ? styles.amountCredit : styles.amountDebit
              ]}>
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.noTransactions}>
          <Text>No transactions found for the selected period.</Text>
        </View>
      )}
    </View>
  );
};

// Footer component removed to eliminate errors

// Main PDF Document Component with pagination
export const StatementDocument = ({ userInfo, currentBalance, transactions, summaryData }) => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const firstPageTransactions = safeTransactions.slice(0, 5);
  const remainingTransactions = safeTransactions.slice(5);
  
  // Calculate how many additional pages we need (10 transactions per page)
  const additionalPages = [];
  for (let i = 0; i < remainingTransactions.length; i += 10) {
    additionalPages.push(remainingTransactions.slice(i, i + 10));
  }

  return (
    <Document>
      {/* First Page - Account Info + Summary + First 5 Transactions */}
      <Page size="A4" style={styles.page}>
        <Header />
        <View style={styles.contentContainer}>
          <AccountInfo userInfo={userInfo} currentBalance={currentBalance} />
          <Summary summaryData={summaryData} />
          <TransactionTable 
            transactions={firstPageTransactions} 
            isFirstPage={true}
            pageTransactions={firstPageTransactions}
          />
        </View>
      </Page>

      {/* Additional Pages - 10 Transactions Each */}
      {additionalPages.map((pageTransactions, pageIndex) => (
        <Page key={pageIndex + 1} size="A4" style={styles.page}>
          <Header />
          <View style={styles.contentContainer}>
            <TransactionTable 
              transactions={pageTransactions}
              isFirstPage={false}
              pageTransactions={pageTransactions}
            />
          </View>
        </Page>
      ))}
    </Document>
  );
};

// Main PDF Statement Component with error handling
export const PDFStatement = ({ userInfo, currentBalance, transactions, filename }) => {
  try {
    // Validate and sanitize data
    const safeUserInfo = userInfo || {};
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const safeBalance = typeof currentBalance === 'number' ? currentBalance : 0;

    // Calculate summary data with safety checks
    const summaryData = {
      totalCount: safeTransactions.length,
      totalCredit: safeTransactions
        .filter(t => t && t.type === 'credit')
        .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0),
      totalDebit: safeTransactions
        .filter(t => t && t.type === 'debit')
        .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0),
    };
    summaryData.netFlow = summaryData.totalCredit - summaryData.totalDebit;

    // Generate safe filename
    const safeName = safeUserInfo.firstName ? String(safeUserInfo.firstName).replace(/[^a-zA-Z0-9]/g, '') : 'User';
    const pdfFilename = filename || `QuickPe_Statement_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;

    return (
      <PDFDownloadLink
        document={
          <StatementDocument
            userInfo={safeUserInfo}
            currentBalance={safeBalance}
            transactions={safeTransactions}
            summaryData={summaryData}
          />
        }
        fileName={pdfFilename}
        className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
      >
        {({ blob, url, loading, error }) => {
          if (loading) {
            return (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating PDF...</span>
              </>
            );
          }
          
          if (error) {
            console.error('PDF Generation Error:', error);
            return (
              <>
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>PDF Error - Try Again</span>
              </>
            );
          }
          
          return (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export as PDF</span>
            </>
          );
        }}
      </PDFDownloadLink>
    );
  } catch (componentError) {
    console.error('PDFStatement Component Error:', componentError);
    return (
      <div className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span>PDF Unavailable</span>
      </div>
    );
  }
};

export default PDFStatement;
