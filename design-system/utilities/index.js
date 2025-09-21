/**
 * QuickPe Design System Utilities
 *
 * Utility functions for working with the design system.
 */

/**
 * Color Utilities
 */
export const colorUtils = {
  /**
   * Lighten a color by a percentage
   * @param {string} color - Hex color
   * @param {number} percent - Percentage to lighten (0-100)
   * @returns {string} Lightened color
   */
  lighten: (color, percent) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  },

  /**
   * Darken a color by a percentage
   * @param {string} color - Hex color
   * @param {number} percent - Percentage to darken (0-100)
   * @returns {string} Darkened color
   */
  darken: (color, percent) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  },

  /**
   * Convert hex to RGB
   * @param {string} hex - Hex color
   * @returns {object} RGB values
   */
  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  /**
   * Convert RGB to hex
   * @param {number} r - Red value
   * @param {number} g - Green value
   * @param {number} b - Blue value
   * @returns {string} Hex color
   */
  rgbToHex: (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  /**
   * Get contrast ratio between two colors
   * @param {string} color1 - First color
   * @param {string} color2 - Second color
   * @returns {number} Contrast ratio
   */
  getContrastRatio: (color1, color2) => {
    const rgb1 = colorUtils.hexToRgb(color1);
    const rgb2 = colorUtils.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 1;

    const lum1 = colorUtils.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = colorUtils.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * Get relative luminance
   * @param {number} r - Red value
   * @param {number} g - Green value
   * @param {number} b - Blue value
   * @returns {number} Luminance value
   */
  getLuminance: (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Check if color combination meets WCAG contrast requirements
   * @param {string} foreground - Foreground color
   * @param {string} background - Background color
   * @param {string} level - WCAG level ('AA' or 'AAA')
   * @returns {boolean} Meets requirements
   */
  meetsWCAG: (foreground, background, level = 'AA') => {
    const ratio = colorUtils.getContrastRatio(foreground, background);
    return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
  },
};

/**
 * Spacing Utilities
 */
export const spacingUtils = {
  /**
   * Calculate responsive spacing
   * @param {number} base - Base spacing value
   * @param {object} breakpoints - Breakpoint multipliers
   * @returns {object} Responsive spacing values
   */
  responsive: (base, breakpoints = {}) => {
    return {
      mobile: base,
      tablet: base * (breakpoints.tablet || 1.5),
      desktop: base * (breakpoints.desktop || 2),
    };
  },

  /**
   * Create spacing scale
   * @param {number} base - Base unit
   * @param {number} ratio - Scale ratio
   * @param {number} steps - Number of steps
   * @returns {object} Spacing scale
   */
  createScale: (base = 4, ratio = 2, steps = 10) => {
    const scale = {};
    for (let i = 0; i <= steps; i++) {
      scale[i] = base * Math.pow(ratio, i);
    }
    return scale;
  },
};

/**
 * Typography Utilities
 */
export const typographyUtils = {
  /**
   * Calculate optimal line height
   * @param {number} fontSize - Font size in pixels
   * @param {number} baseLineHeight - Base line height multiplier
   * @returns {number} Optimal line height
   */
  calculateLineHeight: (fontSize, baseLineHeight = 1.5) => {
    return Math.round((fontSize * baseLineHeight) / 4) * 4; // Round to nearest 4px
  },

  /**
   * Get responsive font size
   * @param {number} mobile - Mobile font size
   * @param {number} desktop - Desktop font size
   * @param {number} viewport - Current viewport width
   * @returns {number} Responsive font size
   */
  responsiveFontSize: (mobile, desktop, viewport) => {
    const min = mobile;
    const max = desktop;
    const slope = (max - min) / (1200 - 576); // From tablet to desktop
    const yIntercept = min - slope * 576;

    if (viewport <= 576) return min;
    if (viewport >= 1200) return max;
    return slope * viewport + yIntercept;
  },

  /**
   * Truncate text with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncate: (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  },
};

/**
 * Layout Utilities
 */
export const layoutUtils = {
  /**
   * Calculate grid column width
   * @param {number} columns - Total columns
   * @param {number} span - Columns to span
   * @param {number} gap - Gap between columns
   * @returns {string} CSS width value
   */
  gridColumn: (columns, span, gap = 0) => {
    const totalGap = gap * (columns - 1);
    const columnWidth = `calc((100% - ${totalGap}px) / ${columns})`;
    return `calc(${columnWidth} * ${span} + ${gap * (span - 1)}px)`;
  },

  /**
   * Create CSS Grid template
   * @param {number} columns - Number of columns
   * @param {string} gap - Gap between items
   * @returns {object} Grid styles
   */
  createGrid: (columns = 12, gap = '1rem') => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap,
  }),

  /**
   * Create Flexbox layout
   * @param {object} options - Flex options
   * @returns {object} Flex styles
   */
  createFlex: (options = {}) => ({
    display: 'flex',
    flexDirection: options.direction || 'row',
    justifyContent: options.justify || 'flex-start',
    alignItems: options.align || 'stretch',
    gap: options.gap || '0',
    flexWrap: options.wrap || 'nowrap',
  }),
};

/**
 * Animation Utilities
 */
export const animationUtils = {
  /**
   * Create staggered animation delays
   * @param {Array} elements - Elements to animate
   * @param {number} baseDelay - Base delay in ms
   * @returns {Array} Elements with delays
   */
  stagger: (elements, baseDelay = 100) => {
    return elements.map((element, index) => ({
      ...element,
      delay: baseDelay * index,
    }));
  },

  /**
   * Create keyframe animation
   * @param {string} name - Animation name
   * @param {object} keyframes - Keyframe definitions
   * @returns {string} CSS animation
   */
  createKeyframeAnimation: (name, keyframes) => {
    const keyframeRules = Object.entries(keyframes)
      .map(([key, value]) => {
        const styles = Object.entries(value)
          .map(([prop, val]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}:${val}`)
          .join(';');
        return `${key} { ${styles} }`;
      })
      .join('\n  ');

    return `@keyframes ${name} {\n  ${keyframeRules}\n}`;
  },

  /**
   * Calculate animation duration based on distance
   * @param {number} distance - Animation distance in pixels
   * @param {number} speed - Animation speed (pixels per second)
   * @returns {number} Duration in seconds
   */
  calculateDuration: (distance, speed = 1000) => {
    return distance / speed;
  },
};

/**
 * Responsive Utilities
 */
export const responsiveUtils = {
  /**
   * Create responsive value using clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} preferred - Preferred value
   * @param {string} unit - CSS unit
   * @returns {string} CSS clamp value
   */
  clamp: (min, max, preferred = (min + max) / 2, unit = 'rem') => {
    return `clamp(${min}${unit}, ${preferred}${unit}, ${max}${unit})`;
  },

  /**
   * Get breakpoint value
   * @param {string} breakpoint - Breakpoint name
   * @returns {string} Breakpoint value
   */
  getBreakpoint: (breakpoint) => {
    const breakpoints = {
      xs: '0px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      xxl: '1400px',
    };
    return breakpoints[breakpoint] || breakpoints.md;
  },

  /**
   * Create media query
   * @param {string} breakpoint - Breakpoint name
   * @param {string} direction - Direction ('min' or 'max')
   * @returns {string} Media query string
   */
  mediaQuery: (breakpoint, direction = 'min') => {
    const value = responsiveUtils.getBreakpoint(breakpoint);
    return `(${direction}-width: ${value})`;
  },
};

// Export all utilities
export {
  colorUtils,
  spacingUtils,
  typographyUtils,
  layoutUtils,
  animationUtils,
  responsiveUtils,
};
