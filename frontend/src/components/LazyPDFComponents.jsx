import React, { lazy, Suspense, useState } from 'react';
import { DocumentArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline';

// Lazy load PDF components only when needed
const LazyAnalyticsPDFReport = lazy(() => import('./AnalyticsPDFReport'));
const LazyAuditTrailPDFReport = lazy(() => import('./AuditTrailPDFReport'));
const LazyPDFStatement = lazy(() => import('./PDFStatement'));

// Lightweight PDF loading skeleton
const PDFLoadingSkeleton = () => (
  <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm">Loading PDF generator...</p>
      <p className="text-gray-500 text-xs mt-1">This may take a moment on first load</p>
    </div>
  </div>
);

// Memory-efficient PDF wrapper
export const OptimizedPDFWrapper = ({ 
  type, 
  data, 
  filename, 
  title = "Generate PDF Report",
  className = "" 
}) => {
  const [showPDF, setShowPDF] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    setShowPDF(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      setIsGenerating(false);
    }, 500);
  };

  const getPDFComponent = () => {
    switch (type) {
      case 'analytics':
        return <LazyAnalyticsPDFReport data={data} filename={filename} />;
      case 'audit':
        return <LazyAuditTrailPDFReport data={data} filename={filename} />;
      case 'statement':
        return <LazyPDFStatement data={data} filename={filename} />;
      default:
        return <div>Unsupported PDF type</div>;
    }
  };

  if (!showPDF) {
    return (
      <div className={`bg-white p-4 rounded-lg border border-gray-200 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DocumentArrowDownIcon className="h-5 w-5 text-emerald-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">{title}</h4>
              <p className="text-xs text-gray-500">Click to generate PDF report</p>
            </div>
          </div>
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="flex items-center px-3 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Suspense fallback={<PDFLoadingSkeleton />}>
        {getPDFComponent()}
      </Suspense>
    </div>
  );
};

// Lightweight CSV export alternative
export const CSVExportButton = ({ data, filename, className = "" }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      // Convert data to CSV
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => 
            JSON.stringify(row[header] || '')
          ).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={exportToCSV}
      disabled={isExporting}
      className={`flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors ${className}`}
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Exporting...
        </>
      ) : (
        <>
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Export CSV
        </>
      )}
    </button>
  );
};

export default OptimizedPDFWrapper;
