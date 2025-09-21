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

// Import components
import EnhancedErrorBoundary from './components/EnhancedErrorBoundary';
import SafeLazyWrapper from './components/SafeLazyWrapper';
import { useSocket } from './sockets/useSocket';
// import { ConnectionStatus } from './components/ConnectionStatus';
import ProtectedRoute from './components/ProtectedRoute';

// Import lazy components for code splitting
import {
  LazyLanding,
  LazySignin,
  LazySignup,
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
  LazyTradeJournal,
  LazyTradeAnalytics,
  LazyUpgradePage,
  LazySettings,
  LazyLogViewer,
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
  // Removed duplicate socket connection - using GlobalSocketConnection instead
  // const currentUserId = localStorage.getItem('userId');
  // const { isConnected, connectionStatus, reconnectAttempts, lastHeartbeat } = useSocket(currentUserId);

  // Preload critical components on app start (disabled to prevent errors)
  // useEffect(() => {
  //   preloadCriticalComponents();
  // }, []);

  return (
    <QueryProvider>
      <AuthProvider>
        <AppProvider>
          <EnhancedErrorBoundary>
          <GlobalSocketConnection />
          {/* Connection Status Monitor - Disabled to prevent memory issues */}
          {/*
          {currentUserId && (
            <ConnectionStatus
              connectionStatus={connectionStatus}
              reconnectAttempts={reconnectAttempts}
              lastHeartbeat={lastHeartbeat}
              isConnected={isConnected}
            />
          )}
          */}
           <BrowserRouter>
        <Routes>
          <Route path="/signup" element={
            <SafeLazyWrapper fallback={<FormSkeleton />}>
              <LazySignup />
            </SafeLazyWrapper>
          } />
          <Route path="/signin" element={
            <SafeLazyWrapper fallback={<FormSkeleton />}>
              <LazySignin />
            </SafeLazyWrapper>
          } />
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
              <LazyAnalytics />
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
          <Route path="/trade-journal" element={
            <ProtectedRoute>
              <LazyTradeJournal />
            </ProtectedRoute>
          } />
          <Route path="/trade-analytics" element={
            <ProtectedRoute>
              <LazyTradeAnalytics />
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
        
        {/* Performance Monitor - Disabled to prevent memory issues */}
        {/*
        <PerformanceMonitor />
        */}
      </EnhancedErrorBoundary>
      </AppProvider>
      </AuthProvider>
    </QueryProvider>
  )
}

export default App
