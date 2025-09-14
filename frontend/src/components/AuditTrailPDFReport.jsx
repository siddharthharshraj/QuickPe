import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ]
});

// Professional styles for bank-grade audit reports
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 0,
    fontFamily: 'Helvetica',
  },
  
  // Header styles
  header: {
    backgroundColor: '#059669',
    padding: 20,
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  headerRight: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  generatedDate: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
  },

  // Content container
  content: {
    padding: 20,
    flex: 1,
  },

  // Report metadata section
  metadataSection: {
    backgroundColor: '#F8FAFC',
    border: '1pt solid #059669',
    borderRadius: 4,
    padding: 15,
    marginBottom: 20,
  },
  metadataTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 10,
    textAlign: 'center',
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metadataLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    width: 120,
  },
  metadataValue: {
    fontSize: 10,
    color: '#1F2937',
    flex: 1,
  },

  // Audit table styles
  tableSection: {
    marginTop: 20,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  
  // Table header
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottom: '1pt solid #D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  headerCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  
  // Table rows
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #E5E7EB',
    paddingVertical: 6,
    paddingHorizontal: 5,
    minHeight: 25,
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  
  // Table cells with specific widths
  cellDateTime: {
    width: '18%',
    fontSize: 8,
    color: '#374151',
    paddingRight: 5,
  },
  cellAction: {
    width: '22%',
    fontSize: 8,
    color: '#374151',
    paddingRight: 5,
  },
  cellActor: {
    width: '12%',
    fontSize: 8,
    color: '#374151',
    paddingRight: 5,
    textAlign: 'center',
  },
  cellTarget: {
    width: '25%',
    fontSize: 8,
    color: '#374151',
    paddingRight: 5,
  },
  cellIP: {
    width: '15%',
    fontSize: 8,
    color: '#374151',
    paddingRight: 5,
    textAlign: 'center',
  },
  cellStatus: {
    width: '8%',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Status colors
  statusSuccess: {
    color: '#059669',
  },
  statusFailure: {
    color: '#DC2626',
  },
  statusWarning: {
    color: '#D97706',
  },

  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#059669',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  footerText: {
    fontSize: 8,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  pageNumber: {
    fontSize: 8,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  copyright: {
    fontSize: 8,
    color: '#FFFFFF',
    opacity: 0.8,
  },

  // Summary section
  summarySection: {
    backgroundColor: '#EFF6FF',
    border: '1pt solid #3B82F6',
    borderRadius: 4,
    padding: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 9,
    color: '#1F2937',
    lineHeight: 1.4,
  },
});

// Header component
const Header = ({ userInfo, filters, generatedAt }) => (
  <View style={styles.header}>
    <View>
      <Text style={styles.headerTitle}>QuickPe - Your Digital Wallet</Text>
      <Text style={styles.headerSubtitle}>Comprehensive Audit Trail System</Text>
    </View>
    <View style={styles.headerRight}>
      <Text style={styles.reportTitle}>Audit Trail Report</Text>
      <Text style={styles.generatedDate}>
        Generated on {new Date(generatedAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })} at {new Date(generatedAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        })} IST
      </Text>
    </View>
  </View>
);

// Report metadata component
const ReportMetadata = ({ userInfo, filters, totalRecords }) => (
  <View style={styles.metadataSection}>
    <Text style={styles.metadataTitle}>Report Metadata & Account Information</Text>
    
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>Account Holder:</Text>
      <Text style={styles.metadataValue}>{userInfo?.name || 'N/A'}</Text>
    </View>
    
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>Email Address:</Text>
      <Text style={styles.metadataValue}>{userInfo?.email || 'N/A'}</Text>
    </View>
    
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>QuickPe ID:</Text>
      <Text style={styles.metadataValue}>{userInfo?.quickpeId || 'N/A'}</Text>
    </View>
    
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>Current Balance:</Text>
      <Text style={styles.metadataValue}>Rs {userInfo?.balance?.toLocaleString() || '0'}</Text>
    </View>
    
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>Report Period:</Text>
      <Text style={styles.metadataValue}>
        {filters?.fromDate ? new Date(filters.fromDate).toLocaleDateString() : 'All time'} - {filters?.toDate ? new Date(filters.toDate).toLocaleDateString() : 'Present'}
      </Text>
    </View>
    
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>Total Records:</Text>
      <Text style={styles.metadataValue}>{totalRecords}</Text>
    </View>
    
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>Filters Applied:</Text>
      <Text style={styles.metadataValue}>
        {filters?.actionType ? `Action: ${filters.actionType}` : 'No filters'}
      </Text>
    </View>
  </View>
);

// Audit table component
const AuditTable = ({ auditLogs, startIndex = 0 }) => (
  <View style={styles.tableSection}>
    {startIndex === 0 && (
      <Text style={styles.tableTitle}>Detailed Audit Trail</Text>
    )}
    
    {/* Table Header */}
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, styles.cellDateTime]}>Date & Time</Text>
      <Text style={[styles.headerCell, styles.cellAction]}>Action</Text>
      <Text style={[styles.headerCell, styles.cellActor]}>Actor</Text>
      <Text style={[styles.headerCell, styles.cellTarget]}>Target / Entity</Text>
      <Text style={[styles.headerCell, styles.cellIP]}>IP / Device</Text>
      <Text style={[styles.headerCell, styles.cellStatus]}>Status</Text>
    </View>
    
    {/* Table Rows */}
    {auditLogs.map((log, index) => (
      <View 
        key={log.id} 
        style={[
          styles.tableRow, 
          (startIndex + index) % 2 === 1 ? styles.tableRowAlt : null
        ]}
      >
        <Text style={styles.cellDateTime}>
          {new Date(log.timestamp).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        
        <Text style={styles.cellAction}>{log.action}</Text>
        
        <Text style={styles.cellActor}>{log.actor}</Text>
        
        <Text style={styles.cellTarget}>{log.target}</Text>
        
        <Text style={styles.cellIP}>
          {log.ip_address !== 'N/A' ? log.ip_address : 'N/A'}
          {log.device !== 'N/A' && ` / ${log.device}`}
        </Text>
        
        <Text style={[
          styles.cellStatus,
          log.status === 'SUCCESS' ? styles.statusSuccess :
          log.status === 'FAILURE' ? styles.statusFailure :
          styles.statusWarning
        ]}>
          {log.status}
        </Text>
      </View>
    ))}
  </View>
);

// Footer component
const Footer = () => (
  <View style={styles.footer} fixed>
    <View style={styles.footerLeft}>
      <Text style={styles.footerText}>Developed by: Siddharth Harsh Raj</Text>
      <Text style={styles.footerText}>Email: contact@siddharth-dev.tech</Text>
      <Text style={styles.footerText}>LinkedIn: siddharthharshraj</Text>
    </View>
    <View style={styles.footerRight}>
      <Text 
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
      <Text style={styles.copyright}>© 2025 QuickPe. All rights reserved.</Text>
    </View>
  </View>
);

// Summary section component
const SummarySection = ({ auditLogs, stats }) => {
  const actionCounts = auditLogs.reduce((acc, log) => {
    acc[log.raw_action_type] = (acc[log.raw_action_type] || 0) + 1;
    return acc;
  }, {});

  const topActions = Object.entries(actionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <View style={styles.summarySection}>
      <Text style={styles.summaryTitle}>Audit Trail Summary</Text>
      <Text style={styles.summaryText}>
        This report contains {auditLogs.length} audit trail entries showing all user activities, 
        transactions, and system interactions. The most frequent activities are: {topActions.map(([action, count]) => 
        `${action.replace(/_/g, ' ')} (${count})`).join(', ')}.
        {'\n\n'}
        All entries are listed in chronological order (most recent first) and include complete 
        details about each action performed, including timestamps, IP addresses, and result status.
        This audit trail ensures complete accountability and traceability of all system interactions.
      </Text>
    </View>
  );
};

// Main PDF document component
const AuditTrailDocument = ({ auditLogs, userInfo, filters, stats, generatedAt }) => {
  const recordsPerPage = 25;
  const pages = [];
  
  // First page with metadata and summary
  pages.push(
    <Page key="page-1" size="A4" style={styles.page}>
      <Header userInfo={userInfo} filters={filters} generatedAt={generatedAt} />
      <View style={styles.content}>
        <ReportMetadata 
          userInfo={userInfo} 
          filters={filters} 
          totalRecords={auditLogs.length} 
        />
        <SummarySection auditLogs={auditLogs} stats={stats} />
        {auditLogs.length > 0 && (
          <AuditTable 
            auditLogs={auditLogs.slice(0, Math.min(recordsPerPage, auditLogs.length))} 
            startIndex={0}
          />
        )}
      </View>
      <Footer />
    </Page>
  );

  // Additional pages for remaining audit logs
  for (let i = recordsPerPage; i < auditLogs.length; i += recordsPerPage) {
    const pageAuditLogs = auditLogs.slice(i, i + recordsPerPage);
    pages.push(
      <Page key={`page-${Math.floor(i / recordsPerPage) + 2}`} size="A4" style={styles.page}>
        <Header userInfo={userInfo} filters={filters} generatedAt={generatedAt} />
        <View style={styles.content}>
          <AuditTable auditLogs={pageAuditLogs} startIndex={i} />
        </View>
        <Footer />
      </Page>
    );
  }

  return <Document>{pages}</Document>;
};

// Export button component
const AuditTrailPDFExport = ({ auditLogs, userInfo, filters, stats }) => {
  const generatedAt = new Date().toISOString();
  
  const fileName = `QuickPe-AuditTrail-${userInfo?.name?.replace(/\s+/g, '-') || 'User'}-${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <AuditTrailDocument
          auditLogs={auditLogs}
          userInfo={userInfo}
          filters={filters}
          stats={stats}
          generatedAt={generatedAt}
        />
      }
      fileName={fileName}
      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
    >
      {({ blob, url, loading, error }) => (
        <>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{loading ? 'Generating PDF...' : 'Download Audit Trail PDF'}</span>
        </>
      )}
    </PDFDownloadLink>
  );
};

export default AuditTrailPDFExport;
