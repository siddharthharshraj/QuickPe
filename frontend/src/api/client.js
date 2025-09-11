import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Environment-aware baseURL configuration
const isBrowser = typeof window !== 'undefined';
const baseURL = process.env.NEXT_PUBLIC_API_URL || 
  (isBrowser 
    ? '/api/v1' 
    : `http://localhost:${process.env.PORT || 3000}/api/v1`
  );

// Create axios instance with default config
const apiClient = axios.create({
  baseURL,
  timeout: 10000, // 10 seconds
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add auth token
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

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
