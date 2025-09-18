import React, { Suspense } from 'react';
import LazyLoadErrorBoundary from './LazyLoadErrorBoundary';

const SafeLazyWrapper = ({ children, fallback }) => {
  return (
    <LazyLoadErrorBoundary>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};

export default SafeLazyWrapper;
