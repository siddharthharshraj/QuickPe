/**
 * QuickPe Responsive System
 *
 * Breakpoints, responsive utilities, and mobile-first design tokens.
 */

/**
 * Breakpoint Definitions
 * Mobile-first approach
 */
export const breakpoints = {
  xs: '0px',      // Extra small devices (phones)
  sm: '576px',    // Small devices (large phones)
  md: '768px',    // Medium devices (tablets)
  lg: '992px',    // Large devices (small laptops)
  xl: '1200px',   // Extra large devices (desktops)
  xxl: '1400px',  // Extra extra large devices (large desktops)
};

/**
 * Container Max Widths
 */
export const containers = {
  xs: '100%',
  sm: '540px',
  md: '720px',
  lg: '960px',
  xl: '1140px',
  xxl: '1320px',
};

/**
 * Responsive Spacing Scale
 */
export const responsiveSpacing = {
  // Padding scales
  padding: {
    xs: { x: '1rem', y: '0.5rem' },     // 16px 8px
    sm: { x: '1.5rem', y: '1rem' },     // 24px 16px
    md: { x: '2rem', y: '1.5rem' },     // 32px 24px
    lg: { x: '3rem', y: '2rem' },       // 48px 32px
    xl: { x: '4rem', y: '3rem' },       // 64px 48px
  },

  // Margin scales
  margin: {
    xs: { x: '1rem', y: '0.5rem' },     // 16px 8px
    sm: { x: '1.5rem', y: '1rem' },     // 24px 16px
    md: { x: '2rem', y: '1.5rem' },     // 32px 24px
    lg: { x: '3rem', y: '2rem' },       // 48px 32px
    xl: { x: '4rem', y: '3rem' },       // 64px 48px
  },

  // Gap scales
  gap: {
    xs: '0.5rem',   // 8px
    sm: '1rem',     // 16px
    md: '1.5rem',   // 24px
    lg: '2rem',     // 32px
    xl: '3rem',     // 48px
  },
};

/**
 * Typography Responsive Scale
 */
export const responsiveTypography = {
  // Heading scales
  h1: {
    mobile: { fontSize: '1.75rem', lineHeight: '2rem' },     // 28px
    tablet: { fontSize: '2.25rem', lineHeight: '2.5rem' },   // 36px
    desktop: { fontSize: '3rem', lineHeight: '3rem' },       // 48px
  },
  h2: {
    mobile: { fontSize: '1.5rem', lineHeight: '1.75rem' },   // 24px
    tablet: { fontSize: '2rem', lineHeight: '2.25rem' },     // 32px
    desktop: { fontSize: '2.5rem', lineHeight: '2.75rem' },   // 40px
  },
  h3: {
    mobile: { fontSize: '1.25rem', lineHeight: '1.5rem' },   // 20px
    tablet: { fontSize: '1.5rem', lineHeight: '1.75rem' },   // 24px
    desktop: { fontSize: '2rem', lineHeight: '2.25rem' },    // 32px
  },
  h4: {
    mobile: { fontSize: '1.125rem', lineHeight: '1.375rem' }, // 18px
    tablet: { fontSize: '1.25rem', lineHeight: '1.5rem' },    // 20px
    desktop: { fontSize: '1.5rem', lineHeight: '1.75rem' },   // 24px
  },
  h5: {
    mobile: { fontSize: '1rem', lineHeight: '1.25rem' },     // 16px
    tablet: { fontSize: '1.125rem', lineHeight: '1.375rem' }, // 18px
    desktop: { fontSize: '1.25rem', lineHeight: '1.5rem' },   // 20px
  },
  h6: {
    mobile: { fontSize: '0.875rem', lineHeight: '1.125rem' }, // 14px
    tablet: { fontSize: '1rem', lineHeight: '1.25rem' },      // 16px
    desktop: { fontSize: '1.125rem', lineHeight: '1.375rem' }, // 18px
  },

  // Body text scales
  body: {
    mobile: { fontSize: '0.875rem', lineHeight: '1.25rem' },  // 14px
    tablet: { fontSize: '1rem', lineHeight: '1.5rem' },       // 16px
    desktop: { fontSize: '1rem', lineHeight: '1.5rem' },      // 16px
  },
  bodyLarge: {
    mobile: { fontSize: '1rem', lineHeight: '1.5rem' },       // 16px
    tablet: { fontSize: '1.125rem', lineHeight: '1.625rem' }, // 18px
    desktop: { fontSize: '1.25rem', lineHeight: '1.75rem' },   // 20px
  },
};

/**
 * Component Responsive Scales
 */
export const responsiveComponents = {
  // Button responsive sizes
  button: {
    xs: {
      mobile: { height: '2rem', padding: '0 0.75rem', fontSize: '0.75rem' },
      tablet: { height: '2.25rem', padding: '0 1rem', fontSize: '0.875rem' },
      desktop: { height: '2.5rem', padding: '0 1.25rem', fontSize: '1rem' },
    },
    sm: {
      mobile: { height: '2.25rem', padding: '0 1rem', fontSize: '0.875rem' },
      tablet: { height: '2.5rem', padding: '0 1.25rem', fontSize: '1rem' },
      desktop: { height: '2.75rem', padding: '0 1.5rem', fontSize: '1.125rem' },
    },
    md: {
      mobile: { height: '2.5rem', padding: '0 1.25rem', fontSize: '1rem' },
      tablet: { height: '2.75rem', padding: '0 1.5rem', fontSize: '1.125rem' },
      desktop: { height: '3rem', padding: '0 2rem', fontSize: '1.25rem' },
    },
  },

  // Card responsive padding
  card: {
    mobile: { padding: '1rem' },
    tablet: { padding: '1.5rem' },
    desktop: { padding: '2rem' },
  },

  // Modal responsive sizes
  modal: {
    sm: {
      mobile: { width: '90vw', height: 'auto' },
      tablet: { width: '400px', height: 'auto' },
      desktop: { width: '480px', height: 'auto' },
    },
    md: {
      mobile: { width: '95vw', height: 'auto' },
      tablet: { width: '500px', height: 'auto' },
      desktop: { width: '600px', height: 'auto' },
    },
    lg: {
      mobile: { width: '100vw', height: 'auto' },
      tablet: { width: '700px', height: 'auto' },
      desktop: { width: '800px', height: 'auto' },
    },
  },
};

/**
 * Grid Responsive System
 */
export const responsiveGrid = {
  // Responsive grid columns
  columns: {
    mobile: 4,   // 4 columns on mobile
    tablet: 8,   // 8 columns on tablet
    desktop: 12, // 12 columns on desktop
  },

  // Responsive gutters
  gutter: {
    mobile: '1rem',   // 16px
    tablet: '1.5rem', // 24px
    desktop: '2rem',  // 32px
  },

  // Responsive breakpoints for grid
  breakpoints: {
    mobile: '0px',
    tablet: '768px',
    desktop: '1024px',
  },
};

/**
 * Responsive Utility Functions
 */
export const responsive = {
  breakpoints,
  containers,
  responsiveSpacing,
  responsiveTypography,
  responsiveComponents,
  responsiveGrid,

  /**
   * Create responsive CSS using clamp()
   * @param {number} min - Minimum value
   * @param {number} preferred - Preferred value
   * @param {number} max - Maximum value
   * @param {string} unit - Unit (px, rem, etc.)
   * @returns {string} CSS clamp() function
   */
  clamp: (min, preferred, max, unit = 'rem') => {
    return `clamp(${min}${unit}, ${preferred}${unit}, ${max}${unit})`;
  },

  /**
   * Create responsive font size using clamp
   * @param {number} min - Minimum font size
   * @param {number} max - Maximum font size
   * @param {number} preferred - Preferred font size
   * @returns {string} Responsive font size
   */
  responsiveFontSize: (min, max, preferred = (min + max) / 2) => {
    return `clamp(${min}rem, ${preferred}rem, ${max}rem)`;
  },

  /**
   * Create responsive spacing using clamp
   * @param {number} min - Minimum spacing
   * @param {number} max - Maximum spacing
   * @param {number} preferred - Preferred spacing
   * @returns {string} Responsive spacing
   */
  responsiveSpacing: (min, max, preferred = (min + max) / 2) => {
    return `clamp(${min}rem, ${preferred}rem, ${max}rem)`;
  },

  /**
   * Get breakpoint value
   * @param {string} breakpoint - Breakpoint name
   * @returns {string} Breakpoint value
   */
  getBreakpoint: (breakpoint) => breakpoints[breakpoint] || breakpoints.md,

  /**
   * Get container max width
   * @param {string} size - Container size
   * @returns {string} Container max width
   */
  getContainer: (size) => containers[size] || containers.lg,

  /**
   * Create responsive query
   * @param {string} breakpoint - Breakpoint name
   * @param {string} direction - Direction (min or max)
   * @returns {string} Media query
   */
  createMediaQuery: (breakpoint, direction = 'min') => {
    const value = breakpoints[breakpoint] || breakpoints.md;
    return `(${direction}-width: ${value})`;
  },

  /**
   * Check if viewport is mobile
   * @param {number} width - Viewport width
   * @returns {boolean} Is mobile
   */
  isMobile: (width) => width < parseInt(breakpoints.md),

  /**
   * Check if viewport is tablet
   * @param {number} width - Viewport width
   * @returns {boolean} Is tablet
   */
  isTablet: (width) => width >= parseInt(breakpoints.md) && width < parseInt(breakpoints.lg),

  /**
   * Check if viewport is desktop
   * @param {number} width - Viewport width
   * @returns {boolean} Is desktop
   */
  isDesktop: (width) => width >= parseInt(breakpoints.lg),

  /**
   * Get responsive value based on viewport
   * @param {object} values - Object with mobile, tablet, desktop values
   * @param {number} width - Current viewport width
   * @returns {*} Responsive value
   */
  getResponsiveValue: (values, width) => {
    if (responsive.isMobile(width)) {
      return values.mobile || values.default;
    } else if (responsive.isTablet(width)) {
      return values.tablet || values.default;
    } else {
      return values.desktop || values.default;
    }
  },
};

// Default export
export { responsive };
export default responsive;
