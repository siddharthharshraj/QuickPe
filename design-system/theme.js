/**
 * QuickPe Theme Configuration
 *
 * Central theme configuration that combines all design tokens.
 * This file serves as the single source of truth for the design system.
 */

import { colors } from './tokens/colors.js';
import { typography } from './tokens/typography.js';
import { spacing } from './tokens/spacing.js';
import { layout } from './tokens/layout.js';
import { components } from './tokens/components.js';
import { animations } from './tokens/animations.js';
import { responsive } from './tokens/responsive.js';

const theme = {
  // Design Tokens
  colors,
  typography,
  spacing,
  layout,
  components,
  animations,
  responsive,

  // Theme Metadata
  name: 'QuickPe',
  version: '1.0.0',
  description: 'QuickPe Digital Wallet Design System',

  // Theme Mode (can be extended for dark mode)
  mode: 'light',

  // Global Theme Properties
  globals: {
    borderRadius: '8px',
    borderWidth: '1px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease-in-out',
  },

  // Z-index Scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
  },

  // Breakpoints (for CSS-in-JS or utility classes)
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1400px',
  },

  // Container max widths
  containers: {
    sm: '540px',
    md: '720px',
    lg: '960px',
    xl: '1140px',
    xxl: '1320px',
  },
};

export default theme;
