import axios from 'axios';

// Environment-aware API base URL configuration for Render/Vercel
const getApiBaseUrl = () => {
  // For production deployment - check if we're in production
  if (import.meta.env.PROD) {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    return baseURL;
  }
  
  // For local development
  return 'http://localhost:5001/api/v1';
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000, // Increased timeout for Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token and no-cache headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add no-cache headers to all requests
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear localStorage and redirect to signin
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on signin/signup pages
      if (!window.location.pathname.includes('/signin') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
