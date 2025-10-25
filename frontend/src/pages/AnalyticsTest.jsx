import React from 'react';

const AnalyticsTest = () => {
  console.log('AnalyticsTest component loaded!');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics Test Page</h1>
        <p className="text-gray-600">If you can see this, the route is working!</p>
      </div>
    </div>
  );
};

export default AnalyticsTest;
