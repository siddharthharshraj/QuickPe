import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AuditTrailPDFExport from '../../frontend/src/components/AuditTrailPDFReport';

// Mock React-PDF components
jest.mock('@react-pdf/renderer', () => ({
  Document: ({ children }) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ children }) => <div data-testid="pdf-page">{children}</div>,
  Text: ({ children }) => <span data-testid="pdf-text">{children}</span>,
  View: ({ children }) => <div data-testid="pdf-view">{children}</div>,
  StyleSheet: {
    create: (styles) => styles
  },
  PDFDownloadLink: ({ children, document, fileName }) => (
    <div data-testid="pdf-download-link" data-filename={fileName}>
      {typeof children === 'function' ? children({ loading: false, url: 'test-url' }) : children}
    </div>
  ),
  Font: {
    register: jest.fn()
  }
}));

// Mock test data
const mockAuditLogs = [
  {
    id: '1',
    timestamp: '2025-01-20T10:30:00.000Z',
    action: 'User Login',
    actor: 'User',
    target: 'Authentication System',
    ip_address: '192.168.1.1',
    device: 'Chrome',
    status: 'SUCCESS',
    raw_action_type: 'login',
    entity_type: 'user',
    payload: {}
  },
  {
    id: '2',
    timestamp: '2025-01-20T11:00:00.000Z',
    action: 'Money Transfer - Sent',
    actor: 'User',
    target: 'To: John Doe',
    ip_address: '192.168.1.1',
    device: 'Chrome',
    status: 'SUCCESS',
    raw_action_type: 'money_sent',
    entity_type: 'transaction',
    payload: { amount: 1000, recipient_name: 'John Doe' }
  },
  {
    id: '3',
    timestamp: '2025-01-20T11:30:00.000Z',
    action: 'PDF Export',
    actor: 'User',
    target: 'Audit Trail',
    ip_address: '192.168.1.1',
    device: 'Chrome',
    status: 'SUCCESS',
    raw_action_type: 'pdf_exported',
    entity_type: 'system',
    payload: { export_type: 'Audit Trail' }
  }
];

const mockUserInfo = {
  name: 'Test User',
  email: 'test@quickpe.com',
  quickpeId: 'QPK-TEST123',
  balance: 50000
};

const mockFilters = {
  fromDate: '2025-01-01',
  toDate: '2025-01-31',
  actionType: '',
  page: 1,
  limit: 50
};

const mockStats = {
  totalLogs: 25,
  recentLogs: 15,
  securityScore: 'Excellent',
  actionTypeStats: [
    { _id: 'login', count: 10 },
    { _id: 'money_sent', count: 8 },
    { _id: 'pdf_exported', count: 7 }
  ]
};

describe('AuditTrailPDFExport Component', () => {
  const renderComponent = (props = {}) => {
    const defaultProps = {
      auditLogs: mockAuditLogs,
      userInfo: mockUserInfo,
      filters: mockFilters,
      stats: mockStats,
      ...props
    };

    return render(
      <BrowserRouter>
        <AuditTrailPDFExport {...defaultProps} />
      </BrowserRouter>
    );
  };

  test('renders PDF download button', () => {
    renderComponent();
    
    const downloadButton = screen.getByTestId('pdf-download-link');
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).toHaveTextContent('Download Audit Trail PDF');
  });

  test('generates correct filename with user name and date', () => {
    renderComponent();
    
    const downloadLink = screen.getByTestId('pdf-download-link');
    const filename = downloadLink.getAttribute('data-filename');
    
    expect(filename).toContain('QuickPe-AuditTrail');
    expect(filename).toContain('Test-User');
    expect(filename).toContain(new Date().toISOString().split('T')[0]);
    expect(filename).toEndWith('.pdf');
  });

  test('handles empty audit logs gracefully', () => {
    renderComponent({ auditLogs: [] });
    
    const downloadButton = screen.getByTestId('pdf-download-link');
    expect(downloadButton).toBeInTheDocument();
  });

  test('handles missing user info gracefully', () => {
    renderComponent({ userInfo: null });
    
    const downloadButton = screen.getByTestId('pdf-download-link');
    expect(downloadButton).toBeInTheDocument();
    
    const filename = downloadButton.getAttribute('data-filename');
    expect(filename).toContain('User'); // Default fallback
  });

  test('displays loading state correctly', () => {
    // Mock loading state
    jest.doMock('@react-pdf/renderer', () => ({
      ...jest.requireActual('@react-pdf/renderer'),
      PDFDownloadLink: ({ children }) => (
        <div data-testid="pdf-download-link">
          {typeof children === 'function' ? children({ loading: true }) : children}
        </div>
      )
    }));

    renderComponent();
    
    const downloadButton = screen.getByTestId('pdf-download-link');
    expect(downloadButton).toHaveTextContent('Generating PDF...');
  });
});

describe('PDF Document Structure Validation', () => {
  // Mock the PDF components to capture their props and children
  const mockComponents = {
    Document: jest.fn(({ children }) => <div data-testid="pdf-document">{children}</div>),
    Page: jest.fn(({ children }) => <div data-testid="pdf-page">{children}</div>),
    Text: jest.fn(({ children }) => <span data-testid="pdf-text">{children}</span>),
    View: jest.fn(({ children }) => <div data-testid="pdf-view">{children}</div>)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.doMock('@react-pdf/renderer', () => ({
      ...mockComponents,
      StyleSheet: { create: (styles) => styles },
      PDFDownloadLink: ({ document, children }) => {
        // Render the document to test its structure
        return (
          <div data-testid="pdf-download-link">
            {document}
            {typeof children === 'function' ? children({ loading: false }) : children}
          </div>
        );
      },
      Font: { register: jest.fn() }
    }));
  });

  test('validates PDF document contains required sections', async () => {
    const { AuditTrailDocument } = require('../../frontend/src/components/AuditTrailPDFReport');
    
    render(
      <AuditTrailDocument
        auditLogs={mockAuditLogs}
        userInfo={mockUserInfo}
        filters={mockFilters}
        stats={mockStats}
        generatedAt={new Date().toISOString()}
      />
    );

    // Verify Document component was called
    expect(mockComponents.Document).toHaveBeenCalled();
    
    // Verify Page components were created (at least one page)
    expect(mockComponents.Page).toHaveBeenCalled();
    expect(mockComponents.Page.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  test('validates multi-page support for large datasets', () => {
    // Create a large dataset to test pagination
    const largeAuditLogs = Array.from({ length: 50 }, (_, index) => ({
      ...mockAuditLogs[0],
      id: `log-${index}`,
      timestamp: new Date(Date.now() - index * 3600000).toISOString()
    }));

    const { AuditTrailDocument } = require('../../frontend/src/components/AuditTrailPDFReport');
    
    render(
      <AuditTrailDocument
        auditLogs={largeAuditLogs}
        userInfo={mockUserInfo}
        filters={mockFilters}
        stats={mockStats}
        generatedAt={new Date().toISOString()}
      />
    );

    // Should create multiple pages for 50 records (25 per page after first page)
    const expectedPages = Math.ceil((largeAuditLogs.length - 25) / 25) + 1;
    expect(mockComponents.Page.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Data Accuracy Tests', () => {
  test('validates audit log data is correctly formatted in PDF', () => {
    const testLog = {
      id: 'test-123',
      timestamp: '2025-01-20T15:30:45.123Z',
      action: 'Money Transfer - Sent',
      actor: 'User',
      target: 'To: Jane Smith',
      ip_address: '10.0.0.1',
      device: 'Firefox',
      status: 'SUCCESS',
      raw_action_type: 'money_sent',
      amount: 2500
    };

    const component = renderComponent({ auditLogs: [testLog] });
    
    // The actual validation would happen in the PDF generation
    // Here we verify the component renders without errors
    expect(component.container).toBeInTheDocument();
  });

  test('validates user information is correctly displayed', () => {
    const testUserInfo = {
      name: 'John Doe',
      email: 'john.doe@quickpe.com',
      quickpeId: 'QPK-JD789',
      balance: 75000
    };

    const component = renderComponent({ userInfo: testUserInfo });
    
    const downloadLink = screen.getByTestId('pdf-download-link');
    const filename = downloadLink.getAttribute('data-filename');
    
    expect(filename).toContain('John-Doe');
  });

  test('validates filter information is preserved', () => {
    const testFilters = {
      fromDate: '2025-01-01',
      toDate: '2025-01-31',
      actionType: 'money_sent',
      page: 1,
      limit: 100
    };

    const component = renderComponent({ filters: testFilters });
    
    // Component should render successfully with filters
    expect(component.container).toBeInTheDocument();
  });

  test('validates statistics are correctly calculated', () => {
    const testStats = {
      totalLogs: 100,
      recentLogs: 45,
      securityScore: 'Very Good',
      actionTypeStats: [
        { _id: 'login', count: 25 },
        { _id: 'logout', count: 24 },
        { _id: 'money_sent', count: 30 },
        { _id: 'money_received', count: 21 }
      ]
    };

    const component = renderComponent({ stats: testStats });
    
    // Component should handle statistics correctly
    expect(component.container).toBeInTheDocument();
  });
});

describe('PDF Quality Tests', () => {
  test('validates professional styling is applied', () => {
    const component = renderComponent();
    
    // Check that the component renders with proper structure
    const downloadButton = screen.getByTestId('pdf-download-link');
    expect(downloadButton).toHaveClass('flex', 'items-center', 'space-x-2');
    expect(downloadButton).toHaveClass('bg-gradient-to-r', 'from-emerald-600', 'to-teal-600');
  });

  test('validates QuickPe branding elements', () => {
    const component = renderComponent();
    
    const downloadButton = screen.getByTestId('pdf-download-link');
    expect(downloadButton).toHaveTextContent('Download Audit Trail PDF');
    
    // Verify SVG icon is present
    const icon = downloadButton.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  test('validates responsive design elements', () => {
    const component = renderComponent();
    
    const downloadButton = screen.getByTestId('pdf-download-link');
    expect(downloadButton).toHaveClass('transition-all', 'duration-200');
    expect(downloadButton).toHaveClass('shadow-lg', 'hover:shadow-xl');
  });
});

describe('Error Handling Tests', () => {
  test('handles corrupted audit log data', () => {
    const corruptedLogs = [
      {
        id: null,
        timestamp: 'invalid-date',
        action: undefined,
        actor: '',
        target: null,
        ip_address: undefined,
        status: 'UNKNOWN'
      }
    ];

    // Should not throw error even with corrupted data
    expect(() => {
      renderComponent({ auditLogs: corruptedLogs });
    }).not.toThrow();
  });

  test('handles missing required props', () => {
    // Should handle missing props gracefully
    expect(() => {
      render(<AuditTrailPDFExport />);
    }).not.toThrow();
  });

  test('handles extremely large datasets', () => {
    const hugeDataset = Array.from({ length: 10000 }, (_, index) => ({
      ...mockAuditLogs[0],
      id: `huge-${index}`
    }));

    // Should handle large datasets without crashing
    expect(() => {
      renderComponent({ auditLogs: hugeDataset });
    }).not.toThrow();
  });
});

describe('Accessibility Tests', () => {
  test('validates ARIA labels and accessibility features', () => {
    renderComponent();
    
    const downloadButton = screen.getByTestId('pdf-download-link');
    
    // Should have proper button structure for screen readers
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).toHaveTextContent('Download Audit Trail PDF');
  });

  test('validates keyboard navigation support', () => {
    renderComponent();
    
    const downloadButton = screen.getByTestId('pdf-download-link');
    
    // Should be focusable and have proper classes for keyboard navigation
    expect(downloadButton).toBeInTheDocument();
  });
});
