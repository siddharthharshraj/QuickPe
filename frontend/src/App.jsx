import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";
import axios from "axios";
import { Signin } from './pages/Signin'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { SendMoney } from './pages/SendMoney'
import { Landing } from './pages/Landing'
import About from './pages/About';
import KPIReports from './pages/KPIReports';
import { Settings } from "./pages/Settings";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

// Environment-aware axios configuration
const isBrowser = typeof window !== 'undefined';
const baseURL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:3000/api'
  );

// Set the base URL for all axios requests
axios.defaults.baseURL = baseURL;
axios.defaults.withCredentials = false;

// Add a request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  return (
    <ErrorBoundary>
       <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/about" element={<About />} />
          <Route path="/kpi-reports" element={<KPIReports />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/send" element={
            <ProtectedRoute>
              <SendMoney />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
