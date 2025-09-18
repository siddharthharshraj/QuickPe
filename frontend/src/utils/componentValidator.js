// Component validation utility to prevent lazy loading errors
export const validateComponent = (component, componentName) => {
  if (!component) {
    console.error(`Component ${componentName} is null or undefined`);
    return false;
  }

  if (typeof component !== 'function' && typeof component !== 'object') {
    console.error(`Component ${componentName} is not a valid React component`);
    return false;
  }

  return true;
};

export const createErrorFallback = (componentName) => {
  return () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Component Error
        </h3>
        
        <p className="text-sm text-gray-500 mb-6">
          The {componentName} component failed to load. This might be a temporary issue.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Refresh Page
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export const logComponentError = (componentName, error) => {
  console.error(`[Component Error] ${componentName}:`, error);
  
  // Send to error reporting service in production
  if (process.env.NODE_ENV === 'production') {
    // Replace with your error reporting service
    // errorReportingService.captureException(error, { component: componentName });
  }
};

export default {
  validateComponent,
  createErrorFallback,
  logComponentError
};
