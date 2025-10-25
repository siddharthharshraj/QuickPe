import React, { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Performance monitoring component
export const PerformanceMonitor = memo(() => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    loadTime: 0,
    renderTime: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId;

    // FPS monitoring
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    // Memory monitoring (if available)
    const measureMemory = () => {
      if (performance.memory) {
        const memory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        setMetrics(prev => ({ ...prev, memory }));
      }
    };

    // Page load time
    const measureLoadTime = () => {
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        setMetrics(prev => ({ ...prev, loadTime }));
      }
    };

    // Start monitoring
    measureFPS();
    measureMemory();
    measureLoadTime();

    // Performance monitoring disabled - was causing page refreshes
    // const memoryInterval = setInterval(measureMemory, 10000);

    // Show/hide based on development mode
    setIsVisible(process.env.NODE_ENV === 'development');

    return () => {
      cancelAnimationFrame(animationId);
      // clearInterval(memoryInterval); // Disabled
    };
  }, []);

  // Toggle visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono z-50 backdrop-blur-sm"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${metrics.fps > 50 ? 'bg-green-400' : metrics.fps > 30 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
            <span>FPS: {metrics.fps}</span>
          </div>
          
          {metrics.memory > 0 && (
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${metrics.memory < 50 ? 'bg-green-400' : metrics.memory < 100 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
              <span>MEM: {metrics.memory}MB</span>
            </div>
          )}
          
          {metrics.loadTime > 0 && (
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${metrics.loadTime < 2000 ? 'bg-green-400' : metrics.loadTime < 5000 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
              <span>LOAD: {Math.round(metrics.loadTime)}ms</span>
            </div>
          )}
        </div>
        
        <div className="text-xs opacity-60 mt-1">
          Press Ctrl+Shift+P to toggle
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

// Performance profiler component
export const PerformanceProfiler = memo(({ id, onRender, children }) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (onRender) {
        onRender(id, renderTime);
      }
      
      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`Slow render detected in ${id}: ${renderTime.toFixed(2)}ms`);
      }
    };
  });

  return children;
});

PerformanceProfiler.displayName = 'PerformanceProfiler';

// Bundle size analyzer component
export const BundleAnalyzer = memo(() => {
  const [bundleInfo, setBundleInfo] = useState(null);

  useEffect(() => {
    // Analyze loaded scripts
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const totalSize = scripts.reduce((acc, script) => {
      // Estimate size based on content length (rough approximation)
      return acc + (script.src.length * 100); // Very rough estimate
    }, 0);

    setBundleInfo({
      scriptCount: scripts.length,
      estimatedSize: Math.round(totalSize / 1024) // KB
    });
  }, []);

  if (process.env.NODE_ENV !== 'development' || !bundleInfo) return null;

  return (
    <div className="fixed top-4 right-4 bg-blue-900 bg-opacity-80 text-white p-2 rounded text-xs font-mono z-50">
      <div>Scripts: {bundleInfo.scriptCount}</div>
      <div>Est. Size: ~{bundleInfo.estimatedSize}KB</div>
    </div>
  );
});

BundleAnalyzer.displayName = 'BundleAnalyzer';

export default PerformanceMonitor;
