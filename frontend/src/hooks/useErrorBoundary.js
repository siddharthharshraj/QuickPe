// Enhanced error boundary hook for better error handling
import { useState, useCallback } from 'react';
import logger from '../utils/logger';
import { announceError } from '../utils/accessibility';

export const useErrorBoundary = () => {
  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  const captureError = useCallback((error, errorInfo = null) => {
    setError(error);
    setErrorInfo(errorInfo);

    // Log error with context
    logger.error('Error boundary caught error', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      errorBoundary: true
    }, 'ERROR_BOUNDARY');

    // Announce to screen readers
    announceError(`An error occurred: ${error.message}`);

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Integration with error reporting service
      window.gtag?.('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
    setErrorInfo(null);
    logger.info('Error boundary reset', null, 'ERROR_BOUNDARY');
  }, []);

  const retry = useCallback(() => {
    resetError();
    // Force re-render
    window.location.reload();
  }, [resetError]);

  return {
    error,
    errorInfo,
    captureError,
    resetError,
    retry,
    hasError: error !== null
  };
};

// Hook for handling async errors
export const useAsyncError = () => {
  const { captureError } = useErrorBoundary();

  const throwError = useCallback((error) => {
    captureError(error);
  }, [captureError]);

  return throwError;
};

// Hook for API error handling
export const useApiError = () => {
  const [apiErrors, setApiErrors] = useState({});

  const setError = useCallback((key, error) => {
    setApiErrors(prev => ({
      ...prev,
      [key]: {
        message: error.userMessage || error.message,
        code: error.errorCode,
        timestamp: new Date().toISOString(),
        retryable: error.retryable || false
      }
    }));

    logger.error(`API Error [${key}]`, error, 'API_ERROR');
    announceError(error.userMessage || error.message);
  }, []);

  const clearError = useCallback((key) => {
    setApiErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setApiErrors({});
  }, []);

  const hasError = useCallback((key) => {
    return key ? !!apiErrors[key] : Object.keys(apiErrors).length > 0;
  }, [apiErrors]);

  const getError = useCallback((key) => {
    return apiErrors[key] || null;
  }, [apiErrors]);

  return {
    apiErrors,
    setError,
    clearError,
    clearAllErrors,
    hasError,
    getError
  };
};

export default useErrorBoundary;
