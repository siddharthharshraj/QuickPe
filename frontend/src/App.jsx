import React, { useEffect } from 'react';
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
import ErrorBoundary from './components/ErrorBoundary';
import { useSocket } from './sockets/useSocket';
import { ConnectionStatus } from './components/ConnectionStatus';

// Import pages
import Landing from './pages/Landing';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import DashboardHome from './pages/DashboardHome';
import SendMoney from './pages/SendMoney';
import SendMoneyPage from './pages/SendMoneyPage';
import TransactionHistory from './pages/TransactionHistory';
import Analytics from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';
import Contact from './pages/Contact';
import AuditTrail from './pages/AuditTrail';
import About from './pages/About';
import KPIReports from './pages/KPIReports';
import AdminDashboard from './pages/AdminDashboard';
import TradeJournal from './pages/TradeJournalFixed';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Import components
import ProtectedRoute from './components/ProtectedRoute';

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

  return (
    <QueryProvider>
      <ErrorBoundary>
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
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/kpi-reports" element={<KPIReports />} />
          <Route path="/about" element={<About />} />
          <Route path="/audit-trail" element={
            <ProtectedRoute>
              <AuditTrail />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardHome />
            </ProtectedRoute>
          } />
          <Route path="/send-money" element={
            <ProtectedRoute>
              <SendMoneyPage />
            </ProtectedRoute>
          } />
          <Route path="/send" element={
            <ProtectedRoute>
              <SendMoney />
            </ProtectedRoute>
          } />
          <Route path="/transaction-history" element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/ai-assistant" element={
            <ProtectedRoute>
              <AIAssistant />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/trade-journal" element={
            <ProtectedRoute>
              <TradeJournal />
            </ProtectedRoute>
          } />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<NotFound />} />
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
    </ErrorBoundary>
    </QueryProvider>
  )
}

export default App
