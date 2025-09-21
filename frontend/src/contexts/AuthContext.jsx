import React, { createContext, useState, useEffect, useCallback, startTransition } from 'react';
import apiClient from '../services/api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    startTransition(() => {
      setLoading(true);
    });
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      startTransition(() => {
        setLoading(false);
        setIsAuthenticated(false);
      });
      return false;
    }

    try {
      // Verify token with backend
      const response = await apiClient.get('/auth/verify');
      
      if (response.data.success) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setError(null);
        return true;
      } else {
        throw new Error('Token verification failed');
      }
    } catch (err) {
      console.error('Authentication check failed:', err);
      setError(err);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const login = useCallback(async (email, password) => {
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        startTransition(() => {
          setUser(user);
          setIsAuthenticated(true);
          setLoading(false);
        });
        
        return { success: true };
      }
      
      throw new Error(response.data.message || 'Login failed');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      setError(new Error(errorMsg));
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    startTransition(() => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
