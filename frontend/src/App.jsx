import React, { useEffect, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Import providers
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/GlobalAppContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';

// Import components
import EnhancedErrorBoundary from './components/EnhancedErrorBoundary';
import SafeLazyWrapper from './components/SafeLazyWrapper';
import { useSocket } from './sockets/useSocket';
import ProtectedRoute from './components/ProtectedRoute';

// Import lazy components for code splitting
import {
  LazyLanding,
  LazySignin,
  LazySignup,
  LazyResetPassword,
  LazyDashboardHome,
  LazySendMoney,
  LazySendMoneyPage,
  LazyTransactionHistory,
  LazyAnalytics,
  LazyAIAssistant,
  LazyContact,
  LazyAuditTrail,
  LazyAbout,
  LazyKPIReports,
  LazyAdminDashboard,
  LazyAdminLogs,
  LazyAdminDatabase,
  LazyUpgradePage,
  LazySettings,
  LazyLogViewer,
  LazyMoneyRequests,
  LazyNotFound,
  DashboardSkeleton,
  FormSkeleton,
  AnalyticsSkeleton
} from './components/LazyComponents';

// Import styles
import './App.css';

// Using apiClient from api/client.js for all API calls

// Global Socket Connection Component (Optimized)
const GlobalSocketConnection = () => {
  const currentUserId = localStorage.getItem('userId');
  const { socket, isConnected, connectionStatus, reconnectAttempts, lastHeartbeat } = useSocket(currentUserId, (notification) => {
    // Handle notifications globally
    console.log('🌐 Global notification received:', notification);
  });

  useEffect(() => {
    if (currentUserId && socket) {
      console.log('🌐 Global Socket.IO connection established for user:', currentUserId);
    }
  }, [currentUserId, socket]);

  return null;
};

function App() {
  // Using GlobalSocketConnection for socket management

  return (
    <QueryProvider>
      <AuthProvider>
        <AnalyticsProvider>
          <AppProvider>
          <EnhancedErrorBoundary>
          <GlobalSocketConnection />
           <BrowserRouter>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        }>
        <Routes>
          <Route path="/signup" element={<LazySignup />} />
          <Route path="/signin" element={<LazySignin />} />
          <Route path="/reset-password" element={<LazyResetPassword />} />
          <Route path="/kpi-reports" element={<LazyKPIReports />} />
          <Route path="/about" element={<LazyAbout />} />
          <Route path="/audit-trail" element={
            <ProtectedRoute>
              <LazyAuditTrail />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <LazyDashboardHome />
            </ProtectedRoute>
          } />
          <Route path="/send-money" element={
            <ProtectedRoute>
              <LazySendMoneyPage />
            </ProtectedRoute>
          } />
          <Route path="/send" element={
            <ProtectedRoute>
              <LazySendMoney />
            </ProtectedRoute>
          } />
          <Route path="/transaction-history" element={
            <ProtectedRoute>
              <LazyTransactionHistory />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>}>
                {React.createElement(React.lazy(() => import('./pages/AnalyticsV2')))}
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/request-money" element={
            <ProtectedRoute>
              <Suspense fallback={<FormSkeleton />}>
                {React.createElement(React.lazy(() => import('./pages/RequestMoney')))}
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/ai-assistant" element={
            <ProtectedRoute>
              <LazyAIAssistant />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <LazySettings />
            </ProtectedRoute>
          } />
          <Route path="/money-requests" element={
            <ProtectedRoute>
              <LazyMoneyRequests />
            </ProtectedRoute>
          } />
          <Route path="/logs" element={
            <ProtectedRoute>
              <LazyLogViewer />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <LazyAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/logs" element={
            <ProtectedRoute>
              <LazyAdminLogs />
            </ProtectedRoute>
          } />
          <Route path="/admin/database" element={
            <ProtectedRoute>
              <LazyAdminDatabase />
            </ProtectedRoute>
          } />
          <Route path="/upgrade" element={
            <ProtectedRoute>
              <LazyUpgradePage />
            </ProtectedRoute>
          } />
          <Route path="/contact" element={<LazyContact />} />
          <Route path="/" element={<LazyLanding />} />
          <Route path="*" element={<LazyNotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#059669',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fff',
            },
          },
        }}
      />
      </EnhancedErrorBoundary>
      </AppProvider>
        </AnalyticsProvider>
      </AuthProvider>
    </QueryProvider>
  )
}

export default App
