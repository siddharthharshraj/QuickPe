/**
 * QuickPe Component Tokens
 *
 * Design tokens specifically for components like buttons, inputs, cards, etc.
 */

import { colors } from './colors.js';
import { typography } from './typography.js';
import { spacing } from './spacing.js';

/**
 * Button Component Tokens
 */
export const buttons = {
  // Button variants
  variants: {
    primary: {
      background: colors.brand.gradient,
      color: colors.text.inverse,
      border: 'none',
      hover: {
        background: colors.brand.gradientHover,
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
      },
      active: {
        transform: 'translateY(0)',
        boxShadow: '0 2px 4px rgba(5, 150, 105, 0.3)',
      },
      disabled: {
        background: colors.neutral[300],
        color: colors.text.disabled,
        cursor: 'not-allowed',
      },
    },
    secondary: {
      background: 'transparent',
      color: colors.primary[600],
      border: `1px solid ${colors.primary[600]}`,
      hover: {
        background: colors.primary[50],
        borderColor: colors.primary[700],
      },
      active: {
        background: colors.primary[100],
      },
      disabled: {
        color: colors.text.disabled,
        borderColor: colors.border.medium,
        cursor: 'not-allowed',
      },
    },
    outline: {
      background: 'transparent',
      color: colors.neutral[700],
      border: `1px solid ${colors.border.medium}`,
      hover: {
        background: colors.neutral[50],
        borderColor: colors.neutral[300],
      },
      active: {
        background: colors.neutral[100],
      },
      disabled: {
        color: colors.text.disabled,
        borderColor: colors.border.light,
        cursor: 'not-allowed',
      },
    },
    ghost: {
      background: 'transparent',
      color: colors.neutral[600],
      border: 'none',
      hover: {
        background: colors.neutral[100],
      },
      active: {
        background: colors.neutral[200],
      },
      disabled: {
        color: colors.text.disabled,
        cursor: 'not-allowed',
      },
    },
  },

  // Button sizes
  sizes: {
    xs: {
      height: '1.75rem',     // 28px
      padding: '0 0.75rem', // 12px
      fontSize: typography.fontSizes.xs,
      borderRadius: '0.25rem', // 4px
    },
    sm: {
      height: '2rem',        // 32px
      padding: '0 1rem',     // 16px
      fontSize: typography.fontSizes.sm,
      borderRadius: '0.375rem', // 6px
    },
    md: {
      height: '2.5rem',      // 40px
      padding: '0 1.25rem',  // 20px
      fontSize: typography.fontSizes.sm,
      borderRadius: '0.5rem', // 8px
    },
    lg: {
      height: '3rem',        // 48px
      padding: '0 1.5rem',   // 24px
      fontSize: typography.fontSizes.base,
      borderRadius: '0.5rem', // 8px
    },
    xl: {
      height: '3.5rem',      // 56px
      padding: '0 2rem',     // 32px
      fontSize: typography.fontSizes.lg,
      borderRadius: '0.75rem', // 12px
    },
  },

  // Common button properties
  common: {
    fontWeight: typography.fontWeights.medium,
    lineHeight: typography.lineHeights.none,
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.space[2],
    textDecoration: 'none',
    borderRadius: '0.5rem',
    fontFamily: typography.fonts.primary,
  },
};

/**
 * Input Component Tokens
 */
export const inputs = {
  // Input variants
  variants: {
    default: {
      background: colors.background.primary,
      border: `1px solid ${colors.border.medium}`,
      color: colors.text.primary,
      focus: {
        borderColor: colors.primary[500],
        boxShadow: `0 0 0 3px ${colors.primary[100]}`,
      },
      error: {
        borderColor: colors.error[500],
        boxShadow: `0 0 0 3px ${colors.error[100]}`,
      },
      disabled: {
        background: colors.neutral[100],
        color: colors.text.disabled,
        cursor: 'not-allowed',
      },
    },
    filled: {
      background: colors.neutral[50],
      border: `1px solid ${colors.neutral[200]}`,
      color: colors.text.primary,
      focus: {
        background: colors.background.primary,
        borderColor: colors.primary[500],
      },
      error: {
        borderColor: colors.error[500],
      },
      disabled: {
        background: colors.neutral[100],
        color: colors.text.disabled,
        cursor: 'not-allowed',
      },
    },
  },

  // Input sizes
  sizes: {
    sm: {
      height: '2rem',        // 32px
      padding: '0 0.75rem', // 12px
      fontSize: typography.fontSizes.sm,
    },
    md: {
      height: '2.5rem',      // 40px
      padding: '0 1rem',     // 16px
      fontSize: typography.fontSizes.base,
    },
    lg: {
      height: '3rem',        // 48px
      padding: '0 1.25rem',  // 20px
      fontSize: typography.fontSizes.lg,
    },
  },

  // Common input properties
  common: {
    borderRadius: '0.5rem',
    fontFamily: typography.fonts.primary,
    fontWeight: typography.fontWeights.normal,
    lineHeight: typography.lineHeights.normal,
    transition: 'all 0.2s ease-in-out',
    width: '100%',
    outline: 'none',
  },
};

/**
 * Card Component Tokens
 */
export const cards = {
  // Card variants
  variants: {
    default: {
      background: colors.background.primary,
      border: `1px solid ${colors.border.light}`,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    elevated: {
      background: colors.background.primary,
      border: `1px solid ${colors.border.light}`,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    outlined: {
      background: colors.background.primary,
      border: `2px solid ${colors.border.medium}`,
      boxShadow: 'none',
    },
    filled: {
      background: colors.neutral[50],
      border: 'none',
      boxShadow: 'none',
    },
  },

  // Card padding variants
  padding: {
    none: '0',
    sm: spacing.space[4],    // 16px
    md: spacing.space[6],    // 24px
    lg: spacing.space[8],    // 32px
  },

  // Common card properties
  common: {
    borderRadius: '0.75rem',
    transition: 'all 0.2s ease-in-out',
  },
};

/**
 * Modal/Dialog Component Tokens
 */
export const modals = {
  overlay: {
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
  },

  container: {
    background: colors.background.primary,
    borderRadius: '0.75rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    maxWidth: '90vw',
    maxHeight: '90vh',
  },

  sizes: {
    sm: { width: '20rem', height: 'auto' },    // 320px
    md: { width: '28rem', height: 'auto' },    // 448px
    lg: { width: '36rem', height: 'auto' },    // 576px
    xl: { width: '48rem', height: 'auto' },    // 768px
    full: { width: '100%', height: '100%' },
  },

  header: {
    padding: `${spacing.space[6]} ${spacing.space[6]} 0`,
    borderBottom: `1px solid ${colors.border.light}`,
  },

  body: {
    padding: spacing.space[6],
  },

  footer: {
    padding: `0 ${spacing.space[6]} ${spacing.space[6]}`,
    borderTop: `1px solid ${colors.border.light}`,
  },
};

/**
 * Notification/Toast Component Tokens
 */
export const notifications = {
  variants: {
    success: {
      background: colors.success[50],
      border: `1px solid ${colors.success[200]}`,
      color: colors.success[800],
      icon: colors.success[600],
    },
    warning: {
      background: colors.warning[50],
      border: `1px solid ${colors.warning[200]}`,
      color: colors.warning[800],
      icon: colors.warning[600],
    },
    error: {
      background: colors.error[50],
      border: `1px solid ${colors.error[200]}`,
      color: colors.error[800],
      icon: colors.error[600],
    },
    info: {
      background: colors.info[50],
      border: `1px solid ${colors.info[200]}`,
      color: colors.info[800],
      icon: colors.info[600],
    },
  },

  sizes: {
    sm: {
      padding: spacing.space[3],    // 12px
      fontSize: typography.fontSizes.sm,
      borderRadius: '0.375rem',     // 6px
    },
    md: {
      padding: spacing.space[4],    // 16px
      fontSize: typography.fontSizes.base,
      borderRadius: '0.5rem',       // 8px
    },
  },
};

/**
 * Badge Component Tokens
 */
export const badges = {
  variants: {
    primary: {
      background: colors.primary[100],
      color: colors.primary[800],
      border: `1px solid ${colors.primary[200]}`,
    },
    secondary: {
      background: colors.neutral[100],
      color: colors.neutral[800],
      border: `1px solid ${colors.neutral[200]}`,
    },
    success: {
      background: colors.success[100],
      color: colors.success[800],
      border: `1px solid ${colors.success[200]}`,
    },
    warning: {
      background: colors.warning[100],
      color: colors.warning[800],
      border: `1px solid ${colors.warning[200]}`,
    },
    error: {
      background: colors.error[100],
      color: colors.error[800],
      border: `1px solid ${colors.error[200]}`,
    },
  },

  sizes: {
    xs: {
      padding: '0.125rem 0.375rem', // 2px 6px
      fontSize: typography.fontSizes.xs,
      borderRadius: '0.25rem',       // 4px
    },
    sm: {
      padding: '0.25rem 0.5rem',     // 4px 8px
      fontSize: typography.fontSizes.xs,
      borderRadius: '0.375rem',      // 6px
    },
    md: {
      padding: '0.375rem 0.625rem',  // 6px 10px
      fontSize: typography.fontSizes.sm,
      borderRadius: '0.5rem',        // 8px
    },
  },
};

/**
 * Component Utility Functions
 */
export const components = {
  buttons,
  inputs,
  cards,
  modals,
  notifications,
  badges,

  /**
   * Get button styles
   * @param {string} variant - Button variant
   * @param {string} size - Button size
   * @returns {object} Button styles
   */
  getButtonStyles: (variant = 'primary', size = 'md') => ({
    ...buttons.common,
    ...buttons.variants[variant],
    ...buttons.sizes[size],
  }),

  /**
   * Get input styles
   * @param {string} variant - Input variant
   * @param {string} size - Input size
   * @returns {object} Input styles
   */
  getInputStyles: (variant = 'default', size = 'md') => ({
    ...inputs.common,
    ...inputs.variants[variant],
    ...inputs.sizes[size],
  }),

  /**
   * Get card styles
   * @param {string} variant - Card variant
   * @param {string} padding - Card padding
   * @returns {object} Card styles
   */
  getCardStyles: (variant = 'default', padding = 'md') => ({
    ...cards.common,
    ...cards.variants[variant],
    padding: cards.padding[padding],
  }),

  /**
   * Get notification styles
   * @param {string} variant - Notification variant
   * @param {string} size - Notification size
   * @returns {object} Notification styles
   */
  getNotificationStyles: (variant = 'info', size = 'md') => ({
    ...notifications.variants[variant],
    ...notifications.sizes[size],
  }),

  /**
   * Get badge styles
   * @param {string} variant - Badge variant
   * @param {string} size - Badge size
   * @returns {object} Badge styles
   */
  getBadgeStyles: (variant = 'primary', size = 'md') => ({
    ...badges.variants[variant],
    ...badges.sizes[size],
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: typography.fontWeights.medium,
    fontFamily: typography.fonts.primary,
  }),
};

// Default export
export { components };
export default components;
