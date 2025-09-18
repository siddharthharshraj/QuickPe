import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualScrolling, useThrottle } from '../utils/performance';

// Virtualized list component for large datasets
export const VirtualizedList = memo(({
  items = [],
  itemHeight = 80,
  containerHeight = 400,
  renderItem,
  className = '',
  loadMore,
  hasNextPage = false,
  loading = false
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Use virtual scrolling hook
  const { visibleItems, handleScroll } = useVirtualScrolling(
    items,
    itemHeight,
    containerHeight
  );

  // Throttled scroll handler to improve performance
  const throttledScrollHandler = useThrottle((e) => {
    setScrollTop(e.target.scrollTop);
    handleScroll(e);
    
    // Load more items when near bottom
    if (loadMore && hasNextPage && !loading) {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMore();
      }
    }
  }, 16); // ~60fps

  // Memoized container styles
  const containerStyles = useMemo(() => ({
    height: containerHeight,
    overflow: 'auto',
    position: 'relative'
  }), [containerHeight]);

  // Memoized virtual container styles
  const virtualContainerStyles = useMemo(() => ({
    height: visibleItems.totalHeight,
    position: 'relative'
  }), [visibleItems.totalHeight]);

  // Memoized visible content styles
  const visibleContentStyles = useMemo(() => ({
    transform: `translateY(${visibleItems.offsetY}px)`,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0
  }), [visibleItems.offsetY]);

  // Animation variants for list items
  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.05,
        duration: 0.3
      }
    }),
    exit: { opacity: 0, y: -20 }
  }), []);

  return (
    <div
      ref={containerRef}
      className={`virtualized-list ${className}`}
      style={containerStyles}
      onScroll={throttledScrollHandler}
    >
      <div style={virtualContainerStyles}>
        <div style={visibleContentStyles}>
          <AnimatePresence mode="popLayout">
            {visibleItems.visibleItems.map((item, index) => (
              <motion.div
                key={item.id || item._id || index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={index}
                style={{ height: itemHeight }}
                className="virtualized-item"
              >
                {renderItem(item, visibleItems.startIndex + index)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-4"
        >
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
            <span className="text-sm">Loading more...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Optimized transaction item component
export const TransactionItem = memo(({ transaction, index, onClick }) => {
  const handleClick = useCallback(() => {
    if (onClick) onClick(transaction, index);
  }, [transaction, index, onClick]);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { delay: index * 0.02 }
    }
  }), [index]);

  const amountColor = useMemo(() => {
    return transaction.type === 'credit' ? 'text-green-600' : 'text-red-600';
  }, [transaction.type]);

  const amountPrefix = useMemo(() => {
    return transaction.type === 'credit' ? '+' : '-';
  }, [transaction.type]);

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <span className={`text-sm font-medium ${amountColor}`}>
            {transaction.type === 'credit' ? '↓' : '↑'}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900 truncate max-w-[200px]">
            {transaction.description || 'Transaction'}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(transaction.createdAt || transaction.timestamp).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${amountColor}`}>
          {amountPrefix}₹{transaction.amount?.toLocaleString()}
        </p>
        <p className={`text-xs px-2 py-1 rounded-full ${
          transaction.status === 'completed' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {transaction.status}
        </p>
      </div>
    </motion.div>
  );
});

TransactionItem.displayName = 'TransactionItem';

// Optimized user item component for send money
export const UserItem = memo(({ user, index, isSelected, onSelect }) => {
  const handleSelect = useCallback(() => {
    if (onSelect) onSelect(user, index);
  }, [user, index, onSelect]);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { delay: index * 0.03 }
    }
  }), [index]);

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-emerald-50 border-2 border-emerald-200' 
          : 'bg-white border border-gray-200 hover:bg-gray-50'
      }`}
      onClick={handleSelect}
    >
      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
        <span className="text-white font-medium text-sm">
          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-sm text-gray-500 truncate">
          {user.quickpeId}
        </p>
      </div>
      {isSelected && (
        <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </motion.div>
  );
});

UserItem.displayName = 'UserItem';

export default VirtualizedList;
