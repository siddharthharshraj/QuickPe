/**
 * QuickPe Design System
 *
 * A comprehensive design system for the QuickPe digital wallet application.
 * This system provides a unified approach to styling, components, and user experience.
 *
 * @version 1.0.0
 * @author QuickPe Design Team
 */

// Core Design Tokens
export * from './tokens/colors.js';
export * from './tokens/typography.js';
export * from './tokens/spacing.js';
export * from './tokens/layout.js';
export * from './tokens/components.js';
export * from './tokens/animations.js';
export * from './tokens/responsive.js';

// Component Library
export * from './components/index.js';

// Utility Functions
export * from './utilities/index.js';

// Theme Configuration
export * from './theme.js';

// Global Styles
export * from './global.js';

// Re-export commonly used items
export { default as theme } from './theme.js';
export { default as globalStyles } from './global.js';
