# QuickPe Design System - Color Usage Guide

## Overview
The QuickPe color system is built around an emerald/teal primary palette with comprehensive semantic colors for different states and contexts.

## Primary Colors
The primary color palette uses emerald (#059669) as the main brand color with teal variations for accents.

```javascript
import { colors } from './design-system/tokens/colors';

// Primary colors
const primary500 = colors.primary[500]; // #14b8a6
const primary600 = colors.primary[600]; // #0d9488 (hover states)

// In CSS
.my-element {
  color: var(--color-primary-500);
  background: var(--color-primary-600);
}
```

## Usage Guidelines

### Text Colors
- **Primary**: `neutral[900]` - Main text content
- **Secondary**: `neutral[600]` - Supporting text
- **Tertiary**: `neutral[500]` - Less important information
- **Disabled**: `neutral[400]` - Inactive states

### Background Colors
- **Primary**: `background.primary` (#ffffff) - Main content areas
- **Secondary**: `background.secondary` (#fafafa) - Subtle sections
- **Tertiary**: `background.tertiary` (#f5f5f5) - Cards, inputs

### Semantic Colors
Use semantic colors for consistent state communication:

```javascript
// Success states
const successColor = colors.success[500]; // #22c55e

// Error states
const errorColor = colors.error[500]; // #ef4444

// Warning states
const warningColor = colors.warning[500]; // #f59e0b

// Info states
const infoColor = colors.info[500]; // #3b82f6
```

## Accessibility
All color combinations meet WCAG AA standards:

```javascript
import { colorUtils } from './design-system/utilities';

// Check contrast ratio
const ratio = colorUtils.getContrastRatio('#ffffff', '#059669'); // > 4.5 (AA compliant)

// Check if meets WCAG standards
const meetsAA = colorUtils.meetsWCAG('#ffffff', '#059669', 'AA'); // true
```

## Color Variations

### Light Variations
```javascript
colors.primary[50]  // #f0fdfa - Very light
colors.primary[100] // #ccfbf1 - Light
colors.primary[200] // #99f6e4 - Lighter
```

### Dark Variations
```javascript
colors.primary[600] // #0d9488 - Hover states
colors.primary[700] // #0f766e - Active states
colors.primary[800] // #115e59 - Dark backgrounds
colors.primary[900] // #134e4a - Very dark
```

## Brand Colors

### QuickPe Gradient
```css
.quickpe-gradient {
  background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
}
```

### Logo Colors
- **Primary**: `#059669` (Emerald)
- **Secondary**: `#0d9488` (Teal)

## Implementation Examples

### React Component
```jsx
import { colors } from './design-system/tokens/colors';

function StatusBadge({ status }) {
  const statusColors = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
  };

  const colorSet = statusColors[status] || colors.neutral;

  return (
    <span style={{
      background: colorSet[100],
      color: colorSet[800],
      border: `1px solid ${colorSet[200]}`,
      padding: '0.25rem 0.5rem',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
    }}>
      {status}
    </span>
  );
}
```

### CSS Implementation
```css
/* Import design system variables */
@import './design-system/global.css';

/* Use in components */
.primary-button {
  background: var(--color-primary-500);
  color: var(--color-text-inverse);
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-fast);
}

.primary-button:hover {
  background: var(--color-primary-600);
}

.success-text {
  color: var(--color-success-600);
}

.error-border {
  border: 1px solid var(--color-error-500);
}
```

## Color Palette Reference

### Primary Scale
| Shade | Hex | Usage |
|-------|-----|-------|
| 50 | #f0fdfa | Very light backgrounds |
| 500 | #14b8a6 | Primary buttons, links |
| 600 | #0d9488 | Hover states |
| 900 | #134e4a | Dark text on light backgrounds |

### Neutral Scale
| Shade | Hex | Usage |
|-------|-----|-------|
| 50 | #fafafa | Page backgrounds |
| 100 | #f5f5f5 | Subtle backgrounds |
| 500 | #737373 | Body text |
| 900 | #171717 | Headings |

### Semantic Colors
| Color | Light | Main | Dark | Usage |
|-------|-------|------|------|-------|
| Success | #f0fdf4 | #22c55e | #166534 | Positive actions, confirmations |
| Error | #fef2f2 | #ef4444 | #991b1b | Errors, destructive actions |
| Warning | #fffbeb | #f59e0b | #92400e | Warnings, cautions |
| Info | #eff6ff | #3b82f6 | #1e40af | Information, help |

## Best Practices

1. **Use semantic colors** for states rather than hard-coded colors
2. **Test contrast ratios** for accessibility compliance
3. **Use CSS custom properties** for theming support
4. **Maintain hierarchy** with appropriate color weights
5. **Consider dark mode** when adding new colors

## Dark Mode Support

The design system includes dark mode variations:

```javascript
const darkModeColors = {
  background: {
    primary: '#0a0a0a',
    secondary: '#171717',
  },
  text: {
    primary: '#fafafa',
    secondary: '#a3a3a3',
  },
};
```

## Migration Guide

### From Hard-coded Colors
```javascript
// Before
const styles = {
  color: '#059669',
  background: '#ffffff',
};

// After
import { colors } from './design-system/tokens/colors';
const styles = {
  color: colors.primary[500],
  background: colors.background.primary,
};
```

### From CSS Classes
```css
/* Before */
.custom-button {
  background: #059669;
  color: white;
}

/* After */
.custom-button {
  background: var(--color-primary-500);
  color: var(--color-text-inverse);
}
```
