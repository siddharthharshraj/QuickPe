import axios from 'axios';

// Environment-aware API base URL configuration for Railway
const getApiBaseUrl = () => {
  // For Railway deployment - check if we're in production
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://quickpe-backend-production.railway.app/api/v1';
  }
  
  // For local development
  return 'http://localhost:5000/api/v1';
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000, // Increased timeout for Railway cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
