import React, { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

// Optimized Card Component with memo
export const OptimizedCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  className = '',
  onClick 
}) => {
  const cardVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }), []);

  const handleClick = useCallback(() => {
    if (onClick) onClick();
  }, [onClick]);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend === 'up' ? '↗' : '↘'}</span>
              <span className="ml-1">{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-emerald-50 rounded-lg">
            <Icon className="h-6 w-6 text-emerald-600" />
          </div>
        )}
      </div>
    </motion.div>
  );
});

OptimizedCard.displayName = 'OptimizedCard';

// Optimized List Item with virtualization support
export const OptimizedListItem = memo(({ 
  item, 
  index, 
  isSelected, 
  onSelect, 
  renderContent 
}) => {
  const handleSelect = useCallback(() => {
    if (onSelect) onSelect(item, index);
  }, [item, index, onSelect]);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { delay: index * 0.05 }
    }
  }), [index]);

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-150 ${
        isSelected ? 'bg-emerald-50 border-emerald-200' : 'hover:bg-gray-50'
      }`}
      onClick={handleSelect}
    >
      {renderContent ? renderContent(item, index) : (
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">{item.name || item.title}</span>
          <span className="text-sm text-gray-500">{item.value || item.amount}</span>
        </div>
      )}
    </motion.div>
  );
});

OptimizedListItem.displayName = 'OptimizedListItem';

// Optimized Button Component
export const OptimizedButton = memo(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  const baseClasses = useMemo(() => {
    const variants = {
      primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
      outline: 'border border-emerald-600 text-emerald-600 hover:bg-emerald-50'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    return `inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]}`;
  }, [variant, size]);

  const handleClick = useCallback((e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  }, [disabled, loading, onClick]);

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`${baseClasses} ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : children}
    </motion.button>
  );
});

OptimizedButton.displayName = 'OptimizedButton';

// Optimized Input Component
export const OptimizedInput = memo(({ 
  label, 
  error, 
  icon: Icon,
  value,
  onChange,
  onFocus,
  onBlur,
  className = '',
  ...props 
}) => {
  const handleChange = useCallback((e) => {
    if (onChange) onChange(e);
  }, [onChange]);

  const handleFocus = useCallback((e) => {
    if (onFocus) onFocus(e);
  }, [onFocus]);

  const handleBlur = useCallback((e) => {
    if (onBlur) onBlur(e);
  }, [onBlur]);

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 transition-colors duration-200 ${
            Icon ? 'pl-10' : 'pl-3'
          } ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

OptimizedInput.displayName = 'OptimizedInput';

// Optimized Modal Component
export const OptimizedModal = memo(({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}) => {
  const modalVariants = useMemo(() => ({
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  }), []);

  const backdropVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }), []);

  const sizeClasses = useMemo(() => {
    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl'
    };
    return sizes[size];
  }, [size]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={`relative bg-white rounded-lg shadow-xl ${sizeClasses} w-full`}
        >
          {title && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            </div>
          )}
          <div className="px-6 py-4">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
});

OptimizedModal.displayName = 'OptimizedModal';
