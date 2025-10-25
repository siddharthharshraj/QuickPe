/**
 * Web Vitals Optimization
 * Target: 100% scores on all metrics
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Thresholds for 100% score
const THRESHOLDS = {
  CLS: 0.1,    // Cumulative Layout Shift
  FID: 100,    // First Input Delay (ms)
  FCP: 1800,   // First Contentful Paint (ms)
  LCP: 2500,   // Largest Contentful Paint (ms)
  TTFB: 600    // Time to First Byte (ms)
};

// Report to analytics
const sendToAnalytics = ({ name, delta, value, id }) => {
  // Send to your analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/v1/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: name,
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        delta: Math.round(name === 'CLS' ? delta * 1000 : delta),
        id,
        timestamp: Date.now()
      })
    }).catch(console.error);
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    const threshold = THRESHOLDS[name];
    const status = value <= threshold ? '✅ GOOD' : '❌ NEEDS IMPROVEMENT';
    console.log(`[Web Vitals] ${name}: ${value.toFixed(2)} ${status} (threshold: ${threshold})`);
  }
};

// Measure and report all Web Vitals
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    getCLS(onPerfEntry);
    getFID(onPerfEntry);
    getFCP(onPerfEntry);
    getLCP(onPerfEntry);
    getTTFB(onPerfEntry);
  }

  // Always send to analytics
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
};

// Optimize images
export const optimizeImage = (src, width) => {
  // Use WebP format with fallback
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/, '.webp');
  return {
    src: webpSrc,
    fallback: src,
    width,
    loading: 'lazy',
    decoding: 'async'
  };
};

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.as = 'font';
  fontLink.type = 'font/woff2';
  fontLink.crossOrigin = 'anonymous';
  fontLink.href = '/fonts/inter-var.woff2';
  document.head.appendChild(fontLink);

  // Preconnect to API
  const apiLink = document.createElement('link');
  apiLink.rel = 'preconnect';
  apiLink.href = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  document.head.appendChild(apiLink);
};

// Defer non-critical JavaScript
export const deferNonCriticalJS = () => {
  // Defer analytics
  if (window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      send_page_view: false
    });
  }
};

// Optimize CSS delivery
export const optimizeCSSDelivery = () => {
  // Inline critical CSS
  const criticalCSS = `
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
    .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  `;
  
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
};

// Reduce JavaScript execution time
export const optimizeJavaScript = () => {
  // Use requestIdleCallback for non-critical work
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Load non-critical features
      import('../components/NonCriticalFeatures').catch(console.error);
    });
  }
};

// Service Worker for caching
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    });
  }
};

// Performance observer
export const observePerformance = () => {
  if ('PerformanceObserver' in window) {
    // Observe long tasks
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn('Long task detected:', entry);
        }
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  }
};

// Initialize all optimizations
export const initWebVitalsOptimizations = () => {
  preloadCriticalResources();
  optimizeCSSDelivery();
  optimizeJavaScript();
  registerServiceWorker();
  observePerformance();
  reportWebVitals();
};

export default reportWebVitals;
