/**
 * QuickPe Spacing System
 *
 * Modular spacing scale for consistent layouts and component spacing.
 * Uses a base-4 scale for pixel-perfect alignments.
 */

/**
 * Spacing Scale
 * Base-4 scale for consistent spacing
 */
export const space = {
  0: '0',           // 0px
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  18: '4.5rem',     // 72px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
};

/**
 * Semantic Spacing
 * Named spacing for specific use cases
 */
export const semanticSpacing = {
  // Component spacing
  component: {
    padding: {
      xs: space[2],  // 8px
      sm: space[3],  // 12px
      md: space[4],  // 16px
      lg: space[6],  // 24px
      xl: space[8],  // 32px
    },
    margin: {
      xs: space[1],  // 4px
      sm: space[2],  // 8px
      md: space[4],  // 16px
      lg: space[6],  // 24px
      xl: space[8],  // 32px
    },
    gap: {
      xs: space[2],  // 8px
      sm: space[3],  // 12px
      md: space[4],  // 16px
      lg: space[6],  // 24px
      xl: space[8],  // 32px
    },
  },

  // Layout spacing
  layout: {
    container: {
      padding: {
        mobile: space[4],   // 16px
        tablet: space[6],   // 24px
        desktop: space[8],  // 32px
      },
      maxWidth: '1200px',
    },
    section: {
      margin: space[12],   // 48px
      padding: space[8],   // 32px
    },
    page: {
      padding: {
        top: space[6],     // 24px
        bottom: space[12], // 48px
      },
    },
  },

  // Card spacing
  card: {
    padding: space[6],     // 24px
    gap: space[4],         // 16px
    borderRadius: space[2], // 8px
  },

  // Form spacing
  form: {
    field: {
      margin: space[4],    // 16px
      gap: space[2],       // 8px
    },
    group: {
      margin: space[6],    // 24px
      gap: space[4],       // 16px
    },
  },

  // Navigation spacing
  nav: {
    item: {
      padding: `${space[3]} ${space[4]}`, // 12px 16px
      gap: space[2],       // 8px
    },
    dropdown: {
      padding: space[2],   // 8px
      gap: space[1],       // 4px
    },
  },
};

/**
 * Spacing Utility Functions
 */
export const spacing = {
  space,
  semanticSpacing,

  /**
   * Get spacing value by key
   * @param {string|number} key - Spacing key
   * @returns {string} Spacing value
   */
  get: (key) => space[key] || space[4],

  /**
   * Get semantic spacing
   * @param {string} category - Category (component, layout, card, form, nav)
   * @param {string} property - Property name
   * @param {string} size - Size variant (xs, sm, md, lg, xl)
   * @returns {string} Spacing value
   */
  semantic: (category, property, size = 'md') => {
    const categoryData = semanticSpacing[category];
    if (!categoryData) return space[4];

    const propertyData = categoryData[property];
    if (!propertyData) return space[4];

    return propertyData[size] || propertyData.md || space[4];
  },

  /**
   * Create responsive spacing
   * @param {object} values - Object with breakpoint values
   * @returns {object} Responsive spacing object
   */
  responsive: (values) => ({
    mobile: values.mobile || values.default || space[4],
    tablet: values.tablet || values.default || space[6],
    desktop: values.desktop || values.default || space[8],
  }),

  /**
   * Calculate spacing for grid systems
   * @param {number} columns - Number of columns
   * @param {number} gutter - Gutter size (space key)
   * @returns {object} Grid spacing values
   */
  grid: (columns = 12, gutter = 4) => {
    const gutterSize = space[gutter] || space[4];
    return {
      columns,
      gutter: gutterSize,
      columnWidth: `calc((100% - ${gutterSize} * ${columns - 1}) / ${columns})`,
    };
  },
};

// Default export
export { spacing };
export default spacing;
