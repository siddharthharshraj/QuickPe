/**
 * QuickPe Typography System
 *
 * Comprehensive typography scale and configuration for consistent text styling.
 */

/**
 * Font Families
 */
export const fonts = {
  // Primary font family
  primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

  // Monospace for code and numbers
  mono: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',

  // Display font for headings (if different from primary)
  display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

/**
 * Font Sizes
 * Using a modular scale for consistent sizing
 */
export const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem',  // 72px
  '8xl': '6rem',    // 96px
  '9xl': '8rem',    // 128px
};

/**
 * Font Weights
 */
export const fontWeights = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

/**
 * Line Heights
 * Optimized for readability
 */
export const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

/**
 * Letter Spacing
 */
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

/**
 * Text Styles
 * Predefined text style combinations
 */
export const textStyles = {
  // Headings
  h1: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.normal,
  },

  // Body text
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Labels and captions
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Button text
  button: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.normal,
  },
  buttonLarge: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.normal,
  },

  // Code and numbers
  code: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  number: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.normal,
  },
};

/**
 * Typography Utility Functions
 */
export const typography = {
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  textStyles,

  /**
   * Get font size by key
   * @param {string} key - Font size key
   * @returns {string} Font size value
   */
  fontSize: (key) => fontSizes[key] || fontSizes.base,

  /**
   * Get font weight by key
   * @param {string} key - Font weight key
   * @returns {number} Font weight value
   */
  fontWeight: (key) => fontWeights[key] || fontWeights.normal,

  /**
   * Get line height by key
   * @param {string} key - Line height key
   * @returns {number} Line height value
   */
  lineHeight: (key) => lineHeights[key] || lineHeights.normal,

  /**
   * Get letter spacing by key
   * @param {string} key - Letter spacing key
   * @returns {string} Letter spacing value
   */
  letterSpace: (key) => letterSpacing[key] || letterSpacing.normal,

  /**
   * Get text style by key
   * @param {string} key - Text style key
   * @returns {object} Text style configuration
   */
  textStyle: (key) => textStyles[key] || textStyles.body,

  /**
   * Create custom text style
   * @param {object} options - Typography options
   * @returns {object} Custom text style
   */
  createTextStyle: (options = {}) => ({
    fontSize: options.fontSize || fontSizes.base,
    fontWeight: options.fontWeight || fontWeights.normal,
    lineHeight: options.lineHeight || lineHeights.normal,
    letterSpacing: options.letterSpacing || letterSpacing.normal,
    fontFamily: options.fontFamily || fonts.primary,
  }),
};

// Default export
export { typography };
export default typography;
