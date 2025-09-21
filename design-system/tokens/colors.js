/**
 * QuickPe Color System
 *
 * Comprehensive color palette for the QuickPe digital wallet.
 * Colors are organized by purpose and include semantic, neutral, and brand colors.
 */

/**
 * Primary Brand Colors
 * Emerald/Teal gradient system
 */
export const primary = {
  50: '#f0fdfa',
  100: '#ccfbf1',
  200: '#99f6e4',
  300: '#5eead4',
  400: '#2dd4bf',
  500: '#14b8a6', // Main primary color
  600: '#0d9488', // Primary hover state
  700: '#0f766e',
  800: '#115e59',
  900: '#134e4a',
  950: '#042f2e',
};

/**
 * Secondary Colors
 * Supporting teal variations
 */
export const secondary = {
  50: '#f0fdfa',
  100: '#ccfbf1',
  200: '#99f6e4',
  300: '#5eead4',
  400: '#2dd4bf',
  500: '#14b8a6',
  600: '#0d9488',
  700: '#0f766e',
  800: '#115e59',
  900: '#134e4a',
  950: '#042f2e',
};

/**
 * Neutral Colors
 * Gray scale for text, backgrounds, and borders
 */
export const neutral = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0a0a0a',
};

/**
 * Semantic Colors
 * Colors for states and feedback
 */
export const success = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
  950: '#052e16',
};

export const warning = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  950: '#451a03',
};

export const error = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
  950: '#450a0a',
};

export const info = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
  950: '#172554',
};

/**
 * Background Colors
 * Surface colors for different UI elements
 */
export const background = {
  primary: '#ffffff',
  secondary: '#fafafa',
  tertiary: '#f5f5f5',
  overlay: 'rgba(0, 0, 0, 0.5)',
  modal: 'rgba(0, 0, 0, 0.6)',
};

/**
 * Border Colors
 * Subtle borders and dividers
 */
export const border = {
  light: '#e5e5e5',
  medium: '#d4d4d4',
  dark: '#a3a3a3',
  focus: primary[500],
};

/**
 * Text Colors
 * Typography color hierarchy
 */
export const text = {
  primary: neutral[900],
  secondary: neutral[600],
  tertiary: neutral[500],
  inverse: '#ffffff',
  disabled: neutral[400],
  link: primary[600],
  linkHover: primary[700],
};

/**
 * QuickPe Brand Colors
 * Specific brand colors used throughout the app
 */
export const brand = {
  emerald: '#059669', // Main brand color
  teal: '#0d9488',    // Secondary brand color
  gradient: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
  gradientHover: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
};

/**
 * Color Utility Functions
 */
export const colors = {
  // Primary colors
  primary,
  secondary,

  // Neutral colors
  neutral,

  // Semantic colors
  success,
  warning,
  error,
  info,

  // Surface colors
  background,
  border,
  text,

  // Brand colors
  brand,

  /**
   * Get color by path
   * @param {string} path - Dot notation path (e.g., 'primary.500')
   * @returns {string} Color value
   */
  get: (path) => {
    const keys = path.split('.');
    let current = colors;
    for (const key of keys) {
      current = current[key];
      if (!current) return null;
    }
    return current;
  },

  /**
   * Get primary color
   * @param {number} shade - Color shade (50-950)
   * @returns {string} Primary color value
   */
  primary: (shade = 500) => primary[shade] || primary[500],

  /**
   * Get neutral color
   * @param {number} shade - Color shade (50-950)
   * @returns {string} Neutral color value
   */
  neutral: (shade = 500) => neutral[shade] || neutral[500],

  /**
   * Get semantic color
   * @param {string} type - Color type (success, warning, error, info)
   * @param {number} shade - Color shade (50-950)
   * @returns {string} Semantic color value
   */
  semantic: (type, shade = 500) => {
    const colorSet = colors[type];
    return colorSet ? colorSet[shade] || colorSet[500] : null;
  },
};

// Default export
export { colors };
export default colors;
