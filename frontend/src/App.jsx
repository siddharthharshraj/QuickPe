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

// Import components
import EnhancedErrorBoundary from './components/EnhancedErrorBoundary';
import SafeLazyWrapper from './components/SafeLazyWrapper';
import PerformanceMonitor from './components/PerformanceMonitor';
import { useSocket } from './sockets/useSocket';
import { ConnectionStatus } from './components/ConnectionStatus';
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
  LazyTradeJournal,
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

// Global Socket Connection Component
const GlobalSocketConnection = () => {
  // Initialize global socket connection
  const currentUserId = localStorage.getItem('userId');
  const { socket, isConnected, connectionStatus, reconnectAttempts, lastHeartbeat } = useSocket(currentUserId);

  useEffect(() => {
    if (currentUserId && socket) {
      console.log('🌐 Global Socket.IO connection established for user:', currentUserId);
      console.log('📡 Connection status:', isConnected ? 'Connected' : 'Disconnected');
    }
  }, [currentUserId, socket, isConnected]);
  
  return null;
};

function App() {
  const currentUserId = localStorage.getItem('userId');
  const { isConnected, connectionStatus, reconnectAttempts, lastHeartbeat } = useSocket(currentUserId);

  // Preload critical components on app start (disabled to prevent errors)
  // useEffect(() => {
  //   preloadCriticalComponents();
  // }, []);

  return (
    <QueryProvider>
      <EnhancedErrorBoundary>
        <GlobalSocketConnection />
        {/* Connection Status Monitor */}
        {currentUserId && (
          <ConnectionStatus 
            connectionStatus={connectionStatus}
            reconnectAttempts={reconnectAttempts}
            lastHeartbeat={lastHeartbeat}
            isConnected={isConnected}
          />
        )}
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
          <Route path="/kpi-reports" element={
            <Suspense fallback={<DashboardSkeleton />}>
              <LazyKPIReports />
            </Suspense>
          } />
          <Route path="/about" element={
            <Suspense fallback={<DashboardSkeleton />}>
              <LazyAbout />
            </Suspense>
          } />
          <Route path="/audit-trail" element={
            <ProtectedRoute>
              <Suspense fallback={<DashboardSkeleton />}>
                <LazyAuditTrail />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Suspense fallback={<DashboardSkeleton />}>
                <LazyDashboardHome />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/send-money" element={
            <ProtectedRoute>
              <Suspense fallback={<DashboardSkeleton />}>
                <LazySendMoneyPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/send" element={
            <ProtectedRoute>
              <Suspense fallback={<DashboardSkeleton />}>
                <LazySendMoney />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/transaction-history" element={
            <ProtectedRoute>
              <Suspense fallback={<DashboardSkeleton />}>
                <LazyTransactionHistory />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Suspense fallback={<AnalyticsSkeleton />}>
                <LazyAnalytics />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/ai-assistant" element={
            <ProtectedRoute>
              <Suspense fallback={<DashboardSkeleton />}>
                <LazyAIAssistant />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Suspense fallback={<DashboardSkeleton />}>
                <LazySettings />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/logs" element={
            <ProtectedRoute>
              <Suspense fallback={<DashboardSkeleton />}>
                <LazyLogViewer />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Suspense fallback={<DashboardSkeleton />}>
                <LazyAdminDashboard />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/trade-journal" element={
            <ProtectedRoute>
              <Suspense fallback={<DashboardSkeleton />}>
                <LazyTradeJournal />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/contact" element={
            <Suspense fallback={<DashboardSkeleton />}>
              <LazyContact />
            </Suspense>
          } />
          <Route path="/" element={
            <Suspense fallback={<DashboardSkeleton />}>
              <LazyLanding />
            </Suspense>
          } />
          <Route path="*" element={
            <Suspense fallback={<DashboardSkeleton />}>
              <LazyNotFound />
            </Suspense>
          } />
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
        
        {/* Performance Monitor */}
        <PerformanceMonitor />
      </EnhancedErrorBoundary>
    </QueryProvider>
  )
}

export default App
