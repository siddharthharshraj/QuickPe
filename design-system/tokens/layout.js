/**
 * QuickPe Layout System
 *
 * Layout tokens for containers, grids, flexbox patterns, and responsive layouts.
 */

/**
 * Container Sizes
 */
export const containers = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
};

/**
 * Grid System
 */
export const grid = {
  columns: 12,
  gutter: {
    xs: '1rem',    // 16px
    sm: '1.5rem',  // 24px
    md: '2rem',    // 32px
    lg: '2.5rem',  // 40px
    xl: '3rem',    // 48px
  },
  container: {
    xs: '100%',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

/**
 * Flexbox Patterns
 */
export const flexbox = {
  // Direction
  direction: {
    row: 'row',
    column: 'column',
    'row-reverse': 'row-reverse',
    'column-reverse': 'column-reverse',
  },

  // Justify content
  justify: {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
  },

  // Align items
  align: {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
    baseline: 'baseline',
  },

  // Align self (for individual items)
  alignSelf: {
    auto: 'auto',
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
    baseline: 'baseline',
  },

  // Flex wrap
  wrap: {
    nowrap: 'nowrap',
    wrap: 'wrap',
    'wrap-reverse': 'wrap-reverse',
  },
};

/**
 * Common Layout Patterns
 */
export const patterns = {
  // Card layouts
  card: {
    basic: {
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    elevated: {
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    outlined: {
      padding: '1.5rem',
      borderRadius: '0.5rem',
      border: '1px solid #e5e5e5',
    },
  },

  // Button layouts
  button: {
    sm: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      borderRadius: '0.375rem',
    },
    md: {
      padding: '0.625rem 1.25rem',
      fontSize: '1rem',
      borderRadius: '0.5rem',
    },
    lg: {
      padding: '0.75rem 1.5rem',
      fontSize: '1.125rem',
      borderRadius: '0.5rem',
    },
  },

  // Form layouts
  form: {
    field: {
      marginBottom: '1rem',
    },
    group: {
      marginBottom: '1.5rem',
    },
    row: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'flex-end',
    },
  },

  // Navigation layouts
  nav: {
    horizontal: {
      display: 'flex',
      alignItems: 'center',
      gap: '2rem',
    },
    vertical: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
  },

  // Page layouts
  page: {
    centered: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
    },
    fullWidth: {
      width: '100%',
      padding: '2rem 1rem',
    },
  },
};

/**
 * Aspect Ratios
 */
export const aspectRatios = {
  square: '1 / 1',
  video: '16 / 9',
  portrait: '3 / 4',
  landscape: '4 / 3',
  wide: '21 / 9',
  ultrawide: '32 / 9',
};

/**
 * Layout Utility Functions
 */
export const layout = {
  containers,
  grid,
  flexbox,
  patterns,
  aspectRatios,

  /**
   * Get container size
   * @param {string} size - Container size key
   * @returns {string} Container max-width
   */
  container: (size = 'lg') => containers[size] || containers.lg,

  /**
   * Create responsive container
   * @param {object} options - Container options
   * @returns {object} Responsive container styles
   */
  responsiveContainer: (options = {}) => ({
    width: '100%',
    maxWidth: options.maxWidth || containers.xl,
    margin: '0 auto',
    padding: options.padding || '0 1rem',
  }),

  /**
   * Create grid layout
   * @param {object} options - Grid options
   * @returns {object} Grid layout styles
   */
  createGrid: (options = {}) => ({
    display: 'grid',
    gridTemplateColumns: options.columns ? `repeat(${options.columns}, 1fr)` : 'repeat(12, 1fr)',
    gap: options.gap || '1rem',
    maxWidth: options.maxWidth || '100%',
  }),

  /**
   * Create flex layout
   * @param {object} options - Flex options
   * @returns {object} Flex layout styles
   */
  createFlex: (options = {}) => ({
    display: 'flex',
    flexDirection: options.direction || 'row',
    justifyContent: options.justify || 'flex-start',
    alignItems: options.align || 'stretch',
    gap: options.gap || '0',
    flexWrap: options.wrap || 'nowrap',
  }),

  /**
   * Create card layout
   * @param {string} variant - Card variant (basic, elevated, outlined)
   * @returns {object} Card layout styles
   */
  createCard: (variant = 'basic') => ({
    ...patterns.card[variant],
  }),

  /**
   * Create button layout
   * @param {string} size - Button size (sm, md, lg)
   * @returns {object} Button layout styles
   */
  createButton: (size = 'md') => ({
    ...patterns.button[size],
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  }),

  /**
   * Get aspect ratio style
   * @param {string} ratio - Aspect ratio key
   * @returns {object} Aspect ratio styles
   */
  aspectRatio: (ratio = 'square') => ({
    aspectRatio: aspectRatios[ratio],
  }),
};

// Default export
export { layout };
export default layout;
