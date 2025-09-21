import React, { Suspense, lazy } from 'react';
import PageSkeleton from './PageSkeleton';

// Create a safe lazy loader that handles errors
const createSafeLazyComponent = (importFunction, componentName) => {
  return lazy(() => 
    importFunction()
      .then(module => {
        // Ensure we have a valid component
        if (module && (module.default || module[componentName])) {
          return { default: module.default || module[componentName] };
        }
        throw new Error(`Component ${componentName} not found in module`);
      })
      .catch(error => {
        console.error(`Failed to load component ${componentName}:`, error);
        // Return a fallback component
        return {
          default: () => (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Component Loading Error
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  The {componentName} component could not be loaded.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )
        };
      })
  );
};

// Optimized lazy component wrapper with preloading and skeleton support
const createOptimizedLazyComponent = (importFn, componentName, useSkeleton = false) => {
  const LazyComponent = lazy(() => importFn().catch(error => {
    console.error(`Failed to load component ${componentName}:`, error);
    return {
      default: () => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Component Load Error</h2>
            <p className="text-gray-600 mb-4">Failed to load {componentName}. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    };
  }));
  
  // Add preload method
  LazyComponent.preload = importFn;
  
  return React.forwardRef((props, ref) => {
    const [isPending, startTransition] = React.useTransition();
    
    // Preload the component when it mounts
    React.useEffect(() => {
      startTransition(() => {
        LazyComponent.preload();
      });
    }, []);
    
    const fallback = useSkeleton ? (
      <PageSkeleton type="dashboard" />
    ) : (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
    
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    );
  });
};

// Safe lazy load all major pages
export const LazyLanding = createSafeLazyComponent(() => import('../pages/Landing'), 'Landing');
export const LazySignin = createSafeLazyComponent(() => import('../pages/Signin'), 'Signin');
export const LazySignup = createSafeLazyComponent(() => import('../pages/Signup'), 'Signup');
export const LazyDashboardHome = createOptimizedLazyComponent(() => import('../pages/DashboardHome'), 'DashboardHome', true);
export const LazySendMoney = createSafeLazyComponent(() => import('../pages/SendMoney'), 'SendMoney');
export const LazySendMoneyPage = createOptimizedLazyComponent(() => import('../pages/SendMoneyPage'), 'SendMoneyPage');
export const LazyTransactionHistory = createOptimizedLazyComponent(() => import('../pages/TransactionHistory'), 'TransactionHistory', true);
export const LazyAnalytics = createOptimizedLazyComponent(() => import('../pages/Analytics'), 'Analytics', true);
export const LazyAIAssistant = createOptimizedLazyComponent(() => import('../pages/AIAssistant'), 'AIAssistant');
export const LazyContact = createOptimizedLazyComponent(() => import('../pages/Contact'), 'Contact');
export const LazyAuditTrail = createSafeLazyComponent(() => import('../pages/AuditTrail'), 'AuditTrail');
export const LazyAbout = createSafeLazyComponent(() => import('../pages/About'), 'About');
export const LazyKPIReports = createSafeLazyComponent(() => import('../pages/KPIReports'), 'KPIReports');
export const LazyAdminDashboard = createOptimizedLazyComponent(() => import('../pages/admin/AdminDashboard'), 'AdminDashboard', true);
export const LazyAdminLogs = createOptimizedLazyComponent(() => import('../pages/AdminLogs'), 'AdminLogs');
export const LazyAdminDatabase = createOptimizedLazyComponent(() => import('../pages/AdminDatabase'), 'AdminDatabase');
export const LazyTradeJournal = createSafeLazyComponent(() => import('../pages/TradeJournalFixed'), 'TradeJournalFixed');
export const LazyTradeAnalytics = createOptimizedLazyComponent(() => import('../pages/TradeAnalytics'), 'TradeAnalytics', true);
export const LazyUpgradePage = createSafeLazyComponent(() => import('../pages/UpgradePage'), 'UpgradePage');
export const LazySettings = createOptimizedLazyComponent(() => import('../pages/Settings'), 'Settings');
export const LazyLogViewer = createSafeLazyComponent(() => import('../pages/LogViewer'), 'LogViewer');
export const LazyNotFound = createSafeLazyComponent(() => import('../pages/NotFound'), 'NotFound');

// Safe lazy load heavy components
export const LazyAnalyticsDashboard = createSafeLazyComponent(() => import('./AnalyticsDashboard'), 'AnalyticsDashboard');
export const LazyAnalyticsPDFReport = createSafeLazyComponent(() => import('./AnalyticsPDFReport'), 'AnalyticsPDFReport');
export const LazyAuditTrailPDFReport = createSafeLazyComponent(() => import('./AuditTrailPDFReport'), 'AuditTrailPDFReport');
export const LazyMarketDataWidget = createSafeLazyComponent(() => import('./MarketDataWidget'), 'MarketDataWidget');
export const LazyAdminAIChat = createSafeLazyComponent(() => import('./AdminAIChat'), 'AdminAIChat');

// Skeleton components (keeping the existing ones)
export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-4">
    <div className="max-w-7xl mx-auto">
      {/* Header skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </div>
      
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const FormSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-6 animate-pulse"></div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
      <div className="h-10 bg-gray-200 rounded mt-6 animate-pulse"></div>
    </div>
  </div>
);

export const AnalyticsSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-4">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
        ))}
      </div>
      
      {/* Chart skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);

// Safe preload function (disabled by default to prevent errors)
export const preloadCriticalComponents = () => {
  // Disabled to prevent component loading errors
  console.log('Component preloading disabled to prevent errors');
};

// Progressive loader component
export const ProgressiveLoader = ({ children, fallback, delay = 0 }) => {
  const [showContent, setShowContent] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShowContent(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  return showContent ? children : fallback;
};

export default {
  LazyLanding,
  LazySignin,
  LazySignup,
  LazyDashboardHome,
  LazySendMoney,
  LazySendMoneyPage,
  LazyTransactionHistory,
  LazyAnalytics,
  LazyAIAssistant,
  LazyContact,
  LazyAuditTrail,
  LazyAbout,
  LazyKPIReports,
  LazyAdminDashboard,
  LazyTradeJournal,
  LazySettings,
  LazyNotFound,
  DashboardSkeleton,
  FormSkeleton,
  AnalyticsSkeleton,
  ProgressiveLoader
};
