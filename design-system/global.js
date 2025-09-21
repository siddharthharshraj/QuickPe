/**
 * QuickPe Global Styles
 *
 * Global CSS styles and CSS custom properties for the design system.
 */

import { colors } from './tokens/colors.js';
import { typography } from './tokens/typography.js';
import { spacing } from './tokens/spacing.js';
import { animations } from './tokens/animations.js';

/**
 * CSS Custom Properties (CSS Variables)
 * These can be used in CSS files or styled-components
 */
export const cssVariables = {
  // Color variables
  '--color-primary-50': colors.primary[50],
  '--color-primary-100': colors.primary[100],
  '--color-primary-200': colors.primary[200],
  '--color-primary-300': colors.primary[300],
  '--color-primary-400': colors.primary[400],
  '--color-primary-500': colors.primary[500],
  '--color-primary-600': colors.primary[600],
  '--color-primary-700': colors.primary[700],
  '--color-primary-800': colors.primary[800],
  '--color-primary-900': colors.primary[900],

  '--color-neutral-50': colors.neutral[50],
  '--color-neutral-100': colors.neutral[100],
  '--color-neutral-200': colors.neutral[200],
  '--color-neutral-300': colors.neutral[300],
  '--color-neutral-400': colors.neutral[400],
  '--color-neutral-500': colors.neutral[500],
  '--color-neutral-600': colors.neutral[600],
  '--color-neutral-700': colors.neutral[700],
  '--color-neutral-800': colors.neutral[800],
  '--color-neutral-900': colors.neutral[900],

  '--color-success-500': colors.success[500],
  '--color-warning-500': colors.warning[500],
  '--color-error-500': colors.error[500],
  '--color-info-500': colors.info[500],

  '--color-background-primary': colors.background.primary,
  '--color-background-secondary': colors.background.secondary,
  '--color-text-primary': colors.text.primary,
  '--color-text-secondary': colors.text.secondary,
  '--color-border': colors.border.medium,

  // Typography variables
  '--font-family-primary': typography.fonts.primary,
  '--font-family-mono': typography.fonts.mono,

  '--font-size-xs': typography.fontSizes.xs,
  '--font-size-sm': typography.fontSizes.sm,
  '--font-size-base': typography.fontSizes.base,
  '--font-size-lg': typography.fontSizes.lg,
  '--font-size-xl': typography.fontSizes.xl,
  '--font-size-2xl': typography.fontSizes['2xl'],
  '--font-size-3xl': typography.fontSizes['3xl'],

  '--font-weight-normal': typography.fontWeights.normal,
  '--font-weight-medium': typography.fontWeights.medium,
  '--font-weight-semibold': typography.fontWeights.semibold,
  '--font-weight-bold': typography.fontWeights.bold,

  '--line-height-tight': typography.lineHeights.tight,
  '--line-height-normal': typography.lineHeights.normal,
  '--line-height-relaxed': typography.lineHeights.relaxed,

  // Spacing variables
  '--spacing-1': spacing.space[1],
  '--spacing-2': spacing.space[2],
  '--spacing-3': spacing.space[3],
  '--spacing-4': spacing.space[4],
  '--spacing-6': spacing.space[6],
  '--spacing-8': spacing.space[8],
  '--spacing-12': spacing.space[12],
  '--spacing-16': spacing.space[16],

  // Animation variables
  '--transition-fast': animations.transitions.button.transition,
  '--transition-normal': animations.transitions.all.transition,
  '--easing-ease-out': animations.easing.easeOut,

  // Border radius
  '--radius-sm': '0.25rem',
  '--radius-md': '0.375rem',
  '--radius-lg': '0.5rem',
  '--radius-xl': '0.75rem',
  '--radius-2xl': '1rem',

  // Shadows
  '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Z-index scale
  '--z-dropdown': '1000',
  '--z-sticky': '1020',
  '--z-fixed': '1030',
  '--z-modal': '1040',
  '--z-popover': '1050',
  '--z-tooltip': '1060',
  '--z-toast': '1070',
};

/**
 * Global CSS Reset
 */
export const globalReset = `
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  * {
    margin: 0;
  }

  html,
  body {
    height: 100%;
  }

  body {
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  img,
  picture,
  video,
  canvas,
  svg {
    display: block;
    max-width: 100%;
  }

  input,
  button,
  textarea,
  select {
    font: inherit;
  }

  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    overflow-wrap: break-word;
  }

  #root,
  #__next {
    isolation: isolate;
  }
`;

/**
 * Design System CSS Variables
 */
export const designSystemVariables = `
  :root {
    ${Object.entries(cssVariables)
      .map(([key, value]) => `    ${key}: ${value};`)
      .join('\n')}
  }
`;

/**
 * Base Typography Styles
 */
export const baseTypography = `
  body {
    font-family: var(--font-family-primary);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-normal);
    line-height: var(--line-height-normal);
    color: var(--color-text-primary);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-family-primary);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-tight);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-4) 0;
  }

  h1 { font-size: var(--font-size-3xl); }
  h2 { font-size: var(--font-size-2xl); }
  h3 { font-size: var(--font-size-xl); }
  h4 { font-size: var(--font-size-lg); }
  h5 { font-size: var(--font-size-base); }
  h6 { font-size: var(--font-size-sm); }

  p {
    margin: 0 0 var(--spacing-4) 0;
    color: var(--color-text-secondary);
  }

  a {
    color: var(--color-primary-600);
    text-decoration: none;
    transition: var(--transition-fast);
  }

  a:hover {
    color: var(--color-primary-700);
  }

  code {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    background: var(--color-neutral-100);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
  }

  pre {
    font-family: var(--font-family-mono);
    background: var(--color-neutral-900);
    color: var(--color-neutral-100);
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    overflow-x: auto;
  }

  pre code {
    background: transparent;
    padding: 0;
  }
`;

/**
 * Focus Styles
 */
export const focusStyles = `
  .focus-visible,
  [data-focus-visible] {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }

  button:focus-visible,
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
`;

/**
 * Scrollbar Styles
 */
export const scrollbarStyles = `
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--color-neutral-100);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--color-neutral-400);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-neutral-500);
  }

  ::-webkit-scrollbar-corner {
    background: var(--color-neutral-100);
  }
`;

/**
 * Selection Styles
 */
export const selectionStyles = `
  ::selection {
    background: var(--color-primary-100);
    color: var(--color-primary-900);
  }

  ::-moz-selection {
    background: var(--color-primary-100);
    color: var(--color-primary-900);
  }
`;

/**
 * Combined Global Styles
 */
export const globalStyles = `
  ${globalReset}
  ${designSystemVariables}
  ${baseTypography}
  ${focusStyles}
  ${scrollbarStyles}
  ${selectionStyles}
`;

/**
 * Utility Functions
 */
export const globalUtils = {
  /**
   * Generate CSS custom properties
   * @param {object} customVars - Custom CSS variables
   * @returns {string} CSS string
   */
  generateCustomProperties: (customVars) => {
    return `:root {\n${Object.entries(customVars)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n')}\n}`;
  },

  /**
   * Generate responsive CSS
   * @param {object} styles - Object with breakpoint styles
   * @returns {string} CSS string
   */
  generateResponsiveCSS: (styles) => {
    let css = '';

    if (styles.base) {
      css += styles.base;
    }

    if (styles.sm) {
      css += `@media (min-width: 576px) { ${styles.sm} }`;
    }

    if (styles.md) {
      css += `@media (min-width: 768px) { ${styles.md} }`;
    }

    if (styles.lg) {
      css += `@media (min-width: 992px) { ${styles.lg} }`;
    }

    if (styles.xl) {
      css += `@media (min-width: 1200px) { ${styles.xl} }`;
    }

    return css;
  },

  /**
   * Inject CSS variables into document
   * @param {object} variables - CSS variables to inject
   */
  injectCSSVariables: (variables) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      Object.entries(variables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }
  },

  /**
   * Update theme colors
   * @param {object} themeColors - Theme color overrides
   */
  updateThemeColors: (themeColors) => {
    const updatedVars = {};
    Object.entries(themeColors).forEach(([category, colors]) => {
      Object.entries(colors).forEach(([shade, value]) => {
        updatedVars[`--color-${category}-${shade}`] = value;
      });
    });
    globalUtils.injectCSSVariables(updatedVars);
  },
};

// Default export
export default globalStyles;
