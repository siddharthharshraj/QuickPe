/**
 * QuickPe Design System Components
 *
 * Pre-built components that follow the design system.
 * These can be used directly or as references for implementation.
 */

// Button Components
export const Button = {
  // Primary button styles
  primary: (size = 'md') => ({
    background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: '500',
    fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
    padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '0.75rem 1.5rem' : '0.625rem 1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
    '&:disabled': {
      opacity: '0.6',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
    },
  }),

  // Secondary button styles
  secondary: (size = 'md') => ({
    background: 'transparent',
    color: '#0d9488',
    border: '1px solid #0d9488',
    borderRadius: '0.5rem',
    fontWeight: '500',
    fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
    padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '0.75rem 1.5rem' : '0.625rem 1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    '&:hover': {
      background: '#f0fdfa',
      borderColor: '#0f766e',
    },
    '&:disabled': {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
  }),

  // Ghost button styles
  ghost: (size = 'md') => ({
    background: 'transparent',
    color: '#525252',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: '500',
    fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
    padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '0.75rem 1.5rem' : '0.625rem 1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    '&:hover': {
      background: '#f5f5f5',
      color: '#404040',
    },
    '&:disabled': {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
  }),
};

// Input Components
export const Input = {
  // Default input styles
  default: (size = 'md') => ({
    width: '100%',
    padding: size === 'sm' ? '0.5rem 0.75rem' : size === 'lg' ? '0.75rem 1rem' : '0.625rem 1rem',
    border: '1px solid #d4d4d4',
    borderRadius: '0.5rem',
    fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#ffffff',
    color: '#171717',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    '&:focus': {
      borderColor: '#059669',
      boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.1)',
    },
    '&:hover': {
      borderColor: '#a3a3a3',
    },
    '&:disabled': {
      background: '#f5f5f5',
      color: '#a3a3a3',
      cursor: 'not-allowed',
    },
    '&::placeholder': {
      color: '#a3a3a3',
    },
  }),

  // Filled input styles
  filled: (size = 'md') => ({
    ...Input.default(size),
    background: '#f5f5f5',
    border: '1px solid #e5e5e5',
    '&:focus': {
      background: '#ffffff',
      borderColor: '#059669',
      boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.1)',
    },
  }),
};

// Card Components
export const Card = {
  // Default card styles
  default: {
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
  },

  // Elevated card styles
  elevated: {
    ...Card.default,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
    },
  },

  // Outlined card styles
  outlined: {
    background: '#ffffff',
    border: '2px solid #d4d4d4',
    borderRadius: '0.75rem',
    boxShadow: 'none',
    padding: '1.5rem',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      borderColor: '#a3a3a3',
    },
  },
};

// Badge Components
export const Badge = {
  // Primary badge
  primary: (size = 'md') => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '500',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: size === 'sm' ? '0.75rem' : '0.875rem',
    padding: size === 'sm' ? '0.125rem 0.375rem' : '0.25rem 0.5rem',
    borderRadius: size === 'sm' ? '0.25rem' : '0.375rem',
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0',
  }),

  // Secondary badge
  secondary: (size = 'md') => ({
    ...Badge.primary(size),
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
  }),

  // Success badge
  success: (size = 'md') => ({
    ...Badge.primary(size),
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0',
  }),

  // Warning badge
  warning: (size = 'md') => ({
    ...Badge.primary(size),
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a',
  }),

  // Error badge
  error: (size = 'md') => ({
    ...Badge.primary(size),
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
  }),
};

// Notification/Toast Components
export const Notification = {
  success: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    borderRadius: '0.5rem',
    padding: '1rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },

  warning: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    color: '#92400e',
    borderRadius: '0.5rem',
    padding: '1rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },

  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    borderRadius: '0.5rem',
    padding: '1rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },

  info: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1e40af',
    borderRadius: '0.5rem',
    padding: '1rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
};

// Modal Components
export const Modal = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1040,
    padding: '1rem',
  },

  container: {
    background: '#ffffff',
    borderRadius: '0.75rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: '100%',
    overflow: 'auto',
  },

  header: {
    padding: '1.5rem 1.5rem 0',
    borderBottom: '1px solid #e5e5e5',
  },

  body: {
    padding: '1.5rem',
  },

  footer: {
    padding: '0 1.5rem 1.5rem',
    borderTop: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
};

// Utility Components
export const Utility = {
  // Focus ring
  focusRing: {
    outline: '2px solid #059669',
    outlineOffset: '2px',
  },

  // Screen reader only text
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },

  // Container
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
  },
};

// Export all components
export {
  Button,
  Input,
  Card,
  Badge,
  Notification,
  Modal,
  Utility,
};
